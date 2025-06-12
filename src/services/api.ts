import axios from 'axios';
import { InventoryItem, Requisition, PurchaseOrder, DashboardStats, Requester, Department, Order, BOM, Prototype, CostCenter, Report, InventoryValuation, PurchaseHistory, Supplier } from '../types';
import { CabinetConfiguration, CabinetProject } from '../types/cabinet';

// Simplified API URL resolution using Vite's environment detection
const getApiUrl = () => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use relative API path
  return '/api';
};

const API_BASE_URL = getApiUrl();

console.log('Main API URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cabinet Calculator API service
export const cabinetService = {
  async createBOM(config: CabinetConfiguration): Promise<BOM> {
    try {
      const response = await api.post('/boms', {
        bomNumber: `BOM-${Date.now().toString().slice(-6)}`,
        name: `BOM for ${config.name}`,
        version: '1.0',
        linkedType: 'cabinet',
        linkedId: config.id,
        linkedNumber: config.id,
        status: 'draft',
        description: `Bill of Materials for ${config.name}`,
        category: 'Cabinet',
        items: [
          ...config.materials.map(material => ({
            id: material.id,
            itemId: material.materialId,
            itemName: material.materialName,
            quantity: material.quantity,
            unitCost: material.unitCost,
            totalCost: material.totalCost,
            unitMeasurement: 'Sheets',
            isOptional: false
          })),
          ...config.hardware.map(hardware => ({
            id: hardware.id,
            itemId: hardware.hardwareId,
            itemName: hardware.hardwareName,
            quantity: hardware.quantity,
            unitCost: hardware.unitCost,
            totalCost: hardware.totalCost,
            unitMeasurement: 'Pieces',
            isOptional: false
          }))
        ],
        totalCost: config.totalCost,
        estimatedTime: config.laborCost / 45, // Assuming $45/hour labor rate
        createdBy: 'Cabinet Calculator'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create BOM:', error);
      throw error;
    }
  },

  async createOrder(project: CabinetProject): Promise<Order> {
    try {
      const response = await api.post('/orders', {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: project.customerName,
        customerContact: project.customerContact,
        orderType: 'production',
        status: 'draft',
        priority: 'medium',
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + project.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
        description: project.description || `Cabinet order for ${project.customerName}`,
        notes: project.notes,
        estimatedCost: project.total,
        actualCost: 0
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  async optimizeNesting(cuttingList: any[]): Promise<any[]> {
    try {
      const response = await api.post('/cabinet-calculator/nesting', { cuttingList });
      return response.data;
    } catch (error) {
      console.error('Failed to optimize nesting:', error);
      throw error;
    }
  }
};

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory/products');
    return response.data;
  },

  async getById(id: string): Promise<InventoryItem> {
    const response = await api.get(`/inventory/products/${id}`);
    return response.data;
  },

  async create(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.post('/inventory/products', item);
    return response.data;
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await api.put(`/inventory/products/${id}`, item);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/products/${id}`);
  },

  async importFromExcel(file: File): Promise<{ success: boolean; count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async exportToPDF(): Promise<Blob> {
    const response = await api.get('/inventory/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const response = await api.get('/purchase-orders');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
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
            },
            {
              id: '4',
              itemId: 'SLD-18-FULL',
              itemName: 'Full Extension Slides 18"',
              quantity: 50,
              unitCost: 12.50,
              totalCost: 625.00
            }
          ],
          subtotal: 1275.00,
          tax: 127.50,
          total: 1402.50,
          orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          expectedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Standard delivery terms',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          poNumber: 'PO-2024-0003',
          supplier: 'Laminate Plus',
          status: 'ordered',
          items: [
            {
              id: '5',
              itemId: 'MEL-WHT-4X8',
              itemName: 'White Melamine 4x8ft',
              quantity: 25,
              unitCost: 68.50,
              totalCost: 1712.50
            }
          ],
          subtotal: 1712.50,
          tax: 171.25,
          total: 1883.75,
          orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  async create(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.post('/purchase-orders', po);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id: Date.now().toString(),
        ...po,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as PurchaseOrder;
    }
  },

  async update(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const response = await api.put(`/purchase-orders/${id}`, po);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id,
        ...po,
        updatedAt: new Date().toISOString()
      } as PurchaseOrder;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/purchase-orders/${id}`);
    } catch (error) {
      console.log('Purchase order deleted (mock)');
    }
  },

  async approve(id: string): Promise<PurchaseOrder> {
    try {
      const response = await api.patch(`/purchase-orders/${id}/approve`);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id,
        status: 'approved',
        updatedAt: new Date().toISOString()
      } as PurchaseOrder;
    }
  },
};

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    try {
      const response = await api.get('/suppliers');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
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
    }
  },

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await api.post('/suppliers', supplier);
      return response.data;
    } catch (error) {
      return {
        id: Date.now().toString(),
        ...supplier,
        isActive: true,
        createdAt: new Date().toISOString()
      } as Supplier;
    }
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const response = await api.put(`/suppliers/${id}`, supplier);
      return response.data;
    } catch (error) {
      return {
        id,
        ...supplier,
        createdAt: new Date().toISOString()
      } as Supplier;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/suppliers/${id}`);
    } catch (error) {
      console.log('Supplier deleted (mock)');
    }
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      // Return mock data when database is not available
      const recentActivity = [
        { id: 1, action: 'Product Added', item: 'Kitchen Cabinet Set A', timestamp: new Date().toISOString() },
        { id: 2, action: 'Stock Updated', item: 'Bathroom Vanity B', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'Order Completed', item: 'Living Room Cabinet C', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'Requisition Approved', item: 'Hardware Supplies', timestamp: new Date(Date.now() - 10800000).toISOString() },
        { id: 5, action: 'Purchase Order Created', item: 'Plywood 18mm', timestamp: new Date(Date.now() - 14400000).toISOString() },
      ];
      
      return {
        totalItems: 1247,
        lowStockItems: 23,
        pendingRequisitions: 8,
        openPurchaseOrders: 12,
        monthlyExpenditure: 67000,
        inventoryValue: 350000,
        recentActivity
      };
    }
  },
};

export const requesterService = {
  async getAll(): Promise<Requester[]> {
    try {
      const response = await api.get('/requesters');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@company.com',
          employeeId: 'EMP001',
          department: 'Production',
          position: 'Production Supervisor',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          employeeId: 'EMP002',
          department: 'Assembly',
          position: 'Assembly Lead',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@company.com',
          employeeId: 'EMP003',
          department: 'Quality Control',
          position: 'QC Inspector',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(requester: Partial<Requester>): Promise<Requester> {
    try {
      const response = await api.post('/requesters', requester);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id: Date.now().toString(),
        ...requester,
        isActive: true,
        createdAt: new Date().toISOString()
      } as Requester;
    }
  },

  async update(id: string, requester: Partial<Requester>): Promise<Requester> {
    try {
      const response = await api.put(`/requesters/${id}`, requester);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id,
        ...requester,
        createdAt: new Date().toISOString()
      } as Requester;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/requesters/${id}`);
    } catch (error) {
      // Mock success
      console.log('Requester deleted (mock)');
    }
  },
};

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          name: 'Production',
          code: 'PROD',
          description: 'Manufacturing and production operations',
          manager: 'John Smith',
          costCenter: 'CC001',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Assembly',
          code: 'ASSY',
          description: 'Product assembly and finishing',
          manager: 'Sarah Johnson',
          costCenter: 'CC002',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Quality Control',
          code: 'QC',
          description: 'Quality assurance and testing',
          manager: 'Mike Wilson',
          costCenter: 'CC003',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Finishing',
          code: 'FIN',
          description: 'Surface finishing and coating',
          manager: 'Lisa Brown',
          costCenter: 'CC004',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Maintenance',
          code: 'MAINT',
          description: 'Equipment maintenance and repair',
          manager: 'Tom Davis',
          costCenter: 'CC005',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Warehouse',
          code: 'WH',
          description: 'Storage and logistics',
          manager: 'Anna Garcia',
          costCenter: 'CC006',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(department: Partial<Department>): Promise<Department> {
    try {
      const response = await api.post('/departments', department);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id: Date.now().toString(),
        ...department,
        isActive: true,
        createdAt: new Date().toISOString()
      } as Department;
    }
  },

  async update(id: string, department: Partial<Department>): Promise<Department> {
    try {
      const response = await api.put(`/departments/${id}`, department);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id,
        ...department,
        createdAt: new Date().toISOString()
      } as Department;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/departments/${id}`);
    } catch (error) {
      // Mock success
      console.log('Department deleted (mock)');
    }
  },
};

export const costCenterService = {
  async getAll(): Promise<CostCenter[]> {
    try {
      const response = await api.get('/cost-centers');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          code: 'CC-001',
          name: 'Production Operations',
          description: 'Manufacturing and production activities',
          budget: 50000,
          actualSpent: 42500,
          budgetPeriod: 'monthly',
          manager: 'John Smith',
          department: 'Production',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          code: 'CC-002',
          name: 'Assembly Operations',
          description: 'Cabinet assembly and finishing',
          budget: 35000,
          actualSpent: 38200,
          budgetPeriod: 'monthly',
          manager: 'Sarah Johnson',
          department: 'Assembly',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(costCenter: Partial<CostCenter>): Promise<CostCenter> {
    try {
      const response = await api.post('/cost-centers', costCenter);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id: Date.now().toString(),
        ...costCenter,
        actualSpent: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as CostCenter;
    }
  },

  async update(id: string, costCenter: Partial<CostCenter>): Promise<CostCenter> {
    try {
      const response = await api.put(`/cost-centers/${id}`, costCenter);
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id,
        ...costCenter,
        updatedAt: new Date().toISOString()
      } as CostCenter;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/cost-centers/${id}`);
    } catch (error) {
      // Mock success
      console.log('Cost center deleted (mock)');
    }
  },
};

export const reportService = {
  async getAll(): Promise<Report[]> {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [];
    }
  },

  async generate(type: string, parameters: any): Promise<Report> {
    try {
      const response = await api.post('/reports/generate', { type, parameters });
      return response.data;
    } catch (error) {
      // Return mock response
      return {
        id: Date.now().toString(),
        name: `${type} Report - ${new Date().toLocaleDateString()}`,
        type: type as any,
        description: `Generated ${type} report`,
        parameters,
        generatedBy: 'admin',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        fileUrl: `/reports/${type}-${Date.now()}.pdf`,
        fileSize: Math.floor(Math.random() * 3000000) + 500000
      };
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/reports/${id}`);
    } catch (error) {
      // Mock success
      console.log('Report deleted (mock)');
    }
  },

  async getInventoryValuation(filters?: any): Promise<InventoryValuation[]> {
    try {
      const response = await api.get('/reports/inventory-valuation', { params: filters });
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [];
    }
  },

  async getPurchaseHistory(itemId: string): Promise<PurchaseHistory[]> {
    try {
      const response = await api.get(`/reports/purchase-history/${itemId}`);
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [];
    }
  },
};

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          customerName: 'ABC Kitchen Renovations',
          customerContact: 'John Doe - (555) 123-4567',
          orderType: 'production',
          status: 'in_progress',
          priority: 'high',
          orderDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Complete kitchen cabinet set - Modern style',
          estimatedCost: 15000,
          actualCost: 0,
          assignedTo: 'John Smith',
          department: 'Production',
          bomCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          customerName: 'XYZ Home Builders',
          customerContact: 'Jane Smith - (555) 987-6543',
          orderType: 'custom',
          status: 'confirmed',
          priority: 'medium',
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Custom bathroom vanity with matching mirror cabinet',
          estimatedCost: 8500,
          actualCost: 0,
          assignedTo: 'Sarah Johnson',
          department: 'Assembly',
          bomCount: 2,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(order: Partial<Order>): Promise<Order> {
    try {
      const response = await api.post('/orders', order);
      return response.data;
    } catch (error) {
      return {
        id: Date.now().toString(),
        ...order,
        bomCount: 0,
        actualCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Order;
    }
  },

  async update(id: string, order: Partial<Order>): Promise<Order> {
    try {
      const response = await api.put(`/orders/${id}`, order);
      return response.data;
    } catch (error) {
      return {
        id,
        ...order,
        updatedAt: new Date().toISOString()
      } as Order;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/orders/${id}`);
    } catch (error) {
      console.log('Order deleted (mock)');
    }
  },
};

export const bomService = {
  async getAll(): Promise<BOM[]> {
    try {
      const response = await api.get('/boms');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          bomNumber: 'BOM-2024-001',
          name: 'Kitchen Base Cabinet - 24"',
          version: '1.0',
          linkedType: 'order',
          linkedId: '1',
          linkedNumber: 'ORD-2024-001',
          status: 'approved',
          description: 'Standard 24" base cabinet with single door',
          category: 'Base Cabinets',
          items: [
            {
              id: '1',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 2,
              unitCost: 52.75,
              totalCost: 105.50,
              unitMeasurement: 'Sheets',
              isOptional: false
            },
            {
              id: '2',
              itemId: 'HNG-CONC-35',
              itemName: 'Concealed Hinges 35mm',
              quantity: 2,
              unitCost: 3.25,
              totalCost: 6.50,
              unitMeasurement: 'Pieces',
              isOptional: false
            }
          ],
          totalCost: 112.00,
          estimatedTime: 4,
          createdBy: 'John Smith',
          approvedBy: 'Manager',
          approvalDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          bomNumber: 'BOM-2024-002',
          name: 'Kitchen Wall Cabinet - 30"',
          version: '1.0',
          linkedType: 'order',
          linkedId: '1',
          linkedNumber: 'ORD-2024-001',
          status: 'in_production',
          description: 'Standard 30" wall cabinet with double doors',
          category: 'Wall Cabinets',
          items: [
            {
              id: '3',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              quantity: 1.5,
              unitCost: 52.75,
              totalCost: 79.13,
              unitMeasurement: 'Sheets',
              isOptional: false
            }
          ],
          totalCost: 79.13,
          estimatedTime: 3,
          createdBy: 'Sarah Johnson',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(bom: Partial<BOM>): Promise<BOM> {
    try {
      const response = await api.post('/boms', bom);
      return response.data;
    } catch (error) {
      return {
        id: Date.now().toString(),
        ...bom,
        items: bom.items || [],
        totalCost: 0,
        estimatedTime: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as BOM;
    }
  },

  async update(id: string, bom: Partial<BOM>): Promise<BOM> {
    try {
      const response = await api.put(`/boms/${id}`, bom);
      return response.data;
    } catch (error) {
      return {
        id,
        ...bom,
        updatedAt: new Date().toISOString()
      } as BOM;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/boms/${id}`);
    } catch (error) {
      console.log('BOM deleted (mock)');
    }
  },

  async getByLinkedId(linkedType: 'order' | 'prototype' | 'cabinet', linkedId: string): Promise<BOM[]> {
    try {
      const response = await api.get(`/boms/linked/${linkedType}/${linkedId}`);
      return response.data;
    } catch (error) {
      // Return filtered mock data
      const allBoms = await this.getAll();
      return allBoms.filter(bom => bom.linkedType === linkedType && bom.linkedId === linkedId);
    }
  },
};

export const prototypeService = {
  async getAll(): Promise<Prototype[]> {
    try {
      const response = await api.get('/prototypes');
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return [
        {
          id: '1',
          prototypeNumber: 'PROTO-2024-001',
          name: 'Modular Kitchen Island',
          description: 'Innovative modular kitchen island with adjustable components',
          status: 'testing',
          category: 'Kitchen Islands',
          designer: 'Design Team',
          createdDate: new Date().toISOString(),
          bomCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          prototypeNumber: 'PROTO-2024-002',
          name: 'Smart Storage Cabinet',
          description: 'Cabinet with integrated smart storage solutions',
          status: 'approved',
          category: 'Storage Solutions',
          designer: 'Innovation Lab',
          createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvalDate: new Date().toISOString(),
          bomCount: 2,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  },

  async create(prototype: Partial<Prototype>): Promise<Prototype> {
    try {
      const response = await api.post('/prototypes', prototype);
      return response.data;
    } catch (error) {
      return {
        id: Date.now().toString(),
        ...prototype,
        bomCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Prototype;
    }
  },

  async update(id: string, prototype: Partial<Prototype>): Promise<Prototype> {
    try {
      const response = await api.put(`/prototypes/${id}`, prototype);
      return response.data;
    } catch (error) {
      return {
        id,
        ...prototype,
        updatedAt: new Date().toISOString()
      } as Prototype;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/prototypes/${id}`);
    } catch (error) {
      console.log('Prototype deleted (mock)');
    }
  },
};