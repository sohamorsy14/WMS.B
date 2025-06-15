export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'storekeeper' | 'purchaser';
  permissions: string[];
  createdAt: string;
}

export interface Requester {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  manager: string;
  costCenter: string;
  isActive: boolean;
  createdAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string;
  budget: number;
  actualSpent: number;
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  manager: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface Location {
  id: string;
  code: string;
  storeName: string;
  rack: string;
  shelf: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  category: string;
  subCategory: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  location: string;
  supplier: string;
  unitMeasurement: string;
  minStockLevel: number;
  maxStockLevel: number;
  lastUpdated: string;
}

export interface PurchaseHistory {
  id: string;
  itemId: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  poNumber?: string;
  invoiceNumber?: string;
}

export interface InventoryValuation {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  unitMeasurement: string;
  lastPurchasePrice: number;
  averagePurchasePrice: number;
  totalPurchases: number;
  valuationAtLastPrice: number;
  valuationAtAveragePrice: number;
  lastPurchaseDate: string;
  supplier: string;
  location: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'inventory_valuation' | 'stock_movement' | 'purchase_analysis' | 'cost_center_budget' | 'department_spending' | 'supplier_performance';
  description: string;
  parameters: Record<string, any>;
  generatedBy: string;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string;
  orderType: 'production' | 'prototype' | 'repair' | 'custom';
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderDate: string;
  dueDate: string;
  completedDate?: string;
  description: string;
  notes?: string;
  estimatedCost: number;
  actualCost: number;
  assignedTo: string;
  department: string;
  bomCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderDate: string;
  expectedDelivery?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Cabinet {
  id: string;
  type: 'base' | 'wall' | 'tall' | 'drawer';
  name: string;
  width: number;
  height: number;
  depth: number;
  doorCount: number;
  drawerCount: number;
  shelfCount: number;
  materials: CabinetMaterial[];
  accessories: CabinetAccessory[];
  totalCost: number;
}

export interface CabinetMaterial {
  id: string;
  name: string;
  type: 'panel' | 'back' | 'edgeband';
  quantity: number;
  dimensions: string;
  unitCost: number;
  totalCost: number;
}

export interface CabinetAccessory {
  id: string;
  name: string;
  type: 'hinge' | 'slide' | 'handle' | 'knob';
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  pendingRequisitions: number;
  openPurchaseOrders: number;
  monthlyExpenditure: number;
  inventoryValue: number;
  recentActivity?: Array<{
    id: number;
    action: string;
    item: string;
    timestamp: string;
  }>;
}