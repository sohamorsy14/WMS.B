import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get all users (Admin and Manager only)
router.get('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@cabinet-wms.com',
          role: 'admin',
          permissions: ['*'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@cabinet-wms.com',
          role: 'manager',
          permissions: ['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*'],
          createdAt: new Date().toISOString()
        }
      ];
      return res.json(mockUsers);
    }

    const users = await db.all('SELECT id, username, email, role, permissions, created_at FROM users ORDER BY created_at DESC');
    
    // Transform permissions from JSON string to array
    const transformedUsers = users.map(user => ({
      ...user,
      permissions: JSON.parse(user.permissions || '[]'),
      createdAt: user.created_at
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Users can view their own profile
    if (req.user.id === id) {
      return res.json(req.user);
    }

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await db.get('SELECT id, username, email, role, permissions, created_at FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transformedUser = {
      ...user,
      permissions: JSON.parse(user.permissions || '[]'),
      createdAt: user.created_at
    };

    res.json(transformedUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockUser = {
        id: db.generateUUID(),
        username,
        email,
        role,
        permissions: permissions || [],
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(mockUser);
    }

    // Check if username or email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = db.generateUUID();

    // Insert new user with password_changed flag set to true (since it's not a default password)
    await db.run(
      'INSERT INTO users (id, username, email, password, role, permissions, password_changed) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, username, email, hashedPassword, role, JSON.stringify(permissions || []), 1]
    );

    // Return user without password
    const newUser = {
      id,
      username,
      email,
      role,
      permissions: permissions || [],
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only, or users can update their own profile)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, permissions } = req.body;

    // Check if user can update this profile
    const canUpdate = req.user.role === 'admin' || req.user.id === id;
    if (!canUpdate) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Non-admin users cannot change role or permissions
    if (req.user.role !== 'admin' && (role || permissions)) {
      return res.status(403).json({ error: 'Cannot modify role or permissions' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockUser = {
        id,
        username: username || req.user.username,
        email: email || req.user.email,
        role: role || req.user.role,
        permissions: permissions || req.user.permissions,
        createdAt: new Date().toISOString()
      };
      return res.json(mockUser);
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('password = ?');
      updates.push('password_changed = ?');
      values.push(bcrypt.hashSync(password, 10));
      values.push(1); // Mark password as changed
    }
    if (role && req.user.role === 'admin') {
      updates.push('role = ?');
      values.push(role);
    }
    if (permissions && req.user.role === 'admin') {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get updated user
    const updatedUser = await db.get('SELECT id, username, email, role, permissions, created_at FROM users WHERE id = ?', [id]);
    
    const transformedUser = {
      ...updatedUser,
      permissions: JSON.parse(updatedUser.permissions || '[]'),
      createdAt: updatedUser.created_at
    };

    res.json(transformedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    if (!db.isConnected()) {
      return res.json({ message: 'User deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change password - Enhanced with password_changed tracking
router.post('/:id/change-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log('=== PASSWORD CHANGE REQUEST ===');
    console.log('Target user ID:', id);
    console.log('Request user ID:', req.user.id);
    console.log('Request user role:', req.user.role);
    console.log('New password provided:', !!newPassword);
    console.log('Current password provided:', !!currentPassword);

    // Check permissions
    const canChange = req.user.role === 'admin' || req.user.id === id;
    if (!canChange) {
      console.log('❌ Permission denied');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!newPassword) {
      console.log('❌ No new password provided');
      return res.status(400).json({ error: 'New password is required' });
    }

    if (!db.isConnected()) {
      console.log('⚠️ Database not connected - returning mock success');
      return res.json({ message: 'Password changed successfully (demo mode)' });
    }

    // Get the target user from database
    const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      console.log('❌ Target user not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Target user found:', targetUser.username);

    // Verify current password if required
    const isAdminChangingOtherUser = req.user.role === 'admin' && req.user.id !== id;
    
    if (!isAdminChangingOtherUser) {
      // Regular user changing own password OR admin changing own password
      if (!currentPassword) {
        console.log('❌ Current password required but not provided');
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, targetUser.password);
      if (!isCurrentPasswordValid) {
        console.log('❌ Current password is incorrect');
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      console.log('✅ Current password verified');
    } else {
      console.log('✅ Admin changing another user\'s password - skipping current password check');
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = bcrypt.hashSync(newPassword, saltRounds);
    
    console.log('✅ New password hashed');
    console.log('Hash length:', hashedNewPassword.length);
    console.log('Hash preview:', hashedNewPassword.substring(0, 20) + '...');

    // Update password in database and mark as changed
    console.log('🔄 Updating password in database...');
    
    const updateResult = await db.run(
      'UPDATE users SET password = ?, password_changed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, 1, id]
    );

    console.log('Update result:', updateResult);

    if (updateResult.changes === 0) {
      console.log('❌ No rows were updated');
      return res.status(500).json({ error: 'Failed to update password - no rows affected' });
    }

    // Verify the password was actually updated
    const verifyUser = await db.get('SELECT password FROM users WHERE id = ?', [id]);
    if (!verifyUser) {
      console.log('❌ Could not verify password update - user not found');
      return res.status(500).json({ error: 'Failed to verify password update' });
    }

    const passwordMatches = verifyUser.password === hashedNewPassword;
    console.log('Password verification:', passwordMatches ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Stored hash preview:', verifyUser.password.substring(0, 20) + '...');

    if (!passwordMatches) {
      console.log('❌ Password was not properly saved');
      return res.status(500).json({ error: 'Password update failed - verification failed' });
    }

    // Test the new password works
    const testLogin = bcrypt.compareSync(newPassword, verifyUser.password);
    console.log('New password test:', testLogin ? '✅ WORKS' : '❌ BROKEN');

    if (!testLogin) {
      console.log('❌ New password does not work');
      return res.status(500).json({ error: 'Password update failed - new password test failed' });
    }

    console.log('🎉 Password change completed successfully');
    res.json({ 
      message: 'Password changed successfully',
      debug: {
        userUpdated: targetUser.username,
        updatedBy: req.user.username,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ error: 'Failed to change password: ' + error.message });
  }
});

export default router;