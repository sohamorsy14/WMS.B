import React, { useState, useRef } from 'react';
import { CabinetTemplate } from '../../types/cabinet';
import { Plus, Trash2, Save, Image, Package, Ruler, Settings, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { CabinetStorageService } from '../../services/cabinetCalculator';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>(editTemplate?.previewImage || '');
  const [template, setTemplate] = useState<Partial<CabinetTemplate>>(
    editTemplate || {
      id: `template-${Date.now()}`,
      name: '',
      type: 'base',
      category: '',
      defaultDimensions: { width: 600, height: 720, depth: 560 },
      minDimensions: { width: 300, height: 600, depth: 500 },
      maxDimensions: { width: 1200, height: 900, depth: 650 },
      previewImage: '',
      description: '',
      features: [],
      construction: {
        hasTop: true,
        hasBottom: true,
        hasBack: true,
        hasDoubleBack: false,
        hasToe: true,
        hasFixedShelf: false,
        isCorner: false,
        hasFrontPanel: false,
        hasFillerPanel: false
      },
      materialOptions: {
        body: ['Plywood', 'MDF', 'Melamine'],
        doors: ['Melamine', 'MDF', 'Solid Wood'],
        drawers: ['Plywood', 'MDF'],
        shelves: ['Plywood', 'MDF', 'Melamine']
      },
      materialThickness: {
        side: 18,
        topBottom: 18,
        back: 12,
        shelf: 18,
        door: 18,
        drawer: 15,
        fixedPanel: 18
      },
      hardware: {
        hinges: 2,
        slides: 0,
        handles: 1,
        shelves: 1,
        shelfPins: 4,
        drawerBoxType: 'standard'
      },
      edgeBanding: {
        bodyVisible: true,
        bodyHidden: false,
        shelfFront: true,
        shelfSides: false,
        doorAll: true
      },
      isActive: true,
      isCustom: true,
      createdAt: new Date().toISOString()
    }
  );
  const [newFeature, setNewFeature] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'construction' | 'materials' | 'hardware'>('basic');

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
    'Kitchen Islands',
    'Bathroom Vanities',
    'Storage Solutions',
    'Custom'
  ];

  const materialTypes = [
    'Plywood',
    'MDF',
    'Melamine',
    'Solid Wood',
    'Veneer',
    'Laminate',
    'Particleboard'
  ];

  const drawerBoxTypes = [
    { value: 'standard', label: 'Standard (Butt Joint)' },
    { value: 'dovetail', label: 'Dovetail Joint' },
    { value: 'metal', label: 'Metal Drawer System' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
        setTemplate(prev => ({
          ...prev,
          previewImage: event.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    
    setTemplate(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    field: string
  ) => {
    const value = e.target.value;
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    dimensionType: 'defaultDimensions' | 'minDimensions' | 'maxDimensions',
    dimension: 'width' | 'height' | 'depth'
  ) => {
    const value = parseInt(e.target.value) || 0;
    setTemplate(prev => ({
      ...prev,
      [dimensionType]: {
        ...prev[dimensionType],
        [dimension]: value
      }
    }));
  };

  const handleMaterialThicknessChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    part: keyof CabinetTemplate['materialThickness']
  ) => {
    const value = parseInt(e.target.value) || 0;
    setTemplate(prev => ({
      ...prev,
      materialThickness: {
        ...prev.materialThickness,
        [part]: value
      }
    }));
  };

  const handleHardwareChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    part: keyof CabinetTemplate['hardware']
  ) => {
    const value = e.target.type === 'number' 
      ? parseInt(e.target.value) || 0 
      : e.target.value;
    
    setTemplate(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        [part]: value
      }
    }));
  };

  const handleConstructionChange = (
    field: keyof CabinetTemplate['construction'],
    value: boolean
  ) => {
    setTemplate(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        [field]: value
      }
    }));
  };

  const handleMaterialOptionChange = (
    materialType: keyof CabinetTemplate['materialOptions'],
    material: string,
    isChecked: boolean
  ) => {
    setTemplate(prev => {
      const currentOptions = [...(prev.materialOptions?.[materialType] || [])];
      
      if (isChecked && !currentOptions.includes(material)) {
        currentOptions.push(material);
      } else if (!isChecked && currentOptions.includes(material)) {
        const index = currentOptions.indexOf(material);
        currentOptions.splice(index, 1);
      }
      
      return {
        ...prev,
        materialOptions: {
          ...prev.materialOptions,
          [materialType]: currentOptions
        }
      };
    });
  };

  const handleEdgeBandingChange = (
    field: keyof CabinetTemplate['edgeBanding'],
    value: boolean
  ) => {
    setTemplate(prev => ({
      ...prev,
      edgeBanding: {
        ...prev.edgeBanding,
        [field]: value
      }
    }));
  };

  const validateTemplate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!template.name) newErrors.name = 'Name is required';
    if (!template.category) newErrors.category = 'Category is required';
    if (!template.description) newErrors.description = 'Description is required';
    if (!previewImage) newErrors.previewImage = 'Preview image is required';
    if (!template.features || template.features.length === 0) newErrors.features = 'At least one feature is required';
    
    // Validate dimensions
    if (template.minDimensions && template.maxDimensions && template.defaultDimensions) {
      ['width', 'height', 'depth'].forEach(dim => {
        const d = dim as 'width' | 'height' | 'depth';
        if (template.minDimensions![d] > template.defaultDimensions![d]) {
          newErrors[`min_${dim}`] = `Min ${dim} cannot be greater than default ${dim}`;
        }
        if (template.maxDimensions![d] < template.defaultDimensions![d]) {
          newErrors[`max_${dim}`] = `Max ${dim} cannot be less than default ${dim}`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateTemplate()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    
    try {
      // Save to local storage
      CabinetStorageService.saveTemplate(template as CabinetTemplate);
      
      // Notify parent component
      onTemplateCreated(template as CabinetTemplate);
      
      toast.success(`Cabinet template ${editTemplate ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleImageFromUrl = () => {
    const url = prompt('Enter image URL:');
    if (!url) return;
    
    // Basic URL validation
    if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
      toast.error('Please enter a valid image URL (jpg, png, or webp)');
      return;
    }
    
    setPreviewImage(url);
    setTemplate(prev => ({
      ...prev,
      previewImage: url
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {editTemplate ? 'Edit Cabinet Template' : 'Create New Cabinet Template'}
        </h2>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'construction'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Construction
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Materials
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hardware'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hardware
          </button>
        </nav>
      </div>
      
      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => handleInputChange(e, 'name')}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Single Door Base Cabinet"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cabinet Type *
                </label>
                <select
                  value={template.type}
                  onChange={(e) => handleInputChange(e, 'type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {cabinetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={template.category}
                  onChange={(e) => handleInputChange(e, 'category')}
                  className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={template.description}
                onChange={(e) => handleInputChange(e, 'description')}
                rows={3}
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Describe the cabinet template..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features *
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Adjustable shelf"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {errors.features && <p className="text-red-500 text-xs mb-2">{errors.features}</p>}
              
              <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                {template.features && template.features.length > 0 ? (
                  template.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <span className="text-sm">{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No features added yet</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Middle Column - Dimensions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Default Dimensions (mm)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={template.defaultDimensions?.width || 0}
                    onChange={(e) => handleDimensionChange(e, 'defaultDimensions', 'width')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={template.defaultDimensions?.height || 0}
                    onChange={(e) => handleDimensionChange(e, 'defaultDimensions', 'height')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Depth</label>
                  <input
                    type="number"
                    value={template.defaultDimensions?.depth || 0}
                    onChange={(e) => handleDimensionChange(e, 'defaultDimensions', 'depth')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Minimum Dimensions (mm)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={template.minDimensions?.width || 0}
                    onChange={(e) => handleDimensionChange(e, 'minDimensions', 'width')}
                    className={`w-full px-3 py-2 border ${errors.min_width ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.min_width && <p className="text-red-500 text-xs mt-1">{errors.min_width}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={template.minDimensions?.height || 0}
                    onChange={(e) => handleDimensionChange(e, 'minDimensions', 'height')}
                    className={`w-full px-3 py-2 border ${errors.min_height ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.min_height && <p className="text-red-500 text-xs mt-1">{errors.min_height}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Depth</label>
                  <input
                    type="number"
                    value={template.minDimensions?.depth || 0}
                    onChange={(e) => handleDimensionChange(e, 'minDimensions', 'depth')}
                    className={`w-full px-3 py-2 border ${errors.min_depth ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.min_depth && <p className="text-red-500 text-xs mt-1">{errors.min_depth}</p>}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Maximum Dimensions (mm)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={template.maxDimensions?.width || 0}
                    onChange={(e) => handleDimensionChange(e, 'maxDimensions', 'width')}
                    className={`w-full px-3 py-2 border ${errors.max_width ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.max_width && <p className="text-red-500 text-xs mt-1">{errors.max_width}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={template.maxDimensions?.height || 0}
                    onChange={(e) => handleDimensionChange(e, 'maxDimensions', 'height')}
                    className={`w-full px-3 py-2 border ${errors.max_height ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.max_height && <p className="text-red-500 text-xs mt-1">{errors.max_height}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Depth</label>
                  <input
                    type="number"
                    value={template.maxDimensions?.depth || 0}
                    onChange={(e) => handleDimensionChange(e, 'maxDimensions', 'depth')}
                    className={`w-full px-3 py-2 border ${errors.max_depth ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                  {errors.max_depth && <p className="text-red-500 text-xs mt-1">{errors.max_depth}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Image */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Image *
              </label>
              <div className="mb-3">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Cabinet preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}>
                    <Image className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP (max 2MB)</p>
                  </div>
                )}
                {errors.previewImage && <p className="text-red-500 text-xs mt-1">{errors.previewImage}</p>}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={handleImageFromUrl}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Image from URL
                </button>
              </div>
            </div>
            
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={template.isActive}
                onChange={(e) => setTemplate(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active template (visible in catalog)
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Construction Tab */}
      {activeTab === 'construction' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Cabinet Structure</h3>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Top Panel</span>
                  <span className="ml-2 text-xs text-gray-500">(Top of cabinet)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasTop', !template.construction?.hasTop)}
                  className="text-blue-600"
                >
                  {template.construction?.hasTop ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Bottom Panel</span>
                  <span className="ml-2 text-xs text-gray-500">(Bottom of cabinet)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasBottom', !template.construction?.hasBottom)}
                  className="text-blue-600"
                >
                  {template.construction?.hasBottom ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Back Panel</span>
                  <span className="ml-2 text-xs text-gray-500">(Standard back)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasBack', !template.construction?.hasBack)}
                  className="text-blue-600"
                >
                  {template.construction?.hasBack ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Double Back</span>
                  <span className="ml-2 text-xs text-gray-500">(Two back panels for strength)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasDoubleBack', !template.construction?.hasDoubleBack)}
                  className="text-blue-600"
                >
                  {template.construction?.hasDoubleBack ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Toe Kick</span>
                  <span className="ml-2 text-xs text-gray-500">(For base cabinets)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasToe', !template.construction?.hasToe)}
                  className="text-blue-600"
                >
                  {template.construction?.hasToe ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Special Features</h3>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Fixed Shelf</span>
                  <span className="ml-2 text-xs text-gray-500">(Non-adjustable shelf)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasFixedShelf', !template.construction?.hasFixedShelf)}
                  className="text-blue-600"
                >
                  {template.construction?.hasFixedShelf ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Is Corner Cabinet</span>
                  <span className="ml-2 text-xs text-gray-500">(Special corner design)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('isCorner', !template.construction?.isCorner)}
                  className="text-blue-600"
                >
                  {template.construction?.isCorner ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Front Fixed Panel</span>
                  <span className="ml-2 text-xs text-gray-500">(For corner cabinets)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasFrontPanel', !template.construction?.hasFrontPanel)}
                  className="text-blue-600"
                >
                  {template.construction?.hasFrontPanel ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Has Filler Panel</span>
                  <span className="ml-2 text-xs text-gray-500">(For adjusting to wall)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleConstructionChange('hasFillerPanel', !template.construction?.hasFillerPanel)}
                  className="text-blue-600"
                >
                  {template.construction?.hasFillerPanel ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-md font-medium text-blue-800 mb-2">Edge Banding Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Visible Body Edges</span>
                <button
                  type="button"
                  onClick={() => handleEdgeBandingChange('bodyVisible', !template.edgeBanding?.bodyVisible)}
                  className="text-blue-600"
                >
                  {template.edgeBanding?.bodyVisible ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Hidden Body Edges</span>
                <button
                  type="button"
                  onClick={() => handleEdgeBandingChange('bodyHidden', !template.edgeBanding?.bodyHidden)}
                  className="text-blue-600"
                >
                  {template.edgeBanding?.bodyHidden ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Shelf Front Edge</span>
                <button
                  type="button"
                  onClick={() => handleEdgeBandingChange('shelfFront', !template.edgeBanding?.shelfFront)}
                  className="text-blue-600"
                >
                  {template.edgeBanding?.shelfFront ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Shelf Side Edges</span>
                <button
                  type="button"
                  onClick={() => handleEdgeBandingChange('shelfSides', !template.edgeBanding?.shelfSides)}
                  className="text-blue-600"
                >
                  {template.edgeBanding?.shelfSides ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Door All Edges</span>
                <button
                  type="button"
                  onClick={() => handleEdgeBandingChange('doorAll', !template.edgeBanding?.doorAll)}
                  className="text-blue-600"
                >
                  {template.edgeBanding?.doorAll ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Material Options</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Body Materials</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {materialTypes.map(material => (
                      <label key={material} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.materialOptions?.body?.includes(material) || false}
                          onChange={(e) => handleMaterialOptionChange('body', material, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Door Materials</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {materialTypes.map(material => (
                      <label key={material} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.materialOptions?.doors?.includes(material) || false}
                          onChange={(e) => handleMaterialOptionChange('doors', material, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Drawer Materials</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {materialTypes.map(material => (
                      <label key={material} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.materialOptions?.drawers?.includes(material) || false}
                          onChange={(e) => handleMaterialOptionChange('drawers', material, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Shelf Materials</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {materialTypes.map(material => (
                      <label key={material} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.materialOptions?.shelves?.includes(material) || false}
                          onChange={(e) => handleMaterialOptionChange('shelves', material, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3">Material Thickness (mm)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side Panels
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.side || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'side')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top/Bottom Panels
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.topBottom || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'topBottom')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Back Panel
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.back || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'back')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelves
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.shelf || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'shelf')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doors/Fronts
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.door || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'door')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drawer Box
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.drawer || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'drawer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fixed Panel
                  </label>
                  <input
                    type="number"
                    value={template.materialThickness?.fixedPanel || 0}
                    onChange={(e) => handleMaterialThicknessChange(e, 'fixedPanel')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hardware Tab */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Hardware Quantities</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hinges
                  </label>
                  <input
                    type="number"
                    value={template.hardware?.hinges || 0}
                    onChange={(e) => handleHardwareChange(e, 'hinges')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drawer Slides
                  </label>
                  <input
                    type="number"
                    value={template.hardware?.slides || 0}
                    onChange={(e) => handleHardwareChange(e, 'slides')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handles
                  </label>
                  <input
                    type="number"
                    value={template.hardware?.handles || 0}
                    onChange={(e) => handleHardwareChange(e, 'handles')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelves
                  </label>
                  <input
                    type="number"
                    value={template.hardware?.shelves || 0}
                    onChange={(e) => handleHardwareChange(e, 'shelves')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelf Pins
                  </label>
                  <input
                    type="number"
                    value={template.hardware?.shelfPins || 0}
                    onChange={(e) => handleHardwareChange(e, 'shelfPins')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Hardware Specifications</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drawer Box Type
                </label>
                <select
                  value={template.hardware?.drawerBoxType || 'standard'}
                  onChange={(e) => handleHardwareChange(e, 'drawerBoxType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {drawerBoxTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Affects material cost and labor time
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Hardware Notes</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span>Hinges are per door, typically 2 per door</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span>Drawer slides are pairs (left and right)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span>Shelf pins are typically 4 per adjustable shelf</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span>Drawer box type affects both material and labor costs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {editTemplate ? 'Update Template' : 'Save Template'}
        </button>
      </div>
    </div>
  );
};

export default TemplateCreator;