import sqlite3_module from 'sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const sqlite3 = sqlite3_module.verbose();
dotenv.config();

// Get database path from environment variables or use default
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'server', 'data', 'cabinet_wms.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Retry mechanism for database operations
const retryDatabaseOperation = (operation, maxRetries = 5, delay = 100) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attempt = () => {
      attempts++;
      operation((err, result) => {
        if (err) {
          if (err.code === 'SQLITE_BUSY' && attempts < maxRetries) {
            console.log(`Database busy, retrying attempt ${attempts}/${maxRetries}...`);
            setTimeout(attempt, delay * attempts); // Exponential backoff
            return;
          }
          reject(err);
        } else {
          resolve(result);
        }
      });
    };
    
    attempt();
  });
};

// Create the raw database connection
const rawDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
    
    // Configure busy timeout to handle concurrent access - increased to 30 seconds
    rawDb.configure('busyTimeout', 30000);
    
    // Set WAL mode for better concurrency
    rawDb.run('PRAGMA journal_mode = WAL;', (err) => {
      if (err) {
        console.error('Error setting WAL mode:', err.message);
      } else {
        console.log('Database set to WAL mode for better concurrency');
      }
    });
    
    // Set synchronous mode to NORMAL for better performance
    rawDb.run('PRAGMA synchronous = NORMAL;', (err) => {
      if (err) {
        console.error('Error setting synchronous mode:', err.message);
      } else {
        console.log('Database synchronous mode set to NORMAL');
      }
    });
    
    initializeDatabase();
  }
});

// Create a wrapper that applies retry logic to all database operations
const createDatabaseWrapper = (rawDatabase) => {
  const wrapper = {
    // Wrap the run method with retry logic
    run: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      return retryDatabaseOperation((retryCallback) => {
        rawDatabase.run(sql, params, retryCallback);
      }).then(result => {
        if (callback) callback(null, result);
        return result;
      }).catch(err => {
        if (callback) callback(err);
        throw err;
      });
    },

    // Wrap the get method with retry logic
    get: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      return retryDatabaseOperation((retryCallback) => {
        rawDatabase.get(sql, params, retryCallback);
      }).then(result => {
        if (callback) callback(null, result);
        return result;
      }).catch(err => {
        if (callback) callback(err);
        throw err;
      });
    },

    // Wrap the all method with retry logic
    all: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      return retryDatabaseOperation((retryCallback) => {
        rawDatabase.all(sql, params, retryCallback);
      }).then(result => {
        if (callback) callback(null, result);
        return result;
      }).catch(err => {
        if (callback) callback(err);
        throw err;
      });
    },

    // Wrap the each method with retry logic
    each: function(sql, params, callback, complete) {
      if (typeof params === 'function') {
        complete = callback;
        callback = params;
        params = [];
      }
      
      return retryDatabaseOperation((retryCallback) => {
        rawDatabase.each(sql, params, callback, retryCallback);
      }).then(result => {
        if (complete) complete(null, result);
        return result;
      }).catch(err => {
        if (complete) complete(err);
        throw err;
      });
    },

    // Wrap the prepare method with retry logic
    prepare: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = rawDatabase.prepare(sql, params, callback);
      
      // Wrap statement methods with retry logic
      const originalRun = stmt.run.bind(stmt);
      const originalGet = stmt.get.bind(stmt);
      const originalAll = stmt.all.bind(stmt);
      const originalEach = stmt.each.bind(stmt);
      
      stmt.run = function(params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        
        return retryDatabaseOperation((retryCallback) => {
          originalRun(params, retryCallback);
        }).then(result => {
          if (callback) callback(null, result);
          return result;
        }).catch(err => {
          if (callback) callback(err);
          throw err;
        });
      };
      
      stmt.get = function(params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        
        return retryDatabaseOperation((retryCallback) => {
          originalGet(params, retryCallback);
        }).then(result => {
          if (callback) callback(null, result);
          return result;
        }).catch(err => {
          if (callback) callback(err);
          throw err;
        });
      };
      
      stmt.all = function(params, callback) {
        if (typeof params === 'function') {
          callback = params;
          params = [];
        }
        
        return retryDatabaseOperation((retryCallback) => {
          originalAll(params, retryCallback);
        }).then(result => {
          if (callback) callback(null, result);
          return result;
        }).catch(err => {
          if (callback) callback(err);
          throw err;
        });
      };
      
      stmt.each = function(params, callback, complete) {
        if (typeof params === 'function') {
          complete = callback;
          callback = params;
          params = [];
        }
        
        return retryDatabaseOperation((retryCallback) => {
          originalEach(params, callback, retryCallback);
        }).then(result => {
          if (complete) complete(null, result);
          return result;
        }).catch(err => {
          if (complete) complete(err);
          throw err;
        });
      };
      
      return stmt;
    },

    // Pass through other methods and properties
    serialize: rawDatabase.serialize.bind(rawDatabase),
    parallelize: rawDatabase.parallelize.bind(rawDatabase),
    configure: rawDatabase.configure.bind(rawDatabase),
    close: rawDatabase.close.bind(rawDatabase),
    interrupt: rawDatabase.interrupt.bind(rawDatabase),
    
    // Add promise-based methods for easier async/await usage
    runAsync: function(sql, params = []) {
      return retryDatabaseOperation((callback) => {
        rawDatabase.run(sql, params, callback);
      });
    },
    
    getAsync: function(sql, params = []) {
      return retryDatabaseOperation((callback) => {
        rawDatabase.get(sql, params, callback);
      });
    },
    
    allAsync: function(sql, params = []) {
      return retryDatabaseOperation((callback) => {
        rawDatabase.all(sql, params, callback);
      });
    }
  };
  
  return wrapper;
};

// Create the wrapped database instance
const db = createDatabaseWrapper(rawDb);

// Initialize database tables if they don't exist
function initializeDatabase() {
  // Serialize all database operations to prevent concurrency issues
  rawDb.serialize(() => {
    // Enable foreign keys
    rawDb.run('PRAGMA foreign_keys = ON');

    // Create users table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table initialized');
        // Check if we need to seed default users with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM users', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultUsers();
          }
        })
        .catch((err) => {
          console.error('Error checking users count:', err.message);
        });
      }
    });

    // Create inventory_items table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        itemId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subCategory TEXT,
        quantity REAL NOT NULL,
        unitCost REAL NOT NULL,
        totalCost REAL NOT NULL,
        location TEXT,
        supplier TEXT,
        unitMeasurement TEXT,
        minStockLevel REAL,
        maxStockLevel REAL,
        lastUpdated TEXT NOT NULL
      )
    `, function(err) {
      if (err) {
        console.error('Error creating inventory_items table:', err.message);
      } else {
        console.log('Inventory items table initialized');
        // Check if we need to seed default inventory items with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM inventory_items', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultInventoryItems();
          }
        })
        .catch((err) => {
          console.error('Error checking inventory items count:', err.message);
        });
      }
    });

    // Create suppliers table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        contactPerson TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    `, function(err) {
      if (err) {
        console.error('Error creating suppliers table:', err.message);
      } else {
        console.log('Suppliers table initialized');
        // Check if we need to seed default suppliers with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM suppliers', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultSuppliers();
          }
        })
        .catch((err) => {
          console.error('Error checking suppliers count:', err.message);
        });
      }
    });

    // Create departments table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        manager TEXT,
        costCenter TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) {
        console.error('Error creating departments table:', err.message);
      } else {
        console.log('Departments table initialized');
        // Check if we need to seed default departments with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM departments', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultDepartments();
          }
        })
        .catch((err) => {
          console.error('Error checking departments count:', err.message);
        });
      }
    });

    // Create requesters table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS requesters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        employeeId TEXT UNIQUE NOT NULL,
        department TEXT,
        position TEXT,
        phone TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) {
        console.error('Error creating requesters table:', err.message);
      } else {
        console.log('Requesters table initialized');
        // Check if we need to seed default requesters with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM requesters', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultRequesters();
          }
        })
        .catch((err) => {
          console.error('Error checking requesters count:', err.message);
        });
      }
    });

    // Create purchase_orders table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        poNumber TEXT UNIQUE NOT NULL,
        supplier TEXT NOT NULL,
        status TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        orderDate TEXT NOT NULL,
        expectedDelivery TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `, function(err) {
      if (err) {
        console.error('Error creating purchase_orders table:', err.message);
      } else {
        console.log('Purchase orders table initialized');
        // Check if we need to seed default purchase orders with retry mechanism
        retryDatabaseOperation((callback) => {
          rawDb.get('SELECT COUNT(*) as count FROM purchase_orders', callback);
        })
        .then((row) => {
          if (row.count === 0) {
            seedDefaultPurchaseOrders();
          }
        })
        .catch((err) => {
          console.error('Error checking purchase orders count:', err.message);
        });
      }
    });

    // Create purchase_order_items table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id TEXT PRIMARY KEY,
        poId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        itemName TEXT NOT NULL,
        quantity REAL NOT NULL,
        unitCost REAL NOT NULL,
        totalCost REAL NOT NULL,
        FOREIGN KEY (poId) REFERENCES purchase_orders(id) ON DELETE CASCADE
      )
    `, function(err) {
      if (err) {
        console.error('Error creating purchase_order_items table:', err.message);
      } else {
        console.log('Purchase order items table initialized');
      }
    });

    // Create cabinet_templates table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS cabinet_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        defaultDimensions TEXT NOT NULL,
        minDimensions TEXT NOT NULL,
        maxDimensions TEXT NOT NULL,
        previewImage TEXT,
        description TEXT,
        features TEXT,
        construction TEXT,
        materialThickness TEXT NOT NULL,
        hardware TEXT NOT NULL,
        parts TEXT,
        hardwareItems TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        isCustom INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `, function(err) {
      if (err) {
        console.error('Error creating cabinet_templates table:', err.message);
      } else {
        console.log('Cabinet templates table initialized');
      }
    });

    // Create cabinet_configurations table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS cabinet_configurations (
        id TEXT PRIMARY KEY,
        templateId TEXT NOT NULL,
        name TEXT NOT NULL,
        dimensions TEXT NOT NULL,
        customizations TEXT NOT NULL,
        materials TEXT NOT NULL,
        hardware TEXT NOT NULL,
        cuttingList TEXT NOT NULL,
        totalCost REAL NOT NULL,
        laborCost REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `, function(err) {
      if (err) {
        console.error('Error creating cabinet_configurations table:', err.message);
      } else {
        console.log('Cabinet configurations table initialized');
      }
    });

    // Create cabinet_projects table
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS cabinet_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        customerName TEXT NOT NULL,
        customerContact TEXT,
        configurations TEXT NOT NULL,
        totalMaterialCost REAL NOT NULL,
        totalHardwareCost REAL NOT NULL,
        totalLaborCost REAL NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        estimatedDays INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `, function(err) {
      if (err) {
        console.error('Error creating cabinet_projects table:', err.message);
      } else {
        console.log('Cabinet projects table initialized');
      }
    });
  });
}

// Seed default users
function seedDefaultUsers() {
  const defaultUsers = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@cabinet-wms.com',
      password: 'admin123', // In a real app, this would be hashed
      role: 'admin',
      permissions: JSON.stringify(['*']),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@cabinet-wms.com',
      password: 'manager123', // In a real app, this would be hashed
      role: 'manager',
      permissions: JSON.stringify(['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*']),
      createdAt: new Date().toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password, role, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  defaultUsers.forEach(user => {
    stmt.run(
      user.id,
      user.username,
      user.email,
      user.password,
      user.role,
      user.permissions,
      user.createdAt
    );
  });

  stmt.finalize();
  console.log('Default users seeded');
}

// Seed default inventory items
function seedDefaultInventoryItems() {
  const defaultItems = [
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
      lastUpdated: new Date().toISOString()
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
      lastUpdated: new Date().toISOString()
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
      lastUpdated: new Date().toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO inventory_items (
      id, itemId, name, category, subCategory, quantity, unitCost, totalCost,
      location, supplier, unitMeasurement, minStockLevel, maxStockLevel, lastUpdated
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultItems.forEach(item => {
    stmt.run(
      item.id,
      item.itemId,
      item.name,
      item.category,
      item.subCategory,
      item.quantity,
      item.unitCost,
      item.totalCost,
      item.location,
      item.supplier,
      item.unitMeasurement,
      item.minStockLevel,
      item.maxStockLevel,
      item.lastUpdated
    );
  });

  stmt.finalize();
  console.log('Default inventory items seeded');
}

// Seed default suppliers
function seedDefaultSuppliers() {
  const defaultSuppliers = [
    {
      id: '1',
      name: 'Wood Supply Co.',
      contactPerson: 'John Anderson',
      phone: '(555) 123-4567',
      email: 'orders@woodsupply.com',
      address: '123 Industrial Blvd, Manufacturing City, MC 12345',
      isActive: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Hardware Plus',
      contactPerson: 'Sarah Mitchell',
      phone: '(555) 987-6543',
      email: 'sales@hardwareplus.com',
      address: '456 Hardware Ave, Supply Town, ST 67890',
      isActive: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Laminate Plus',
      contactPerson: 'Mike Johnson',
      phone: '(555) 456-7890',
      email: 'info@laminateplus.com',
      address: '789 Laminate Dr, Finish City, FC 11111',
      isActive: 1,
      createdAt: new Date().toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO suppliers (id, name, contactPerson, phone, email, address, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultSuppliers.forEach(supplier => {
    stmt.run(
      supplier.id,
      supplier.name,
      supplier.contactPerson,
      supplier.phone,
      supplier.email,
      supplier.address,
      supplier.isActive,
      supplier.createdAt
    );
  });

  stmt.finalize();
  console.log('Default suppliers seeded');
}

// Seed default departments
function seedDefaultDepartments() {
  const defaultDepartments = [
    {
      id: '1',
      name: 'Production',
      code: 'PROD',
      description: 'Manufacturing and production operations',
      manager: 'John Smith',
      costCenter: 'CC001',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Quality Control',
      code: 'QC',
      description: 'Quality assurance and testing',
      manager: 'Sarah Johnson',
      costCenter: 'CC002',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Warehouse',
      code: 'WH',
      description: 'Storage and inventory management',
      manager: 'Mike Wilson',
      costCenter: 'CC003',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO departments (id, name, code, description, manager, costCenter, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultDepartments.forEach(dept => {
    stmt.run(
      dept.id,
      dept.name,
      dept.code,
      dept.description,
      dept.manager,
      dept.costCenter,
      dept.isActive,
      dept.createdAt,
      dept.updatedAt
    );
  });

  stmt.finalize();
  console.log('Default departments seeded');
}

// Seed default requesters
function seedDefaultRequesters() {
  const defaultRequesters = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@cabinet-wms.com',
      employeeId: 'EMP001',
      department: 'Production',
      position: 'Production Manager',
      phone: '(555) 123-4567',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@cabinet-wms.com',
      employeeId: 'EMP002',
      department: 'Quality Control',
      position: 'Quality Control Lead',
      phone: '(555) 234-5678',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@cabinet-wms.com',
      employeeId: 'EMP003',
      department: 'Warehouse',
      position: 'Warehouse Supervisor',
      phone: '(555) 345-6789',
      isActive: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO requesters (id, name, email, employeeId, department, position, phone, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultRequesters.forEach(requester => {
    stmt.run(
      requester.id,
      requester.name,
      requester.email,
      requester.employeeId,
      requester.department,
      requester.position,
      requester.phone,
      requester.isActive,
      requester.createdAt,
      requester.updatedAt
    );
  });

  stmt.finalize();
  console.log('Default requesters seeded');
}

// Seed default purchase orders
function seedDefaultPurchaseOrders() {
  const defaultPOs = [
    {
      id: '1',
      poNumber: 'PO-2024-0001',
      supplier: 'Wood Supply Co.',
      status: 'approved',
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

  const defaultPOItems = [
    {
      id: '1',
      poId: '1',
      itemId: 'PLY-18-4X8',
      itemName: 'Plywood 18mm 4x8ft',
      quantity: 50,
      unitCost: 52.75,
      totalCost: 2637.50
    },
    {
      id: '2',
      poId: '1',
      itemId: 'MDF-18-4X8',
      itemName: 'MDF 18mm 4x8ft',
      quantity: 30,
      unitCost: 38.90,
      totalCost: 1167.00
    },
    {
      id: '3',
      poId: '2',
      itemId: 'HNG-CONC-35',
      itemName: 'Concealed Hinges 35mm',
      quantity: 200,
      unitCost: 3.25,
      totalCost: 650.00
    }
  ];

  // Use db.serialize to ensure sequential execution and wrap in transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION;', (err) => {
      if (err) {
        console.error('Error starting transaction:', err.message);
        return;
      }

      // Insert purchase orders first
      const poStmt = db.prepare(`
        INSERT INTO purchase_orders (
          id, poNumber, supplier, status, subtotal, tax, total,
          orderDate, expectedDelivery, notes, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultPOs.forEach(po => {
        poStmt.run(
          po.id,
          po.poNumber,
          po.supplier,
          po.status,
          po.subtotal,
          po.tax,
          po.total,
          po.orderDate,
          po.expectedDelivery,
          po.notes,
          po.createdAt,
          po.updatedAt
        );
      });

      poStmt.finalize((err) => {
        if (err) {
          console.error('Error inserting purchase orders:', err.message);
          db.run('ROLLBACK;');
          return;
        }

        // Insert purchase order items after purchase orders are committed
        const itemStmt = db.prepare(`
          INSERT INTO purchase_order_items (id, poId, itemId, itemName, quantity, unitCost, totalCost)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        defaultPOItems.forEach(item => {
          itemStmt.run(
            item.id,
            item.poId,
            item.itemId,
            item.itemName,
            item.quantity,
            item.unitCost,
            item.totalCost
          );
        });

        itemStmt.finalize((err) => {
          if (err) {
            console.error('Error inserting purchase order items:', err.message);
            db.run('ROLLBACK;');
            return;
          }

          // Commit the transaction
          db.run('COMMIT;', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK;');
            } else {
              console.log('Default purchase orders seeded');
              console.log('Default purchase order items seeded');
            }
          });
        });
      });
    });
  });
}

// Export database connection
export default db;