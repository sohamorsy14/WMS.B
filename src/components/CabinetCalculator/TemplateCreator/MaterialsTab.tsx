import React, { useState } from 'react';
import { CabinetTemplate } from '../../../types/cabinet';
import { Info, Plus, Trash2 } from 'lucide-react';

interface MaterialsTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

interface PanelDefinition {
  id: string;
  name: string;
  materialType: string;
  thickness: number;
  widthFormula: string;
  heightFormula: string;
  quantity: number;
  edgeBanding: {
    front: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
  };
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ template, setTemplate }) => {
  const [panels, setPanels] = useState<PanelDefinition[]>([
    {
      id: 'side-panel',
      name: 'Side Panel',
      materialType: 'Plywood',
      thickness: template.materialThickness?.side || 18,
      widthFormula: 'depth - (hasBack ? back : 0)',
      heightFormula: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)',
      quantity: 2,
      edgeBanding: { front: true, back: false, left: true, right: true }
    },
    {
      id: 'top-panel',
      name: 'Top Panel',
      materialType: 'Plywood',
      thickness: template.materialThickness?.topBottom || 18,
      widthFormula: 'depth - (hasBack ? back : 0)',
      heightFormula: 'width - (2 * side)',
      quantity: 1,
      edgeBanding: { front: true, back: false, left: true, right: true }
    },
    {
      id: 'bottom-panel',
      name: 'Bottom Panel',
      materialType: 'Plywood',
      thickness: template.materialThickness?.topBottom || 18,
      widthFormula: 'depth - (hasBack ? back : 0)',
      heightFormula: 'width - (2 * side)',
      quantity: 1,
      edgeBanding: { front: true, back: false, left: true, right: true }
    },
    {
      id: 'back-panel',
      name: 'Back Panel',
      materialType: 'Plywood',
      thickness: template.materialThickness?.back || 12,
      widthFormula: 'width - (2 * side)',
      heightFormula: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)',
      quantity: 1,
      edgeBanding: { front: false, back: false, left: false, right: false }
    }
  ]);

  const [newPanel, setNewPanel] = useState<PanelDefinition>({
    id: `panel-${Date.now()}`,
    name: '',
    materialType: 'Plywood',
    thickness: 18,
    widthFormula: '',
    heightFormula: '',
    quantity: 1,
    edgeBanding: { front: false, back: false, left: false, right: false }
  });

  const [showAddPanel, setShowAddPanel] = useState(false);

  const handleMaterialThicknessChange = (component: string, value: number) => {
    setTemplate(prev => ({
      ...prev,
      materialThickness: {
        ...prev.materialThickness,
        [component]: value
      }
    }));
  };

  const calculateDimension = (formula: string, dimensions: any): number => {
    try {
      // Create a safe evaluation context with cabinet dimensions and material thicknesses
      const { width, height, depth } = dimensions;
      const { side, topBottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack } = 
        template.materialThickness || {};
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

  const handleAddPanel = () => {
    if (!newPanel.name || !newPanel.widthFormula || !newPanel.heightFormula) {
      return;
    }
    
    setPanels([...panels, { ...newPanel, id: `panel-${Date.now()}` }]);
    setNewPanel({
      id: `panel-${Date.now()}`,
      name: '',
      materialType: 'Plywood',
      thickness: 18,
      widthFormula: '',
      heightFormula: '',
      quantity: 1,
      edgeBanding: { front: false, back: false, left: false, right: false }
    });
    setShowAddPanel(false);
  };

  const handleRemovePanel = (id: string) => {
    setPanels(panels.filter(panel => panel.id !== id));
  };

  const handlePanelChange = (id: string, field: keyof PanelDefinition, value: any) => {
    setPanels(panels.map(panel => 
      panel.id === id ? { ...panel, [field]: value } : panel
    ));
  };

  const handleEdgeBandingChange = (id: string, edge: keyof PanelDefinition['edgeBanding'], value: boolean) => {
    setPanels(panels.map(panel => 
      panel.id === id ? { 
        ...panel, 
        edgeBanding: { ...panel.edgeBanding, [edge]: value } 
      } : panel
    ));
  };

  // Sample dimensions for preview
  const sampleDimensions = template.defaultDimensions || { width: 600, height: 720, depth: 560 };

  return (
    <div className="space-y-6">
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-700">Parametric Panel Definitions</h4>
            <button
              type="button"
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAddPanel ? 'Cancel' : 'Add Panel'}
            </button>
          </div>
          
          {showAddPanel && (
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h5 className="font-medium text-blue-800 mb-3">Add New Panel</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Panel Name
                  </label>
                  <input
                    type="text"
                    value={newPanel.name}
                    onChange={(e) => setNewPanel({...newPanel, name: e.target.value})}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Fixed Shelf"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Material Type
                    </label>
                    <select
                      value={newPanel.materialType}
                      onChange={(e) => setNewPanel({...newPanel, materialType: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Plywood">Plywood</option>
                      <option value="MDF">MDF</option>
                      <option value="Melamine">Melamine</option>
                      <option value="Solid Wood">Solid Wood</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      value={newPanel.thickness}
                      onChange={(e) => setNewPanel({...newPanel, thickness: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Width Formula
                    </label>
                    <input
                      type="text"
                      value={newPanel.widthFormula}
                      onChange={(e) => setNewPanel({...newPanel, widthFormula: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., width - (2 * side)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Height Formula
                    </label>
                    <input
                      type="text"
                      value={newPanel.heightFormula}
                      onChange={(e) => setNewPanel({...newPanel, heightFormula: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., depth - back"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPanel.quantity}
                    onChange={(e) => setNewPanel({...newPanel, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Edge Banding
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newPanelEdgeFront"
                        checked={newPanel.edgeBanding.front}
                        onChange={(e) => setNewPanel({
                          ...newPanel, 
                          edgeBanding: {...newPanel.edgeBanding, front: e.target.checked}
                        })}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="newPanelEdgeFront" className="ml-2 text-sm text-blue-700">
                        Front Edge
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newPanelEdgeBack"
                        checked={newPanel.edgeBanding.back}
                        onChange={(e) => setNewPanel({
                          ...newPanel, 
                          edgeBanding: {...newPanel.edgeBanding, back: e.target.checked}
                        })}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="newPanelEdgeBack" className="ml-2 text-sm text-blue-700">
                        Back Edge
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newPanelEdgeLeft"
                        checked={newPanel.edgeBanding.left}
                        onChange={(e) => setNewPanel({
                          ...newPanel, 
                          edgeBanding: {...newPanel.edgeBanding, left: e.target.checked}
                        })}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="newPanelEdgeLeft" className="ml-2 text-sm text-blue-700">
                        Left Edge
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newPanelEdgeRight"
                        checked={newPanel.edgeBanding.right}
                        onChange={(e) => setNewPanel({
                          ...newPanel, 
                          edgeBanding: {...newPanel.edgeBanding, right: e.target.checked}
                        })}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="newPanelEdgeRight" className="ml-2 text-sm text-blue-700">
                        Right Edge
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPanel}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Panel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Panel</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {panels.map((panel) => {
                  const calculatedWidth = calculateDimension(panel.widthFormula, sampleDimensions);
                  const calculatedHeight = calculateDimension(panel.heightFormula, sampleDimensions);
                  
                  return (
                    <tr key={panel.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{panel.name}</div>
                        <div className="text-xs text-gray-500">{panel.materialType}, {panel.thickness}mm</div>
                        <div className="text-xs text-gray-500">Qty: {panel.quantity}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-500">
                          <div>Width: <span className="font-mono">{panel.widthFormula}</span></div>
                          <div>Height: <span className="font-mono">{panel.heightFormula}</span></div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900">
                          {calculatedWidth.toFixed(0)} × {calculatedHeight.toFixed(0)} mm
                        </div>
                        <div className="text-xs text-gray-500">
                          Edge banding: {Object.entries(panel.edgeBanding)
                            .filter(([_, value]) => value)
                            .map(([edge]) => edge)
                            .join(', ') || 'None'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemovePanel(panel.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">Formula Variables</h5>
            <p className="text-xs text-yellow-700 mb-2">
              You can use these variables in your panel formulas:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-mono text-yellow-800">width</span>: Cabinet width
              </div>
              <div>
                <span className="font-mono text-yellow-800">height</span>: Cabinet height
              </div>
              <div>
                <span className="font-mono text-yellow-800">depth</span>: Cabinet depth
              </div>
              <div>
                <span className="font-mono text-yellow-800">side</span>: Side panel thickness
              </div>
              <div>
                <span className="font-mono text-yellow-800">topBottom</span>: Top/bottom thickness
              </div>
              <div>
                <span className="font-mono text-yellow-800">back</span>: Back panel thickness
              </div>
              <div>
                <span className="font-mono text-yellow-800">hasTop</span>: Has top panel
              </div>
              <div>
                <span className="font-mono text-yellow-800">hasBack</span>: Has back panel
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsTab;