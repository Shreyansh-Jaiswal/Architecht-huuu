/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { SpecificationsPage } from './components/SpecificationsPage.tsx';
import { Viewer3DPage } from './components/Viewer3DPage.tsx';
import { PromptModal } from './components/PromptModal.tsx';
import { BuildingSpecs, BuildingType, ArchitectureModelData } from './types/architect.ts';
import { buildCompleteArchitecture } from './utils/architectureRules.ts';

const DEFAULT_SPECS: BuildingSpecs = {
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
  elevatorType: 'Panoramic Glass Elevator',
  vaastuCompliant: true,
  floorBHKConfigs: [
    { floorIndex: 0, floorLabel: 'Ground Floor (G)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
    { floorIndex: 1, floorLabel: 'Floor 1 (G+1)', bhk: '3 BHK', bedrooms: 3, bathrooms: 3, kitchens: 1 },
  ],
  windowDirections: { north: true, south: true, east: true, west: false },
  balconyDirections: { north: false, south: false, east: true, west: false },
  customRequirements: 'Ground floor pe open living hall and kitchen chahiye, master bedroom on first floor with east facing balcony for morning sun. Vaastu rules strictly follow hone chahiye.',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'specs' | 'viewer'>('landing');
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType>('house');
  const [specs, setSpecs] = useState<BuildingSpecs>(DEFAULT_SPECS);
  const [architectureData, setArchitectureData] = useState<ArchitectureModelData>(() =>
    buildCompleteArchitecture(DEFAULT_SPECS)
  );
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);

  // When user selects a project type from landing page cards
  const handleSelectBuildingType = (type: BuildingType) => {
    setSelectedBuildingType(type);
    let updatedSpecs = { ...specs, buildingType: type };
    if (type === 'office') {
      updatedSpecs = {
        ...updatedSpecs,
        floorsKey: 'G+3',
        floorsCount: 4,
        ceilingHeight: 3.6,
        ceilingHeightLabel: '3.6 meters (High Ceiling / Duplex)',
        architecturalStyle: 'Contemporary Glass',
        hasBasement: true,
        basementPurpose: 'Underground Parking & EV Station',
      };
    } else if (type === 'apartment') {
      updatedSpecs = {
        ...updatedSpecs,
        floorsKey: 'G+4',
        floorsCount: 5,
        ceilingHeight: 3.0,
        architecturalStyle: 'Modern Minimalist',
        hasBasement: true,
        basementPurpose: 'Underground Parking & EV Station',
      };
    }
    setSpecs(updatedSpecs);
    setCurrentTab('specs');
  };

  // When user clicks "Generate Architecture & 3D Blueprint" on Specifications page
  const handleGenerateArchitecture = (newSpecs: BuildingSpecs) => {
    setSpecs(newSpecs);
    const computedModel = buildCompleteArchitecture(newSpecs);
    setArchitectureData(computedModel);
    setCurrentTab('viewer');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
      />

      {/* Main Content Router */}
      <div className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onSelectBuildingType={handleSelectBuildingType}
            onOpenPromptModal={() => setIsPromptModalOpen(true)}
          />
        )}

        {currentTab === 'specs' && (
          <SpecificationsPage
            initialType={selectedBuildingType}
            onGenerate={handleGenerateArchitecture}
            onBackToLanding={() => setCurrentTab('landing')}
          />
        )}

        {currentTab === 'viewer' && (
          <Viewer3DPage
            data={architectureData}
            onModifySpecs={() => setCurrentTab('specs')}
          />
        )}
      </div>

      {/* Google Stitch & AI Studio Master Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />
    </div>
  );
}
