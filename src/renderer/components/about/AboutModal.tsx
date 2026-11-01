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
  ShieldCheck 
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'founder' | 'ide';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'founder',
}) => {
  const [activeTab, setActiveTab] = useState<'founder' | 'ide'>(defaultTab);

  if (!isOpen) return null;

  const handleVisitDeveloperHut = () => {
    if (window.api?.openExternalUrl) {
      window.api.openExternalUrl('https://developerhut.in');
    } else {
      window.open('https://developerhut.in', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#181825] border border-[#313244] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-[#313244] flex items-center justify-between bg-[#11111b]/50">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={22} />
            <h2 className="font-bold text-white text-base">About Student IDE</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-white hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-[#313244] gap-6 text-sm bg-[#181825]">
          <button
            onClick={() => setActiveTab('founder')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'founder'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>About the Founder</span>
          </button>

          <button
            onClick={() => setActiveTab('ide')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ide'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>About Student IDE</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'founder' ? (
            <div className="space-y-6">
              {/* Heading */}
              <div>
                <h1 className="text-xl font-bold text-white mb-2">About the Founder</h1>
                <p className="text-[#a6adc8] text-sm leading-relaxed">
                  Student IDE is a student-focused programming environment created to make coding and programming education more accessible to students.
                </p>
              </div>

              {/* Founder Section - Typography based, No photograph */}
              <div className="bg-[#1e1e2e] border border-[#313244] rounded-xl p-5 relative overflow-hidden">
                {/* Subtle developer themed accent graphic */}
                <div className="absolute top-3 right-4 opacity-10 text-white font-mono text-3xl font-bold select-none pointer-events-none">
                  &lt;coder /&gt;
                </div>

                <div className="flex items-start gap-4">
                  {/* Clean Typography Monogram Badge (NO photograph) */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#89b4fa] to-[#b4befe] flex items-center justify-center text-[#11111b] font-mono font-black text-xl shadow-md shrink-0">
                    V
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-white">Vasu</h2>
                      <span className="text-[11px] font-semibold bg-[#89b4fa]/15 text-[#89b4fa] border border-[#89b4fa]/30 px-2.5 py-0.5 rounded-full">
                        Founder of Student IDE
                      </span>
                    </div>

                    <p className="text-xs text-[#6c7086] font-mono mb-3">
                      DeveloperHut • Software Developer & Creator
                    </p>

                    <p className="text-xs text-[#cdd6f4] leading-relaxed">
                      A developer and technology enthusiast interested in software development and building useful technology for students.
                    </p>
                  </div>
                </div>
              </div>

              {/* DeveloperHut Section */}
              <div className="bg-[#11111b] border border-[#313244] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#89dceb]" />
                    <h3 className="text-sm font-semibold text-white">DeveloperHut</h3>
                  </div>
                  <span className="text-xs text-[#a6adc8] font-mono">developerhut.in</span>
                </div>

                <p className="text-xs text-[#a6adc8] leading-relaxed">
                  Student IDE is connected to the broader development vision of DeveloperHut.
                </p>

                <p className="text-xs text-[#a6adc8] leading-relaxed">
                  DeveloperHut focuses on creating digital products, software solutions and technology experiences.
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#6c7086]">
                    Website: <span className="text-[#89b4fa] underline">https://developerhut.in</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleVisitDeveloperHut}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <span>Visit DeveloperHut</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* About Student IDE Section */
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-3.5 mb-2">
                  <BrandLogo size={42} />
                  <div>
                    <h1 className="text-xl font-bold text-white">Student IDE V1</h1>
                    <p className="text-xs text-[#89b4fa] font-mono">Offline Programming Environment</p>
                  </div>
                </div>
                <p className="text-[#a6adc8] text-sm leading-relaxed">
                  A stable, lightweight, and fully offline desktop programming environment crafted specifically for school students in Classes 6 through 12.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#1e1e2e] border border-[#313244] rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-[#a6e3a1]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold">100% Offline & Private</span>
                  </div>
                  <p className="text-[11px] text-[#a6adc8] leading-relaxed">
                    Zero telemetry, cloud databases, or mandatory registration. All code and profiles remain on your PC in local SQLite.
                  </p>
                </div>

                <div className="p-3.5 bg-[#1e1e2e] border border-[#313244] rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-[#89b4fa]">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-semibold">7 Core Technologies</span>
                  </div>
                  <p className="text-[11px] text-[#a6adc8] leading-relaxed">
                    Built-in support for HTML, CSS, Python, JavaScript, SQL, C++, and PHP tailored to curriculum grade levels.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#11111b] border border-[#313244] rounded-xl text-xs text-[#a6adc8] space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Version</span>
                  <span className="text-white">1.0.0 (Offline Edition)</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Monaco Editor</span>
                  <span className="text-white">Local Offline Bundle</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Database</span>
                  <span className="text-white">Local SQLite</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-6 border-t border-[#313244] bg-[#11111b] flex items-center justify-between">
          <button
            type="button"
            onClick={handleVisitDeveloperHut}
            className="text-xs text-[#89b4fa] hover:underline flex items-center gap-1 font-medium"
          >
            <span>developerhut.in</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#313244] hover:bg-[#45475a] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
