import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateToken);

// Get all orders
router.get('/', requirePermission('orders.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          customerName: 'ABC Kitchen Renovations',
          customerContact: 'John Doe - (555) 123-4567',
          orderType: 'production',
          status: 'in_progress',
          priority: 'high',
          orderDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Complete kitchen cabinet set - Modern style',
          estimatedCost: 15000,
          actualCost: 0,
          assignedTo: 'John Smith',
          department: 'Production',
          bomCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          customerName: 'XYZ Home Builders',
          customerContact: 'Jane Smith - (555) 987-6543',
          orderType: 'custom',
          status: 'confirmed',
          priority: 'medium',
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Custom bathroom vanity with matching mirror cabinet',
          estimatedCost: 8500,
          actualCost: 0,
          assignedTo: 'Sarah Johnson',
          department: 'Assembly',
          bomCount: 2,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return res.json(mockOrders);
    }

    const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', requirePermission('orders.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', requirePermission('orders.create'), async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.customerName || !orderData.dueDate) {
      return res.status(400).json({ error: 'Customer name and due date are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockOrder = {
        id: Date.now().toString(),
        ...orderData,
        bomCount: 0,
        actualCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return res.status(201).json(mockOrder);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO orders (id, order_number, customer_name, customer_contact, order_type, status, priority, 
       order_date, due_date, description, notes, estimated_cost, actual_cost, assigned_to, department) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, orderData.orderNumber, orderData.customerName, orderData.customerContact,
        orderData.orderType, orderData.status || 'draft', orderData.priority,
        orderData.orderDate, orderData.dueDate, orderData.description,
        orderData.notes || '', orderData.estimatedCost || 0, orderData.actualCost || 0,
        orderData.assignedTo || '', orderData.department || ''
      ]
    );
    
    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', requirePermission('orders.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockOrder = {
        id,
        ...orderData,
        updatedAt: new Date().toISOString()
      };
      return res.json(mockOrder);
    }

    const result = await db.run(
      `UPDATE orders SET 
       order_number = ?, customer_name = ?, customer_contact = ?, order_type = ?, 
       status = ?, priority = ?, order_date = ?, due_date = ?, description = ?, 
       notes = ?, estimated_cost = ?, actual_cost = ?, assigned_to = ?, department = ?,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        orderData.orderNumber, orderData.customerName, orderData.customerContact,
        orderData.orderType, orderData.status, orderData.priority,
        orderData.orderDate, orderData.dueDate, orderData.description,
        orderData.notes || '', orderData.estimatedCost || 0, orderData.actualCost || 0,
        orderData.assignedTo || '', orderData.department || '', id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', requirePermission('orders.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Order deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM orders WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;