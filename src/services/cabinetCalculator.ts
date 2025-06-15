import { CabinetTemplate, CabinetConfiguration, CabinetProject, NestingResult, CuttingListItem, CabinetMaterial, CabinetHardware, PartDefinition } from '../types/cabinet';
import { cabinetTemplates, materialSheets, laborRates } from '../data/cabinetTemplates';

// Cabinet Calculator Service
export class CabinetCalculatorService {
  // Generate a configuration from a template and customizations
  static generateConfiguration(
    template: CabinetTemplate,
    dimensions: { width: number; height: number; depth: number },
    customizations: any
  ): CabinetConfiguration {
    // Generate a unique ID for the configuration
    const configId = `config-${Date.now()}`;
    
    // Calculate cutting list based on dimensions and customizations
    const cuttingList = this.calculateCuttingList(template, dimensions, customizations);
    
    // Calculate materials needed
    const materials = this.calculateMaterials(cuttingList);
    
    // Calculate hardware needed
    const hardware = this.calculateHardware(template, customizations);
    
    // Calculate labor cost
    const laborCost = this.calculateLaborCost(cuttingList, hardware);
    
    // Calculate total cost
    const materialCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
    const hardwareCost = hardware.reduce((sum, h) => sum + h.totalCost, 0);
    const totalCost = materialCost + hardwareCost + laborCost;
    
    // Create configuration object
    const configuration: CabinetConfiguration = {
      id: configId,
      templateId: template.id,
      name: `${template.name} - ${dimensions.width}×${dimensions.height}×${dimensions.depth}mm`,
      dimensions,
      customizations,
      materials,
      hardware,
      cuttingList,
      totalCost,
      laborCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return configuration;
  }
  
  // Calculate cutting list based on template, dimensions, and customizations
  static calculateCuttingList(
    template: CabinetTemplate,
    dimensions: { width: number; height: number; depth: number },
    customizations: any
  ): CuttingListItem[] {
    // If the template has defined parts, use those for calculation
    if (template.parts && template.parts.length > 0) {
      return this.calculateCuttingListFromParts(template, dimensions, customizations);
    }
    
    // Otherwise, use the default calculation logic
    const cuttingList: CuttingListItem[] = [];
    const { width, height, depth } = dimensions;
    const { doorCount, drawerCount, shelfCount } = customizations;
    
    // Material thicknesses
    const { side, topBottom, back, shelf, door, drawer, drawerBottom } = template.materialThickness;
    
    // Construction options
    const { hasTop, hasBottom, hasBack, hasDoubleBack } = template.construction || {};
    
    // Side panels (always 2)
    cuttingList.push({
      id: `part-${Date.now()}-1`,
      partName: 'Side Panel',
      cabinetId: '',
      cabinetName: '',
      materialType: 'Material 1',
      thickness: side,
      length: depth - (hasBack ? back : 0),
      width: height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0),
      quantity: 2,
      edgeBanding: { front: true, back: false, left: true, right: true },
      grain: 'length',
      priority: 1
    });
    
    // Top panel (if applicable)
    if (hasTop !== false) {
      cuttingList.push({
        id: `part-${Date.now()}-2`,
        partName: 'Top Panel',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: topBottom,
        length: width - (2 * side),
        width: depth - (hasBack ? back : 0),
        quantity: 1,
        edgeBanding: { front: true, back: false, left: true, right: true },
        grain: 'length',
        priority: 1
      });
    }
    
    // Bottom panel (if applicable)
    if (hasBottom !== false) {
      cuttingList.push({
        id: `part-${Date.now()}-3`,
        partName: 'Bottom Panel',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: topBottom,
        length: width - (2 * side),
        width: depth - (hasBack ? back : 0),
        quantity: 1,
        edgeBanding: { front: true, back: false, left: true, right: true },
        grain: 'length',
        priority: 1
      });
    }
    
    // Back panel (if applicable)
    if (hasBack !== false) {
      cuttingList.push({
        id: `part-${Date.now()}-4`,
        partName: 'Back Panel',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: back,
        length: width - (2 * side),
        width: height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0),
        quantity: 1,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain: 'none',
        priority: 2
      });
    }
    
    // Double back panel (if applicable)
    if (hasDoubleBack === true) {
      cuttingList.push({
        id: `part-${Date.now()}-5`,
        partName: 'Double Back Panel',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: template.materialThickness.doubleBack || back,
        length: width - (2 * side),
        width: height - (hasTop ? topBottom : 0) - (hasBottom ? topBottom : 0),
        quantity: 1,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain: 'none',
        priority: 2
      });
    }
    
    // Shelves (if applicable)
    if (shelfCount > 0) {
      cuttingList.push({
        id: `part-${Date.now()}-6`,
        partName: 'Shelf',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: shelf,
        length: width - (2 * side) - 6, // 3mm gap on each side
        width: depth - (hasBack ? back : 0) - 50, // 50mm setback from front
        quantity: shelfCount,
        edgeBanding: { front: true, back: false, left: false, right: false },
        grain: 'length',
        priority: 2
      });
    }
    
    // Doors (if applicable)
    if (doorCount > 0 && template.type !== 'drawer') {
      const doorWidth = template.type === 'corner' 
        ? width / 2 - 3 
        : width / doorCount - 6; // 3mm gap on each side
      
      cuttingList.push({
        id: `part-${Date.now()}-7`,
        partName: 'Door',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: door,
        length: doorWidth,
        width: height - 6, // 3mm gap on top and bottom
        quantity: doorCount,
        edgeBanding: { front: true, back: true, left: true, right: true },
        grain: 'length',
        priority: 3
      });
    }
    
    // Drawer fronts and boxes (if applicable)
    if (drawerCount > 0 || template.type === 'drawer') {
      const count = drawerCount > 0 ? drawerCount : 3; // Default to 3 drawers if not specified
      const drawerHeight = (height - 12) / count - 3; // 3mm gap between drawers, 6mm gap top and bottom
      
      // Drawer fronts
      cuttingList.push({
        id: `part-${Date.now()}-8`,
        partName: 'Drawer Front',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: door,
        length: width - 6, // 3mm gap on each side
        width: drawerHeight,
        quantity: count,
        edgeBanding: { front: true, back: true, left: true, right: true },
        grain: 'length',
        priority: 3
      });
      
      // Drawer sides
      const drawerSideDepth = 500; // Standard drawer depth
      const drawerSideHeight = 160; // Standard drawer height
      
      cuttingList.push({
        id: `part-${Date.now()}-9`,
        partName: 'Drawer Side',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: drawer || 15,
        length: drawerSideDepth,
        width: drawerSideHeight,
        quantity: count * 2, // 2 sides per drawer
        edgeBanding: { front: true, back: false, left: false, right: true },
        grain: 'length',
        priority: 3
      });
      
      // Drawer back
      const drawerRunnerThickness = template.materialThickness.drawerRunner || 12;
      const drawerBackWidth = width - (side + drawerRunnerThickness + (drawer || 15)) * 2;
      
      cuttingList.push({
        id: `part-${Date.now()}-10`,
        partName: 'Drawer Back',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: drawer || 15,
        length: drawerBackWidth,
        width: drawerSideHeight - 10, // 10mm less than sides
        quantity: count,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain: 'width',
        priority: 3
      });
      
      // Drawer bottom
      const drawerBottomLength = drawerBackWidth + 10; // 5mm extra on each side
      const drawerBottomWidth = drawerSideDepth - 10; // 10mm less than sides
      
      cuttingList.push({
        id: `part-${Date.now()}-11`,
        partName: 'Drawer Bottom',
        cabinetId: '',
        cabinetName: '',
        materialType: 'Material 1',
        thickness: drawerBottom || 12,
        length: drawerBottomLength,
        width: drawerBottomWidth,
        quantity: count,
        edgeBanding: { front: false, back: false, left: false, right: false },
        grain: 'none',
        priority: 3
      });
    }
    
    return cuttingList;
  }
  
  // Calculate cutting list from template parts
  static calculateCuttingListFromParts(
    template: CabinetTemplate,
    dimensions: { width: number; height: number; depth: number },
    customizations: any
  ): CuttingListItem[] {
    const cuttingList: CuttingListItem[] = [];
    const { width, height, depth } = dimensions;
    
    // Material thicknesses from template
    const materialThickness = template.materialThickness;
    
    // Construction options
    const construction = template.construction || {};
    
    // Process each part definition
    template.parts?.forEach(part => {
      try {
        // Calculate dimensions using formulas
        const partLength = this.evaluateFormula(part.widthFormula, {
          width, height, depth, 
          ...materialThickness,
          ...construction,
          doorCount: customizations.doorCount,
          drawerCount: customizations.drawerCount
        });
        
        const partWidth = this.evaluateFormula(part.heightFormula, {
          width, height, depth, 
          ...materialThickness,
          ...construction,
          doorCount: customizations.doorCount,
          drawerCount: customizations.drawerCount
        });
        
        // Add to cutting list
        cuttingList.push({
          id: `part-${Date.now()}-${part.id}`,
          partName: part.name,
          cabinetId: '',
          cabinetName: '',
          materialType: part.materialType,
          thickness: part.thickness,
          length: partLength,
          width: partWidth,
          quantity: part.quantity,
          edgeBanding: { ...part.edgeBanding },
          grain: part.grain,
          priority: part.name.includes('Side') || part.name.includes('Top') || part.name.includes('Bottom') ? 1 : 
                   part.name.includes('Back') || part.name.includes('Shelf') ? 2 : 3
        });
      } catch (error) {
        console.error(`Error calculating part ${part.name}:`, error);
      }
    });
    
    return cuttingList;
  }
  
  // Evaluate a formula with given variables
  static evaluateFormula(formula: string, variables: any): number {
    try {
      // Create a safe evaluation context with the provided variables
      const { 
        width, height, depth, 
        side, topBottom, Top, Bottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack, DrawerRunner,
        hasTop, hasBottom, hasBack, hasDoubleBack, hasToe, hasFixedShelf, isCorner, hasFrontPanel, hasFillerPanel, hasUprights,
        doorCount, drawerCount
      } = variables;
      
      // Use Function constructor to create a safe evaluation function
      const evalFunc = new Function(
        'width', 'height', 'depth', 
        'side', 'topBottom', 'Top', 'Bottom', 'back', 'shelf', 'door', 'drawer', 'fixedPanel', 'drawerBottom', 'uprights', 'doubleBack', 'DrawerRunner',
        'hasTop', 'hasBottom', 'hasBack', 'hasDoubleBack', 'hasToe', 'hasFixedShelf', 'isCorner', 'hasFrontPanel', 'hasFillerPanel', 'hasUprights',
        'doorCount', 'drawerCount',
        `return ${formula};`
      );
      
      return evalFunc(
        width, height, depth, 
        side, topBottom, Top, Bottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack, DrawerRunner,
        hasTop, hasBottom, hasBack, hasDoubleBack, hasToe, hasFixedShelf, isCorner, hasFrontPanel, hasFillerPanel, hasUprights,
        doorCount, drawerCount
      );
    } catch (error) {
      console.error('Error evaluating formula:', error);
      throw error;
    }
  }
  
  // Calculate materials needed based on cutting list
  static calculateMaterials(cuttingList: CuttingListItem[]): CabinetMaterial[] {
    const materials: CabinetMaterial[] = [];
    const materialMap = new Map<string, { totalArea: number, items: CuttingListItem[] }>();
    
    // Group items by material type and thickness
    cuttingList.forEach(item => {
      const key = `${item.materialType}-${item.thickness}`;
      if (!materialMap.has(key)) {
        materialMap.set(key, { totalArea: 0, items: [] });
      }
      
      const entry = materialMap.get(key)!;
      const itemArea = (item.length * item.width * item.quantity) / 1000000; // Convert to m²
      entry.totalArea += itemArea;
      entry.items.push(item);
    });
    
    // Find appropriate material sheets and calculate quantities
    materialMap.forEach((value, key) => {
      const [materialType, thicknessStr] = key.split('-');
      const thickness = parseInt(thicknessStr);
      
      // Find matching material sheet
      const sheet = materialSheets.find(s => 
        s.type === materialType && s.thickness === thickness
      ) || materialSheets[0]; // Use first sheet as fallback
      
      // Calculate number of sheets needed (with 15% waste factor)
      const sheetArea = (sheet.length * sheet.width) / 1000000; // Convert to m²
      const sheetsNeeded = Math.ceil(value.totalArea / sheetArea * 1.15);
      
      // Add to materials list
      materials.push({
        id: `material-${Date.now()}-${materials.length}`,
        materialId: sheet.id,
        materialName: sheet.name,
        type: 'panel',
        thickness: sheet.thickness,
        dimensions: {
          length: sheet.length,
          width: sheet.width
        },
        quantity: sheetsNeeded,
        unitCost: sheet.costPerSheet,
        totalCost: sheetsNeeded * sheet.costPerSheet,
        supplier: sheet.supplier
      });
    });
    
    return materials;
  }
  
  // Calculate hardware needed based on template and customizations
  static calculateHardware(template: CabinetTemplate, customizations: any): CabinetHardware[] {
    const hardware: CabinetHardware[] = [];
    const { doorCount, drawerCount, shelfCount } = customizations;
    
    // Add hardware from template hardware items if available
    if (template.hardwareItems && template.hardwareItems.length > 0) {
      template.hardwareItems.forEach(item => {
        hardware.push({
          id: `hardware-${Date.now()}-${hardware.length}`,
          hardwareId: item.id,
          hardwareName: item.name,
          type: item.type as any,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
          supplier: item.supplier
        });
      });
      return hardware;
    }
    
    // Otherwise, use default hardware calculation
    
    // Hinges (2 per door)
    if (doorCount > 0) {
      hardware.push({
        id: `hardware-${Date.now()}-1`,
        hardwareId: 'HNG-CONC-35',
        hardwareName: 'Concealed Hinges 35mm',
        type: 'hinge',
        quantity: doorCount * 2,
        unitCost: 3.25,
        totalCost: doorCount * 2 * 3.25,
        supplier: 'Hardware Plus'
      });
    }
    
    // Drawer slides (1 pair per drawer)
    if (drawerCount > 0 || template.type === 'drawer') {
      const count = drawerCount > 0 ? drawerCount : 3; // Default to 3 drawers
      hardware.push({
        id: `hardware-${Date.now()}-2`,
        hardwareId: 'SLD-18-FULL',
        hardwareName: 'Full Extension Slides 18"',
        type: 'slide',
        quantity: count,
        unitCost: 12.50,
        totalCost: count * 12.50,
        supplier: 'Hardware Plus'
      });
    }
    
    // Handles (1 per door/drawer)
    const handleCount = doorCount + (drawerCount > 0 ? drawerCount : template.type === 'drawer' ? 3 : 0);
    if (handleCount > 0) {
      hardware.push({
        id: `hardware-${Date.now()}-3`,
        hardwareId: 'HDL-BAR-128',
        hardwareName: 'Bar Handle 128mm Chrome',
        type: 'handle',
        quantity: handleCount,
        unitCost: 5.85,
        totalCost: handleCount * 5.85,
        supplier: 'Hardware Plus'
      });
    }
    
    // Shelf pins (4 per shelf)
    if (shelfCount > 0) {
      hardware.push({
        id: `hardware-${Date.now()}-4`,
        hardwareId: 'PIN-SHELF-5',
        hardwareName: 'Shelf Support Pins 5mm',
        type: 'shelf_pin',
        quantity: shelfCount * 4,
        unitCost: 0.25,
        totalCost: shelfCount * 4 * 0.25,
        supplier: 'Hardware Plus'
      });
    }
    
    return hardware;
  }
  
  // Calculate labor cost based on cutting list and hardware
  static calculateLaborCost(cuttingList: CuttingListItem[], hardware: CabinetHardware[]): number {
    let totalLaborHours = 0;
    
    // Cutting labor (per part)
    const totalCuts = cuttingList.reduce((sum, item) => sum + item.quantity, 0);
    totalLaborHours += totalCuts * 0.1; // 6 minutes per cut
    
    // Edge banding labor (per edge)
    let totalEdges = 0;
    cuttingList.forEach(item => {
      const edgeCount = Object.values(item.edgeBanding).filter(Boolean).length;
      totalEdges += edgeCount * item.quantity;
    });
    totalLaborHours += totalEdges * 0.05; // 3 minutes per edge
    
    // Hardware installation labor
    totalLaborHours += hardware.reduce((sum, item) => {
      if (item.type === 'hinge' || item.type === 'handle') {
        return sum + item.quantity * 0.1; // 6 minutes per hinge/handle
      } else if (item.type === 'slide') {
        return sum + item.quantity * 0.25; // 15 minutes per drawer slide pair
      }
      return sum + item.quantity * 0.05; // 3 minutes for other hardware
    }, 0);
    
    // Assembly labor (fixed time per cabinet)
    totalLaborHours += 1.5; // 1.5 hours for assembly
    
    // Finishing labor (fixed time per cabinet)
    totalLaborHours += 0.5; // 30 minutes for finishing
    
    // Calculate cost at $45/hour
    return totalLaborHours * 45;
  }
  
  // Generate CSV for cutting list
  static generateCuttingListCSV(config: CabinetConfiguration): string {
    let csv = 'Part Name,Material,Thickness,Length,Width,Quantity,Edge Banding,Grain Direction\n';
    
    config.cuttingList.forEach(item => {
      const edgeBanding = Object.entries(item.edgeBanding)
        .filter(([_, value]) => value)
        .map(([edge]) => edge)
        .join('+') || 'None';
      
      csv += `"${item.partName}","${item.materialType}",${item.thickness},${item.length},${item.width},${item.quantity},"${edgeBanding}","${item.grain}"\n`;
    });
    
    return csv;
  }
  
  // Generate BOM (Bill of Materials)
  static generateBOM(config: CabinetConfiguration): any {
    return {
      name: `BOM - ${config.name}`,
      materials: config.materials,
      hardware: config.hardware,
      totalCost: config.totalCost
    };
  }
  
  // Create a project from configurations
  static createProject(
    name: string,
    description: string,
    customerName: string,
    customerContact: string,
    configurations: CabinetConfiguration[],
    notes?: string
  ): CabinetProject {
    // Calculate costs
    const totalMaterialCost = configurations.reduce(
      (sum, config) => sum + config.materials.reduce((s, m) => s + m.totalCost, 0),
      0
    );
    
    const totalHardwareCost = configurations.reduce(
      (sum, config) => sum + config.hardware.reduce((s, h) => s + h.totalCost, 0),
      0
    );
    
    const totalLaborCost = configurations.reduce(
      (sum, config) => sum + config.laborCost,
      0
    );
    
    const subtotal = totalMaterialCost + totalHardwareCost + totalLaborCost;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    // Estimate days based on cabinet count (1 day per 3 cabinets, minimum 1 day)
    const estimatedDays = Math.max(1, Math.ceil(configurations.length / 3));
    
    // Create project
    const project: CabinetProject = {
      id: `project-${Date.now()}`,
      name,
      description,
      customerName,
      customerContact,
      configurations,
      totalMaterialCost,
      totalHardwareCost,
      totalLaborCost,
      subtotal,
      tax,
      total,
      estimatedDays,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes
    };
    
    return project;
  }
  
  // Copy a template with a new name
  static copyTemplate(template: CabinetTemplate, newName: string): CabinetTemplate {
    return {
      ...template,
      id: `template-${Date.now()}`,
      name: newName,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
  }
  
  // Optimize nesting of cutting list items
  static async optimizeNesting(
    cuttingList: CuttingListItem[],
    sheetSize?: { length: number; width: number },
    materialType?: string
  ): Promise<NestingResult[]> {
    // Default sheet size if not provided
    const defaultSheetSize = { length: 2440, width: 1220 };
    const size = sheetSize || defaultSheetSize;
    
    // Filter cutting list by material type if specified
    const filteredList = materialType && materialType !== 'all'
      ? cuttingList.filter(item => item.materialType === materialType)
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
      
      // Improved nesting algorithm
      const nestingResult = this.performNesting(items, size, materialType, parseInt(thickness));
      results.push(nestingResult);
    });
    
    return results;
  }
  
  // Perform nesting algorithm for a group of items
  private static performNesting(
    items: CuttingListItem[],
    sheetSize: { length: number; width: number },
    materialType: string,
    thickness: number
  ): NestingResult {
    // Sort items by grain direction and size
    const sortedItems = [...items].sort((a, b) => {
      // First sort by grain direction (length grain first)
      if (a.grain === 'length' && b.grain !== 'length') return -1;
      if (a.grain !== 'length' && b.grain === 'length') return 1;
      
      // Then sort by size (larger first)
      return (b.length * b.width) - (a.length * a.width);
    });
    
    const parts: any[] = [];
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let usedArea = 0;
    let sheetCount = 1;
    
    // Process each item
    sortedItems.forEach(item => {
      // For each quantity of the item
      for (let q = 0; q < item.quantity; q++) {
        // Determine orientation based on grain direction
        let rotated = false;
        let partLength = item.length;
        let partWidth = item.width;
        
        // Check if part needs to be rotated based on grain direction
        if (item.grain === 'length') {
          // For length grain, the part's length should align with sheet length (2440mm)
          // Only rotate if it makes sense and respects grain direction
          if (item.width > item.length && item.width <= sheetSize.length && item.length <= sheetSize.width) {
            rotated = true;
            partLength = item.width;
            partWidth = item.length;
          }
        } else if (item.grain === 'width') {
          // For width grain, the part's width should align with sheet length (2440mm)
          // Only rotate if it makes sense and respects grain direction
          if (item.length > item.width && item.length <= sheetSize.width && item.width <= sheetSize.length) {
            rotated = true;
            partLength = item.width;
            partWidth = item.length;
          }
        } else {
          // For no grain, rotate for best fit
          if (item.width > item.length && 
              (x + item.width <= sheetSize.length && y + item.length <= sheetSize.width)) {
            rotated = true;
            partLength = item.width;
            partWidth = item.length;
          }
        }
        
        // Check if we need to move to a new row
        if (x + partLength > sheetSize.length) {
          x = 0;
          y += rowHeight;
          rowHeight = 0;
        }
        
        // Check if we need to move to a new sheet
        if (y + partWidth > sheetSize.width) {
          // Start a new sheet
          sheetCount++;
          x = 0;
          y = 0;
          rowHeight = 0;
          console.log(`Starting new sheet for part ${item.partName}`);
        }
        
        // Ensure part fits within sheet boundaries
        if (x + partLength <= sheetSize.length && y + partWidth <= sheetSize.width) {
          // Add the part to the nesting result
          parts.push({
            id: `nested-${Date.now()}-${parts.length}`,
            partId: item.id,
            x,
            y,
            rotation: rotated ? 90 : 0,
            length: partLength,
            width: partWidth,
            grain: item.grain
          });
          
          // Update position and used area
          x += partLength;
          rowHeight = Math.max(rowHeight, partWidth);
          usedArea += partLength * partWidth;
        } else {
          console.warn(`Part ${item.partName} (${partLength}x${partWidth}) doesn't fit on sheet, skipping`);
        }
      }
    });
    
    // Calculate efficiency
    const totalArea = sheetSize.length * sheetSize.width * sheetCount;
    const efficiency = (usedArea / totalArea) * 100;
    
    // Create nesting result
    return {
      id: `nesting-${Date.now()}`,
      sheetSize,
      materialType,
      thickness,
      parts,
      efficiency,
      wasteArea: totalArea - usedArea,
      totalArea,
      sheetCount
    };
  }
}

// Cabinet Storage Service for saving/loading configurations and templates
export class CabinetStorageService {
  // Save a cabinet configuration
  static async saveConfiguration(config: CabinetConfiguration): Promise<void> {
    try {
      // Get existing configurations
      const configs = await this.getConfigurations();
      
      // Check if configuration already exists
      const index = configs.findIndex(c => c.id === config.id);
      
      if (index !== -1) {
        // Update existing configuration
        configs[index] = {
          ...config,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new configuration
        configs.push(config);
      }
      
      // Save to localStorage
      localStorage.setItem('cabinetConfigurations', JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }
  
  // Get all saved configurations
  static async getConfigurations(): Promise<CabinetConfiguration[]> {
    try {
      const configsJson = localStorage.getItem('cabinetConfigurations');
      return configsJson ? JSON.parse(configsJson) : [];
    } catch (error) {
      console.error('Error getting configurations:', error);
      return [];
    }
  }
  
  // Delete a configuration
  static async deleteConfiguration(configId: string): Promise<void> {
    try {
      // Get existing configurations
      const configs = await this.getConfigurations();
      
      // Filter out the configuration to delete
      const updatedConfigs = configs.filter(c => c.id !== configId);
      
      // Save to localStorage
      localStorage.setItem('cabinetConfigurations', JSON.stringify(updatedConfigs));
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error;
    }
  }
  
  // Save a cabinet template
  static async saveTemplate(template: CabinetTemplate): Promise<void> {
    try {
      // Get existing templates
      const templates = await this.getCustomTemplates();
      
      // Check if template already exists
      const index = templates.findIndex(t => t.id === template.id);
      
      if (index !== -1) {
        // Update existing template
        templates[index] = {
          ...template,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new template
        templates.push({
          ...template,
          isCustom: true
        });
      }
      
      // Save to localStorage
      localStorage.setItem('cabinetTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }
  
  // Get all custom templates
  static async getCustomTemplates(): Promise<CabinetTemplate[]> {
    try {
      const templatesJson = localStorage.getItem('cabinetTemplates');
      return templatesJson ? JSON.parse(templatesJson) : [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }
  
  // Delete a template
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      // Get existing templates
      const templates = await this.getCustomTemplates();
      
      // Filter out the template to delete
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      
      // Save to localStorage
      localStorage.setItem('cabinetTemplates', JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
  
  // Save a cabinet project
  static async saveProject(project: CabinetProject): Promise<void> {
    try {
      // Get existing projects
      const projects = await this.getProjects();
      
      // Check if project already exists
      const index = projects.findIndex(p => p.id === project.id);
      
      if (index !== -1) {
        // Update existing project
        projects[index] = {
          ...project,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new project
        projects.push(project);
      }
      
      // Save to localStorage
      localStorage.setItem('cabinetProjects', JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }
  
  // Get all saved projects
  static async getProjects(): Promise<CabinetProject[]> {
    try {
      const projectsJson = localStorage.getItem('cabinetProjects');
      return projectsJson ? JSON.parse(projectsJson) : [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }
  
  // Delete a project
  static async deleteProject(projectId: string): Promise<void> {
    try {
      // Get existing projects
      const projects = await this.getProjects();
      
      // Filter out the project to delete
      const updatedProjects = projects.filter(p => p.id !== projectId);
      
      // Save to localStorage
      localStorage.setItem('cabinetProjects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
}