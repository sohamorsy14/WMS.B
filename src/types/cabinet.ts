import { CabinetTemplate, MaterialSheet, LaborRate } from '../types/cabinet';

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
  materialThickness: {
    side: number;
    topBottom: number;
    back: number;
    shelf: number;
    door: number;
  };
  hardware: {
    hinges: number;
    slides: number;
    handles: number;
    shelves: number;
  };
  isActive: boolean;
  isCustom?: boolean;
  createdAt: string;
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
  type: 'hinge' | 'slide' | 'handle' | 'knob' | 'shelf_pin' | 'cam_lock';
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  specifications?: string;
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
    length1: boolean;
    length2: boolean;
    width1: boolean;
    width2: boolean;
  };
  grain: 'length' | 'width';
  priority: number;
  notes?: string;
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