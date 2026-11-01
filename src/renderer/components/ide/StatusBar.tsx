import React from 'react';
import { WifiOff, Code2, ShieldCheck } from 'lucide-react';
import { SupportedLanguageId } from '@/common/types';

interface StatusBarProps {
  fileName?: string;
  language: SupportedLanguageId;
  line?: number;
  column?: number;
  isDirty?: boolean;
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  fileName,
  language,
  line = 1,
  column = 1,
  isDirty = false,
  onOpenSettings,
  onOpenAbout,
}) => {
  return (
    <footer className="h-6 bg-[#0B0F19] border-t border-[#1E293B] px-3 flex items-center justify-between text-[11px] text-[#94A3B8] select-none shrink-0 z-20 font-mono">
      {/* Left items: File & Cursor */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-[#818CF8]" />
          <span className="text-white font-medium">{fileName || 'Untitled'}</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>

        <span className="text-[#334155]">•</span>

        <span className="uppercase text-[#38BDF8] font-bold">{language}</span>

        <span className="text-[#334155] hidden sm:inline">•</span>

        <span className="text-[#94A3B8] hidden sm:inline">
          Ln {line}, Col {column}
        </span>
      </div>

      {/* Center item: Tagline */}
      <div className="hidden md:flex items-center gap-2 text-[#64748B]">
        <span>Learn. Code. Build.</span>
      </div>

      {/* Right items: Encoding, Offline status, Version, India */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-[#94A3B8]">Spaces: 4</span>

        <span className="hidden sm:inline text-[#94A3B8]">UTF-8</span>

        <span className="text-[#334155] hidden sm:inline">•</span>

        <div className="flex items-center gap-1 text-emerald-400 font-sans font-medium" title="All operations run 100% locally on your computer">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden xs:inline text-[10px]">100% Offline</span>
        </div>

        <span className="text-[#334155]">•</span>

        <button
          onClick={onOpenAbout}
          className="hover:text-white transition-colors cursor-pointer"
          title="About Student IDE - Made with pride in India"
        >
          <span className="text-[10px] font-sans">🇮🇳 India</span>
        </button>

        <span className="text-[#334155]">•</span>

        <span className="text-[#64748B] text-[10px]">v1.0.0</span>
      </div>
    </footer>
  );
};
