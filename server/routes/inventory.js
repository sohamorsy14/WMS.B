import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all inventory routes
router.use(authenticateToken);

// Get all products
router.get('/products', requirePermission('inventory.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return comprehensive mock data when database is not available
      const mockProducts = [
        // Panels & Boards
        {
          id: '1',
          itemId: 'PLY-18-4X8',
          name: 'Plywood 18mm 4x8ft',
          category: 'Panels',
          subCategory: 'Cabinet Body',
          quantity: 45,
          unitCost: 52.75,
          totalCost: 2373.75,
          location: 'A-1-01',
          supplier: 'Wood Supply Co.',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '2',
          itemId: 'MDF-18-4X8',
          name: 'MDF 18mm 4x8ft',
          category: 'Panels',
          subCategory: 'Cabinet Body',
          quantity: 32,
          unitCost: 38.90,
          totalCost: 1244.80,
          location: 'A-1-02',
          supplier: 'Wood Supply Co.',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 8,
          maxStockLevel: 80,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '3',
          itemId: 'PLY-12-4X8',
          name: 'Plywood 12mm 4x8ft',
          category: 'Panels',
          subCategory: 'Cabinet Back',
          quantity: 28,
          unitCost: 35.25,
          totalCost: 987.00,
          location: 'A-1-03',
          supplier: 'Wood Supply Co.',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 5,
          maxStockLevel: 60,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '4',
          itemId: 'MEL-WHT-4X8',
          name: 'White Melamine 4x8ft',
          category: 'Panels',
          subCategory: 'Finished Panels',
          quantity: 22,
          unitCost: 68.50,
          totalCost: 1507.00,
          location: 'A-2-01',
          supplier: 'Laminate Plus',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 5,
          maxStockLevel: 50,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '5',
          itemId: 'MEL-OAK-4X8',
          name: 'Oak Melamine 4x8ft',
          category: 'Panels',
          subCategory: 'Finished Panels',
          quantity: 18,
          unitCost: 72.25,
          totalCost: 1300.50,
          location: 'A-2-02',
          supplier: 'Laminate Plus',
          unitMeasurement: 'Sheets (sht)',
          minStockLevel: 5,
          maxStockLevel: 40,
          lastUpdated: new Date().toISOString(),
        },

        // Hardware - Hinges
        {
          id: '6',
          itemId: 'HNG-CONC-35',
          name: 'Concealed Hinges 35mm',
          category: 'Hardware',
          subCategory: 'Door Hardware',
          quantity: 485,
          unitCost: 3.25,
          totalCost: 1576.25,
          location: 'B-1-01',
          supplier: 'Hardware Plus',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 100,
          maxStockLevel: 1000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '7',
          itemId: 'HNG-SOFT-35',
          name: 'Soft Close Hinges 35mm',
          category: 'Hardware',
          subCategory: 'Door Hardware',
          quantity: 320,
          unitCost: 4.75,
          totalCost: 1520.00,
          location: 'B-1-02',
          supplier: 'Hardware Plus',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 80,
          maxStockLevel: 800,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '8',
          itemId: 'HNG-OVERLAY',
          name: 'Overlay Hinges',
          category: 'Hardware',
          subCategory: 'Door Hardware',
          quantity: 156,
          unitCost: 2.95,
          totalCost: 460.20,
          location: 'B-1-03',
          supplier: 'Hardware Plus',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 50,
          maxStockLevel: 500,
          lastUpdated: new Date().toISOString(),
        },

        // Hardware - Drawer Slides
        {
          id: '9',
          itemId: 'SLD-18-FULL',
          name: 'Full Extension Slides 18"',
          category: 'Hardware',
          subCategory: 'Drawer Hardware',
          quantity: 124,
          unitCost: 12.50,
          totalCost: 1550.00,
          location: 'B-2-01',
          supplier: 'Slide Systems Inc.',
          unitMeasurement: 'Pairs (pr)',
          minStockLevel: 30,
          maxStockLevel: 300,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '10',
          itemId: 'SLD-22-FULL',
          name: 'Full Extension Slides 22"',
          category: 'Hardware',
          subCategory: 'Drawer Hardware',
          quantity: 98,
          unitCost: 14.25,
          totalCost: 1396.50,
          location: 'B-2-02',
          supplier: 'Slide Systems Inc.',
          unitMeasurement: 'Pairs (pr)',
          minStockLevel: 25,
          maxStockLevel: 250,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '11',
          itemId: 'SLD-SOFT-18',
          name: 'Soft Close Slides 18"',
          category: 'Hardware',
          subCategory: 'Drawer Hardware',
          quantity: 76,
          unitCost: 18.75,
          totalCost: 1425.00,
          location: 'B-2-03',
          supplier: 'Slide Systems Inc.',
          unitMeasurement: 'Pairs (pr)',
          minStockLevel: 20,
          maxStockLevel: 200,
          lastUpdated: new Date().toISOString(),
        },

        // Hardware - Handles & Knobs
        {
          id: '12',
          itemId: 'HDL-BAR-128',
          name: 'Bar Handle 128mm Chrome',
          category: 'Hardware',
          subCategory: 'Handles & Knobs',
          quantity: 245,
          unitCost: 5.85,
          totalCost: 1433.25,
          location: 'B-3-01',
          supplier: 'Handle World',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 50,
          maxStockLevel: 500,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '13',
          itemId: 'HDL-BAR-160',
          name: 'Bar Handle 160mm Chrome',
          category: 'Hardware',
          subCategory: 'Handles & Knobs',
          quantity: 189,
          unitCost: 6.45,
          totalCost: 1219.05,
          location: 'B-3-02',
          supplier: 'Handle World',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 40,
          maxStockLevel: 400,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '14',
          itemId: 'KNB-ROUND-32',
          name: 'Round Knob 32mm Chrome',
          category: 'Hardware',
          subCategory: 'Handles & Knobs',
          quantity: 167,
          unitCost: 3.25,
          totalCost: 542.75,
          location: 'B-3-03',
          supplier: 'Handle World',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 30,
          maxStockLevel: 300,
          lastUpdated: new Date().toISOString(),
        },

        // Edge Banding
        {
          id: '15',
          itemId: 'EB-WHT-22MM',
          name: 'White Edge Band 22mm',
          category: 'Edge Banding',
          subCategory: 'PVC Edge Band',
          quantity: 12,
          unitCost: 45.50,
          totalCost: 546.00,
          location: 'C-1-01',
          supplier: 'Edge Solutions',
          unitMeasurement: 'Rolls (rl)',
          minStockLevel: 3,
          maxStockLevel: 30,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '16',
          itemId: 'EB-OAK-22MM',
          name: 'Oak Edge Band 22mm',
          category: 'Edge Banding',
          subCategory: 'PVC Edge Band',
          quantity: 8,
          unitCost: 52.75,
          totalCost: 422.00,
          location: 'C-1-02',
          supplier: 'Edge Solutions',
          unitMeasurement: 'Rolls (rl)',
          minStockLevel: 2,
          maxStockLevel: 20,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '17',
          itemId: 'EB-WHT-19MM',
          name: 'White Edge Band 19mm',
          category: 'Edge Banding',
          subCategory: 'PVC Edge Band',
          quantity: 15,
          unitCost: 42.25,
          totalCost: 633.75,
          location: 'C-1-03',
          supplier: 'Edge Solutions',
          unitMeasurement: 'Rolls (rl)',
          minStockLevel: 4,
          maxStockLevel: 40,
          lastUpdated: new Date().toISOString(),
        },

        // Fasteners & Screws
        {
          id: '18',
          itemId: 'SCR-CONF-32',
          name: 'Confirmat Screws 32mm',
          category: 'Fasteners',
          subCategory: 'Cabinet Screws',
          quantity: 2450,
          unitCost: 0.12,
          totalCost: 294.00,
          location: 'D-1-01',
          supplier: 'Fastener Supply',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 500,
          maxStockLevel: 5000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '19',
          itemId: 'SCR-CONF-50',
          name: 'Confirmat Screws 50mm',
          category: 'Fasteners',
          subCategory: 'Cabinet Screws',
          quantity: 1890,
          unitCost: 0.15,
          totalCost: 283.50,
          location: 'D-1-02',
          supplier: 'Fastener Supply',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 400,
          maxStockLevel: 4000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '20',
          itemId: 'SCR-WOOD-25',
          name: 'Wood Screws 25mm',
          category: 'Fasteners',
          subCategory: 'Wood Screws',
          quantity: 3250,
          unitCost: 0.08,
          totalCost: 260.00,
          location: 'D-1-03',
          supplier: 'Fastener Supply',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 800,
          maxStockLevel: 8000,
          lastUpdated: new Date().toISOString(),
        },

        // Adhesives & Finishes
        {
          id: '21',
          itemId: 'ADH-PVA-5L',
          name: 'PVA Wood Glue 5L',
          category: 'Adhesives',
          subCategory: 'Wood Glue',
          quantity: 24,
          unitCost: 28.50,
          totalCost: 684.00,
          location: 'E-1-01',
          supplier: 'Chemical Solutions',
          unitMeasurement: 'Bottles (btl)',
          minStockLevel: 5,
          maxStockLevel: 50,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '22',
          itemId: 'ADH-CONTACT',
          name: 'Contact Cement 1L',
          category: 'Adhesives',
          subCategory: 'Contact Cement',
          quantity: 18,
          unitCost: 35.75,
          totalCost: 643.50,
          location: 'E-1-02',
          supplier: 'Chemical Solutions',
          unitMeasurement: 'Bottles (btl)',
          minStockLevel: 4,
          maxStockLevel: 40,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '23',
          itemId: 'FIN-LACQUER',
          name: 'Clear Lacquer 4L',
          category: 'Finishes',
          subCategory: 'Lacquer',
          quantity: 12,
          unitCost: 68.25,
          totalCost: 819.00,
          location: 'E-2-01',
          supplier: 'Finish Pro',
          unitMeasurement: 'Cans (can)',
          minStockLevel: 3,
          maxStockLevel: 30,
          lastUpdated: new Date().toISOString(),
        },

        // Cabinet Accessories
        {
          id: '24',
          itemId: 'SHF-ADJ-5MM',
          name: 'Adjustable Shelf Pins 5mm',
          category: 'Accessories',
          subCategory: 'Shelf Hardware',
          quantity: 1250,
          unitCost: 0.25,
          totalCost: 312.50,
          location: 'F-1-01',
          supplier: 'Cabinet Accessories',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 200,
          maxStockLevel: 2000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '25',
          itemId: 'CAM-LOCK-15',
          name: 'Cam Lock 15mm',
          category: 'Accessories',
          subCategory: 'Assembly Hardware',
          quantity: 890,
          unitCost: 0.45,
          totalCost: 400.50,
          location: 'F-1-02',
          supplier: 'Cabinet Accessories',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 150,
          maxStockLevel: 1500,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '26',
          itemId: 'CAM-BOLT-50',
          name: 'Cam Bolt 50mm',
          category: 'Accessories',
          subCategory: 'Assembly Hardware',
          quantity: 675,
          unitCost: 0.35,
          totalCost: 236.25,
          location: 'F-1-03',
          supplier: 'Cabinet Accessories',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 100,
          maxStockLevel: 1000,
          lastUpdated: new Date().toISOString(),
        },

        // Specialty Items
        {
          id: '27',
          itemId: 'LED-STRIP-5M',
          name: 'LED Strip Light 5M',
          category: 'Lighting',
          subCategory: 'Cabinet Lighting',
          quantity: 45,
          unitCost: 24.75,
          totalCost: 1113.75,
          location: 'G-1-01',
          supplier: 'Lighting Solutions',
          unitMeasurement: 'Strips (str)',
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '28',
          itemId: 'PWR-ADAPTER',
          name: 'LED Power Adapter 12V',
          category: 'Lighting',
          subCategory: 'Power Supply',
          quantity: 32,
          unitCost: 18.50,
          totalCost: 592.00,
          location: 'G-1-02',
          supplier: 'Lighting Solutions',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 8,
          maxStockLevel: 80,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '29',
          itemId: 'LAZY-SUSAN',
          name: 'Lazy Susan 24" Diameter',
          category: 'Accessories',
          subCategory: 'Corner Solutions',
          quantity: 16,
          unitCost: 85.25,
          totalCost: 1364.00,
          location: 'F-2-01',
          supplier: 'Cabinet Accessories',
          unitMeasurement: 'Sets (set)',
          minStockLevel: 3,
          maxStockLevel: 30,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '30',
          itemId: 'PULL-OUT-TRAY',
          name: 'Pull-Out Tray 18"',
          category: 'Accessories',
          subCategory: 'Storage Solutions',
          quantity: 28,
          unitCost: 42.75,
          totalCost: 1197.00,
          location: 'F-2-02',
          supplier: 'Cabinet Accessories',
          unitMeasurement: 'Pieces (pcs)',
          minStockLevel: 5,
          maxStockLevel: 50,
          lastUpdated: new Date().toISOString(),
        }
      ];
      return res.json(mockProducts);
    }

    const products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
    
    // Transform database results to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      itemId: product.item_id,
      name: product.name,
      category: product.category,
      subCategory: product.sub_category,
      quantity: product.quantity,
      unitCost: product.unit_cost,
      totalCost: product.total_cost,
      location: product.location,
      supplier: product.supplier,
      unitMeasurement: product.unit_measurement,
      minStockLevel: product.min_stock_level,
      maxStockLevel: product.max_stock_level,
      lastUpdated: product.updated_at || product.created_at
    }));

    res.json(transformedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add new product
router.post('/products', requirePermission('inventory.create'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockProduct = {
        id: db.generateUUID(),
        ...req.body,
        totalCost: req.body.quantity * req.body.unitCost,
        lastUpdated: new Date().toISOString()
      };
      return res.status(201).json(mockProduct);
    }

    const { itemId, name, category, subCategory, quantity, unitCost, location, supplier, unitMeasurement, minStockLevel, maxStockLevel } = req.body;
    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO products (id, item_id, name, category, sub_category, quantity, unit_cost, location, supplier, unit_measurement, min_stock_level, max_stock_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, itemId, name, category, subCategory, quantity, unitCost, location, supplier, unitMeasurement, minStockLevel, maxStockLevel]
    );
    
    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    // Transform result
    const transformedProduct = {
      id: newProduct.id,
      itemId: newProduct.item_id,
      name: newProduct.name,
      category: newProduct.category,
      subCategory: newProduct.sub_category,
      quantity: newProduct.quantity,
      unitCost: newProduct.unit_cost,
      totalCost: newProduct.total_cost,
      location: newProduct.location,
      supplier: newProduct.supplier,
      unitMeasurement: newProduct.unit_measurement,
      minStockLevel: newProduct.min_stock_level,
      maxStockLevel: newProduct.max_stock_level,
      lastUpdated: newProduct.updated_at || newProduct.created_at
    };
    
    res.status(201).json(transformedProduct);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product
router.put('/products/:id', requirePermission('inventory.update'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockProduct = {
        id: req.params.id,
        ...req.body,
        totalCost: req.body.quantity * req.body.unitCost,
        lastUpdated: new Date().toISOString()
      };
      return res.json(mockProduct);
    }

    const { id } = req.params;
    const { itemId, name, category, subCategory, quantity, unitCost, location, supplier, unitMeasurement, minStockLevel, maxStockLevel } = req.body;
    
    const result = await db.run(
      `UPDATE products SET 
       item_id = ?, name = ?, category = ?, sub_category = ?, quantity = ?, unit_cost = ?, 
       location = ?, supplier = ?, unit_measurement = ?, min_stock_level = ?, max_stock_level = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [itemId, name, category, subCategory, quantity, unitCost, location, supplier, unitMeasurement, minStockLevel, maxStockLevel, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    // Transform result
    const transformedProduct = {
      id: updatedProduct.id,
      itemId: updatedProduct.item_id,
      name: updatedProduct.name,
      category: updatedProduct.category,
      subCategory: updatedProduct.sub_category,
      quantity: updatedProduct.quantity,
      unitCost: updatedProduct.unit_cost,
      totalCost: updatedProduct.total_cost,
      location: updatedProduct.location,
      supplier: updatedProduct.supplier,
      unitMeasurement: updatedProduct.unit_measurement,
      minStockLevel: updatedProduct.min_stock_level,
      maxStockLevel: updatedProduct.max_stock_level,
      lastUpdated: updatedProduct.updated_at || updatedProduct.created_at
    };
    
    res.json(transformedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', requirePermission('inventory.delete'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return success response when database is not available
      return res.json({ message: 'Product deleted successfully (demo mode)' });
    }

    const { id } = req.params;
    
    const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Import from Excel
router.post('/import', requirePermission('inventory.import'), async (req, res) => {
  try {
    // This would handle Excel file import
    // For now, return a mock response
    res.json({ 
      success: true, 
      message: 'Import functionality coming soon',
      count: 0 
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export to PDF
router.get('/export', requirePermission('inventory.export'), async (req, res) => {
  try {
    // This would generate and return a PDF
    // For now, return a mock response
    res.json({ 
      success: true, 
      message: 'Export functionality coming soon' 
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;