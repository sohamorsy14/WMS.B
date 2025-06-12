import React, { useState, useEffect } from 'react';
import { CabinetTemplate } from '../../types/cabinet';
import { Plus, Minus, Save, X, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import BasicInformationTab from './TemplateCreator/BasicInformationTab';
import ConstructionTab from './TemplateCreator/ConstructionTab';
import MaterialsTab from './TemplateCreator/MaterialsTab';
import HardwareTab from './TemplateCreator/HardwareTab';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'construction' | 'materials' | 'hardware'>('basic');
  const [template, setTemplate] = useState<Partial<CabinetTemplate>>({
    id: '',
    name: '',
    type: 'base',
    category: 'Base Cabinets',
    defaultDimensions: { width: 600, height: 720, depth: 560 },
    minDimensions: { width: 300, height: 700, depth: 500 },
    maxDimensions: { width: 1200, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400',
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
      hasFillerPanel: false,
      hasUprights: false
    },
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 2,
      slides: 0,
      handles: 1,
      shelves: 1,
      shelfPins: 4,
      drawerBoxType: 'standard'
    },
    isActive: true,
    isCustom: true
  });

  useEffect(() => {
    if (editTemplate) {
      setTemplate({
        ...editTemplate,
        // Ensure all required fields exist
        construction: {
          hasTop: true,
          hasBottom: true,
          hasBack: true,
          hasDoubleBack: false,
          hasToe: true,
          hasFixedShelf: false,
          isCorner: false,
          hasFrontPanel: false,
          hasFillerPanel: false,
          hasUprights: false,
          ...editTemplate.construction
        },
        materialThickness: {
          side: 18,
          topBottom: 18,
          back: 12,
          shelf: 18,
          door: 18,
          drawer: 15,
          fixedPanel: 18,
          drawerBottom: 12,
          uprights: 18,
          doubleBack: 12,
          ...editTemplate.materialThickness
        }
      });
    }
  }, [editTemplate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template.name || !template.type || !template.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate ID if it's a new template
    const finalTemplate: CabinetTemplate = {
      ...template as CabinetTemplate,
      id: template.id || `template-${template.type}-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    onTemplateCreated(finalTemplate);
  };

  const handleTabChange = (tab: 'basic' | 'construction' | 'materials' | 'hardware') => {
    setActiveTab(tab);
  };

  const handleNext = () => {
    if (activeTab === 'basic') setActiveTab('construction');
    else if (activeTab === 'construction') setActiveTab('materials');
    else if (activeTab === 'materials') setActiveTab('hardware');
  };

  const handlePrevious = () => {
    if (activeTab === 'hardware') setActiveTab('materials');
    else if (activeTab === 'materials') setActiveTab('construction');
    else if (activeTab === 'construction') setActiveTab('basic');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs for different sections */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => handleTabChange('basic')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Basic Information
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('construction')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'construction'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Construction
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('materials')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Materials
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('hardware')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'hardware'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Hardware
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'basic' && (
          <BasicInformationTab 
            template={template} 
            setTemplate={setTemplate} 
          />
        )}
        
        {activeTab === 'construction' && (
          <ConstructionTab 
            template={template} 
            setTemplate={setTemplate} 
          />
        )}
        
        {activeTab === 'materials' && (
          <MaterialsTab 
            template={template} 
            setTemplate={setTemplate} 
          />
        )}
        
        {activeTab === 'hardware' && (
          <HardwareTab 
            template={template} 
            setTemplate={setTemplate} 
          />
        )}
      </div>

      {/* Navigation and Submit Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <div>
          {activeTab !== 'basic' && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          
          {activeTab !== 'hardware' ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {editTemplate ? 'Update Template' : 'Create Template'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default TemplateCreator;