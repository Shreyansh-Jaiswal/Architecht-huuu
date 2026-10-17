import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlotArea,
  calculateBuildableFootprint,
  calculateTotalBuiltUpArea,
  generateBillOfQuantities,
  calculateSunPosition,
  convertUnits,
  buildCompleteArchitecture,
} from './architectureRules.ts';
import type { BuildingSpecs } from '../types/architect.ts';

test('calculatePlotArea calculates square meters and square feet with plotShape', () => {
  const rect = calculatePlotArea(16, 22, 'meters', 'rectangular');
  assert.equal(rect.areaM2, 352);

  const lShaped = calculatePlotArea(16, 22, 'meters', 'l_shaped');
  assert.ok(lShaped.areaM2 < rect.areaM2);
});

test('calculateBuildableFootprint correctly enforces setbacks', () => {
  const footprint = calculateBuildableFootprint(16, 22, 3.5, 2.5, 2.0, 'meters');
  assert.equal(footprint.footprintWidthM, 12);
  assert.equal(footprint.footprintDepthM, 16);
  assert.equal(footprint.footprintAreaM2, 192);
  assert.ok(footprint.footprintWidthFt > 39);
});

test('generateBillOfQuantities includes elevator line item when hasElevator is true', () => {
  const boqWithout = generateBillOfQuantities(384, 2, true, false);
  const boqWith = generateBillOfQuantities(384, 2, true, true);

  assert.ok(boqWith.items.some(i => i.id === 'elevator_system'));
  assert.ok(!boqWithout.items.some(i => i.id === 'elevator_system'));
  assert.ok(boqWith.totalINR > boqWithout.totalINR);
});

test('buildCompleteArchitecture includes Vaastu zones and per-floor BHK rooms', () => {
  const sampleSpecs: BuildingSpecs = {
    buildingType: 'house',
    unitSystem: 'meters',
    plotDimensions: { width: 16, depth: 22 },
    plotShape: 'rectangular',
    setbacks: { front: 3.5, rear: 2.5, side: 2.0 },
    floorsKey: 'G+1',
    floorsCount: 2,
    ceilingHeight: 3.2,
    ceilingHeightLabel: '3.2 meters (Spacious Luxury)',
    architecturalStyle: 'Modern Minimalist',
    bedrooms: 3,
    bathrooms: 3,
    kitchens: 1,
    dedicatedSpaces: {
      homeOffice: true,
      garage: true,
      swimmingPool: false,
      terraceGarden: true,
      poojaMeditation: true,
    },
    hasBasement: true,
    basementPurpose: 'Home Theater & Lounge',
    hasElevator: true,
    elevatorType: 'Panoramic Glass',
    vaastuCompliant: true,
    floorBHKConfigs: [
      { floorIndex: 0, floorLabel: 'Ground Floor (G)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
      { floorIndex: 1, floorLabel: 'Floor 1 (G+1)', bhk: '3 BHK', bedrooms: 3, bathrooms: 3, kitchens: 1 },
    ],
    windowDirections: { north: true, south: true, east: true, west: false },
    balconyDirections: { north: false, south: false, east: true, west: false },
    customRequirements: 'Vaastu pooja room in NE',
  };

  const model = buildCompleteArchitecture(sampleSpecs);
  assert.equal(model.floors.length, 4); // Basement (-1), Ground (0), Floor 1 (1), Roof Terrace (2)
  const groundFloor = model.floors.find(f => f.floorIndex === 0);
  assert.ok(groundFloor);
  assert.ok(groundFloor.rooms.some(r => r.type === 'elevator'));
  assert.ok(groundFloor.rooms.some(r => r.type === 'pooja'));
});

test('buildCompleteArchitecture parses custom natural language textbox input into rooms', () => {
  const specsWithText: BuildingSpecs = {
    buildingType: 'house',
    unitSystem: 'feet',
    plotDimensions: { width: 50, depth: 70 },
    plotShape: 'corner',
    setbacks: { front: 12, rear: 8, side: 6 },
    floorsKey: 'G+1',
    floorsCount: 2,
    ceilingHeight: 3.2,
    ceilingHeightLabel: '10.5 ft',
    architecturalStyle: 'Contemporary Glass',
    bedrooms: 3,
    bathrooms: 3,
    kitchens: 1,
    dedicatedSpaces: { homeOffice: false, garage: true, swimmingPool: false, terraceGarden: false, poojaMeditation: false },
    hasBasement: false,
    basementPurpose: '',
    hasElevator: true,
    elevatorType: 'Panoramic Glass',
    vaastuCompliant: false,
    floorBHKConfigs: [
      { floorIndex: 0, floorLabel: 'Ground Floor (G)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
      { floorIndex: 1, floorLabel: 'Floor 1 (G+1)', bhk: '3 BHK', bedrooms: 3, bathrooms: 3, kitchens: 1 },
    ],
    windowDirections: { north: true, south: true, east: true, west: true },
    balconyDirections: { north: false, south: true, east: true, west: false },
    customRequirements: 'Need a swimming pool in the backyard, dolby theater on upper floor, and helipad on roof',
  };

  const model = buildCompleteArchitecture(specsWithText);
  const ground = model.floors.find(f => f.floorIndex === 0);
  const upper = model.floors.find(f => f.floorIndex === 1);
  const roof = model.floors.find(f => f.floorIndex === 2);

  assert.ok(ground?.rooms.some(r => r.type === 'pool'), 'Pool should be in ground floor rooms');
  assert.ok(upper?.rooms.some(r => r.type === 'theater'), 'Theater should be in upper floor rooms');
  assert.ok(roof?.rooms.some(r => r.type === 'helipad'), 'Helipad should be in roof rooms');
  assert.ok(model.customDirectives.length >= 3, 'All 3 directives should be recognized');
});
