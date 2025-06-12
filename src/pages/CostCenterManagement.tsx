import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown, AlertTriangle, User, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { CostCenter, Department } from '../types';
import { departmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface CostCenterFormData {
  code: string;
  name: string;
  description: string;
  budget: number;
  budgetPeriod: 'monthly' | 'quarterly' | 'yearly';
  manager: string;
  department: string;
  isActive: boolean;
}

const CostCenterManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [budgetPeriodFilter, setBudgetPeriodFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<CostCenterFormData>({
    code: '',
    name: '',
    description: '',
    budget: 0,
    budgetPeriod: 'monthly',
    manager: '',
    department: '',
    isActive: true
  });

  const budgetPeriods = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  useEffect(() => {
    fetchCostCenters();
    fetchDepartments();
  }, []);

  const fetchCostCenters = async () => {
    try {
      // Mock cost centers data - in a real app, this would come from the backend
      const mockCostCenters: CostCenter[] = [
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
        },
        {
          id: '3',
          code: 'CC-003',
          name: 'Quality Control',
          description: 'Quality assurance and testing',
          budget: 15000,
          actualSpent: 12800,
          budgetPeriod: 'monthly',
          manager: 'Mike Wilson',
          department: 'Quality Control',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          code: 'CC-004',
          name: 'Maintenance',
          description: 'Equipment maintenance and repair',
          budget: 20000,
          actualSpent: 18500,
          budgetPeriod: 'monthly',
          manager: 'Tom Brown',
          department: 'Maintenance',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          code: 'CC-005',
          name: 'Warehouse Operations',
          description: 'Inventory and logistics',
          budget: 25000,
          actualSpent: 23100,
          budgetPeriod: 'monthly',
          manager: 'Lisa Davis',
          department: 'Warehouse',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '6',
          code: 'CC-006',
          name: 'R&D Projects',
          description: 'Research and development activities',
          budget: 100000,
          actualSpent: 75000,
          budgetPeriod: 'quarterly',
          manager: 'Dr. Emily Chen',
          department: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setCostCenters(mockCostCenters);
    } catch (error) {
      console.error('Failed to fetch cost centers:', error);
      toast.error('Failed to load cost centers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const filteredCostCenters = costCenters.filter(costCenter => {
    const matchesSearch = costCenter.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         costCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         costCenter.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && costCenter.isActive) ||
                         (statusFilter === 'inactive' && !costCenter.isActive);
    const matchesPeriod = budgetPeriodFilter === 'all' || costCenter.budgetPeriod === budgetPeriodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const handleCreateCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Cost center code and name are required');
      return;
    }

    // Check if code already exists
    if (costCenters.some(cc => cc.code.toLowerCase() === formData.code.toLowerCase())) {
      toast.error('Cost center code already exists');
      return;
    }

    try {
      const newCostCenter: CostCenter = {
        id: Date.now().toString(),
        ...formData,
        actualSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCostCenters([...costCenters, newCostCenter]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Cost center created successfully');
    } catch (error) {
      console.error('Failed to create cost center:', error);
      toast.error('Failed to create cost center');
    }
  };

  const handleEditCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCostCenter) return;

    // Check if code already exists (excluding current cost center)
    if (costCenters.some(cc => 
      cc.id !== selectedCostCenter.id && 
      cc.code.toLowerCase() === formData.code.toLowerCase()
    )) {
      toast.error('Cost center code already exists');
      return;
    }

    try {
      const updatedCostCenter: CostCenter = {
        ...selectedCostCenter,
        ...formData,
        updatedAt: new Date().toISOString()
      };
      setCostCenters(costCenters.map(cc => cc.id === selectedCostCenter.id ? updatedCostCenter : cc));
      setIsEditModalOpen(false);
      setSelectedCostCenter(null);
      resetForm();
      toast.success('Cost center updated successfully');
    } catch (error) {
      console.error('Failed to update cost center:', error);
      toast.error('Failed to update cost center');
    }
  };

  const handleDeleteCostCenter = async (costCenterId: string) => {
    if (!confirm('Are you sure you want to delete this cost center? This action cannot be undone.')) return;

    try {
      setCostCenters(costCenters.filter(cc => cc.id !== costCenterId));
      toast.success('Cost center deleted successfully');
    } catch (error) {
      console.error('Failed to delete cost center:', error);
      toast.error('Failed to delete cost center');
    }
  };

  const handleToggleStatus = async (costCenter: CostCenter) => {
    try {
      const updatedCostCenter: CostCenter = {
        ...costCenter,
        isActive: !costCenter.isActive,
        updatedAt: new Date().toISOString()
      };
      setCostCenters(costCenters.map(cc => cc.id === costCenter.id ? updatedCostCenter : cc));
      toast.success(`Cost center ${updatedCostCenter.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update cost center status:', error);
      toast.error('Failed to update cost center status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      budget: 0,
      budgetPeriod: 'monthly',
      manager: '',
      department: '',
      isActive: true
    });
  };

  const openEditModal = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setFormData({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description,
      budget: costCenter.budget,
      budgetPeriod: costCenter.budgetPeriod,
      manager: costCenter.manager,
      department: costCenter.department || '',
      isActive: costCenter.isActive
    });
    setIsEditModalOpen(true);
  };

  const getBudgetStatus = (budget: number, actualSpent: number) => {
    const percentage = (actualSpent / budget) * 100;
    if (percentage > 100) return { status: 'over', color: 'text-red-600', icon: TrendingUp };
    if (percentage > 90) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', icon: TrendingDown };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('users.view')) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage cost centers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cost Center Management</h2>
          <p className="text-gray-600 mt-1">Manage cost centers for budget tracking and financial reporting</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cost Center</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost Centers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{costCenters.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(costCenters.reduce((sum, cc) => sum + cc.budget, 0))}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(costCenters.reduce((sum, cc) => sum + cc.actualSpent, 0))}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Over Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {costCenters.filter(cc => cc.actualSpent > cc.budget).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cost centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="sm:w-40">
            <select
              value={budgetPeriodFilter}
              onChange={(e) => setBudgetPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Periods</option>
              {budgetPeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCostCenters.map((costCenter) => {
                const budgetStatus = getBudgetStatus(costCenter.budget, costCenter.actualSpent);
                const StatusIcon = budgetStatus.icon;
                const utilizationPercentage = (costCenter.actualSpent / costCenter.budget) * 100;

                return (
                  <tr key={costCenter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{costCenter.code}</div>
                          <div className="text-sm text-gray-500">{costCenter.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{costCenter.manager}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {costCenter.department || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(costCenter.budget)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {costCenter.budgetPeriod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(costCenter.actualSpent)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            utilizationPercentage > 100 ? 'bg-red-500' :
                            utilizationPercentage > 90 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className={`text-xs mt-1 ${budgetStatus.color}`}>
                        {utilizationPercentage.toFixed(1)}% utilized
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(costCenter)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          costCenter.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {costCenter.isActive ? (
                          <>
                            <ToggleRight className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        <Calendar className="w-3 h-3 mr-1" />
                        {costCenter.budgetPeriod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <div className={`p-1 rounded ${budgetStatus.color}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <button
                          onClick={() => openEditModal(costCenter)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit Cost Center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCostCenter(costCenter.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Cost Center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCostCenters.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cost centers found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create Cost Center Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Add New Cost Center"
        size="lg"
      >
        <form onSubmit={handleCreateCostCenter} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Center Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., CC-001"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Center Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter cost center name"
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
              placeholder="Enter cost center description"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Period *
              </label>
              <select
                required
                value={formData.budgetPeriod}
                onChange={(e) => setFormData({ ...formData, budgetPeriod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {budgetPeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manager name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active cost center
            </label>
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
              Add Cost Center
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Cost Center Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCostCenter(null);
          resetForm();
        }}
        title="Edit Cost Center"
        size="lg"
      >
        <form onSubmit={handleEditCostCenter} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Center Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Center Name *
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Period *
              </label>
              <select
                required
                value={formData.budgetPeriod}
                onChange={(e) => setFormData({ ...formData, budgetPeriod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {budgetPeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
              Active cost center
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCostCenter(null);
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
              Update Cost Center
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CostCenterManagement;