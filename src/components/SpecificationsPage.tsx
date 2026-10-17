import React, { useState } from 'react';
import { 
  Ruler, 
  Layers, 
  Minus, 
  Plus, 
  ChevronDown, 
  Sparkles, 
  Compass, 
  Warehouse, 
  Sun, 
  Wind, 
  ArrowRight,
  ShieldCheck,
  Check,
  Building,
  CheckCircle2,
  Box,
  Flame,
  ArrowUpCircle,
  HelpCircle
} from 'lucide-react';
import { 
  BuildingSpecs, 
  BuildingType, 
  UnitSystem, 
  PlotShape, 
  FloorBHKConfig 
} from '../types/architect.ts';
import { 
  calculatePlotArea, 
  calculateBuildableFootprint, 
  calculateTotalBuiltUpArea 
} from '../utils/architectureRules.ts';

interface SpecificationsPageProps {
  initialType: BuildingType;
  onGenerate: (specs: BuildingSpecs) => void;
  onBackToLanding: () => void;
}

export const SpecificationsPage: React.FC<SpecificationsPageProps> = ({ 
  initialType, 
  onGenerate,
  onBackToLanding 
}) => {
  // Unit System (Meters or Feet)
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('meters');

  // Section 1: Plot Dimensions, Shape & Setbacks
  const [plotShape, setPlotShape] = useState<PlotShape>('rectangular');
  const [plotWidthM, setPlotWidthM] = useState<number>(16);
  const [plotDepthM, setPlotDepthM] = useState<number>(22);
  const [plotWidthFt, setPlotWidthFt] = useState<number>(52);
  const [plotDepthFt, setPlotDepthFt] = useState<number>(72);

  const [frontSetbackM, setFrontSetbackM] = useState<string>('3.5');
  const [rearSetbackM, setRearSetbackM] = useState<string>('2.5');
  const [sideClearanceM, setSideClearanceM] = useState<string>('2');

  const [frontSetbackFt, setFrontSetbackFt] = useState<string>('11.5');
  const [rearSetbackFt, setRearSetbackFt] = useState<string>('8.2');
  const [sideClearanceFt, setSideClearanceFt] = useState<string>('6.6');

  // Section 2: Floors & Structural Program
  const [floorsKey, setFloorsKey] = useState<'G' | 'G+1' | 'G+2' | 'G+3' | 'G+4'>('G+1');
  const [ceilingHeight, setCeilingHeight] = useState<number>(3.2); // in meters
  const [architecturalStyle, setArchitecturalStyle] = useState<string>('Modern Minimalist');

  // Per-Floor BHK Customization
  const [floorBHKs, setFloorBHKs] = useState<FloorBHKConfig[]>([
    { floorIndex: 0, floorLabel: 'Ground Floor (G)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
    { floorIndex: 1, floorLabel: 'Floor 1 (G+1)', bhk: '3 BHK', bedrooms: 3, bathrooms: 3, kitchens: 1 },
    { floorIndex: 2, floorLabel: 'Floor 2 (G+2)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
    { floorIndex: 3, floorLabel: 'Floor 3 (G+3)', bhk: '2 BHK', bedrooms: 2, bathrooms: 2, kitchens: 1 },
    { floorIndex: 4, floorLabel: 'Floor 4 (G+4)', bhk: '1 BHK', bedrooms: 1, bathrooms: 1, kitchens: 1 },
  ]);

  const [activeBHKFloorTab, setActiveBHKFloorTab] = useState<number>(0);

  const [dedicatedSpaces, setDedicatedSpaces] = useState({
    homeOffice: true,
    garage: true,
    swimmingPool: false,
    terraceGarden: true,
    poojaMeditation: true,
  });

  // Section 3: Basement Feature
  const [hasBasement, setHasBasement] = useState<boolean>(true);
  const [basementPurpose, setBasementPurpose] = useState<string>('Home Theater & Lounge');

  // Section 4: Elevator / Lift Option
  const [hasElevator, setHasElevator] = useState<boolean>(true);
  const [elevatorType, setElevatorType] = useState<string>('Panoramic Glass Elevator');

  // Section 5: Vaastu Shastra Compliance
  const [vaastuCompliant, setVaastuCompliant] = useState<boolean>(true);

  // Section 6: Orientation & Openings
  const [windowDirections, setWindowDirections] = useState({
    north: true,
    south: true,
    east: true,
    west: false,
  });
  const [balconyDirections, setBalconyDirections] = useState({
    north: false,
    south: false,
    east: true,
    west: false,
  });

  // Section 7: Custom Language Input
  const [customRequirements, setCustomRequirements] = useState<string>(
    'Ground floor pe open living hall and kitchen chahiye, master bedroom on first floor with east facing balcony for morning sun. Vaastu rules strictly follow hone chahiye.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Map floor key to numeric count
  const getFloorsCount = (key: 'G' | 'G+1' | 'G+2' | 'G+3' | 'G+4'): number => {
    switch (key) {
      case 'G': return 1;
      case 'G+1': return 2;
      case 'G+2': return 3;
      case 'G+3': return 4;
      case 'G+4': return 5;
    }
  };

  const getFloorsSubtext = (key: 'G' | 'G+1' | 'G+2' | 'G+3' | 'G+4'): string => {
    switch (key) {
      case 'G': return '1 Storey Structure';
      case 'G+1': return '2 Storey Structure';
      case 'G+2': return '3 Storey Structure';
      case 'G+3': return '4 Storey Structure';
      case 'G+4': return '5 Storey Structure';
    }
  };

  // Convert unit change
  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === unitSystem) return;
    setUnitSystem(newUnit);
  };

  const currentWidth = unitSystem === 'feet' ? plotWidthFt : plotWidthM;
  const currentDepth = unitSystem === 'feet' ? plotDepthFt : plotDepthM;
  const currentFront = unitSystem === 'feet' ? parseFloat(frontSetbackFt) || 0 : parseFloat(frontSetbackM) || 0;
  const currentRear = unitSystem === 'feet' ? parseFloat(rearSetbackFt) || 0 : parseFloat(rearSetbackM) || 0;
  const currentSide = unitSystem === 'feet' ? parseFloat(sideClearanceFt) || 0 : parseFloat(sideClearanceM) || 0;

  // Live calculations
  const plotCalc = calculatePlotArea(currentWidth, currentDepth, unitSystem, plotShape);
  const footprint = calculateBuildableFootprint(currentWidth, currentDepth, currentFront, currentRear, currentSide, unitSystem);
  const builtUp = calculateTotalBuiltUpArea(footprint.footprintAreaM2, getFloorsCount(floorsKey), hasBasement);

  // Update specific floor BHK
  const updateFloorBHK = (fIndex: number, newBhk: string) => {
    let beds = 2;
    let baths = 2;
    let kits = 1;
    if (newBhk === '1 BHK') { beds = 1; baths = 1; kits = 1; }
    else if (newBhk === '2 BHK') { beds = 2; baths = 2; kits = 1; }
    else if (newBhk === '3 BHK') { beds = 3; baths = 3; kits = 1; }
    else if (newBhk === '4 BHK') { beds = 4; baths = 4; kits = 1; }
    else if (newBhk === 'Studio / Penthouse') { beds = 1; baths = 2; kits = 1; }

    setFloorBHKs(prev => prev.map(f => f.floorIndex === fIndex ? {
      ...f,
      bhk: newBhk,
      bedrooms: beds,
      bathrooms: baths,
      kitchens: kits,
    } : f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const activeFloorsCount = getFloorsCount(floorsKey);
    const totalBeds = floorBHKs.slice(0, activeFloorsCount).reduce((acc, f) => acc + f.bedrooms, 0);
    const totalBaths = floorBHKs.slice(0, activeFloorsCount).reduce((acc, f) => acc + f.bathrooms, 0);

    const ceilingLabel = unitSystem === 'feet'
      ? `${(ceilingHeight * 3.28084).toFixed(1)} ft (${ceilingHeight === 3.2 ? 'Spacious Luxury' : 'Headroom'})`
      : `${ceilingHeight} meters (${ceilingHeight === 3.2 ? 'Spacious Luxury' : 'Headroom'})`;

    const specs: BuildingSpecs = {
      buildingType: initialType,
      unitSystem,
      plotDimensions: { width: currentWidth, depth: currentDepth },
      plotShape,
      setbacks: { front: currentFront, rear: currentRear, side: currentSide },
      floorsKey,
      floorsCount: activeFloorsCount,
      ceilingHeight,
      ceilingHeightLabel: ceilingLabel,
      architecturalStyle,
      bedrooms: totalBeds,
      bathrooms: totalBaths,
      kitchens: 1,
      dedicatedSpaces,
      hasBasement,
      basementPurpose,
      hasElevator,
      elevatorType,
      vaastuCompliant,
      floorBHKConfigs: floorBHKs.slice(0, activeFloorsCount),
      windowDirections,
      balconyDirections,
      customRequirements,
    };

    setTimeout(() => {
      setIsGenerating(false);
      onGenerate(specs);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header / Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLanding}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              ← Back to Project Categories
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
              {initialType.toUpperCase()} ARCHITECTURAL SPECIFICATIONS
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NBC 2016 & Vaastu Engine Active</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PLOT DIMENSIONS, LAND SHAPE & REGULATORY SETBACKS */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 text-cyan-400">
                  <Ruler className="w-6 h-6 rotate-[-45deg] text-cyan-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  1. Plot Dimensions & Regulatory Setbacks
                </h2>
              </div>

              {/* Unit Switcher Button Group */}
              <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('meters')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    unitSystem === 'meters'
                      ? 'bg-cyan-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Meters (m)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('feet')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    unitSystem === 'feet'
                      ? 'bg-cyan-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Feet (ft)
                </button>
              </div>
            </div>

            {/* Shape of Land Selection (Requested Feature 1) */}
            <div className="mb-6 p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>Shape of the Land / Plot Geometry</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'rectangular' as PlotShape, label: 'Rectangular', desc: 'Standard 1:1.4' },
                  { id: 'square' as PlotShape, label: 'Square', desc: 'Equilateral 1:1' },
                  { id: 'corner' as PlotShape, label: 'Corner Plot', desc: 'Dual Road Access' },
                  { id: 'l_shaped' as PlotShape, label: 'L-Shaped', desc: 'Flagship Cutout' },
                  { id: 'irregular' as PlotShape, label: 'Irregular', desc: 'Trapezoidal Angle' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPlotShape(s.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      plotShape === s.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders and Calculated Plot Area Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              <div className="lg:col-span-8 space-y-6">
                {/* Plot Width Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">
                      Plot Width ({unitSystem === 'meters' ? 'meters' : 'feet'})
                    </span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {unitSystem === 'meters' ? `${plotWidthM} m` : `${plotWidthFt} ft`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={unitSystem === 'meters' ? 8 : 25}
                    max={unitSystem === 'meters' ? 60 : 200}
                    value={unitSystem === 'meters' ? plotWidthM : plotWidthFt}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (unitSystem === 'meters') {
                        setPlotWidthM(val);
                        setPlotWidthFt(Math.round(val * 3.28084));
                      } else {
                        setPlotWidthFt(val);
                        setPlotWidthM(Math.round(val * 0.3048));
                      }
                    }}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="text-xs text-slate-400 mt-1.5">Site street frontage dimension</div>
                </div>

                {/* Plot Depth Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200">
                      Plot Depth ({unitSystem === 'meters' ? 'meters' : 'feet'})
                    </span>
                    <span className="text-base font-bold text-cyan-400 font-mono">
                      {unitSystem === 'meters' ? `${plotDepthM} m` : `${plotDepthFt} ft`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={unitSystem === 'meters' ? 10 : 35}
                    max={unitSystem === 'meters' ? 80 : 260}
                    value={unitSystem === 'meters' ? plotDepthM : plotDepthFt}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (unitSystem === 'meters') {
                        setPlotDepthM(val);
                        setPlotDepthFt(Math.round(val * 3.28084));
                      } else {
                        setPlotDepthFt(val);
                        setPlotDepthM(Math.round(val * 0.3048));
                      }
                    }}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="text-xs text-slate-400 mt-1.5">Site depth from road to boundary</div>
                </div>
              </div>

              {/* Calculated Plot Area Card (Consistent Unit Display) */}
              <div className="lg:col-span-4">
                <div className="p-6 rounded-2xl bg-[#070b14] border border-cyan-950/70 shadow-inner">
                  <div className="text-xs text-slate-400 font-medium">Calculated Plot Area</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    {unitSystem === 'feet' ? (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#22c55e] font-mono tracking-tight">
                          {plotCalc.areaSqFt.toLocaleString()} sq.ft
                        </span>
                        <span className="text-sm text-slate-400 font-mono">
                          ({plotCalc.areaM2} m²)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#22c55e] font-mono tracking-tight">
                          {plotCalc.areaM2} m²
                        </span>
                        <span className="text-sm text-slate-400 font-mono">
                          ({plotCalc.areaSqFt.toLocaleString()} sq.ft)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1 capitalize">
                    {plotShape} Boundary geometry
                  </div>
                </div>
              </div>
            </div>

            {/* Setbacks Inputs Row (With Synchronized Unit System) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-800/80">
              {/* Front Setback */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Front Setback ({unitSystem === 'feet' ? 'feet' : 'meters'})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={unitSystem === 'feet' ? frontSetbackFt : frontSetbackM}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (unitSystem === 'feet') {
                      setFrontSetbackFt(val);
                      setFrontSetbackM((parseFloat(val) * 0.3048).toFixed(1));
                    } else {
                      setFrontSetbackM(val);
                      setFrontSetbackFt((parseFloat(val) * 3.28084).toFixed(1));
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#070b14] border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
                <div className="text-[11px] text-slate-400 mt-1.5">
                  {unitSystem === 'feet' ? 'Min 10.0 ft per NBC 2016 code' : 'Min 3.0m per NBC 2016 code'}
                </div>
              </div>

              {/* Rear Setback */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Rear Setback ({unitSystem === 'feet' ? 'feet' : 'meters'})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={unitSystem === 'feet' ? rearSetbackFt : rearSetbackM}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (unitSystem === 'feet') {
                      setRearSetbackFt(val);
                      setRearSetbackM((parseFloat(val) * 0.3048).toFixed(1));
                    } else {
                      setRearSetbackM(val);
                      setRearSetbackFt((parseFloat(val) * 3.28084).toFixed(1));
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#070b14] border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Provides natural rear airflow
                </div>
              </div>

              {/* Side Clearances */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Side Clearances ({unitSystem === 'feet' ? 'feet' : 'meters'})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={unitSystem === 'feet' ? sideClearanceFt : sideClearanceM}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (unitSystem === 'feet') {
                      setSideClearanceFt(val);
                      setSideClearanceM((parseFloat(val) * 0.3048).toFixed(1));
                    } else {
                      setSideClearanceM(val);
                      setSideClearanceFt((parseFloat(val) * 3.28084).toFixed(1));
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#070b14] border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Fire access & side windows
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FLOORS & STRUCTURAL PROGRAM */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 text-cyan-400">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                2. Floors & Structural Program
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Number of Floors */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Number of Floors
                </label>
                <div className="flex items-center gap-1.5">
                  {(['G', 'G+1', 'G+2', 'G+3', 'G+4'] as const).map((key) => {
                    const isSelected = floorsKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFloorsKey(key)}
                        className={`min-w-[42px] px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950 shadow-md scale-105'
                            : 'bg-[#070b14] text-slate-300 border border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {getFloorsSubtext(floorsKey)}
                </div>
              </div>

              {/* Ceiling Height (Synchronized unit) */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Ceiling Headroom ({unitSystem === 'feet' ? 'ft' : 'm'})
                </label>
                <div className="relative">
                  <select
                    value={ceilingHeight}
                    onChange={(e) => setCeilingHeight(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs font-semibold text-white appearance-none focus:outline-none focus:border-cyan-400 pr-10 cursor-pointer"
                  >
                    {unitSystem === 'feet' ? (
                      <>
                        <option value={2.8}>9.2 ft (Compact Standard)</option>
                        <option value={3.0}>9.8 ft (Residential Standard)</option>
                        <option value={3.2}>10.5 ft (Spacious Luxury)</option>
                        <option value={3.6}>11.8 ft (High Ceiling / Duplex)</option>
                        <option value={4.0}>13.1 ft (Monumental Commercial)</option>
                      </>
                    ) : (
                      <>
                        <option value={2.8}>2.8 meters (Compact Standard)</option>
                        <option value={3.0}>3.0 meters (Residential Standard)</option>
                        <option value={3.2}>3.2 meters (Spacious Luxury)</option>
                        <option value={3.6}>3.6 meters (High Ceiling / Duplex)</option>
                        <option value={4.0}>4.0 meters (Monumental Commercial)</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <div className="text-xs text-slate-400 mt-1.5">Clear vertical span</div>
              </div>

              {/* Architectural Style */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Architectural Style
                </label>
                <div className="relative">
                  <select
                    value={architecturalStyle}
                    onChange={(e) => setArchitecturalStyle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs font-semibold text-white appearance-none focus:outline-none focus:border-cyan-400 pr-10 cursor-pointer"
                  >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Contemporary Glass">Contemporary Glass</option>
                    <option value="Brutalist Concrete">Brutalist Concrete</option>
                    <option value="Classic Colonial">Classic Colonial</option>
                    <option value="Scandinavian Nordic">Scandinavian Nordic</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <div className="text-xs text-slate-400 mt-1.5">Exterior finish & envelope</div>
              </div>

              {/* Estimated Built-Up Area Card */}
              <div className="lg:col-span-3">
                <div className="p-4 rounded-2xl bg-[#070b14] border border-cyan-950/70 shadow-inner">
                  <div className="text-xs text-slate-400 font-medium">Estimated Built-Up Area</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    {unitSystem === 'feet' ? (
                      <>
                        <span className="text-2xl font-extrabold text-cyan-400 font-mono tracking-tight">
                          {builtUp.totalSqFt.toLocaleString()} sq.ft
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({builtUp.totalM2} m²)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-extrabold text-cyan-400 font-mono tracking-tight">
                          {builtUp.totalM2} m²
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({builtUp.totalSqFt.toLocaleString()} sq.ft)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PER-FLOOR BHK CUSTOMIZATION (Requested Feature 5) */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Floor-by-Floor BHK Customization</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Independent per floor
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize individual BHK configurations for each floor (e.g. Ground Floor: 2BHK, 1st Floor: 3BHK)
                  </p>
                </div>
              </div>

              {/* Floor tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                {Array.from({ length: getFloorsCount(floorsKey) }).map((_, fIdx) => (
                  <button
                    key={fIdx}
                    type="button"
                    onClick={() => setActiveBHKFloorTab(fIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeBHKFloorTab === fIdx
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-[#070b14] text-slate-300 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {fIdx === 0 ? 'Ground Floor (G)' : `Floor ${fIdx}`}
                    <span className="ml-1.5 opacity-80 text-[10px]">({floorBHKs[fIdx]?.bhk || '2 BHK'})</span>
                  </button>
                ))}
              </div>

              {/* Active Floor BHK Selector */}
              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {activeBHKFloorTab === 0 ? 'Ground Floor (G)' : `Floor ${activeBHKFloorTab} (G+${activeBHKFloorTab})`} Program
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {floorBHKs[activeBHKFloorTab]?.bedrooms || 2} Bedrooms • {floorBHKs[activeBHKFloorTab]?.bathrooms || 2} Bathrooms • Living & Kitchen
                    </div>
                  </div>

                  {/* BHK Pill Selector */}
                  <div className="flex items-center gap-1.5">
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio / Penthouse'].map((bhkOption) => (
                      <button
                        key={bhkOption}
                        type="button"
                        onClick={() => updateFloorBHK(activeBHKFloorTab, bhkOption)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          floorBHKs[activeBHKFloorTab]?.bhk === bhkOption
                            ? 'bg-cyan-400 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {bhkOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated Spaces Checkboxes */}
            <div className="pt-4 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Dedicated Amenities & Structural Spaces
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={dedicatedSpaces.homeOffice}
                    onChange={(e) => setDedicatedSpaces({ ...dedicatedSpaces, homeOffice: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070b14] border-slate-700 text-cyan-400 focus:ring-0 accent-cyan-400"
                  />
                  <span>Home Office / Study</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={dedicatedSpaces.garage}
                    onChange={(e) => setDedicatedSpaces({ ...dedicatedSpaces, garage: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070b14] border-slate-700 text-cyan-400 focus:ring-0 accent-cyan-400"
                  />
                  <span>Enclosed Garage / EV Porch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={dedicatedSpaces.terraceGarden}
                    onChange={(e) => setDedicatedSpaces({ ...dedicatedSpaces, terraceGarden: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070b14] border-slate-700 text-cyan-400 focus:ring-0 accent-cyan-400"
                  />
                  <span>Terrace Sky Garden / Deck</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={dedicatedSpaces.poojaMeditation}
                    onChange={(e) => setDedicatedSpaces({ ...dedicatedSpaces, poojaMeditation: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#070b14] border-slate-700 text-cyan-400 focus:ring-0 accent-cyan-400"
                  />
                  <span>Mandir / Pooja Room</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: VAASTU SHASTRA COMPLIANCE (Requested Feature 4) */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Flame className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    3. Vaastu Shastra Harmonization
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                      Vedic Spatial Geometry
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Align rooms, kitchen, entrance, and master bedrooms with sacred Vaastu solar compass zones
                  </p>
                </div>
              </div>

              {/* Vaastu Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vaastuCompliant}
                  onChange={(e) => setVaastuCompliant(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                <span className="ml-3 text-xs font-semibold text-slate-200">
                  {vaastuCompliant ? 'Vaastu Compliant (Active)' : 'Standard Layout'}
                </span>
              </label>
            </div>

            {vaastuCompliant && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800/80">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>✦ South-West (Nairutya)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Master Bedroom placed here for family stability, strength & restful sleep.
                  </div>
                </div>

                <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800/80">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>✦ South-East (Agni Kona)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Kitchen cooking burners positioned facing East for positive digestive energy.
                  </div>
                </div>

                <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800/80">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>✦ North-East (Ishanya)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Light, open living area & Mandir/Pooja corner welcoming cosmic morning prana.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: ELEVATOR / LIFT SHAFT (Requested Feature 2) */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 text-cyan-400 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <ArrowUpCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    4. Passenger Elevator / Lift Shaft
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Accessibility Program
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Integrate a vertical elevator core connecting basement, ground, and all upper storeys
                  </p>
                </div>
              </div>

              {/* Elevator Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasElevator}
                  onChange={(e) => setHasElevator(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
                <span className="ml-3 text-xs font-semibold text-slate-200">
                  {hasElevator ? 'Elevator Planned' : 'No Elevator'}
                </span>
              </label>
            </div>

            {hasElevator && (
              <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Elevator Type & Enclosure
                  </label>
                  <select
                    value={elevatorType}
                    onChange={(e) => setElevatorType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Panoramic Glass Elevator">Panoramic Glass Elevator (Modern Showcase)</option>
                    <option value="Hydraulic Machine-Room-Less Lift">Hydraulic Machine-Room-Less (Silent / Compact)</option>
                    <option value="Traction Passenger Lift">High-Speed Gearless Traction Lift</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>The 3D model & 2D blueprint will reserve a 6' × 6' (1.8m × 1.8m) reinforced core with door openings on every floor.</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: BASEMENT SUPPORT */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 text-cyan-400">
                  <Warehouse className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    5. Subterranean Basement Level
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reinforced below-ground level with access ramp & lightwells
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBasement}
                  onChange={(e) => setHasBasement(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
                <span className="ml-3 text-xs font-semibold text-slate-200">
                  {hasBasement ? 'Basement Enabled' : 'No Basement'}
                </span>
              </label>
            </div>

            {hasBasement && (
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Basement Primary Purpose / Function
                  </label>
                  <select
                    value={basementPurpose}
                    onChange={(e) => setBasementPurpose(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Home Theater & Lounge">Home Theater & Recreation Lounge</option>
                    <option value="Underground Parking & EV Station">Underground Parking & EV Station</option>
                    <option value="Fitness Gym & Wellness Spa">Fitness Gym & Wellness Spa</option>
                    <option value="Wine Cellar & Safe Vault">Wine Cellar & Safe Vault</option>
                    <option value="Soundproof Recording Studio / Workspace">Soundproof Recording Studio / Workspace</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>The 3D model will render subterranean retaining walls, foundation footings, and your chosen room program.</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: WINDOWS & BALCONY ORIENTATION */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 text-cyan-400">
                <Compass className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  6. Solar Orientation & Fenestrations (Windows & Balconies)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify facade directions for optimal daylight simulation & natural cross-ventilation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
                <div className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Primary Glazing & Window Facades</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['north', 'south', 'east', 'west'] as const).map((dir) => {
                    const isChecked = windowDirections[dir];
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setWindowDirections({ ...windowDirections, [dir]: !isChecked })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {dir}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
                <div className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>Projecting Balconies & Verandas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['north', 'south', 'east', 'west'] as const).map((dir) => {
                    const isChecked = balconyDirections[dir];
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setBalconyDirections({ ...balconyDirections, [dir]: !isChecked })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {dir}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: NATURAL LANGUAGE USER SPECIFICATIONS */}
          <div className="bg-[#0b1120] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 text-cyan-400">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  7. Custom Specifications & Notes (Any Language / Hindi / Hinglish)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Describe any unique requirements jo questions mein cover nahi hui (e.g. Vastu directions, double-height lobby, puja room, gym orientation)
                </p>
              </div>
            </div>

            <div>
              <textarea
                rows={4}
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="Write your custom instructions here in Hindi, Hinglish, or English (e.g. 'East facing entrance chahiye, ground floor pe ek master bedroom with garden view, aur terrace pe rooftop gazebo')..."
                className="w-full p-4 bg-[#070b14] border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* PRIMARY SUBMIT CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              * Click below to generate your interactive 3D model, daylight raytracer, 2D blueprint, and engineering BOQ.
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-400/25 transition-all transform hover:-translate-y-0.5 text-base flex items-center justify-center gap-3 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating 3D Architecture & Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>Generate Blueprint & 3D Architecture</span>
                  <ArrowRight className="w-5 h-5 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
