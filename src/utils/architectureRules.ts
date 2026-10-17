import type { 
  BuildingSpecs, 
  ArchitectureModelData, 
  BOQItem, 
  FloorLayout, 
  RoomLayout, 
  FloorBHKConfig,
  PlotShape
} from '../types/architect.ts';

export const FEET_TO_METERS = 0.3048;
export const METERS_TO_FEET = 3.28084;
export const SQM_TO_SQFT = 10.7639;

export function convertUnits(value: number, from: 'meters' | 'feet', to: 'meters' | 'feet'): number {
  if (from === to) return value;
  if (from === 'meters' && to === 'feet') return Math.round(value * METERS_TO_FEET * 10) / 10;
  return Math.round(value * FEET_TO_METERS * 10) / 10;
}

export function calculatePlotArea(
  width: number, 
  depth: number, 
  unit: 'meters' | 'feet',
  shape: PlotShape = 'rectangular'
): { areaM2: number; areaSqFt: number } {
  const widthM = unit === 'feet' ? width * FEET_TO_METERS : width;
  const depthM = unit === 'feet' ? depth * FEET_TO_METERS : depth;
  
  let multiplier = 1.0;
  if (shape === 'square') {
    multiplier = 1.0;
  } else if (shape === 'corner') {
    multiplier = 1.05; // corner visibility
  } else if (shape === 'l_shaped') {
    multiplier = 0.78; // L-cutout deduction
  } else if (shape === 'irregular') {
    multiplier = 0.92; // irregular boundary deduction
  }

  const areaM2 = Math.round(widthM * depthM * multiplier);
  const areaSqFt = Math.round(areaM2 * SQM_TO_SQFT);
  return { areaM2, areaSqFt };
}

export function calculateBuildableFootprint(
  plotWidth: number,
  plotDepth: number,
  frontSetback: number,
  rearSetback: number,
  sideClearance: number,
  unit: 'meters' | 'feet'
): {
  footprintWidthM: number;
  footprintDepthM: number;
  footprintWidthFt: number;
  footprintDepthFt: number;
  footprintAreaM2: number;
  footprintAreaSqFt: number;
} {
  const widthM = unit === 'feet' ? plotWidth * FEET_TO_METERS : plotWidth;
  const depthM = unit === 'feet' ? plotDepth * FEET_TO_METERS : plotDepth;
  const frontM = unit === 'feet' ? frontSetback * FEET_TO_METERS : frontSetback;
  const rearM = unit === 'feet' ? rearSetback * FEET_TO_METERS : rearSetback;
  const sideM = unit === 'feet' ? sideClearance * FEET_TO_METERS : sideClearance;

  // 2 side clearances (left and right)
  const footprintWidthM = Math.max(4, Math.round((widthM - 2 * sideM) * 10) / 10);
  const footprintDepthM = Math.max(6, Math.round((depthM - frontM - rearM) * 10) / 10);
  const footprintAreaM2 = Math.round(footprintWidthM * footprintDepthM);

  const footprintWidthFt = Math.round(footprintWidthM * METERS_TO_FEET * 10) / 10;
  const footprintDepthFt = Math.round(footprintDepthM * METERS_TO_FEET * 10) / 10;
  const footprintAreaSqFt = Math.round(footprintAreaM2 * SQM_TO_SQFT);

  return {
    footprintWidthM,
    footprintDepthM,
    footprintWidthFt,
    footprintDepthFt,
    footprintAreaM2,
    footprintAreaSqFt,
  };
}

export function calculateTotalBuiltUpArea(
  footprintAreaM2: number,
  floorsCount: number,
  hasBasement: boolean
): { totalM2: number; totalSqFt: number } {
  const aboveGroundFactor = 0.95; // deduction for balconies/cutouts
  const aboveGroundArea = Math.round(footprintAreaM2 * floorsCount * aboveGroundFactor);
  const basementArea = hasBasement ? Math.round(footprintAreaM2 * 0.9) : 0;
  const totalM2 = aboveGroundArea + basementArea;
  const totalSqFt = Math.round(totalM2 * SQM_TO_SQFT);
  return { totalM2, totalSqFt };
}

export function generateBillOfQuantities(
  builtUpAreaM2: number, 
  floorsCount: number, 
  hasBasement: boolean,
  hasElevator: boolean = false
): {
  items: BOQItem[];
  totalINR: number;
  totalUSD: number;
} {
  const concreteVolumeM3 = Math.round(builtUpAreaM2 * 0.22);
  const steelWeightKg = Math.round(builtUpAreaM2 * 42);
  const masonrySqM = Math.round(builtUpAreaM2 * 1.4);
  const glazingSqM = Math.round(builtUpAreaM2 * 0.25);
  const flooringSqM = Math.round(builtUpAreaM2 * 0.85);

  const items: BOQItem[] = [
    {
      id: 'substructure',
      category: 'Substructure & Foundation',
      name: hasBasement ? 'Deep Raft Foundation, Retaining Walls & Tanking' : 'Isolated Footings & Grade Beams',
      unit: 'm³',
      quantity: hasBasement ? Math.round(builtUpAreaM2 * 0.12) : Math.round(builtUpAreaM2 * 0.06),
      rateINR: 7500,
      rateUSD: 90,
      totalINR: (hasBasement ? Math.round(builtUpAreaM2 * 0.12) : Math.round(builtUpAreaM2 * 0.06)) * 7500,
      totalUSD: (hasBasement ? Math.round(builtUpAreaM2 * 0.12) : Math.round(builtUpAreaM2 * 0.06)) * 90,
    },
    {
      id: 'rcc_concrete',
      category: 'Concrete & Steel Structure',
      name: 'M25/M30 Ready-Mix Reinforced Structural Concrete',
      unit: 'm³',
      quantity: concreteVolumeM3,
      rateINR: 6800,
      rateUSD: 82,
      totalINR: concreteVolumeM3 * 6800,
      totalUSD: concreteVolumeM3 * 82,
    },
    {
      id: 'steel_rebar',
      category: 'Concrete & Steel Structure',
      name: 'Fe500D TMT Thermo-Mechanically Treated Rebar',
      unit: 'Metric Tons',
      quantity: Math.round((steelWeightKg / 1000) * 10) / 10,
      rateINR: 62000,
      rateUSD: 745,
      totalINR: Math.round(((steelWeightKg / 1000) * 62000)),
      totalUSD: Math.round(((steelWeightKg / 1000) * 745)),
    },
    {
      id: 'masonry',
      category: 'Masonry & Enclosure',
      name: 'AAC Lightweight Thermal Blocks & External Weatherproof Plaster',
      unit: 'm²',
      quantity: masonrySqM,
      rateINR: 1450,
      rateUSD: 17.5,
      totalINR: masonrySqM * 1450,
      totalUSD: Math.round(masonrySqM * 17.5),
    },
    {
      id: 'glazing',
      category: 'Doors & Glazing',
      name: 'Double-Glazed Low-E Thermal Break Aluminium Windows & Sliders',
      unit: 'm²',
      quantity: glazingSqM,
      rateINR: 8500,
      rateUSD: 102,
      totalINR: glazingSqM * 8500,
      totalUSD: glazingSqM * 102,
    },
    {
      id: 'flooring',
      category: 'Flooring & Finishes',
      name: 'Vitrified Large Format Tiles & Italian Marble living accents',
      unit: 'm²',
      quantity: flooringSqM,
      rateINR: 2800,
      rateUSD: 34,
      totalINR: flooringSqM * 2800,
      totalUSD: Math.round(flooringSqM * 34),
    },
    {
      id: 'mep',
      category: 'MEP & Utilities',
      name: 'Concealed Conduit Electricals, HVAC Piping & Sanitary Plumbing',
      unit: 'Lump Sum / sq.m',
      quantity: builtUpAreaM2,
      rateINR: 2200,
      rateUSD: 26.5,
      totalINR: builtUpAreaM2 * 2200,
      totalUSD: Math.round(builtUpAreaM2 * 26.5),
    },
  ];

  if (hasElevator) {
    const elevatorCostINR = 650000 + (floorsCount * 75000);
    const elevatorCostUSD = 7800 + (floorsCount * 900);
    items.push({
      id: 'elevator_system',
      category: 'MEP & Utilities',
      name: `Automatic Vertical Passenger Elevator Lift (${floorsCount + (hasBasement ? 1 : 0)} Stops, Machine-Room-Less)`,
      unit: 'Complete Set',
      quantity: 1,
      rateINR: elevatorCostINR,
      rateUSD: elevatorCostUSD,
      totalINR: elevatorCostINR,
      totalUSD: elevatorCostUSD,
    });
  }

  const totalINR = items.reduce((acc, curr) => acc + curr.totalINR, 0);
  const totalUSD = items.reduce((acc, curr) => acc + curr.totalUSD, 0);

  return { items, totalINR, totalUSD };
}

export interface ParsedRequirements {
  directives: string[];
  hasPool: boolean;
  hasMandir: boolean;
  hasGym: boolean;
  hasTheater: boolean;
  hasGazebo: boolean;
  hasHelipad: boolean;
  hasCourtyard: boolean;
  hasOffice: boolean;
  hasBar: boolean;
  hasDoubleHeight: boolean;
  hasBilliards: boolean;
  hasSpa: boolean;
  hasTerraceGarden: boolean;
  bespokeTitle?: string;
}

export function parseCustomRequirements(text: string): ParsedRequirements {
  const lower = (text || '').toLowerCase();
  const directives: string[] = [];

  const hasPool = /pool|swim|swimm|talaab|swimming|water body|splash/.test(lower);
  if (hasPool) directives.push('Outdoor Swimming Pool & Sun Deck');

  const hasMandir = /mandir|pooja|puja|temple|prayer|sanctum|ishanya|devalay|bhajan/.test(lower);
  if (hasMandir) directives.push('Vedic Pooja / Mandir Sanctum (NE)');

  const hasGym = /gym|fitness|workout|exercise|treadmill|kasrat|vyayam/.test(lower);
  if (hasGym) directives.push('Fitness Gym & Wellness Studio');

  const hasTheater = /theater|theatre|cinema|movie|projector|home theater|media room|dolby/.test(lower);
  if (hasTheater) directives.push('Dolby Atmos Private Home Cinema');

  const hasGazebo = /gazebo|pergola|chhat|terrace garden|sky garden|rooftop deck|canopy|patio lounge/.test(lower);
  if (hasGazebo) directives.push('Rooftop Pergola & Gazebo Lounge');

  const hasHelipad = /helipad|heliport|helicopter|chopper/.test(lower);
  if (hasHelipad) directives.push('Rooftop Aviation Helipad (FAA/ICAO Compliant)');

  const hasCourtyard = /courtyard|lawn|garden|aangan|bagicha|patio|greenery|landscape/.test(lower);
  if (hasCourtyard) directives.push('Landscaped Courtyard & Greenery');

  const hasOffice = /office|study|library|work from home|wfh|kitab|bookshelf/.test(lower);
  if (hasOffice) directives.push('Executive Home Office & Study Library');

  const hasBar = /bar|lounge|wine|cocktail|drinks|liquor/.test(lower);
  if (hasBar) directives.push('Cocktail Bar & Entertaining Lounge');

  const hasDoubleHeight = /double height|high ceiling|oonchi chhat|atrium/.test(lower);
  if (hasDoubleHeight) directives.push('Double-Height Atrium Living Hall');

  const hasBilliards = /billiards|snooker|pool table|game room|gaming|arcade/.test(lower);
  if (hasBilliards) directives.push('Billiards & Game Recreation Lounge');

  const hasSpa = /spa|jacuzzi|sauna|steam|hot tub/.test(lower);
  if (hasSpa) directives.push('Wellness Spa & Hydrotherapy Jacuzzi');

  const hasTerraceGarden = /terrace garden|plants|green roof|chhat pe garden/.test(lower);
  if (hasTerraceGarden) directives.push('Landscaped Rooftop Sky Garden');

  let bespokeTitle: string | undefined;
  if (directives.length === 0 && text.trim().length > 3) {
    const rawClean = text.trim().replace(/[\r\n]+/g, ' ');
    const preview = rawClean.length > 32 ? rawClean.slice(0, 32) + '...' : rawClean;
    bespokeTitle = `Bespoke: ${preview}`;
    directives.push(`Custom Directive: ${preview}`);
  } else if (text.trim().length > 3 && directives.length > 0) {
    const rawClean = text.trim().replace(/[\r\n]+/g, ' ');
    const preview = rawClean.length > 30 ? rawClean.slice(0, 30) + '...' : rawClean;
    directives.push(`Custom Directive: ${preview}`);
  }

  return {
    directives,
    hasPool,
    hasMandir,
    hasGym,
    hasTheater,
    hasGazebo,
    hasHelipad,
    hasCourtyard,
    hasOffice,
    hasBar,
    hasDoubleHeight,
    hasBilliards,
    hasSpa,
    hasTerraceGarden,
    bespokeTitle,
  };
}

export function generateFloorLayouts(
  specs: BuildingSpecs,
  footprintWidth: number,
  footprintDepth: number
): FloorLayout[] {
  const layouts: FloorLayout[] = [];
  const floorHeight = specs.ceilingHeight;
  const isVaastu = specs.vaastuCompliant;
  const parsed = parseCustomRequirements(specs.customRequirements);

  // Helper for per-floor BHK config
  const getBHKConfigForFloor = (fIndex: number): FloorBHKConfig => {
    const existing = specs.floorBHKConfigs?.find(cfg => cfg.floorIndex === fIndex);
    if (existing) return existing;
    return {
      floorIndex: fIndex,
      floorLabel: fIndex === 0 ? 'Ground Floor (G)' : `Floor ${fIndex} (G+${fIndex})`,
      bhk: fIndex === 0 ? '2 BHK' : '3 BHK',
      bedrooms: fIndex === 0 ? 2 : 3,
      bathrooms: fIndex === 0 ? 2 : 3,
      kitchens: 1,
    };
  };

  // 1. BASEMENT (if configured)
  if (specs.hasBasement) {
    const bArea = Math.round(footprintWidth * footprintDepth * 0.9);
    const basementRooms: RoomLayout[] = [];

    if (parsed.hasTheater || specs.basementPurpose.includes('Theater')) {
      basementRooms.push({
        id: 'b-theater',
        name: 'Private Dolby Cinema',
        type: 'theater',
        x: -footprintWidth * 0.18,
        z: -footprintDepth * 0.08,
        width: footprintWidth * 0.52,
        depth: footprintDepth * 0.44,
        widthFt: Math.round(footprintWidth * 0.52 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.44 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.52 * footprintDepth * 0.44),
        areaSqFt: Math.round(footprintWidth * 0.52 * footprintDepth * 0.44 * SQM_TO_SQFT),
        color: '#4c1d95',
        floorIndex: -1,
        vaastuZone: 'Acoustic Sub-Basin',
        isCustomDirective: true,
        customFeatureType: 'theater',
      });
    }

    if (parsed.hasGym || specs.basementPurpose.includes('Gym')) {
      basementRooms.push({
        id: 'b-gym',
        name: 'Fitness Gym & Studio',
        type: 'gym',
        x: footprintWidth * 0.25,
        z: -footprintDepth * 0.08,
        width: footprintWidth * 0.38,
        depth: footprintDepth * 0.44,
        widthFt: Math.round(footprintWidth * 0.38 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.44 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.38 * footprintDepth * 0.44),
        areaSqFt: Math.round(footprintWidth * 0.38 * footprintDepth * 0.44 * SQM_TO_SQFT),
        color: '#047857',
        floorIndex: -1,
        vaastuZone: 'East Energy Sector',
        isCustomDirective: true,
        customFeatureType: 'gym',
      });
    }

    if (parsed.hasBilliards) {
      basementRooms.push({
        id: 'b-billiards',
        name: 'Billiards & Game Room',
        type: 'billiards',
        x: footprintWidth * 0.22,
        z: footprintDepth * 0.22,
        width: footprintWidth * 0.42,
        depth: footprintDepth * 0.35,
        widthFt: Math.round(footprintWidth * 0.42 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.35 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.42 * footprintDepth * 0.35),
        areaSqFt: Math.round(footprintWidth * 0.42 * footprintDepth * 0.35 * SQM_TO_SQFT),
        color: '#15803d',
        floorIndex: -1,
        isCustomDirective: true,
        customFeatureType: 'billiards',
      });
    }

    if (basementRooms.length === 0) {
      basementRooms.push({
        id: 'b-main',
        name: specs.basementPurpose || 'Subterranean Multi-Utility Hub',
        type: 'utility',
        x: -footprintWidth * 0.05,
        z: -footprintDepth * 0.05,
        width: footprintWidth * 0.65,
        depth: footprintDepth * 0.55,
        widthFt: Math.round(footprintWidth * 0.65 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.55 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.65 * footprintDepth * 0.55),
        areaSqFt: Math.round(footprintWidth * 0.65 * footprintDepth * 0.55 * SQM_TO_SQFT),
        color: '#334155',
        floorIndex: -1,
        vaastuZone: 'North-East Sub-Basin',
      });
    }

    basementRooms.push({
      id: 'b-plant',
      name: 'HVAC & Mechanical Plant',
      type: 'utility',
      x: footprintWidth * 0.32,
      z: footprintDepth * 0.3,
      width: footprintWidth * 0.28,
      depth: footprintDepth * 0.28,
      widthFt: Math.round(footprintWidth * 0.28 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.28 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.28 * footprintDepth * 0.28),
      areaSqFt: Math.round(footprintWidth * 0.28 * footprintDepth * 0.28 * SQM_TO_SQFT),
      color: '#1e293b',
      floorIndex: -1,
      vaastuZone: 'South-East (Agni)',
    });

    basementRooms.push({
      id: 'b-ramp',
      name: 'Vehicle Ramp & Access',
      type: 'hallway',
      x: -footprintWidth * 0.32,
      z: footprintDepth * 0.25,
      width: footprintWidth * 0.28,
      depth: footprintDepth * 0.32,
      widthFt: Math.round(footprintWidth * 0.28 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.32 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.28 * footprintDepth * 0.32),
      areaSqFt: Math.round(footprintWidth * 0.28 * footprintDepth * 0.32 * SQM_TO_SQFT),
      color: '#0f172a',
      floorIndex: -1,
    });

    if (specs.hasElevator) {
      basementRooms.push({
        id: 'b-elevator',
        name: 'Elevator Shaft',
        type: 'elevator',
        x: 0,
        z: -footprintDepth * 0.35,
        width: 1.8,
        depth: 1.8,
        widthFt: 6.0,
        depthFt: 6.0,
        areaSqM: 3.2,
        areaSqFt: 36,
        color: '#06b6d4',
        floorIndex: -1,
        vaastuZone: 'Central Core',
      });
    }

    layouts.push({
      floorIndex: -1,
      name: 'Basement Level (-1)',
      levelY: -floorHeight,
      height: floorHeight,
      areaSqM: bArea,
      areaSqFt: Math.round(bArea * SQM_TO_SQFT),
      rooms: basementRooms,
    });
  }

  // 2. GROUND FLOOR (0)
  const gConfig = getBHKConfigForFloor(0);
  const gRooms: RoomLayout[] = [
    {
      id: 'g-living',
      name: parsed.hasDoubleHeight ? 'Great Living Room (Double Height)' : 'Great Living Room & Foyer',
      type: 'living',
      x: isVaastu ? footprintWidth * 0.2 : -footprintWidth * 0.2,
      z: footprintDepth * 0.18,
      width: footprintWidth * 0.5,
      depth: footprintDepth * 0.42,
      widthFt: Math.round(footprintWidth * 0.5 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.42 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.5 * footprintDepth * 0.42),
      areaSqFt: Math.round(footprintWidth * 0.5 * footprintDepth * 0.42 * SQM_TO_SQFT),
      color: '#0284c7',
      floorIndex: 0,
      vaastuZone: 'East / North-East (Ishanya)',
      isCustomDirective: parsed.hasDoubleHeight,
      customFeatureType: parsed.hasDoubleHeight ? 'double_height' : undefined,
    },
    {
      id: 'g-kitchen',
      name: 'Modular Kitchen & Dining',
      type: 'kitchen',
      x: isVaastu ? footprintWidth * 0.26 : footprintWidth * 0.25,
      z: isVaastu ? -footprintDepth * 0.22 : footprintDepth * 0.2,
      width: footprintWidth * 0.38,
      depth: footprintDepth * 0.4,
      widthFt: Math.round(footprintWidth * 0.38 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.4 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.38 * footprintDepth * 0.4),
      areaSqFt: Math.round(footprintWidth * 0.38 * footprintDepth * 0.4 * SQM_TO_SQFT),
      color: '#0891b2',
      floorIndex: 0,
      vaastuZone: 'South-East (Agni Corner)',
    },
    {
      id: 'g-bed1',
      name: gConfig.bedrooms > 0 ? (isVaastu ? 'Master Bedroom (SW)' : 'Guest Suite / Bedroom') : 'Study / Home Office',
      type: 'master_bedroom',
      x: isVaastu ? -footprintWidth * 0.26 : -footprintWidth * 0.25,
      z: isVaastu ? -footprintDepth * 0.22 : -footprintDepth * 0.25,
      width: footprintWidth * 0.4,
      depth: footprintDepth * 0.38,
      widthFt: Math.round(footprintWidth * 0.4 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.38 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.4 * footprintDepth * 0.38),
      areaSqFt: Math.round(footprintWidth * 0.4 * footprintDepth * 0.38 * SQM_TO_SQFT),
      color: '#1d4ed8',
      floorIndex: 0,
      vaastuZone: 'South-West (Nairutya)',
    },
    {
      id: 'g-garage',
      name: specs.dedicatedSpaces.garage ? 'Enclosed Garage / EV Porch' : 'Veranda / Driveway',
      type: 'garage',
      x: isVaastu ? -footprintWidth * 0.28 : footprintWidth * 0.28,
      z: footprintDepth * 0.25,
      width: footprintWidth * 0.34,
      depth: footprintDepth * 0.38,
      widthFt: Math.round(footprintWidth * 0.34 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.38 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.34 * footprintDepth * 0.38),
      areaSqFt: Math.round(footprintWidth * 0.34 * footprintDepth * 0.38 * SQM_TO_SQFT),
      color: '#475569',
      floorIndex: 0,
      vaastuZone: 'North-West (Vayu)',
    },
  ];

  // Mandir / Pooja Room
  if (isVaastu || specs.dedicatedSpaces.poojaMeditation || parsed.hasMandir) {
    gRooms.push({
      id: 'g-pooja',
      name: 'Mandir / Pooja Meditation Sanctum',
      type: 'pooja',
      x: footprintWidth * 0.34,
      z: footprintDepth * 0.38,
      width: 2.4,
      depth: 2.4,
      widthFt: 7.9,
      depthFt: 7.9,
      areaSqM: 5.8,
      areaSqFt: 62,
      color: '#f59e0b',
      floorIndex: 0,
      vaastuZone: 'Pavitra North-East (Ishanya)',
      isCustomDirective: parsed.hasMandir,
      customFeatureType: 'mandir',
    });
  }

  // Swimming Pool (Requested from text box or dedicated spaces)
  if (parsed.hasPool || specs.dedicatedSpaces.swimmingPool) {
    gRooms.push({
      id: 'g-pool',
      name: 'Swimming Pool & Sun Deck',
      type: 'pool',
      x: footprintWidth * 0.28,
      z: -footprintDepth * 0.42,
      width: 5.6,
      depth: 3.4,
      widthFt: 18.4,
      depthFt: 11.2,
      areaSqM: 19.0,
      areaSqFt: 205,
      color: '#0284c7',
      floorIndex: 0,
      vaastuZone: 'North-East Water Basin',
      isCustomDirective: true,
      customFeatureType: 'pool',
    });
  }

  // Landscaped Courtyard / Garden
  if (parsed.hasCourtyard) {
    gRooms.push({
      id: 'g-courtyard',
      name: 'Landscaped Aangan Courtyard',
      type: 'garden',
      x: -footprintWidth * 0.32,
      z: 0,
      width: 3.5,
      depth: 3.5,
      widthFt: 11.5,
      depthFt: 11.5,
      areaSqM: 12.2,
      areaSqFt: 132,
      color: '#15803d',
      floorIndex: 0,
      vaastuZone: 'Central Nature Courtyard',
      isCustomDirective: true,
      customFeatureType: 'garden',
    });
  }

  // Bespoke room from custom text if not matched by standard keywords
  if (parsed.bespokeTitle) {
    gRooms.push({
      id: 'g-bespoke',
      name: parsed.bespokeTitle,
      type: 'custom',
      x: 0,
      z: footprintDepth * 0.36,
      width: footprintWidth * 0.38,
      depth: 2.8,
      widthFt: Math.round(footprintWidth * 0.38 * METERS_TO_FEET * 10) / 10,
      depthFt: 9.2,
      areaSqM: Math.round(footprintWidth * 0.38 * 2.8),
      areaSqFt: Math.round(footprintWidth * 0.38 * 2.8 * SQM_TO_SQFT),
      color: '#6366f1',
      floorIndex: 0,
      isCustomDirective: true,
      customFeatureType: 'custom',
      customNote: specs.customRequirements,
    });
  }

  // Elevator
  if (specs.hasElevator) {
    gRooms.push({
      id: 'g-elevator',
      name: 'Elevator Shaft',
      type: 'elevator',
      x: 0,
      z: -footprintDepth * 0.35,
      width: 1.8,
      depth: 1.8,
      widthFt: 6.0,
      depthFt: 6.0,
      areaSqM: 3.2,
      areaSqFt: 36,
      color: '#06b6d4',
      floorIndex: 0,
      vaastuZone: 'Central Core',
    });
  }

  const gArea = Math.round(footprintWidth * footprintDepth);
  layouts.push({
    floorIndex: 0,
    name: `Ground Floor (G) • ${gConfig.bhk}`,
    levelY: 0,
    height: floorHeight,
    areaSqM: gArea,
    areaSqFt: Math.round(gArea * SQM_TO_SQFT),
    rooms: gRooms,
  });

  // 3. UPPER FLOORS (1 to floorsCount - 1)
  for (let f = 1; f < specs.floorsCount; f++) {
    const levelY = f * floorHeight;
    const fConfig = getBHKConfigForFloor(f);
    const upperRooms: RoomLayout[] = [
      {
        id: `f${f}-master`,
        name: isVaastu ? 'Master Bedroom Suite (Nairutya)' : `Master Bedroom Suite (${fConfig.bhk})`,
        type: 'master_bedroom',
        x: -footprintWidth * 0.22,
        z: -footprintDepth * 0.2,
        width: footprintWidth * 0.46,
        depth: footprintDepth * 0.42,
        widthFt: Math.round(footprintWidth * 0.46 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.42 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.46 * footprintDepth * 0.42),
        areaSqFt: Math.round(footprintWidth * 0.46 * footprintDepth * 0.42 * SQM_TO_SQFT),
        color: '#1d4ed8',
        floorIndex: f,
        vaastuZone: 'South-West (Stability & Master)',
      },
      {
        id: `f${f}-balcony`,
        name: 'Cantilevered Balcony Deck',
        type: 'terrace',
        x: -footprintWidth * 0.22,
        z: footprintDepth * 0.48,
        width: footprintWidth * 0.44,
        depth: 1.8,
        widthFt: Math.round(footprintWidth * 0.44 * METERS_TO_FEET * 10) / 10,
        depthFt: 5.9,
        areaSqM: Math.round(footprintWidth * 0.44 * 1.8),
        areaSqFt: Math.round(footprintWidth * 0.44 * 1.8 * SQM_TO_SQFT),
        color: '#38bdf8',
        floorIndex: f,
        vaastuZone: 'East Facing Morning Prana',
      },
      {
        id: `f${f}-bed2`,
        name: fConfig.bedrooms >= 2 ? `Bedroom 2 (${fConfig.bhk})` : 'Private Study & Library',
        type: 'bedroom',
        x: footprintWidth * 0.25,
        z: footprintDepth * 0.2,
        width: footprintWidth * 0.4,
        depth: footprintDepth * 0.42,
        widthFt: Math.round(footprintWidth * 0.4 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.42 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.4 * footprintDepth * 0.42),
        areaSqFt: Math.round(footprintWidth * 0.4 * footprintDepth * 0.42 * SQM_TO_SQFT),
        color: '#3b82f6',
        floorIndex: f,
        vaastuZone: 'North / North-West (Vayu)',
      },
    ];

    // Determine 4th room on upper floor: Check if text box asked for Theater, Gym, Billiards, Bar, Office, or Spa!
    if (parsed.hasTheater && !specs.hasBasement) {
      upperRooms.push({
        id: `f${f}-theater`,
        name: 'Dolby Atmos Cinema Lounge',
        type: 'theater',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#4c1d95',
        floorIndex: f,
        isCustomDirective: true,
        customFeatureType: 'theater',
      });
    } else if (parsed.hasGym && !specs.hasBasement) {
      upperRooms.push({
        id: `f${f}-gym`,
        name: 'Upper Fitness & Cardio Studio',
        type: 'gym',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#047857',
        floorIndex: f,
        isCustomDirective: true,
        customFeatureType: 'gym',
      });
    } else if (parsed.hasBilliards) {
      upperRooms.push({
        id: `f${f}-billiards`,
        name: 'Billiards & Game Recreation Lounge',
        type: 'billiards',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#15803d',
        floorIndex: f,
        isCustomDirective: true,
        customFeatureType: 'billiards',
      });
    } else if (parsed.hasBar) {
      upperRooms.push({
        id: `f${f}-bar`,
        name: 'Cocktail Bar & Wine Lounge',
        type: 'bar',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#7c2d12',
        floorIndex: f,
        isCustomDirective: true,
        customFeatureType: 'bar',
      });
    } else if (parsed.hasOffice) {
      upperRooms.push({
        id: `f${f}-office`,
        name: 'Executive Home Office & Library',
        type: 'office',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#0e7490',
        floorIndex: f,
        isCustomDirective: true,
        customFeatureType: 'office',
      });
    } else {
      upperRooms.push({
        id: `f${f}-lounge`,
        name: fConfig.bedrooms >= 3 ? 'Bedroom 3 / Children Suite' : 'Family Media Lounge',
        type: fConfig.bedrooms >= 3 ? 'bedroom' : 'living',
        x: 0,
        z: -footprintDepth * 0.22,
        width: footprintWidth * 0.82,
        depth: footprintDepth * 0.36,
        widthFt: Math.round(footprintWidth * 0.82 * METERS_TO_FEET * 10) / 10,
        depthFt: Math.round(footprintDepth * 0.36 * METERS_TO_FEET * 10) / 10,
        areaSqM: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36),
        areaSqFt: Math.round(footprintWidth * 0.82 * footprintDepth * 0.36 * SQM_TO_SQFT),
        color: '#0e7490',
        floorIndex: f,
        vaastuZone: 'Central Brahmasthan Buffer',
      });
    }

    if (specs.hasElevator) {
      upperRooms.push({
        id: `f${f}-elevator`,
        name: 'Elevator Shaft',
        type: 'elevator',
        x: 0,
        z: -footprintDepth * 0.35,
        width: 1.8,
        depth: 1.8,
        widthFt: 6.0,
        depthFt: 6.0,
        areaSqM: 3.2,
        areaSqFt: 36,
        color: '#06b6d4',
        floorIndex: f,
        vaastuZone: 'Central Core',
      });
    }

    const uArea = Math.round(footprintWidth * footprintDepth * 0.95);
    layouts.push({
      floorIndex: f,
      name: `Floor ${f} (G+${f}) • ${fConfig.bhk}`,
      levelY,
      height: floorHeight,
      areaSqM: uArea,
      areaSqFt: Math.round(uArea * SQM_TO_SQFT),
      rooms: upperRooms,
    });
  }

  // 4. ROOF TERRACE
  const roofY = specs.floorsCount * floorHeight;
  const rArea = Math.round(footprintWidth * footprintDepth * 0.9);
  const roofRooms: RoomLayout[] = [];

  // Rooftop Helipad (if requested)
  if (parsed.hasHelipad) {
    roofRooms.push({
      id: 'roof-helipad',
      name: 'Rooftop Aviation Helipad',
      type: 'helipad',
      x: 0,
      z: 0,
      width: Math.min(footprintWidth * 0.85, 9.0),
      depth: Math.min(footprintDepth * 0.85, 9.0),
      widthFt: Math.round(Math.min(footprintWidth * 0.85, 9.0) * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(Math.min(footprintDepth * 0.85, 9.0) * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(Math.min(footprintWidth * 0.85, 9.0) * Math.min(footprintDepth * 0.85, 9.0)),
      areaSqFt: Math.round(Math.min(footprintWidth * 0.85, 9.0) * Math.min(footprintDepth * 0.85, 9.0) * SQM_TO_SQFT),
      color: '#0284c7',
      floorIndex: specs.floorsCount,
      isCustomDirective: true,
      customFeatureType: 'helipad',
    });
  }

  // Gazebo / Pergola Sky Lounge (if requested or configured)
  if (parsed.hasGazebo || specs.dedicatedSpaces.terraceGarden) {
    roofRooms.push({
      id: 'roof-gazebo',
      name: 'Rooftop Pergola & Gazebo Lounge',
      type: 'gazebo',
      x: parsed.hasHelipad ? footprintWidth * 0.25 : 0,
      z: parsed.hasHelipad ? footprintDepth * 0.25 : 0,
      width: parsed.hasHelipad ? 4.2 : footprintWidth * 0.85,
      depth: parsed.hasHelipad ? 4.2 : footprintDepth * 0.8,
      widthFt: Math.round((parsed.hasHelipad ? 4.2 : footprintWidth * 0.85) * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round((parsed.hasHelipad ? 4.2 : footprintDepth * 0.8) * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round((parsed.hasHelipad ? 4.2 : footprintWidth * 0.85) * (parsed.hasHelipad ? 4.2 : footprintDepth * 0.8)),
      areaSqFt: Math.round((parsed.hasHelipad ? 4.2 : footprintWidth * 0.85) * (parsed.hasHelipad ? 4.2 : footprintDepth * 0.8) * SQM_TO_SQFT),
      color: '#047857',
      floorIndex: specs.floorsCount,
      vaastuZone: 'Open Sky Solar Deck',
      isCustomDirective: true,
      customFeatureType: 'gazebo',
    });
  }

  if (roofRooms.length === 0) {
    roofRooms.push({
      id: 'roof-deck',
      name: 'Sky Observation Deck & Solar Field',
      type: 'terrace',
      x: 0,
      z: 0,
      width: footprintWidth * 0.9,
      depth: footprintDepth * 0.85,
      widthFt: Math.round(footprintWidth * 0.9 * METERS_TO_FEET * 10) / 10,
      depthFt: Math.round(footprintDepth * 0.85 * METERS_TO_FEET * 10) / 10,
      areaSqM: Math.round(footprintWidth * 0.9 * footprintDepth * 0.85),
      areaSqFt: Math.round(footprintWidth * 0.9 * footprintDepth * 0.85 * SQM_TO_SQFT),
      color: '#047857',
      floorIndex: specs.floorsCount,
      vaastuZone: 'Open Sky Solar Deck',
    });
  }

  layouts.push({
    floorIndex: specs.floorsCount,
    name: 'Roof Terrace & Sky Deck',
    levelY: roofY,
    height: 1.2,
    areaSqM: rArea,
    areaSqFt: Math.round(rArea * SQM_TO_SQFT),
    rooms: roofRooms,
  });

  return layouts;
}

export function buildCompleteArchitecture(specs: BuildingSpecs): ArchitectureModelData {
  const plot = calculatePlotArea(
    specs.plotDimensions.width, 
    specs.plotDimensions.depth, 
    specs.unitSystem, 
    specs.plotShape
  );
  
  const footprint = calculateBuildableFootprint(
    specs.plotDimensions.width,
    specs.plotDimensions.depth,
    specs.setbacks.front,
    specs.setbacks.rear,
    specs.setbacks.side,
    specs.unitSystem
  );

  const parsed = parseCustomRequirements(specs.customRequirements);
  const builtUp = calculateTotalBuiltUpArea(footprint.footprintAreaM2, specs.floorsCount, specs.hasBasement);
  const boqData = generateBillOfQuantities(builtUp.totalM2, specs.floorsCount, specs.hasBasement, specs.hasElevator);
  const floors = generateFloorLayouts(specs, footprint.footprintWidthM, footprint.footprintDepthM);

  return {
    specs,
    plotAreaM2: plot.areaM2,
    plotAreaSqFt: plot.areaSqFt,
    footprintWidthM: footprint.footprintWidthM,
    footprintDepthM: footprint.footprintDepthM,
    footprintWidthFt: footprint.footprintWidthFt,
    footprintDepthFt: footprint.footprintDepthFt,
    footprintAreaM2: footprint.footprintAreaM2,
    footprintAreaSqFt: footprint.footprintAreaSqFt,
    totalBuiltUpAreaM2: builtUp.totalM2,
    totalBuiltUpAreaSqFt: builtUp.totalSqFt,
    floors,
    boq: boqData.items,
    totalCostINR: boqData.totalINR,
    totalCostUSD: boqData.totalUSD,
    customDirectives: parsed.directives,
    daylightInfo: {
      orientation: specs.vaastuCompliant ? 'Vedic East-Facing Solar Prana Orientation' : 'North-East Primary Glazing Vector',
      optimalSolarGain: 'Passive solar heating in winter with deep eave summer shading & cross ventilation',
    },
  };
}

export function calculateSunPosition(hourDecimal: number, compassHeadingDeg: number = 0): {
  x: number;
  y: number;
  z: number;
  intensity: number;
  skyColor: string;
  sunColor: string;
  groundColor: string;
  ambientIntensity: number;
  periodLabel: string;
} {
  const clampedHour = Math.max(0, Math.min(24, hourDecimal));
  const sunAngle = ((clampedHour - 6) / 12) * Math.PI;
  
  const distance = 80;
  const altitude = Math.sin(sunAngle);
  const azimuth = Math.cos(sunAngle);

  const compassRad = (compassHeadingDeg * Math.PI) / 180;
  const rotX = azimuth * Math.cos(compassRad) - 0.2 * Math.sin(compassRad);
  const rotZ = azimuth * Math.sin(compassRad) + 0.2 * Math.cos(compassRad);

  const x = rotX * distance;
  const y = Math.max(-10, altitude * distance);
  const z = rotZ * distance;

  if (clampedHour < 5 || clampedHour > 20) {
    return {
      x, y: 15, z,
      intensity: 0.15,
      skyColor: '#070b14',
      sunColor: '#93c5fd',
      groundColor: '#030712',
      ambientIntensity: 0.2,
      periodLabel: 'Night / Moonlight',
    };
  } else if (clampedHour >= 5 && clampedHour < 7.5) {
    return {
      x, y: Math.max(5, y), z,
      intensity: 1.1,
      skyColor: '#1e293b',
      sunColor: '#fdba74',
      groundColor: '#0f172a',
      ambientIntensity: 0.45,
      periodLabel: 'Golden Dawn (Low Angle)',
    };
  } else if (clampedHour >= 7.5 && clampedHour < 16.5) {
    const isPeakNoon = Math.abs(clampedHour - 12) < 2;
    return {
      x, y: Math.max(25, y), z,
      intensity: isPeakNoon ? 2.2 : 1.9,
      skyColor: '#0f172a',
      sunColor: '#fffbeb',
      groundColor: '#1e293b',
      ambientIntensity: 0.7,
      periodLabel: isPeakNoon ? 'Peak Midday Solar Noon' : 'Bright Daylight',
    };
  } else {
    return {
      x, y: Math.max(4, y), z,
      intensity: 1.2,
      skyColor: '#1e1b4b',
      sunColor: '#f97316',
      groundColor: '#0c0a09',
      ambientIntensity: 0.4,
      periodLabel: 'Golden Sunset (Long Shadows)',
    };
  }
}
