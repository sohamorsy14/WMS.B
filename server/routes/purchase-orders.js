import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all purchase order routes
router.use(authenticateToken);

// Get all purchase orders
router.get('/', requirePermission('purchase_orders.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockPurchaseOrders = [
        {
          id: '1',
          poNumber: 'PO-2024-0001',
          supplier: 'Wood Supply Co.',
          status: 'approved',
          items: JSON.stringify([
            {
              id: '1',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 50,
              unitCost: 52.75,
              totalCost: 2637.50
            },
            {
              id: '2',
              itemId: 'MDF-18-4X8',
              itemName: 'MDF 18mm 4x8ft',
              quantity: 30,
              unitCost: 38.90,
              totalCost: 1167.00
            }
          ]),
          subtotal: 3804.50,
          tax: 380.45,
          total: 4184.95,
          orderDate: new Date().toISOString(),
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Urgent delivery required for production schedule',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          poNumber: 'PO-2024-0002',
          supplier: 'Hardware Plus',
          status: 'pending',
          items: JSON.stringify([
            {
              id: '3',
              itemId: 'HNG-CONC-35',
              itemName: 'Concealed Hinges 35mm',
              quantity: 200,
              unitCost: 3.25,
              totalCost: 650.00
            },
            {
              id: '4',
              itemId: 'SLD-18-FULL',
              itemName: 'Full Extension Slides 18"',
              quantity: 50,
              unitCost: 12.50,
              totalCost: 625.00
            }
          ]),
          subtotal: 1275.00,
          tax: 127.50,
          total: 1402.50,
          orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          expectedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Standard delivery terms',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Transform mock data to match frontend expectations
      const transformedPOs = mockPurchaseOrders.map(po => ({
        ...po,
        items: JSON.parse(po.items)
      }));
      
      return res.json(transformedPOs);
    }

    const purchaseOrders = await db.all('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    
    // Transform database results to match frontend expectations
    const transformedPOs = purchaseOrders.map(po => ({
      id: po.id,
      poNumber: po.po_number,
      supplier: po.supplier,
      status: po.status,
      items: JSON.parse(po.items || '[]'),
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      orderDate: po.order_date,
      expectedDelivery: po.expected_delivery,
      notes: po.notes,
      createdAt: po.created_at,
      updatedAt: po.updated_at
    }));
    
    res.json(transformedPOs);
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get single purchase order
router.get('/:id', requirePermission('purchase_orders.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const po = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Transform database result to match frontend expectations
    const transformedPO = {
      id: po.id,
      poNumber: po.po_number,
      supplier: po.supplier,
      status: po.status,
      items: JSON.parse(po.items || '[]'),
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      orderDate: po.order_date,
      expectedDelivery: po.expected_delivery,
      notes: po.notes,
      createdAt: po.created_at,
      updatedAt: po.updated_at
    };

    res.json(transformedPO);
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Create new purchase order
router.post('/', requirePermission('purchase_orders.create'), async (req, res) => {
  try {
    const poData = req.body;

    if (!poData.supplier || !poData.items || poData.items.length === 0) {
      return res.status(400).json({ error: 'Supplier and items are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockPO = {
        id: Date.now().toString(),
        ...poData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return res.status(201).json(mockPO);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO purchase_orders (id, po_number, supplier, status, items, subtotal, tax, total, 
       order_date, expected_delivery, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, poData.poNumber, poData.supplier, poData.status || 'draft',
        JSON.stringify(poData.items), poData.subtotal, poData.tax, poData.total,
        poData.orderDate, poData.expectedDelivery || null, poData.notes || ''
      ]
    );
    
    const newPO = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    
    // Transform result
    const transformedPO = {
      id: newPO.id,
      poNumber: newPO.po_number,
      supplier: newPO.supplier,
      status: newPO.status,
      items: JSON.parse(newPO.items || '[]'),
      subtotal: newPO.subtotal,
      tax: newPO.tax,
      total: newPO.total,
      orderDate: newPO.order_date,
      expectedDelivery: newPO.expected_delivery,
      notes: newPO.notes,
      createdAt: newPO.created_at,
      updatedAt: newPO.updated_at
    };
    
    res.status(201).json(transformedPO);
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order
router.put('/:id', requirePermission('purchase_orders.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const poData = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockPO = {
        id,
        ...poData,
        updatedAt: new Date().toISOString()
      };
      return res.json(mockPO);
    }

    const result = await db.run(
      `UPDATE purchase_orders SET 
       po_number = ?, supplier = ?, status = ?, items = ?, subtotal = ?, tax = ?, total = ?,
       order_date = ?, expected_delivery = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        poData.poNumber, poData.supplier, poData.status, JSON.stringify(poData.items),
        poData.subtotal, poData.tax, poData.total, poData.orderDate,
        poData.expectedDelivery || null, poData.notes || '', id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const updatedPO = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    
    // Transform result
    const transformedPO = {
      id: updatedPO.id,
      poNumber: updatedPO.po_number,
      supplier: updatedPO.supplier,
      status: updatedPO.status,
      items: JSON.parse(updatedPO.items || '[]'),
      subtotal: updatedPO.subtotal,
      tax: updatedPO.tax,
      total: updatedPO.total,
      orderDate: updatedPO.order_date,
      expectedDelivery: updatedPO.expected_delivery,
      notes: updatedPO.notes,
      createdAt: updatedPO.created_at,
      updatedAt: updatedPO.updated_at
    };
    
    res.json(transformedPO);
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// Delete purchase order
router.delete('/:id', requirePermission('purchase_orders.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Purchase order deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM purchase_orders WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// Approve purchase order
router.patch('/:id/approve', requirePermission('purchase_orders.approve'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockPO = {
        id,
        status: 'approved',
        updatedAt: new Date().toISOString()
      };
      return res.json(mockPO);
    }

    const result = await db.run(
      'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const updatedPO = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    
    // Transform result
    const transformedPO = {
      id: updatedPO.id,
      poNumber: updatedPO.po_number,
      supplier: updatedPO.supplier,
      status: updatedPO.status,
      items: JSON.parse(updatedPO.items || '[]'),
      subtotal: updatedPO.subtotal,
      tax: updatedPO.tax,
      total: updatedPO.total,
      orderDate: updatedPO.order_date,
      expectedDelivery: updatedPO.expected_delivery,
      notes: updatedPO.notes,
      createdAt: updatedPO.created_at,
      updatedAt: updatedPO.updated_at
    };
    
    res.json(transformedPO);
  } catch (error) {
    console.error('Approve purchase order error:', error);
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
});

export default router;