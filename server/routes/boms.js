import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all BOM routes
router.use(authenticateToken);

// Get all BOMs
router.get('/', requirePermission('boms.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockBoms = [
        {
          id: '1',
          bomNumber: 'BOM-2024-001',
          name: 'Kitchen Base Cabinet - 24"',
          version: '1.0',
          linkedType: 'order',
          linkedId: '1',
          linkedNumber: 'ORD-2024-001',
          status: 'approved',
          description: 'Standard 24" base cabinet with single door',
          category: 'Base Cabinets',
          items: [
            {
              id: '1',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 2,
              unitCost: 52.75,
              totalCost: 105.50,
              unitMeasurement: 'Sheets',
              isOptional: false
            },
            {
              id: '2',
              itemId: 'HNG-CONC-35',
              itemName: 'Concealed Hinges 35mm',
              quantity: 2,
              unitCost: 3.25,
              totalCost: 6.50,
              unitMeasurement: 'Pieces',
              isOptional: false
            }
          ],
          totalCost: 112.00,
          estimatedTime: 4,
          createdBy: 'John Smith',
          approvedBy: 'Manager',
          approvalDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          bomNumber: 'BOM-2024-002',
          name: 'Kitchen Wall Cabinet - 30"',
          version: '1.0',
          linkedType: 'order',
          linkedId: '1',
          linkedNumber: 'ORD-2024-001',
          status: 'in_production',
          description: 'Standard 30" wall cabinet with double doors',
          category: 'Wall Cabinets',
          items: [
            {
              id: '3',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 1.5,
              unitCost: 52.75,
              totalCost: 79.13,
              unitMeasurement: 'Sheets',
              isOptional: false
            }
          ],
          totalCost: 79.13,
          estimatedTime: 3,
          createdBy: 'Sarah Johnson',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          bomNumber: 'BOM-2024-003',
          name: 'Single Door Base Cabinet - 400mm',
          version: '1.0',
          linkedType: 'cabinet',
          linkedId: 'config-1234567890',
          linkedNumber: 'config-1234567890',
          status: 'draft',
          description: 'BOM for Single Door Base Cabinet - 400x720x560',
          category: 'Cabinet',
          items: [
            {
              id: '4',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 1,
              unitCost: 52.75,
              totalCost: 52.75,
              unitMeasurement: 'Sheets',
              isOptional: false
            },
            {
              id: '5',
              itemId: 'HNG-CONC-35',
              itemName: 'Concealed Hinges 35mm',
              quantity: 2,
              unitCost: 3.25,
              totalCost: 6.50,
              unitMeasurement: 'Pieces',
              isOptional: false
            },
            {
              id: '6',
              itemId: 'HDL-BAR-128',
              itemName: 'Bar Handle 128mm Chrome',
              quantity: 1,
              unitCost: 5.85,
              totalCost: 5.85,
              unitMeasurement: 'Pieces',
              isOptional: false
            }
          ],
          totalCost: 65.10,
          estimatedTime: 2,
          createdBy: 'Cabinet Calculator',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return res.json(mockBoms);
    }

    const boms = await db.all('SELECT * FROM boms ORDER BY created_at DESC');
    res.json(boms);
  } catch (error) {
    console.error('Get BOMs error:', error);
    res.status(500).json({ error: 'Failed to fetch BOMs' });
  }
});

// Get single BOM
router.get('/:id', requirePermission('boms.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'BOM not found' });
    }

    const bom = await db.get('SELECT * FROM boms WHERE id = ?', [id]);
    
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }

    res.json(bom);
  } catch (error) {
    console.error('Get BOM error:', error);
    res.status(500).json({ error: 'Failed to fetch BOM' });
  }
});

// Get BOMs by linked ID
router.get('/linked/:linkedType/:linkedId', requirePermission('boms.view'), async (req, res) => {
  try {
    const { linkedType, linkedId } = req.params;

    if (!db.isConnected()) {
      // Return filtered mock data
      const mockBoms = [
        {
          id: '1',
          bomNumber: 'BOM-2024-001',
          name: 'Kitchen Base Cabinet - 24"',
          version: '1.0',
          linkedType: 'order',
          linkedId: '1',
          linkedNumber: 'ORD-2024-001',
          status: 'approved',
          totalCost: 112.00,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          bomNumber: 'BOM-2024-003',
          name: 'Single Door Base Cabinet - 400mm',
          version: '1.0',
          linkedType: 'cabinet',
          linkedId: 'config-1234567890',
          linkedNumber: 'config-1234567890',
          status: 'draft',
          totalCost: 65.10,
          createdAt: new Date().toISOString()
        }
      ];
      const filtered = mockBoms.filter(bom => bom.linkedType === linkedType && bom.linkedId === linkedId);
      return res.json(filtered);
    }

    const boms = await db.all('SELECT * FROM boms WHERE linked_type = ? AND linked_id = ?', [linkedType, linkedId]);
    res.json(boms);
  } catch (error) {
    console.error('Get linked BOMs error:', error);
    res.status(500).json({ error: 'Failed to fetch linked BOMs' });
  }
});

// Create new BOM
router.post('/', requirePermission('boms.create'), async (req, res) => {
  try {
    const bomData = req.body;

    if (!bomData.name || !bomData.linkedId) {
      return res.status(400).json({ error: 'BOM name and linked ID are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockBom = {
        id: Date.now().toString(),
        ...bomData,
        items: bomData.items || [],
        totalCost: bomData.totalCost || 0,
        estimatedTime: bomData.estimatedTime || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return res.status(201).json(mockBom);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO boms (id, bom_number, name, version, linked_type, linked_id, linked_number,
       status, description, category, items, total_cost, estimated_time, created_by, 
       approved_by, approval_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, bomData.bomNumber, bomData.name, bomData.version,
        bomData.linkedType, bomData.linkedId, bomData.linkedNumber,
        bomData.status || 'draft', bomData.description, bomData.category,
        JSON.stringify(bomData.items || []), bomData.totalCost || 0,
        bomData.estimatedTime || 0, bomData.createdBy,
        bomData.approvedBy || null, bomData.approvalDate || null,
        bomData.notes || ''
      ]
    );
    
    const newBom = await db.get('SELECT * FROM boms WHERE id = ?', [id]);
    res.status(201).json(newBom);
  } catch (error) {
    console.error('Create BOM error:', error);
    res.status(500).json({ error: 'Failed to create BOM' });
  }
});

// Update BOM
router.put('/:id', requirePermission('boms.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const bomData = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockBom = {
        id,
        ...bomData,
        updatedAt: new Date().toISOString()
      };
      return res.json(mockBom);
    }

    const result = await db.run(
      `UPDATE boms SET 
       bom_number = ?, name = ?, version = ?, linked_type = ?, linked_id = ?, 
       linked_number = ?, status = ?, description = ?, category = ?, items = ?, 
       total_cost = ?, estimated_time = ?, approved_by = ?, approval_date = ?, 
       notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        bomData.bomNumber, bomData.name, bomData.version,
        bomData.linkedType, bomData.linkedId, bomData.linkedNumber,
        bomData.status, bomData.description, bomData.category,
        JSON.stringify(bomData.items || []), bomData.totalCost || 0,
        bomData.estimatedTime || 0, bomData.approvedBy || null,
        bomData.approvalDate || null, bomData.notes || '', id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    
    const updatedBom = await db.get('SELECT * FROM boms WHERE id = ?', [id]);
    res.json(updatedBom);
  } catch (error) {
    console.error('Update BOM error:', error);
    res.status(500).json({ error: 'Failed to update BOM' });
  }
});

// Delete BOM
router.delete('/:id', requirePermission('boms.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'BOM deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM boms WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    
    res.json({ message: 'BOM deleted successfully' });
  } catch (error) {
    console.error('Delete BOM error:', error);
    res.status(500).json({ error: 'Failed to delete BOM' });
  }
});

export default router;