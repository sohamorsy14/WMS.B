import React, { useState, useEffect } from 'react';
import { CabinetTemplate } from '../../types/cabinet';

interface PanelCalculatorProps {
  template: CabinetTemplate;
}

interface PanelDimension {
  name: string;
  width: number;
  height: number;
  thickness: number;
  quantity: number;
  totalArea: number;
}

const PanelCalculator: React.FC<PanelCalculatorProps> = ({ template }) => {
  const [customDimensions, setCustomDimensions] = useState({
    width: template.defaultDimensions.width,
    height: template.defaultDimensions.height,
    depth: template.defaultDimensions.depth
  });
  
  const [calculatedPanels, setCalculatedPanels] = useState<PanelDimension[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [sheetCount, setSheetCount] = useState({ standard: 0, large: 0 });

  // Standard sheet sizes in mm
  const sheetSizes = {
    standard: { width: 1220, height: 2440 }, // 4x8 ft
    large: { width: 1525, height: 3050 }     // 5x10 ft
  };

  useEffect(() => {
    calculatePanels();
  }, [customDimensions, template]);

  const calculateDimension = (formula: string): number => {
    try {
      // Create a safe evaluation context with cabinet dimensions and material thicknesses
      const { width, height, depth } = customDimensions;
      const { side, topBottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack } = 
        template.materialThickness;
      const { hasTop, hasBottom, hasBack, hasDoubleBack, hasToe, hasFixedShelf, isCorner, hasFrontPanel, hasFillerPanel, hasUprights } = 
        template.construction || {};
      
      // Use Function constructor to create a safe evaluation function
      const evalFunc = new Function(
        'width', 'height', 'depth', 
        'side', 'topBottom', 'back', 'shelf', 'door', 'drawer', 'fixedPanel', 'drawerBottom', 'uprights', 'doubleBack',
        'hasTop', 'hasBottom', 'hasBack', 'hasDoubleBack', 'hasToe', 'hasFixedShelf', 'isCorner', 'hasFrontPanel', 'hasFillerPanel', 'hasUprights',
        `return ${formula};`
      );
      
      return evalFunc(
        width, height, depth, 
        side, topBottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack,
        hasTop, hasBottom, hasBack, hasDoubleBack, hasToe, hasFixedShelf, isCorner, hasFrontPanel, hasFillerPanel, hasUprights
      );
    } catch (error) {
      console.error('Error evaluating formula:', error);
      return 0;
    }
  };

  const calculatePanels = () => {
    // Define panel formulas based on cabinet type
    const panelDefinitions = [
      // Side panels
      {
        name: 'Side Panel',
        thickness: template.materialThickness.side,
        widthFormula: 'depth - (hasBack ? back : 0)',
        heightFormula: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)',
        quantity: 2
      },
      
      // Top panel (if applicable)
      ...(template.construction?.hasTop !== false ? [{
        name: 'Top Panel',
        thickness: template.materialThickness.topBottom,
        widthFormula: 'depth - (hasBack ? back : 0)',
        heightFormula: 'width - (2 * side)',
        quantity: 1
      }] : []),
      
      // Bottom panel (if applicable)
      ...(template.construction?.hasBottom !== false ? [{
        name: 'Bottom Panel',
        thickness: template.materialThickness.topBottom,
        widthFormula: 'depth - (hasBack ? back : 0)',
        heightFormula: 'width - (2 * side)',
        quantity: 1
      }] : []),
      
      // Back panel (if applicable)
      ...(template.construction?.hasBack !== false ? [{
        name: 'Back Panel',
        thickness: template.materialThickness.back,
        widthFormula: 'width - (2 * side)',
        heightFormula: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)',
        quantity: 1
      }] : []),
      
      // Double back panel (if applicable)
      ...(template.construction?.hasDoubleBack === true ? [{
        name: 'Double Back Panel',
        thickness: template.materialThickness.doubleBack || template.materialThickness.back,
        widthFormula: 'width - (2 * side)',
        heightFormula: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)',
        quantity: 1
      }] : []),
      
      // Fixed shelf (if applicable)
      ...(template.construction?.hasFixedShelf === true ? [{
        name: 'Fixed Shelf',
        thickness: template.materialThickness.shelf,
        widthFormula: 'depth - (hasBack ? back : 0) - 20',
        heightFormula: 'width - (2 * side) - 3',
        quantity: 1
      }] : []),
      
      // Adjustable shelves
      ...(template.hardware.shelves > 0 ? [{
        name: 'Adjustable Shelf',
        thickness: template.materialThickness.shelf,
        widthFormula: 'depth - (hasBack ? back : 0) - 50',
        heightFormula: 'width - (2 * side) - 6',
        quantity: template.hardware.shelves
      }] : []),
      
      // Doors (if applicable)
      ...(template.type !== 'drawer' ? [{
        name: 'Door',
        thickness: template.materialThickness.door,
        widthFormula: template.type === 'corner' ? 'width / 2 - 3' : 
                     'width / (template.name.includes("Double") ? 2 : 1) - 6',
        heightFormula: 'height - 6',
        quantity: template.name.includes('Double') ? 2 : 1
      }] : []),
      
      // Drawer fronts and boxes (if applicable)
      ...(template.type === 'drawer' ? [
        {
          name: 'Drawer Front',
          thickness: template.materialThickness.door,
          widthFormula: 'width - 6',
          heightFormula: '(height - 12) / 3 - 3', // Assuming 3 drawers by default
          quantity: 3 // Default drawer count
        },
        {
          name: 'Drawer Side',
          thickness: template.materialThickness.drawer || 15,
          widthFormula: 'depth - 80',
          heightFormula: '(height - 12) / 3 - 30',
          quantity: 6 // 2 sides per drawer × 3 drawers
        },
        {
          name: 'Drawer Back',
          thickness: template.materialThickness.drawer || 15,
          widthFormula: 'width - 90',
          heightFormula: '(height - 12) / 3 - 30',
          quantity: 3 // 1 back per drawer
        },
        {
          name: 'Drawer Bottom',
          thickness: template.materialThickness.drawerBottom || 12,
          widthFormula: 'width - 90',
          heightFormula: 'depth - 80',
          quantity: 3 // 1 bottom per drawer
        }
      ] : [])
    ];

    // Calculate dimensions for each panel
    const panels = panelDefinitions.map(panel => {
      const width = calculateDimension(panel.widthFormula);
      const height = calculateDimension(panel.heightFormula);
      const area = (width * height * panel.quantity) / 1000000; // Convert to m²
      
      return {
        name: panel.name,
        width,
        height,
        thickness: panel.thickness,
        quantity: panel.quantity,
        totalArea: area
      };
    });

    setCalculatedPanels(panels);
    
    // Calculate total area
    const area = panels.reduce((sum, panel) => sum + panel.totalArea, 0);
    setTotalArea(area);
    
    // Calculate sheet requirements
    const standardSheetArea = (sheetSizes.standard.width * sheetSizes.standard.height) / 1000000;
    const largeSheetArea = (sheetSizes.large.width * sheetSizes.large.height) / 1000000;
    
    setSheetCount({
      standard: Math.ceil(area / standardSheetArea * 1.15), // 15% waste factor
      large: Math.ceil(area / largeSheetArea * 1.15)
    });
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    setCustomDimensions(prev => ({
      ...prev,
      [dimension]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Panel Calculator</h3>
      
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-3">Custom Cabinet Dimensions</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Width (mm)
            </label>
            <input
              type="number"
              min={template.minDimensions.width}
              max={template.maxDimensions.width}
              value={customDimensions.width}
              onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-xs text-blue-600 mt-1">
              Min: {template.minDimensions.width}mm, Max: {template.maxDimensions.width}mm
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Height (mm)
            </label>
            <input
              type="number"
              min={template.minDimensions.height}
              max={template.maxDimensions.height}
              value={customDimensions.height}
              onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-xs text-blue-600 mt-1">
              Min: {template.minDimensions.height}mm, Max: {template.maxDimensions.height}mm
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Depth (mm)
            </label>
            <input
              type="number"
              min={template.minDimensions.depth}
              max={template.maxDimensions.depth}
              value={customDimensions.depth}
              onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-xs text-blue-600 mt-1">
              Min: {template.minDimensions.depth}mm, Max: {template.maxDimensions.depth}mm
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions (mm)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thickness</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area (m²)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calculatedPanels.map((panel, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{panel.name}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{panel.width.toFixed(0)} × {panel.height.toFixed(0)}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{panel.thickness}mm</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{panel.quantity}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{panel.totalArea.toFixed(3)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Total Material Area</h4>
          <p className="text-2xl font-bold text-green-700">{totalArea.toFixed(2)} m²</p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">Standard Sheets (4×8')</h4>
          <p className="text-2xl font-bold text-purple-700">{sheetCount.standard} sheets</p>
          <p className="text-xs text-purple-600">1220 × 2440mm</p>
        </div>
        
        <div className="p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-800 mb-2">Large Sheets (5×10')</h4>
          <p className="text-2xl font-bold text-indigo-700">{sheetCount.large} sheets</p>
          <p className="text-xs text-indigo-600">1525 × 3050mm</p>
        </div>
      </div>
    </div>
  );
};

export default PanelCalculator;