import React, { useState } from 'react';
import { Copy, Check, Sparkles, X, Terminal, ExternalLink } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MASTER_STITCH_AI_STUDIO_PROMPT = `Create an intelligent, full-stack architectural design and 3D blueprint platform ("Archivision 3D") with the following end-to-end specifications:

1. HERO & LANDING SHOWCASE:
- Showcase an architectural SaaS brand with compelling copy ("Plan Your Dream Home with AI-driven Architectural Precision", "Code-Compliant NBC 2016 & IBC Blueprints in Seconds").
- Navigation bar with branding, quick links, "Sign In" modal, and direct "Start Designing" CTA.
- Interactive scroll showcase revealing card options sliding in from left and right:
  * House (Villa / Bungalow)
  * Apartment (Multi-unit / Penthouse)
  * Official Building (Corporate Office / Commercial Hub)
  * Custom Structure (Studio / Farmhouse / Resort)
- Clicking any option navigates smoothly to the Specifications Builder.
- Footer with full "Contact Us" form, office details, and support links.

2. SPECIFICATIONS PAGE (DARK THEME CYBER-ARCHITECTURAL UI):
- Section 1: Plot Dimensions & Regulatory Setbacks
  * Toggle between [Meters (m)] and [Feet (ft)]
  * Plot Width slider with live dimension readout and "Site street frontage dimension" subtext
  * Plot Depth slider with live dimension readout and "Site depth from road to boundary" subtext
  * Real-time Calculated Plot Area card showing m² and sq.ft
  * Inputs with regulatory notes: Front Setback (Min 3.0m road buffer), Rear Setback (backyard airflow), Side Clearances (fire access & side windows)
- Section 2: Floors & Structural Program
  * Number of Floors pill selector: G, G+1, G+2, G+3, G+4
  * Ceiling Height (Headroom) dropdown (e.g. 3.0m Standard, 3.2m Spacious Luxury, 3.6m Monumental)
  * Architectural Style dropdown (Modern Minimalist, Contemporary Glass, Brutalist Concrete, Classic Colonial, Scandinavian Nordic)
  * Real-time Estimated Built-Up Area card (m² & sq.ft)
  * Stepper controls for Bedrooms [-/+], Bathrooms [-/+], Kitchens [-/+]
  * Dedicated Spaces checkboxes: Home Office/Study, Enclosed Garage/EV Porch, Swimming Pool/Deck, Terrace Garden, Meditation/Pooja Room
- Section 3: Subterranean Basement Support
  * Checkbox toggle to include Basement level
  * Dropdown/input for Basement Purpose (e.g., Underground EV Parking, Home Theater & Lounge, Fitness Gym & Spa, Storage & Wine Cellar, Custom)
- Section 4: Solar Orientation & Openings
  * Directional selectors for Windows and Balconies (North, South, East, West) for optimal daylighting
- Section 5: Natural Language Custom Specifications
  * Multilingual freeform textarea for custom specifications in Hindi, Hinglish, English, or any language
- Primary CTA: "Generate Architecture & 3D Blueprint" button with structural validation.

3. INTERACTIVE 3D MODEL & BLUEPRINT STUDIO:
- High-performance Three.js 3D viewport with OrbitControls, PBR materials, procedural architecture:
  * Foundation / Subterranean Basement (if selected)
  * Ground and upper floors with exterior walls, glass windows, cantilevered balconies with railings, and roof terrace
- Top Control Bar featuring:
  1) Daylight Simulation: Real-time Time-of-Day Slider (06:00 to 22:00) simulating accurate sun angle, shadows, warm morning glow, peak noon solar exposure, and dusk.
  2) Blueprint Mode Switcher: Toggle between interactive 3D perspective and 2D/Orthogonal architectural blueprint floorplan with room labels and dimension markers.
  3) 3D Model Export: Download the 3D building as mainstream Wavefront .OBJ (compatible with AutoCAD, Blender, SketchUp, Revit) and JSON specs.
  4) Floor-by-Floor Isolation Tray: Dropdown/segmented control to isolate and inspect individual floors (Basement, Ground Floor, Floor 1..N, Roof Terrace) with a "View All Floors" restore button.
  5) Bill of Quantities (BOQ): Instant engineering cost estimation covering Concrete (m³), Steel Rebar (MT), Masonry, Thermal Glazing, Vitrified Flooring, and MEP in INR and USD.
  6) Specifications Drawer: View and inspect all entered plot and design parameters.`;

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(MASTER_STITCH_AI_STUDIO_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c1222] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#070b14]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Google Stitch & AI Studio Master Prompt
              </h3>
              <p className="text-xs text-cyan-400/80">
                Optimized system instructions & user prompt ready for Stitch & AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close prompt modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-300 text-sm">
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl flex items-start gap-3 text-cyan-200 text-xs">
            <Terminal className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
            <div>
              This master prompt encapsulates all your requirements: dark-mode UI matching your screenshot, plot dimensions & regulatory setbacks, floor selector (G to G+4), basement inclusion, daylight simulation slider, 2D blueprint mode, floor isolation, 3D OBJ export, and Bill of Quantities (BOQ).
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-[#050811] border border-slate-800 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[45vh] overflow-y-auto select-all">
              {MASTER_STITCH_AI_STUDIO_PROMPT}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-900/40 bg-[#070b14]">
          <span className="text-xs text-slate-400">
            Click copy to use in Google Stitch or any AI Studio model prompt
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  Copy Master Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
