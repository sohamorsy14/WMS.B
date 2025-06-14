import React, { useState } from 'react';
import { CabinetTemplate } from '../../types/cabinet';
import { Ruler, Package, Settings, Eye, Copy, Plus } from 'lucide-react';
import { CabinetCalculatorService } from '../../services/cabinetCalculator';
import toast from 'react-hot-toast';
import Modal from '../Common/Modal';

interface CabinetCatalogProps {
  templates: CabinetTemplate[];
  onSelectTemplate: (template: CabinetTemplate) => void;
  onAddTemplate: (template: CabinetTemplate) => void;
  selectedTemplate?: CabinetTemplate;
}

const CabinetCatalog: React.FC<CabinetCatalogProps> = ({
  templates,
  onSelectTemplate,
  onAddTemplate,
  selectedTemplate
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageTemplate, setSelectedImageTemplate] = useState<CabinetTemplate | null>(null);
  const [templateToCopy, setTemplateToCopy] = useState<CabinetTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  const categories = [...new Set(templates.map(t => t.category))];
  const types = [...new Set(templates.map(t => t.type))];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesType && matchesSearch && template.isActive;
  });

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

  const handleCopyTemplate = (template: CabinetTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateToCopy(template);
    setNewTemplateName(`Copy of ${template.name}`);
    setIsCopyModalOpen(true);
  };

  const handleCreateCopy = () => {
    if (!templateToCopy) return;
    
    if (!newTemplateName.trim()) {
      toast.error('Please enter a name for the new template');
      return;
    }

    try {
      const newTemplate = CabinetCalculatorService.copyTemplate(templateToCopy, newTemplateName);
      onAddTemplate(newTemplate);
      setIsCopyModalOpen(false);
      setTemplateToCopy(null);
      setNewTemplateName('');
      toast.success('Template copied successfully');
    } catch (error) {
      console.error('Error copying template:', error);
      toast.error('Failed to copy template');
    }
  };

  const handleViewImage = (template: CabinetTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageTemplate(template);
    setIsImageModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cabinet Catalog</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cabinets..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cabinet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            {/* Preview Image */}
            <div className="aspect-w-4 aspect-h-3 rounded-t-lg overflow-hidden">
              <img
                src={template.previewImage || "https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400"}
                alt={template.name}
                className="w-full h-48 object-cover"
                onClick={(e) => handleViewImage(template, e)}
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
                  <span>{template.features?.length || 0} features</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.features?.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features && template.features.length > 2 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{template.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                  }}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleCopyTemplate(template, e)}
                    className="flex items-center text-sm text-green-600 hover:text-green-800"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                  
                  <button
                    onClick={(e) => handleViewImage(template, e)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cabinets found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more options.</p>
        </div>
      )}

      {/* Copy Template Modal */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setTemplateToCopy(null);
          setNewTemplateName('');
        }}
        title="Copy Cabinet Template"
        size="md"
      >
        <div className="space-y-4">
          {templateToCopy && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={templateToCopy.previewImage || "https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400"} 
                  alt={templateToCopy.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">{templateToCopy.name}</h3>
                <p className="text-sm text-blue-700">{templateToCopy.type} - {templateToCopy.category}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Template Name
            </label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter name for the new template"
            />
          </div>

          <p className="text-sm text-gray-600">
            This will create a copy of the selected template with all its properties and settings.
            You can modify the copy without affecting the original template.
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsCopyModalOpen(false);
                setTemplateToCopy(null);
                setNewTemplateName('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCopy}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Copy
            </button>
          </div>
        </div>
      </Modal>

      {/* View Image Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedImageTemplate(null);
        }}
        title={selectedImageTemplate?.name || "Cabinet Preview"}
        size="lg"
      >
        <div className="space-y-4">
          {selectedImageTemplate && (
            <div className="flex flex-col items-center">
              <div className="w-full max-h-[500px] overflow-hidden rounded-lg">
                <img 
                  src={selectedImageTemplate.previewImage || "https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400"} 
                  alt={selectedImageTemplate.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-medium text-gray-900">{selectedImageTemplate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedImageTemplate.description}</p>
                <div className="flex items-center justify-center mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedImageTemplate.type)}`}>
                    {selectedImageTemplate.type}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{selectedImageTemplate.category}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsImageModalOpen(false);
                setSelectedImageTemplate(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {selectedImageTemplate && (
              <button
                onClick={() => {
                  setIsImageModalOpen(false);
                  onSelectTemplate(selectedImageTemplate);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CabinetCatalog;