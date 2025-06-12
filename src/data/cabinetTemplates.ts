import { CabinetTemplate, MaterialSheet, LaborRate } from '../types/cabinet';

export const cabinetTemplates: CabinetTemplate[] = [
  // Base Cabinets
  {
    id: 'base-single-door',
    name: 'Single Door Base Cabinet',
    type: 'base',
    category: 'Base Cabinets',
    defaultDimensions: { width: 400, height: 720, depth: 560 },
    minDimensions: { width: 300, height: 700, depth: 500 },
    maxDimensions: { width: 600, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Standard single door base cabinet with adjustable shelf',
    features: ['Adjustable shelf', 'Soft-close hinges', 'Full overlay door'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 2,
      slides: 0,
      handles: 1,
      shelves: 1
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'base-double-door',
    name: 'Double Door Base Cabinet',
    type: 'base',
    category: 'Base Cabinets',
    defaultDimensions: { width: 800, height: 720, depth: 560 },
    minDimensions: { width: 600, height: 700, depth: 500 },
    maxDimensions: { width: 1200, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585760/pexels-photo-6585760.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Standard double door base cabinet with adjustable shelf',
    features: ['Adjustable shelf', 'Soft-close hinges', 'Full overlay doors'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 4,
      slides: 0,
      handles: 2,
      shelves: 1
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'base-drawer-unit',
    name: 'Three Drawer Base Unit',
    type: 'drawer',
    category: 'Base Cabinets',
    defaultDimensions: { width: 400, height: 720, depth: 560 },
    minDimensions: { width: 300, height: 700, depth: 500 },
    maxDimensions: { width: 600, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585761/pexels-photo-6585761.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Three drawer base unit with soft-close slides',
    features: ['Soft-close slides', 'Full extension', 'Dovetail construction'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 0,
      slides: 3,
      handles: 3,
      shelves: 0
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // Wall Cabinets
  {
    id: 'wall-single-door',
    name: 'Single Door Wall Cabinet',
    type: 'wall',
    category: 'Wall Cabinets',
    defaultDimensions: { width: 400, height: 720, depth: 320 },
    minDimensions: { width: 300, height: 500, depth: 280 },
    maxDimensions: { width: 600, height: 900, depth: 400 },
    previewImage: 'https://images.pexels.com/photos/6585762/pexels-photo-6585762.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Standard single door wall cabinet with adjustable shelf',
    features: ['Adjustable shelf', 'Soft-close hinges', 'Full overlay door'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 2,
      slides: 0,
      handles: 1,
      shelves: 1
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'wall-double-door',
    name: 'Double Door Wall Cabinet',
    type: 'wall',
    category: 'Wall Cabinets',
    defaultDimensions: { width: 800, height: 720, depth: 320 },
    minDimensions: { width: 600, height: 500, depth: 280 },
    maxDimensions: { width: 1200, height: 900, depth: 400 },
    previewImage: 'https://images.pexels.com/photos/6585763/pexels-photo-6585763.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Standard double door wall cabinet with adjustable shelf',
    features: ['Adjustable shelf', 'Soft-close hinges', 'Full overlay doors'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 4,
      slides: 0,
      handles: 2,
      shelves: 1
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // Tall Cabinets
  {
    id: 'tall-pantry',
    name: 'Tall Pantry Cabinet',
    type: 'tall',
    category: 'Tall Cabinets',
    defaultDimensions: { width: 600, height: 2100, depth: 560 },
    minDimensions: { width: 400, height: 1800, depth: 500 },
    maxDimensions: { width: 800, height: 2400, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585764/pexels-photo-6585764.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Full height pantry cabinet with multiple shelves',
    features: ['Multiple adjustable shelves', 'Soft-close hinges', 'Full overlay doors'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 6,
      slides: 0,
      handles: 2,
      shelves: 4
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tall-oven',
    name: 'Tall Oven Cabinet',
    type: 'tall',
    category: 'Tall Cabinets',
    defaultDimensions: { width: 600, height: 2100, depth: 560 },
    minDimensions: { width: 550, height: 1800, depth: 500 },
    maxDimensions: { width: 700, height: 2400, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585765/pexels-photo-6585765.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Tall cabinet designed for built-in oven installation',
    features: ['Oven cutout', 'Heat resistant materials', 'Ventilation space'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 4,
      slides: 0,
      handles: 2,
      shelves: 2
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // Corner Cabinets
  {
    id: 'corner-lazy-susan',
    name: 'Corner Cabinet with Lazy Susan',
    type: 'corner',
    category: 'Corner Solutions',
    defaultDimensions: { width: 900, height: 720, depth: 900 },
    minDimensions: { width: 800, height: 700, depth: 800 },
    maxDimensions: { width: 1000, height: 900, depth: 1000 },
    previewImage: 'https://images.pexels.com/photos/6585766/pexels-photo-6585766.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Corner base cabinet with rotating lazy susan mechanism',
    features: ['Lazy susan mechanism', 'Bi-fold doors', 'Maximum storage'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 4,
      slides: 0,
      handles: 2,
      shelves: 2
    },
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // Specialty Cabinets
  {
    id: 'sink-base',
    name: 'Sink Base Cabinet',
    type: 'specialty',
    category: 'Specialty Cabinets',
    defaultDimensions: { width: 800, height: 720, depth: 560 },
    minDimensions: { width: 600, height: 700, depth: 500 },
    maxDimensions: { width: 1200, height: 900, depth: 650 },
    previewImage: 'https://images.pexels.com/photos/6585767/pexels-photo-6585767.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Base cabinet designed for undermount sink installation',
    features: ['Sink cutout', 'Reinforced top', 'Plumbing access'],
    materialThickness: {
      side: 18,
      topBottom: 18,
      back: 12,
      shelf: 18,
      door: 18,
      drawer: 15,
      fixedPanel: 18,
      drawerBottom: 12,
      uprights: 18,
      doubleBack: 12
    },
    hardware: {
      hinges: 4,
      slides: 0,
      handles: 2,
      shelves: 0
    },
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const materialSheets = [
  {
    id: 'ply-18-2440-1220',
    name: 'Plywood 18mm',
    type: 'Plywood',
    thickness: 18,
    length: 2440,
    width: 1220,
    costPerSheet: 52.75,
    costPerSqM: 17.75,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'ply-18-2100-2800',
    name: 'Plywood 18mm (2100×2800)',
    type: 'Plywood',
    thickness: 18,
    length: 2100,
    width: 2800,
    costPerSheet: 85.50,
    costPerSqM: 14.50,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'ply-18-1520-1520',
    name: 'Plywood 18mm (1520×1520)',
    type: 'Plywood',
    thickness: 18,
    length: 1520,
    width: 1520,
    costPerSheet: 42.25,
    costPerSqM: 18.30,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'mdf-18-2440-1220',
    name: 'MDF 18mm',
    type: 'MDF',
    thickness: 18,
    length: 2440,
    width: 1220,
    costPerSheet: 38.90,
    costPerSqM: 13.08,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'mel-white-18-2440-1220',
    name: 'White Melamine 18mm',
    type: 'Melamine',
    thickness: 18,
    length: 2440,
    width: 1220,
    costPerSheet: 68.50,
    costPerSqM: 23.04,
    supplier: 'Laminate Plus',
    isStandard: true
  },
  {
    id: 'ply-12-2440-1220',
    name: 'Plywood 12mm (Back)',
    type: 'Plywood',
    thickness: 12,
    length: 2440,
    width: 1220,
    costPerSheet: 35.25,
    costPerSqM: 11.86,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'ply-18-1800-3600',
    name: 'Plywood 18mm (1800×3600)',
    type: 'Plywood',
    thickness: 18,
    length: 1800,
    width: 3600,
    costPerSheet: 94.50,
    costPerSqM: 14.58,
    supplier: 'Wood Supply Co.',
    isStandard: true
  },
  {
    id: 'ply-18-2100-2100',
    name: 'Plywood 18mm (2100×2100)',
    type: 'Plywood',
    thickness: 18,
    length: 2100,
    width: 2100,
    costPerSheet: 64.25,
    costPerSqM: 14.58,
    supplier: 'Wood Supply Co.',
    isStandard: true
  }
];

export const laborRates = [
  {
    id: 'cutting',
    operation: 'Panel Cutting',
    ratePerHour: 45.00,
    timePerUnit: 0.1,
    unit: 'per cut',
    description: 'Time to cut panels on panel saw'
  },
  {
    id: 'edgebanding',
    operation: 'Edge Banding',
    ratePerHour: 45.00,
    timePerUnit: 0.05,
    unit: 'per linear meter',
    description: 'Time to apply edge banding'
  },
  {
    id: 'drilling',
    operation: 'Drilling & Hardware',
    ratePerHour: 45.00,
    timePerUnit: 0.2,
    unit: 'per cabinet',
    description: 'Time to drill holes and install hardware'
  },
  {
    id: 'assembly',
    operation: 'Cabinet Assembly',
    ratePerHour: 45.00,
    timePerUnit: 1.5,
    unit: 'per cabinet',
    description: 'Time to assemble complete cabinet'
  },
  {
    id: 'finishing',
    operation: 'Finishing & QC',
    ratePerHour: 45.00,
    timePerUnit: 0.5,
    unit: 'per cabinet',
    description: 'Time for final finishing and quality control'
  }
];