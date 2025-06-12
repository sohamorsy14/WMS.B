import { CabinetTemplate, CabinetConfiguration, CuttingListItem, CabinetMaterial, CabinetHardware, NestingResult, CabinetProject } from '../types/cabinet';
import { materialSheets, laborRates } from '../data/cabinetTemplates';

export class CabinetCalculatorService {
  
  // Calculate cutting list for a cabinet configuration
  static calculateCuttingList(template: CabinetTemplate, config: CabinetConfiguration): CuttingListItem[] {
    const { width, height, depth } = config.dimensions;
    const { side, topBottom, back, shelf, door } = template.materialThickness;
    const cuttingList: CuttingListItem[] = [];

    // Helper function to add cutting list item
    const addItem = (
      partName: string,
      materialType: string,
      thickness: number,
      length: number,
      width: number,
      quantity: number,
      edgeBanding: any = { length1: false, length2: false, width1: false, width2: false },
      grain: 'length' | 'width' = 'length',
      priority: number = 1
    ) => {
      cuttingList.push({
        id: `${config.id}-${partName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        partName,
        cabinetId: config.id,
        cabinetName: config.name,
        materialType,
        thickness,
        length,
        width,
        quantity,
        edgeBanding,
        grain,
        priority
      });
    };

    // Calculate main cabinet parts
    switch (template.type) {
      case 'base':
      case 'wall':
      case 'tall':
        // Sides (2 pieces)
        addItem(
          'Side Panel',
          'Plywood',
          side,
          height - topBottom,
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Top and Bottom (2 pieces)
        addItem(
          'Top/Bottom Panel',
          'Plywood',
          topBottom,
          width - (side * 2),
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Back panel
        addItem(
          'Back Panel',
          'Plywood',
          back,
          height - topBottom,
          width - (side * 2),
          1,
          { length1: false, length2: false, width1: false, width2: false },
          'length',
          2
        );

        // Shelves
        if (config.customizations.shelfCount > 0) {
          addItem(
            'Adjustable Shelf',
            'Plywood',
            shelf,
            width - (side * 2) - 6, // 3mm clearance each side
            depth - back - 50, // 50mm back clearance
            config.customizations.shelfCount,
            { length1: true, length2: true, width1: true, width2: false },
            'length',
            2
          );
        }

        // Doors
        if (config.customizations.doorCount > 0) {
          const doorWidth = config.customizations.doorCount === 1 
            ? width - 6 // Single door with 3mm gap each side
            : (width - 9) / 2; // Double doors with 3mm gaps
          
          addItem(
            'Door',
            'Melamine',
            door,
            height - 6, // 3mm gap top and bottom
            doorWidth,
            config.customizations.doorCount,
            { length1: true, length2: true, width1: true, width2: true },
            'length',
            3
          );
        }
        break;

      case 'drawer':
        // Sides (2 pieces)
        addItem(
          'Side Panel',
          'Plywood',
          side,
          height - topBottom,
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Top and Bottom (2 pieces)
        addItem(
          'Top/Bottom Panel',
          'Plywood',
          topBottom,
          width - (side * 2),
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Back panel
        addItem(
          'Back Panel',
          'Plywood',
          back,
          height - topBottom,
          width - (side * 2),
          1,
          { length1: false, length2: false, width1: false, width2: false },
          'length',
          2
        );

        // Drawer fronts
        const drawerCount = config.customizations.drawerCount;
        const drawerHeight = (height - 12) / drawerCount; // 3mm gap between drawers
        
        for (let i = 0; i < drawerCount; i++) {
          addItem(
            `Drawer Front ${i + 1}`,
            'Melamine',
            door,
            drawerHeight - 3, // 3mm gap
            width - 6, // 3mm gap each side
            1,
            { length1: true, length2: true, width1: true, width2: true },
            'length',
            3
          );
          
          // Drawer box parts (sides, back, bottom)
          addItem(
            `Drawer Side ${i + 1}`,
            'Plywood',
            15, // Thinner material for drawer box
            depth - 80, // Shorter than cabinet depth
            drawerHeight - 30, // Lower than front
            2,
            { length1: true, length2: false, width1: true, width2: true },
            'length',
            2
          );
          
          addItem(
            `Drawer Back ${i + 1}`,
            'Plywood',
            15,
            width - 90, // Narrower than cabinet width
            drawerHeight - 30,
            1,
            { length1: false, length2: false, width1: true, width2: true },
            'length',
            2
          );
          
          addItem(
            `Drawer Bottom ${i + 1}`,
            'Plywood',
            12, // Thinner material for bottom
            width - 90,
            depth - 80,
            1,
            { length1: false, length2: false, width1: false, width2: false },
            'length',
            2
          );
        }
        break;

      case 'corner':
        // Corner cabinet calculations would go here
        // This requires special geometry calculations
        addItem(
          'Side Panel A',
          'Plywood',
          side,
          height - topBottom,
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        addItem(
          'Side Panel B',
          'Plywood',
          side,
          height - topBottom,
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Top and Bottom (2 pieces)
        addItem(
          'Corner Top/Bottom',
          'Plywood',
          topBottom,
          width,
          depth,
          2,
          { length1: true, length2: true, width1: true, width2: true },
          'length',
          1
        );

        // Back panels
        addItem(
          'Back Panel',
          'Plywood',
          back,
          height - topBottom,
          width - side,
          2,
          { length1: false, length2: false, width1: false, width2: false },
          'length',
          2
        );

        // Shelves for lazy susan
        if (config.customizations.shelfCount > 0) {
          addItem(
            'Lazy Susan Shelf',
            'Plywood',
            shelf,
            width - 100, // Circular shelf
            width - 100, // Circular shelf
            config.customizations.shelfCount,
            { length1: true, length2: true, width1: true, width2: true },
            'length',
            2
          );
        }

        // Doors
        if (config.customizations.doorCount > 0) {
          addItem(
            'Corner Door',
            'Melamine',
            door,
            height - 6,
            width / 2 - 3,
            config.customizations.doorCount,
            { length1: true, length2: true, width1: true, width2: true },
            'length',
            3
          );
        }
        break;

      case 'specialty':
        // Specialty cabinet (like sink base)
        // Sides (2 pieces)
        addItem(
          'Side Panel',
          'Plywood',
          side,
          height - topBottom,
          depth - back,
          2,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Bottom (1 piece) - no top for sink
        addItem(
          'Bottom Panel',
          'Plywood',
          topBottom,
          width - (side * 2),
          depth - back,
          1,
          { length1: true, length2: true, width1: true, width2: false },
          'length',
          1
        );

        // Back panel
        addItem(
          'Back Panel',
          'Plywood',
          back,
          height - topBottom,
          width - (side * 2),
          1,
          { length1: false, length2: false, width1: false, width2: false },
          'length',
          2
        );

        // Support rails for sink
        addItem(
          'Support Rail',
          'Plywood',
          topBottom,
          width - (side * 2),
          100, // 100mm wide support
          2,
          { length1: true, length2: true, width1: false, width2: false },
          'length',
          1
        );

        // Doors
        if (config.customizations.doorCount > 0) {
          const doorWidth = config.customizations.doorCount === 1 
            ? width - 6 
            : (width - 9) / 2;
          
          addItem(
            'Door',
            'Melamine',
            door,
            height - 6,
            doorWidth,
            config.customizations.doorCount,
            { length1: true, length2: true, width1: true, width2: true },
            'length',
            3
          );
        }
        break;
    }

    return cuttingList;
  }

  // Calculate materials needed
  static calculateMaterials(cuttingList: CuttingListItem[]): CabinetMaterial[] {
    const materials: CabinetMaterial[] = [];
    const materialGroups = new Map<string, CuttingListItem[]>();

    // Group cutting list items by material type and thickness
    cuttingList.forEach(item => {
      const key = `${item.materialType}-${item.thickness}`;
      if (!materialGroups.has(key)) {
        materialGroups.set(key, []);
      }
      materialGroups.get(key)!.push(item);
    });

    // Calculate sheet requirements for each material group
    materialGroups.forEach((items, key) => {
      const [materialType, thickness] = key.split('-');
      const sheet = materialSheets.find(s => 
        s.type === materialType && s.thickness === parseInt(thickness)
      );

      if (sheet) {
        // Simple area calculation (in real implementation, use nesting algorithm)
        const totalArea = items.reduce((sum, item) => {
          return sum + (item.length * item.width * item.quantity) / 1000000; // Convert to m²
        }, 0);

        const sheetArea = (sheet.length * sheet.width) / 1000000; // Convert to m²
        const sheetsNeeded = Math.ceil(totalArea / sheetArea * 1.1); // 10% waste factor

        materials.push({
          id: `material-${key}-${Date.now()}`,
          materialId: sheet.id,
          materialName: sheet.name,
          type: materialType.toLowerCase() as any,
          thickness: parseInt(thickness),
          dimensions: {
            length: sheet.length,
            width: sheet.width
          },
          quantity: sheetsNeeded,
          unitCost: sheet.costPerSheet,
          totalCost: sheetsNeeded * sheet.costPerSheet,
          supplier: sheet.supplier
        });
      }
    });

    return materials;
  }

  // Calculate hardware requirements
  static calculateHardware(template: CabinetTemplate, config: CabinetConfiguration): CabinetHardware[] {
    const hardware: CabinetHardware[] = [];

    // Hinges
    if (template.hardware.hinges > 0 && config.customizations.doorCount > 0) {
      const hingeCount = Math.min(template.hardware.hinges, config.customizations.doorCount * 2);
      hardware.push({
        id: `hardware-hinges-${Date.now()}`,
        hardwareId: 'HNG-CONC-35',
        hardwareName: 'Concealed Hinges 35mm',
        type: 'hinge',
        quantity: hingeCount,
        unitCost: 3.25,
        totalCost: hingeCount * 3.25,
        supplier: 'Hardware Plus'
      });
    }

    // Drawer slides
    if (template.hardware.slides > 0 || config.customizations.drawerCount > 0) {
      const slideCount = Math.max(template.hardware.slides, config.customizations.drawerCount) * 2; // Pair of slides per drawer
      hardware.push({
        id: `hardware-slides-${Date.now()}`,
        hardwareId: 'SLD-18-FULL',
        hardwareName: 'Full Extension Slides 18"',
        type: 'slide',
        quantity: slideCount,
        unitCost: 12.50,
        totalCost: slideCount * 12.50,
        supplier: 'Slide Systems Inc.'
      });
    }

    // Handles
    const handleCount = config.customizations.doorCount + config.customizations.drawerCount;
    if (handleCount > 0) {
      hardware.push({
        id: `hardware-handles-${Date.now()}`,
        hardwareId: 'HDL-BAR-128',
        hardwareName: 'Bar Handle 128mm Chrome',
        type: 'handle',
        quantity: handleCount,
        unitCost: 5.85,
        totalCost: handleCount * 5.85,
        supplier: 'Handle World'
      });
    }

    // Shelf pins
    if (config.customizations.shelfCount > 0) {
      const pinCount = config.customizations.shelfCount * 4; // 4 pins per shelf
      hardware.push({
        id: `hardware-pins-${Date.now()}`,
        hardwareId: 'SHF-ADJ-5MM',
        hardwareName: 'Adjustable Shelf Pins 5mm',
        type: 'shelf_pin',
        quantity: pinCount,
        unitCost: 0.25,
        totalCost: pinCount * 0.25,
        supplier: 'Cabinet Accessories'
      });
    }

    // Add cam locks for RTA (ready to assemble) cabinets
    const camLockCount = 8; // Typical number for a standard cabinet
    hardware.push({
      id: `hardware-camlocks-${Date.now()}`,
      hardwareId: 'CAM-LOCK-15',
      hardwareName: 'Cam Lock 15mm',
      type: 'cam_lock',
      quantity: camLockCount,
      unitCost: 0.45,
      totalCost: camLockCount * 0.45,
      supplier: 'Cabinet Accessories'
    });

    return hardware;
  }

  // Calculate labor cost
  static calculateLaborCost(config: CabinetConfiguration): number {
    let totalLaborCost = 0;

    // Assembly time
    const assemblyRate = laborRates.find(r => r.id === 'assembly');
    if (assemblyRate) {
      totalLaborCost += assemblyRate.ratePerHour * assemblyRate.timePerUnit;
    }

    // Drilling and hardware installation
    const drillingRate = laborRates.find(r => r.id === 'drilling');
    if (drillingRate) {
      totalLaborCost += drillingRate.ratePerHour * drillingRate.timePerUnit;
    }

    // Finishing
    const finishingRate = laborRates.find(r => r.id === 'finishing');
    if (finishingRate) {
      totalLaborCost += finishingRate.ratePerHour * finishingRate.timePerUnit;
    }

    // Edge banding (estimate based on perimeter)
    const edgeBandingRate = laborRates.find(r => r.id === 'edgebanding');
    if (edgeBandingRate && config.cuttingList) {
      const totalEdgeBanding = config.cuttingList.reduce((sum, item) => {
        const perimeter = (item.length + item.width) * 2 / 1000; // Convert to meters
        const edgeCount = Object.values(item.edgeBanding).filter(Boolean).length;
        return sum + (perimeter * edgeCount * item.quantity);
      }, 0);
      
      totalLaborCost += edgeBandingRate.ratePerHour * edgeBandingRate.timePerUnit * totalEdgeBanding;
    }

    return Math.round(totalLaborCost * 100) / 100; // Round to 2 decimal places
  }

  // Calculate total cost for a cabinet configuration
  static calculateTotalCost(config: CabinetConfiguration): number {
    const materialCost = config.materials.reduce((sum, material) => sum + material.totalCost, 0);
    const hardwareCost = config.hardware.reduce((sum, hardware) => sum + hardware.totalCost, 0);
    const laborCost = config.laborCost;

    return materialCost + hardwareCost + laborCost;
  }

  // Simple nesting algorithm (placeholder for deepnest.js integration)
  static calculateNesting(cuttingList: CuttingListItem[]): NestingResult[] {
    const results: NestingResult[] = [];
    const materialGroups = new Map<string, CuttingListItem[]>();

    // Group by material type and thickness
    cuttingList.forEach(item => {
      const key = `${item.materialType}-${item.thickness}`;
      if (!materialGroups.has(key)) {
        materialGroups.set(key, []);
      }
      materialGroups.get(key)!.push(item);
    });

    // Simple bin packing for each material group
    materialGroups.forEach((items, key) => {
      const [materialType, thickness] = key.split('-');
      const sheet = materialSheets.find(s => 
        s.type === materialType && s.thickness === parseInt(thickness)
      );

      if (sheet) {
        // Simple area-based calculation (replace with actual nesting algorithm)
        const totalArea = items.reduce((sum, item) => {
          return sum + (item.length * item.width * item.quantity);
        }, 0);

        const sheetArea = sheet.length * sheet.width;
        const efficiency = Math.min(0.85, totalArea / sheetArea); // Max 85% efficiency
        const sheetsNeeded = Math.ceil(totalArea / (sheetArea * efficiency));

        results.push({
          id: `nesting-${key}-${Date.now()}`,
          sheetSize: {
            length: sheet.length,
            width: sheet.width
          },
          materialType,
          thickness: parseInt(thickness),
          parts: items.map((item, index) => ({
            id: `part-${index}-${Date.now()}`,
            partId: item.id,
            x: (index % 3) * 400, // Simple grid layout
            y: Math.floor(index / 3) * 300,
            rotation: 0,
            length: item.length,
            width: item.width
          })),
          efficiency: efficiency * 100,
          wasteArea: sheetArea * sheetsNeeded - totalArea,
          totalArea: sheetArea * sheetsNeeded,
          sheetCount: sheetsNeeded
        });
      }
    });

    return results;
  }

  // Generate complete cabinet configuration
  static generateConfiguration(
    template: CabinetTemplate,
    customDimensions: { width: number; height: number; depth: number },
    customizations: any
  ): CabinetConfiguration {
    const config: CabinetConfiguration = {
      id: `config-${Date.now()}`,
      templateId: template.id,
      name: `${template.name} - ${customDimensions.width}x${customDimensions.height}x${customDimensions.depth}`,
      dimensions: customDimensions,
      customizations: {
        doorCount: customizations.doorCount || (template.type === 'drawer' ? 0 : template.name.includes('Double') ? 2 : 1),
        drawerCount: customizations.drawerCount || (template.type === 'drawer' ? 3 : 0),
        shelfCount: customizations.shelfCount || template.hardware.shelves,
        doorStyle: customizations.doorStyle || 'Shaker',
        finish: customizations.finish || 'White',
        hardware: customizations.hardware || 'Chrome'
      },
      materials: [],
      hardware: [],
      cuttingList: [],
      totalCost: 0,
      laborCost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate cutting list
    config.cuttingList = this.calculateCuttingList(template, config);

    // Calculate materials
    config.materials = this.calculateMaterials(config.cuttingList);

    // Calculate hardware
    config.hardware = this.calculateHardware(template, config);

    // Calculate labor cost
    config.laborCost = this.calculateLaborCost(config);

    // Calculate total cost
    config.totalCost = this.calculateTotalCost(config);

    return config;
  }

  // Create a new project with multiple cabinet configurations
  static createProject(
    name: string,
    description: string,
    customerName: string,
    customerContact: string,
    configurations: CabinetConfiguration[],
    notes?: string
  ): CabinetProject {
    // Calculate costs
    const totalMaterialCost = configurations.reduce((sum, config) => {
      return sum + config.materials.reduce((materialSum, material) => materialSum + material.totalCost, 0);
    }, 0);

    const totalHardwareCost = configurations.reduce((sum, config) => {
      return sum + config.hardware.reduce((hardwareSum, hardware) => hardwareSum + hardware.totalCost, 0);
    }, 0);

    const totalLaborCost = configurations.reduce((sum, config) => sum + config.laborCost, 0);
    
    const subtotal = totalMaterialCost + totalHardwareCost + totalLaborCost;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Estimate production days (1 day per 3 cabinets, minimum 1 day)
    const estimatedDays = Math.max(1, Math.ceil(configurations.length / 3));

    return {
      id: `project-${Date.now()}`,
      name,
      description,
      customerName,
      customerContact,
      configurations,
      totalMaterialCost,
      totalLaborCost,
      totalHardwareCost,
      subtotal,
      tax,
      total,
      estimatedDays,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes
    };
  }

  // Generate BOM from cabinet configuration
  static generateBOM(config: CabinetConfiguration) {
    // Combine materials and hardware into a single BOM
    const bomItems = [
      ...config.materials.map(material => ({
        id: material.id,
        itemId: material.materialId,
        itemName: material.materialName,
        quantity: material.quantity,
        unitCost: material.unitCost,
        totalCost: material.totalCost,
        unitMeasurement: 'Sheets',
        isOptional: false
      })),
      ...config.hardware.map(hardware => ({
        id: hardware.id,
        itemId: hardware.hardwareId,
        itemName: hardware.hardwareName,
        quantity: hardware.quantity,
        unitCost: hardware.unitCost,
        totalCost: hardware.totalCost,
        unitMeasurement: 'Pieces',
        isOptional: false
      }))
    ];

    return {
      id: `bom-${config.id}`,
      bomNumber: `BOM-${Date.now().toString().slice(-6)}`,
      name: `BOM for ${config.name}`,
      version: '1.0',
      linkedType: 'cabinet',
      linkedId: config.id,
      linkedNumber: config.id,
      status: 'draft',
      description: `Bill of Materials for ${config.name}`,
      category: 'Cabinet',
      items: bomItems,
      totalCost: config.totalCost,
      estimatedTime: config.laborCost / 45, // Assuming $45/hour labor rate
      createdBy: 'Cabinet Calculator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Generate cutting list in CSV format
  static generateCuttingListCSV(config: CabinetConfiguration): string {
    let csv = 'Part Name,Material,Thickness,Length,Width,Quantity,Edge Banding,Grain,Cabinet\n';
    
    config.cuttingList.forEach(item => {
      const edgeBanding = Object.entries(item.edgeBanding)
        .filter(([_, value]) => value)
        .map(([edge]) => edge)
        .join('+');
      
      csv += `"${item.partName}","${item.materialType}",${item.thickness},${item.length},${item.width},${item.quantity},"${edgeBanding}","${item.grain}","${config.name}"\n`;
    });
    
    return csv;
  }

  // Generate DXF file content (simplified for demonstration)
  static generateDXF(config: CabinetConfiguration): string {
    // This is a simplified DXF format - in a real implementation, this would be more complex
    let dxf = '0\nSECTION\n2\nENTITIES\n';
    
    config.cuttingList.forEach(item => {
      // For each part, create a rectangle
      dxf += `0\nPOLYLINE\n8\n${item.materialType}\n66\n1\n70\n1\n`;
      dxf += `0\nVERTEX\n8\n${item.materialType}\n10\n0\n20\n0\n`;
      dxf += `0\nVERTEX\n8\n${item.materialType}\n10\n${item.length}\n20\n0\n`;
      dxf += `0\nVERTEX\n8\n${item.materialType}\n10\n${item.length}\n20\n${item.width}\n`;
      dxf += `0\nVERTEX\n8\n${item.materialType}\n10\n0\n20\n${item.width}\n`;
      dxf += `0\nVERTEX\n8\n${item.materialType}\n10\n0\n20\n0\n`;
      dxf += '0\nSEQEND\n';
    });
    
    dxf += '0\nENDSEC\n0\nEOF\n';
    
    return dxf;
  }

  // Integrate with deepnest.js (placeholder)
  static async optimizeNesting(cuttingList: CuttingListItem[]): Promise<NestingResult[]> {
    try {
      // In a real implementation, this would call the deepnest.js library
      // For now, we'll use our simple nesting algorithm
      return this.calculateNesting(cuttingList);
    } catch (error) {
      console.error('Nesting optimization error:', error);
      return this.calculateNesting(cuttingList); // Fallback to simple algorithm
    }
  }
}

// Local storage service for cabinet projects and configurations
export class CabinetStorageService {
  private static CONFIGS_KEY = 'cabinetConfigurations';
  private static PROJECTS_KEY = 'cabinetProjects';
  private static TEMPLATES_KEY = 'customCabinetTemplates';

  // Save configuration to local storage
  static saveConfiguration(config: CabinetConfiguration): void {
    const configs = this.getConfigurations();
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    localStorage.setItem(this.CONFIGS_KEY, JSON.stringify(configs));
  }

  // Get all saved configurations
  static getConfigurations(): CabinetConfiguration[] {
    const configs = localStorage.getItem(this.CONFIGS_KEY);
    return configs ? JSON.parse(configs) : [];
  }

  // Delete configuration
  static deleteConfiguration(configId: string): void {
    const configs = this.getConfigurations();
    const updatedConfigs = configs.filter(c => c.id !== configId);
    localStorage.setItem(this.CONFIGS_KEY, JSON.stringify(updatedConfigs));
    
    // Also remove from any projects
    const projects = this.getProjects();
    const updatedProjects = projects.map(project => {
      return {
        ...project,
        configurations: project.configurations.filter(c => c.id !== configId)
      };
    });
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(updatedProjects));
  }

  // Save project to local storage
  static saveProject(project: CabinetProject): void {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
  }

  // Get all saved projects
  static getProjects(): CabinetProject[] {
    const projects = localStorage.getItem(this.PROJECTS_KEY);
    return projects ? JSON.parse(projects) : [];
  }

  // Delete project
  static deleteProject(projectId: string): void {
    const projects = this.getProjects();
    const updatedProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(updatedProjects));
  }

  // Get project by ID
  static getProjectById(projectId: string): CabinetProject | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  // Save custom template to local storage
  static saveTemplate(template: CabinetTemplate): void {
    const templates = this.getCustomTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
  }

  // Get all custom templates
  static getCustomTemplates(): CabinetTemplate[] {
    const templates = localStorage.getItem(this.TEMPLATES_KEY);
    return templates ? JSON.parse(templates) : [];
  }

  // Delete custom template
  static deleteTemplate(templateId: string): void {
    const templates = this.getCustomTemplates();
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updatedTemplates));
  }

  // Get template by ID (checks both custom and default templates)
  static getTemplateById(templateId: string): CabinetTemplate | null {
    const customTemplates = this.getCustomTemplates();
    return customTemplates.find(t => t.id === templateId) || null;
  }
}