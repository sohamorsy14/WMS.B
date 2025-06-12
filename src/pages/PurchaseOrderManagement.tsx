import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, ShoppingCart, User, Building, DollarSign, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Package, FileText, Send, Truck } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, InventoryItem, Supplier } from '../types';
import { purchaseOrderService, inventoryService, supplierService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface PurchaseOrderFormData {
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  notes: string;
  items: PurchaseOrderItem[];
}

const PurchaseOrderManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    poNumber: '',
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    notes: '',
    items: []
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800' },
    { value: 'ordered', label: 'Ordered', color: 'bg-purple-100 text-purple-800' },
    { value: 'received', label: 'Received', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchInventoryItems();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const data = await purchaseOrderService.getAll();
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      console.log('Fetching suppliers...'); // Debug log
      const data = await supplierService.getAll();
      console.log('Suppliers fetched:', data); // Debug log
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      console.log('Fetching inventory items...'); // Debug log
      const data = await inventoryService.getAll();
      console.log('Inventory items fetched:', data.length, 'items'); // Debug log
      setInventoryItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setInventoryLoading(false);
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || po.supplier === supplierFilter;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const count = purchaseOrders.length + 1;
    return `PO-${year}-${count.toString().padStart(4, '0')}`;
  };

  const calculateTotals = (items: PurchaseOrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier || formData.items.length === 0) {
      toast.error('Supplier and at least one item are required');
      return;
    }

    try {
      const { subtotal, tax, total } = calculateTotals(formData.items);
      const newPO = await purchaseOrderService.create({
        ...formData,
        poNumber: formData.poNumber || generatePONumber(),
        status: 'draft',
        subtotal,
        tax,
        total
      });
      setPurchaseOrders([newPO, ...purchaseOrders]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Purchase order created successfully');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      toast.error('Failed to create purchase order');
    }
  };

  const handleEditPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    try {
      const { subtotal, tax, total } = calculateTotals(formData.items);
      const updatedPO = await purchaseOrderService.update(selectedPO.id, {
        ...formData,
        subtotal,
        tax,
        total
      });
      setPurchaseOrders(purchaseOrders.map(po => po.id === selectedPO.id ? updatedPO : po));
      setIsEditModalOpen(false);
      setSelectedPO(null);
      resetForm();
      toast.success('Purchase order updated successfully');
    } catch (error) {
      console.error('Failed to update purchase order:', error);
      toast.error('Failed to update purchase order');
    }
  };

  const handleDeletePO = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    try {
      await purchaseOrderService.delete(poId);
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== poId));
      toast.success('Purchase order deleted successfully');
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
      toast.error('Failed to delete purchase order');
    }
  };

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      const po = purchaseOrders.find(p => p.id === poId);
      if (!po) return;

      const updatedPO = await purchaseOrderService.update(poId, { 
        ...po, 
        status: newStatus as any
      });
      setPurchaseOrders(purchaseOrders.map(p => p.id === poId ? updatedPO : p));
      toast.success(`Purchase order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update purchase order status:', error);
      toast.error('Failed to update purchase order status');
    }
  };

  const handleApprovePO = async (poId: string) => {
    try {
      const updatedPO = await purchaseOrderService.approve(poId);
      setPurchaseOrders(purchaseOrders.map(po => po.id === poId ? updatedPO : po));
      toast.success('Purchase order approved successfully');
    } catch (error) {
      console.error('Failed to approve purchase order:', error);
      toast.error('Failed to approve purchase order');
    }
  };

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total cost
    if (field === 'quantity' || field === 'unitCost') {
      updatedItems[index].totalCost = updatedItems[index].quantity * updatedItems[index].unitCost;
    }
    
    // Auto-fill item name when item ID is selected
    if (field === 'itemId') {
      const inventoryItem = inventoryItems.find(item => item.itemId === value);
      if (inventoryItem) {
        updatedItems[index].itemName = inventoryItem.name;
        updatedItems[index].unitCost = inventoryItem.unitCost;
        updatedItems[index].totalCost = updatedItems[index].quantity * inventoryItem.unitCost;
      }
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const resetForm = () => {
    setFormData({
      poNumber: '',
      supplier: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      notes: '',
      items: []
    });
  };

  const openViewModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsViewModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setFormData({
      poNumber: po.poNumber,
      supplier: po.supplier,
      orderDate: po.orderDate.split('T')[0],
      expectedDelivery: po.expectedDelivery ? po.expectedDelivery.split('T')[0] : '',
      notes: po.notes || '',
      items: po.items
    });
    setIsEditModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'ordered': return <Send className="w-4 h-4" />;
      case 'received': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('purchase_orders.view')) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view purchase orders.</p>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotals(formData.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order Management</h1>
          <p className="text-gray-600 mt-1">Manage purchase orders and supplier relationships</p>
        </div>
        {hasPermission('purchase_orders.create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusOptions.slice(1, 5).map((status) => {
          const count = purchaseOrders.filter(po => po.status === status.value).length;
          return (
            <div key={status.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-full ${status.color}`}>
                  {getStatusIcon(status.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{po.poNumber}</div>
                        <div className="text-sm text-gray-500">{po.items.length} items</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{po.supplier}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </div>
                    {po.expectedDelivery && (
                      <div className="text-xs text-gray-500">
                        Expected: {new Date(po.expectedDelivery).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(po.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Subtotal: {formatCurrency(po.subtotal)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={po.status}
                      onChange={(e) => handleStatusChange(po.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(po.status)} focus:ring-2 focus:ring-blue-500`}
                      disabled={!hasPermission('purchase_orders.update')}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{po.items.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openViewModal(po)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasPermission('purchase_orders.update') && (
                        <button
                          onClick={() => openEditModal(po)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit Purchase Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('purchase_orders.approve') && po.status === 'pending' && (
                        <button
                          onClick={() => handleApprovePO(po.id)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Approve Purchase Order"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('purchase_orders.delete') && (
                        <button
                          onClick={() => handleDeletePO(po.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Purchase Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPurchaseOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Purchase Order"
        size="xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder={generatePONumber()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              {suppliersLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading suppliers...
                </div>
              ) : (
                <select
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              )}
              {!suppliersLoading && suppliers.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No suppliers available. Please add suppliers first.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery
              </label>
              <input
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                disabled={inventoryLoading}
              >
                Add Item
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>No items added yet. Click "Add Item" to get started.</p>
                {inventoryLoading && <p className="text-xs mt-1">Loading inventory items...</p>}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                      {inventoryLoading ? (
                        <div className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded">
                          Loading...
                        </div>
                      ) : (
                        <select
                          value={item.itemId}
                          onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Item</option>
                          {inventoryItems.map((invItem) => (
                            <option key={invItem.id} value={invItem.itemId}>
                              {invItem.itemId} - {invItem.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                      <input
                        type="text"
                        value={formatCurrency(item.totalCost)}
                        readOnly
                        className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.items.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Subtotal:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tax (10%):</span>
                  <span className="font-medium text-blue-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="font-medium text-blue-700">Total:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or special instructions..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={suppliersLoading || inventoryLoading}
            >
              Create Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Purchase Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPO(null);
          resetForm();
        }}
        title="Edit Purchase Order"
        size="xl"
      >
        <form onSubmit={handleEditPO} className="space-y-6">
          {/* Same form content as create modal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery
              </label>
              <input
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                      <select
                        value={item.itemId}
                        onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Item</option>
                        {inventoryItems.map((invItem) => (
                          <option key={invItem.id} value={invItem.itemId}>
                            {invItem.itemId} - {invItem.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                      <input
                        type="text"
                        value={formatCurrency(item.totalCost)}
                        readOnly
                        className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.items.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Subtotal:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tax (10%):</span>
                  <span className="font-medium text-blue-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="font-medium text-blue-700">Total:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or special instructions..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedPO(null);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Order Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPO(null);
        }}
        title="Purchase Order Details"
        size="xl"
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPO.poNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier</label>
                  <p className="text-gray-900">{selectedPO.supplier}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPO.status)}`}>
                    {getStatusIcon(selectedPO.status)}
                    <span className="ml-1">{statusOptions.find(s => s.value === selectedPO.status)?.label}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-gray-900">{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                </div>
                {selectedPO.expectedDelivery && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                    <p className="text-gray-900">{new Date(selectedPO.expectedDelivery).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPO.total)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Items ({selectedPO.items.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPO.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{item.itemId}</td>
                        <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                        <td className="px-3 py-2 text-gray-900">{item.quantity}</td>
                        <td className="px-3 py-2 text-gray-900">{formatCurrency(item.unitCost)}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{formatCurrency(item.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Subtotal:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(selectedPO.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tax:</span>
                  <span className="font-medium text-blue-900">{formatCurrency(selectedPO.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="font-medium text-blue-700">Total:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(selectedPO.total)}</span>
                </div>
              </div>
            </div>

            {selectedPO.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedPO.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderManagement;