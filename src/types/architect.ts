export type BuildingType = 'house' | 'apartment' | 'office' | 'custom';
export type UnitSystem = 'meters' | 'feet';
export type PlotShape = 'rectangular' | 'square' | 'corner' | 'l_shaped' | 'irregular';

export interface PlotDimensions {
  width: number; // in current units
  depth: number; // in current units
}

export interface Setbacks {
  front: number;
  rear: number;
  side: number;
}

export interface DedicatedSpaces {
  homeOffice: boolean;
  garage: boolean;
  swimmingPool: boolean;
  terraceGarden: boolean;
  poojaMeditation: boolean;
}

export interface DirectionalConfig {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface FloorBHKConfig {
  floorIndex: number;
  floorLabel: string;
  bhk: string; // e.g. "2 BHK", "3 BHK", "1 BHK", "Studio / Penthouse"
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
}

export interface BuildingSpecs {
  buildingType: BuildingType;
  unitSystem: UnitSystem;
  plotDimensions: PlotDimensions;
  plotShape: PlotShape;
  setbacks: Setbacks;
  floorsKey: 'G' | 'G+1' | 'G+2' | 'G+3' | 'G+4';
  floorsCount: number; // 1, 2, 3, 4, 5
  ceilingHeight: number; // meters
  ceilingHeightLabel: string;
  architecturalStyle: string;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  dedicatedSpaces: DedicatedSpaces;
  hasBasement: boolean;
  basementPurpose: string;
  hasElevator: boolean;
  elevatorType: string;
  vaastuCompliant: boolean;
  floorBHKConfigs: FloorBHKConfig[];
  windowDirections: DirectionalConfig;
  balconyDirections: DirectionalConfig;
  customRequirements: string;
}

export interface BOQItem {
  id: string;
  category: 'Substructure & Foundation' | 'Concrete & Steel Structure' | 'Masonry & Enclosure' | 'Doors & Glazing' | 'Flooring & Finishes' | 'MEP & Utilities';
  name: string;
  unit: string;
  quantity: number;
  rateINR: number;
  rateUSD: number;
  totalINR: number;
  totalUSD: number;
}

export interface RoomLayout {
  id: string;
  name: string;
  type: 
    | 'living' 
    | 'kitchen' 
    | 'bedroom' 
    | 'master_bedroom' 
    | 'bathroom' 
    | 'terrace' 
    | 'garage' 
    | 'driveway' 
    | 'garden' 
    | 'hallway' 
    | 'elevator' 
    | 'utility' 
    | 'pooja' 
    | 'pool' 
    | 'gym' 
    | 'theater' 
    | 'gazebo' 
    | 'helipad' 
    | 'billiards' 
    | 'bar' 
    | 'office' 
    | 'spa' 
    | 'custom';
  x: number;
  z: number;
  width: number;
  depth: number;
  widthFt: number;
  depthFt: number;
  areaSqM: number;
  areaSqFt: number;
  color: string;
  floorIndex: number;
  vaastuZone?: string;
  isCustomDirective?: boolean;
  customFeatureType?: string;
  customNote?: string;
}

export interface FloorLayout {
  floorIndex: number; // -1 for basement, 0 for G, 1 for G+1, etc.
  name: string;
  levelY: number;
  height: number;
  areaSqM: number;
  areaSqFt: number;
  rooms: RoomLayout[];
}

export interface ArchitectureModelData {
  specs: BuildingSpecs;
  plotAreaM2: number;
  plotAreaSqFt: number;
  footprintWidthM: number;
  footprintDepthM: number;
  footprintWidthFt: number;
  footprintDepthFt: number;
  footprintAreaM2: number;
  footprintAreaSqFt: number;
  totalBuiltUpAreaM2: number;
  totalBuiltUpAreaSqFt: number;
  floors: FloorLayout[];
  boq: BOQItem[];
  totalCostINR: number;
  totalCostUSD: number;
  customDirectives: string[];
  daylightInfo: {
    orientation: string;
    optimalSolarGain: string;
  };
}
