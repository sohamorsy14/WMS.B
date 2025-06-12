import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!db.isConnected()) {
      // Mock user data for development when database is not available
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@cabinet-wms.com',
          password: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          permissions: ['*']
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@cabinet-wms.com',
          password: bcrypt.hashSync('manager123', 10),
          role: 'manager',
          permissions: ['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*']
        }
      ];

      const user = mockUsers.find(u => u.username === username);
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({
        success: true,
        token,
        user: userWithoutPassword
      });
    }

    // Database query for real users
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.permissions = JSON.parse(user.permissions || '[]');
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate token
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!db.isConnected()) {
      // Mock user data when database is not available
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@cabinet-wms.com',
          role: 'admin',
          permissions: ['*']
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@cabinet-wms.com',
          role: 'manager',
          permissions: ['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*']
        }
      ];

      const user = mockUsers.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.json({ user });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.permissions = JSON.parse(user.permissions || '[]');
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;