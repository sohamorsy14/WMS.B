import React, { useState, useEffect } from 'react';
import { CabinetTemplate } from '../../types/cabinet';
import { Plus, Minus, Save, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface TemplateCreatorProps {
  onTemplateCreated: (template: CabinetTemplate) => void;
  onCancel: () => void;
  editTemplate?: CabinetTemplate;
}

const TemplateCreator: React.FC<TemplateCreatorProps> = ({
  onTemplateCreated,
  onCancel,
  editTemplate
}) => {
  const [template, setTemplate] = useState<Partial<CabinetTemplate>>({
    id: '',
    name: '',
    type: 'base',
    category: 'Base Cabinets',
    defaultDimensions: { width: 600, height: 720, depth: 560 },
    minDimensions: { width: 300, height: 700, depth: 500 },
    maxDimensions: { width: 1200, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: '',
    features: [],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 2,
      slides: 0,
      handles: 1,
      shelves: 1,
      shelfPins: 4,
      drawerBoxType: 'standard'
    },
    isActive: true,
    isCustom: true
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (editTemplate) {
      setTemplate({
        ...editTemplate,
        // Ensure all required fields exist
        materialThickness: {
          ...{
            side: 18,
            topBottom: 18,
            back: 12,
            shelf: 18,
            door: 18,
            drawer: 15,
            fixedPanel: 18,
            drawerBottom: 12,
            uprights: 18,
            doubleBack: 12
          },
          ...editTemplate.materialThickness
        }
      });
    }
  }, [editTemplate]);

  const handleChange = (field: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionChange = (
    dimensionType: 'defaultDimensions' | 'minDimensions' | 'maxDimensions',
    dimension: 'width' | 'height' | 'depth',
    value: number
  ) => {
    setTemplate(prev => ({
      ...prev,
      [dimensionType]: {
        ...prev[dimensionType],
        [dimension]: value
      }
    }));
  };

  const handleMaterialThicknessChange = (component: string, value: number) => {
    setTemplate(prev => ({
      ...prev,
      materialThickness: {
        ...prev.materialThickness,
        [component]: value
      }
    }));
  };

  const handleHardwareChange = (item: string, value: number | string) => {
    setTemplate(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        [item]: value
      }
    }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    
    setTemplate(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template.name || !template.type || !template.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate ID if it's a new template
    const finalTemplate: CabinetTemplate = {
      ...template as CabinetTemplate,
      id: template.id || `${template.type}-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    onTemplateCreated(finalTemplate);
  };

  const cabinetTypes = [
    { value: 'base', label: 'Base Cabinet' },
    { value: 'wall', label: 'Wall Cabinet' },
    { value: 'tall', label: 'Tall Cabinet' },
    { value: 'drawer', label: 'Drawer Unit' },
    { value: 'corner', label: 'Corner Cabinet' },
    { value: 'specialty', label: 'Specialty Cabinet' }
  ];

  const categories = [
    'Base Cabinets',
    'Wall Cabinets',
    'Tall Cabinets',
    'Corner Solutions',
    'Specialty Cabinets',
    'Drawer Units',
    'Vanities',
    'Kitchen Islands',
    'Custom Cabinets'
  ];

  const drawerBoxTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'dovetail', label: 'Dovetail' },
    { value: 'metal', label: 'Metal' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs for different sections */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <a href="#basic" className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
            Basic Information
          </a>
          <a href="#construction" className="border-transparent border-b-2 py-2 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Construction
          </a>
          <a href="#materials" className="border-transparent border-b-2 py-2 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Materials
          </a>
          <a href="#hardware" className="border-transparent border-b-2 py-2 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
            Hardware
          </a>
        </nav>
      </div>

      {/* Basic Information Section */}
      <div id="basic" className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={template.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Single Door Base Cabinet"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cabinet Type *
            </label>
            <select
              required
              value={template.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {cabinetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={template.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview Image URL
            </label>
            <input
              type="text"
              value={template.previewImage}
              onChange={(e) => handleChange('previewImage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={template.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the cabinet template..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Soft-close hinges"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {template.features?.map((feature, index) => (
              <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span className="text-sm">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Dimensions (mm)
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Width:</span>
                <input
                  type="number"
                  value={template.defaultDimensions?.width}
                  onChange={(e) => handleDimensionChange('defaultDimensions', 'width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Height:</span>
                <input
                  type="number"
                  value={template.defaultDimensions?.height}
                  onChange={(e) => handleDimensionChange('defaultDimensions', 'height', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Depth:</span>
                <input
                  type="number"
                  value={template.defaultDimensions?.depth}
                  onChange={(e) => handleDimensionChange('defaultDimensions', 'depth', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Dimensions (mm)
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Width:</span>
                <input
                  type="number"
                  value={template.minDimensions?.width}
                  onChange={(e) => handleDimensionChange('minDimensions', 'width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Height:</span>
                <input
                  type="number"
                  value={template.minDimensions?.height}
                  onChange={(e) => handleDimensionChange('minDimensions', 'height', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Depth:</span>
                <input
                  type="number"
                  value={template.minDimensions?.depth}
                  onChange={(e) => handleDimensionChange('minDimensions', 'depth', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Dimensions (mm)
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Width:</span>
                <input
                  type="number"
                  value={template.maxDimensions?.width}
                  onChange={(e) => handleDimensionChange('maxDimensions', 'width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Height:</span>
                <input
                  type="number"
                  value={template.maxDimensions?.height}
                  onChange={(e) => handleDimensionChange('maxDimensions', 'height', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <span className="w-16 text-sm text-gray-500">Depth:</span>
                <input
                  type="number"
                  value={template.maxDimensions?.depth}
                  onChange={(e) => handleDimensionChange('maxDimensions', 'depth', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Construction Section */}
      <div id="construction" className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Construction</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Cabinet Structure</h4>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasTop"
                checked={template.construction?.hasTop !== false}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasTop: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasTop" className="ml-2 text-sm text-gray-700">
                Has Top Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasBottom"
                checked={template.construction?.hasBottom !== false}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasBottom: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasBottom" className="ml-2 text-sm text-gray-700">
                Has Bottom Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasBack"
                checked={template.construction?.hasBack !== false}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasBack: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasBack" className="ml-2 text-sm text-gray-700">
                Has Back Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasDoubleBack"
                checked={template.construction?.hasDoubleBack === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasDoubleBack: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasDoubleBack" className="ml-2 text-sm text-gray-700">
                Has Double Back Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasToe"
                checked={template.construction?.hasToe === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasToe: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasToe" className="ml-2 text-sm text-gray-700">
                Has Toe Kick
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Special Features</h4>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasFixedShelf"
                checked={template.construction?.hasFixedShelf === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasFixedShelf: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasFixedShelf" className="ml-2 text-sm text-gray-700">
                Has Fixed Shelf
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCorner"
                checked={template.construction?.isCorner === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  isCorner: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isCorner" className="ml-2 text-sm text-gray-700">
                Is Corner Cabinet
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasFrontPanel"
                checked={template.construction?.hasFrontPanel === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasFrontPanel: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasFrontPanel" className="ml-2 text-sm text-gray-700">
                Has Front Fixed Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasFillerPanel"
                checked={template.construction?.hasFillerPanel === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasFillerPanel: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasFillerPanel" className="ml-2 text-sm text-gray-700">
                Has Filler Panel
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasUprights"
                checked={template.construction?.hasUprights === true}
                onChange={(e) => handleChange('construction', {
                  ...template.construction,
                  hasUprights: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasUprights" className="ml-2 text-sm text-gray-700">
                Has Uprights
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div id="materials" className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Materials</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Material Thickness (mm)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Side Panels
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.side}
                  onChange={(e) => handleMaterialThicknessChange('side', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top/Bottom Panels
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.topBottom}
                  onChange={(e) => handleMaterialThicknessChange('topBottom', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back Panel
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.back}
                  onChange={(e) => handleMaterialThicknessChange('back', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Double Back Panel
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.doubleBack}
                  onChange={(e) => handleMaterialThicknessChange('doubleBack', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelves
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.shelf}
                  onChange={(e) => handleMaterialThicknessChange('shelf', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doors/Fronts
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.door}
                  onChange={(e) => handleMaterialThicknessChange('door', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drawer Box
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.drawer}
                  onChange={(e) => handleMaterialThicknessChange('drawer', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drawer Bottom
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.drawerBottom}
                  onChange={(e) => handleMaterialThicknessChange('drawerBottom', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Panel
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.fixedPanel}
                  onChange={(e) => handleMaterialThicknessChange('fixedPanel', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uprights
                </label>
                <input
                  type="number"
                  value={template.materialThickness?.uprights}
                  onChange={(e) => handleMaterialThicknessChange('uprights', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Material Options</h4>
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              Material options are for reference only. Actual material selection and sheet optimization will be done during the nesting stage.
            </p>
            
            <div className="space-y-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Body Materials</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bodyPlywood"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="bodyPlywood" className="ml-2 text-sm text-gray-700">
                      Plywood
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bodyMDF"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="bodyMDF" className="ml-2 text-sm text-gray-700">
                      MDF
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bodyMelamine"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="bodyMelamine" className="ml-2 text-sm text-gray-700">
                      Melamine
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bodySolidWood"
                      checked={false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="bodySolidWood" className="ml-2 text-sm text-gray-700">
                      Solid Wood
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Door Materials</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doorPlywood"
                      checked={false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="doorPlywood" className="ml-2 text-sm text-gray-700">
                      Plywood
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doorMDF"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="doorMDF" className="ml-2 text-sm text-gray-700">
                      MDF
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doorMelamine"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="doorMelamine" className="ml-2 text-sm text-gray-700">
                      Melamine
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doorSolidWood"
                      checked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      readOnly
                    />
                    <label htmlFor="doorSolidWood" className="ml-2 text-sm text-gray-700">
                      Solid Wood
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Section */}
      <div id="hardware" className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Hardware</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Hardware Quantities</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hinges
                </label>
                <input
                  type="number"
                  min="0"
                  value={template.hardware?.hinges}
                  onChange={(e) => handleHardwareChange('hinges', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drawer Slides (pairs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={template.hardware?.slides}
                  onChange={(e) => handleHardwareChange('slides', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handles
                </label>
                <input
                  type="number"
                  min="0"
                  value={template.hardware?.handles}
                  onChange={(e) => handleHardwareChange('handles', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelves
                </label>
                <input
                  type="number"
                  min="0"
                  value={template.hardware?.shelves}
                  onChange={(e) => handleHardwareChange('shelves', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Pins
                </label>
                <input
                  type="number"
                  min="0"
                  value={template.hardware?.shelfPins}
                  onChange={(e) => handleHardwareChange('shelfPins', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Drawer Box Type</h4>
            
            <div className="space-y-2">
              {drawerBoxTypes.map((type) => (
                <div key={type.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`drawerBoxType-${type.value}`}
                    name="drawerBoxType"
                    value={type.value}
                    checked={template.hardware?.drawerBoxType === type.value}
                    onChange={() => handleHardwareChange('drawerBoxType', type.value)}
                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`drawerBoxType-${type.value}`} className="ml-2 text-sm text-gray-700">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-4">Status</h4>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={template.isActive !== false}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (available in catalog)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {editTemplate ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

export default TemplateCreator;