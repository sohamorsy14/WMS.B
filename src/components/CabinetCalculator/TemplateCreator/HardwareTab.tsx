import React from 'react';
import { CabinetTemplate } from '../../../types/cabinet';

interface HardwareTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

const HardwareTab: React.FC<HardwareTabProps> = ({ template, setTemplate }) => {
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

  const drawerBoxTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'dovetail', label: 'Dovetail' },
    { value: 'metal', label: 'Metal' }
  ];

  return (
    <div className="space-y-6">
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
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">Hardware Summary</h5>
            <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
              {template.hardware?.hinges > 0 && (
                <li>{template.hardware.hinges} hinges</li>
              )}
              {template.hardware?.slides > 0 && (
                <li>{template.hardware.slides} pairs of drawer slides</li>
              )}
              {template.hardware?.handles > 0 && (
                <li>{template.hardware.handles} handles</li>
              )}
              {template.hardware?.shelves > 0 && (
                <li>{template.hardware.shelves} adjustable shelves</li>
              )}
              {template.hardware?.shelfPins > 0 && (
                <li>{template.hardware.shelfPins} shelf pins</li>
              )}
              <li>Drawer box type: {template.hardware?.drawerBoxType || 'Standard'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareTab;