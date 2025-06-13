export interface CabinetTemplate {
  id: string;
  name: string;
  type: 'base' | 'wall' | 'tall' | 'drawer' | 'corner' | 'specialty';
  category: string;
  defaultDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  minDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  maxDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  previewImage: string;
  description: string;
  features: string[];
  construction?: {
    hasTop?: boolean;
    hasBottom?: boolean;
    hasBack?: boolean;
    hasDoubleBack?: boolean;
    hasToe?: boolean;
    hasFixedShelf?: boolean;
    isCorner?: boolean;
    hasFrontPanel?: boolean;
    hasFillerPanel?: boolean;
    hasUprights?: boolean;
  };
  materialThickness: {
    side: number;
    topBottom: number;
    back: number;
    shelf: number;
    door: number;
    drawer?: number;
    fixedPanel?: number;
    drawerBottom?: number;
    uprights?: number;
    doubleBack?: number;
  };
  hardware: {
    hinges: number;
    slides: number;
    handles: number;
    shelves: number;
    shelfPins?: number;
    drawerBoxType?: 'standard' | 'dovetail' | 'metal';
  };
  // New fields for advanced cabinet construction
  parts?: PartDefinition[];
  hardwareItems?: HardwareItem[];
  isActive: boolean;
  isCustom?: boolean;
  createdAt: string;
}

export interface PartDefinition {
  id: string;
  name: string;
  thickness: number;
  widthFormula: string;
  heightFormula: string;
  quantity: number;
  edgeBanding: {
    front: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
  };
  grain: 'length' | 'width' | 'none';
  isRequired: boolean;
}

export interface HardwareItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  notes?: string;
}

export interface CabinetConfiguration {
  id: string;
  templateId: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  customizations: {
    doorCount: number;
    drawerCount: number;
    shelfCount: number;
    doorStyle: string;
    finish: string;
    hardware: string;
  };
  materials: CabinetMaterial[];
  hardware: CabinetHardware[];
  cuttingList: CuttingListItem[];
  totalCost: number;
  laborCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CuttingListItem {
  id: string;
  partName: string;
  cabinetId: string;
  cabinetName: string;
  materialType: string;
  thickness: number;
  length: number;
  width: number;
  quantity: number;
  edgeBanding: {
    front: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
  };
  grain: 'length' | 'width' | 'none';
  priority: number;
}

export interface CabinetMaterial {
  id: string;
  materialId: string;
  materialName: string;
  type: 'panel' | 'back' | 'edgeband' | 'veneer';
  thickness: number;
  dimensions: {
    length: number;
    width: number;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  notes?: string;
}

export interface CabinetHardware {
  id: string;
  hardwareId: string;
  hardwareName: string;
  type: 'hinge' | 'slide' | 'handle' | 'knob' | 'shelf_pin' | 'cam_lock' | 'corner_bracket' | 'lazy_susan';
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  specifications?: string;
}

export interface NestingResult {
  id: string;
  sheetSize: {
    length: number;
    width: number;
  };
  materialType: string;
  thickness: number;
  parts: NestingPart[];
  efficiency: number;
  wasteArea: number;
  totalArea: number;
  sheetCount: number;
}

export interface NestingPart {
  id: string;
  partId: string;
  x: number;
  y: number;
  rotation: number;
  length: number;
  width: number;
  grain?: 'length' | 'width' | 'none';
}

export interface CabinetProject {
  id: string;
  name: string;
  description: string;
  customerName: string;
  customerContact: string;
  configurations: CabinetConfiguration[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalHardwareCost: number;
  subtotal: number;
  tax: number;
  total: number;
  estimatedDays: number;
  status: 'draft' | 'quoted' | 'approved' | 'in_production' | 'completed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface MaterialSheet {
  id: string;
  name: string;
  type: string;
  thickness: number;
  length: number;
  width: number;
  costPerSheet: number;
  costPerSqM: number;
  supplier: string;
  isStandard: boolean;
}

export interface LaborRate {
  id: string;
  operation: string;
  ratePerHour: number;
  timePerUnit: number;
  unit: string;
  description: string;
}

export interface Material {
  id: string;
  name: string;
  type: 'plywood' | 'mdf' | 'melamine' | 'solid_wood' | 'veneer' | 'laminate';
  thickness: number;
  costPerSheet: number;
  sheetDimensions: {
    length: number;
    width: number;
  };
  supplier: string;
  isActive: boolean;
}