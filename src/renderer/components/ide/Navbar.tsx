import React from 'react';
import { 
  Play, 
  Square, 
  Save, 
  Settings, 
  Layout, 
  Eye, 
  User, 
  Terminal as TerminalIcon,
  Code,
  Info
} from 'lucide-react';
import { StudentProfile, SupportedLanguageId } from '@/common/types';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  profile: StudentProfile | null;
  activeLanguage: SupportedLanguageId;
  onLanguageChange: (lang: SupportedLanguageId) => void;
  availableLanguages: SupportedLanguageId[];
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  isDirty: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
  showTerminal: boolean;
  onToggleTerminal: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  activeFileName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeLanguage,
  onLanguageChange,
  availableLanguages,
  isRunning,
  onRun,
  onStop,
  onSave,
  isDirty,
  showPreview,
  onTogglePreview,
  showTerminal,
  onToggleTerminal,
  onOpenSettings,
  onOpenAbout,
  activeFileName,
}) => {
  const isWebTech = activeLanguage === 'html' || activeLanguage === 'css';

  return (
    <header className="h-12 bg-[#181825] border-b border-[#313244] px-3 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left: App Logo & Student Profile Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={26} />
          <span className="font-bold text-white text-sm hidden sm:inline tracking-tight">
            Student <span className="text-[#89b4fa]">IDE</span>
          </span>
        </div>

        <div className="h-4 w-px bg-[#313244]" />

        {/* Profile Badge - clickable to edit profile */}
        <button
          onClick={onOpenSettings}
          title="Click to change profile or class"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#11111b] hover:bg-[#313244] border border-[#313244] text-xs text-[#cdd6f4] transition-colors"
        >
          <User className="w-3.5 h-3.5 text-[#89b4fa]" />
          <span className="font-medium max-w-[100px] truncate">
            {profile ? profile.student_name : 'Student'}
          </span>
          <span className="text-[#a6adc8] bg-[#313244] px-1.5 py-0.2 rounded text-[10px]">
            Class {profile ? profile.student_class : '8'}
          </span>
        </button>
      </div>

      {/* Center: File name and Language Switcher */}
      <div className="flex items-center gap-2">
        {activeFileName && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#11111b] rounded-lg border border-[#313244] text-xs">
            <span className="text-[#cdd6f4] font-mono">{activeFileName}</span>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-[#f9e2af]" title="Unsaved changes" />
            )}
          </div>
        )}

        <select
          value={activeLanguage}
          onChange={(e) => onLanguageChange(e.target.value as SupportedLanguageId)}
          className="bg-[#11111b] border border-[#313244] text-xs text-[#cdd6f4] px-2.5 py-1 rounded-lg focus:outline-none focus:border-[#89b4fa] cursor-pointer"
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Actions (Run, Stop, Save, Panels, Settings) */}
      <div className="flex items-center gap-2">
        {/* Save button */}
        <button
          onClick={onSave}
          title="Save File (Ctrl+S)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isDirty
              ? 'bg-[#11111b] border-[#f9e2af] text-[#f9e2af] hover:bg-[#f9e2af]/10'
              : 'bg-[#11111b] border-[#313244] text-[#a6adc8] hover:text-white hover:border-[#45475a]'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Run / Stop controls */}
        {!isRunning ? (
          <button
            onClick={onRun}
            title="Run Code (F5)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a6e3a1] hover:bg-[#94e2d5] text-[#11111b] text-xs font-semibold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isWebTech ? 'Preview' : 'Run'}</span>
          </button>
        ) : (
          <button
            onClick={onStop}
            title="Stop Program"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f38ba8] hover:bg-[#eba0ac] text-[#11111b] text-xs font-semibold shadow-sm animate-pulse transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        <div className="h-4 w-px bg-[#313244]" />

        {/* HTML/CSS Preview Toggle */}
        <button
          onClick={onTogglePreview}
          title={showPreview ? 'Hide Web Preview' : 'Show Web Preview'}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            showPreview
              ? 'bg-[#89dceb]/20 border-[#89dceb] text-[#89dceb]'
              : 'bg-[#11111b] border-[#313244] text-[#a6adc8] hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Output Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            showTerminal
              ? 'bg-[#89b4fa]/20 border-[#89b4fa] text-[#89b4fa]'
              : 'bg-[#11111b] border-[#313244] text-[#a6adc8] hover:text-white'
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
        </button>

        {/* About button */}
        <button
          onClick={onOpenAbout}
          title="About the Founder & Student IDE"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#11111b] border border-[#313244] text-[#a6adc8] hover:text-white hover:border-[#89b4fa] transition-colors text-xs font-medium"
        >
          <Info className="w-3.5 h-3.5 text-[#89b4fa]" />
          <span className="hidden sm:inline">About</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Settings & Profile"
          className="p-1.5 rounded-lg bg-[#11111b] border border-[#313244] text-[#a6adc8] hover:text-white hover:border-[#45475a] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
