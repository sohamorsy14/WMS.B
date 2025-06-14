import { CabinetTemplate, CabinetConfiguration, CuttingListItem, CabinetMaterial, CabinetHardware, NestingResult, CabinetProject, PartDefinition, HardwareItem } from '../types/cabinet';
import { materialSheets, laborRates } from '../data/cabinetTemplates';
import axios from 'axios';

// Get API URL
const getApiUrl = () => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use relative API path
  return '/api';
};

const API_BASE_URL = getApiUrl();

// Configure axios with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class CabinetCalculatorService {
  
  // Calculate cutting list for a cabinet configuration
  static calculateCuttingList(template: CabinetTemplate, config: CabinetConfiguration): CuttingListItem[] {
    const { width, height, depth } = config.dimensions;
    const { side, topBottom, back, shelf, door, drawer, fixedPanel, drawerBottom, uprights, doubleBack } = template.materialThickness;
    const cuttingList: CuttingListItem[] = [];
    const construction = template.construction || {};
    
    // If template has defined parts, use those instead of the default calculations
    if (template.parts && template.parts.length > 0) {
      return this.calculateCuttingListFromParts(template.parts, config, template);
    }

    // Helper function to add cutting list item
    const addItem = (
      partName: string,
      materialType: string,
      thickness: number,
      length: number,
      width: number,
      quantity: number,
      edgeBanding: any = { front: false, back: false, left: false, right: false },
      grain: 'length' | 'width' | 'none' = 'length',
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
          height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
          depth - (construction.hasBack !== false ? back : 0),
          2,
          { front: true, back: false, left: true, right: true },
          'length',
          1
        );

        // Top panel (if applicable)
        if (construction.hasTop !== false) {
          addItem(
            'Top Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Bottom panel (if applicable)
        if (construction.hasBottom !== false) {
          addItem(
            'Bottom Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Back panel (if applicable)
        if (construction.hasBack !== false) {
          addItem(
            'Back Panel',
            'Plywood',
            back,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            width - (side * 2),
            1,
            { front: false, back: false, left: false, right: false },
            'length',
            2
          );
        }

        // Double back panel (if applicable)
        if (construction.hasDoubleBack === true) {
          addItem(
            'Double Back Panel',
            'Plywood',
            doubleBack || back,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            width - (side * 2),
            1,
            { front: false, back: false, left: false, right: false },
            'length',
            2
          );
        }

        // Fixed shelf (if applicable)
        if (construction.hasFixedShelf === true) {
          addItem(
            'Fixed Shelf',
            'Plywood',
            shelf,
            width - (side * 2) - 3, // 3mm clearance
            depth - (construction.hasBack !== false ? back : 0) - 20, // 20mm back clearance
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            2
          );
        }

        // Adjustable shelves
        if (config.customizations.shelfCount > 0) {
          addItem(
            'Adjustable Shelf',
            'Plywood',
            shelf,
            width - (side * 2) - 6, // 3mm clearance each side
            depth - (construction.hasBack !== false ? back : 0) - 50, // 50mm back clearance
            config.customizations.shelfCount,
            { front: true, back: false, left: true, right: true },
            'length',
            2
          );
        }

        // Front fixed panel (if applicable)
        if (construction.hasFrontPanel === true) {
          addItem(
            'Front Fixed Panel',
            'Plywood',
            fixedPanel || side,
            width - (side * 2),
            100, // Typical height for a fixed panel
            1,
            { front: true, back: true, left: true, right: true },
            'length',
            3
          );
        }

        // Filler panel (if applicable)
        if (construction.hasFillerPanel === true) {
          addItem(
            'Filler Panel',
            'Plywood',
            door,
            height - 6, // 3mm gap top and bottom
            50, // Typical width for a filler panel
            1,
            { front: true, back: true, left: true, right: true },
            'length',
            3
          );
        }

        // Uprights (if applicable)
        if (construction.hasUprights === true) {
          addItem(
            'Upright',
            'Plywood',
            uprights || side,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            depth - (construction.hasBack !== false ? back : 0),
            1, // Typically one upright in the middle
            { front: true, back: false, left: true, right: true },
            'length',
            1
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
            { front: true, back: true, left: true, right: true },
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
          height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
          depth - (construction.hasBack !== false ? back : 0),
          2,
          { front: true, back: false, left: true, right: true },
          'length',
          1
        );

        // Top panel (if applicable)
        if (construction.hasTop !== false) {
          addItem(
            'Top Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Bottom panel (if applicable)
        if (construction.hasBottom !== false) {
          addItem(
            'Bottom Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Back panel (if applicable)
        if (construction.hasBack !== false) {
          addItem(
            'Back Panel',
            'Plywood',
            back,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            width - (side * 2),
            1,
            { front: false, back: false, left: false, right: false },
            'length',
            2
          );
        }

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
            { front: true, back: true, left: true, right: true },
            'length',
            3
          );
          
          // Drawer box parts (sides, back, bottom)
          addItem(
            `Drawer Side ${i + 1}`,
            'Plywood',
            drawer || 15, // Thinner material for drawer box
            depth - 80, // Shorter than cabinet depth
            drawerHeight - 30, // Lower than front
            2,
            { front: true, back: false, left: true, right: true },
            'length',
            2
          );
          
          addItem(
            `Drawer Back ${i + 1}`,
            'Plywood',
            drawer || 15,
            width - 90, // Narrower than cabinet width
            drawerHeight - 30,
            1,
            { front: false, back: false, left: true, right: true },
            'length',
            2
          );
          
          addItem(
            `Drawer Bottom ${i + 1}`,
            'Plywood',
            drawerBottom || 12, // Thinner material for bottom
            width - 90,
            depth - 80,
            1,
            { front: false, back: false, left: false, right: false },
            'length',
            2
          );
        }
        break;

      case 'corner':
        // Corner cabinet has special geometry
        if (construction.isCorner === true) {
          // Side panels (typically 2 for L-shape)
          addItem(
            'Side Panel A',
            'Plywood',
            side,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            depth - (construction.hasBack !== false ? back : 0),
            2,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );

          // Top and Bottom (if applicable)
          if (construction.hasTop !== false) {
            addItem(
              'Corner Top',
              'Plywood',
              topBottom,
              width,
              depth,
              1,
              { front: true, back: true, left: true, right: true },
              'length',
              1
            );
          }
          
          if (construction.hasBottom !== false) {
            addItem(
              'Corner Bottom',
              'Plywood',
              topBottom,
              width,
              depth,
              1,
              { front: true, back: true, left: true, right: true },
              'length',
              1
            );
          }

          // Back panels (if applicable)
          if (construction.hasBack !== false) {
            addItem(
              'Back Panel',
              'Plywood',
              back,
              height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
              width - side,
              2, // Two back panels for corner cabinet
              { front: false, back: false, left: false, right: false },
              'length',
              2
            );
          }

          // Fixed front panel for corner cabinet
          if (construction.hasFrontPanel === true) {
            addItem(
              'Front Fixed Panel',
              'Plywood',
              fixedPanel || side,
              height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
              100, // Typical width for a fixed panel
              1,
              { front: true, back: true, left: true, right: true },
              'length',
              3
            );
          }

          // Shelves
          if (config.customizations.shelfCount > 0) {
            addItem(
              'Corner Shelf',
              'Plywood',
              shelf,
              width - 100, // Circular or L-shaped shelf
              width - 100,
              config.customizations.shelfCount,
              { front: true, back: true, left: true, right: true },
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
              { front: true, back: true, left: true, right: true },
              'length',
              3
            );
          }
        }
        break;

      case 'specialty':
        // Specialty cabinet (like sink base)
        // Sides (2 pieces)
        addItem(
          'Side Panel',
          'Plywood',
          side,
          height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
          depth - (construction.hasBack !== false ? back : 0),
          2,
          { front: true, back: false, left: true, right: true },
          'length',
          1
        );

        // Top panel (if applicable)
        if (construction.hasTop !== false) {
          addItem(
            'Top Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Bottom panel (if applicable)
        if (construction.hasBottom !== false) {
          addItem(
            'Bottom Panel',
            'Plywood',
            topBottom,
            width - (side * 2),
            depth - (construction.hasBack !== false ? back : 0),
            1,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

        // Back panel (if applicable)
        if (construction.hasBack !== false) {
          addItem(
            'Back Panel',
            'Plywood',
            back,
            height - (construction.hasTop !== false ? topBottom : 0) - (construction.hasBottom !== false ? topBottom : 0),
            width - (side * 2),
            1,
            { front: false, back: false, left: false, right: false },
            'length',
            2
          );
        }

        // Support rails for sink
        if (template.type === 'specialty' && !construction.hasTop) {
          addItem(
            'Support Rail',
            'Plywood',
            topBottom,
            width - (side * 2),
            100, // 100mm wide support
            2,
            { front: true, back: false, left: true, right: true },
            'length',
            1
          );
        }

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
            { front: true, back: true, left: true, right: true },
            'length',
            3
          );
        }
        break;
    }

    return cuttingList;
  }
  
  // Calculate cutting list from defined parts
  static calculateCuttingListFromParts(
    parts: PartDefinition[], 
    config: CabinetConfiguration,
    template?: CabinetTemplate
  ): CuttingListItem[] {
    const cuttingList: CuttingListItem[] = [];
    const { width, height, depth } = config.dimensions;
    const { doorCount, drawerCount, shelfCount } = config.customizations;
    
    // Create comprehensive evaluation context
    const context: any = {
      // Cabinet dimensions
      width,
      height,
      depth,
      
      // Customizations
      doorCount,
      drawerCount,
      shelfCount,
      
      // Construction flags with defaults
      hasTop: template?.construction?.hasTop ?? true,
      hasBottom: template?.construction?.hasBottom ?? true,
      hasBack: template?.construction?.hasBack ?? true,
      hasDoubleBack: template?.construction?.hasDoubleBack ?? false,
      hasToe: template?.construction?.hasToe ?? true,
      hasFixedShelf: template?.construction?.hasFixedShelf ?? false,
      isCorner: template?.construction?.isCorner ?? false,
      hasFrontPanel: template?.construction?.hasFrontPanel ?? false,
      hasFillerPanel: template?.construction?.hasFillerPanel ?? false,
      hasUprights: template?.construction?.hasUprights ?? false,
      
      // Material thicknesses with defaults
      side: template?.materialThickness?.side ?? 18,
      topBottom: template?.materialThickness?.topBottom ?? 18,
      back: template?.materialThickness?.back ?? 12,
      shelf: template?.materialThickness?.shelf ?? 18,
      door: template?.materialThickness?.door ?? 18,
      drawer: template?.materialThickness?.drawer ?? 15,
      fixedPanel: template?.materialThickness?.fixedPanel ?? 18,
      drawerBottom: template?.materialThickness?.drawerBottom ?? 12,
      uprights: template?.materialThickness?.uprights ?? 18,
      doubleBack: template?.materialThickness?.doubleBack ?? 12,
      
      // Common aliases and variations
      Side: template?.materialThickness?.side ?? 18,
      Top: template?.materialThickness?.topBottom ?? 18,
      Bottom: template?.materialThickness?.topBottom ?? 18,
      Back: template?.materialThickness?.back ?? 12,
      Shelf: template?.materialThickness?.shelf ?? 18,
      Door: template?.materialThickness?.door ?? 18,
      Drawer: template?.materialThickness?.drawer ?? 15,
      
      // Math constants and functions
      PI: Math.PI,
      min: Math.min,
      max: Math.max,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil
    };
    
    // Helper function to evaluate formula
    const evaluateFormula = (formula: string): number => {
      try {
        // Use Function constructor to create a safe evaluation function
        const evalFunc = new Function(
          ...Object.keys(context),
          `return ${formula};`
        );
        
        const result = evalFunc(...Object.values(context));
        
        // Validate result is a number
        if (typeof result !== 'number' || isNaN(result)) {
          console.error('Formula evaluation returned non-numeric result:', result);
          return 0;
        }
        
        return result;
      } catch (error) {
        console.error('Error evaluating formula:', error);
        return 0;
      }
    };
    
    // Process each part
    parts.forEach(part => {
      const length = evaluateFormula(part.widthFormula);
      const width = evaluateFormula(part.heightFormula);
      
      cuttingList.push({
        id: `${config.id}-${part.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        partName: part.name,
        cabinetId: config.id,
        cabinetName: config.name,
        materialType: 'Plywood', // Default material type
        thickness: part.thickness,
        length,
        width,
        quantity: part.quantity,
        edgeBanding: { ...part.edgeBanding },
        grain: part.grain,
        priority: part.isRequired ? 1 : 2
      });
    });
    
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
    // If template has defined hardware items, use those
    if (template.hardwareItems && template.hardwareItems.length > 0) {
      return template.hardwareItems.map(item => ({
        id: `hardware-${item.type}-${Date.now()}`,
        hardwareId: `${item.type}-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
        hardwareName: item.name,
        type: item.type as any,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        supplier: item.supplier
      }));
    }
    
    // Otherwise use the default calculation
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

  // Improved nesting algorithm with support for different sheet sizes
  static calculateNesting(cuttingList: CuttingListItem[], sheetSize?: { length: number, width: number }): NestingResult[] {
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

    // Process each material group
    materialGroups.forEach((items, key) => {
      const [materialType, thickness] = key.split('-');
      
      // Find the appropriate sheet size
      let sheet;
      if (sheetSize) {
        // Use custom sheet size if provided
        sheet = {
          length: sheetSize.length,
          width: sheetSize.width,
          type: materialType,
          thickness: parseInt(thickness)
        };
      } else {
        // Otherwise use standard sheet from materialSheets
        sheet = materialSheets.find(s => 
          s.type === materialType && s.thickness === parseInt(thickness)
        );
      }

      if (sheet) {
        // Create a copy of items for manipulation
        const itemsToPlace = [...items].flatMap(item => 
          Array(item.quantity).fill(0).map(() => ({
            id: `part-${item.id}-${Math.random().toString(36).substring(2, 9)}`,
            partId: item.id,
            length: item.length,
            width: item.width,
            rotation: 0,
            x: 0,
            y: 0,
            placed: false,
            grain: item.grain
          }))
        );

        // Sort items by area (largest first)
        itemsToPlace.sort((a, b) => (b.length * b.width) - (a.length * a.width));

        // Calculate how many sheets we need
        const totalArea = itemsToPlace.reduce((sum, item) => sum + (item.length * item.width), 0);
        const sheetArea = sheet.length * sheet.width;
        const estimatedSheets = Math.ceil(totalArea / (sheetArea * 0.85)); // Assuming 85% efficiency
        
        // Create result object
        const result: NestingResult = {
          id: `nesting-${key}-${Date.now()}`,
          sheetSize: {
            length: sheet.length,
            width: sheet.width
          },
          materialType,
          thickness: parseInt(thickness),
          parts: [],
          efficiency: 0,
          wasteArea: 0,
          totalArea: sheetArea * estimatedSheets,
          sheetCount: estimatedSheets
        };

        // Simple bin packing algorithm
        // This is a very basic implementation - in a real app, you'd use a more sophisticated algorithm
        let currentX = 0;
        let currentY = 0;
        let maxHeightInRow = 0;
        const padding = 5; // 5mm spacing between parts
        
        itemsToPlace.forEach(item => {
          // Check if item fits in current row
          if (currentX + item.length > sheet.length) {
            // Move to next row
            currentX = 0;
            currentY += maxHeightInRow + padding;
            maxHeightInRow = 0;
          }
          
          // Check if item fits in current sheet
          if (currentY + item.width > sheet.width) {
            // This would go to next sheet in a real implementation
            // For now, we'll just place it anyway for visualization
          }
          
          // Place the item
          item.x = currentX;
          item.y = currentY;
          item.placed = true;
          result.parts.push({
            id: item.id,
            partId: item.partId,
            x: item.x,
            y: item.y,
            rotation: item.rotation,
            length: item.length,
            width: item.width,
            grain: item.grain
          });
          
          // Update position for next item
          currentX += item.length + padding;
          maxHeightInRow = Math.max(maxHeightInRow, item.width);
        });
        
        // Calculate efficiency
        const usedArea = itemsToPlace.reduce((sum, item) => sum + (item.length * item.width), 0);
        result.efficiency = (usedArea / result.totalArea) * 100;
        result.wasteArea = result.totalArea - usedArea;
        
        results.push(result);
      }
    });

    return results;
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

  // Integrate with backend API for nesting optimization
  static async optimizeNesting(cuttingList: CuttingListItem[], sheetSize?: { length: number, width: number }, materialType?: string): Promise<NestingResult[]> {
    try {
      // Prepare request data
      const requestData: any = { cuttingList };
      
      // Add sheet size if provided
      if (sheetSize) {
        requestData.sheetSize = sheetSize;
      }
      
      // Add material filter if provided
      if (materialType && materialType !== 'all') {
        requestData.materialType = materialType;
      }
      
      console.log('Sending nesting optimization request with:', {
        sheetSize,
        materialType,
        cuttingListCount: cuttingList.length
      });
      
      // Call the backend API for nesting optimization
      const response = await axios.post(`${API_BASE_URL}/cabinet-calculator/nesting`, 
        requestData,
        { headers: getAuthHeader() }
      );
      
      // If we get a valid response, return it
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Otherwise fall back to our local implementation
      return this.calculateNesting(cuttingList, sheetSize);
    } catch (error) {
      console.error('Nesting optimization error:', error);
      
      // Parse sheet size from string if needed
      let parsedSheetSize = sheetSize;
      if (!parsedSheetSize && typeof sheetSize === 'string') {
        const [length, width] = (sheetSize as string).split('x').map(Number);
        if (!isNaN(length) && !isNaN(width)) {
          parsedSheetSize = { length, width };
        }
      }
      
      // Fall back to local implementation
      return this.calculateNesting(cuttingList, parsedSheetSize);
    }
  }
}

// Cabinet storage service using database API
export class CabinetStorageService {
  // Get all custom templates
  static async getCustomTemplates(): Promise<CabinetTemplate[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/cabinet-calculator/templates`, {
        headers: getAuthHeader()
      });
      return response.data.filter((template: CabinetTemplate) => template.isCustom);
    } catch (error) {
      console.error('Failed to fetch custom templates:', error);
      // Fallback to localStorage if API fails
      const templates = localStorage.getItem('customCabinetTemplates');
      return templates ? JSON.parse(templates) : [];
    }
  }

  // Save template to database
  static async saveTemplate(template: CabinetTemplate): Promise<void> {
    try {
      if (template.id && !template.id.startsWith('template-')) {
        // Update existing template
        await axios.put(`${API_BASE_URL}/cabinet-calculator/templates/${template.id}`, 
          template,
          { headers: getAuthHeader() }
        );
      } else {
        // Create new template
        await axios.post(`${API_BASE_URL}/cabinet-calculator/templates`, 
          template,
          { headers: getAuthHeader() }
        );
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      // Fallback to localStorage if API fails
      const templates = localStorage.getItem('customCabinetTemplates');
      const existingTemplates = templates ? JSON.parse(templates) : [];
      const existingIndex = existingTemplates.findIndex((t: CabinetTemplate) => t.id === template.id);
      
      if (existingIndex >= 0) {
        existingTemplates[existingIndex] = template;
      } else {
        existingTemplates.push(template);
      }
      
      localStorage.setItem('customCabinetTemplates', JSON.stringify(existingTemplates));
    }
  }

  // Delete template from database
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/cabinet-calculator/templates/${templateId}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      // Fallback to localStorage if API fails
      const templates = localStorage.getItem('customCabinetTemplates');
      if (templates) {
        const existingTemplates = JSON.parse(templates);
        const updatedTemplates = existingTemplates.filter((t: CabinetTemplate) => t.id !== templateId);
        localStorage.setItem('customCabinetTemplates', JSON.stringify(updatedTemplates));
      }
    }
  }

  // Get all configurations
  static async getConfigurations(): Promise<CabinetConfiguration[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/cabinet-calculator/configurations`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
      // Fallback to localStorage if API fails
      const configs = localStorage.getItem('cabinetConfigurations');
      return configs ? JSON.parse(configs) : [];
    }
  }

  // Save configuration to database
  static async saveConfiguration(config: CabinetConfiguration): Promise<void> {
    try {
      if (config.id && config.id.startsWith('config-')) {
        // Update existing configuration
        await axios.put(`${API_BASE_URL}/cabinet-calculator/configurations/${config.id}`, 
          config,
          { headers: getAuthHeader() }
        );
      } else {
        // Create new configuration
        await axios.post(`${API_BASE_URL}/cabinet-calculator/configurations`, 
          config,
          { headers: getAuthHeader() }
        );
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      // Fallback to localStorage if API fails
      const configs = localStorage.getItem('cabinetConfigurations');
      const existingConfigs = configs ? JSON.parse(configs) : [];
      const existingIndex = existingConfigs.findIndex((c: CabinetConfiguration) => c.id === config.id);
      
      if (existingIndex >= 0) {
        existingConfigs[existingIndex] = config;
      } else {
        existingConfigs.push(config);
      }
      
      localStorage.setItem('cabinetConfigurations', JSON.stringify(existingConfigs));
    }
  }

  // Delete configuration from database
  static async deleteConfiguration(configId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/cabinet-calculator/configurations/${configId}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      // Fallback to localStorage if API fails
      const configs = localStorage.getItem('cabinetConfigurations');
      if (configs) {
        const existingConfigs = JSON.parse(configs);
        const updatedConfigs = existingConfigs.filter((c: CabinetConfiguration) => c.id !== configId);
        localStorage.setItem('cabinetConfigurations', JSON.stringify(updatedConfigs));
      }
    }
  }

  // Get all projects
  static async getProjects(): Promise<CabinetProject[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/cabinet-calculator/projects`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      // Fallback to localStorage if API fails
      const projects = localStorage.getItem('cabinetProjects');
      return projects ? JSON.parse(projects) : [];
    }
  }

  // Save project to database
  static async saveProject(project: CabinetProject): Promise<void> {
    try {
      if (project.id && project.id.startsWith('project-')) {
        // Update existing project
        await axios.put(`${API_BASE_URL}/cabinet-calculator/projects/${project.id}`, 
          project,
          { headers: getAuthHeader() }
        );
      } else {
        // Create new project
        await axios.post(`${API_BASE_URL}/cabinet-calculator/projects`, 
          project,
          { headers: getAuthHeader() }
        );
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      // Fallback to localStorage if API fails
      const projects = localStorage.getItem('cabinetProjects');
      const existingProjects = projects ? JSON.parse(projects) : [];
      const existingIndex = existingProjects.findIndex((p: CabinetProject) => p.id === project.id);
      
      if (existingIndex >= 0) {
        existingProjects[existingIndex] = project;
      } else {
        existingProjects.push(project);
      }
      
      localStorage.setItem('cabinetProjects', JSON.stringify(existingProjects));
    }
  }

  // Delete project from database
  static async deleteProject(projectId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/cabinet-calculator/projects/${projectId}`, {
        headers: getAuthHeader()
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Fallback to localStorage if API fails
      const projects = localStorage.getItem('cabinetProjects');
      if (projects) {
        const existingProjects = JSON.parse(projects);
        const updatedProjects = existingProjects.filter((p: CabinetProject) => p.id !== projectId);
        localStorage.setItem('cabinetProjects', JSON.stringify(updatedProjects));
      }
    }
  }

  // Get project by ID
  static async getProjectById(projectId: string): Promise<CabinetProject | null> {
    try {
      const projects = await this.getProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      return null;
    }
  }
}