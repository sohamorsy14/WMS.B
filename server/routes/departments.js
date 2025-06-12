import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all department routes
router.use(authenticateToken);

// Get all departments
router.get('/', requirePermission('requisitions.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockDepartments = [
        {
          id: '1',
          code: 'PROD',
          name: 'Production',
          description: 'Manufacturing and production operations',
          manager: 'John Smith',
          costCenter: 'CC-001',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          code: 'ASSY',
          name: 'Assembly',
          description: 'Cabinet assembly and finishing',
          manager: 'Sarah Johnson',
          costCenter: 'CC-002',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          code: 'QC',
          name: 'Quality Control',
          description: 'Quality assurance and testing',
          manager: 'Mike Wilson',
          costCenter: 'CC-003',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          code: 'MAINT',
          name: 'Maintenance',
          description: 'Equipment maintenance and repair',
          manager: 'Tom Brown',
          costCenter: 'CC-004',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          code: 'WARE',
          name: 'Warehouse',
          description: 'Inventory and logistics',
          manager: 'Lisa Davis',
          costCenter: 'CC-005',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      return res.json(mockDepartments);
    }

    const departments = await db.all('SELECT * FROM departments ORDER BY name');
    
    // Transform database results to match frontend expectations
    const transformedDepartments = departments.map(dept => ({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      manager: dept.manager || '',
      costCenter: dept.cost_center || '',
      isActive: Boolean(dept.is_active), // Ensure boolean conversion
      createdAt: dept.created_at
    }));
    
    res.json(transformedDepartments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get single department
router.get('/:id', requirePermission('requisitions.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const department = await db.get('SELECT * FROM departments WHERE id = ?', [id]);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Transform database result to match frontend expectations
    const transformedDepartment = {
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description || '',
      manager: department.manager || '',
      costCenter: department.cost_center || '',
      isActive: Boolean(department.is_active), // Ensure boolean conversion
      createdAt: department.created_at
    };

    res.json(transformedDepartment);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { code, name, description, manager, costCenter, isActive } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockDepartment = {
        id: Date.now().toString(),
        code,
        name,
        description: description || '',
        manager: manager || '',
        costCenter: costCenter || '',
        isActive: isActive !== false, // Default to true if not specified
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(mockDepartment);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO departments (id, code, name, description, manager, cost_center, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, code, name, description || '', manager || '', costCenter || '', isActive !== false ? 1 : 0]
    );
    
    const newDepartment = await db.get('SELECT * FROM departments WHERE id = ?', [id]);
    
    // Transform database result to match frontend expectations
    const transformedDepartment = {
      id: newDepartment.id,
      code: newDepartment.code,
      name: newDepartment.name,
      description: newDepartment.description || '',
      manager: newDepartment.manager || '',
      costCenter: newDepartment.cost_center || '',
      isActive: Boolean(newDepartment.is_active),
      createdAt: newDepartment.created_at
    };
    
    res.status(201).json(transformedDepartment);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, manager, costCenter, isActive } = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockDepartment = {
        id,
        code,
        name,
        description: description || '',
        manager: manager || '',
        costCenter: costCenter || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };
      return res.json(mockDepartment);
    }

    const result = await db.run(
      `UPDATE departments SET 
       code = ?, name = ?, description = ?, manager = ?, cost_center = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [code, name, description || '', manager || '', costCenter || '', isActive !== false ? 1 : 0, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const updatedDepartment = await db.get('SELECT * FROM departments WHERE id = ?', [id]);
    
    // Transform database result to match frontend expectations
    const transformedDepartment = {
      id: updatedDepartment.id,
      code: updatedDepartment.code,
      name: updatedDepartment.name,
      description: updatedDepartment.description || '',
      manager: updatedDepartment.manager || '',
      costCenter: updatedDepartment.cost_center || '',
      isActive: Boolean(updatedDepartment.is_active),
      createdAt: updatedDepartment.created_at
    };
    
    res.json(transformedDepartment);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', requirePermission('requisitions.create'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Department deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM departments WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;