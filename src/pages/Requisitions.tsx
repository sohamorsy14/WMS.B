import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Check, X, Clock, FileText, Package, User, Calendar, AlertCircle, CheckCircle, XCircle, Settings, AlertTriangle, TrendingUp } from 'lucide-react';
import { Requisition, RequisitionItem, InventoryItem, Requester, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { inventoryService, requesterService, departmentService } from '../services/api';
import toast from 'react-hot-toast';

interface RequisitionFormData {
  requester: string;
  department: string;
  orderNumber: string;
  bomNumber: string;
  notes: string;
  items: RequisitionItem[];
}

const Requisitions: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequesterModalOpen, setIsRequesterModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [formData, setFormData] = useState<RequisitionFormData>({
    requester: '',
    department: '',
    orderNumber: '',
    bomNumber: '',
    notes: '',
    items: []
  });

  // Quick add forms
  const [requesterForm, setRequesterForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    position: ''
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: '',
    manager: '',
    costCenter: ''
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'issued', label: 'Items Issued', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchRequisitions();
    fetchInventoryItems();
    fetchRequesters();
    fetchDepartments();
  }, []);

  const fetchRequisitions = async () => {
    try {
      // Mock data for now - in real app this would call requisitionService.getAll()
      const mockRequisitions: Requisition[] = [
        {
          id: '1',
          requestNumber: 'REQ-2024-001',
          requester: 'John Smith',
          department: 'Production',
          orderNumber: 'ORD-2024-001',
          bomNumber: 'BOM-CAB-001',
          status: 'pending',
          items: [
            {
              id: '1',
              itemId: 'PLY-18-4X8',
              itemName: 'Plywood 18mm 4x8ft',
              requestedQuantity: 10,
              approvedQuantity: 8,
              unitCost: 52.75,
              totalCost: 527.50,
              stockOnHand: 45,
              unitMeasurement: 'Sheets (sht)',
              isOverStock: false
            }
          ],
          requestDate: new Date().toISOString(),
          notes: 'Urgent requirement for cabinet production'
        },
        {
          id: '2',
          requestNumber: 'REQ-2024-002',
          requester: 'Sarah Johnson',
          department: 'Assembly',
          orderNumber: 'ORD-2024-002',
          bomNumber: 'BOM-CAB-002',
          status: 'approved',
          items: [
            {
              id: '2',
              itemId: 'HNG-CONC-35',
              itemName: 'Concealed Hinges 35mm',
              requestedQuantity: 50,
              approvedQuantity: 50,
              unitCost: 3.25,
              totalCost: 162.50,
              stockOnHand: 485,
              unitMeasurement: 'Pieces (pcs)',
              isOverStock: false
            }
          ],
          requestDate: new Date(Date.now() - 86400000).toISOString(),
          approvedBy: 'Manager',
          approvalDate: new Date().toISOString(),
          notes: 'Standard hardware request'
        }
      ];
      setRequisitions(mockRequisitions);
    } catch (error) {
      console.error('Failed to fetch requisitions:', error);
      toast.error('Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const items = await inventoryService.getAll();
      setInventoryItems(items);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    }
  };

  const fetchRequesters = async () => {
    try {
      const data = await requesterService.getAll();
      setRequesters(data.filter(r => r.isActive));
    } catch (error) {
      console.error('Failed to fetch requesters:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data.filter(d => d.isActive));
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.orderNumber && req.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (req.bomNumber && req.bomNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateRequestNumber = () => {
    const year = new Date().getFullYear();
    const count = requisitions.length + 1;
    return `REQ-${year}-${count.toString().padStart(3, '0')}`;
  };

  const addItemToRequisition = () => {
    const newItem: RequisitionItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      requestedQuantity: 1,
      unitCost: 0,
      totalCost: 0,
      stockOnHand: 0,
      unitMeasurement: '',
      isOverStock: false
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateRequisitionItem = (index: number, field: keyof RequisitionItem, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-populate item details when item is selected
      if (field === 'itemId') {
        const selectedItem = inventoryItems.find(item => item.itemId === value);
        if (selectedItem) {
          updatedItems[index].itemName = selectedItem.name;
          updatedItems[index].unitCost = selectedItem.unitCost;
          updatedItems[index].stockOnHand = selectedItem.quantity;
          updatedItems[index].unitMeasurement = selectedItem.unitMeasurement;
        }
      }
      
      // Check if requesting over stock and recalculate total cost
      if (field === 'requestedQuantity' || field === 'unitCost') {
        const requestedQty = field === 'requestedQuantity' ? value : updatedItems[index].requestedQuantity;
        const stockOnHand = updatedItems[index].stockOnHand || 0;
        
        updatedItems[index].isOverStock = requestedQty > stockOnHand;
        updatedItems[index].totalCost = requestedQty * updatedItems[index].unitCost;
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const removeRequisitionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateRequester = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requesterForm.name || !requesterForm.email || !requesterForm.employeeId || !requesterForm.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newRequester = await requesterService.create({
        ...requesterForm,
        isActive: true
      });
      setRequesters([...requesters, newRequester]);
      setFormData(prev => ({ ...prev, requester: newRequester.name }));
      setIsRequesterModalOpen(false);
      setRequesterForm({ name: '', email: '', employeeId: '', department: '', position: '' });
      toast.success('Requester created successfully');
    } catch (error) {
      console.error('Failed to create requester:', error);
      toast.error('Failed to create requester');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!departmentForm.name || !departmentForm.code) {
      toast.error('Department name and code are required');
      return;
    }

    try {
      const newDepartment = await departmentService.create({
        ...departmentForm,
        isActive: true
      });
      setDepartments([...departments, newDepartment]);
      setFormData(prev => ({ ...prev, department: newDepartment.name }));
      setIsDepartmentModalOpen(false);
      setDepartmentForm({ name: '', code: '', description: '', manager: '', costCenter: '' });
      toast.success('Department created successfully');
    } catch (error) {
      console.error('Failed to create department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the requisition');
      return;
    }

    if (!formData.requester || !formData.department) {
      toast.error('Please select a requester and department');
      return;
    }

    try {
      const newRequisition: Requisition = {
        id: Date.now().toString(),
        requestNumber: generateRequestNumber(),
        requester: formData.requester,
        department: formData.department,
        orderNumber: formData.orderNumber,
        bomNumber: formData.bomNumber,
        status: 'draft',
        items: formData.items,
        requestDate: new Date().toISOString(),
        notes: formData.notes
      };

      setRequisitions(prev => [newRequisition, ...prev]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Requisition created successfully');
    } catch (error) {
      console.error('Failed to create requisition:', error);
      toast.error('Failed to create requisition');
    }
  };

  const handleSubmitForApproval = async (requisitionId: string) => {
    try {
      setRequisitions(prev => prev.map(req => 
        req.id === requisitionId 
          ? { ...req, status: 'pending' as const }
          : req
      ));
      toast.success('Requisition submitted for approval');
    } catch (error) {
      console.error('Failed to submit requisition:', error);
      toast.error('Failed to submit requisition');
    }
  };

  const handleApproveRequisition = async (requisitionId: string) => {
    try {
      setRequisitions(prev => prev.map(req => 
        req.id === requisitionId 
          ? { 
              ...req, 
              status: 'approved' as const,
              approvedBy: user?.username || 'Manager',
              approvalDate: new Date().toISOString()
            }
          : req
      ));
      toast.success('Requisition approved successfully');
    } catch (error) {
      console.error('Failed to approve requisition:', error);
      toast.error('Failed to approve requisition');
    }
  };

  const handleRejectRequisition = async (requisitionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setRequisitions(prev => prev.map(req => 
        req.id === requisitionId 
          ? { 
              ...req, 
              status: 'rejected' as const,
              approvedBy: user?.username || 'Manager',
              approvalDate: new Date().toISOString(),
              notes: `${req.notes}\n\nRejection Reason: ${reason}`
            }
          : req
      ));
      toast.success('Requisition rejected');
    } catch (error) {
      console.error('Failed to reject requisition:', error);
      toast.error('Failed to reject requisition');
    }
  };

  const handleDeleteRequisition = async (requisitionId: string) => {
    if (!confirm('Are you sure you want to delete this requisition?')) return;

    try {
      setRequisitions(prev => prev.filter(req => req.id !== requisitionId));
      toast.success('Requisition deleted successfully');
    } catch (error) {
      console.error('Failed to delete requisition:', error);
      toast.error('Failed to delete requisition');
    }
  };

  const resetForm = () => {
    setFormData({
      requester: '',
      department: '',
      orderNumber: '',
      bomNumber: '',
      notes: '',
      items: []
    });
  };

  const openViewModal = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setIsViewModalOpen(true);
  };

  const openEditModal = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setFormData({
      requester: requisition.requester,
      department: requisition.department,
      orderNumber: requisition.orderNumber || '',
      bomNumber: requisition.bomNumber || '',
      notes: requisition.notes || '',
      items: requisition.items
    });
    setIsEditModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'issued': return <Package className="w-4 h-4" />;
      case 'completed': return <Check className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const getTotalValue = (items: RequisitionItem[]) => {
    return items.reduce((sum, item) => sum + item.totalCost, 0);
  };

  const getStockStatusColor = (item: RequisitionItem) => {
    if (item.isOverStock) return 'text-red-600';
    if (item.requestedQuantity > (item.stockOnHand || 0) * 0.8) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (item: RequisitionItem) => {
    if (item.isOverStock) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (item.requestedQuantity > (item.stockOnHand || 0) * 0.8) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('requisitions.view')) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view requisitions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600 mt-1">Manage material requests and approvals</p>
        </div>
        {hasPermission('requisitions.create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusOptions.slice(1, 5).map((status) => {
          const count = requisitions.filter(req => req.status === status.value).length;
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requisitions, order#, BOM#..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
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
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order/BOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequisitions.map((requisition) => (
                <tr key={requisition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{requisition.requestNumber}</div>
                      <div className="text-sm text-gray-500">{requisition.department}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-semibold text-white">
                          {requisition.requester.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{requisition.requester}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {requisition.orderNumber && (
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-gray-500 mr-1">Order:</span>
                          <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {requisition.orderNumber}
                          </span>
                        </div>
                      )}
                      {requisition.bomNumber && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-1">BOM:</span>
                          <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {requisition.bomNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">
                        {requisition.items.length} item{requisition.items.length !== 1 ? 's' : ''}
                      </span>
                      {requisition.items.some(item => item.isOverStock) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" title="Contains over-stock requests" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${getTotalValue(requisition.items).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(requisition.status)}`}>
                      {getStatusIcon(requisition.status)}
                      <span className="ml-1">{statusOptions.find(s => s.value === requisition.status)?.label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(requisition.requestDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openViewModal(requisition)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {requisition.status === 'draft' && hasPermission('requisitions.create') && (
                        <>
                          <button
                            onClick={() => openEditModal(requisition)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSubmitForApproval(requisition.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                            title="Submit for Approval"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {requisition.status === 'pending' && hasPermission('requisitions.approve') && (
                        <>
                          <button
                            onClick={() => handleApproveRequisition(requisition.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequisition(requisition.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {(requisition.status === 'draft' || requisition.status === 'rejected') && hasPermission('requisitions.delete') && (
                        <button
                          onClick={() => handleDeleteRequisition(requisition.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
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

        {filteredRequisitions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requisitions found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create Requisition Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Requisition"
        size="xl"
      >
        <form onSubmit={handleCreateRequisition} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Requester *
                </label>
                <button
                  type="button"
                  onClick={() => setIsRequesterModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add New
                </button>
              </div>
              <select
                required
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Requester</option>
                {requesters.map((requester) => (
                  <option key={requester.id} value={requester.name}>
                    {requester.name} ({requester.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Department *
                </label>
                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add New
                </button>
              </div>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter order number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Number
              </label>
              <input
                type="text"
                value={formData.bomNumber}
                onChange={(e) => setFormData({ ...formData, bomNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter BOM number"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Requested Items</h4>
              <button
                type="button"
                onClick={addItemToRequisition}
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateRequisitionItem(index, 'itemId', e.target.value)}
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
                          min="1"
                          value={item.requestedQuantity}
                          onChange={(e) => updateRequisitionItem(index, 'requestedQuantity', parseInt(e.target.value) || 0)}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 ${
                            item.isOverStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                        <div className="flex items-center space-x-1">
                          {getStockStatusIcon(item)}
                          <span className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                            {item.stockOnHand || 0}
                          </span>
                          <span className="text-xs text-gray-500">{item.unitMeasurement}</span>
                        </div>
                        {item.isOverStock && (
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Over stock
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateRequisitionItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
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
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeRequisitionItem(index)}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or special requirements..."
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
              Create Requisition
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Requester Modal */}
      <Modal
        isOpen={isRequesterModalOpen}
        onClose={() => {
          setIsRequesterModalOpen(false);
          setRequesterForm({ name: '', email: '', employeeId: '', department: '', position: '' });
        }}
        title="Quick Add Requester"
        size="lg"
      >
        <form onSubmit={handleCreateRequester} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={requesterForm.name}
                onChange={(e) => setRequesterForm({ ...requesterForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={requesterForm.email}
                onChange={(e) => setRequesterForm({ ...requesterForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={requesterForm.employeeId}
                onChange={(e) => setRequesterForm({ ...requesterForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                required
                value={requesterForm.department}
                onChange={(e) => setRequesterForm({ ...requesterForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              value={requesterForm.position}
              onChange={(e) => setRequesterForm({ ...requesterForm, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter job position"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsRequesterModalOpen(false);
                setRequesterForm({ name: '', email: '', employeeId: '', department: '', position: '' });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Requester
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Department Modal */}
      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setDepartmentForm({ name: '', code: '', description: '', manager: '', costCenter: '' });
        }}
        title="Quick Add Department"
        size="lg"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Code *
              </label>
              <input
                type="text"
                required
                value={departmentForm.code}
                onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department code"
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={departmentForm.description}
              onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter department description"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={departmentForm.manager}
                onChange={(e) => setDepartmentForm({ ...departmentForm, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manager name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Center
              </label>
              <input
                type="text"
                value={departmentForm.costCenter}
                onChange={(e) => setDepartmentForm({ ...departmentForm, costCenter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter cost center"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsDepartmentModalOpen(false);
                setDepartmentForm({ name: '', code: '', description: '', manager: '', costCenter: '' });
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Department
            </button>
          </div>
        </form>
      </Modal>

      {/* View Requisition Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRequisition(null);
        }}
        title="Requisition Details"
        size="xl"
      >
        {selectedRequisition && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRequisition.requestNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requester</label>
                  <p className="text-gray-900">{selectedRequisition.requester}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-gray-900">{selectedRequisition.department}</p>
                </div>
                {selectedRequisition.orderNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Number</label>
                    <p className="text-gray-900 font-mono">{selectedRequisition.orderNumber}</p>
                  </div>
                )}
                {selectedRequisition.bomNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">BOM Number</label>
                    <p className="text-gray-900 font-mono">{selectedRequisition.bomNumber}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequisition.status)}`}>
                    {getStatusIcon(selectedRequisition.status)}
                    <span className="ml-1">{statusOptions.find(s => s.value === selectedRequisition.status)?.label}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Date</label>
                  <p className="text-gray-900">{new Date(selectedRequisition.requestDate).toLocaleDateString()}</p>
                </div>
                {selectedRequisition.approvedBy && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approved By</label>
                      <p className="text-gray-900">{selectedRequisition.approvedBy}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approval Date</label>
                      <p className="text-gray-900">{selectedRequisition.approvalDate ? new Date(selectedRequisition.approvalDate).toLocaleDateString() : '-'}</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Value</label>
                  <p className="text-lg font-semibold text-gray-900">${getTotalValue(selectedRequisition.items).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Requested Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Requested Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Approved Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedRequisition.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{item.itemName}</div>
                            <div className="text-gray-500">{item.itemId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={item.isOverStock ? 'text-red-600 font-medium' : 'text-gray-900'}>
                              {item.requestedQuantity}
                            </span>
                            {item.isOverStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center space-x-1">
                            {getStockStatusIcon(item)}
                            <span className={getStockStatusColor(item)}>
                              {item.stockOnHand || 0}
                            </span>
                            <span className="text-gray-500">{item.unitMeasurement}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.approvedQuantity || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${item.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">${item.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRequisition.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequisition.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Requisitions;