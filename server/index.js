import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting Cabinet WMS Server...');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created server/data directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(dataDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'Cabinet WMS Backend',
    version: '1.0.0'
  });
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt for:', req.body.username);
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('❌ Database error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (user && ((username === 'admin' && password === 'admin123') || 
                (username === 'manager' && password === 'manager123'))) {
      // In a real app, you would verify the password hash
      // For this demo, we're using plain text comparison for the default users
      
      // Parse the JSON stored permissions
      const permissions = JSON.parse(user.permissions);
      
      console.log('✅ Login successful for:', username);
      res.json({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: permissions,
          createdAt: user.createdAt
        }
      });
    } else {
      console.log('❌ Invalid credentials for:', username);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token === 'mock-jwt-token') {
    // In a real app, you would verify the JWT token
    // For this demo, we're just checking if it's our mock token
    
    // Return the first user (admin) for simplicity
    db.get('SELECT * FROM users WHERE id = 1', (err, user) => {
      if (err) {
        console.error('❌ Database error during token validation:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (user) {
        // Parse the JSON stored permissions
        const permissions = JSON.parse(user.permissions);
        
        res.json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: permissions,
            createdAt: user.createdAt
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// User management routes
app.get('/api/users', (req, res) => {
  console.log('👥 Fetching users');
  db.all('SELECT id, username, email, role, permissions, createdAt, updatedAt FROM users', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching users:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Parse the JSON stored permissions for each user
    const users = rows.map(user => ({
      ...user,
      permissions: JSON.parse(user.permissions)
    }));
    
    console.log('✅ Users fetched:', users.length);
    res.json(users);
  });
});

app.get('/api/users/:id', (req, res) => {
  db.get('SELECT id, username, email, role, permissions, createdAt, updatedAt FROM users WHERE id = ?', 
    [req.params.id], 
    (err, user) => {
      if (err) {
        console.error('❌ Error fetching user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (user) {
        // Parse the JSON stored permissions
        user.permissions = JSON.parse(user.permissions);
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  );
});

app.post('/api/users', (req, res) => {
  const { username, email, password, role, permissions } = req.body;
  
  // Validate required fields
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if username or email already exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
    if (err) {
      console.error('❌ Error checking existing user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // In a real app, this would be hashed
      role,
      permissions: JSON.stringify(permissions || []),
      createdAt: new Date().toISOString()
    };
    
    db.run(
      'INSERT INTO users (id, username, email, password, role, permissions, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.username, newUser.email, newUser.password, newUser.role, newUser.permissions, newUser.createdAt],
      function(err) {
        if (err) {
          console.error('❌ Error creating user:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Return the created user (without password)
        res.status(201).json({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          permissions: permissions || [],
          createdAt: newUser.createdAt
        });
      }
    );
  });
});

app.put('/api/users/:id', (req, res) => {
  const { username, email, role, permissions } = req.body;
  const userId = req.params.id;
  
  // Validate required fields
  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('❌ Error checking user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if username or email already exists for another user
    db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', 
      [username, email, userId], 
      (err, existingUser) => {
        if (err) {
          console.error('❌ Error checking existing user:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (existingUser) {
          return res.status(409).json({ error: 'Username or email already exists' });
        }
        
        const updatedAt = new Date().toISOString();
        const permissionsJson = JSON.stringify(permissions || []);
        
        db.run(
          'UPDATE users SET username = ?, email = ?, role = ?, permissions = ?, updatedAt = ? WHERE id = ?',
          [username, email, role, permissionsJson, updatedAt, userId],
          function(err) {
            if (err) {
              console.error('❌ Error updating user:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Return the updated user
            res.json({
              id: userId,
              username,
              email,
              role,
              permissions: permissions || [],
              createdAt: user.createdAt,
              updatedAt
            });
          }
        );
      }
    );
  });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // Check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('❌ Error checking user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ Error deleting user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

app.post('/api/users/:id/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;
  
  // Validate required fields
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  // Check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('❌ Error checking user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // In a real app, you would verify the current password
    // For this demo, we'll just update the password
    
    db.run(
      'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?',
      [newPassword, new Date().toISOString(), userId],
      function(err) {
        if (err) {
          console.error('❌ Error updating password:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json({ success: true, message: 'Password changed successfully' });
      }
    );
  });
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  console.log('📊 Dashboard stats requested');
  
  // Get total items count
  db.get('SELECT COUNT(*) as totalItems FROM inventory_items', (err, itemsResult) => {
    if (err) {
      console.error('❌ Error counting inventory items:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Get low stock items count
    db.get('SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= minStockLevel', (err, lowStockResult) => {
      if (err) {
        console.error('❌ Error counting low stock items:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Get pending requisitions count (mock for now)
      const pendingRequisitions = 8;
      
      // Get open purchase orders count
      db.get('SELECT COUNT(*) as openPurchaseOrders FROM purchase_orders WHERE status IN ("pending", "approved", "ordered")', (err, poResult) => {
        if (err) {
          console.error('❌ Error counting purchase orders:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get monthly expenditure (mock for now)
        const monthlyExpenditure = 67000;
        
        // Get inventory value
        db.get('SELECT SUM(totalCost) as inventoryValue FROM inventory_items', (err, valueResult) => {
          if (err) {
            console.error('❌ Error calculating inventory value:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Get recent activity (mock for now)
          const recentActivity = [
            { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
            { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: 4, action: 'Requisition Approved', item: 'Hardware Supplies', timestamp: new Date(Date.now() - 10800000).toISOString() },
            { id: 5, action: 'Purchase Order Created', item: 'Plywood 18mm', timestamp: new Date(Date.now() - 14400000).toISOString() },
          ];
          
          const stats = {
            totalItems: itemsResult.totalItems,
            lowStockItems: lowStockResult.lowStockItems,
            pendingRequisitions,
            openPurchaseOrders: poResult.openPurchaseOrders,
            monthlyExpenditure,
            inventoryValue: valueResult.inventoryValue || 0,
            recentActivity
          };
          
          console.log('✅ Dashboard stats sent:', stats);
          res.json(stats);
        });
      });
    });
  });
});

// Inventory routes
app.get('/api/inventory/products', (req, res) => {
  console.log('📦 Inventory products requested');
  db.all('SELECT * FROM inventory_items', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching inventory items:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    console.log('✅ Inventory products sent:', rows.length);
    res.json(rows);
  });
});

app.get('/api/inventory/products/:id', (req, res) => {
  db.get('SELECT * FROM inventory_items WHERE id = ?', [req.params.id], (err, item) => {
    if (err) {
      console.error('❌ Error fetching inventory item:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  });
});

app.post('/api/inventory/products', (req, res) => {
  const newItem = {
    id: Date.now().toString(),
    ...req.body,
    totalCost: (req.body.quantity || 0) * (req.body.unitCost || 0),
    lastUpdated: new Date().toISOString()
  };
  
  db.run(
    `INSERT INTO inventory_items (
      id, itemId, name, category, subCategory, quantity, unitCost, totalCost,
      location, supplier, unitMeasurement, minStockLevel, maxStockLevel, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newItem.id,
      newItem.itemId,
      newItem.name,
      newItem.category,
      newItem.subCategory,
      newItem.quantity,
      newItem.unitCost,
      newItem.totalCost,
      newItem.location,
      newItem.supplier,
      newItem.unitMeasurement,
      newItem.minStockLevel,
      newItem.maxStockLevel,
      newItem.lastUpdated
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating inventory item:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(201).json(newItem);
    }
  );
});

app.put('/api/inventory/products/:id', (req, res) => {
  const itemId = req.params.id;
  
  // Check if item exists
  db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId], (err, item) => {
    if (err) {
      console.error('❌ Error checking inventory item:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const quantity = req.body.quantity !== undefined ? req.body.quantity : item.quantity;
    const unitCost = req.body.unitCost !== undefined ? req.body.unitCost : item.unitCost;
    const totalCost = quantity * unitCost;
    const lastUpdated = new Date().toISOString();
    
    db.run(
      `UPDATE inventory_items SET
        itemId = COALESCE(?, itemId),
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        subCategory = COALESCE(?, subCategory),
        quantity = COALESCE(?, quantity),
        unitCost = COALESCE(?, unitCost),
        totalCost = ?,
        location = COALESCE(?, location),
        supplier = COALESCE(?, supplier),
        unitMeasurement = COALESCE(?, unitMeasurement),
        minStockLevel = COALESCE(?, minStockLevel),
        maxStockLevel = COALESCE(?, maxStockLevel),
        lastUpdated = ?
      WHERE id = ?`,
      [
        req.body.itemId,
        req.body.name,
        req.body.category,
        req.body.subCategory,
        req.body.quantity,
        req.body.unitCost,
        totalCost,
        req.body.location,
        req.body.supplier,
        req.body.unitMeasurement,
        req.body.minStockLevel,
        req.body.maxStockLevel,
        lastUpdated,
        itemId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating inventory item:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated item
        db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId], (err, updatedItem) => {
          if (err) {
            console.error('❌ Error fetching updated inventory item:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json(updatedItem);
        });
      }
    );
  });
});

app.delete('/api/inventory/products/:id', (req, res) => {
  const itemId = req.params.id;
  
  // Check if item exists
  db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId], (err, item) => {
    if (err) {
      console.error('❌ Error checking inventory item:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    db.run('DELETE FROM inventory_items WHERE id = ?', [itemId], function(err) {
      if (err) {
        console.error('❌ Error deleting inventory item:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

// Orders routes
app.get('/api/orders', (req, res) => {
  console.log('📋 Orders requested');
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching orders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Get order items for each order
    const promises = rows.map(order => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id], (err, items) => {
          if (err) {
            reject(err);
          } else {
            order.items = items;
            resolve(order);
          }
        });
      });
    });
    
    Promise.all(promises)
      .then(ordersWithItems => {
        console.log('✅ Orders sent:', ordersWithItems.length);
        res.json(ordersWithItems);
      })
      .catch(err => {
        console.error('❌ Error fetching order items:', err);
        res.status(500).json({ error: 'Internal server error' });
      });
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, order) => {
    if (err) {
      console.error('❌ Error fetching order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (order) {
      // Get order items
      db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id], (err, items) => {
        if (err) {
          console.error('❌ Error fetching order items:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        order.items = items;
        res.json(order);
      });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });
});

app.post('/api/orders', (req, res) => {
  const { items, ...orderData } = req.body;
  
  const newOrder = {
    id: Date.now().toString(),
    ...orderData,
    bomCount: 0,
    actualCost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.run(
    `INSERT INTO orders (
      id, orderNumber, customerName, customerContact, orderType, status, priority,
      orderDate, dueDate, deliveryDate, description, notes, estimatedCost, actualCost,
      assignedTo, department, bomCount, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newOrder.id,
      newOrder.orderNumber,
      newOrder.customerName,
      newOrder.customerContact,
      newOrder.orderType,
      newOrder.status,
      newOrder.priority,
      newOrder.orderDate,
      newOrder.dueDate,
      newOrder.deliveryDate,
      newOrder.description,
      newOrder.notes,
      newOrder.estimatedCost,
      newOrder.actualCost,
      newOrder.assignedTo,
      newOrder.department,
      newOrder.bomCount,
      newOrder.createdAt,
      newOrder.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // If there are items, insert them
      if (items && items.length > 0) {
        const itemStmt = db.prepare(
          'INSERT INTO order_items (id, orderId, itemId, itemName, quantity, unitCost, totalCost) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        
        items.forEach(item => {
          itemStmt.run(
            Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            newOrder.id,
            item.itemId,
            item.itemName,
            item.quantity,
            item.unitCost,
            item.totalCost
          );
        });
        
        itemStmt.finalize(err => {
          if (err) {
            console.error('❌ Error inserting order items:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          newOrder.items = items;
          res.status(201).json(newOrder);
        });
      } else {
        newOrder.items = [];
        res.status(201).json(newOrder);
      }
    }
  );
});

app.put('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const { items, ...orderData } = req.body;
  
  // Check if order exists
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err) {
      console.error('❌ Error checking order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedAt = new Date().toISOString();
    
    db.run(
      `UPDATE orders SET
        orderNumber = COALESCE(?, orderNumber),
        customerName = COALESCE(?, customerName),
        customerContact = COALESCE(?, customerContact),
        orderType = COALESCE(?, orderType),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        orderDate = COALESCE(?, orderDate),
        dueDate = COALESCE(?, dueDate),
        deliveryDate = COALESCE(?, deliveryDate),
        completedDate = COALESCE(?, completedDate),
        description = COALESCE(?, description),
        notes = COALESCE(?, notes),
        estimatedCost = COALESCE(?, estimatedCost),
        actualCost = COALESCE(?, actualCost),
        assignedTo = COALESCE(?, assignedTo),
        department = COALESCE(?, department),
        updatedAt = ?
      WHERE id = ?`,
      [
        orderData.orderNumber,
        orderData.customerName,
        orderData.customerContact,
        orderData.orderType,
        orderData.status,
        orderData.priority,
        orderData.orderDate,
        orderData.dueDate,
        orderData.deliveryDate,
        orderData.completedDate,
        orderData.description,
        orderData.notes,
        orderData.estimatedCost,
        orderData.actualCost,
        orderData.assignedTo,
        orderData.department,
        updatedAt,
        orderId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // If there are items, update them
        if (items && items.length > 0) {
          // First delete existing items
          db.run('DELETE FROM order_items WHERE orderId = ?', [orderId], function(err) {
            if (err) {
              console.error('❌ Error deleting order items:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Then insert new items
            const itemStmt = db.prepare(
              'INSERT INTO order_items (id, orderId, itemId, itemName, quantity, unitCost, totalCost) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            
            items.forEach(item => {
              itemStmt.run(
                item.id || (Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)),
                orderId,
                item.itemId,
                item.itemName,
                item.quantity,
                item.unitCost,
                item.totalCost
              );
            });
            
            itemStmt.finalize(err => {
              if (err) {
                console.error('❌ Error inserting order items:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              // Get the updated order
              db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, updatedOrder) => {
                if (err) {
                  console.error('❌ Error fetching updated order:', err);
                  return res.status(500).json({ error: 'Internal server error' });
                }
                
                updatedOrder.items = items;
                res.json(updatedOrder);
              });
            });
          });
        } else {
          // Get the updated order
          db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, updatedOrder) => {
            if (err) {
              console.error('❌ Error fetching updated order:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Get order items
            db.all('SELECT * FROM order_items WHERE orderId = ?', [orderId], (err, items) => {
              if (err) {
                console.error('❌ Error fetching order items:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              updatedOrder.items = items;
              res.json(updatedOrder);
            });
          });
        }
      }
    );
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  
  // Check if order exists
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err) {
      console.error('❌ Error checking order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Delete order items first (foreign key constraint)
    db.run('DELETE FROM order_items WHERE orderId = ?', [orderId], function(err) {
      if (err) {
        console.error('❌ Error deleting order items:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Then delete the order
      db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
        if (err) {
          console.error('❌ Error deleting order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json({ success: true });
      });
    });
  });
});

// Suppliers routes
app.get('/api/suppliers', (req, res) => {
  console.log('🏪 Suppliers requested');
  db.all('SELECT * FROM suppliers', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching suppliers:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    console.log('✅ Suppliers sent:', rows.length);
    res.json(rows);
  });
});

app.get('/api/suppliers/:id', (req, res) => {
  db.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err, supplier) => {
    if (err) {
      console.error('❌ Error fetching supplier:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  });
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier = {
    id: Date.now().toString(),
    ...req.body,
    isActive: req.body.isActive !== false ? 1 : 0,
    createdAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO suppliers (id, name, contactPerson, phone, email, address, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newSupplier.id,
      newSupplier.name,
      newSupplier.contactPerson,
      newSupplier.phone,
      newSupplier.email,
      newSupplier.address,
      newSupplier.isActive,
      newSupplier.createdAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating supplier:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(201).json(newSupplier);
    }
  );
});

app.put('/api/suppliers/:id', (req, res) => {
  const supplierId = req.params.id;
  
  // Check if supplier exists
  db.get('SELECT * FROM suppliers WHERE id = ?', [supplierId], (err, supplier) => {
    if (err) {
      console.error('❌ Error checking supplier:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const isActive = req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : supplier.isActive;
    
    db.run(
      `UPDATE suppliers SET
        name = COALESCE(?, name),
        contactPerson = COALESCE(?, contactPerson),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        isActive = ?
      WHERE id = ?`,
      [
        req.body.name,
        req.body.contactPerson,
        req.body.phone,
        req.body.email,
        req.body.address,
        isActive,
        supplierId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating supplier:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated supplier
        db.get('SELECT * FROM suppliers WHERE id = ?', [supplierId], (err, updatedSupplier) => {
          if (err) {
            console.error('❌ Error fetching updated supplier:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          res.json(updatedSupplier);
        });
      }
    );
  });
});

app.delete('/api/suppliers/:id', (req, res) => {
  const supplierId = req.params.id;
  
  // Check if supplier exists
  db.get('SELECT * FROM suppliers WHERE id = ?', [supplierId], (err, supplier) => {
    if (err) {
      console.error('❌ Error checking supplier:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    db.run('DELETE FROM suppliers WHERE id = ?', [supplierId], function(err) {
      if (err) {
        console.error('❌ Error deleting supplier:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

// Departments routes
app.get('/api/departments', (req, res) => {
  console.log('🏢 Departments requested');
  db.all('SELECT * FROM departments', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching departments:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Convert isActive from integer to boolean for frontend
    const departments = rows.map(dept => ({
      ...dept,
      isActive: dept.isActive === 1
    }));
    
    console.log('✅ Departments sent:', departments.length);
    res.json(departments);
  });
});

app.get('/api/departments/:id', (req, res) => {
  db.get('SELECT * FROM departments WHERE id = ?', [req.params.id], (err, department) => {
    if (err) {
      console.error('❌ Error fetching department:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (department) {
      // Convert isActive from integer to boolean for frontend
      department.isActive = department.isActive === 1;
      res.json(department);
    } else {
      res.status(404).json({ error: 'Department not found' });
    }
  });
});

app.post('/api/departments', (req, res) => {
  const newDepartment = {
    id: Date.now().toString(),
    ...req.body,
    isActive: req.body.isActive !== false ? 1 : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO departments (id, name, code, description, manager, costCenter, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newDepartment.id,
      newDepartment.name,
      newDepartment.code,
      newDepartment.description,
      newDepartment.manager,
      newDepartment.costCenter,
      newDepartment.isActive,
      newDepartment.createdAt,
      newDepartment.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating department:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Convert isActive back to boolean for frontend
      newDepartment.isActive = newDepartment.isActive === 1;
      res.status(201).json(newDepartment);
    }
  );
});

app.put('/api/departments/:id', (req, res) => {
  const departmentId = req.params.id;
  
  // Check if department exists
  db.get('SELECT * FROM departments WHERE id = ?', [departmentId], (err, department) => {
    if (err) {
      console.error('❌ Error checking department:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const isActive = req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : department.isActive;
    const updatedAt = new Date().toISOString();
    
    db.run(
      `UPDATE departments SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        manager = COALESCE(?, manager),
        costCenter = COALESCE(?, costCenter),
        isActive = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        req.body.name,
        req.body.code,
        req.body.description,
        req.body.manager,
        req.body.costCenter,
        isActive,
        updatedAt,
        departmentId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating department:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated department
        db.get('SELECT * FROM departments WHERE id = ?', [departmentId], (err, updatedDepartment) => {
          if (err) {
            console.error('❌ Error fetching updated department:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Convert isActive from integer to boolean for frontend
          updatedDepartment.isActive = updatedDepartment.isActive === 1;
          res.json(updatedDepartment);
        });
      }
    );
  });
});

app.delete('/api/departments/:id', (req, res) => {
  const departmentId = req.params.id;
  
  // Check if department exists
  db.get('SELECT * FROM departments WHERE id = ?', [departmentId], (err, department) => {
    if (err) {
      console.error('❌ Error checking department:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    db.run('DELETE FROM departments WHERE id = ?', [departmentId], function(err) {
      if (err) {
        console.error('❌ Error deleting department:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

// Requesters routes
app.get('/api/requesters', (req, res) => {
  console.log('👤 Requesters requested');
  db.all('SELECT * FROM requesters', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching requesters:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Convert isActive from integer to boolean for frontend
    const requesters = rows.map(requester => ({
      ...requester,
      isActive: requester.isActive === 1
    }));
    
    console.log('✅ Requesters sent:', requesters.length);
    res.json(requesters);
  });
});

app.get('/api/requesters/:id', (req, res) => {
  db.get('SELECT * FROM requesters WHERE id = ?', [req.params.id], (err, requester) => {
    if (err) {
      console.error('❌ Error fetching requester:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (requester) {
      // Convert isActive from integer to boolean for frontend
      requester.isActive = requester.isActive === 1;
      res.json(requester);
    } else {
      res.status(404).json({ error: 'Requester not found' });
    }
  });
});

app.post('/api/requesters', (req, res) => {
  const newRequester = {
    id: Date.now().toString(),
    ...req.body,
    isActive: req.body.isActive !== false ? 1 : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO requesters (id, name, email, employeeId, department, position, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newRequester.id,
      newRequester.name,
      newRequester.email,
      newRequester.employeeId,
      newRequester.department,
      newRequester.position,
      newRequester.phone,
      newRequester.isActive,
      newRequester.createdAt,
      newRequester.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating requester:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Convert isActive back to boolean for frontend
      newRequester.isActive = newRequester.isActive === 1;
      res.status(201).json(newRequester);
    }
  );
});

app.put('/api/requesters/:id', (req, res) => {
  const requesterId = req.params.id;
  
  // Check if requester exists
  db.get('SELECT * FROM requesters WHERE id = ?', [requesterId], (err, requester) => {
    if (err) {
      console.error('❌ Error checking requester:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }
    
    const isActive = req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : requester.isActive;
    const updatedAt = new Date().toISOString();
    
    db.run(
      `UPDATE requesters SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        employeeId = COALESCE(?, employeeId),
        department = COALESCE(?, department),
        position = COALESCE(?, position),
        phone = COALESCE(?, phone),
        isActive = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        req.body.name,
        req.body.email,
        req.body.employeeId,
        req.body.department,
        req.body.position,
        req.body.phone,
        isActive,
        updatedAt,
        requesterId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating requester:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated requester
        db.get('SELECT * FROM requesters WHERE id = ?', [requesterId], (err, updatedRequester) => {
          if (err) {
            console.error('❌ Error fetching updated requester:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Convert isActive from integer to boolean for frontend
          updatedRequester.isActive = updatedRequester.isActive === 1;
          res.json(updatedRequester);
        });
      }
    );
  });
});

app.delete('/api/requesters/:id', (req, res) => {
  const requesterId = req.params.id;
  
  // Check if requester exists
  db.get('SELECT * FROM requesters WHERE id = ?', [requesterId], (err, requester) => {
    if (err) {
      console.error('❌ Error checking requester:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }
    
    db.run('DELETE FROM requesters WHERE id = ?', [requesterId], function(err) {
      if (err) {
        console.error('❌ Error deleting requester:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

// Purchase Orders routes
app.get('/api/purchase-orders', (req, res) => {
  console.log('🛒 Purchase orders requested');
  db.all('SELECT * FROM purchase_orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching purchase orders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Get items for each purchase order
    const promises = rows.map(po => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM purchase_order_items WHERE poId = ?', [po.id], (err, items) => {
          if (err) {
            reject(err);
          } else {
            po.items = items;
            resolve(po);
          }
        });
      });
    });
    
    Promise.all(promises)
      .then(posWithItems => {
        console.log('✅ Purchase orders sent:', posWithItems.length);
        res.json(posWithItems);
      })
      .catch(err => {
        console.error('❌ Error fetching purchase order items:', err);
        res.status(500).json({ error: 'Internal server error' });
      });
  });
});

app.get('/api/purchase-orders/:id', (req, res) => {
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id], (err, po) => {
    if (err) {
      console.error('❌ Error fetching purchase order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (po) {
      // Get purchase order items
      db.all('SELECT * FROM purchase_order_items WHERE poId = ?', [po.id], (err, items) => {
        if (err) {
          console.error('❌ Error fetching purchase order items:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        po.items = items;
        res.json(po);
      });
    } else {
      res.status(404).json({ error: 'Purchase order not found' });
    }
  });
});

app.post('/api/purchase-orders', (req, res) => {
  const { items, ...poData } = req.body;
  
  const newPO = {
    id: Date.now().toString(),
    ...poData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.run(
    `INSERT INTO purchase_orders (
      id, poNumber, supplier, status, subtotal, tax, total,
      orderDate, expectedDelivery, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newPO.id,
      newPO.poNumber,
      newPO.supplier,
      newPO.status,
      newPO.subtotal,
      newPO.tax,
      newPO.total,
      newPO.orderDate,
      newPO.expectedDelivery,
      newPO.notes,
      newPO.createdAt,
      newPO.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating purchase order:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // If there are items, insert them
      if (items && items.length > 0) {
        const itemStmt = db.prepare(
          'INSERT INTO purchase_order_items (id, poId, itemId, itemName, quantity, unitCost, totalCost) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        
        items.forEach(item => {
          itemStmt.run(
            item.id || (Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)),
            newPO.id,
            item.itemId,
            item.itemName,
            item.quantity,
            item.unitCost,
            item.totalCost
          );
        });
        
        itemStmt.finalize(err => {
          if (err) {
            console.error('❌ Error inserting purchase order items:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          newPO.items = items;
          res.status(201).json(newPO);
        });
      } else {
        newPO.items = [];
        res.status(201).json(newPO);
      }
    }
  );
});

app.put('/api/purchase-orders/:id', (req, res) => {
  const poId = req.params.id;
  const { items, ...poData } = req.body;
  
  // Check if purchase order exists
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, po) => {
    if (err) {
      console.error('❌ Error checking purchase order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const updatedAt = new Date().toISOString();
    
    db.run(
      `UPDATE purchase_orders SET
        poNumber = COALESCE(?, poNumber),
        supplier = COALESCE(?, supplier),
        status = COALESCE(?, status),
        subtotal = COALESCE(?, subtotal),
        tax = COALESCE(?, tax),
        total = COALESCE(?, total),
        orderDate = COALESCE(?, orderDate),
        expectedDelivery = COALESCE(?, expectedDelivery),
        notes = COALESCE(?, notes),
        updatedAt = ?
      WHERE id = ?`,
      [
        poData.poNumber,
        poData.supplier,
        poData.status,
        poData.subtotal,
        poData.tax,
        poData.total,
        poData.orderDate,
        poData.expectedDelivery,
        poData.notes,
        updatedAt,
        poId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating purchase order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // If there are items, update them
        if (items && items.length > 0) {
          // First delete existing items
          db.run('DELETE FROM purchase_order_items WHERE poId = ?', [poId], function(err) {
            if (err) {
              console.error('❌ Error deleting purchase order items:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Then insert new items
            const itemStmt = db.prepare(
              'INSERT INTO purchase_order_items (id, poId, itemId, itemName, quantity, unitCost, totalCost) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            
            items.forEach(item => {
              itemStmt.run(
                item.id || (Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)),
                poId,
                item.itemId,
                item.itemName,
                item.quantity,
                item.unitCost,
                item.totalCost
              );
            });
            
            itemStmt.finalize(err => {
              if (err) {
                console.error('❌ Error inserting purchase order items:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              // Get the updated purchase order
              db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, updatedPO) => {
                if (err) {
                  console.error('❌ Error fetching updated purchase order:', err);
                  return res.status(500).json({ error: 'Internal server error' });
                }
                
                updatedPO.items = items;
                res.json(updatedPO);
              });
            });
          });
        } else {
          // Get the updated purchase order
          db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, updatedPO) => {
            if (err) {
              console.error('❌ Error fetching updated purchase order:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Get purchase order items
            db.all('SELECT * FROM purchase_order_items WHERE poId = ?', [poId], (err, items) => {
              if (err) {
                console.error('❌ Error fetching purchase order items:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
              
              updatedPO.items = items;
              res.json(updatedPO);
            });
          });
        }
      }
    );
  });
});

app.delete('/api/purchase-orders/:id', (req, res) => {
  const poId = req.params.id;
  
  // Check if purchase order exists
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, po) => {
    if (err) {
      console.error('❌ Error checking purchase order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Delete purchase order items first (foreign key constraint)
    db.run('DELETE FROM purchase_order_items WHERE poId = ?', [poId], function(err) {
      if (err) {
        console.error('❌ Error deleting purchase order items:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Then delete the purchase order
      db.run('DELETE FROM purchase_orders WHERE id = ?', [poId], function(err) {
        if (err) {
          console.error('❌ Error deleting purchase order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json({ success: true });
      });
    });
  });
});

app.patch('/api/purchase-orders/:id/approve', (req, res) => {
  const poId = req.params.id;
  
  // Check if purchase order exists
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, po) => {
    if (err) {
      console.error('❌ Error checking purchase order:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const updatedAt = new Date().toISOString();
    
    db.run(
      'UPDATE purchase_orders SET status = ?, updatedAt = ? WHERE id = ?',
      ['approved', updatedAt, poId],
      function(err) {
        if (err) {
          console.error('❌ Error approving purchase order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated purchase order
        db.get('SELECT * FROM purchase_orders WHERE id = ?', [poId], (err, updatedPO) => {
          if (err) {
            console.error('❌ Error fetching updated purchase order:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Get purchase order items
          db.all('SELECT * FROM purchase_order_items WHERE poId = ?', [poId], (err, items) => {
            if (err) {
              console.error('❌ Error fetching purchase order items:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            
            updatedPO.items = items;
            res.json(updatedPO);
          });
        });
      }
    );
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the file path that can be used to access the file
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    filePath,
    fileUrl: `http://localhost:${PORT}${filePath}`
  });
});

// Cabinet Calculator routes
app.get('/api/cabinet-calculator/templates', (req, res) => {
  console.log('🏗️ Cabinet templates requested');
  // Read templates from database
  db.all('SELECT * FROM cabinet_templates', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching cabinet templates:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Parse JSON fields
    const templates = rows.map(template => ({
      ...template,
      defaultDimensions: JSON.parse(template.defaultDimensions),
      minDimensions: JSON.parse(template.minDimensions),
      maxDimensions: JSON.parse(template.maxDimensions),
      features: JSON.parse(template.features),
      construction: template.construction ? JSON.parse(template.construction) : undefined,
      materialThickness: JSON.parse(template.materialThickness),
      hardware: JSON.parse(template.hardware),
      parts: template.parts ? JSON.parse(template.parts) : undefined,
      hardwareItems: template.hardwareItems ? JSON.parse(template.hardwareItems) : undefined,
      isActive: template.isActive === 1,
      isCustom: template.isCustom === 1
    }));
    
    console.log('✅ Cabinet templates sent:', templates.length);
    res.json(templates);
  });
});

app.post('/api/cabinet-calculator/templates', (req, res) => {
  const newTemplate = {
    ...req.body,
    id: req.body.id || `template-${Date.now()}`,
    isActive: req.body.isActive !== false ? 1 : 0,
    isCustom: req.body.isCustom !== false ? 1 : 0,
    createdAt: new Date().toISOString()
  };
  
  // Stringify JSON fields
  const templateToSave = {
    ...newTemplate,
    defaultDimensions: JSON.stringify(newTemplate.defaultDimensions),
    minDimensions: JSON.stringify(newTemplate.minDimensions),
    maxDimensions: JSON.stringify(newTemplate.maxDimensions),
    features: JSON.stringify(newTemplate.features || []),
    construction: newTemplate.construction ? JSON.stringify(newTemplate.construction) : null,
    materialThickness: JSON.stringify(newTemplate.materialThickness),
    hardware: JSON.stringify(newTemplate.hardware),
    parts: newTemplate.parts ? JSON.stringify(newTemplate.parts) : null,
    hardwareItems: newTemplate.hardwareItems ? JSON.stringify(newTemplate.hardwareItems) : null
  };
  
  db.run(
    `INSERT INTO cabinet_templates (
      id, name, type, category, defaultDimensions, minDimensions, maxDimensions,
      previewImage, description, features, construction, materialThickness, hardware,
      parts, hardwareItems, isActive, isCustom, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      templateToSave.id,
      templateToSave.name,
      templateToSave.type,
      templateToSave.category,
      templateToSave.defaultDimensions,
      templateToSave.minDimensions,
      templateToSave.maxDimensions,
      templateToSave.previewImage,
      templateToSave.description,
      templateToSave.features,
      templateToSave.construction,
      templateToSave.materialThickness,
      templateToSave.hardware,
      templateToSave.parts,
      templateToSave.hardwareItems,
      templateToSave.isActive,
      templateToSave.isCustom,
      templateToSave.createdAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating cabinet template:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Convert isActive and isCustom back to boolean for frontend
      newTemplate.isActive = newTemplate.isActive === 1;
      newTemplate.isCustom = newTemplate.isCustom === 1;
      res.status(201).json(newTemplate);
    }
  );
});

app.put('/api/cabinet-calculator/templates/:id', (req, res) => {
  const templateId = req.params.id;
  
  // Check if template exists
  db.get('SELECT * FROM cabinet_templates WHERE id = ?', [templateId], (err, template) => {
    if (err) {
      console.error('❌ Error checking cabinet template:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const updatedTemplate = {
      ...req.body,
      isActive: req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : template.isActive,
      isCustom: req.body.isCustom !== undefined ? (req.body.isCustom ? 1 : 0) : template.isCustom,
      updatedAt: new Date().toISOString()
    };
    
    // Stringify JSON fields
    const templateToSave = {
      ...updatedTemplate,
      defaultDimensions: JSON.stringify(updatedTemplate.defaultDimensions),
      minDimensions: JSON.stringify(updatedTemplate.minDimensions),
      maxDimensions: JSON.stringify(updatedTemplate.maxDimensions),
      features: JSON.stringify(updatedTemplate.features || []),
      construction: updatedTemplate.construction ? JSON.stringify(updatedTemplate.construction) : null,
      materialThickness: JSON.stringify(updatedTemplate.materialThickness),
      hardware: JSON.stringify(updatedTemplate.hardware),
      parts: updatedTemplate.parts ? JSON.stringify(updatedTemplate.parts) : null,
      hardwareItems: updatedTemplate.hardwareItems ? JSON.stringify(updatedTemplate.hardwareItems) : null
    };
    
    db.run(
      `UPDATE cabinet_templates SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        defaultDimensions = COALESCE(?, defaultDimensions),
        minDimensions = COALESCE(?, minDimensions),
        maxDimensions = COALESCE(?, maxDimensions),
        previewImage = COALESCE(?, previewImage),
        description = COALESCE(?, description),
        features = COALESCE(?, features),
        construction = ?,
        materialThickness = COALESCE(?, materialThickness),
        hardware = COALESCE(?, hardware),
        parts = ?,
        hardwareItems = ?,
        isActive = ?,
        isCustom = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        templateToSave.name,
        templateToSave.type,
        templateToSave.category,
        templateToSave.defaultDimensions,
        templateToSave.minDimensions,
        templateToSave.maxDimensions,
        templateToSave.previewImage,
        templateToSave.description,
        templateToSave.features,
        templateToSave.construction,
        templateToSave.materialThickness,
        templateToSave.hardware,
        templateToSave.parts,
        templateToSave.hardwareItems,
        templateToSave.isActive,
        templateToSave.isCustom,
        templateToSave.updatedAt,
        templateId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating cabinet template:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated template
        db.get('SELECT * FROM cabinet_templates WHERE id = ?', [templateId], (err, updatedTemplate) => {
          if (err) {
            console.error('❌ Error fetching updated cabinet template:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Parse JSON fields
          const parsedTemplate = {
            ...updatedTemplate,
            defaultDimensions: JSON.parse(updatedTemplate.defaultDimensions),
            minDimensions: JSON.parse(updatedTemplate.minDimensions),
            maxDimensions: JSON.parse(updatedTemplate.maxDimensions),
            features: JSON.parse(updatedTemplate.features),
            construction: updatedTemplate.construction ? JSON.parse(updatedTemplate.construction) : undefined,
            materialThickness: JSON.parse(updatedTemplate.materialThickness),
            hardware: JSON.parse(updatedTemplate.hardware),
            parts: updatedTemplate.parts ? JSON.parse(updatedTemplate.parts) : undefined,
            hardwareItems: updatedTemplate.hardwareItems ? JSON.parse(updatedTemplate.hardwareItems) : undefined,
            isActive: updatedTemplate.isActive === 1,
            isCustom: updatedTemplate.isCustom === 1
          };
          
          res.json(parsedTemplate);
        });
      }
    );
  });
});

app.delete('/api/cabinet-calculator/templates/:id', (req, res) => {
  const templateId = req.params.id;
  
  // Check if template exists
  db.get('SELECT * FROM cabinet_templates WHERE id = ?', [templateId], (err, template) => {
    if (err) {
      console.error('❌ Error checking cabinet template:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    db.run('DELETE FROM cabinet_templates WHERE id = ?', [templateId], function(err) {
      if (err) {
        console.error('❌ Error deleting cabinet template:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

app.get('/api/cabinet-calculator/configurations', (req, res) => {
  console.log('⚙️ Cabinet configurations requested');
  // Read configurations from database
  db.all('SELECT * FROM cabinet_configurations', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching cabinet configurations:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Parse JSON fields
    const configurations = rows.map(config => ({
      ...config,
      dimensions: JSON.parse(config.dimensions),
      customizations: JSON.parse(config.customizations),
      materials: JSON.parse(config.materials),
      hardware: JSON.parse(config.hardware),
      cuttingList: JSON.parse(config.cuttingList)
    }));
    
    console.log('✅ Cabinet configurations sent:', configurations.length);
    res.json(configurations);
  });
});

app.post('/api/cabinet-calculator/configurations', (req, res) => {
  const newConfig = {
    ...req.body,
    id: req.body.id || `config-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Stringify JSON fields
  const configToSave = {
    ...newConfig,
    dimensions: JSON.stringify(newConfig.dimensions),
    customizations: JSON.stringify(newConfig.customizations),
    materials: JSON.stringify(newConfig.materials),
    hardware: JSON.stringify(newConfig.hardware),
    cuttingList: JSON.stringify(newConfig.cuttingList)
  };
  
  db.run(
    `INSERT INTO cabinet_configurations (
      id, templateId, name, dimensions, customizations, materials, hardware,
      cuttingList, totalCost, laborCost, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      configToSave.id,
      configToSave.templateId,
      configToSave.name,
      configToSave.dimensions,
      configToSave.customizations,
      configToSave.materials,
      configToSave.hardware,
      configToSave.cuttingList,
      configToSave.totalCost,
      configToSave.laborCost,
      configToSave.createdAt,
      configToSave.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating cabinet configuration:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(201).json(newConfig);
    }
  );
});

app.put('/api/cabinet-calculator/configurations/:id', (req, res) => {
  const configId = req.params.id;
  
  // Check if configuration exists
  db.get('SELECT * FROM cabinet_configurations WHERE id = ?', [configId], (err, config) => {
    if (err) {
      console.error('❌ Error checking cabinet configuration:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const updatedConfig = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Stringify JSON fields
    const configToSave = {
      ...updatedConfig,
      dimensions: JSON.stringify(updatedConfig.dimensions),
      customizations: JSON.stringify(updatedConfig.customizations),
      materials: JSON.stringify(updatedConfig.materials),
      hardware: JSON.stringify(updatedConfig.hardware),
      cuttingList: JSON.stringify(updatedConfig.cuttingList)
    };
    
    db.run(
      `UPDATE cabinet_configurations SET
        templateId = COALESCE(?, templateId),
        name = COALESCE(?, name),
        dimensions = COALESCE(?, dimensions),
        customizations = COALESCE(?, customizations),
        materials = COALESCE(?, materials),
        hardware = COALESCE(?, hardware),
        cuttingList = COALESCE(?, cuttingList),
        totalCost = COALESCE(?, totalCost),
        laborCost = COALESCE(?, laborCost),
        updatedAt = ?
      WHERE id = ?`,
      [
        configToSave.templateId,
        configToSave.name,
        configToSave.dimensions,
        configToSave.customizations,
        configToSave.materials,
        configToSave.hardware,
        configToSave.cuttingList,
        configToSave.totalCost,
        configToSave.laborCost,
        configToSave.updatedAt,
        configId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating cabinet configuration:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated configuration
        db.get('SELECT * FROM cabinet_configurations WHERE id = ?', [configId], (err, updatedConfig) => {
          if (err) {
            console.error('❌ Error fetching updated cabinet configuration:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Parse JSON fields
          const parsedConfig = {
            ...updatedConfig,
            dimensions: JSON.parse(updatedConfig.dimensions),
            customizations: JSON.parse(updatedConfig.customizations),
            materials: JSON.parse(updatedConfig.materials),
            hardware: JSON.parse(updatedConfig.hardware),
            cuttingList: JSON.parse(updatedConfig.cuttingList)
          };
          
          res.json(parsedConfig);
        });
      }
    );
  });
});

app.delete('/api/cabinet-calculator/configurations/:id', (req, res) => {
  const configId = req.params.id;
  
  // Check if configuration exists
  db.get('SELECT * FROM cabinet_configurations WHERE id = ?', [configId], (err, config) => {
    if (err) {
      console.error('❌ Error checking cabinet configuration:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    db.run('DELETE FROM cabinet_configurations WHERE id = ?', [configId], function(err) {
      if (err) {
        console.error('❌ Error deleting cabinet configuration:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

app.get('/api/cabinet-calculator/projects', (req, res) => {
  console.log('📁 Cabinet projects requested');
  // Read projects from database
  db.all('SELECT * FROM cabinet_projects', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching cabinet projects:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Parse JSON fields
    const projects = rows.map(project => ({
      ...project,
      configurations: JSON.parse(project.configurations),
      status: project.status
    }));
    
    console.log('✅ Cabinet projects sent:', projects.length);
    res.json(projects);
  });
});

app.post('/api/cabinet-calculator/projects', (req, res) => {
  const newProject = {
    ...req.body,
    id: req.body.id || `project-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Stringify JSON fields
  const projectToSave = {
    ...newProject,
    configurations: JSON.stringify(newProject.configurations)
  };
  
  db.run(
    `INSERT INTO cabinet_projects (
      id, name, description, customerName, customerContact, configurations,
      totalMaterialCost, totalHardwareCost, totalLaborCost, subtotal, tax, total,
      estimatedDays, status, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectToSave.id,
      projectToSave.name,
      projectToSave.description,
      projectToSave.customerName,
      projectToSave.customerContact,
      projectToSave.configurations,
      projectToSave.totalMaterialCost,
      projectToSave.totalHardwareCost,
      projectToSave.totalLaborCost,
      projectToSave.subtotal,
      projectToSave.tax,
      projectToSave.total,
      projectToSave.estimatedDays,
      projectToSave.status,
      projectToSave.notes,
      projectToSave.createdAt,
      projectToSave.updatedAt
    ],
    function(err) {
      if (err) {
        console.error('❌ Error creating cabinet project:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(201).json(newProject);
    }
  );
});

app.put('/api/cabinet-calculator/projects/:id', (req, res) => {
  const projectId = req.params.id;
  
  // Check if project exists
  db.get('SELECT * FROM cabinet_projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      console.error('❌ Error checking cabinet project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const updatedProject = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Stringify JSON fields
    const projectToSave = {
      ...updatedProject,
      configurations: JSON.stringify(updatedProject.configurations)
    };
    
    db.run(
      `UPDATE cabinet_projects SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        customerName = COALESCE(?, customerName),
        customerContact = COALESCE(?, customerContact),
        configurations = COALESCE(?, configurations),
        totalMaterialCost = COALESCE(?, totalMaterialCost),
        totalHardwareCost = COALESCE(?, totalHardwareCost),
        totalLaborCost = COALESCE(?, totalLaborCost),
        subtotal = COALESCE(?, subtotal),
        tax = COALESCE(?, tax),
        total = COALESCE(?, total),
        estimatedDays = COALESCE(?, estimatedDays),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updatedAt = ?
      WHERE id = ?`,
      [
        projectToSave.name,
        projectToSave.description,
        projectToSave.customerName,
        projectToSave.customerContact,
        projectToSave.configurations,
        projectToSave.totalMaterialCost,
        projectToSave.totalHardwareCost,
        projectToSave.totalLaborCost,
        projectToSave.subtotal,
        projectToSave.tax,
        projectToSave.total,
        projectToSave.estimatedDays,
        projectToSave.status,
        projectToSave.notes,
        projectToSave.updatedAt,
        projectId
      ],
      function(err) {
        if (err) {
          console.error('❌ Error updating cabinet project:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Get the updated project
        db.get('SELECT * FROM cabinet_projects WHERE id = ?', [projectId], (err, updatedProject) => {
          if (err) {
            console.error('❌ Error fetching updated cabinet project:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Parse JSON fields
          updatedProject.configurations = JSON.parse(updatedProject.configurations);
          
          res.json(updatedProject);
        });
      }
    );
  });
});

app.delete('/api/cabinet-calculator/projects/:id', (req, res) => {
  const projectId = req.params.id;
  
  // Check if project exists
  db.get('SELECT * FROM cabinet_projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      console.error('❌ Error checking cabinet project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    db.run('DELETE FROM cabinet_projects WHERE id = ?', [projectId], function(err) {
      if (err) {
        console.error('❌ Error deleting cabinet project:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.json({ success: true });
    });
  });
});

app.post('/api/cabinet-calculator/nesting', (req, res) => {
  console.log('🧩 Nesting optimization requested');
  // Mock nesting optimization response
  const { panels } = req.body;
  const mockNestingResult = {
    sheets: [
      {
        id: 1,
        material: 'PLY-18-4X8',
        width: 1220,
        height: 2440,
        thickness: 18,
        panels: panels?.slice(0, Math.ceil(panels.length / 2)) || [],
        efficiency: 85.5
      }
    ],
    totalSheets: 1,
    totalEfficiency: 85.5,
    wastePercentage: 14.5
  };
  console.log('✅ Nesting result sent');
  res.json(mockNestingResult);
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  console.log('❓ Unknown API endpoint:', req.method, req.url);
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database initialization check
console.log('🔍 Checking database connection...');
db.get('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎉 ===================================');
  console.log('✅ Cabinet WMS Server is running!');
  console.log('🌐 Server URL: http://localhost:' + PORT);
  console.log('📊 Dashboard API: http://localhost:' + PORT + '/api/dashboard/stats');
  console.log('🔐 Auth API: http://localhost:' + PORT + '/api/auth/login');
  console.log('📦 Inventory API: http://localhost:' + PORT + '/api/inventory/products');
  console.log('👥 Users API: http://localhost:' + PORT + '/api/users');
  console.log('🏥 Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🎉 ===================================');
  console.log('');
});

// Handle server startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    console.error('💡 You can set a different port using: PORT=3002 npm start');
  } else {
    console.error('❌ Server startup error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      
      console.log('👋 Server shutdown complete');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});