import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all requester routes
router.use(authenticateToken);

// Get all requesters
router.get('/', requirePermission('requisitions.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockRequesters = [
        {
          id: '1',
          employeeId: 'EMP-001',
          name: 'John Smith',
          email: 'john.smith@company.com',
          department: 'Production',
          position: 'Production Manager',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          employeeId: 'EMP-002',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          department: 'Assembly',
          position: 'Assembly Supervisor',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          employeeId: 'EMP-003',
          name: 'Mike Wilson',
          email: 'mike.wilson@company.com',
          department: 'Quality Control',
          position: 'QC Inspector',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          employeeId: 'EMP-004',
          name: 'Tom Brown',
          email: 'tom.brown@company.com',
          department: 'Maintenance',
          position: 'Maintenance Technician',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          employeeId: 'EMP-005',
          name: 'Lisa Davis',
          email: 'lisa.davis@company.com',
          department: 'Warehouse',
          position: 'Warehouse Coordinator',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      return res.json(mockRequesters);
    }

    const requesters = await db.all('SELECT * FROM requesters ORDER BY name');
    res.json(requesters);
  } catch (error) {
    console.error('Get requesters error:', error);
    res.status(500).json({ error: 'Failed to fetch requesters' });
  }
});

// Get single requester
router.get('/:id', requirePermission('requisitions.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    const requester = await db.get('SELECT * FROM requesters WHERE id = ?', [id]);
    
    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    res.json(requester);
  } catch (error) {
    console.error('Get requester error:', error);
    res.status(500).json({ error: 'Failed to fetch requester' });
  }
});

// Create new requester
router.post('/', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { employeeId, name, email, department, position, isActive } = req.body;

    if (!employeeId || !name || !email) {
      return res.status(400).json({ error: 'Employee ID, name, and email are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockRequester = {
        id: Date.now().toString(),
        employeeId,
        name,
        email,
        department: department || '',
        position: position || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(mockRequester);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO requesters (id, employee_id, name, email, department, position, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, employeeId, name, email, department || '', position || '', isActive !== false]
    );
    
    const newRequester = await db.get('SELECT * FROM requesters WHERE id = ?', [id]);
    res.status(201).json(newRequester);
  } catch (error) {
    console.error('Create requester error:', error);
    res.status(500).json({ error: 'Failed to create requester' });
  }
});

// Update requester
router.put('/:id', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, name, email, department, position, isActive } = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockRequester = {
        id,
        employeeId,
        name,
        email,
        department: department || '',
        position: position || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };
      return res.json(mockRequester);
    }

    const result = await db.run(
      `UPDATE requesters SET 
       employee_id = ?, name = ?, email = ?, department = ?, position = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [employeeId, name, email, department || '', position || '', isActive !== false, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Requester not found' });
    }
    
    const updatedRequester = await db.get('SELECT * FROM requesters WHERE id = ?', [id]);
    res.json(updatedRequester);
  } catch (error) {
    console.error('Update requester error:', error);
    res.status(500).json({ error: 'Failed to update requester' });
  }
});

// Delete requester
router.delete('/:id', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Requester deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM requesters WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Requester not found' });
    }
    
    res.json({ message: 'Requester deleted successfully' });
  } catch (error) {
    console.error('Delete requester error:', error);
    res.status(500).json({ error: 'Failed to delete requester' });
  }
});

export default router;