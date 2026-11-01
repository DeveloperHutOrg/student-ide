import React, { useEffect, useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { Sparkles, ArrowRight, ShieldCheck, Globe, WifiOff } from 'lucide-react';

interface WelcomeSplashProps {
  onFinish: () => void;
  studentName?: string;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onFinish, studentName }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onFinish(), 200);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onFinish]);

  const handleOpenWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.api?.openExternalUrl) {
      window.api.openExternalUrl('https://developerhut.in');
    } else {
      window.open('https://developerhut.in', '_blank');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col items-center justify-between p-8 select-none relative overflow-hidden animate-fade-in">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Status */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-[#94A3B8] z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
          </span>
          <span className="font-medium text-[#22C55E] flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5" />
            100% Offline Ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] bg-[#1E293B] px-2.5 py-0.5 rounded-full border border-[#334155] text-[#CBD5E1]">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Center Branding Content */}
      <div className="flex flex-col items-center text-center max-w-2xl z-10 my-auto">
        {/* Animated Brand Logo */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
          <BrandLogo size={76} className="relative shadow-2xl" />
        </div>

        {/* Product Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
          STUDENT <span className="text-brand-gradient">IDE</span>
        </h1>

        {/* Main Headline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE
        </div>

        {/* Subtitle / Description */}
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl leading-relaxed mb-4">
          A complete coding environment designed for school students, with offline programming tools.
        </p>

        {/* Tagline */}
        <div className="text-base font-bold text-[#E2E8F0] tracking-widest uppercase text-xs mb-6 flex items-center gap-3">
          <span>Learn.</span>
          <span className="text-[#38BDF8]">•</span>
          <span>Code.</span>
          <span className="text-[#A855F7]">•</span>
          <span>Build.</span>
        </div>

        {/* Tricolour Accent Line */}
        <div className="w-32 h-1 bg-tricolour rounded-full mb-6 shadow-sm" />

        {/* Country & Developer Identity */}
        <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-8">
          <span className="font-medium text-[#E2E8F0]">Proudly Built in India 🇮🇳</span>
          <span>•</span>
          <span>By DeveloperHut</span>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-72 sm:w-80 space-y-2">
          <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden border border-[#334155]/60">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] font-mono">
            <span>{studentName ? `Welcome back, ${studentName}` : 'Initializing offline tools...'}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Instant Skip / Enter Workspace Button */}
        <button
          onClick={onFinish}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#1E293B] border border-transparent hover:border-[#334155] transition-all cursor-pointer"
        >
          <span>Enter Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer Attribution */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-[#64748B] border-t border-[#1E293B] pt-4 z-10">
        <button
          onClick={handleOpenWebsite}
          className="hover:text-[#38BDF8] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>https://developerhut.in</span>
        </button>

        <span>Copyright © 2026 DeveloperHut. All rights reserved.</span>
      </div>
    </div>
  );
};
