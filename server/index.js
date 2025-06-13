import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database initialization
import { initDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments.js';
import requesterRoutes from './routes/requesters.js';
import orderRoutes from './routes/orders.js';
import bomRoutes from './routes/boms.js';
import prototypeRoutes from './routes/prototypes.js';
import purchaseOrderRoutes from './routes/purchase-orders.js';
import supplierRoutes from './routes/suppliers.js';
import cabinetCalculatorRoutes from './routes/cabinet-calculator.js';

// ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced error handling for startup
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false // In production, serve from same origin
    : ['http://localhost:3000', 'http://localhost:5173', 'https://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.4:5173']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/requesters', requesterRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/cabinet-calculator', cabinetCalculatorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  process.exit(0);
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Cabinet WMS Server...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Node.js version: ${process.version}`);
    
    // Initialize database with better error handling
    console.log('🔄 Initializing database...');
    try {
      await initDatabase();
      console.log('✅ Database initialized successfully');
    } catch (dbError) {
      console.error('❌ Database initialization failed:', dbError.message);
      console.warn('⚠️  Server will continue without database - some features may not work');
      // Don't exit - let the server start anyway for debugging
    }
    
    // Check if port is available
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('========================================');
      console.log('   Cabinet WMS Server Started');
      console.log('========================================');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 IPv4 access: http://127.0.0.1:${PORT}`);
      console.log(`🔐 Authentication: ENABLED`);
      console.log(`🛡️  Security middleware: ACTIVE`);
      console.log('');
      console.log('Default login credentials:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('');
      console.log('  Username: manager');
      console.log('  Password: manager123');
      console.log('========================================');
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('Please stop any other processes using this port or change the PORT in .env');
        console.error(`You can check what's using the port with: netstat -ano | findstr :${PORT} (Windows) or lsof -ti:${PORT} (Mac/Linux)`);
        console.error(`To kill the process: taskkill /PID <PID> /F (Windows) or kill -9 <PID> (Mac/Linux)`);
      } else if (err.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}`);
        console.error('Try using a port number above 1024 or run with appropriate permissions');
      } else {
        console.error('❌ Server error:', err.message);
      }
      process.exit(1);
    });

    // Test server is responding
    setTimeout(() => {
      console.log('🔍 Testing server health...');
      fetch(`http://127.0.0.1:${PORT}/api/health`)
        .then(response => response.json())
        .then(data => {
          console.log('✅ Server health check passed:', data.status);
        })
        .catch(err => {
          console.warn('⚠️  Server health check failed:', err.message);
        });
    }, 1000);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide helpful error messages
    if (error.message.includes('EACCES')) {
      console.error('💡 This appears to be a permissions issue. Try:');
      console.error('   - Running with appropriate permissions');
      console.error('   - Using a different port number');
      console.error('   - Checking file/directory permissions');
    } else if (error.message.includes('ENOENT')) {
      console.error('💡 File or directory not found. Check:');
      console.error('   - Database path configuration');
      console.error('   - File system permissions');
      console.error('   - Project directory structure');
    } else if (error.message.includes('EADDRINUSE')) {
      console.error('💡 Port is already in use. Try:');
      console.error('   - Stopping other processes using the port');
      console.error('   - Using a different PORT in .env');
      console.error(`   - Running: lsof -ti:${PORT} | xargs kill (Mac/Linux)`);
      console.error(`   - Running: netstat -ano | findstr :${PORT} then taskkill /PID <PID> /F (Windows)`);
    } else if (error.message.includes('libsql')) {
      console.error('💡 LibSQL library issue. Try:');
      console.error('   - Reinstalling dependencies: npm install');
      console.error('   - Checking Node.js version compatibility');
      console.error('   - Installing build tools if needed');
    }
    
    process.exit(1);
  }
};

startServer();