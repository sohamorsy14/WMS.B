import React, { useState, useEffect } from 'react';
import { CabinetTemplate, CabinetConfiguration } from '../../types/cabinet';
import { CabinetCalculatorService } from '../../services/cabinetCalculator';
import { Ruler, Package, DollarSign, Settings, Save, Download, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface CabinetConfiguratorProps {
  template: CabinetTemplate;
  onConfigurationChange: (config: CabinetConfiguration) => void;
  onSaveConfiguration: (config: CabinetConfiguration) => void;
  onExportCuttingList: (config: CabinetConfiguration) => void;
  onExportBOM: (config: CabinetConfiguration) => void;
}

const CabinetConfigurator: React.FC<CabinetConfiguratorProps> = ({
  template,
  onConfigurationChange,
  onSaveConfiguration,
  onExportCuttingList,
  onExportBOM
}) => {
  const [dimensions, setDimensions] = useState(template.defaultDimensions);
  const [customizations, setCustomizations] = useState({
    doorCount: template.type === 'drawer' ? 0 : template.name.includes('Double') ? 2 : 1,
    drawerCount: template.type === 'drawer' ? 3 : 0,
    shelfCount: template.hardware.shelves,
    doorStyle: 'Shaker',
    finish: 'White',
    hardware: 'Chrome'
  });
  const [configuration, setConfiguration] = useState<CabinetConfiguration | null>(null);
  const [showCuttingList, setShowCuttingList] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showHardware, setShowHardware] = useState(false);

  const doorStyles = ['Shaker', 'Flat Panel', 'Raised Panel', 'Glass', 'Louvered'];
  const finishes = ['White', 'Natural Wood', 'Espresso', 'Gray', 'Black', 'Custom'];
  const hardwareOptions = ['Chrome', 'Brushed Nickel', 'Black', 'Brass', 'Stainless Steel'];
  const grainDirections = ['length', 'width', 'none'];

  useEffect(() => {
    generateConfiguration();
  }, [dimensions, customizations, template]);

  const generateConfiguration = () => {
    const config = CabinetCalculatorService.generateConfiguration(
      template,
      dimensions,
      customizations
    );
    setConfiguration(config);
    onConfigurationChange(config);
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    const newDimensions = { ...dimensions, [dimension]: value };
    
    // Validate against min/max constraints
    const min = template.minDimensions[dimension];
    const max = template.maxDimensions[dimension];
    
    if (value >= min && value <= max) {
      setDimensions(newDimensions);
    }
  };

  const handleCustomizationChange = (key: string, value: any) => {
    setCustomizations({ ...customizations, [key]: value });
  };

  const handleGrainDirectionChange = (itemId: string, grain: 'length' | 'width' | 'none') => {
    if (!configuration) return;
    
    const updatedCuttingList = configuration.cuttingList.map(item => {
      if (item.id === itemId) {
        return { ...item, grain };
      }
      return item;
    });
    
    const updatedConfig = {
      ...configuration,
      cuttingList: updatedCuttingList
    };
    
    setConfiguration(updatedConfig);
    onConfigurationChange(updatedConfig);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleExportCuttingList = () => {
    if (configuration) {
      onExportCuttingList(configuration);
    }
  };

  const handleExportBOM = () => {
    if (configuration) {
      onExportBOM(configuration);
    }
  };

  if (!configuration) {
    return <div>Loading configuration...</div>;
  }

  const materialCost = configuration.materials.reduce((sum, m) => sum + m.totalCost, 0);
  const hardwareCost = configuration.hardware.reduce((sum, h) => sum + h.totalCost, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Configure Cabinet</h2>
        
        {/* Template Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">{template.name}</h3>
              <p className="text-sm text-blue-700">{template.description}</p>
            </div>
            <img
              src={template.previewImage}
              alt={template.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                value={dimensions.width}
                onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                min={template.minDimensions.width}
                max={template.maxDimensions.width}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Ruler className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Range: {template.minDimensions.width} - {template.maxDimensions.width}mm
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                value={dimensions.height}
                onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                min={template.minDimensions.height}
                max={template.maxDimensions.height}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Ruler className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Range: {template.minDimensions.height} - {template.maxDimensions.height}mm
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depth (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                value={dimensions.depth}
                onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
                min={template.minDimensions.depth}
                max={template.maxDimensions.depth}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Ruler className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Range: {template.minDimensions.depth} - {template.maxDimensions.depth}mm
            </p>
          </div>
        </div>

        {/* Customizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {template.type !== 'drawer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Doors
              </label>
              <select
                value={customizations.doorCount}
                onChange={(e) => handleCustomizationChange('doorCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>No Doors</option>
                <option value={1}>Single Door</option>
                <option value={2}>Double Doors</option>
              </select>
            </div>
          )}

          {template.type === 'drawer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Drawers
              </label>
              <select
                value={customizations.drawerCount}
                onChange={(e) => handleCustomizationChange('drawerCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 Drawer</option>
                <option value={2}>2 Drawers</option>
                <option value={3}>3 Drawers</option>
                <option value={4}>4 Drawers</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Shelves
            </label>
            <select
              value={customizations.shelfCount}
              onChange={(e) => handleCustomizationChange('shelfCount', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>No Shelves</option>
              <option value={1}>1 Shelf</option>
              <option value={2}>2 Shelves</option>
              <option value={3}>3 Shelves</option>
              <option value={4}>4 Shelves</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Door Style
            </label>
            <select
              value={customizations.doorStyle}
              onChange={(e) => handleCustomizationChange('doorStyle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {doorStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finish
            </label>
            <select
              value={customizations.finish}
              onChange={(e) => handleCustomizationChange('finish', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {finishes.map(finish => (
                <option key={finish} value={finish}>{finish}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hardware
            </label>
            <select
              value={customizations.hardware}
              onChange={(e) => handleCustomizationChange('hardware', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {hardwareOptions.map(hardware => (
                <option key={hardware} value={hardware}>{hardware}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Cost Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{formatCurrency(materialCost)}</div>
              <div className="text-sm text-green-600">Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{formatCurrency(hardwareCost)}</div>
              <div className="text-sm text-green-600">Hardware</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{formatCurrency(configuration.laborCost)}</div>
              <div className="text-sm text-green-600">Labor</div>
            </div>
            <div className="text-center border-l border-green-200">
              <div className="text-3xl font-bold text-green-900">{formatCurrency(configuration.totalCost)}</div>
              <div className="text-sm text-green-700 font-medium">Total Cost</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowCuttingList(!showCuttingList)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4 mr-2" />
            {showCuttingList ? 'Hide' : 'Show'} Cutting List
          </button>
          
          <button
            onClick={() => setShowMaterials(!showMaterials)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showMaterials ? 'Hide' : 'Show'} Materials
          </button>
          
          <button
            onClick={() => setShowHardware(!showHardware)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showHardware ? 'Hide' : 'Show'} Hardware
          </button>
          
          <button
            onClick={() => onSaveConfiguration(configuration)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </button>
          
          <div className="relative group">
            <button
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={handleExportCuttingList}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Export Cutting List
                </button>
                <button
                  onClick={handleExportBOM}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Export to BOM
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cutting List */}
        {showCuttingList && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cutting List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thickness</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Length</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Width</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Edge Banding</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grain Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {configuration.cuttingList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{item.partName}</td>
                      <td className="px-3 py-2 text-gray-900">{item.materialType}</td>
                      <td className="px-3 py-2 text-gray-900">{item.thickness}mm</td>
                      <td className="px-3 py-2 text-gray-900">{item.length}mm</td>
                      <td className="px-3 py-2 text-gray-900">{item.width}mm</td>
                      <td className="px-3 py-2 text-gray-900">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-900">
                        {Object.entries(item.edgeBanding)
                          .filter(([_, value]) => value)
                          .map(([edge]) => edge)
                          .join(', ') || 'None'}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.grain}
                          onChange={(e) => handleGrainDirectionChange(item.id, e.target.value as 'length' | 'width' | 'none')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="length">With Grain (Length)</option>
                          <option value="width">With Grain (Width)</option>
                          <option value="none">No Grain</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials List */}
        {showMaterials && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Materials Required</h3>
            <div className="space-y-4">
              {configuration.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{material.materialName}</h4>
                    <p className="text-sm text-gray-600">
                      {material.dimensions.length} × {material.dimensions.width}mm, {material.thickness}mm thick
                    </p>
                    <p className="text-sm text-gray-600">Supplier: {material.supplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {material.quantity} sheets
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(material.unitCost)} each
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(material.totalCost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hardware List */}
        {showHardware && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hardware Required</h3>
            <div className="space-y-4">
              {configuration.hardware.map((hardware) => (
                <div key={hardware.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{hardware.hardwareName}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {hardware.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">Supplier: {hardware.supplier}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {hardware.quantity} pieces
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(hardware.unitCost)} each
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(hardware.totalCost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetConfigurator;