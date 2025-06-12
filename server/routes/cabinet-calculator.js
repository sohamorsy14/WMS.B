import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all cabinet calculator routes
router.use(authenticateToken);

// Get all cabinet templates
router.get('/templates', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const templates = await db.all('SELECT * FROM cabinet_templates ORDER BY created_at DESC');
    
    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      category: template.category,
      defaultDimensions: JSON.parse(template.default_dimensions),
      minDimensions: JSON.parse(template.min_dimensions),
      maxDimensions: JSON.parse(template.max_dimensions),
      previewImage: template.preview_image,
      description: template.description,
      features: JSON.parse(template.features),
      materialThickness: JSON.parse(template.material_thickness),
      hardware: JSON.parse(template.hardware),
      isActive: Boolean(template.is_active),
      isCustom: Boolean(template.is_custom),
      createdAt: template.created_at
    }));
    
    res.json(parsedTemplates);
  } catch (error) {
    console.error('Get cabinet templates error:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet templates' });
  }
});

// Create new cabinet template
router.post('/templates', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const templateData = req.body;
    
    if (!templateData.name || !templateData.type || !templateData.category) {
      return res.status(400).json({ error: 'Name, type, and category are required' });
    }

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const id = templateData.id || db.generateUUID();
    
    await db.run(
      `INSERT INTO cabinet_templates (
        id, name, type, category, default_dimensions, min_dimensions, max_dimensions,
        preview_image, description, features, material_thickness, hardware,
        is_active, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        templateData.name,
        templateData.type,
        templateData.category,
        JSON.stringify(templateData.defaultDimensions),
        JSON.stringify(templateData.minDimensions),
        JSON.stringify(templateData.maxDimensions),
        templateData.previewImage,
        templateData.description,
        JSON.stringify(templateData.features),
        JSON.stringify(templateData.materialThickness),
        JSON.stringify(templateData.hardware),
        templateData.isActive ? 1 : 0,
        templateData.isCustom ? 1 : 0
      ]
    );
    
    const newTemplate = await db.get('SELECT * FROM cabinet_templates WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedTemplate = {
      id: newTemplate.id,
      name: newTemplate.name,
      type: newTemplate.type,
      category: newTemplate.category,
      defaultDimensions: JSON.parse(newTemplate.default_dimensions),
      minDimensions: JSON.parse(newTemplate.min_dimensions),
      maxDimensions: JSON.parse(newTemplate.max_dimensions),
      previewImage: newTemplate.preview_image,
      description: newTemplate.description,
      features: JSON.parse(newTemplate.features),
      materialThickness: JSON.parse(newTemplate.material_thickness),
      hardware: JSON.parse(newTemplate.hardware),
      isActive: Boolean(newTemplate.is_active),
      isCustom: Boolean(newTemplate.is_custom),
      createdAt: newTemplate.created_at
    };
    
    res.status(201).json(parsedTemplate);
  } catch (error) {
    console.error('Create cabinet template error:', error);
    res.status(500).json({ error: 'Failed to create cabinet template' });
  }
});

// Update cabinet template
router.put('/templates/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run(
      `UPDATE cabinet_templates SET 
       name = ?, type = ?, category = ?, default_dimensions = ?, min_dimensions = ?,
       max_dimensions = ?, preview_image = ?, description = ?, features = ?,
       material_thickness = ?, hardware = ?, is_active = ?, is_custom = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        templateData.name,
        templateData.type,
        templateData.category,
        JSON.stringify(templateData.defaultDimensions),
        JSON.stringify(templateData.minDimensions),
        JSON.stringify(templateData.maxDimensions),
        templateData.previewImage,
        templateData.description,
        JSON.stringify(templateData.features),
        JSON.stringify(templateData.materialThickness),
        JSON.stringify(templateData.hardware),
        templateData.isActive ? 1 : 0,
        templateData.isCustom ? 1 : 0,
        id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet template not found' });
    }
    
    const updatedTemplate = await db.get('SELECT * FROM cabinet_templates WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedTemplate = {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      type: updatedTemplate.type,
      category: updatedTemplate.category,
      defaultDimensions: JSON.parse(updatedTemplate.default_dimensions),
      minDimensions: JSON.parse(updatedTemplate.min_dimensions),
      maxDimensions: JSON.parse(updatedTemplate.max_dimensions),
      previewImage: updatedTemplate.preview_image,
      description: updatedTemplate.description,
      features: JSON.parse(updatedTemplate.features),
      materialThickness: JSON.parse(updatedTemplate.material_thickness),
      hardware: JSON.parse(updatedTemplate.hardware),
      isActive: Boolean(updatedTemplate.is_active),
      isCustom: Boolean(updatedTemplate.is_custom),
      createdAt: updatedTemplate.created_at
    };
    
    res.json(parsedTemplate);
  } catch (error) {
    console.error('Update cabinet template error:', error);
    res.status(500).json({ error: 'Failed to update cabinet template' });
  }
});

// Delete cabinet template
router.delete('/templates/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run('DELETE FROM cabinet_templates WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet template not found' });
    }
    
    res.json({ message: 'Cabinet template deleted successfully' });
  } catch (error) {
    console.error('Delete cabinet template error:', error);
    res.status(500).json({ error: 'Failed to delete cabinet template' });
  }
});

// Get all cabinet configurations
router.get('/configurations', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const configurations = await db.all('SELECT * FROM cabinet_configurations ORDER BY created_at DESC');
    
    // Parse JSON fields
    const parsedConfigurations = configurations.map(config => ({
      id: config.id,
      templateId: config.template_id,
      name: config.name,
      dimensions: JSON.parse(config.dimensions),
      customizations: JSON.parse(config.customizations),
      materials: JSON.parse(config.materials),
      hardware: JSON.parse(config.hardware),
      cuttingList: JSON.parse(config.cutting_list),
      totalCost: config.total_cost,
      laborCost: config.labor_cost,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    }));
    
    res.json(parsedConfigurations);
  } catch (error) {
    console.error('Get cabinet configurations error:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet configurations' });
  }
});

// Create new cabinet configuration
router.post('/configurations', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const configData = req.body;
    
    if (!configData.templateId || !configData.name) {
      return res.status(400).json({ error: 'Template ID and name are required' });
    }

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const id = configData.id || db.generateUUID();
    
    await db.run(
      `INSERT INTO cabinet_configurations (
        id, template_id, name, dimensions, customizations, materials, hardware,
        cutting_list, total_cost, labor_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        configData.templateId,
        configData.name,
        JSON.stringify(configData.dimensions),
        JSON.stringify(configData.customizations),
        JSON.stringify(configData.materials),
        JSON.stringify(configData.hardware),
        JSON.stringify(configData.cuttingList),
        configData.totalCost,
        configData.laborCost
      ]
    );
    
    const newConfig = await db.get('SELECT * FROM cabinet_configurations WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedConfig = {
      id: newConfig.id,
      templateId: newConfig.template_id,
      name: newConfig.name,
      dimensions: JSON.parse(newConfig.dimensions),
      customizations: JSON.parse(newConfig.customizations),
      materials: JSON.parse(newConfig.materials),
      hardware: JSON.parse(newConfig.hardware),
      cuttingList: JSON.parse(newConfig.cutting_list),
      totalCost: newConfig.total_cost,
      laborCost: newConfig.labor_cost,
      createdAt: newConfig.created_at,
      updatedAt: newConfig.updated_at
    };
    
    res.status(201).json(parsedConfig);
  } catch (error) {
    console.error('Create cabinet configuration error:', error);
    res.status(500).json({ error: 'Failed to create cabinet configuration' });
  }
});

// Update cabinet configuration
router.put('/configurations/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const configData = req.body;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run(
      `UPDATE cabinet_configurations SET 
       template_id = ?, name = ?, dimensions = ?, customizations = ?,
       materials = ?, hardware = ?, cutting_list = ?, total_cost = ?, labor_cost = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        configData.templateId,
        configData.name,
        JSON.stringify(configData.dimensions),
        JSON.stringify(configData.customizations),
        JSON.stringify(configData.materials),
        JSON.stringify(configData.hardware),
        JSON.stringify(configData.cuttingList),
        configData.totalCost,
        configData.laborCost,
        id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet configuration not found' });
    }
    
    const updatedConfig = await db.get('SELECT * FROM cabinet_configurations WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedConfig = {
      id: updatedConfig.id,
      templateId: updatedConfig.template_id,
      name: updatedConfig.name,
      dimensions: JSON.parse(updatedConfig.dimensions),
      customizations: JSON.parse(updatedConfig.customizations),
      materials: JSON.parse(updatedConfig.materials),
      hardware: JSON.parse(updatedConfig.hardware),
      cuttingList: JSON.parse(updatedConfig.cutting_list),
      totalCost: updatedConfig.total_cost,
      laborCost: updatedConfig.labor_cost,
      createdAt: updatedConfig.created_at,
      updatedAt: updatedConfig.updated_at
    };
    
    res.json(parsedConfig);
  } catch (error) {
    console.error('Update cabinet configuration error:', error);
    res.status(500).json({ error: 'Failed to update cabinet configuration' });
  }
});

// Delete cabinet configuration
router.delete('/configurations/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run('DELETE FROM cabinet_configurations WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet configuration not found' });
    }
    
    res.json({ message: 'Cabinet configuration deleted successfully' });
  } catch (error) {
    console.error('Delete cabinet configuration error:', error);
    res.status(500).json({ error: 'Failed to delete cabinet configuration' });
  }
});

// Get all cabinet projects
router.get('/projects', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const projects = await db.all('SELECT * FROM cabinet_projects ORDER BY created_at DESC');
    
    // Parse JSON fields
    const parsedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      customerName: project.customer_name,
      customerContact: project.customer_contact,
      configurations: JSON.parse(project.configurations),
      totalMaterialCost: project.total_material_cost,
      totalLaborCost: project.total_labor_cost,
      totalHardwareCost: project.total_hardware_cost,
      subtotal: project.subtotal,
      tax: project.tax,
      total: project.total,
      estimatedDays: project.estimated_days,
      status: project.status,
      notes: project.notes,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }));
    
    res.json(parsedProjects);
  } catch (error) {
    console.error('Get cabinet projects error:', error);
    res.status(500).json({ error: 'Failed to fetch cabinet projects' });
  }
});

// Create new cabinet project
router.post('/projects', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData.name || !projectData.customerName || !projectData.configurations) {
      return res.status(400).json({ error: 'Name, customer name, and configurations are required' });
    }

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const id = projectData.id || db.generateUUID();
    
    await db.run(
      `INSERT INTO cabinet_projects (
        id, name, description, customer_name, customer_contact, configurations,
        total_material_cost, total_labor_cost, total_hardware_cost, subtotal, tax, total,
        estimated_days, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectData.name,
        projectData.description || '',
        projectData.customerName,
        projectData.customerContact || '',
        JSON.stringify(projectData.configurations),
        projectData.totalMaterialCost,
        projectData.totalLaborCost,
        projectData.totalHardwareCost,
        projectData.subtotal,
        projectData.tax,
        projectData.total,
        projectData.estimatedDays,
        projectData.status || 'draft',
        projectData.notes || ''
      ]
    );
    
    const newProject = await db.get('SELECT * FROM cabinet_projects WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedProject = {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      customerName: newProject.customer_name,
      customerContact: newProject.customer_contact,
      configurations: JSON.parse(newProject.configurations),
      totalMaterialCost: newProject.total_material_cost,
      totalLaborCost: newProject.total_labor_cost,
      totalHardwareCost: newProject.total_hardware_cost,
      subtotal: newProject.subtotal,
      tax: newProject.tax,
      total: newProject.total,
      estimatedDays: newProject.estimated_days,
      status: newProject.status,
      notes: newProject.notes,
      createdAt: newProject.created_at,
      updatedAt: newProject.updated_at
    };
    
    res.status(201).json(parsedProject);
  } catch (error) {
    console.error('Create cabinet project error:', error);
    res.status(500).json({ error: 'Failed to create cabinet project' });
  }
});

// Update cabinet project
router.put('/projects/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run(
      `UPDATE cabinet_projects SET 
       name = ?, description = ?, customer_name = ?, customer_contact = ?, configurations = ?,
       total_material_cost = ?, total_labor_cost = ?, total_hardware_cost = ?, subtotal = ?, 
       tax = ?, total = ?, estimated_days = ?, status = ?, notes = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectData.name,
        projectData.description || '',
        projectData.customerName,
        projectData.customerContact || '',
        JSON.stringify(projectData.configurations),
        projectData.totalMaterialCost,
        projectData.totalLaborCost,
        projectData.totalHardwareCost,
        projectData.subtotal,
        projectData.tax,
        projectData.total,
        projectData.estimatedDays,
        projectData.status,
        projectData.notes || '',
        id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet project not found' });
    }
    
    const updatedProject = await db.get('SELECT * FROM cabinet_projects WHERE id = ?', [id]);
    
    // Parse JSON fields for response
    const parsedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      customerName: updatedProject.customer_name,
      customerContact: updatedProject.customer_contact,
      configurations: JSON.parse(updatedProject.configurations),
      totalMaterialCost: updatedProject.total_material_cost,
      totalLaborCost: updatedProject.total_labor_cost,
      totalHardwareCost: updatedProject.total_hardware_cost,
      subtotal: updatedProject.subtotal,
      tax: updatedProject.tax,
      total: updatedProject.total,
      estimatedDays: updatedProject.estimated_days,
      status: updatedProject.status,
      notes: updatedProject.notes,
      createdAt: updatedProject.created_at,
      updatedAt: updatedProject.updated_at
    };
    
    res.json(parsedProject);
  } catch (error) {
    console.error('Update cabinet project error:', error);
    res.status(500).json({ error: 'Failed to update cabinet project' });
  }
});

// Delete cabinet project
router.delete('/projects/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!db.isConnected()) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await db.run('DELETE FROM cabinet_projects WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cabinet project not found' });
    }
    
    res.json({ message: 'Cabinet project deleted successfully' });
  } catch (error) {
    console.error('Delete cabinet project error:', error);
    res.status(500).json({ error: 'Failed to delete cabinet project' });
  }
});

// Nesting optimization endpoint
router.post('/nesting', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { cuttingList } = req.body;
    
    // In a real implementation, this would use a nesting algorithm
    // For now, we'll return a mock response
    const nestingResults = [
      {
        id: `nesting-result-${Date.now()}`,
        sheetSize: { length: 2440, width: 1220 },
        materialType: 'Plywood',
        thickness: 18,
        parts: cuttingList.map((item, index) => ({
          id: `part-${index}-${Date.now()}`,
          partId: item.id,
          x: (index % 3) * 400,
          y: Math.floor(index / 3) * 300,
          rotation: 0,
          length: item.length,
          width: item.width
        })),
        efficiency: 85.5,
        wasteArea: 650000,
        totalArea: 2440 * 1220,
        sheetCount: 2
      }
    ];
    
    res.json(nestingResults);
  } catch (error) {
    console.error('Nesting optimization error:', error);
    res.status(500).json({ error: 'Failed to perform nesting optimization' });
  }
});

export default router;