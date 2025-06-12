import React, { useState } from 'react';
import { CabinetTemplate } from '../../../types/cabinet';
import { Plus, X } from 'lucide-react';

interface BasicInformationTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

const BasicInformationTab: React.FC<BasicInformationTabProps> = ({ template, setTemplate }) => {
  const [newFeature, setNewFeature] = useState('');

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

  return (
    <div className="space-y-6">
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
  );
};

export default BasicInformationTab;