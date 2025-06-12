import React from 'react';
import { CabinetTemplate } from '../../../types/cabinet';

interface ConstructionTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

const ConstructionTab: React.FC<ConstructionTabProps> = ({ template, setTemplate }) => {
  const handleConstructionChange = (field: string, value: boolean) => {
    setTemplate(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Construction</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Cabinet Structure</h4>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTop"
              checked={template.construction?.hasTop !== false}
              onChange={(e) => handleConstructionChange('hasTop', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasBottom', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasBack', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasDoubleBack', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasToe', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasFixedShelf', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('isCorner', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasFrontPanel', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasFillerPanel', e.target.checked)}
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
              onChange={(e) => handleConstructionChange('hasUprights', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hasUprights" className="ml-2 text-sm text-gray-700">
              Has Uprights
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Construction Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-blue-700 mb-2">Included Components:</h5>
            <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
              {template.construction?.hasTop !== false && <li>Top Panel</li>}
              {template.construction?.hasBottom !== false && <li>Bottom Panel</li>}
              {template.construction?.hasBack !== false && <li>Back Panel</li>}
              {template.construction?.hasDoubleBack === true && <li>Double Back Panel</li>}
              {template.construction?.hasToe === true && <li>Toe Kick</li>}
              {template.construction?.hasFixedShelf === true && <li>Fixed Shelf</li>}
              {template.construction?.hasFrontPanel === true && <li>Front Fixed Panel</li>}
              {template.construction?.hasFillerPanel === true && <li>Filler Panel</li>}
              {template.construction?.hasUprights === true && <li>Uprights</li>}
              <li>Side Panels (2)</li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-700 mb-2">Cabinet Type:</h5>
            <p className="text-sm text-blue-600">
              {template.construction?.isCorner === true ? 'Corner Cabinet' : 'Standard Cabinet'}
            </p>
            
            <h5 className="text-sm font-medium text-blue-700 mt-4 mb-2">Cabinet Style:</h5>
            <p className="text-sm text-blue-600">
              {template.type === 'base' && 'Base Cabinet'}
              {template.type === 'wall' && 'Wall Cabinet'}
              {template.type === 'tall' && 'Tall Cabinet'}
              {template.type === 'drawer' && 'Drawer Unit'}
              {template.type === 'specialty' && 'Specialty Cabinet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionTab;