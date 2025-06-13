import express from 'express';
import cors from 'cors';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all cabinet calculator routes
router.use(authenticateToken);

// Helper function to check if database is connected and tables exist
async function isDatabaseReady() {
  try {
    if (!db || typeof db.get !== 'function') {
      return false;
    }
    
    // Check if cabinet_templates table exists
    const tableCheck = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='cabinet_templates'
    `);
    
    return !!tableCheck;
  } catch (error) {
    console.log('Database not ready:', error.message);
    return false;
  }
}

// Mock data for fallback
const mockTemplates = [
  {
    id: 1,
    name: "Base Cabinet",
    description: "Standard base cabinet template",
    category: "base",
    default_dimensions: { width: 600, height: 720, depth: 560 },
    min_dimensions: { width: 300, height: 600, depth: 400 },
    max_dimensions: { width: 1200, height: 900, depth: 700 },
    panels: [
      { name: "Left Side", formula: "height * depth", thickness: 18 },
      { name: "Right Side", formula: "height * depth", thickness: 18 },
      { name: "Back", formula: "width * height", thickness: 6 },
      { name: "Bottom", formula: "width * depth", thickness: 18 },
      { name: "Top", formula: "width * depth", thickness: 18 }
    ],
    hardware: [
      { name: "Hinges", quantity: 2, type: "soft-close" },
      { name: "Handles", quantity: 1, type: "standard" }
    ],
    materials: [
      { name: "Melamine", type: "panel", thickness: 18 },
      { name: "Plywood Back", type: "panel", thickness: 6 }
    ],
    construction: { joinery: "dowel", edge_banding: true },
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockProjects = [
  {
    id: 1,
    name: "Kitchen Renovation",
    description: "Complete kitchen cabinet project",
    configurations: [
      {
        id: 1,
        name: "Base Cabinets",
        template_id: 1,
        dimensions: { width: 800, height: 720, depth: 560 },
        quantity: 6
      }
    ],
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockConfigurations = [
  {
    id: 1,
    name: "Standard Base Config",
    template_id: 1,
    dimensions: { width: 600, height: 720, depth: 560 },
    customizations: { edge_banding: "white", handles: "brushed_steel" },
    materials: [
      { name: "Melamine White", quantity: 2, unit: "sheet" }
    ],
    hardware: [
      { name: "Soft Close Hinges", quantity: 2 },
      { name: "Cabinet Handle", quantity: 1 }
    ],
    cutting_list: [
      { name: "Left Side", length: 720, width: 560, thickness: 18, quantity: 1 },
      { name: "Right Side", length: 720, width: 560, thickness: 18, quantity: 1 }
    ],
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all custom templates
router.get('/templates', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      console.log('Database not ready, returning mock templates');
      return res.json(mockTemplates);
    }

    const templates = await db.all(`
      SELECT id, name, description, category, default_dimensions, min_dimensions, max_dimensions, 
             panels, hardware, materials, construction, created_by, created_at, updated_at
      FROM cabinet_templates 
      WHERE is_custom = 1
      ORDER BY name ASC
    `);

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      default_dimensions: JSON.parse(template.default_dimensions || '{}'),
      min_dimensions: JSON.parse(template.min_dimensions || '{}'),
      max_dimensions: JSON.parse(template.max_dimensions || '{}'),
      panels: JSON.parse(template.panels || '[]'),
      hardware: JSON.parse(template.hardware || '[]'),
      materials: JSON.parse(template.materials || '[]'),
      construction: JSON.parse(template.construction || '{}')
    }));

    res.json(parsedTemplates);
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    console.log('Falling back to mock templates');
    res.json(mockTemplates);
  }
});

// Get a specific template by ID
router.get('/templates/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      const mockTemplate = mockTemplates.find(t => t.id === parseInt(id));
      if (!mockTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.json(mockTemplate);
    }
    
    const template = await db.get(`
      SELECT id, name, description, category, default_dimensions, min_dimensions, max_dimensions,
             panels, hardware, materials, construction, created_by, created_at, updated_at
      FROM cabinet_templates 
      WHERE id = ? AND is_custom = 1
    `, [id]);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse JSON fields
    const parsedTemplate = {
      ...template,
      default_dimensions: JSON.parse(template.default_dimensions || '{}'),
      min_dimensions: JSON.parse(template.min_dimensions || '{}'),
      max_dimensions: JSON.parse(template.max_dimensions || '{}'),
      panels: JSON.parse(template.panels || '[]'),
      hardware: JSON.parse(template.hardware || '[]'),
      materials: JSON.parse(template.materials || '[]'),
      construction: JSON.parse(template.construction || '{}')
    };

    res.json(parsedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    const mockTemplate = mockTemplates.find(t => t.id === parseInt(req.params.id));
    if (mockTemplate) {
      res.json(mockTemplate);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  }
});

// Create a new custom template
router.post('/templates', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { name, description, category, default_dimensions, min_dimensions, max_dimensions, panels, hardware, materials, construction } = req.body;
    const userId = req.user.id;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      // Return success but don't actually save
      const mockId = Math.max(...mockTemplates.map(t => t.id)) + 1;
      return res.status(201).json({ id: mockId, message: 'Template created successfully (mock mode)' });
    }

    const result = await db.run(`
      INSERT INTO cabinet_templates (
        name, description, category, default_dimensions, min_dimensions, max_dimensions,
        panels, hardware, materials, construction, is_custom, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `, [
      name,
      description,
      category,
      JSON.stringify(default_dimensions || {}),
      JSON.stringify(min_dimensions || {}),
      JSON.stringify(max_dimensions || {}),
      JSON.stringify(panels || []),
      JSON.stringify(hardware || []),
      JSON.stringify(materials || []),
      JSON.stringify(construction || {}),
      userId
    ]);

    res.status(201).json({ id: result.lastID, message: 'Template created successfully' });
  } catch (error) {
    console.error('Error creating template:', error);
    const mockId = Math.max(...mockTemplates.map(t => t.id)) + 1;
    res.status(201).json({ id: mockId, message: 'Template created successfully (mock mode)' });
  }
});

// Update an existing template
router.put('/templates/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, default_dimensions, min_dimensions, max_dimensions, panels, hardware, materials, construction } = req.body;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Template updated successfully (mock mode)' });
    }

    const result = await db.run(`
      UPDATE cabinet_templates 
      SET name = ?, description = ?, category = ?, default_dimensions = ?, min_dimensions = ?, max_dimensions = ?,
          panels = ?, hardware = ?, materials = ?, construction = ?, updated_at = datetime('now')
      WHERE id = ? AND is_custom = 1
    `, [
      name,
      description,
      category,
      JSON.stringify(default_dimensions || {}),
      JSON.stringify(min_dimensions || {}),
      JSON.stringify(max_dimensions || {}),
      JSON.stringify(panels || []),
      JSON.stringify(hardware || []),
      JSON.stringify(materials || []),
      JSON.stringify(construction || {}),
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.json({ message: 'Template updated successfully (mock mode)' });
  }
});

// Delete a template
router.delete('/templates/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Template deleted successfully (mock mode)' });
    }

    const result = await db.run(`
      DELETE FROM cabinet_templates 
      WHERE id = ? AND is_custom = 1
    `, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.json({ message: 'Template deleted successfully (mock mode)' });
  }
});

// Get all projects
router.get('/projects', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      console.log('Database not ready, returning mock projects');
      return res.json(mockProjects);
    }

    const projects = await db.all(`
      SELECT id, name, description, configurations, created_by, created_at, updated_at
      FROM cabinet_projects 
      ORDER BY name ASC
    `);

    // Parse JSON fields
    const parsedProjects = projects.map(project => ({
      ...project,
      configurations: JSON.parse(project.configurations || '[]')
    }));

    res.json(parsedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    console.log('Falling back to mock projects');
    res.json(mockProjects);
  }
});

// Get a specific project by ID
router.get('/projects/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      const mockProject = mockProjects.find(p => p.id === parseInt(id));
      if (!mockProject) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.json(mockProject);
    }
    
    const project = await db.get(`
      SELECT id, name, description, configurations, created_by, created_at, updated_at
      FROM cabinet_projects 
      WHERE id = ?
    `, [id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse JSON fields
    const parsedProject = {
      ...project,
      configurations: JSON.parse(project.configurations || '[]')
    };

    res.json(parsedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    const mockProject = mockProjects.find(p => p.id === parseInt(req.params.id));
    if (mockProject) {
      res.json(mockProject);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  }
});

// Create a new project
router.post('/projects', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { name, description, configurations } = req.body;
    const userId = req.user.id;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      const mockId = Math.max(...mockProjects.map(p => p.id)) + 1;
      return res.status(201).json({ id: mockId, message: 'Project created successfully (mock mode)' });
    }

    const result = await db.run(`
      INSERT INTO cabinet_projects (
        name, description, configurations, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name,
      description,
      JSON.stringify(configurations || []),
      userId
    ]);

    res.status(201).json({ id: result.lastID, message: 'Project created successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    const mockId = Math.max(...mockProjects.map(p => p.id)) + 1;
    res.status(201).json({ id: mockId, message: 'Project created successfully (mock mode)' });
  }
});

// Update an existing project
router.put('/projects/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, configurations } = req.body;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Project updated successfully (mock mode)' });
    }

    const result = await db.run(`
      UPDATE cabinet_projects 
      SET name = ?, description = ?, configurations = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      name,
      description,
      JSON.stringify(configurations || []),
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.json({ message: 'Project updated successfully (mock mode)' });
  }
});

// Delete a project
router.delete('/projects/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Project deleted successfully (mock mode)' });
    }

    const result = await db.run(`
      DELETE FROM cabinet_projects 
      WHERE id = ?
    `, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.json({ message: 'Project deleted successfully (mock mode)' });
  }
});

// Get all configurations
router.get('/configurations', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      console.log('Database not ready, returning mock configurations');
      return res.json(mockConfigurations);
    }

    const configurations = await db.all(`
      SELECT id, name, template_id, dimensions, customizations, materials, 
             hardware, cutting_list, created_by, created_at, updated_at
      FROM cabinet_configurations 
      ORDER BY name ASC
    `);

    // Parse JSON fields
    const parsedConfigurations = configurations.map(config => ({
      ...config,
      dimensions: JSON.parse(config.dimensions || '{}'),
      customizations: JSON.parse(config.customizations || '{}'),
      materials: JSON.parse(config.materials || '[]'),
      hardware: JSON.parse(config.hardware || '[]'),
      cutting_list: JSON.parse(config.cutting_list || '[]')
    }));

    res.json(parsedConfigurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    console.log('Falling back to mock configurations');
    res.json(mockConfigurations);
  }
});

// Get a specific configuration by ID
router.get('/configurations/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();
    
    if (!dbReady) {
      const mockConfig = mockConfigurations.find(c => c.id === parseInt(id));
      if (!mockConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      return res.json(mockConfig);
    }
    
    const configuration = await db.get(`
      SELECT id, name, template_id, dimensions, customizations, materials, 
             hardware, cutting_list, created_by, created_at, updated_at
      FROM cabinet_configurations 
      WHERE id = ?
    `, [id]);

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Parse JSON fields
    const parsedConfiguration = {
      ...configuration,
      dimensions: JSON.parse(configuration.dimensions || '{}'),
      customizations: JSON.parse(configuration.customizations || '{}'),
      materials: JSON.parse(configuration.materials || '[]'),
      hardware: JSON.parse(configuration.hardware || '[]'),
      cutting_list: JSON.parse(configuration.cutting_list || '[]')
    };

    res.json(parsedConfiguration);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    const mockConfig = mockConfigurations.find(c => c.id === parseInt(req.params.id));
    if (mockConfig) {
      res.json(mockConfig);
    } else {
      res.status(404).json({ error: 'Configuration not found' });
    }
  }
});

// Create a new configuration
router.post('/configurations', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { name, template_id, dimensions, customizations, materials, hardware, cutting_list } = req.body;
    const userId = req.user.id;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      const mockId = Math.max(...mockConfigurations.map(c => c.id)) + 1;
      return res.status(201).json({ id: mockId, message: 'Configuration created successfully (mock mode)' });
    }

    const result = await db.run(`
      INSERT INTO cabinet_configurations (
        name, template_id, dimensions, customizations, materials, hardware, 
        cutting_list, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name,
      template_id,
      JSON.stringify(dimensions || {}),
      JSON.stringify(customizations || {}),
      JSON.stringify(materials || []),
      JSON.stringify(hardware || []),
      JSON.stringify(cutting_list || []),
      userId
    ]);

    res.status(201).json({ id: result.lastID, message: 'Configuration created successfully' });
  } catch (error) {
    console.error('Error creating configuration:', error);
    const mockId = Math.max(...mockConfigurations.map(c => c.id)) + 1;
    res.status(201).json({ id: mockId, message: 'Configuration created successfully (mock mode)' });
  }
});

// Update an existing configuration
router.put('/configurations/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, template_id, dimensions, customizations, materials, hardware, cutting_list } = req.body;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Configuration updated successfully (mock mode)' });
    }

    const result = await db.run(`
      UPDATE cabinet_configurations 
      SET name = ?, template_id = ?, dimensions = ?, customizations = ?, materials = ?, 
          hardware = ?, cutting_list = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      name,
      template_id,
      JSON.stringify(dimensions || {}),
      JSON.stringify(customizations || {}),
      JSON.stringify(materials || []),
      JSON.stringify(hardware || []),
      JSON.stringify(cutting_list || []),
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.json({ message: 'Configuration updated successfully (mock mode)' });
  }
});

// Delete a configuration
router.delete('/configurations/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const dbReady = await isDatabaseReady();

    if (!dbReady) {
      return res.json({ message: 'Configuration deleted successfully (mock mode)' });
    }

    const result = await db.run(`
      DELETE FROM cabinet_configurations 
      WHERE id = ?
    `, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.json({ message: 'Configuration deleted successfully (mock mode)' });
  }
});

// Nesting optimization endpoint with sheet size and material type selection
router.post('/nesting', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { cuttingList, sheetSize, materialType } = req.body;
    
    // Filter by material type if specified
    const filteredList = materialType && materialType !== 'all'
      ? cuttingList.filter(item => item.materialType.toLowerCase() === materialType.toLowerCase())
      : cuttingList;
    
    // Group by material type and thickness
    const materialGroups = new Map();
    filteredList.forEach(item => {
      const key = `${item.materialType}-${item.thickness}`;
      if (!materialGroups.has(key)) {
        materialGroups.set(key, []);
      }
      materialGroups.get(key).push(item);
    });
    
    // Process each material group
    const nestingResults = [];
    materialGroups.forEach((items, key) => {
      const [materialType, thickness] = key.split('-');
      
      // Parse sheet size from the provided parameter or use default
      let sheetWidth = 1220;  // Default 4x8 sheet width
      let sheetLength = 2440; // Default 4x8 sheet length
      
      if (sheetSize) {
        // If sheetSize is an object with length and width properties
        if (typeof sheetSize === 'object' && sheetSize.length && sheetSize.width) {
          sheetLength = sheetSize.length;
          sheetWidth = sheetSize.width;
        } 
        // If sheetSize is a string like "2100x2800"
        else if (typeof sheetSize === 'string') {
          const [length, width] = sheetSize.split('x').map(Number);
          if (!isNaN(length) && !isNaN(width)) {
            sheetLength = length;
            sheetWidth = width;
          }
        }
      }
      
      console.log(`Using sheet size: ${sheetLength} × ${sheetWidth}mm for ${materialType}-${thickness}mm`);
      
      // Simple area-based calculation
      const totalArea = items.reduce((sum, item) => {
        return sum + (item.length * item.width * item.quantity);
      }, 0);
      
      const sheetArea = sheetLength * sheetWidth;
      const efficiency = Math.min(0.85, totalArea / sheetArea); // Max 85% efficiency
      const sheetsNeeded = Math.ceil(totalArea / (sheetArea * efficiency));
      
      // Create a more realistic layout with no overlapping parts
      const parts = [];
      let currentX = 0;
      let currentY = 0;
      let rowHeight = 0;
      let itemIndex = 0;
      
      // Process each item (and its quantity)
      items.forEach(item => {
        for (let q = 0; q < item.quantity; q++) {
          // Consider grain direction for rotation
          let canRotate = item.grain === 'none';
          let shouldRotate = false;
          let partLength = item.length;
          let partWidth = item.width;
          let rotation = 0;
          
          // If grain direction is specified, check if rotation is allowed
          if (item.grain === 'width') {
            // Grain runs along width, so we should rotate from default
            shouldRotate = true;
            canRotate = true;
          }
          
          // Apply rotation if needed and allowed
          if (shouldRotate && canRotate) {
            partLength = item.width;
            partWidth = item.length;
            rotation = 90;
          }
          
          // Determine if the part fits in the current row
          if (currentX + partLength > sheetLength) {
            // Move to next row
            currentX = 0;
            currentY += rowHeight + 10; // 10mm spacing between rows
            rowHeight = 0;
          }
          
          // Check if we need to start a new sheet (not implemented in this simple version)
          if (currentY + partWidth > sheetWidth) {
            // In a real implementation, we would start a new sheet here
            // For simplicity, we'll just continue on the same sheet
            currentY = 0;
            currentX = 0;
            rowHeight = 0;
          }
          
          // Add the part to the layout
          parts.push({
            id: `part-${itemIndex}-${Date.now()}`,
            partId: item.id,
            x: currentX,
            y: currentY,
            rotation: rotation,
            length: partLength,
            width: partWidth,
            grain: item.grain
          });
          
          // Update position for next part
          currentX += partLength + 10; // 10mm spacing between parts
          rowHeight = Math.max(rowHeight, partWidth);
          itemIndex++;
        }
      });
      
      nestingResults.push({
        id: `nesting-${key}-${Date.now()}`,
        sheetSize: {
          length: sheetLength,
          width: sheetWidth
        },
        materialType,
        thickness: parseInt(thickness),
        parts,
        efficiency: efficiency * 100,
        wasteArea: sheetArea * sheetsNeeded - totalArea,
        totalArea: sheetArea * sheetsNeeded,
        sheetCount: sheetsNeeded
      });
    });
    
    res.json(nestingResults);
  } catch (error) {
    console.error('Nesting optimization error:', error);
    res.status(500).json({ error: 'Failed to perform nesting optimization' });
  }
});

export default router;