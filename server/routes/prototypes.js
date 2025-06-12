import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all prototype routes
router.use(authenticateToken);

// Get all prototypes
router.get('/', requirePermission('prototypes.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockPrototypes = [
        {
          id: '1',
          prototypeNumber: 'PROTO-2024-001',
          name: 'Modular Kitchen Island',
          description: 'Innovative modular kitchen island with adjustable components',
          status: 'testing',
          category: 'Kitchen Islands',
          designer: 'Design Team',
          createdDate: new Date().toISOString(),
          bomCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          prototypeNumber: 'PROTO-2024-002',
          name: 'Smart Storage Cabinet',
          description: 'Cabinet with integrated smart storage solutions',
          status: 'approved',
          category: 'Storage Solutions',
          designer: 'Innovation Lab',
          createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvalDate: new Date().toISOString(),
          bomCount: 2,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return res.json(mockPrototypes);
    }

    const prototypes = await db.all('SELECT * FROM prototypes ORDER BY created_at DESC');
    res.json(prototypes);
  } catch (error) {
    console.error('Get prototypes error:', error);
    res.status(500).json({ error: 'Failed to fetch prototypes' });
  }
});

// Get single prototype
router.get('/:id', requirePermission('prototypes.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const prototype = await db.get('SELECT * FROM prototypes WHERE id = ?', [id]);
    
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    res.json(prototype);
  } catch (error) {
    console.error('Get prototype error:', error);
    res.status(500).json({ error: 'Failed to fetch prototype' });
  }
});

// Create new prototype
router.post('/', requirePermission('prototypes.create'), async (req, res) => {
  try {
    const prototypeData = req.body;

    if (!prototypeData.name || !prototypeData.category) {
      return res.status(400).json({ error: 'Prototype name and category are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockPrototype = {
        id: Date.now().toString(),
        ...prototypeData,
        bomCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return res.status(201).json(mockPrototype);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO prototypes (id, prototype_number, name, description, status, category, 
       designer, created_date, approval_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, prototypeData.prototypeNumber, prototypeData.name, prototypeData.description,
        prototypeData.status || 'concept', prototypeData.category, prototypeData.designer,
        prototypeData.createdDate, prototypeData.approvalDate || null, prototypeData.notes || ''
      ]
    );
    
    const newPrototype = await db.get('SELECT * FROM prototypes WHERE id = ?', [id]);
    res.status(201).json(newPrototype);
  } catch (error) {
    console.error('Create prototype error:', error);
    res.status(500).json({ error: 'Failed to create prototype' });
  }
});

// Update prototype
router.put('/:id', requirePermission('prototypes.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const prototypeData = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockPrototype = {
        id,
        ...prototypeData,
        updatedAt: new Date().toISOString()
      };
      return res.json(mockPrototype);
    }

    const result = await db.run(
      `UPDATE prototypes SET 
       prototype_number = ?, name = ?, description = ?, status = ?, category = ?, 
       designer = ?, created_date = ?, approval_date = ?, notes = ?, 
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        prototypeData.prototypeNumber, prototypeData.name, prototypeData.description,
        prototypeData.status, prototypeData.category, prototypeData.designer,
        prototypeData.createdDate, prototypeData.approvalDate || null,
        prototypeData.notes || '', id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Prototype not found' });
    }
    
    const updatedPrototype = await db.get('SELECT * FROM prototypes WHERE id = ?', [id]);
    res.json(updatedPrototype);
  } catch (error) {
    console.error('Update prototype error:', error);
    res.status(500).json({ error: 'Failed to update prototype' });
  }
});

// Delete prototype
router.delete('/:id', requirePermission('prototypes.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Prototype deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM prototypes WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Prototype not found' });
    }
    
    res.json({ message: 'Prototype deleted successfully' });
  } catch (error) {
    console.error('Delete prototype error:', error);
    res.status(500).json({ error: 'Failed to delete prototype' });
  }
});

export default router;