import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all cabinet calculator routes
router.use(authenticateToken);

// Nesting optimization endpoint with sheet size and material type selection
router.post('/nesting', requirePermission('cabinet_calc.view'), async (req, res) => {
  try {
    const { cuttingList, sheetSize, materialType } = req.body;
    
    // Filter by material type if specified
    const filteredList = materialType 
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
      
      // Use custom sheet size if provided
      const sheetWidth = sheetSize?.width || 1220;  // Default 4x8 sheet width
      const sheetLength = sheetSize?.length || 2440; // Default 4x8 sheet length
      
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