import React, { useState } from 'react';
import { CabinetTemplate } from '../../../types/cabinet';
import { Plus, Trash2, Edit } from 'lucide-react';

interface HardwareTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

interface HardwareItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  notes?: string;
}

const hardwareTypes = [
  { value: 'hinge', label: 'Hinges' },
  { value: 'slide', label: 'Drawer Slides' },
  { value: 'handle', label: 'Handles' },
  { value: 'knob', label: 'Knobs' },
  { value: 'shelf_pin', label: 'Shelf Pins' },
  { value: 'cam_lock', label: 'Cam Locks' },
  { value: 'corner_bracket', label: 'Corner Brackets' },
  { value: 'lazy_susan', label: 'Lazy Susan' },
  { value: 'pull_out', label: 'Pull-Out Mechanism' },
  { value: 'soft_close', label: 'Soft Close Mechanism' },
  { value: 'other', label: 'Other Hardware' }
];

const predefinedHardware = [
  { type: 'hinge', name: 'Concealed Hinges 35mm', unitCost: 3.25, supplier: 'Hardware Plus' },
  { type: 'hinge', name: 'Soft-Close Hinges 35mm', unitCost: 5.75, supplier: 'Hardware Plus' },
  { type: 'slide', name: 'Full Extension Slides 18"', unitCost: 12.50, supplier: 'Slide Systems Inc.' },
  { type: 'slide', name: 'Soft-Close Slides 18"', unitCost: 18.75, supplier: 'Slide Systems Inc.' },
  { type: 'handle', name: 'Bar Handle 128mm Chrome', unitCost: 5.85, supplier: 'Handle World' },
  { type: 'handle', name: 'Bar Handle 128mm Black', unitCost: 6.25, supplier: 'Handle World' },
  { type: 'knob', name: 'Round Knob 30mm Chrome', unitCost: 3.50, supplier: 'Handle World' },
  { type: 'shelf_pin', name: 'Adjustable Shelf Pins 5mm', unitCost: 0.25, supplier: 'Cabinet Accessories' },
  { type: 'cam_lock', name: 'Cam Lock 15mm', unitCost: 0.45, supplier: 'Cabinet Accessories' },
  { type: 'corner_bracket', name: 'Metal Corner Bracket', unitCost: 0.75, supplier: 'Cabinet Accessories' },
  { type: 'lazy_susan', name: 'Lazy Susan 28" Diameter', unitCost: 85.00, supplier: 'Cabinet Accessories' },
  { type: 'pull_out', name: 'Pull-Out Waste Bin', unitCost: 65.00, supplier: 'Cabinet Accessories' },
  { type: 'soft_close', name: 'Door Soft Close Adapter', unitCost: 4.50, supplier: 'Hardware Plus' }
];

const HardwareTab: React.FC<HardwareTabProps> = ({ template, setTemplate }) => {
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>(template.hardwareItems || []);
  const [showAddHardware, setShowAddHardware] = useState(false);
  const [editingHardware, setEditingHardware] = useState<HardwareItem | null>(null);
  const [newHardware, setNewHardware] = useState<HardwareItem>({
    id: `hardware-${Date.now()}`,
    type: 'hinge',
    name: '',
    quantity: 1,
    unitCost: 0,
    supplier: ''
  });
  const [selectedPredefined, setSelectedPredefined] = useState<string>('');

  const handleHardwareChange = (item: string, value: number | string) => {
    setTemplate(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        [item]: value
      }
    }));
  };

  const handleChange = (field: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddHardware = () => {
    if (!newHardware.name) return;
    
    const updatedItems = [...hardwareItems, { ...newHardware, id: `hardware-${Date.now()}` }];
    setHardwareItems(updatedItems);
    setTemplate(prev => ({
      ...prev,
      hardwareItems: updatedItems
    }));
    
    // Reset form
    setNewHardware({
      id: `hardware-${Date.now()}`,
      type: 'hinge',
      name: '',
      quantity: 1,
      unitCost: 0,
      supplier: ''
    });
    setSelectedPredefined('');
    setShowAddHardware(false);
  };

  const handleUpdateHardware = () => {
    if (!editingHardware) return;
    
    const updatedItems = hardwareItems.map(item => 
      item.id === editingHardware.id ? editingHardware : item
    );
    
    setHardwareItems(updatedItems);
    setTemplate(prev => ({
      ...prev,
      hardwareItems: updatedItems
    }));
    
    setEditingHardware(null);
  };

  const handleDeleteHardware = (itemId: string) => {
    const updatedItems = hardwareItems.filter(item => item.id !== itemId);
    setHardwareItems(updatedItems);
    setTemplate(prev => ({
      ...prev,
      hardwareItems: updatedItems
    }));
  };

  const handlePredefinedHardwareChange = (hardwareId: string) => {
    setSelectedPredefined(hardwareId);
    
    if (hardwareId) {
      const selected = predefinedHardware.find(h => `${h.type}-${h.name}` === hardwareId);
      if (selected) {
        if (editingHardware) {
          setEditingHardware({
            ...editingHardware,
            type: selected.type,
            name: selected.name,
            unitCost: selected.unitCost,
            supplier: selected.supplier
          });
        } else {
          setNewHardware({
            ...newHardware,
            type: selected.type,
            name: selected.name,
            unitCost: selected.unitCost,
            supplier: selected.supplier
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Hardware</h3>
      
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-700">Hardware Components</h4>
        <button
          type="button"
          onClick={() => setShowAddHardware(!showAddHardware)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Hardware
        </button>
      </div>
      
      {/* Add/Edit Hardware Form */}
      {(showAddHardware || editingHardware) && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <h5 className="font-medium text-blue-800 mb-4">
            {editingHardware ? 'Edit Hardware' : 'Add New Hardware'}
          </h5>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Predefined Hardware
            </label>
            <select
              value={selectedPredefined}
              onChange={(e) => handlePredefinedHardwareChange(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Predefined Hardware</option>
              {predefinedHardware.map(hardware => (
                <option key={`${hardware.type}-${hardware.name}`} value={`${hardware.type}-${hardware.name}`}>
                  {hardware.name} - ${hardware.unitCost.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Hardware Type
              </label>
              <select
                value={editingHardware ? editingHardware.type : newHardware.type}
                onChange={(e) => {
                  if (editingHardware) {
                    setEditingHardware({
                      ...editingHardware,
                      type: e.target.value
                    });
                  } else {
                    setNewHardware({
                      ...newHardware,
                      type: e.target.value
                    });
                  }
                  setSelectedPredefined('');
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {hardwareTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Hardware Name
              </label>
              <input
                type="text"
                value={editingHardware ? editingHardware.name : newHardware.name}
                onChange={(e) => {
                  if (editingHardware) {
                    setEditingHardware({
                      ...editingHardware,
                      name: e.target.value
                    });
                  } else {
                    setNewHardware({
                      ...newHardware,
                      name: e.target.value
                    });
                  }
                  setSelectedPredefined('');
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter hardware name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={editingHardware ? editingHardware.quantity : newHardware.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (editingHardware) {
                    setEditingHardware({
                      ...editingHardware,
                      quantity: value
                    });
                  } else {
                    setNewHardware({
                      ...newHardware,
                      quantity: value
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editingHardware ? editingHardware.unitCost : newHardware.unitCost}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (editingHardware) {
                    setEditingHardware({
                      ...editingHardware,
                      unitCost: value
                    });
                  } else {
                    setNewHardware({
                      ...newHardware,
                      unitCost: value
                    });
                  }
                  setSelectedPredefined('');
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={editingHardware ? editingHardware.supplier : newHardware.supplier}
                onChange={(e) => {
                  if (editingHardware) {
                    setEditingHardware({
                      ...editingHardware,
                      supplier: e.target.value
                    });
                  } else {
                    setNewHardware({
                      ...newHardware,
                      supplier: e.target.value
                    });
                  }
                  setSelectedPredefined('');
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter supplier name"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={editingHardware ? editingHardware.notes || '' : newHardware.notes || ''}
              onChange={(e) => {
                if (editingHardware) {
                  setEditingHardware({
                    ...editingHardware,
                    notes: e.target.value
                  });
                } else {
                  setNewHardware({
                    ...newHardware,
                    notes: e.target.value
                  });
                }
              }}
              rows={2}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this hardware"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddHardware(false);
                setEditingHardware(null);
                setSelectedPredefined('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={editingHardware ? handleUpdateHardware : handleAddHardware}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingHardware ? 'Update Hardware' : 'Add Hardware'}
            </button>
          </div>
        </div>
      )}
      
      {/* Hardware Items List */}
      <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hardwareItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                  No hardware items defined yet. Click "Add Hardware" to get started.
                </td>
              </tr>
            ) : (
              hardwareItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {hardwareTypes.find(t => t.value === item.type)?.label || item.type}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${item.unitCost.toFixed(2)}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(item.quantity * item.unitCost).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.supplier}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingHardware(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Hardware"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHardware(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Hardware"
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
      
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-4">Default Hardware Quantities</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drawer Box Type
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="drawerBoxType-standard"
                  name="drawerBoxType"
                  value="standard"
                  checked={template.hardware?.drawerBoxType === 'standard'}
                  onChange={() => handleHardwareChange('drawerBoxType', 'standard')}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="drawerBoxType-standard" className="ml-2 text-sm text-gray-700">
                  Standard
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="drawerBoxType-dovetail"
                  name="drawerBoxType"
                  value="dovetail"
                  checked={template.hardware?.drawerBoxType === 'dovetail'}
                  onChange={() => handleHardwareChange('drawerBoxType', 'dovetail')}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="drawerBoxType-dovetail" className="ml-2 text-sm text-gray-700">
                  Dovetail
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="drawerBoxType-metal"
                  name="drawerBoxType"
                  value="metal"
                  checked={template.hardware?.drawerBoxType === 'metal'}
                  onChange={() => handleHardwareChange('drawerBoxType', 'metal')}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="drawerBoxType-metal" className="ml-2 text-sm text-gray-700">
                  Metal
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
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
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h5 className="font-medium text-green-800 mb-2">Hardware Summary</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
              {hardwareItems.map((item, index) => (
                <li key={index}>
                  {item.quantity} × {item.name} (${item.unitCost.toFixed(2)} each)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-green-700">
              <strong>Total Hardware Cost:</strong> ${hardwareItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2)}
            </p>
            <p className="text-sm text-green-700 mt-2">
              <strong>Drawer Box Type:</strong> {template.hardware?.drawerBoxType || 'Standard'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareTab;