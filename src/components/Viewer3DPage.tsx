import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { 
  Sun, 
  Moon, 
  Layers, 
  Download, 
  Calculator, 
  Sliders, 
  Compass, 
  RotateCcw, 
  Check, 
  Boxes,
  Grid,
  Sparkles,
  Flame,
  ArrowUpCircle,
  Eye,
  ChevronRight,
  Warehouse
} from 'lucide-react';
import { ArchitectureModelData } from '../types/architect.ts';
import { ThreeBuildingCanvas } from './ThreeBuildingCanvas.tsx';
import { Blueprint2DCanvas } from './Blueprint2DCanvas.tsx';
import { exportSceneToOBJ, exportSpecificationsJSON } from '../utils/modelExporter.ts';
import { BOQModal } from './BOQModal.tsx';
import { calculateSunPosition } from '../utils/architectureRules.ts';

interface Viewer3DPageProps {
  data: ArchitectureModelData;
  onModifySpecs: () => void;
}

export const Viewer3DPage: React.FC<Viewer3DPageProps> = ({ data, onModifySpecs }) => {
  // Top Bar State
  const [timeOfDay, setTimeOfDay] = useState<number>(11.5); // 11:30 AM
  const [compassHeading, setCompassHeading] = useState<number>(45); // 45 deg NE
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint'>('3d');
  const [isXRayMode, setIsXRayMode] = useState<boolean>(false);
  const [isolatedFloor, setIsolatedFloor] = useState<number | null>(null);

  // Modals & Panels
  const [isBOQOpen, setIsBOQOpen] = useState<boolean>(false);
  const [isSpecsDrawerOpen, setIsSpecsDrawerOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const exportTargetRef = useRef<(() => THREE.Object3D | null) | null>(null);

  const sunInfo = calculateSunPosition(timeOfDay, compassHeading);

  const formatTime = (hourDecimal: number) => {
    const hours = Math.floor(hourDecimal);
    const minutes = Math.floor((hourDecimal - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleExportOBJ = () => {
    if (exportTargetRef.current) {
      const sceneObj = exportTargetRef.current();
      if (sceneObj) {
        exportSceneToOBJ(sceneObj, `Archivision_${data.specs.buildingType}_Model.obj`);
        setExportNotice('Wavefront .OBJ downloaded! Compatible with AutoCAD, Blender, SketchUp & Revit.');
        setTimeout(() => setExportNotice(null), 4000);
      }
    }
  };

  const isFeet = data.specs.unitSystem === 'feet';

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#070b14] overflow-hidden flex flex-col text-slate-100">
      
      {/* 1. TOP BAR WITH CORE ARCHITECTURAL CONTROLS */}
      <header className="z-30 bg-[#090e1c]/95 border-b border-cyan-900/40 px-4 py-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        
        {/* Left: View Mode Toggle, X-Ray Mode & Floor Selector */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher: 3D Model <-> Blueprint Mode */}
          <div className="flex items-center bg-[#050811] border border-cyan-950 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>3D Model</span>
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2D Blueprint</span>
            </button>
          </div>

          {/* X-Ray Mode Button (Requested Feature 6) */}
          {viewMode === '3d' && (
            <button
              onClick={() => setIsXRayMode(!isXRayMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isXRayMode
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title="Toggle transparent outer walls to see interior layout & furniture"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>X-Ray Mode</span>
              {isXRayMode && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
            </button>
          )}

          {/* Floor-by-Floor Isolation Tray */}
          <div className="relative flex items-center gap-1.5">
            <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-xl px-2.5 py-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
              <select
                value={isolatedFloor === null ? 'all' : isolatedFloor}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsolatedFloor(val === 'all' ? null : parseInt(val));
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-4"
              >
                <option value="all" className="bg-[#0c1222] text-white">All Floors Combined</option>
                {data.floors.map((floor) => (
                  <option key={floor.floorIndex} value={floor.floorIndex} className="bg-[#0c1222] text-white">
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>

            {isolatedFloor !== null && (
              <button
                onClick={() => setIsolatedFloor(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900 text-xs font-semibold transition-all cursor-pointer"
                title="Restore full multi-storey view"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>See All Floors</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Daylight Simulation (Fixed-frame container with zero jitter & tabular numbers) */}
        <div className="flex items-center justify-between w-[440px] max-w-[440px] shrink-0 bg-[#050811] px-3.5 py-1.5 rounded-xl border border-slate-800/80 select-none">
          <div className="flex items-center gap-1.5 w-[100px] shrink-0">
            {timeOfDay >= 6 && timeOfDay <= 18 ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-sky-300 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-200 font-mono tabular-nums tracking-tight w-[74px] shrink-0 text-left">
              {formatTime(timeOfDay)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-[190px] shrink-0 justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono tabular-nums shrink-0">05:00</span>
            <input
              type="range"
              min="5"
              max="21"
              step="0.25"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
              aria-label="Daylight simulation time of day slider"
              className="w-28 sm:w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 shrink-0"
            />
            <span className="text-[10px] text-slate-500 uppercase font-mono tabular-nums shrink-0">21:00</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-[11px] text-cyan-300 w-[120px] shrink-0 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse shrink-0" />
            <span className="truncate block font-medium" title={sunInfo.periodLabel}>
              {sunInfo.periodLabel}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* BOQ Button */}
          <button
            onClick={() => setIsBOQOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>BOQ Estimate</span>
          </button>

          {/* Export 3D Model */}
          <button
            onClick={handleExportOBJ}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>Export .OBJ</span>
          </button>

          {/* Specs Drawer Toggle */}
          <button
            onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isSpecsDrawerOpen
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Inspect Building Specs"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toast Notice */}
      {exportNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-cyan-950 border border-cyan-500 text-cyan-200 text-xs rounded-xl shadow-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. MAIN VIEWPORT (Switchable between 3D Canvas and 2D Blueprint Canvas) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === '3d' ? (
          <ThreeBuildingCanvas
            data={data}
            timeOfDay={timeOfDay}
            compassHeading={compassHeading}
            viewMode="3d"
            isXRayMode={isXRayMode}
            isolatedFloor={isolatedFloor}
            onExportRef={(fn) => {
              exportTargetRef.current = fn;
            }}
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
          />
        ) : (
          <Blueprint2DCanvas
            data={data}
            activeFloorIndex={isolatedFloor}
            onSelectFloor={(idx) => setIsolatedFloor(idx)}
          />
        )}

        {/* HUD Overlay: Navigation & Architectural Badges (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2 max-w-[90vw] sm:max-w-md">
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#090e1c]/90 border border-cyan-900/40 backdrop-blur-md pointer-events-auto space-y-1.5 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {data.specs.buildingType} • {data.specs.architecturalStyle}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-400 font-mono">
              Footprint: {isFeet ? `${data.footprintWidthFt}' × ${data.footprintDepthFt}' (${data.footprintAreaSqFt.toLocaleString()} sq.ft)` : `${data.footprintWidthM}m × ${data.footprintDepthM}m (${data.footprintAreaM2} m²)`}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-medium capitalize">
                Shape: {data.specs.plotShape}
              </span>

              {data.specs.hasElevator && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3 text-cyan-400" />
                  Elevator Shaft
                </span>
              )}

              {data.specs.vaastuCompliant && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Vaastu Compliant
                </span>
              )}
            </div>

            {/* Custom User Directives extracted from textbox */}
            {data.customDirectives && data.customDirectives.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800/70">
                <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Applied Custom Directives (in 3D & 2D):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.customDirectives.map((directive, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-200 font-medium"
                    >
                      {directive}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Isolated Floor Indicator */}
          {isolatedFloor !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 pointer-events-auto">
              <Layers className="w-3.5 h-3.5" />
              <span>Viewing: {data.floors.find(f => f.floorIndex === isolatedFloor)?.name}</span>
              <button
                onClick={() => setIsolatedFloor(null)}
                className="ml-2 text-slate-950 hover:underline font-semibold text-[11px]"
              >
                (Reset)
              </button>
            </div>
          )}

          {isXRayMode && viewMode === '3d' && (
            <div className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold backdrop-blur-sm pointer-events-auto flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>X-Ray Mode Active: Outer walls translucent</span>
            </div>
          )}
        </div>

        {/* HUD Overlay: Sun Compass Controller (Bottom-Right, only in 3D mode) */}
        {viewMode === '3d' && (
          <div className="absolute bottom-4 right-4 z-20 bg-[#070b14]/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Sun Compass Heading</div>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={compassHeading}
                  onChange={(e) => setCompassHeading(parseInt(e.target.value))}
                  aria-label="Sun compass orientation heading"
                  className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-cyan-300 font-bold w-10 text-right">
                  {compassHeading}°
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Specifications Drawer */}
        {isSpecsDrawerOpen && (
          <aside className="absolute top-0 right-0 z-30 w-80 sm:w-96 h-full bg-[#090e1c]/95 border-l border-cyan-900/40 p-6 backdrop-blur-md shadow-2xl overflow-y-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Configured Parameters</span>
              </h3>
              <button
                onClick={() => setIsSpecsDrawerOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Plot & Setback specs */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Plot & Setback Geometry
              </div>
              <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plot Dimensions:</span>
                  <span className="font-mono text-white">
                    {data.specs.plotDimensions.width} × {data.specs.plotDimensions.depth} ({data.specs.unitSystem})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Land Shape:</span>
                  <span className="text-cyan-300 capitalize">{data.specs.plotShape}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Area:</span>
                  <span className="font-mono text-emerald-400">
                    {isFeet ? `${data.plotAreaSqFt.toLocaleString()} sq.ft` : `${data.plotAreaM2} m²`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Front Setback:</span>
                  <span className="font-mono text-white">{data.specs.setbacks.front} {data.specs.unitSystem}</span>
                </div>
              </div>
            </div>

            {/* Floor-by-Floor BHK Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Per-Floor BHK Configuration
              </div>
              <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800 space-y-2 text-slate-300">
                {data.specs.floorBHKConfigs.map((fCfg) => (
                  <div key={fCfg.floorIndex} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-400">{fCfg.floorLabel}:</span>
                    <span className="font-bold text-cyan-400">{fCfg.bhk} ({fCfg.bedrooms}B / {fCfg.bathrooms}B)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vaastu & Elevator Features */}
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Architectural Program Features
              </div>
              <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vaastu Compliance:</span>
                  <span className={data.specs.vaastuCompliant ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {data.specs.vaastuCompliant ? 'Active (Nairutya / Agni / Ishanya)' : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Passenger Elevator:</span>
                  <span className={data.specs.hasElevator ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                    {data.specs.hasElevator ? data.specs.elevatorType : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subterranean Basement:</span>
                  <span className={data.specs.hasBasement ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {data.specs.hasBasement ? data.specs.basementPurpose : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modify Specs Action */}
            <div className="pt-2">
              <button
                onClick={onModifySpecs}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Edit Parameters & Regenerate</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* Bill of Quantities Modal */}
      <BOQModal
        isOpen={isBOQOpen}
        onClose={() => setIsBOQOpen(false)}
        data={data}
      />
    </div>
  );
};
