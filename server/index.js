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

// Mock suppliers data
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
  }
];

// Mock departments data
const mockDepartments = [
  {
    id: '1',
    name: 'Production',
    code: 'PROD',
    description: 'Manufacturing and production operations',
    manager: 'John Smith',
    budget: 150000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Quality Control',
    code: 'QC',
    description: 'Quality assurance and testing',
    manager: 'Sarah Johnson',
    budget: 75000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Warehouse',
    code: 'WH',
    description: 'Storage and inventory management',
    manager: 'Mike Wilson',
    budget: 100000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Design',
    code: 'DES',
    description: 'Product design and development',
    manager: 'Emily Davis',
    budget: 120000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Maintenance',
    code: 'MAINT',
    description: 'Equipment and facility maintenance',
    manager: 'Robert Brown',
    budget: 80000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock requesters data
const mockRequesters = [
  {
    id: '1',
    name: 'John Smith',
    position: 'Production Manager',
    department: 'Production',
    email: 'john.smith@cabinet-wms.com',
    phone: '(555) 123-4567',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    position: 'Quality Control Lead',
    department: 'Quality Control',
    email: 'sarah.johnson@cabinet-wms.com',
    phone: '(555) 234-5678',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Mike Wilson',
    position: 'Warehouse Supervisor',
    department: 'Warehouse',
    email: 'mike.wilson@cabinet-wms.com',
    phone: '(555) 345-6789',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Emily Davis',
    position: 'Design Lead',
    department: 'Design',
    email: 'emily.davis@cabinet-wms.com',
    phone: '(555) 456-7890',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Robert Brown',
    position: 'Maintenance Technician',
    department: 'Maintenance',
    email: 'robert.brown@cabinet-wms.com',
    phone: '(555) 567-8901',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock orders data
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-0001',
    customerName: 'Johnson Kitchen Renovation',
    customerEmail: 'johnson@email.com',
    customerPhone: '(555) 123-4567',
    customerContact: 'johnson@email.com',
    orderType: 'production',
    priority: 'medium',
    status: 'confirmed',
    orderDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Kitchen renovation project',
    notes: 'Kitchen renovation project',
    estimatedCost: 2500.00,
    actualCost: 0,
    assignedTo: 'John Smith',
    department: 'Production',
    bomCount: 1,
    items: [
      {
        id: '1',
        itemId: 'PLY-18-4X8',
        itemName: 'Plywood 18mm 4x8ft',
        quantity: 10,
        unitCost: 52.75,
        totalCost: 527.50
      }
    ],
    subtotal: 527.50,
    tax: 52.75,
    total: 580.25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-0002',
    customerName: 'Smith Bathroom Remodel',
    customerEmail: 'smith@email.com',
    customerPhone: '(555) 987-6543',
    customerContact: 'smith@email.com',
    orderType: 'custom',
    priority: 'high',
    status: 'pending',
    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Bathroom vanity project',
    notes: 'Bathroom vanity project',
    estimatedCost: 1500.00,
    actualCost: 0,
    assignedTo: 'Sarah Johnson',
    department: 'Design',
    bomCount: 0,
    items: [
      {
        id: '2',
        itemId: 'MDF-18-4X8',
        itemName: 'MDF 18mm 4x8ft',
        quantity: 5,
        unitCost: 38.90,
        totalCost: 194.50
      }
    ],
    subtotal: 194.50,
    tax: 19.45,
    total: 213.95,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock purchase orders data
const mockPurchaseOrders = [
  {
    id: '1',
    poNumber: 'PO-2024-0001',
    supplier: 'Wood Supply Co.',
    status: 'approved',
    items: [
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
    ],
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
    items: [
      {
        id: '3',
        itemId: 'HNG-CONC-35',
        itemName: 'Concealed Hinges 35mm',
        quantity: 200,
        unitCost: 3.25,
        totalCost: 650.00
      }
    ],
    subtotal: 650.00,
    tax: 65.00,
    total: 715.00,
    orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expectedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Standard delivery terms',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock cabinet calculator data
const mockCabinetTemplates = [
  {
    id: '1',
    name: 'Standard Base Cabinet',
    type: 'base',
    width: 600,
    height: 720,
    depth: 560,
    materials: {
      body: 'PLY-18-4X8',
      door: 'MDF-18-4X8',
      shelf: 'PLY-18-4X8'
    },
    hardware: ['HNG-CONC-35'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Standard Wall Cabinet',
    type: 'wall',
    width: 600,
    height: 720,
    depth: 320,
    materials: {
      body: 'PLY-18-4X8',
      door: 'MDF-18-4X8',
      shelf: 'PLY-18-4X8'
    },
    hardware: ['HNG-CONC-35'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockCabinetConfigurations = [
  {
    id: '1',
    name: 'Kitchen Project A',
    cabinets: [
      { templateId: '1', quantity: 4, customizations: {} },
      { templateId: '2', quantity: 6, customizations: {} }
    ],
    totalCost: 2500.00,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockCabinetProjects = [
  {
    id: '1',
    name: 'Modern Kitchen Renovation',
    description: 'Complete kitchen cabinet set for residential project',
    status: 'active',
    configurations: ['1'],
    totalCost: 2500.00,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockBOMs = [
  {
    id: '1',
    bomNumber: 'BOM-2024-001',
    name: 'Kitchen Cabinet BOM',
    version: '1.0',
    linkedType: 'order',
    linkedId: '1',
    linkedNumber: 'ORD-2024-0001',
    status: 'approved',
    description: 'Complete BOM for kitchen cabinet project',
    category: 'Base Cabinets',
    estimatedTime: 24.5,
    items: [
      { 
        id: '1', 
        itemId: 'PLY-18-4X8', 
        itemName: 'Plywood 18mm 4x8ft',
        quantity: 10, 
        unitCost: 52.75, 
        totalCost: 527.50,
        unitMeasurement: 'Sheets (sht)',
        isOptional: false
      },
      { 
        id: '2', 
        itemId: 'MDF-18-4X8', 
        itemName: 'MDF 18mm 4x8ft',
        quantity: 8, 
        unitCost: 38.90, 
        totalCost: 311.20,
        unitMeasurement: 'Sheets (sht)',
        isOptional: false
      },
      { 
        id: '3', 
        itemId: 'HNG-CONC-35', 
        itemName: 'Concealed Hinges 35mm',
        quantity: 20, 
        unitCost: 3.25, 
        totalCost: 65.00,
        unitMeasurement: 'Pieces (pcs)',
        isOptional: false
      }
    ],
    totalCost: 903.70,
    createdBy: 'admin',
    approvedBy: 'manager',
    approvalDate: new Date().toISOString(),
    notes: 'Standard kitchen cabinet configuration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    bomNumber: 'BOM-2024-002',
    name: 'Bathroom Vanity BOM',
    version: '1.0',
    linkedType: 'prototype',
    linkedId: '1',
    linkedNumber: 'PROTO-2024-001',
    status: 'draft',
    description: 'BOM for bathroom vanity prototype',
    category: 'Vanities',
    estimatedTime: 12.0,
    items: [
      { 
        id: '4', 
        itemId: 'MDF-18-4X8', 
        itemName: 'MDF 18mm 4x8ft',
        quantity: 3, 
        unitCost: 38.90, 
        totalCost: 116.70,
        unitMeasurement: 'Sheets (sht)',
        isOptional: false
      },
      { 
        id: '5', 
        itemId: 'HNG-CONC-35', 
        itemName: 'Concealed Hinges 35mm',
        quantity: 4, 
        unitCost: 3.25, 
        totalCost: 13.00,
        unitMeasurement: 'Pieces (pcs)',
        isOptional: true
      }
    ],
    totalCost: 129.70,
    createdBy: 'manager',
    notes: 'Prototype testing phase',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockPrototypes = [
  {
    id: '1',
    prototypeNumber: 'PROTO-2024-001',
    name: 'Prototype Cabinet A',
    description: 'Test design for new cabinet style',
    status: 'testing',
    specifications: {
      width: 600,
      height: 720,
      depth: 560
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    prototypeNumber: 'PROTO-2024-002',
    name: 'Modern Wall Cabinet',
    description: 'Sleek design for contemporary kitchens',
    status: 'approved',
    specifications: {
      width: 800,
      height: 900,
      depth: 350
    },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
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

// Orders routes
app.get('/api/orders', (req, res) => {
  res.json(mockOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    bomCount: 0,
    actualCost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockOrders.push(newOrder);
  res.json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const index = mockOrders.findIndex(o => o.id === req.params.id);
  if (index !== -1) {
    mockOrders[index] = {
      ...mockOrders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockOrders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  const index = mockOrders.findIndex(o => o.id === req.params.id);
  if (index !== -1) {
    mockOrders.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Suppliers routes
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
    isActive: req.body.isActive !== false,
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
      ...req.body,
      updatedAt: new Date().toISOString()
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

// Departments routes
app.get('/api/departments', (req, res) => {
  res.json(mockDepartments);
});

app.get('/api/departments/:id', (req, res) => {
  const department = mockDepartments.find(d => d.id === req.params.id);
  if (department) {
    res.json(department);
  } else {
    res.status(404).json({ error: 'Department not found' });
  }
});

app.post('/api/departments', (req, res) => {
  const newDepartment = {
    id: Date.now().toString(),
    ...req.body,
    isActive: req.body.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockDepartments.push(newDepartment);
  res.json(newDepartment);
});

app.put('/api/departments/:id', (req, res) => {
  const index = mockDepartments.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    mockDepartments[index] = {
      ...mockDepartments[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockDepartments[index]);
  } else {
    res.status(404).json({ error: 'Department not found' });
  }
});

app.delete('/api/departments/:id', (req, res) => {
  const index = mockDepartments.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    mockDepartments.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Department not found' });
  }
});

// Requesters routes
app.get('/api/requesters', (req, res) => {
  res.json(mockRequesters);
});

app.get('/api/requesters/:id', (req, res) => {
  const requester = mockRequesters.find(r => r.id === req.params.id);
  if (requester) {
    res.json(requester);
  } else {
    res.status(404).json({ error: 'Requester not found' });
  }
});

app.post('/api/requesters', (req, res) => {
  const newRequester = {
    id: Date.now().toString(),
    ...req.body,
    isActive: req.body.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockRequesters.push(newRequester);
  res.json(newRequester);
});

app.put('/api/requesters/:id', (req, res) => {
  const index = mockRequesters.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    mockRequesters[index] = {
      ...mockRequesters[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockRequesters[index]);
  } else {
    res.status(404).json({ error: 'Requester not found' });
  }
});

app.delete('/api/requesters/:id', (req, res) => {
  const index = mockRequesters.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    mockRequesters.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Requester not found' });
  }
});

// Purchase Orders routes
app.get('/api/purchase-orders', (req, res) => {
  res.json(mockPurchaseOrders);
});

app.get('/api/purchase-orders/:id', (req, res) => {
  const po = mockPurchaseOrders.find(p => p.id === req.params.id);
  if (po) {
    res.json(po);
  } else {
    res.status(404).json({ error: 'Purchase order not found' });
  }
});

app.post('/api/purchase-orders', (req, res) => {
  const newPO = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPurchaseOrders.push(newPO);
  res.json(newPO);
});

app.put('/api/purchase-orders/:id', (req, res) => {
  const index = mockPurchaseOrders.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockPurchaseOrders[index]);
  } else {
    res.status(404).json({ error: 'Purchase order not found' });
  }
});

app.delete('/api/purchase-orders/:id', (req, res) => {
  const index = mockPurchaseOrders.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPurchaseOrders.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Purchase order not found' });
  }
});

app.patch('/api/purchase-orders/:id/approve', (req, res) => {
  const index = mockPurchaseOrders.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      status: 'approved',
      updatedAt: new Date().toISOString()
    };
    res.json(mockPurchaseOrders[index]);
  } else {
    res.status(404).json({ error: 'Purchase order not found' });
  }
});

// Cabinet Calculator routes
app.get('/api/cabinet-calculator/templates', (req, res) => {
  res.json(mockCabinetTemplates);
});

app.get('/api/cabinet-calculator/templates/:id', (req, res) => {
  const template = mockCabinetTemplates.find(t => t.id === req.params.id);
  if (template) {
    res.json(template);
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

app.post('/api/cabinet-calculator/templates', (req, res) => {
  const newTemplate = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockCabinetTemplates.push(newTemplate);
  res.json(newTemplate);
});

app.put('/api/cabinet-calculator/templates/:id', (req, res) => {
  const index = mockCabinetTemplates.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    mockCabinetTemplates[index] = {
      ...mockCabinetTemplates[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockCabinetTemplates[index]);
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

app.delete('/api/cabinet-calculator/templates/:id', (req, res) => {
  const index = mockCabinetTemplates.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    mockCabinetTemplates.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

app.get('/api/cabinet-calculator/configurations', (req, res) => {
  res.json(mockCabinetConfigurations);
});

app.get('/api/cabinet-calculator/configurations/:id', (req, res) => {
  const config = mockCabinetConfigurations.find(c => c.id === req.params.id);
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: 'Configuration not found' });
  }
});

app.post('/api/cabinet-calculator/configurations', (req, res) => {
  const newConfig = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockCabinetConfigurations.push(newConfig);
  res.json(newConfig);
});

app.put('/api/cabinet-calculator/configurations/:id', (req, res) => {
  const index = mockCabinetConfigurations.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    mockCabinetConfigurations[index] = {
      ...mockCabinetConfigurations[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockCabinetConfigurations[index]);
  } else {
    res.status(404).json({ error: 'Configuration not found' });
  }
});

app.delete('/api/cabinet-calculator/configurations/:id', (req, res) => {
  const index = mockCabinetConfigurations.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    mockCabinetConfigurations.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Configuration not found' });
  }
});

app.get('/api/cabinet-calculator/projects', (req, res) => {
  res.json(mockCabinetProjects);
});

app.get('/api/cabinet-calculator/projects/:id', (req, res) => {
  const project = mockCabinetProjects.find(p => p.id === req.params.id);
  if (project) {
    res.json(project);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.post('/api/cabinet-calculator/projects', (req, res) => {
  const newProject = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockCabinetProjects.push(newProject);
  res.json(newProject);
});

app.put('/api/cabinet-calculator/projects/:id', (req, res) => {
  const index = mockCabinetProjects.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockCabinetProjects[index] = {
      ...mockCabinetProjects[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockCabinetProjects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/cabinet-calculator/projects/:id', (req, res) => {
  const index = mockCabinetProjects.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockCabinetProjects.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.post('/api/cabinet-calculator/nesting', (req, res) => {
  // Mock nesting optimization response
  const { panels } = req.body;
  const mockNestingResult = {
    sheets: [
      {
        id: 1,
        material: 'PLY-18-4X8',
        width: 2440,
        height: 1220,
        thickness: 18,
        panels: panels?.slice(0, Math.ceil(panels.length / 2)) || [],
        efficiency: 85.5
      }
    ],
    totalSheets: 1,
    totalEfficiency: 85.5,
    wastePercentage: 14.5
  };
  res.json(mockNestingResult);
});

// BOM Management routes
app.get('/api/boms', (req, res) => {
  res.json(mockBOMs);
});

app.get('/api/boms/:id', (req, res) => {
  const bom = mockBOMs.find(b => b.id === req.params.id);
  if (bom) {
    res.json(bom);
  } else {
    res.status(404).json({ error: 'BOM not found' });
  }
});

app.post('/api/boms', (req, res) => {
  const newBOM = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockBOMs.push(newBOM);
  res.json(newBOM);
});

app.put('/api/boms/:id', (req, res) => {
  const index = mockBOMs.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    mockBOMs[index] = {
      ...mockBOMs[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockBOMs[index]);
  } else {
    res.status(404).json({ error: 'BOM not found' });
  }
});

app.delete('/api/boms/:id', (req, res) => {
  const index = mockBOMs.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    mockBOMs.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'BOM not found' });
  }
});

// Prototype Management routes
app.get('/api/prototypes', (req, res) => {
  res.json(mockPrototypes);
});

app.get('/api/prototypes/:id', (req, res) => {
  const prototype = mockPrototypes.find(p => p.id === req.params.id);
  if (prototype) {
    res.json(prototype);
  } else {
    res.status(404).json({ error: 'Prototype not found' });
  }
});

app.post('/api/prototypes', (req, res) => {
  const newPrototype = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPrototypes.push(newPrototype);
  res.json(newPrototype);
});

app.put('/api/prototypes/:id', (req, res) => {
  const index = mockPrototypes.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPrototypes[index] = {
      ...mockPrototypes[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json(mockPrototypes[index]);
  } else {
    res.status(404).json({ error: 'Prototype not found' });
  }
});

app.delete('/api/prototypes/:id', (req, res) => {
  const index = mockPrototypes.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    mockPrototypes.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Prototype not found' });
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