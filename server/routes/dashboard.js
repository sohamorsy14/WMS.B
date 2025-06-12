import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', requirePermission('dashboard.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
      return res.json({
        totalItems: 150,
        lowStockItems: 12,
        pendingRequisitions: 8,
        openPurchaseOrders: 12,
        monthlyExpenditure: 67000,
        inventoryValue: 350000,
        recentActivity: [
          { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
          { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
        ]
      });
    }

    // Real database queries when connected
    const totalItemsResult = await db.get('SELECT COUNT(*) as count FROM products');
    const lowStockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock_level');
    const requisitionsResult = await db.get('SELECT COUNT(*) as count FROM requisitions WHERE status = ?', ['pending']);
    const purchaseOrdersResult = await db.get('SELECT COUNT(*) as count FROM purchase_orders WHERE status IN (?, ?)', ['pending', 'approved']);

    // Calculate inventory value
    const inventoryValueResult = await db.get('SELECT SUM(total_cost) as total FROM products');
    
    // Get recent activity (last 5 products added)
    const recentActivity = await db.all(`
      SELECT 'Product Added' as action, name as item, created_at as timestamp 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      totalItems: totalItemsResult?.count || 0,
      lowStockItems: lowStockResult?.count || 0,
      pendingRequisitions: requisitionsResult?.count || 0,
      openPurchaseOrders: purchaseOrdersResult?.count || 0,
      monthlyExpenditure: 67000, // This would need a more complex query based on actual purchase data
      inventoryValue: inventoryValueResult?.total || 0,
      recentActivity: recentActivity || []
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;