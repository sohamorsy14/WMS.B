const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created server/data directory');
}

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock data for development
const mockDashboardStats = {
  totalItems: 1247,
  lowStockItems: 23,
  pendingRequisitions: 8,
  openPurchaseOrders: 12,
  monthlyExpenditure: 67000,
  inventoryValue: 350000,
  recentActivity: [
    { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
    { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, action: 'Requisition Approved', item: 'Hardware Supplies', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { id: 5, action: 'Purchase Order Created', item: 'Plywood 18mm', timestamp: new Date(Date.now() - 14400000).toISOString() },
  ]
};

const mockInventoryItems = [
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
  }
];

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

const mockSuppliers = [
  {
    id: '1',
    name: 'Wood Supply Co.',
    contactPerson: 'John Anderson',
    phone: '(555) 123-4567',
    email: 'orders@woodsupply.com',
    address: '123 Industrial Blvd, Manufacturing City, MC 12345',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Hardware Plus',
    contactPerson: 'Sarah Mitchell',
    phone: '(555) 987-6543',
    email: 'sales@hardwareplus.com',
    address: '456 Hardware Ave, Supply Town, ST 67890',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Laminate Plus',
    contactPerson: 'Mike Johnson',
    phone: '(555) 456-7890',
    email: 'info@laminateplus.com',
    address: '789 Laminate Dr, Finish City, FC 11111',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Cabinet Hardware Direct',
    contactPerson: 'Lisa Chen',
    phone: '(555) 321-9876',
    email: 'sales@cabinethardware.com',
    address: '321 Hardware Plaza, Component City, CC 22222',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Premium Wood Products',
    contactPerson: 'Robert Davis',
    phone: '(555) 654-3210',
    email: 'info@premiumwood.com',
    address: '654 Lumber Lane, Wood Valley, WV 33333',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = mockUsers.find(u => u.username === username);
  
  if (user && ((username === 'admin' && password === 'admin123') || 
               (username === 'manager' && password === 'manager123'))) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token === 'mock-jwt-token') {
    res.json({
      user: mockUsers[0]
    });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json(mockDashboardStats);
});

// Inventory routes
app.get('/api/inventory/products', (req, res) => {
  res.json(mockInventoryItems);
});

app.get('/api/inventory/products/:id', (req, res) => {
  const item = mockInventoryItems.find(i => i.id === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.post('/api/inventory/products', (req, res) => {
  const newItem = {
    id: Date.now().toString(),
    ...req.body,
    totalCost: (req.body.quantity || 0) * (req.body.unitCost || 0),
    lastUpdated: new Date().toISOString()
  };
  mockInventoryItems.push(newItem);
  res.json(newItem);
});

app.put('/api/inventory/products/:id', (req, res) => {
  const index = mockInventoryItems.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    mockInventoryItems[index] = {
      ...mockInventoryItems[index],
      ...req.body,
      totalCost: (req.body.quantity || mockInventoryItems[index].quantity) * 
                 (req.body.unitCost || mockInventoryItems[index].unitCost),
      lastUpdated: new Date().toISOString()
    };
    res.json(mockInventoryItems[index]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/inventory/products/:id', (req, res) => {
  const index = mockInventoryItems.findIndex(i => i.id === req.params.id);
  if (index !== -1) {
    mockInventoryItems.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Supplier routes
app.get('/api/suppliers', (req, res) => {
  res.json(mockSuppliers);
});

app.get('/api/suppliers/:id', (req, res) => {
  const supplier = mockSuppliers.find(s => s.id === req.params.id);
  if (supplier) {
    res.json(supplier);
  } else {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier = {
    id: Date.now().toString(),
    ...req.body,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  mockSuppliers.push(newSupplier);
  res.json(newSupplier);
});

app.put('/api/suppliers/:id', (req, res) => {
  const index = mockSuppliers.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...req.body
    };
    res.json(mockSuppliers[index]);
  } else {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  const index = mockSuppliers.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    mockSuppliers.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

// User management routes
app.get('/api/users', (req, res) => {
  res.json(mockUsers);
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  res.json(newUser);
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Cabinet WMS Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
  console.log(`📦 Inventory API: http://localhost:${PORT}/api/inventory/products`);
  console.log(`🏭 Suppliers API: http://localhost:${PORT}/api/suppliers`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});