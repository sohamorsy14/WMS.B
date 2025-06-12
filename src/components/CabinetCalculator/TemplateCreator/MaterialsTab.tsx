import React from 'react';
import { CabinetTemplate } from '../../../types/cabinet';
import { Info } from 'lucide-react';

interface MaterialsTabProps {
  template: Partial<CabinetTemplate>;
  setTemplate: React.Dispatch<React.SetStateAction<Partial<CabinetTemplate>>>;
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ template, setTemplate }) => {
  const handleMaterialThicknessChange = (component: string, value: number) => {
    setTemplate(prev => ({
      ...prev,
      materialThickness: {
        ...prev.materialThickness,
        [component]: value
      }
    }));
  };

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
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">Material Thickness Summary</h5>
            <p className="text-sm text-yellow-700">
              These thickness values will be used to calculate material requirements during the nesting optimization stage. The actual material type will be selected at that time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsTab;