import React, { useState, useEffect } from 'react';
import { Calculator, Save, Download, FileText, Package, BarChart3, Plus, Trash2, Eye, Settings, Ruler, Grid, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { cabinetTemplates } from '../data/cabinetTemplates';
import { CabinetTemplate, CabinetConfiguration, CabinetProject, NestingResult, CuttingListItem } from '../types/cabinet';
import { CabinetCalculatorService, CabinetStorageService } from '../services/cabinetCalculator';
import CabinetCatalog from '../components/CabinetCalculator/CabinetCatalog';
import CabinetConfigurator from '../components/CabinetCalculator/CabinetConfigurator';
import NestingViewer from '../components/CabinetCalculator/NestingViewer';
import ProjectCreator from '../components/CabinetCalculator/ProjectCreator';
import TemplateManager from '../components/CabinetCalculator/TemplateManager';
import PanelCalculator from '../components/CabinetCalculator/PanelCalculator';
import CuttingListImporter from '../components/CabinetCalculator/CuttingListImporter';
import PDFImporter from '../components/CabinetCalculator/PDFImporter';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { exportCuttingListCSV, exportCuttingListPDF, exportBOMExcel, exportProjectPDF, exportNestingSVG, exportNestingDXF } from '../components/CabinetCalculator/ExportUtils';

const CabinetCalculator: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'configure' | 'nesting' | 'projects' | 'templates' | 'calculator' | 'import' | 'pdf-import'>('catalog');
  const [selectedTemplate, setSelectedTemplate] = useState<CabinetTemplate | null>(null);
  const [currentConfiguration, setCurrentConfiguration] = useState<CabinetConfiguration | null>(null);
  const [savedConfigurations, setSavedConfigurations] = useState<CabinetConfiguration[]>([]);
  const [nestingResults, setNestingResults] = useState<NestingResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'cutting-list' | 'bom' | 'project'>('cutting-list');
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [allTemplates, setAllTemplates] = useState<CabinetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheetSize, setSelectedSheetSize] = useState<string>('2440x1220');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  
  useEffect(() => {
    // Load saved configurations and templates
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      // Load saved configurations from database
      const configs = await CabinetStorageService.getConfigurations();
      setSavedConfigurations(configs);
      
      // Load all templates (default + custom)
      await loadAllTemplates();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load saved data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAllTemplates = async () => {
    try {
      const customTemplates = await CabinetStorageService.getCustomTemplates();
      setAllTemplates([...cabinetTemplates, ...customTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load custom templates');
      // Fallback to just default templates
      setAllTemplates([...cabinetTemplates]);
    }
  };

  const handleTemplateSelect = (template: CabinetTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('configure');
  };

  const handleConfigurationChange = (config: CabinetConfiguration) => {
    setCurrentConfiguration(config);
  };

  const handleSaveConfiguration = async (config: CabinetConfiguration) => {
    try {
      await CabinetStorageService.saveConfiguration(config);
      const updatedConfigs = await CabinetStorageService.getConfigurations();
      setSavedConfigurations(updatedConfigs);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const handleEditConfiguration = (config: CabinetConfiguration) => {
    const template = allTemplates.find(t => t.id === config.templateId);
    if (template) {
      setSelectedTemplate(template);
      setCurrentConfiguration(config);
      setActiveTab('configure');
    } else {
      toast.error('Template not found for this configuration');
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    try {
      await CabinetStorageService.deleteConfiguration(configId);
      const updatedConfigs = await CabinetStorageService.getConfigurations();
      setSavedConfigurations(updatedConfigs);
      toast.success('Configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const handleOptimizeNesting = async () => {
    if (!currentConfiguration) {
      toast.error('Please configure a cabinet first');
      return;
    }

    setIsOptimizing(true);
    try {
      // Parse sheet size from dropdown
      let sheetSize;
      if (selectedSheetSize) {
        const [length, width] = selectedSheetSize.split('x').map(Number);
        if (!isNaN(length) && !isNaN(width)) {
          sheetSize = { length, width };
        }
      }

      // Call the optimizeNesting method with sheet size and material type
      const results = await CabinetCalculatorService.optimizeNesting(
        currentConfiguration.cuttingList,
        sheetSize,
        selectedMaterial !== 'all' ? selectedMaterial : undefined
      );
      
      setNestingResults(results);
      setActiveTab('nesting');
      toast.success('Nesting optimization completed');
    } catch (error) {
      console.error('Nesting optimization error:', error);
      toast.error('Failed to optimize nesting');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExportCuttingList = (config: CabinetConfiguration) => {
    setCurrentConfiguration(config);
    setExportType('cutting-list');
    setIsExportModalOpen(true);
  };

  const handleExportBOM = (config: CabinetConfiguration) => {
    setCurrentConfiguration(config);
    setExportType('bom');
    setBomModalOpen(true);
  };

  const handleExportProject = (project: CabinetProject) => {
    exportProjectPDF(project);
    toast.success('Project exported as PDF');
  };

  const handleExportNesting = (result: NestingResult) => {
    // Show export options in a modal or dropdown
    const exportFormat = window.confirm('Export as SVG? (Cancel for DXF)') ? 'svg' : 'dxf';
    
    if (exportFormat === 'svg') {
      exportNestingSVG(result);
      toast.success('Nesting exported as SVG');
    } else {
      exportNestingDXF(result);
      toast.success('Nesting exported as DXF');
    }
  };

  const handleCreateProject = async (project: CabinetProject) => {
    try {
      // Project is saved in the ProjectCreator component
      await CabinetStorageService.saveProject(project);
      setActiveTab('projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };
  
  const handleAddTemplate = async (template: CabinetTemplate) => {
    try {
      await loadAllTemplates();
      toast.success('Template added to catalog');
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    }
  };

  const handleImportCuttingList = (cuttingList: CuttingListItem[]) => {
    // Create a new configuration from the imported cutting list
    if (cuttingList.length > 0) {
      const importedConfig: CabinetConfiguration = {
        id: `imported-${Date.now()}`,
        templateId: 'imported',
        name: 'Imported Cutting List',
        dimensions: { width: 0, height: 0, depth: 0 },
        customizations: {
          doorCount: 0,
          drawerCount: 0,
          shelfCount: 0,
          doorStyle: 'Custom',
          finish: 'Custom',
          hardware: 'Custom'
        },
        materials: [],
        hardware: [],
        cuttingList: cuttingList,
        totalCost: 0,
        laborCost: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Calculate materials and costs based on the cutting list
      const materials = CabinetCalculatorService.calculateMaterials(cuttingList);
      const hardware = [];
      const laborCost = CabinetCalculatorService.calculateLaborCost(importedConfig);
      
      importedConfig.materials = materials;
      importedConfig.hardware = hardware;
      importedConfig.laborCost = laborCost;
      importedConfig.totalCost = CabinetCalculatorService.calculateTotalCost(importedConfig);
      
      setCurrentConfiguration(importedConfig);
      setActiveTab('nesting');
      toast.success(`Successfully imported ${cuttingList.length} cutting list items`);
    }
  };

  const performExport = () => {
    if (!currentConfiguration) return;
    
    if (exportType === 'cutting-list') {
      const format = window.confirm('Export as CSV? (Cancel for PDF)') ? 'csv' : 'pdf';
      
      if (format === 'csv') {
        exportCuttingListCSV(currentConfiguration);
        toast.success('Cutting list exported as CSV');
      } else {
        exportCuttingListPDF(currentConfiguration);
        toast.success('Cutting list exported as PDF');
      }
    } else if (exportType === 'bom') {
      exportBOMExcel(currentConfiguration);
      toast.success('BOM exported as Excel');
    }
    
    setIsExportModalOpen(false);
  };

  const handleCreateBOM = () => {
    if (!currentConfiguration) return;
    
    const bom = CabinetCalculatorService.generateBOM(currentConfiguration);
    console.log('Generated BOM:', bom);
    toast.success('BOM created successfully');
    setBomModalOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasPermission('cabinet_calc.view')) {
    return (
      <div className="text-center py-12">
        <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to use the cabinet calculator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabinet Calculator</h1>
          <p className="text-gray-600 mt-1">Design cabinets, calculate costs, and optimize material usage</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('pdf-import')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Import PDF</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Cutting List</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Grid className="w-4 h-4" />
            <span>Manage Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => {
              if (currentConfiguration) {
                setExportType('cutting-list');
                setIsExportModalOpen(true);
              } else {
                toast.error('Please configure a cabinet first');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {[
              { id: 'catalog', label: 'Cabinet Catalog', icon: Package },
              { id: 'configure', label: 'Configure', icon: Calculator, disabled: !selectedTemplate },
              { id: 'nesting',  label: 'Nesting Optimization', icon: BarChart3, disabled: !currentConfiguration },
              { id: 'calculator', label: 'Panel Calculator', icon: Ruler, disabled: !selectedTemplate },
              { id: 'pdf-import', label: 'Import PDF', icon: FileText },
              { id: 'import', label: 'Import Cutting List', icon: Upload },
              { id: 'projects', label: 'Projects', icon: FileText },
              { id: 'templates', label: 'Template Management', icon: Grid }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                  disabled={tab.disabled}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'catalog' && (
            <CabinetCatalog 
              templates={allTemplates.filter(t => t.isActive)}
              onSelectTemplate={handleTemplateSelect}
              onAddTemplate={handleAddTemplate}
              selectedTemplate={selectedTemplate}
            />
          )}

          {activeTab === 'configure' && selectedTemplate && (
            <CabinetConfigurator 
              template={selectedTemplate}
              onConfigurationChange={handleConfigurationChange}
              onSaveConfiguration={handleSaveConfiguration}
              onExportCuttingList={handleExportCuttingList}
              onExportBOM={handleExportBOM}
            />
          )}

          {activeTab === 'nesting' && (
            <NestingViewer 
              nestingResults={nestingResults}
              onOptimize={handleOptimizeNesting}
              onExportNesting={handleExportNesting}
              isOptimizing={isOptimizing}
            />
          )}

          {activeTab === 'calculator' && selectedTemplate && (
            <PanelCalculator template={selectedTemplate} />
          )}

          {activeTab === 'pdf-import' && (
            <PDFImporter onImport={handleImportCuttingList} />
          )}

          {activeTab === 'import' && (
            <CuttingListImporter onImport={handleImportCuttingList} />
          )}

          {activeTab === 'projects' && (
            <ProjectCreator 
              savedConfigurations={savedConfigurations}
              onCreateProject={handleCreateProject}
              onEditConfiguration={handleEditConfiguration}
              onExportProject={handleExportProject}
            />
          )}
          
          {activeTab === 'templates' && (
            <TemplateManager
              defaultTemplates={cabinetTemplates}
              onSelectTemplate={handleTemplateSelect}
              onAddTemplate={handleAddTemplate}
            />
          )}
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Export ${exportType === 'cutting-list' ? 'Cutting List' : 'BOM'}`}
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-700">
            {exportType === 'cutting-list' 
              ? 'Export the cutting list for this cabinet configuration. Choose your preferred format below.'
              : 'Export the bill of materials (BOM) for this cabinet configuration.'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportType === 'cutting-list' && (
              <>
                <button
                  onClick={() => {
                    if (currentConfiguration) {
                      exportCuttingListCSV(currentConfiguration);
                      setIsExportModalOpen(false);
                      toast.success('Cutting list exported as CSV');
                    }
                  }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-12 h-12 text-blue-600 mb-3" />
                  <span className="font-medium text-gray-900">CSV Format</span>
                  <span className="text-sm text-gray-600 mt-1">Spreadsheet compatible</span>
                </button>
                
                <button
                  onClick={() => {
                    if (currentConfiguration) {
                      exportCuttingListPDF(currentConfiguration);
                      setIsExportModalOpen(false);
                      toast.success('Cutting list exported as PDF');
                    }
                  }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-12 h-12 text-red-600 mb-3" />
                  <span className="font-medium text-gray-900">PDF Format</span>
                  <span className="text-sm text-gray-600 mt-1">Print-ready document</span>
                </button>
              </>
            )}
            
            {exportType === 'bom' && (
              <button
                onClick={() => {
                  if (currentConfiguration) {
                    exportBOMExcel(currentConfiguration);
                    setIsExportModalOpen(false);
                    toast.success('BOM exported as Excel');
                  }
                }}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-12 h-12 text-green-600 mb-3" />
                <span className="font-medium text-gray-900">Excel Format</span>
                <span className="text-sm text-gray-600 mt-1">Complete BOM with multiple sheets</span>
              </button>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* BOM Creation Modal */}
      <Modal
        isOpen={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        title="Create Bill of Materials"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-gray-700">
            You can create a Bill of Materials (BOM) from this cabinet configuration and add it to the BOM management system.
          </p>
          
          {currentConfiguration && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">{currentConfiguration.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-blue-700">Materials:</div>
                <div className="text-blue-900 font-medium">
                  {currentConfiguration.materials.length} items
                </div>
                <div className="text-blue-700">Hardware:</div>
                <div className="text-blue-900 font-medium">
                  {currentConfiguration.hardware.length} items
                </div>
                <div className="text-blue-700">Total Cost:</div>
                <div className="text-blue-900 font-medium">
                  ${currentConfiguration.totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => setBomModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (currentConfiguration) {
                    exportBOMExcel(currentConfiguration);
                    setBomModalOpen(false);
                    toast.success('BOM exported as Excel');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2 inline-block" />
                Export as Excel
              </button>
              
              <button
                onClick={handleCreateBOM}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2 inline-block" />
                Create BOM
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CabinetCalculator;