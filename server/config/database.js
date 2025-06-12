import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple data directory locations with fallback to temp directory
const getDataDirectory = () => {
  const possibleDirs = [
    path.join(__dirname, '../data'),
    path.join(process.cwd(), 'server/data'),
    path.join(os.tmpdir(), 'cabinet-wms-data')
  ];

  for (const dir of possibleDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write permissions
      const testFile = path.join(dir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('📁 Using data directory:', dir);
      return dir;
    } catch (error) {
      console.warn(`⚠️  Cannot use directory ${dir}:`, error.message);
      continue;
    }
  }
  
  console.warn('⚠️  No writable directory found, using in-memory database');
  return null;
};

let dataDir;
let dbPath;

try {
  dataDir = getDataDirectory();
  dbPath = dataDir ? path.join(dataDir, 'cabinet_wms.db') : ':memory:';
} catch (error) {
  console.error('❌ Failed to initialize data directory:', error.message);
  // Use in-memory database as fallback
  dbPath = ':memory:';
  console.warn('⚠️  Using in-memory database - data will not persist');
}

let db = null;
let isConnected = false;
let connectionError = null;

// Create database tables
const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'storekeeper',
      permissions TEXT NOT NULL DEFAULT '[]',
      password_changed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      item_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL GENERATED ALWAYS AS (quantity * unit_cost) STORED,
      location TEXT,
      supplier TEXT,
      unit_measurement TEXT DEFAULT 'Each (ea)',
      min_stock_level INTEGER DEFAULT 0,
      max_stock_level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createRequisitionsTable = `
    CREATE TABLE IF NOT EXISTS requisitions (
      id TEXT PRIMARY KEY,
      request_number TEXT UNIQUE NOT NULL,
      requester TEXT NOT NULL,
      department TEXT NOT NULL,
      order_number TEXT,
      bom_number TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_by TEXT,
      approval_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createRequisitionItemsTable = `
    CREATE TABLE IF NOT EXISTS requisition_items (
      id TEXT PRIMARY KEY,
      requisition_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      requested_quantity INTEGER NOT NULL,
      approved_quantity INTEGER,
      unit_cost REAL NOT NULL,
      total_cost REAL GENERATED ALWAYS AS (requested_quantity * unit_cost) STORED,
      stock_on_hand INTEGER DEFAULT 0,
      is_over_stock BOOLEAN DEFAULT 0,
      FOREIGN KEY (requisition_id) REFERENCES requisitions (id) ON DELETE CASCADE
    )
  `;

  const createPurchaseOrdersTable = `
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT UNIQUE NOT NULL,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_delivery DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createSuppliersTable = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      address TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createDepartmentsTable = `
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      manager TEXT,
      cost_center TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createRequestersTable = `
    CREATE TABLE IF NOT EXISTS requesters (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT,
      position TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_contact TEXT,
      order_type TEXT NOT NULL DEFAULT 'production',
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT NOT NULL DEFAULT 'medium',
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NOT NULL,
      completed_date DATETIME,
      description TEXT,
      notes TEXT,
      estimated_cost REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      assigned_to TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createBomsTable = `
    CREATE TABLE IF NOT EXISTS boms (
      id TEXT PRIMARY KEY,
      bom_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      version TEXT DEFAULT '1.0',
      linked_type TEXT NOT NULL,
      linked_id TEXT NOT NULL,
      linked_number TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      description TEXT,
      category TEXT,
      items TEXT DEFAULT '[]',
      total_cost REAL DEFAULT 0,
      estimated_time REAL DEFAULT 0,
      created_by TEXT,
      approved_by TEXT,
      approval_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createPrototypesTable = `
    CREATE TABLE IF NOT EXISTS prototypes (
      id TEXT PRIMARY KEY,
      prototype_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'concept',
      category TEXT,
      designer TEXT,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      approval_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // New tables for Cabinet Calculator
  const createCabinetTemplatesTable = `
    CREATE TABLE IF NOT EXISTS cabinet_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      default_dimensions TEXT NOT NULL,
      min_dimensions TEXT NOT NULL,
      max_dimensions TEXT NOT NULL,
      preview_image TEXT NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL,
      material_thickness TEXT NOT NULL,
      hardware TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      is_custom BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createCabinetConfigurationsTable = `
    CREATE TABLE IF NOT EXISTS cabinet_configurations (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      customizations TEXT NOT NULL,
      materials TEXT NOT NULL,
      hardware TEXT NOT NULL,
      cutting_list TEXT NOT NULL,
      total_cost REAL NOT NULL,
      labor_cost REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createCabinetProjectsTable = `
    CREATE TABLE IF NOT EXISTS cabinet_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      customer_name TEXT NOT NULL,
      customer_contact TEXT,
      configurations TEXT NOT NULL,
      total_material_cost REAL NOT NULL,
      total_labor_cost REAL NOT NULL,
      total_hardware_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      estimated_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    console.log('📋 Creating database tables...');
    
    await db.exec(createUsersTable);
    await db.exec(createProductsTable);
    await db.exec(createRequisitionsTable);
    await db.exec(createRequisitionItemsTable);
    await db.exec(createPurchaseOrdersTable);
    await db.exec(createSuppliersTable);
    await db.exec(createDepartmentsTable);
    await db.exec(createRequestersTable);
    await db.exec(createOrdersTable);
    await db.exec(createBomsTable);
    await db.exec(createPrototypesTable);
    
    // Create Cabinet Calculator tables
    await db.exec(createCabinetTemplatesTable);
    await db.exec(createCabinetConfigurationsTable);
    await db.exec(createCabinetProjectsTable);

    // Add password_changed column if it doesn't exist (for existing databases)
    try {
      await db.exec('ALTER TABLE users ADD COLUMN password_changed BOOLEAN DEFAULT 0');
      console.log('✅ Added password_changed column to users table');
    } catch (error) {
      // Column already exists, ignore error
    }

    console.log('👤 Checking for existing users...');

    // Check if ANY users exist in the database
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    console.log('Current user count:', userCount.count);

    // Only create default users if NO users exist at all
    if (userCount.count === 0) {
      console.log('🔧 No users found, creating default users...');
      
      // Create admin user
      const adminHashedPassword = bcrypt.hashSync('admin123', 10);
      await db.run(
        'INSERT INTO users (id, username, email, password, role, permissions, password_changed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['1', 'admin', 'admin@cabinet-wms.com', adminHashedPassword, 'admin', JSON.stringify(['*']), 0]
      );
      console.log('✅ Default admin user created (admin/admin123)');

      // Create manager user
      const managerHashedPassword = bcrypt.hashSync('manager123', 10);
      await db.run(
        'INSERT INTO users (id, username, email, password, role, permissions, password_changed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['2', 'manager', 'manager@cabinet-wms.com', managerHashedPassword, 'manager', JSON.stringify(['dashboard.view', 'inventory.view', 'requisitions.*', 'purchase_orders.*']), 0]
      );
      console.log('✅ Default manager user created (manager/manager123)');
    } else {
      console.log('✅ Users already exist - preserving existing passwords');
      
      // List existing users (without passwords)
      const existingUsers = await db.all('SELECT id, username, email, role, password_changed FROM users');
      console.log('Existing users:', existingUsers.map(u => `${u.username} (${u.role}) - Password changed: ${u.password_changed ? 'Yes' : 'No'}`).join(', '));
    }

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

// Initialize database connection
const initDatabase = async () => {
  try {
    console.log('🔄 Initializing SQLite database...');
    console.log(`📁 Database path: ${dbPath}`);
    
    // Check if directory is writable (skip for in-memory database)
    if (dbPath !== ':memory:' && dataDir) {
      try {
        fs.accessSync(dataDir, fs.constants.W_OK);
        console.log('✅ Data directory is writable');
      } catch (err) {
        console.warn('⚠️  Data directory write check failed:', err.message);
        console.warn('⚠️  Falling back to in-memory database...');
        dbPath = ':memory:';
      }
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Test database connection
    await db.get('SELECT 1');
    console.log('✅ Database connection established');
    
    // Create tables if they don't exist
    await createTables();
    
    if (dbPath === ':memory:') {
      console.log('⚠️  Using in-memory database - data will not persist between restarts');
    } else {
      console.log('✅ SQLite database initialized successfully');
    }
    
    isConnected = true;
    connectionError = null;
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('Stack trace:', err.stack);
    
    // Try to fall back to in-memory database
    if (dbPath !== ':memory:') {
      console.warn('⚠️  Attempting fallback to in-memory database...');
      try {
        dbPath = ':memory:';
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        await db.exec('PRAGMA foreign_keys = ON');
        await db.get('SELECT 1');
        await createTables();
        
        console.log('✅ Fallback to in-memory database successful');
        console.log('⚠️  Data will not persist between restarts');
        isConnected = true;
        connectionError = null;
        return;
      } catch (fallbackErr) {
        console.error('❌ Fallback to in-memory database also failed:', fallbackErr.message);
      }
    }
    
    isConnected = false;
    connectionError = err;
    
    // Provide helpful error messages
    if (err.message.includes('EACCES') || err.message.includes('EPERM')) {
      console.error('💡 This appears to be a permissions issue. Try:');
      console.error('   - Running with appropriate permissions');
      console.error('   - Checking file/directory permissions');
      console.error('   - Using: chmod -R 775 server/data');
    } else if (err.message.includes('ENOENT')) {
      console.error('💡 File or directory not found. Check:');
      console.error('   - Database path configuration');
      console.error('   - File system permissions');
    }
    
    throw err;
  }
};

// Generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Enhanced query method with fallback
const query = async (sql, params = []) => {
  if (!isConnected || !db) {
    console.warn('Database not available - returning mock data');
    return { rows: [], changes: 0, lastID: null };
  }
  
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sql, params);
      return { rows, rowCount: rows.length };
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = await db.run(sql, params);
      return { rows: [], changes: result.changes, lastID: result.lastID };
    } else {
      const result = await db.run(sql, params);
      return { rows: [], changes: result.changes };
    }
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
};

// Get single record
const get = async (sql, params = []) => {
  if (!isConnected || !db) {
    return null;
  }
  
  try {
    return await db.get(sql, params);
  } catch (err) {
    console.error('Database get error:', err.message);
    throw err;
  }
};

// Export enhanced database with status methods and initialization function
export default {
  query,
  get,
  run: async (sql, params = []) => {
    if (!isConnected || !db) {
      return { changes: 0, lastID: null };
    }
    return await db.run(sql, params);
  },
  all: async (sql, params = []) => {
    if (!isConnected || !db) {
      return [];
    }
    return await db.all(sql, params);
  },
  isConnected: () => isConnected,
  getConnectionError: () => connectionError,
  generateUUID,
  close: async () => {
    if (db) {
      await db.close();
    }
  }
};

// Export the initialization function
export { initDatabase };