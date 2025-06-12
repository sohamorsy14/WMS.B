import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Get user from database to ensure they still exist and get current permissions
      let user;
      if (db.isConnected()) {
        user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
      } else {
        // Mock user data when database is not available
        const mockUsers = [
          {
            id: '1',
            username: 'admin',
            email: 'admin@cabinet-wms.com',
            role: 'admin',
            permissions: JSON.stringify(['*'])
          },
          {
            id: '2',
            username: 'manager',
            email: 'manager@cabinet-wms.com',
            role: 'manager',
            permissions: JSON.stringify(['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*'])
          }
        ];
        user = mockUsers.find(u => u.id === decoded.userId);
      }

      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  });
};

// Permission checking middleware
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin' || req.user.permissions.includes('*')) {
      return next();
    }

    // Check specific permission
    if (req.user.permissions.includes(permission)) {
      return next();
    }

    // Check wildcard permissions (e.g., 'inventory.*' covers 'inventory.view', 'inventory.create', etc.)
    const hasWildcardPermission = req.user.permissions.some(perm => {
      if (perm.endsWith('.*')) {
        const basePermission = perm.slice(0, -2);
        return permission.startsWith(basePermission);
      }
      return false;
    });

    if (hasWildcardPermission) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};

// Role checking middleware
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient role permissions' });
  };
};