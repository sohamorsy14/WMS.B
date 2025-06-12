import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all cabinet calculator routes
router.use(authenticateToken);

// Get all custom templates
router.get('/templates', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const templates = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, description, category, dimensions, panels, hardware, 
               materials, construction, created_by, created_at, updated_at
        FROM cabinet_templates 
        WHERE is_custom = 1
        ORDER BY name ASC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      dimensions: JSON.parse(template.dimensions || '{}'),
      panels: JSON.parse(template.panels || '[]'),
      hardware: JSON.parse(template.hardware || '[]'),
      materials: JSON.parse(template.materials || '[]'),
      construction: JSON.parse(template.construction || '{}')
    }));

    res.json(parsedTemplates);
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    res.status(500).json({ error: 'Failed to fetch custom templates' });
  }
});

// Get a specific template by ID
router.get('/templates/:id', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, name, description, category, dimensions, panels, hardware, 
               materials, construction, created_by, created_at, updated_at
        FROM cabinet_templates 
        WHERE id = ? AND is_custom = 1
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse JSON fields
    const parsedTemplate = {
      ...template,
      dimensions: JSON.parse(template.dimensions || '{}'),
      panels: JSON.parse(template.panels || '[]'),
      hardware: JSON.parse(template.hardware || '[]'),
      materials: JSON.parse(template.materials || '[]'),
      construction: JSON.parse(template.construction || '{}')
    };

    res.json(parsedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create a new custom template
router.post('/templates', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { name, description, category, dimensions, panels, hardware, materials, construction } = req.body;
    const userId = req.user.id;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO cabinet_templates (
          name, description, category, dimensions, panels, hardware, 
          materials, construction, is_custom, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      `, [
        name,
        description,
        category,
        JSON.stringify(dimensions || {}),
        JSON.stringify(panels || []),
        JSON.stringify(hardware || []),
        JSON.stringify(materials || []),
        JSON.stringify(construction || {}),
        userId
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    res.status(201).json({ id: result.id, message: 'Template created successfully' });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update an existing template
router.put('/templates/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, dimensions, panels, hardware, materials, construction } = req.body;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE cabinet_templates 
        SET name = ?, description = ?, category = ?, dimensions = ?, panels = ?, 
            hardware = ?, materials = ?, construction = ?, updated_at = datetime('now')
        WHERE id = ? AND is_custom = 1
      `, [
        name,
        description,
        category,
        JSON.stringify(dimensions || {}),
        JSON.stringify(panels || []),
        JSON.stringify(hardware || []),
        JSON.stringify(materials || []),
        JSON.stringify(construction || {}),
        id
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete a template
router.delete('/templates/:id', requirePermission('cabinet_calc.edit'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM cabinet_templates 
        WHERE id = ? AND is_custom = 1
      `, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
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
          // Determine if the part fits in the current row
          if (currentX + item.length > sheetLength) {
            // Move to next row
            currentX = 0;
            currentY += rowHeight + 10; // 10mm spacing between rows
            rowHeight = 0;
          }
          
          // Check if we need to start a new sheet (not implemented in this simple version)
          if (currentY + item.width > sheetWidth) {
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
            rotation: 0, // No rotation in this simple implementation
            length: item.length,
            width: item.width
          });
          
          // Update position for next part
          currentX += item.length + 10; // 10mm spacing between parts
          rowHeight = Math.max(rowHeight, item.width);
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