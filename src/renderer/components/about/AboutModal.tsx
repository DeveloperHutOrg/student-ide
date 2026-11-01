import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Code2, 
  Terminal, 
  Sparkles, 
  Globe, 
  GraduationCap, 
  Cpu, 
  ShieldCheck,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ide' | 'founder';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'ide',
}) => {
  const [activeTab, setActiveTab] = useState<'ide' | 'founder'>(defaultTab);

  if (!isOpen) return null;

  const handleVisitDeveloperHut = () => {
    if (window.api?.openExternalUrl) {
      window.api.openExternalUrl('https://developerhut.in');
    } else {
      window.open('https://developerhut.in', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0F19]/80">
          <div className="flex items-center gap-3">
            <BrandLogo size={28} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-white text-base tracking-tight">STUDENT IDE</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  v1.0.0
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8]">Learn. Code. Build.</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tricolour Accent Line */}
        <div className="h-0.5 w-full bg-tricolour" />

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-[#1E293B] gap-6 text-xs bg-[#0F172A]">
          <button
            onClick={() => setActiveTab('ide')}
            className={`py-3.5 font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'ide'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>About Student IDE</span>
          </button>

          <button
            onClick={() => setActiveTab('founder')}
            className={`py-3.5 font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'founder'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>DeveloperHut & Founder</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'ide' ? (
            /* Official Student IDE Information */
            <div className="space-y-6">
              
              {/* Product Headline Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Official Branding
                </div>

                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE
                </h1>

                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  A complete coding environment designed for school students, with offline programming tools.
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Proudly Built in India 🇮🇳</span>
                </div>
              </div>

              {/* Our Mission */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Our Mission</h3>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  To make programming accessible to school students by providing a simple, powerful and offline-friendly coding environment.
                </p>
              </div>

              {/* Designed For */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Designed For</h3>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  School students from <strong className="text-white">Classes 6 to 12</strong> across India, tailored directly to computer science curriculum standards.
                </p>
              </div>

              {/* Key Features List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#CBD5E1]">
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Offline-first coding environment.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multiple programming languages.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Built-in code editor (Monaco).</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Local project management.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Student-friendly interface.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No mandatory cloud account.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2 col-span-1 sm:col-span-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Local survey and feedback system.</span>
                  </div>
                </div>
              </div>

              {/* Attribution */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Developed By</span>
                  <span className="text-sm font-bold text-white">DeveloperHut</span>
                  <span className="text-xs text-[#94A3B8] block">Proudly Built in India 🇮🇳</span>
                </div>

                <button
                  type="button"
                  onClick={handleVisitDeveloperHut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <span>https://developerhut.in</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ) : (
            /* DeveloperHut & Founder Section */
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white mb-1">DeveloperHut & Creator</h1>
                <p className="text-[#94A3B8] text-xs leading-relaxed">
                  Student IDE is a student-focused initiative created to empower youth through technology education.
                </p>
              </div>

              {/* Founder Section */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-mono font-black text-xl shadow-md shrink-0">
                    V
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-base font-bold text-white">Vasu</h2>
                      <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                        Founder of Student IDE
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] font-mono mb-2">
                      DeveloperHut • Software Developer & Creator
                    </p>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed">
                      A software developer and technology enthusiast passionate about building high-quality, offline-accessible digital tools for students.
                    </p>
                  </div>
                </div>
              </div>

              {/* DeveloperHut Mission */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">DeveloperHut</h3>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-mono">developerhut.in</span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Student IDE is part of the broader technology vision of DeveloperHut, focusing on creating accessible digital products and empowering Indian school students.
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">
                    Website: <span className="text-indigo-400 underline">https://developerhut.in</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleVisitDeveloperHut}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <span>Visit DeveloperHut</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-6 border-t border-[#1E293B] bg-[#0B0F19] flex items-center justify-between">
          <button
            type="button"
            onClick={handleVisitDeveloperHut}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>developerhut.in</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
