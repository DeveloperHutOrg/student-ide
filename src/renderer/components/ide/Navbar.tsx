import React from 'react';
import { 
  Play, 
  Square, 
  Save, 
  Settings, 
  Eye, 
  User, 
  Terminal as TerminalIcon,
  Code,
  Info,
  ClipboardList,
  CheckCircle2,
  Home,
  WifiOff,
  Sparkles,
  LogOut
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
  onLogout?: () => void;
  activeFileName?: string;
  activeView: 'dashboard' | 'editor' | 'survey';
  onViewChange: (view: 'dashboard' | 'editor' | 'survey') => void;
  isSurveyCompleted: boolean;
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
  onLogout,
  activeFileName,
  activeView,
  onViewChange,
  isSurveyCompleted,
}) => {
  const isWebTech = activeLanguage === 'html' || activeLanguage === 'css';

  return (
    <header className="h-13 bg-[#0B0F19] border-b border-[#1E293B] px-3.5 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left: App Logo, Branding & Main View Tabs */}
      <div className="flex items-center gap-3">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => onViewChange('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Student IDE - India's First Student-Friendly Offline IDE"
        >
          <BrandLogo size={28} />
          <div className="flex flex-col">
            <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
              STUDENT <span className="text-brand-gradient">IDE</span>
            </span>
            <span className="text-[9px] text-[#64748B] tracking-wider uppercase font-bold hidden lg:inline">
              Learn. Code. Build.
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#1E293B]" />

        {/* Profile Badge - clickable to edit profile */}
        <button
          onClick={onOpenSettings}
          title="Click to edit profile or class"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] text-xs text-[#CBD5E1] transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium max-w-[90px] truncate">
            {profile ? profile.student_name : 'Student'}
          </span>
          <span className="text-[#94A3B8] bg-[#1E293B] px-1.5 py-0.2 rounded text-[10px] font-semibold">
            Class {profile ? profile.student_class : '8'}
          </span>
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Log out of student session"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/40 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Logout</span>
          </button>
        )}

        <div className="h-5 w-px bg-[#1E293B]" />

        {/* View Switcher: Dashboard, Editor, Survey */}
        <div className="flex items-center gap-1 bg-[#0F172A] p-0.5 rounded-lg border border-[#1E293B]">
          {/* Dashboard Tab */}
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
            }`}
            title="Open Student Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Editor Tab */}
          <button
            onClick={() => onViewChange('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'editor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
            }`}
            title="Switch to Code Editor"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          {/* Survey Tab */}
          <button
            onClick={() => onViewChange('survey')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'survey'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
            }`}
            title={isSurveyCompleted ? 'Survey completed (Click to view)' : 'Survey feedback (Pending)'}
          >
            <ClipboardList className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Survey</span>

            {isSurveyCompleted ? (
              <CheckCircle2
                className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]"
                title="Feedback submitted"
              />
            ) : (
              <span
                className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                title="Feedback pending"
              />
            )}
          </button>
        </div>
      </div>

      {/* Center: File name & Language Switcher (in Editor mode) OR View Title */}
      <div className="flex items-center gap-2">
        {activeView === 'editor' ? (
          <>
            {activeFileName && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0F172A] rounded-lg border border-[#1E293B] text-xs">
                <span className="text-[#F8FAFC] font-mono">{activeFileName}</span>
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </div>
            )}

            <select
              value={activeLanguage}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguageId)}
              className="bg-[#0F172A] border border-[#1E293B] text-xs text-[#CBD5E1] px-2.5 py-1 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
            >
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </>
        ) : activeView === 'dashboard' ? (
          <div className="hidden md:flex items-center gap-2 text-xs text-[#94A3B8]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-white">Student Hub & Available Languages</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0F172A] rounded-lg border border-[#1E293B] text-xs text-[#94A3B8]">
            <ClipboardList className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-white">School Feedback Survey</span>
            {isSurveyCompleted ? (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-semibold">Completed</span>
            ) : (
              <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.2 rounded font-semibold">Pending</span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions (Run, Stop, Save, Offline Pill, Settings) */}
      <div className="flex items-center gap-2">
        {/* Offline Status Badge */}
        <div 
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
          title="All compilers and databases operate 100% offline on your device"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>100% Offline</span>
        </div>

        {activeView === 'editor' && (
          <>
            {/* Save button */}
            <button
              onClick={onSave}
              title="Save File (Ctrl+S)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isDirty
                  ? 'bg-[#0F172A] border-amber-500 text-amber-300 hover:bg-amber-500/10'
                  : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Save</span>
            </button>

            {/* Run / Stop controls */}
            {!isRunning ? (
              <button
                onClick={onRun}
                title="Run Program (F5)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isWebTech ? 'Preview' : 'Run'}</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                title="Stop Execution (Terminates running process)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 animate-pulse transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            )}

            <div className="h-4 w-px bg-[#1E293B]" />

            {/* HTML/CSS Preview Toggle */}
            <button
              onClick={onTogglePreview}
              title={showPreview ? 'Hide Web Preview' : 'Show Web Preview'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                showPreview
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Output Terminal Toggle */}
            <button
              onClick={onToggleTerminal}
              title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                showTerminal
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
          </>
        )}

        {/* About button */}
        <button
          onClick={onOpenAbout}
          title="About Student IDE & DeveloperHut"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-indigo-500 transition-colors text-xs font-medium cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">About</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Settings, Profile & Preferences"
          className="p-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155] transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
