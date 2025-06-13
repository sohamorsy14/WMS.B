import React, { useState } from 'react';
import { CabinetTemplate } from '../../../types/cabinet';
import { Plus, Minus, Trash2, Edit, Save, X } from 'lucide-react';

interface ConstructionTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

interface PartDefinition {
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
  grain: 'length' | 'width' | 'none';
  isRequired: boolean;
}

const predefinedParts = [
  { value: 'side_panel', label: 'Side Panel' },
  { value: 'top_panel', label: 'Top Panel' },
  { value: 'bottom_panel', label: 'Bottom Panel' },
  { value: 'back_panel', label: 'Back Panel' },
  { value: 'double_back_panel', label: 'Double Back Panel' },
  { value: 'fixed_shelf', label: 'Fixed Shelf' },
  { value: 'adjustable_shelf', label: 'Adjustable Shelf' },
  { value: 'door', label: 'Door' },
  { value: 'drawer_front', label: 'Drawer Front' },
  { value: 'drawer_side', label: 'Drawer Side' },
  { value: 'drawer_back', label: 'Drawer Back' },
  { value: 'drawer_bottom', label: 'Drawer Bottom' },
  { value: 'toe_kick', label: 'Toe Kick' },
  { value: 'filler_panel', label: 'Filler Panel' },
  { value: 'upright', label: 'Upright' },
  { value: 'front_rail', label: 'Front Rail' },
  { value: 'back_rail', label: 'Back Rail' },
  { value: 'corner_support', label: 'Corner Support' },
  { value: 'custom_part', label: 'Custom Part' }
];

const materialTypes = [
  { value: 'plywood', label: 'Plywood' },
  { value: 'mdf', label: 'MDF' },
  { value: 'melamine', label: 'Melamine' },
  { value: 'solid_wood', label: 'Solid Wood' },
  { value: 'particleboard', label: 'Particleboard' }
];

const grainDirections = [
  { value: 'length', label: 'With Grain (Length)' },
  { value: 'width', label: 'With Grain (Width)' },
  { value: 'none', label: 'No Grain' }
];

// Common formulas for parametric parts
const commonFormulas = {
  side_panel: {
    width: 'depth - (hasBack ? back : 0)',
    height: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)'
  },
  top_panel: {
    width: 'width - (2 * side)',
    height: 'depth - (hasBack ? back : 0)'
  },
  bottom_panel: {
    width: 'width - (2 * side)',
    height: 'depth - (hasBack ? back : 0)'
  },
  back_panel: {
    width: 'width - (2 * side)',
    height: 'height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0)'
  },
  fixed_shelf: {
    width: 'width - (2 * side) - 3',
    height: 'depth - (hasBack ? back : 0) - 20'
  },
  adjustable_shelf: {
    width: 'width - (2 * side) - 6',
    height: 'depth - (hasBack ? back : 0) - 50'
  },
  door: {
    width: 'width / (doorCount > 1 ? doorCount : 1) - 6',
    height: 'height - 6'
  },
  drawer_front: {
    width: 'width - 6',
    height: '(height - 12) / drawerCount - 3'
  },
  drawer_side: {
    width: 'depth - 80',
    height: '(height - 12) / drawerCount - 30'
  },
  drawer_back: {
    width: 'width - 90',
    height: '(height - 12) / drawerCount - 30'
  },
  drawer_bottom: {
    width: 'width - 90',
    height: 'depth - 80'
  }
};

const ConstructionTab: React.FC<ConstructionTabProps> = ({ template, setTemplate }) => {
  const [parts, setParts] = useState<PartDefinition[]>(template.parts || []);
  const [showAddPart, setShowAddPart] = useState(false);
  const [editingPart, setEditingPart] = useState<PartDefinition | null>(null);
  const [newPart, setNewPart] = useState<PartDefinition>({
    id: `part-${Date.now()}`,
    name: '',
    materialType: 'plywood',
    thickness: 18,
    widthFormula: '',
    heightFormula: '',
    quantity: 1,
    edgeBanding: { front: false, back: false, left: false, right: false },
    grain: 'length',
    isRequired: true
  });

  const handleConstructionChange = (field: string, value: boolean) => {
    setTemplate(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        [field]: value
      }
    }));
  };

  const handleAddPart = () => {
    if (!newPart.name) return;
    
    const updatedParts = [...parts, { ...newPart, id: `part-${Date.now()}` }];
    setParts(updatedParts);
    setTemplate(prev => ({
      ...prev,
      parts: updatedParts
    }));
    
    // Reset form
    setNewPart({
      id: `part-${Date.now()}`,
      name: '',
      materialType: 'plywood',
      thickness: 18,
      widthFormula: '',
      heightFormula: '',
      quantity: 1,
      edgeBanding: { front: false, back: false, left: false, right: false },
      grain: 'length',
      isRequired: true
    });
    setShowAddPart(false);
  };

  const handleUpdatePart = () => {
    if (!editingPart) return;
    
    const updatedParts = parts.map(part => 
      part.id === editingPart.id ? editingPart : part
    );
    
    setParts(updatedParts);
    setTemplate(prev => ({
      ...prev,
      parts: updatedParts
    }));
    
    setEditingPart(null);
  };

  const handleDeletePart = (partId: string) => {
    const updatedParts = parts.filter(part => part.id !== partId);
    setParts(updatedParts);
    setTemplate(prev => ({
      ...prev,
      parts: updatedParts
    }));
  };

  const handleEdgeBandingChange = (
    part: PartDefinition, 
    edge: keyof PartDefinition['edgeBanding'], 
    value: boolean
  ) => {
    if (editingPart && editingPart.id === part.id) {
      setEditingPart({
        ...editingPart,
        edgeBanding: {
          ...editingPart.edgeBanding,
          [edge]: value
        }
      });
    } else {
      setNewPart({
        ...newPart,
        edgeBanding: {
          ...newPart.edgeBanding,
          [edge]: value
        }
      });
    }
  };

  const handlePartTypeChange = (partType: string) => {
    // Get formulas for the selected part type
    const formulas = commonFormulas[partType as keyof typeof commonFormulas];
    
    if (formulas) {
      setNewPart({
        ...newPart,
        name: predefinedParts.find(p => p.value === partType)?.label || '',
        widthFormula: formulas.width,
        heightFormula: formulas.height
      });
    } else {
      setNewPart({
        ...newPart,
        name: predefinedParts.find(p => p.value === partType)?.label || '',
        widthFormula: '',
        heightFormula: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Cabinet Construction</h3>
      
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-700">Cabinet Parts</h4>
        <button
          type="button"
          onClick={() => setShowAddPart(!showAddPart)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          {showAddPart ? (
            <>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </>
          )}
        </button>
      </div>
      
      {/* Add/Edit Part Form */}
      {(showAddPart || editingPart) && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <h5 className="font-medium text-blue-800 mb-4">
            {editingPart ? 'Edit Part' : 'Add New Part'}
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Part Type
              </label>
              <select
                value={editingPart ? 
                  predefinedParts.find(p => p.label === editingPart.name)?.value || 'custom_part' : 
                  predefinedParts.find(p => p.label === newPart.name)?.value || ''}
                onChange={(e) => {
                  if (editingPart) {
                    // For editing, just update the name
                    const partLabel = predefinedParts.find(p => p.value === e.target.value)?.label || '';
                    setEditingPart({
                      ...editingPart,
                      name: partLabel
                    });
                  } else {
                    // For new part, update formulas too
                    handlePartTypeChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Part Type</option>
                {predefinedParts.map(part => (
                  <option key={part.value} value={part.value}>
                    {part.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Material Type
              </label>
              <select
                value={editingPart ? editingPart.materialType : newPart.materialType}
                onChange={(e) => {
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      materialType: e.target.value
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      materialType: e.target.value
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {materialTypes.map(material => (
                  <option key={material.value} value={material.value}>
                    {material.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Thickness (mm)
              </label>
              <input
                type="number"
                value={editingPart ? editingPart.thickness : newPart.thickness}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      thickness: value
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      thickness: value
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={editingPart ? editingPart.quantity : newPart.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      quantity: value
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      quantity: value
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Grain Direction
              </label>
              <select
                value={editingPart ? editingPart.grain : newPart.grain}
                onChange={(e) => {
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      grain: e.target.value as 'length' | 'width' | 'none'
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      grain: e.target.value as 'length' | 'width' | 'none'
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {grainDirections.map(grain => (
                  <option key={grain.value} value={grain.value}>
                    {grain.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Width Formula
              </label>
              <input
                type="text"
                value={editingPart ? editingPart.widthFormula : newPart.widthFormula}
                onChange={(e) => {
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      widthFormula: e.target.value
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      widthFormula: e.target.value
                    });
                  }
                }}
                placeholder="e.g., width - (2 * side)"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Height Formula
              </label>
              <input
                type="text"
                value={editingPart ? editingPart.heightFormula : newPart.heightFormula}
                onChange={(e) => {
                  if (editingPart) {
                    setEditingPart({
                      ...editingPart,
                      heightFormula: e.target.value
                    });
                  } else {
                    setNewPart({
                      ...newPart,
                      heightFormula: e.target.value
                    });
                  }
                }}
                placeholder="e.g., depth - (hasBack ? back : 0)"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Edge Banding
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={editingPart ? `edit-edge-front` : `new-edge-front`}
                  checked={editingPart ? editingPart.edgeBanding.front : newPart.edgeBanding.front}
                  onChange={(e) => handleEdgeBandingChange(
                    editingPart || newPart, 
                    'front', 
                    e.target.checked
                  )}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={editingPart ? `edit-edge-front` : `new-edge-front`} className="ml-2 text-sm text-blue-700">
                  Front Edge
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={editingPart ? `edit-edge-back` : `new-edge-back`}
                  checked={editingPart ? editingPart.edgeBanding.back : newPart.edgeBanding.back}
                  onChange={(e) => handleEdgeBandingChange(
                    editingPart || newPart, 
                    'back', 
                    e.target.checked
                  )}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={editingPart ? `edit-edge-back` : `new-edge-back`} className="ml-2 text-sm text-blue-700">
                  Back Edge
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={editingPart ? `edit-edge-left` : `new-edge-left`}
                  checked={editingPart ? editingPart.edgeBanding.left : newPart.edgeBanding.left}
                  onChange={(e) => handleEdgeBandingChange(
                    editingPart || newPart, 
                    'left', 
                    e.target.checked
                  )}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={editingPart ? `edit-edge-left` : `new-edge-left`} className="ml-2 text-sm text-blue-700">
                  Left Edge
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={editingPart ? `edit-edge-right` : `new-edge-right`}
                  checked={editingPart ? editingPart.edgeBanding.right : newPart.edgeBanding.right}
                  onChange={(e) => handleEdgeBandingChange(
                    editingPart || newPart, 
                    'right', 
                    e.target.checked
                  )}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={editingPart ? `edit-edge-right` : `new-edge-right`} className="ml-2 text-sm text-blue-700">
                  Right Edge
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id={editingPart ? `edit-required` : `new-required`}
              checked={editingPart ? editingPart.isRequired : newPart.isRequired}
              onChange={(e) => {
                if (editingPart) {
                  setEditingPart({
                    ...editingPart,
                    isRequired: e.target.checked
                  });
                } else {
                  setNewPart({
                    ...newPart,
                    isRequired: e.target.checked
                  });
                }
              }}
              className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={editingPart ? `edit-required` : `new-required`} className="ml-2 text-sm text-blue-700">
              Required Part (cannot be removed in configurator)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddPart(false);
                setEditingPart(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={editingPart ? handleUpdatePart : handleAddPart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingPart ? 'Update Part' : 'Add Part'}
            </button>
          </div>
        </div>
      )}
      
      {/* Parts List */}
      <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thickness</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formulas</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grain</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edge Banding</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  No parts defined yet. Click "Add Part" to get started.
                </td>
              </tr>
            ) : (
              parts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                    {part.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Required
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {materialTypes.find(m => m.value === part.materialType)?.label || part.materialType}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{part.thickness}mm</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-500">
                      <div>W: <span className="font-mono">{part.widthFormula}</span></div>
                      <div>H: <span className="font-mono">{part.heightFormula}</span></div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{part.quantity}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {grainDirections.find(g => g.value === part.grain)?.label || part.grain}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Object.entries(part.edgeBanding)
                        .filter(([_, value]) => value)
                        .map(([edge]) => edge)
                        .join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingPart(part)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Part"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePart(part.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-2">Formula Variables</h5>
        <p className="text-xs text-yellow-700 mb-2">
          You can use these variables in your part formulas:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
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
            <span className="font-mono text-yellow-800">doorCount</span>: Number of doors
          </div>
          <div>
            <span className="font-mono text-yellow-800">drawerCount</span>: Number of drawers
          </div>
          <div>
            <span className="font-mono text-yellow-800">hasTop</span>: Has top panel
          </div>
          <div>
            <span className="font-mono text-yellow-800">hasBack</span>: Has back panel
          </div>
          <div>
            <span className="font-mono text-yellow-800">hasBottom</span>: Has bottom panel
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionTab;