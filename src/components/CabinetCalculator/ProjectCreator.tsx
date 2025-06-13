import React, { useState, useEffect } from 'react';
import { CabinetConfiguration, CabinetProject } from '../../types/cabinet';
import { CabinetCalculatorService, CabinetStorageService } from '../../services/cabinetCalculator';
import { Plus, Trash2, Edit, Save, Download, FileText, User, Phone, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner';

interface ProjectCreatorProps {
  savedConfigurations: CabinetConfiguration[];
  onCreateProject: (project: CabinetProject) => void;
  onEditConfiguration: (config: CabinetConfiguration) => void;
  onExportProject: (project: CabinetProject) => void;
}

const ProjectCreator: React.FC<ProjectCreatorProps> = ({
  savedConfigurations,
  onCreateProject,
  onEditConfiguration,
  onExportProject
}) => {
  const [projects, setProjects] = useState<CabinetProject[]>([]);
  const [selectedConfigurations, setSelectedConfigurations] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CabinetProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const loadedProjects = await CabinetStorageService.getProjects();
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConfiguration = (configId: string) => {
    if (selectedConfigurations.includes(configId)) {
      setSelectedConfigurations(selectedConfigurations.filter(id => id !== configId));
    } else {
      setSelectedConfigurations([...selectedConfigurations, configId]);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName || !customerName || selectedConfigurations.length === 0) {
      toast.error('Please fill in all required fields and select at least one cabinet');
      return;
    }

    const selectedConfigs = savedConfigurations.filter(config => 
      selectedConfigurations.includes(config.id)
    );

    const project = CabinetCalculatorService.createProject(
      projectName,
      projectDescription,
      customerName,
      customerContact,
      selectedConfigs,
      notes
    );

    try {
      await CabinetStorageService.saveProject(project);
      await loadProjects();
      onCreateProject(project);
      
      // Reset form
      setProjectName('');
      setProjectDescription('');
      setCustomerName('');
      setCustomerContact('');
      setNotes('');
      setSelectedConfigurations([]);
      setIsCreatingProject(false);
      
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await CabinetStorageService.deleteProject(projectId);
      await loadProjects();
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      quoted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      in_production: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDimensions = (dimensions: any) => {
    if (!dimensions || typeof dimensions !== 'object') {
      return 'N/A';
    }
    const { width, height, depth } = dimensions;
    if (width && height && depth) {
      return `${width} × ${height} × ${depth}mm`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Cabinet Projects</h2>
        <button
          onClick={() => setIsCreatingProject(!isCreatingProject)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingProject ? 'Cancel' : 'Create New Project'}
        </button>
      </div>

      {/* Project Creation Form */}
      {isCreatingProject && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter customer name"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Contact
              </label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone or email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <input
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or special requirements"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Cabinets for this Project *
            </label>
            
            {savedConfigurations.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No saved cabinet configurations available.</p>
                <p className="text-sm text-gray-500 mt-2">Configure and save cabinets first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {savedConfigurations.map((config) => (
                  <div 
                    key={config.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedConfigurations.includes(config.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleConfiguration(config.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{config.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDimensions(config.dimensions)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(config.totalCost || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedConfigurations.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Project Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Selected Cabinets:</span>
                  <span className="font-semibold text-blue-900 ml-2">{selectedConfigurations.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Estimated Cost:</span>
                  <span className="font-semibold text-blue-900 ml-2">
                    {formatCurrency(
                      savedConfigurations
                        .filter(config => selectedConfigurations.includes(config.id))
                        .reduce((sum, config) => sum + (config.totalCost || 0), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Estimated Time:</span>
                  <span className="font-semibold text-blue-900 ml-2">
                    {Math.max(1, Math.ceil(selectedConfigurations.length / 3))} days
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleCreateProject}
              disabled={!projectName || !customerName || selectedConfigurations.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started.</p>
            {!isCreatingProject && (
              <button
                onClick={() => setIsCreatingProject(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Project
              </button>
            )}
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status || 'draft')}`}>
                  {(project.status || 'draft').replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.customerName}</div>
                    {project.customerContact && (
                      <div className="text-xs text-gray-600">{project.customerContact}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(project.total || 0)}</div>
                    <div className="text-xs text-gray-600">
                      {project.configurations?.length || 0} cabinets
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.estimatedDays || 0} days</div>
                    <div className="text-xs text-gray-600">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cabinet List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Cabinets ({project.configurations?.length || 0})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {project.configurations?.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <div>
                        <div className="font-medium text-gray-900">{config.name}</div>
                        <div className="text-xs text-gray-600">
                          {formatDimensions(config.dimensions)}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-green-600 mr-4">
                          {formatCurrency(config.totalCost || 0)}
                        </div>
                        <button
                          onClick={() => onEditConfiguration(config)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Edit Configuration"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
              
              {/* Cost Breakdown */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3">Cost Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-green-700">Materials:</div>
                    <div className="font-semibold text-green-900">{formatCurrency(project.totalMaterialCost || 0)}</div>
                  </div>
                  <div>
                    <div className="text-green-700">Hardware:</div>
                    <div className="font-semibold text-green-900">{formatCurrency(project.totalHardwareCost || 0)}</div>
                  </div>
                  <div>
                    <div className="text-green-700">Labor:</div>
                    <div className="font-semibold text-green-900">{formatCurrency(project.totalLaborCost || 0)}</div>
                  </div>
                  <div>
                    <div className="text-green-700">Total (incl. tax):</div>
                    <div className="font-bold text-green-900">{formatCurrency(project.total || 0)}</div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="flex items-center px-3 py-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
                
                <button
                  onClick={() => onExportProject(project)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Project
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectCreator;