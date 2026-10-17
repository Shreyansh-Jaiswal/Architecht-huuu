import React, { useState } from 'react';
import { Building, Sparkles, User, LogIn, X, Check, ShieldCheck, Mail } from 'lucide-react';

interface NavbarProps {
  currentTab: 'landing' | 'specs' | 'viewer';
  onNavigate: (tab: 'landing' | 'specs' | 'viewer') => void;
  onOpenPromptModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenPromptModal }) => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signedInUser, setSignedInUser] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSignedInUser(emailInput.trim());
      setShowSignInModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#070b14]/90 backdrop-blur-md border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-white flex items-center gap-1.5">
                ARCHIVISION<span className="text-cyan-400">3D</span>
              </div>
              <div className="text-[10px] text-cyan-500/80 font-mono tracking-widest uppercase">
                AI Blueprint & Spatial Engine
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0b1120] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'landing'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home & Showcase
            </button>
            <button
              onClick={() => onNavigate('specs')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'specs'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Building Specs
            </button>
            <button
              onClick={() => onNavigate('viewer')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'viewer'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              3D Model & Blueprints
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Master Prompt Button */}
            <button
              onClick={onOpenPromptModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-all hover:border-cyan-500 cursor-pointer shadow-sm"
              title="View & copy prompt for Google Stitch & AI Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stitch & AI Studio Prompt</span>
            </button>

            {/* Sign In Button / User Pill */}
            {signedInUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="max-w-[110px] truncate">{signedInUser}</span>
                <button
                  onClick={() => setSignedInUser(null)}
                  className="text-slate-400 hover:text-red-400 ml-1 text-[11px]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition-all hover:border-slate-500 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0c1222] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 mx-auto mb-3 shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-white">Sign In to Archivision 3D</h3>
              <p className="text-xs text-slate-400 mt-1">
                Save blueprints, share 3D models & export CAD files
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="architect@studio.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#050811] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  defaultValue="••••••••"
                  className="w-full px-4 py-2.5 bg-[#050811] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Sign In & Continue
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-500">or sign in with</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSignedInUser('architect.pro@gmail.com');
                  setShowSignInModal(false);
                }}
                className="w-full py-2.5 bg-[#070b14] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
