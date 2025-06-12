import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all supplier routes
router.use(authenticateToken);

// Get all suppliers
router.get('/', requirePermission('purchase_orders.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      // Return mock data when database is not available
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
          name: 'Edge Solutions',
          contactPerson: 'Emily Chen',
          phone: '(555) 321-0987',
          email: 'orders@edgesolutions.com',
          address: '321 Edge Blvd, Trim Town, TT 22222',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Fastener Supply',
          contactPerson: 'David Wilson',
          phone: '(555) 654-3210',
          email: 'sales@fastenersupply.com',
          address: '654 Fastener St, Hardware Heights, HH 33333',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      return res.json(mockSuppliers);
    }

    const suppliers = await db.all('SELECT * FROM suppliers ORDER BY name');
    
    // Transform database results to match frontend expectations
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      isActive: Boolean(supplier.is_active),
      createdAt: supplier.created_at
    }));
    
    res.json(transformedSuppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get single supplier
router.get('/:id', requirePermission('purchase_orders.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Transform database result to match frontend expectations
    const transformedSupplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      isActive: Boolean(supplier.is_active),
      createdAt: supplier.created_at
    };

    res.json(transformedSupplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create new supplier
router.post('/', requirePermission('purchase_orders.create'), async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, isActive } = req.body;

    if (!name || !contactPerson || !email) {
      return res.status(400).json({ error: 'Name, contact person, and email are required' });
    }

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockSupplier = {
        id: Date.now().toString(),
        name,
        contactPerson,
        phone: phone || '',
        email,
        address: address || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(mockSupplier);
    }

    const id = db.generateUUID();
    
    await db.run(
      `INSERT INTO suppliers (id, name, contact_person, phone, email, address, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, contactPerson, phone || '', email, address || '', isActive !== false ? 1 : 0]
    );
    
    const newSupplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
    
    // Transform database result to match frontend expectations
    const transformedSupplier = {
      id: newSupplier.id,
      name: newSupplier.name,
      contactPerson: newSupplier.contact_person,
      phone: newSupplier.phone,
      email: newSupplier.email,
      address: newSupplier.address,
      isActive: Boolean(newSupplier.is_active),
      createdAt: newSupplier.created_at
    };
    
    res.status(201).json(transformedSupplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', requirePermission('purchase_orders.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, isActive } = req.body;

    if (!db.isConnected()) {
      // Return mock response when database is not available
      const mockSupplier = {
        id,
        name,
        contactPerson,
        phone: phone || '',
        email,
        address: address || '',
        isActive: isActive !== false,
        createdAt: new Date().toISOString()
      };
      return res.json(mockSupplier);
    }

    const result = await db.run(
      `UPDATE suppliers SET 
       name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, contactPerson, phone || '', email, address || '', isActive !== false ? 1 : 0, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const updatedSupplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
    
    // Transform database result to match frontend expectations
    const transformedSupplier = {
      id: updatedSupplier.id,
      name: updatedSupplier.name,
      contactPerson: updatedSupplier.contact_person,
      phone: updatedSupplier.phone,
      email: updatedSupplier.email,
      address: updatedSupplier.address,
      isActive: Boolean(updatedSupplier.is_active),
      createdAt: updatedSupplier.created_at
    };
    
    res.json(transformedSupplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', requirePermission('purchase_orders.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.json({ message: 'Supplier deleted successfully (demo mode)' });
    }

    const result = await db.run('DELETE FROM suppliers WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;