import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  Building, 
  Compass, 
  Layers, 
  Sun, 
  Box, 
  Calculator, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Send, 
  MapPin, 
  Phone, 
  Mail,
  FileCheck
} from 'lucide-react';
import { BuildingType } from '../types/architect.ts';

interface LandingPageProps {
  onSelectBuildingType: (type: BuildingType) => void;
  onOpenPromptModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectBuildingType, onOpenPromptModal }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 4000);
  };

  const projectTypes = [
    {
      id: 'house' as BuildingType,
      title: 'Plan Your Dream House & Villa',
      subtitle: 'Independent Luxury Bungalow / Duplex',
      description: 'Craft your bespoke family sanctuary with customized setbacks, double-height living halls, basement home theater, private gardens, and solar-optimized balconies.',
      badge: 'Most Popular',
      align: 'left',
      specs: ['G to G+4 Floors', 'Vastu & Sun-Aligned Balconies', 'Subterranean Basement / Cinema', 'Private EV Porch'],
      icon: Home,
      accentColor: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      bgGlow: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    },
    {
      id: 'apartment' as BuildingType,
      title: 'Design Multi-Unit Residential Apartments',
      subtitle: 'Modern Urban Living & Penthouse Suites',
      description: 'Optimize floor-area ratios (FAR), multiple residential cores, symmetric elevator shafts, shared terrace amenities, and basement parking ramps.',
      badge: 'High Yield',
      align: 'right',
      specs: ['Multi-Family Configurations', 'Dedicated Underground Parking', 'Cross-Ventilation Windows', 'Rooftop Lounge Deck'],
      icon: Building2,
      accentColor: 'from-indigo-500 to-cyan-500',
      borderColor: 'border-indigo-500/40 hover:border-indigo-400',
      bgGlow: 'from-indigo-500/10 via-cyan-500/5 to-transparent',
    },
    {
      id: 'office' as BuildingType,
      title: 'Engineer Official Buildings & Corporate HQs',
      subtitle: 'Commercial Offices, Tech Hubs & Workspaces',
      description: 'Plan Grade-A commercial towers with expansive curtain-wall glass facades, conference suites, central HVAC mechanical basements, and LEED daylight standards.',
      badge: 'Commercial Grade',
      align: 'left',
      specs: ['NBC 2016 Fire Setbacks', 'Column-Free Open Spans', 'Double-Height Lobby & Atrium', 'Basement Server / Utility Plant'],
      icon: Building,
      accentColor: 'from-blue-600 to-teal-500',
      borderColor: 'border-teal-500/40 hover:border-teal-400',
      bgGlow: 'from-teal-500/10 via-blue-600/5 to-transparent',
    },
    {
      id: 'custom' as BuildingType,
      title: 'Build Something Else / Custom Architecture',
      subtitle: 'Resorts, Farmhouses, Art Studios & Mixed-Use',
      description: 'Break traditional geometries with bespoke spatial programs. Describe your creative vision in plain Hindi or English and let our parametric generator build it.',
      badge: 'Bespoke Freedom',
      align: 'right',
      specs: ['Free-form Natural Language Specs', 'Flexible Footprint Math', 'Courtyard & Zen Layouts', 'Integrated Bill of Quantities'],
      icon: Compass,
      accentColor: 'from-teal-400 to-cyan-500',
      borderColor: 'border-cyan-400/40 hover:border-cyan-300',
      bgGlow: 'from-teal-400/10 via-cyan-500/5 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Hero Showcase Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 border-b border-cyan-950/60">
        {/* Glow Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-lg shadow-cyan-950/50">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Next-Generation AI Architectural Generation Engine</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Plan Your <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">Dream Home</span> With Precision 3D & Blueprints
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            The world's most intuitive architectural software. Input your plot boundaries, regulatory setbacks, room program, and subterranean basement—instantly generate an interactive 3D model, real-time daylight simulation, and certified Bill of Quantities.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onSelectBuildingType('house')}
              className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 text-base cursor-pointer"
            >
              <span>Start Planning Your Home</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              onClick={onOpenPromptModal}
              className="flex items-center gap-2 px-6 py-4 bg-[#0c1222] hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 font-semibold rounded-2xl transition-all text-base cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Get Stitch & AI Studio Prompt</span>
            </button>
          </div>

          {/* Key Metrics / Software Show-off Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-[#0b1120]/80 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">NBC & IBC Setback Compliance</div>
            </div>
            <div className="p-4 bg-[#0b1120]/80 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">0.05s</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Instant 3D Mesh Generation</div>
            </div>
            <div className="p-4 bg-[#0b1120]/80 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">24-Hour</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Accurate Daylight Simulation</div>
            </div>
            <div className="p-4 bg-[#0b1120]/80 border border-slate-800 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">CAD .OBJ</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Direct Mainstream Export</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Badges */}
      <section className="py-12 bg-[#090e1c] border-b border-cyan-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Daylight Simulation</h4>
                <p className="text-xs text-slate-400 mt-0.5">Drag 24-hr slider to watch natural sunlight & shadows interact with room windows.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Floor Isolation System</h4>
                <p className="text-xs text-slate-400 mt-0.5">Isolate basement, ground floor, or any upper level with one click.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Interactive 3D & Blueprint</h4>
                <p className="text-xs text-slate-400 mt-0.5">Seamlessly toggle between textured 3D perspective and 2D CAD floorplans.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Instant Bill of Quantities</h4>
                <p className="text-xs text-slate-400 mt-0.5">Full engineering breakdown of structural concrete, steel rebar, and finishes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Building Options Section (Appears Left & Right as you scroll) */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
            Choose Your Architectural Program
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
            What do you want to build today?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-4">
            Select an architectural category below to customize dimensions, setbacks, basement usage, and floor counts.
          </p>
        </div>

        <div className="space-y-12">
          {projectTypes.map((project, idx) => {
            const Icon = project.icon;
            const isLeft = project.align === 'left';

            return (
              <div
                key={project.id}
                className={`relative group bg-[#0c1222] border ${project.borderColor} rounded-3xl p-6 sm:p-10 transition-all duration-300 shadow-xl overflow-hidden hover:shadow-cyan-500/10`}
              >
                {/* Background glow gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${project.bgGlow} pointer-events-none -z-0`} />

                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${isLeft ? '' : 'lg:flex-row-reverse'}`}>
                  {/* Visual Preview / Badge Column */}
                  <div className={`lg:col-span-5 ${isLeft ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                    <div className="p-8 rounded-2xl bg-[#070b14] border border-slate-800 relative overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${project.accentColor} text-slate-950 shadow-lg`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                          {project.badge}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-cyan-400 mb-1">PROGRAM SPECIFICATIONS</div>
                      <div className="text-xl font-bold text-white mb-4">{project.subtitle}</div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        {project.specs.map((spec, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Text & Action Column */}
                  <div className={`lg:col-span-7 ${isLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-cyan-500 font-bold">TYPE 0{idx + 1}</span>
                      <div className="h-0.5 w-8 bg-cyan-500/40" />
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {project.title}
                    </h3>

                    <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                      {project.description}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => onSelectBuildingType(project.id)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <span>
                          {project.id === 'house' && 'Configure House & Villa'}
                          {project.id === 'apartment' && 'Configure Apartments'}
                          {project.id === 'office' && 'Configure Official Tower'}
                          {project.id === 'custom' && 'Configure Custom Architecture'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </button>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Instant 3D Model & Floor Isolation Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Us Section at the Bottom */}
      <section className="bg-[#050811] border-t border-cyan-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Contact Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-4">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Get in Touch</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Have custom architectural requirements or corporate site questions?
              </h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Our architectural engineering team and AI studio engineers can assist with custom building bye-laws, large masterplans, and structural calculations.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Archivision Studio, Sector 62, Innovation Expressway, New Delhi / Silicon Valley HQ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>architecture-support@archivision3d.ai</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+1 (800) 272-4484 / +91 (11) 4920-8800</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8 bg-[#0c1222] border border-cyan-900/40 rounded-3xl shadow-xl">
              <h4 className="text-lg font-bold text-white mb-1">Send a Message</h4>
              <p className="text-xs text-slate-400 mb-6">We typically reply within 2 business hours.</p>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-white">Thank you! Your inquiry was received.</div>
                  <div className="text-xs text-emerald-300">An architect will contact you shortly with preliminary feasibility notes.</div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="vikram@example.com"
                      className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Building Location / Requirements
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your site plot size, location, or special questions..."
                      className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-950" />
                    <span>Send Architectural Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>© 2026 ARCHIVISION 3D Studio. All rights reserved. Follows NBC 2016 & IBC architectural frameworks.</div>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 cursor-pointer">Building Code Glossary</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
