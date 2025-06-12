import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, Package, DollarSign, Clock, Link, AlertCircle, CheckCircle, XCircle, Layers } from 'lucide-react';
import { BOM, BOMItem, Order, Prototype, InventoryItem } from '../types';
import { bomService, orderService, prototypeService, inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface BOMFormData {
  bomNumber: string;
  name: string;
  version: string;
  linkedType: 'order' | 'prototype';
  linkedId: string;
  description: string;
  category: string;
  estimatedTime: number;
  notes: string;
  items: BOMItem[];
}

const BOMManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [linkedTypeFilter, setLinkedTypeFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [formData, setFormData] = useState<BOMFormData>({
    bomNumber: '',
    name: '',
    version: '1.0',
    linkedType: 'order',
    linkedId: '',
    description: '',
    category: '',
    estimatedTime: 0,
    notes: '',
    items: []
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'in_production', label: 'In Production', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'obsolete', label: 'Obsolete', color: 'bg-red-100 text-red-800' }
  ];

  const categories = [
    'Base Cabinets',
    'Wall Cabinets',
    'Tall Cabinets',
    'Kitchen Islands',
    'Vanities',
    'Storage Solutions',
    'Hardware Sets',
    'Custom Components'
  ];

  useEffect(() => {
    fetchBoms();
    fetchOrders();
    fetchPrototypes();
    fetchInventoryItems();
  }, []);

  const fetchBoms = async () => {
    try {
      const data = await bomService.getAll();
      setBoms(data);
    } catch (error) {
      console.error('Failed to fetch BOMs:', error);
      toast.error('Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchPrototypes = async () => {
    try {
      const data = await prototypeService.getAll();
      setPrototypes(data);
    } catch (error) {
      console.error('Failed to fetch prototypes:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const data = await inventoryService.getAll();
      setInventoryItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    }
  };

  const filteredBoms = boms.filter(bom => {
    const matchesSearch = bom.bomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.linkedNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bom.status === statusFilter;
    const matchesLinkedType = linkedTypeFilter === 'all' || bom.linkedType === linkedTypeFilter;
    return matchesSearch && matchesStatus && matchesLinkedType;
  });

  const generateBOMNumber = () => {
    const year = new Date().getFullYear();
    const count = boms.length + 1;
    return `BOM-${year}-${count.toString().padStart(3, '0')}`;
  };

  const addItemToBOM = () => {
    const newItem: BOMItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      unitMeasurement: '',
      isOptional: false
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateBOMItem = (index: number, field: keyof BOMItem, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-populate item details when item is selected
      if (field === 'itemId') {
        const selectedItem = inventoryItems.find(item => item.itemId === value);
        if (selectedItem) {
          updatedItems[index].itemName = selectedItem.name;
          updatedItems[index].unitCost = selectedItem.unitCost;
          updatedItems[index].unitMeasurement = selectedItem.unitMeasurement;
        }
      }
      
      // Recalculate total cost
      if (field === 'quantity' || field === 'unitCost') {
        updatedItems[index].totalCost = updatedItems[index].quantity * updatedItems[index].unitCost;
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const removeBOMItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalCost = (items: BOMItem[]) => {
    return items.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.linkedId) {
      toast.error('BOM name and linked order/prototype are required');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the BOM');
      return;
    }

    try {
      const linkedItem = formData.linkedType === 'order' 
        ? orders.find(o => o.id === formData.linkedId)
        : prototypes.find(p => p.id === formData.linkedId);

      const newBOM = await bomService.create({
        ...formData,
        bomNumber: formData.bomNumber || generateBOMNumber(),
        linkedNumber: linkedItem ? (formData.linkedType === 'order' ? linkedItem.orderNumber : linkedItem.prototypeNumber) : '',
        status: 'draft',
        totalCost: calculateTotalCost(formData.items),
        createdBy: user?.username || 'Unknown'
      });
      setBoms([newBOM, ...boms]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('BOM created successfully');
    } catch (error) {
      console.error('Failed to create BOM:', error);
      toast.error('Failed to create BOM');
    }
  };

  const handleEditBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBOM) return;

    try {
      const linkedItem = formData.linkedType === 'order' 
        ? orders.find(o => o.id === formData.linkedId)
        : prototypes.find(p => p.id === formData.linkedId);

      const updatedBOM = await bomService.update(selectedBOM.id, {
        ...formData,
        linkedNumber: linkedItem ? (formData.linkedType === 'order' ? linkedItem.orderNumber : linkedItem.prototypeNumber) : '',
        totalCost: calculateTotalCost(formData.items)
      });
      setBoms(boms.map(b => b.id === selectedBOM.id ? updatedBOM : b));
      setIsEditModalOpen(false);
      setSelectedBOM(null);
      resetForm();
      toast.success('BOM updated successfully');
    } catch (error) {
      console.error('Failed to update BOM:', error);
      toast.error('Failed to update BOM');
    }
  };

  const handleDeleteBOM = async (bomId: string) => {
    if (!confirm('Are you sure you want to delete this BOM?')) return;

    try {
      await bomService.delete(bomId);
      setBoms(boms.filter(b => b.id !== bomId));
      toast.success('BOM deleted successfully');
    } catch (error) {
      console.error('Failed to delete BOM:', error);
      toast.error('Failed to delete BOM');
    }
  };

  const handleStatusChange = async (bomId: string, newStatus: string) => {
    try {
      const bom = boms.find(b => b.id === bomId);
      if (!bom) return;

      const updatedBOM = await bomService.update(bomId, { 
        ...bom, 
        status: newStatus as any,
        approvedBy: newStatus === 'approved' ? user?.username : bom.approvedBy,
        approvalDate: newStatus === 'approved' ? new Date().toISOString() : bom.approvalDate
      });
      setBoms(boms.map(b => b.id === bomId ? updatedBOM : b));
      toast.success(`BOM status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to update BOM status:', error);
      toast.error('Failed to update BOM status');
    }
  };

  const resetForm = () => {
    setFormData({
      bomNumber: '',
      name: '',
      version: '1.0',
      linkedType: 'order',
      linkedId: '',
      description: '',
      category: '',
      estimatedTime: 0,
      notes: '',
      items: []
    });
  };

  const openViewModal = (bom: BOM) => {
    setSelectedBOM(bom);
    setIsViewModalOpen(true);
  };

  const openEditModal = (bom: BOM) => {
    setSelectedBOM(bom);
    setFormData({
      bomNumber: bom.bomNumber,
      name: bom.name,
      version: bom.version,
      linkedType: bom.linkedType,
      linkedId: bom.linkedId,
      description: bom.description,
      category: bom.category,
      estimatedTime: bom.estimatedTime,
      notes: bom.notes || '',
      items: bom.items
    });
    setIsEditModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'in_production': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'obsolete': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getLinkedOptions = () => {
    return formData.linkedType === 'order' ? orders : prototypes;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('boms.view')) {
    return (
      <div className="text-center py-12">
        <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view BOMs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BOM Management</h1>
          <p className="text-gray-600 mt-1">Manage Bills of Materials for orders and prototypes</p>
        </div>
        {hasPermission('boms.create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New BOM</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusOptions.slice(1, 5).map((status) => {
          const count = boms.filter(bom => bom.status === status.value).length;
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
                placeholder="Search BOMs..."
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
              value={linkedTypeFilter}
              onChange={(e) => setLinkedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="order">Orders</option>
              <option value="prototype">Prototypes</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOMs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BOM Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBoms.map((bom) => (
                <tr key={bom.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bom.bomNumber}</div>
                      <div className="text-sm text-gray-500">{bom.name} v{bom.version}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bom.linkedNumber}</div>
                        <div className="text-sm text-gray-500 capitalize">{bom.linkedType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {bom.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{bom.items.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${bom.totalCost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={bom.status}
                      onChange={(e) => handleStatusChange(bom.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(bom.status)} focus:ring-2 focus:ring-blue-500`}
                      disabled={!hasPermission('boms.update')}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bom.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openViewModal(bom)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasPermission('boms.update') && (
                        <button
                          onClick={() => openEditModal(bom)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit BOM"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('boms.delete') && (
                        <button
                          onClick={() => handleDeleteBOM(bom.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete BOM"
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

        {filteredBoms.length === 0 && (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No BOMs found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create BOM Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New BOM"
        size="xl"
      >
        <form onSubmit={handleCreateBOM} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Number
              </label>
              <input
                type="text"
                value={formData.bomNumber}
                onChange={(e) => setFormData({ ...formData, bomNumber: e.target.value })}
                placeholder={generateBOMNumber()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link To
              </label>
              <select
                value={formData.linkedType}
                onChange={(e) => setFormData({ ...formData, linkedType: e.target.value as any, linkedId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="order">Order</option>
                <option value="prototype">Prototype</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.linkedType === 'order' ? 'Order' : 'Prototype'} *
              </label>
              <select
                required
                value={formData.linkedId}
                onChange={(e) => setFormData({ ...formData, linkedId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select {formData.linkedType}</option>
                {getLinkedOptions().map((item) => (
                  <option key={item.id} value={item.id}>
                    {formData.linkedType === 'order' 
                      ? `${(item as Order).orderNumber} - ${(item as Order).customerName}`
                      : `${(item as Prototype).prototypeNumber} - ${(item as Prototype).name}`
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the BOM..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">BOM Items</h4>
              <button
                type="button"
                onClick={addItemToBOM}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateBOMItem(index, 'itemId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Item</option>
                          {inventoryItems.map((invItem) => (
                            <option key={invItem.id} value={invItem.itemId}>
                              {invItem.itemId} - {invItem.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => updateBOMItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <input
                          type="text"
                          value={`$${item.totalCost.toFixed(2)}`}
                          readOnly
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`optional-${index}`}
                          checked={item.isOptional}
                          onChange={(e) => updateBOMItem(index, 'isOptional', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`optional-${index}`} className="ml-2 text-xs text-gray-700">
                          Optional
                        </label>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeBOMItem(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {formData.items.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total BOM Cost:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${calculateTotalCost(formData.items).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
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
            >
              Create BOM
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit BOM Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBOM(null);
          resetForm();
        }}
        title="Edit BOM"
        size="xl"
      >
        <form onSubmit={handleEditBOM} className="space-y-6">
          {/* Same form fields as create modal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Number
              </label>
              <input
                type="text"
                value={formData.bomNumber}
                onChange={(e) => setFormData({ ...formData, bomNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link To
              </label>
              <select
                value={formData.linkedType}
                onChange={(e) => setFormData({ ...formData, linkedType: e.target.value as any, linkedId: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="order">Order</option>
                <option value="prototype">Prototype</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.linkedType === 'order' ? 'Order' : 'Prototype'} *
              </label>
              <select
                required
                value={formData.linkedId}
                onChange={(e) => setFormData({ ...formData, linkedId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select {formData.linkedType}</option>
                {getLinkedOptions().map((item) => (
                  <option key={item.id} value={item.id}>
                    {formData.linkedType === 'order' 
                      ? `${(item as Order).orderNumber} - ${(item as Order).customerName}`
                      : `${(item as Prototype).prototypeNumber} - ${(item as Prototype).name}`
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">BOM Items</h4>
              <button
                type="button"
                onClick={addItemToBOM}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateBOMItem(index, 'itemId', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Item</option>
                          {inventoryItems.map((invItem) => (
                            <option key={invItem.id} value={invItem.itemId}>
                              {invItem.itemId} - {invItem.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => updateBOMItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                        <input
                          type="text"
                          value={`$${item.totalCost.toFixed(2)}`}
                          readOnly
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`edit-optional-${index}`}
                          checked={item.isOptional}
                          onChange={(e) => updateBOMItem(index, 'isOptional', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`edit-optional-${index}`} className="ml-2 text-xs text-gray-700">
                          Optional
                        </label>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeBOMItem(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {formData.items.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total BOM Cost:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${calculateTotalCost(formData.items).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedBOM(null);
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
              Update BOM
            </button>
          </div>
        </form>
      </Modal>

      {/* View BOM Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBOM(null);
        }}
        title="BOM Details"
        size="xl"
      >
        {selectedBOM && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">BOM Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedBOM.bomNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedBOM.name} v{selectedBOM.version}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Linked To</label>
                  <div className="flex items-center mt-1">
                    <Link className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{selectedBOM.linkedNumber}</span>
                    <span className="ml-2 text-sm text-gray-500 capitalize">({selectedBOM.linkedType})</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                    {selectedBOM.category}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedBOM.status)}`}>
                    {getStatusIcon(selectedBOM.status)}
                    <span className="ml-1">{statusOptions.find(s => s.value === selectedBOM.status)?.label}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                  <p className="text-2xl font-bold text-gray-900">${selectedBOM.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                  <p className="text-gray-900">{selectedBOM.estimatedTime} hours</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="text-gray-900">{selectedBOM.createdBy}</p>
                </div>
                {selectedBOM.approvedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Approved By</label>
                    <p className="text-gray-900">{selectedBOM.approvedBy}</p>
                    <p className="text-sm text-gray-500">
                      {selectedBOM.approvalDate ? new Date(selectedBOM.approvalDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{new Date(selectedBOM.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{selectedBOM.description}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">BOM Items ({selectedBOM.items.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Optional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBOM.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{item.itemName}</div>
                            <div className="text-gray-500">{item.itemId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.quantity} {item.unitMeasurement}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">${item.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">${item.totalCost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm">
                          {item.isOptional ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Optional
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Required
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedBOM.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBOM.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BOMManagement;