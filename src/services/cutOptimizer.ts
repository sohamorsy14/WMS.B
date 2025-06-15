import { CuttingListItem, NestingResult, NestingPart } from '../types/cabinet';

/**
 * CutOptimizer - A more efficient panel cutting optimization service
 * 
 * This service implements a more sophisticated algorithm for 2D bin packing
 * to optimize the cutting of rectangular panels from standard sheets.
 */
export class CutOptimizer {
  /**
   * Optimize the cutting layout for a list of parts
   * 
   * @param cuttingList - List of parts to be cut
   * @param sheetSize - Size of the sheet to cut from
   * @param materialType - Type of material
   * @param thickness - Thickness of the material
   * @returns A nesting result with optimized part placement
   */
  static optimizeLayout(
    cuttingList: CuttingListItem[],
    sheetSize: { length: number; width: number },
    materialType: string,
    thickness: number
  ): NestingResult {
    // Clone the cutting list to avoid modifying the original
    const parts = [...cuttingList].map(item => ({
      ...item,
      // Create multiple instances based on quantity
      instances: Array(item.quantity).fill(0).map((_, i) => ({
        id: `${item.id}-${i}`,
        length: item.length,
        width: item.width,
        grain: item.grain
      }))
    })).flatMap(item => item.instances);
    
    // Sort parts by area (largest first) and then by grain direction
    parts.sort((a, b) => {
      // First sort by area (largest first)
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      if (areaB !== areaA) return areaB - areaA;
      
      // Then prioritize parts with grain direction
      if (a.grain !== 'none' && b.grain === 'none') return -1;
      if (a.grain === 'none' && b.grain !== 'none') return 1;
      
      // Then sort by the longer dimension
      return Math.max(b.length, b.width) - Math.max(a.length, a.width);
    });
    
    // Initialize the result
    const nestedParts: NestingPart[] = [];
    let usedArea = 0;
    let currentSheet = 1;
    
    // Create a representation of the sheet
    const sheet = {
      length: sheetSize.length,
      width: sheetSize.width,
      // Track free rectangles within the sheet
      freeRects: [{ x: 0, y: 0, width: sheetSize.width, length: sheetSize.length }]
    };
    
    // Process each part
    for (const part of parts) {
      // Try to fit the part in the current orientation
      let placed = this.findPositionForPart(sheet, part.length, part.width, part.grain);
      
      // If not placed and grain allows rotation, try rotated
      if (!placed && part.grain === 'none') {
        placed = this.findPositionForPart(sheet, part.width, part.length, part.grain, true);
      }
      
      // If still not placed, try a new sheet
      if (!placed) {
        currentSheet++;
        sheet.freeRects = [{ x: 0, y: 0, width: sheetSize.width, length: sheetSize.length }];
        
        // Try again with the new sheet
        placed = this.findPositionForPart(sheet, part.length, part.width, part.grain);
        
        // If still not placed and grain allows rotation, try rotated
        if (!placed && part.grain === 'none') {
          placed = this.findPositionForPart(sheet, part.width, part.length, part.grain, true);
        }
        
        // If still can't place, skip this part (shouldn't happen with a new sheet)
        if (!placed) {
          console.error(`Failed to place part ${part.id} even on a new sheet`);
          continue;
        }
      }
      
      // Add the placed part to the result
      nestedParts.push({
        id: part.id,
        partId: part.id.split('-')[0], // Extract the original part ID
        x: placed.x,
        y: placed.y,
        length: placed.rotated ? part.width : part.length,
        width: placed.rotated ? part.length : part.width,
        rotation: placed.rotated ? 90 : 0,
        grain: part.grain
      });
      
      // Update used area
      usedArea += part.length * part.width;
    }
    
    // Calculate total area and efficiency
    const totalArea = sheetSize.length * sheetSize.width * currentSheet;
    const efficiency = (usedArea / totalArea) * 100;
    
    return {
      id: `nesting-${Date.now()}`,
      sheetSize,
      materialType,
      thickness,
      parts: nestedParts,
      efficiency,
      wasteArea: totalArea - usedArea,
      totalArea,
      sheetCount: currentSheet
    };
  }
  
  /**
   * Find a position for a part within the sheet
   * 
   * @param sheet - The sheet with free rectangles
   * @param partLength - Length of the part
   * @param partWidth - Width of the part
   * @param grain - Grain direction of the part
   * @param rotated - Whether the part is rotated
   * @returns Position where the part can be placed, or null if it can't be placed
   */
  private static findPositionForPart(
    sheet: { length: number; width: number; freeRects: Array<{ x: number; y: number; length: number; width: number }> },
    partLength: number,
    partWidth: number,
    grain: 'length' | 'width' | 'none',
    rotated: boolean = false
  ): { x: number; y: number; rotated: boolean } | null {
    // Check if the part can be placed with respect to grain direction
    if (grain === 'length' && rotated) {
      // For length grain, the part's length should align with sheet length (2440mm)
      // If rotated, the part's width becomes its length, which should align with sheet length
      if (partWidth > sheet.length) return null;
    } else if (grain === 'width' && !rotated) {
      // For width grain, the part's width should align with sheet length (2440mm)
      // If not rotated, the part's width should align with sheet length
      if (partWidth > sheet.length) return null;
    }
    
    // Find the best position using the Best Short Side Fit (BSSF) algorithm
    let bestRect = null;
    let bestShortSideFit = Number.MAX_VALUE;
    let bestPosition = null;
    
    for (let i = 0; i < sheet.freeRects.length; i++) {
      const rect = sheet.freeRects[i];
      
      // Check if the part fits in the rectangle
      if (rect.length >= partLength && rect.width >= partWidth) {
        const remainingLength = rect.length - partLength;
        const remainingWidth = rect.width - partWidth;
        const shortSideFit = Math.min(remainingLength, remainingWidth);
        
        if (bestRect === null || shortSideFit < bestShortSideFit) {
          bestRect = rect;
          bestShortSideFit = shortSideFit;
          bestPosition = { x: rect.x, y: rect.y, rotated };
        }
      }
    }
    
    // If a position was found, update the free rectangles
    if (bestRect && bestPosition) {
      this.placePart(sheet, bestRect, bestPosition.x, bestPosition.y, partLength, partWidth);
      return bestPosition;
    }
    
    return null;
  }
  
  /**
   * Place a part in the sheet and update the free rectangles
   * 
   * @param sheet - The sheet with free rectangles
   * @param rect - The rectangle where the part will be placed
   * @param x - X coordinate of the part
   * @param y - Y coordinate of the part
   * @param partLength - Length of the part
   * @param partWidth - Width of the part
   */
  private static placePart(
    sheet: { freeRects: Array<{ x: number; y: number; length: number; width: number }> },
    rect: { x: number; y: number; length: number; width: number },
    x: number,
    y: number,
    partLength: number,
    partWidth: number
  ): void {
    // Remove the rectangle from the list
    const index = sheet.freeRects.indexOf(rect);
    if (index !== -1) {
      sheet.freeRects.splice(index, 1);
    }
    
    // Create new free rectangles
    
    // Right of the part
    if (rect.x + rect.length > x + partLength) {
      sheet.freeRects.push({
        x: x + partLength,
        y: rect.y,
        length: rect.x + rect.length - (x + partLength),
        width: rect.width
      });
    }
    
    // Below the part
    if (rect.y + rect.width > y + partWidth) {
      sheet.freeRects.push({
        x: rect.x,
        y: y + partWidth,
        length: rect.length,
        width: rect.y + rect.width - (y + partWidth)
      });
    }
    
    // Merge overlapping rectangles to reduce fragmentation
    this.mergeFreeRectangles(sheet);
  }
  
  /**
   * Merge overlapping free rectangles to reduce fragmentation
   * 
   * @param sheet - The sheet with free rectangles
   */
  private static mergeFreeRectangles(
    sheet: { freeRects: Array<{ x: number; y: number; length: number; width: number }> }
  ): void {
    // Sort rectangles by area (largest first)
    sheet.freeRects.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    
    // Remove rectangles that are completely contained within others
    for (let i = 0; i < sheet.freeRects.length; i++) {
      const rectI = sheet.freeRects[i];
      
      for (let j = i + 1; j < sheet.freeRects.length; j++) {
        const rectJ = sheet.freeRects[j];
        
        // Check if rectJ is contained within rectI
        if (
          rectJ.x >= rectI.x && 
          rectJ.y >= rectI.y && 
          rectJ.x + rectJ.length <= rectI.x + rectI.length && 
          rectJ.y + rectJ.width <= rectI.y + rectI.width
        ) {
          // Mark for removal by setting dimensions to 0
          sheet.freeRects[j].length = 0;
          sheet.freeRects[j].width = 0;
        }
      }
    }
    
    // Remove marked rectangles
    sheet.freeRects = sheet.freeRects.filter(rect => rect.length > 0 && rect.width > 0);
  }
  
  /**
   * Optimize nesting for multiple material types and thicknesses
   * 
   * @param cuttingList - List of parts to be cut
   * @param sheetSize - Size of the sheet to cut from
   * @param materialTypeFilter - Optional material type filter
   * @returns Array of nesting results
   */
  static optimizeNesting(
    cuttingList: CuttingListItem[],
    sheetSize?: { length: number; width: number },
    materialTypeFilter?: string
  ): NestingResult[] {
    // Default sheet size if not provided
    const defaultSheetSize = { length: 2440, width: 1220 };
    const size = sheetSize || defaultSheetSize;
    
    // Filter cutting list by material type if specified
    const filteredList = materialTypeFilter && materialTypeFilter !== 'all'
      ? cuttingList.filter(item => item.materialType === materialTypeFilter)
      : cuttingList;
    
    // Group items by material type and thickness
    const groupedItems = new Map<string, CuttingListItem[]>();
    
    filteredList.forEach(item => {
      const key = `${item.materialType}-${item.thickness}`;
      if (!groupedItems.has(key)) {
        groupedItems.set(key, []);
      }
      groupedItems.get(key)!.push(item);
    });
    
    // Generate nesting results for each group
    const results: NestingResult[] = [];
    
    groupedItems.forEach((items, key) => {
      const [materialType, thickness] = key.split('-');
      
      // Optimize layout for this group
      const nestingResult = this.optimizeLayout(items, size, materialType, parseInt(thickness));
      results.push(nestingResult);
    });
    
    return results;
  }
}