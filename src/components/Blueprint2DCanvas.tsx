import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, Compass, Layers, Check } from 'lucide-react';
import { ArchitectureModelData, FloorLayout, RoomLayout } from '../types/architect.ts';

interface Blueprint2DCanvasProps {
  data: ArchitectureModelData;
  activeFloorIndex: number | null;
  onSelectFloor: (index: number) => void;
}

export const Blueprint2DCanvas: React.FC<Blueprint2DCanvasProps> = ({
  data,
  activeFloorIndex,
  onSelectFloor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan and Zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Default active floor to Ground Floor (0) if null
  const currentFloorIndex = activeFloorIndex !== null ? activeFloorIndex : 0;
  const currentFloor = data.floors.find((f) => f.floorIndex === currentFloorIndex) || data.floors[0];

  const isFeet = data.specs.unitSystem === 'feet';

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((prev) => Math.max(0.4, Math.min(prev * zoomFactor, 4.0)));
  };

  // Handle Drag / Pan with left-click
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Render 2D CAD Blueprint on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !currentFloor) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // 1. Background
    ctx.fillStyle = '#060d1a'; // Deep architectural CAD blueprint dark
    ctx.fillRect(0, 0, width, height);

    // 2. Blueprint Engineering Grid
    const gridSize = 24 * zoom;
    ctx.strokeStyle = '#0d1d36';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startX = (pan.x % gridSize);
    const startY = (pan.y % gridSize);
    for (let x = startX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Transform coordinate space for building
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Scale metric meters to canvas pixels
    const pxPerMeter = 28;
    const bW = data.footprintWidthM * pxPerMeter;
    const bD = data.footprintDepthM * pxPerMeter;

    // Site / Boundary Setback lines
    const pW = (data.specs.plotDimensions.width * (isFeet ? 0.3048 : 1)) * pxPerMeter;
    const pD = (data.specs.plotDimensions.depth * (isFeet ? 0.3048 : 1)) * pxPerMeter;

    // Plot Boundary (with shape support)
    const isLShaped = data.specs.plotShape === 'l_shaped';
    const isCorner = data.specs.plotShape === 'corner';

    ctx.strokeStyle = '#1e3a5f';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    if (isLShaped) {
      ctx.beginPath();
      ctx.moveTo(-pW / 2, -pD / 2);
      ctx.lineTo(pW * 0.1, -pD / 2);
      ctx.lineTo(pW * 0.1, -pD * 0.1);
      ctx.lineTo(pW / 2, -pD * 0.1);
      ctx.lineTo(pW / 2, pD / 2);
      ctx.lineTo(-pW / 2, pD / 2);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(-pW / 2, -pD / 2, pW, pD);
    }
    ctx.setLineDash([]);

    // Front Road & Driveway
    ctx.fillStyle = '#111827';
    ctx.fillRect(-pW / 2 - 30, bD / 2 + data.specs.setbacks.front * pxPerMeter, pW + 60, 48);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAIN ACCESS ROAD (STREET FRONTAGE)', 0, bD / 2 + data.specs.setbacks.front * pxPerMeter + 28);

    // Side Road for Corner Plot
    if (isCorner) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(pW / 2 + data.specs.setbacks.side * pxPerMeter, -pD / 2 - 30, 48, pD + 120);
      ctx.save();
      ctx.translate(pW / 2 + data.specs.setbacks.side * pxPerMeter + 26, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SIDE FLANKING STREET', 0, 0);
      ctx.restore();
    }

    // 3. Render Building Rooms & Slabs (100% matched to 3D model)
    currentFloor.rooms.forEach((room) => {
      const rx = room.x * pxPerMeter - (room.width * pxPerMeter) / 2;
      const rz = room.z * pxPerMeter - (room.depth * pxPerMeter) / 2;
      const rw = room.width * pxPerMeter;
      const rd = room.depth * pxPerMeter;

      // Room Fill
      let fillColor = '#0f172a';
      if (room.type === 'living') fillColor = '#0e2540';
      else if (room.type === 'kitchen') fillColor = '#0a2e38';
      else if (room.type === 'bedroom' || room.type === 'master_bedroom') fillColor = '#172554';
      else if (room.type === 'garage') fillColor = '#1e293b';
      else if (room.type === 'terrace') fillColor = '#143828';
      else if (room.type === 'elevator') fillColor = '#083344';
      else if (room.type === 'pooja') fillColor = '#451a03';
      else if (room.type === 'pool') fillColor = '#0284c7';
      else if (room.type === 'theater') fillColor = '#2e1065';
      else if (room.type === 'gym') fillColor = '#064e3b';
      else if (room.type === 'billiards') fillColor = '#14532d';
      else if (room.type === 'bar') fillColor = '#431407';
      else if (room.type === 'office') fillColor = '#083344';
      else if (room.type === 'gazebo') fillColor = '#1c1917';
      else if (room.type === 'helipad') fillColor = '#1e293b';
      else if (room.type === 'custom') fillColor = '#312e81';

      ctx.fillStyle = fillColor;
      ctx.fillRect(rx, rz, rw, rd);

      // Room Wall Outlines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, rz, rw, rd);

      // Furniture & Architectural Glyphs inside rooms (matching 3D model features)
      if (room.type === 'bedroom' || room.type === 'master_bedroom') {
        // Bed glyph
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1;
        const bedW = rw * 0.45;
        const bedH = rd * 0.5;
        ctx.fillRect(rx + rw * 0.28, rz + rd * 0.25, bedW, bedH);
        ctx.strokeRect(rx + rw * 0.28, rz + rd * 0.25, bedW, bedH);
        // Pillows
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(rx + rw * 0.32, rz + rd * 0.28, bedW * 0.38, bedH * 0.2);
        ctx.fillRect(rx + rw * 0.54, rz + rd * 0.28, bedW * 0.38, bedH * 0.2);
      } else if (room.type === 'living') {
        // Sofa / Seating glyph
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 10, rz + 10, rw * 0.35, 14);
        // Coffee table circle
        ctx.beginPath();
        ctx.arc(rx + rw * 0.45, rz + rd * 0.45, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.stroke();
      } else if (room.type === 'kitchen') {
        // Kitchen L-shaped counter
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx + 6, rz + 6, rw - 12, 12);
        // Sink & Burners
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(rx + 14, rz + 8, 14, 8);
        ctx.fillRect(rx + rw - 30, rz + 8, 16, 8);
      } else if (room.type === 'elevator') {
        // Elevator Cross Line Box
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx, rz);
        ctx.lineTo(rx + rw, rz + rd);
        ctx.moveTo(rx + rw, rz);
        ctx.lineTo(rx, rz + rd);
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LIFT', rx + rw / 2, rz + rd / 2 + 14);
      } else if (room.type === 'garage') {
        // Car glyph
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const carW = rw * 0.65;
        const carH = rd * 0.7;
        ctx.strokeRect(rx + rw * 0.18, rz + rd * 0.15, carW, carH);
        ctx.beginPath();
        ctx.arc(rx + rw / 2, rz + rd * 0.35, carW * 0.35, Math.PI, 0);
        ctx.stroke();
      } else if (room.type === 'pool') {
        // Swimming pool water waves & coping
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(rx + 6, rz + 6, rw - 12, rd - 12);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx + rw * 0.3, rz + rd * 0.5, 8, 0, Math.PI);
        ctx.arc(rx + rw * 0.7, rz + rd * 0.5, 8, 0, Math.PI);
        ctx.stroke();
        // Ladder
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(rx + 10, rz + 8, 12, 6);
      } else if (room.type === 'helipad') {
        // Circular helipad landing zone & 'H'
        const radius = Math.min(rw, rd) * 0.4;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rx + rw / 2, rz + rd / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', rx + rw / 2, rz + rd / 2 - 12);
        ctx.textBaseline = 'alphabetic';
      } else if (room.type === 'theater') {
        // Cinema Screen arc + 2 rows of seats
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rx + rw / 2, rz - 10, rw * 0.4, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#991b1b';
        for (let s = 0; s < 4; s++) {
          ctx.fillRect(rx + rw * 0.2 + s * 14, rz + rd * 0.6, 10, 8);
        }
      } else if (room.type === 'gym') {
        // Dumbbell icon
        ctx.fillStyle = '#10b981';
        ctx.fillRect(rx + rw / 2 - 14, rz + rd / 2 + 18, 6, 10);
        ctx.fillRect(rx + rw / 2 + 8, rz + rd / 2 + 18, 6, 10);
        ctx.fillRect(rx + rw / 2 - 10, rz + rd / 2 + 22, 20, 2);
      } else if (room.type === 'pooja') {
        // Temple / Sanctum altar box
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + rw * 0.35, rz + rd * 0.35, rw * 0.3, rd * 0.3);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('ॐ', rx + rw / 2, rz + rd / 2 + 20);
      } else if (room.type === 'billiards') {
        // Pool table with 6 pockets
        ctx.fillStyle = '#15803d';
        ctx.fillRect(rx + rw * 0.2, rz + rd * 0.25, rw * 0.6, rd * 0.5);
        ctx.strokeStyle = '#d97706';
        ctx.strokeRect(rx + rw * 0.2, rz + rd * 0.25, rw * 0.6, rd * 0.5);
      } else if (room.type === 'bar') {
        // Curved Bar Counter
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx + rw * 0.2, rz + rd * 0.3, rw * 0.6, 8);
        for (let b = 0; b < 3; b++) {
          ctx.beginPath();
          ctx.arc(rx + rw * 0.3 + b * 16, rz + rd * 0.55, 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (room.type === 'gazebo') {
        // Slatted trellis rafters
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        for (let g = 0; g < 5; g++) {
          ctx.beginPath();
          ctx.moveTo(rx + 6, rz + 10 + g * 12);
          ctx.lineTo(rx + rw - 6, rz + 10 + g * 12);
          ctx.stroke();
        }
      }

      // Room Name Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, rx + rw / 2, rz + rd / 2 - 8);

      // Room Dimensions & Area Label (As requested: "har ek room ki dimentions dikhni chahiye")
      const dimText = isFeet
        ? `${room.widthFt}' × ${room.depthFt}' (${room.areaSqFt} sq.ft)`
        : `${Math.round(room.width * 10) / 10}m × ${Math.round(room.depth * 10) / 10}m (${room.areaSqM} m²)`;

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(dimText, rx + rw / 2, rz + rd / 2 + 10);

      // Vaastu Zone tag or Custom directive tag if present
      if (room.isCustomDirective) {
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`★ User Custom Directive`, rx + rw / 2, rz + rd / 2 + 24);
      } else if (room.vaastuZone) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px sans-serif';
        ctx.fillText(`✦ ${room.vaastuZone}`, rx + rw / 2, rz + rd / 2 + 24);
      }
    });

    // 4. Exterior Dimension Ticks & Callouts (Top, Bottom, Left, Right as in 2D blueprint.png)
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';

    const off = 22; // offset for dimension lines

    // TOP Exterior Dimension
    ctx.beginPath();
    ctx.moveTo(-bW / 2, -bD / 2 - off);
    ctx.lineTo(bW / 2, -bD / 2 - off);
    // Left & right ticks
    ctx.moveTo(-bW / 2, -bD / 2 - off - 6);
    ctx.lineTo(-bW / 2, -bD / 2 - off + 6);
    ctx.moveTo(bW / 2, -bD / 2 - off - 6);
    ctx.lineTo(bW / 2, -bD / 2 - off + 6);
    ctx.stroke();
    const topDimText = isFeet ? `${data.footprintWidthFt}' 0"` : `${data.footprintWidthM}m`;
    ctx.fillText(topDimText, 0, -bD / 2 - off - 8);

    // BOTTOM Exterior Dimension
    ctx.beginPath();
    ctx.moveTo(-bW / 2, bD / 2 + off);
    ctx.lineTo(bW / 2, bD / 2 + off);
    ctx.moveTo(-bW / 2, bD / 2 + off - 6);
    ctx.lineTo(-bW / 2, bD / 2 + off + 6);
    ctx.moveTo(bW / 2, bD / 2 + off - 6);
    ctx.lineTo(bW / 2, bD / 2 + off + 6);
    ctx.stroke();
    ctx.fillText(topDimText, 0, bD / 2 + off + 18);

    // LEFT Exterior Dimension
    ctx.beginPath();
    ctx.moveTo(-bW / 2 - off, -bD / 2);
    ctx.lineTo(-bW / 2 - off, bD / 2);
    ctx.moveTo(-bW / 2 - off - 6, -bD / 2);
    ctx.lineTo(-bW / 2 - off + 6, -bD / 2);
    ctx.moveTo(-bW / 2 - off - 6, bD / 2);
    ctx.lineTo(-bW / 2 - off + 6, bD / 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(-bW / 2 - off - 12, 0);
    ctx.rotate(-Math.PI / 2);
    const leftDimText = isFeet ? `${data.footprintDepthFt}' 0"` : `${data.footprintDepthM}m`;
    ctx.fillText(leftDimText, 0, 0);
    ctx.restore();

    // RIGHT Exterior Dimension
    ctx.beginPath();
    ctx.moveTo(bW / 2 + off, -bD / 2);
    ctx.lineTo(bW / 2 + off, bD / 2);
    ctx.moveTo(bW / 2 + off - 6, -bD / 2);
    ctx.lineTo(bW / 2 + off + 6, -bD / 2);
    ctx.moveTo(bW / 2 + off - 6, bD / 2);
    ctx.lineTo(bW / 2 + off + 6, bD / 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(bW / 2 + off + 16, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(leftDimText, 0, 0);
    ctx.restore();

    // 5. Compass Rose Marker (North Arrow)
    ctx.save();
    ctx.translate(pW / 2 - 30, -pD / 2 + 30);
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    // Arrow
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 9px monospace';
    ctx.fillText('N', 0, -16);
    ctx.restore();

    ctx.restore();
  }, [currentFloor, zoom, pan, data, isFeet]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full min-h-[500px] overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Floor Selector Tabs (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-[#090e1c]/90 border border-cyan-900/40 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-1 text-xs text-cyan-400 px-2 font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Blueprint Floor:</span>
        </div>
        {data.floors.map((floor) => {
          const isSelected = floor.floorIndex === currentFloorIndex;
          return (
            <button
              key={floor.floorIndex}
              onClick={() => onSelectFloor(floor.floorIndex)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {floor.floorIndex === -1 ? 'Basement' : floor.floorIndex === 0 ? 'Ground' : `Floor ${floor.floorIndex}`}
            </button>
          );
        })}
      </div>

      {/* Blueprint Navigation HUD (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 p-2 bg-[#070b14]/90 border border-slate-800 rounded-2xl backdrop-blur-md text-xs text-slate-300">
        <span className="flex items-center gap-1 text-cyan-400 font-semibold">
          <Move className="w-3.5 h-3.5" /> Left-Click & Drag to Pan
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Scroll to Zoom ({Math.round(zoom * 100)}%)</span>
        <button
          onClick={handleReset}
          className="ml-2 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          Reset View
        </button>
      </div>

      {/* Zoom Steppers (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 p-1 bg-[#070b14]/90 border border-slate-800 rounded-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 4.0))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
