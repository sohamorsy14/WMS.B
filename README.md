# Cabinet Warehouse Management System (WMS)

A comprehensive warehouse management system specifically designed for kitchen cabinet manufacturing companies. This system runs locally and can be accessed by multiple users over LAN.

## Features

### Core Functionality
- **Dashboard**: Real-time KPIs, charts, and quick actions
- **Inventory Management**: Complete stock management with Excel import/PDF export
- **Requisition System**: Request workflow with approval process
- **Purchase Order Management**: PO creation and tracking
- **Cabinet Cost Calculator**: Visual cabinet configurator with cost calculation
- **User Management**: Role-based access control with JWT authentication

### Technical Features
- **Offline-First**: Runs entirely locally without internet dependency
- **LAN Access**: Accessible via host PC IP address
- **Role-Based Security**: Admin, Manager, Storekeeper, Purchaser roles
- **Data Import/Export**: Excel import, PDF export capabilities
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- React Hook Form for form management
- Axios for API communication

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- bcrypt for password hashing

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cabinet-wms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb cabinet_wms
   
   # Copy environment file
   cp .env.example .env
   
   # Edit .env with your database credentials
   ```

4. **Run in development**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## LAN Deployment

### Windows Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start server/index.js --name cabinet-wms
   pm2 startup
   pm2 save
   ```

4. **Configure Windows Firewall**
   - Open Windows Firewall
   - Add inbound rule for port 3001
   - Allow the application through firewall

5. **Access from other devices**
   - Find host PC IP: `ipconfig`
   - Access from other devices: `http://[HOST-IP]:3001`

### Ubuntu/Linux Deployment

1. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm postgresql
   ```

2. **Setup application**
   ```bash
   npm run build
   sudo npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start server/index.js --name cabinet-wms
   pm2 startup
   pm2 save
   ```

4. **Configure UFW firewall**
   ```bash
   sudo ufw allow 3001
   ```

## Default Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Token validation

### Inventory
- `GET /api/inventory` - Get all items
- `GET /api/inventory/:id` - Get single item
- `POST /api/inventory` - Create item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `POST /api/inventory/import` - Import from Excel
- `GET /api/inventory/export` - Export to PDF

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## File Structure

```
cabinet-wms/
├── src/                    # Frontend React application
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── context/           # React contexts
│   └── types/             # TypeScript definitions
├── server/                # Backend Node.js application
│   ├── routes/            # API routes
│   ├── config/            # Configuration files
│   └── index.js           # Server entry point
├── public/                # Static assets
└── dist/                  # Built frontend (production)
```

## Security Features

- JWT-based authentication
- Role-based access control
- CORS protection
- Helmet security headers
- Password hashing with bcrypt
- Input validation and sanitization

## Performance Optimizations

- Gzip compression
- Static file caching
- Database connection pooling
- Lazy loading of components
- Optimized bundle splitting

## Backup and Maintenance

### Database Backup
```bash
pg_dump cabinet_wms > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql cabinet_wms < backup_20240115.sql
```

### Log Monitoring
```bash
pm2 logs cabinet-wms
```

## Troubleshooting

### Common Issues

1. **Cannot access from other devices**
   - Check firewall settings
   - Verify server is bound to 0.0.0.0, not localhost
   - Confirm network connectivity

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

3. **File upload issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure multer is configured correctly

## Support

For technical support or feature requests, please refer to the system documentation or contact the development team.

## License

This software is proprietary and licensed for use by authorized personnel only.