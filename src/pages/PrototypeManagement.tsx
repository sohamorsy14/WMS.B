import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, Lightbulb, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Layers } from 'lucide-react';
import { Prototype, BOM } from '../types';
import { prototypeService, bomService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

interface PrototypeFormData {
  prototypeNumber: string;
  name: string;
  description: string;
  category: string;
  designer: string;
  notes: string;
}

const PrototypeManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype | null>(null);
  const [prototypeBoms, setPrototypeBoms] = useState<BOM[]>([]);
  const [formData, setFormData] = useState<PrototypeFormData>({
    prototypeNumber: '',
    name: '',
    description: '',
    category: '',
    designer: '',
    notes: ''
  });

  const statusOptions = [
    { value: 'concept', label: 'Concept', color: 'bg-gray-100 text-gray-800' },
    { value: 'design', label: 'Design', color: 'bg-blue-100 text-blue-800' },
    { value: 'testing', label: 'Testing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  const categories = [
    'Kitchen Cabinets',
    'Bathroom Vanities',
    'Storage Solutions',
    'Kitchen Islands',
    'Entertainment Centers',
    'Office Furniture',
    'Custom Components',
    'Hardware Solutions'
  ];

  useEffect(() => {
    fetchPrototypes();
    fetchBoms();
  }, []);

  const fetchPrototypes = async () => {
    try {
      const data = await prototypeService.getAll();
      setPrototypes(data);
    } catch (error) {
      console.error('Failed to fetch prototypes:', error);
      toast.error('Failed to load prototypes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoms = async () => {
    try {
      const data = await bomService.getAll();
      setBoms(data);
    } catch (error) {
      console.error('Failed to fetch BOMs:', error);
    }
  };

  const filteredPrototypes = prototypes.filter(prototype => {
    const matchesSearch = prototype.prototypeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prototype.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prototype.designer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prototype.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || prototype.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const generatePrototypeNumber = () => {
    const year = new Date().getFullYear();
    const count = prototypes.length + 1;
    return `PROTO-${year}-${count.toString().padStart(3, '0')}`;
  };

  const handleCreatePrototype = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast.error('Prototype name and category are required');
      return;
    }

    try {
      const newPrototype = await prototypeService.create({
        ...formData,
        prototypeNumber: formData.prototypeNumber || generatePrototypeNumber(),
        status: 'concept',
        createdDate: new Date().toISOString()
      });
      setPrototypes([newPrototype, ...prototypes]);
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Prototype created successfully');
    } catch (error) {
      console.error('Failed to create prototype:', error);
      toast.error('Failed to create prototype');
    }
  };

  const handleEditPrototype = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrototype) return;

    try {
      const updatedPrototype = await prototypeService.update(selectedPrototype.id, formData);
      setPrototypes(prototypes.map(p => p.id === selectedPrototype.id ? updatedPrototype : p));
      setIsEditModalOpen(false);
      setSelectedPrototype(null);
      resetForm();
      toast.success('Prototype updated successfully');
    } catch (error) {
      console.error('Failed to update prototype:', error);
      toast.error('Failed to update prototype');
    }
  };

  const handleDeletePrototype = async (prototypeId: string) => {
    if (!confirm('Are you sure you want to delete this prototype? This will also affect linked BOMs.')) return;

    try {
      await prototypeService.delete(prototypeId);
      setPrototypes(prototypes.filter(p => p.id !== prototypeId));
      toast.success('Prototype deleted successfully');
    } catch (error) {
      console.error('Failed to delete prototype:', error);
      toast.error('Failed to delete prototype');
    }
  };

  const handleStatusChange = async (prototypeId: string, newStatus: string) => {
    try {
      const prototype = prototypes.find(p => p.id === prototypeId);
      if (!prototype) return;

      const updatedPrototype = await prototypeService.update(prototypeId, { 
        ...prototype, 
        status: newStatus as any,
        approvalDate: newStatus === 'approved' ? new Date().toISOString() : prototype.approvalDate
      });
      setPrototypes(prototypes.map(p => p.id === prototypeId ? updatedPrototype : p));
      toast.success(`Prototype status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update prototype status:', error);
      toast.error('Failed to update prototype status');
    }
  };

  const resetForm = () => {
    setFormData({
      prototypeNumber: '',
      name: '',
      description: '',
      category: '',
      designer: '',
      notes: ''
    });
  };

  const openViewModal = async (prototype: Prototype) => {
    setSelectedPrototype(prototype);
    // Fetch BOMs linked to this prototype
    try {
      const linkedBoms = await bomService.getByLinkedId('prototype', prototype.id);
      setPrototypeBoms(linkedBoms);
    } catch (error) {
      console.error('Failed to fetch linked BOMs:', error);
      setPrototypeBoms([]);
    }
    setIsViewModalOpen(true);
  };

  const openEditModal = (prototype: Prototype) => {
    setSelectedPrototype(prototype);
    setFormData({
      prototypeNumber: prototype.prototypeNumber,
      name: prototype.name,
      description: prototype.description,
      category: prototype.category,
      designer: prototype.designer,
      notes: prototype.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concept': return <Lightbulb className="w-4 h-4" />;
      case 'design': return <AlertCircle className="w-4 h-4" />;
      case 'testing': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('prototypes.view')) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view prototypes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prototype Management</h1>
          <p className="text-gray-600 mt-1">Manage product prototypes and design concepts</p>
        </div>
        {hasPermission('prototypes.create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Prototype</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusOptions.slice(1, 5).map((status) => {
          const count = prototypes.filter(prototype => prototype.status === status.value).length;
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
                placeholder="Search prototypes..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prototypes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prototype Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BOMs
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
              {filteredPrototypes.map((prototype) => (
                <tr key={prototype.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{prototype.prototypeNumber}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{prototype.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {prototype.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{prototype.designer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={prototype.status}
                      onChange={(e) => handleStatusChange(prototype.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(prototype.status)} focus:ring-2 focus:ring-blue-500`}
                      disabled={!hasPermission('prototypes.update')}
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
                      <Layers className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{prototype.bomCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prototype.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openViewModal(prototype)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasPermission('prototypes.update') && (
                        <button
                          onClick={() => openEditModal(prototype)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit Prototype"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('prototypes.delete') && (
                        <button
                          onClick={() => handleDeletePrototype(prototype.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Prototype"
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

        {filteredPrototypes.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prototypes found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Create Prototype Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Prototype"
        size="lg"
      >
        <form onSubmit={handleCreatePrototype} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prototype Number
              </label>
              <input
                type="text"
                value={formData.prototypeNumber}
                onChange={(e) => setFormData({ ...formData, prototypeNumber: e.target.value })}
                placeholder={generatePrototypeNumber()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prototype Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter prototype name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
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
                Designer
              </label>
              <input
                type="text"
                value={formData.designer}
                onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter designer name"
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
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the prototype concept, features, and objectives..."
            />
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
              Create Prototype
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Prototype Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPrototype(null);
          resetForm();
        }}
        title="Edit Prototype"
        size="lg"
      >
        <form onSubmit={handleEditPrototype} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prototype Number
              </label>
              <input
                type="text"
                value={formData.prototypeNumber}
                onChange={(e) => setFormData({ ...formData, prototypeNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prototype Name *
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
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
                Designer
              </label>
              <input
                type="text"
                value={formData.designer}
                onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
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
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
                setSelectedPrototype(null);
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
              Update Prototype
            </button>
          </div>
        </form>
      </Modal>

      {/* View Prototype Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPrototype(null);
          setPrototypeBoms([]);
        }}
        title="Prototype Details"
        size="xl"
      >
        {selectedPrototype && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prototype Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPrototype.prototypeNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedPrototype.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                    {selectedPrototype.category}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designer</label>
                  <p className="text-gray-900">{selectedPrototype.designer}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedPrototype.status)}`}>
                    {getStatusIcon(selectedPrototype.status)}
                    <span className="ml-1">{statusOptions.find(s => s.value === selectedPrototype.status)?.label}</span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="text-gray-900">{new Date(selectedPrototype.createdDate).toLocaleDateString()}</p>
                </div>
                {selectedPrototype.approvalDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Approval Date</label>
                    <p className="text-gray-900">{new Date(selectedPrototype.approvalDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">BOMs Count</label>
                  <div className="flex items-center mt-1">
                    <Layers className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">{selectedPrototype.bomCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{selectedPrototype.description}</p>
              </div>
            </div>

            {selectedPrototype.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedPrototype.notes}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Linked BOMs ({prototypeBoms.length})</h4>
              {prototypeBoms.length > 0 ? (
                <div className="space-y-2">
                  {prototypeBoms.map((bom) => (
                    <div key={bom.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{bom.bomNumber}</div>
                        <div className="text-sm text-gray-600">{bom.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">${bom.totalCost.toFixed(2)}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bom.status === 'approved' ? 'bg-green-100 text-green-800' :
                          bom.status === 'in_production' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bom.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No BOMs linked to this prototype yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrototypeManagement;