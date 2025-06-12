import React, { useState, useEffect } from 'react';
import { CabinetTemplate } from '../../types/cabinet';
import { Plus, Edit, Trash2, Eye, Package, Settings, Search, Filter } from 'lucide-react';
import { CabinetStorageService } from '../../services/cabinetCalculator';
import TemplateCreator from './TemplateCreator';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';

interface TemplateManagerProps {
  defaultTemplates: CabinetTemplate[];
  onSelectTemplate: (template: CabinetTemplate) => void;
  onAddTemplate: (template: CabinetTemplate) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  defaultTemplates,
  onSelectTemplate,
  onAddTemplate
}) => {
  const [customTemplates, setCustomTemplates] = useState<CabinetTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CabinetTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = () => {
    const templates = CabinetStorageService.getCustomTemplates();
    setCustomTemplates(templates);
  };

  const handleTemplateCreated = (template: CabinetTemplate) => {
    loadCustomTemplates();
    onAddTemplate(template);
    setIsCreateModalOpen(false);
  };

  const handleTemplateUpdated = (template: CabinetTemplate) => {
    loadCustomTemplates();
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
    toast.success('Template updated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      CabinetStorageService.deleteTemplate(templateId);
      loadCustomTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const allTemplates = [...defaultTemplates, ...customTemplates];
  
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesCustom = showCustomOnly ? template.isCustom : true;
    return matchesSearch && matchesType && matchesCategory && matchesCustom;
  });

  const cabinetTypes = [
    { value: 'base', label: 'Base Cabinet' },
    { value: 'wall', label: 'Wall Cabinet' },
    { value: 'tall', label: 'Tall Cabinet' },
    { value: 'drawer', label: 'Drawer Unit' },
    { value: 'corner', label: 'Corner Cabinet' },
    { value: 'specialty', label: 'Specialty Cabinet' }
  ];

  const categories = [...new Set(allTemplates.map(t => t.category))];

  const getTypeColor = (type: string) => {
    const colors = {
      base: 'bg-blue-100 text-blue-800',
      wall: 'bg-green-100 text-green-800',
      tall: 'bg-purple-100 text-purple-800',
      drawer: 'bg-orange-100 text-orange-800',
      corner: 'bg-red-100 text-red-800',
      specialty: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Cabinet Template Management</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {cabinetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="showCustomOnly"
            checked={showCustomOnly}
            onChange={(e) => setShowCustomOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="showCustomOnly" className="ml-2 text-sm text-gray-700">
            Show custom templates only
          </label>
        </div>
      </div>
      
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              template.isCustom ? 'border-blue-300' : 'border-gray-200'
            } hover:shadow-md`}
          >
            {/* Preview Image */}
            <div className="aspect-w-4 aspect-h-3 rounded-t-lg overflow-hidden">
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-48 object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {template.name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(template.type)}`}>
                  {template.type}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>

              {/* Default Dimensions */}
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Ruler className="w-4 h-4 mr-1" />
                <span>
                  {template.defaultDimensions.width} × {template.defaultDimensions.height} × {template.defaultDimensions.depth}mm
                </span>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="w-4 h-4 mr-2" />
                  <span>{template.features.length} features</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 2 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{template.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onSelectTemplate(template)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </button>
                
                <div className="flex space-x-2">
                  {template.isCustom && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsEditModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                        title="Edit Template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or create a new template.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Template
          </button>
        </div>
      )}
      
      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Cabinet Template"
        size="xl"
      >
        <TemplateCreator
          onTemplateCreated={handleTemplateCreated}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
      
      {/* Edit Template Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTemplate(null);
        }}
        title="Edit Cabinet Template"
        size="xl"
      >
        {selectedTemplate && (
          <TemplateCreator
            onTemplateCreated={handleTemplateUpdated}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedTemplate(null);
            }}
            editTemplate={selectedTemplate}
          />
        )}
      </Modal>
    </div>
  );
};

export default TemplateManager;