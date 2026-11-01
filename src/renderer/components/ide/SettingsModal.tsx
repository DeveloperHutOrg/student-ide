import React, { useState } from 'react';
import { 
  X, 
  User, 
  Code2, 
  Type, 
  Save, 
  Check, 
  Sparkles, 
  GraduationCap,
  Info,
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { StudentProfile, SupportedLanguageId, LanguagePreference } from '@/common/types';
import { ALL_SUPPORTED_LANGUAGES, getSuggestedLanguagesForClass } from '@/common/languages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile | null;
  onSaveProfile: (name: string, studentClass: number) => Promise<void>;
  languages: LanguagePreference[];
  onSaveLanguages: (enabledIds: SupportedLanguageId[]) => Promise<void>;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onOpenAbout?: () => void;
  onOpenAdmin?: () => void;
}

const CLASSES = [6, 7, 8, 9, 10, 11, 12];
const FONT_SIZES = [12, 14, 16, 18, 20];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  languages,
  onSaveLanguages,
  fontSize,
  onFontSizeChange,
  onOpenAbout,
  onOpenAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'languages' | 'editor' | 'about'>('profile');

  // Form states
  const [name, setName] = useState(profile?.student_name || '');
  const [studentClass, setStudentClass] = useState(profile?.student_class || 8);
  const [enabledLangIds, setEnabledLangIds] = useState<Set<SupportedLanguageId>>(() => {
    return new Set(languages.filter((l) => l.enabled).map((l) => l.id));
  });
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if profile changes
  React.useEffect(() => {
    if (profile) {
      setName(profile.student_name);
      setStudentClass(profile.student_class);
    }
  }, [profile]);

  if (!isOpen) return null;

  const suggestedIds = new Set(getSuggestedLanguagesForClass(studentClass));

  const toggleLanguage = (id: SupportedLanguageId) => {
    setEnabledLangIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveAll = async () => {
    const trimmed = name.trim();
    if (trimmed) {
      await onSaveProfile(trimmed, studentClass);
    }
    await onSaveLanguages(Array.from(enabledLangIds));
    onFontSizeChange(currentFontSize);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const handleVisitDeveloperHut = () => {
    if (window.api?.openExternalUrl) {
      window.api.openExternalUrl('https://developerhut.in');
    } else {
      window.open('https://developerhut.in', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-fade-in">
      <div className="w-full max-w-xl bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Tricolour Accent Line */}
        <div className="h-1 w-full bg-tricolour" />

        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0F19]/50">
          <h2 className="font-bold text-white text-base">Settings & Preferences</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-[#1E293B] gap-4 text-xs bg-[#0F172A]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('languages')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'languages'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Languages</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
                    School Class
                  </label>
                  <span className="text-xs font-bold text-indigo-400">Class {studentClass}</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {CLASSES.map((cls) => {
                    const isSelected = studentClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setStudentClass(cls)}
                        className={`py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-[#0B0F19] text-[#94A3B8] border border-[#1E293B] hover:border-[#334155] hover:text-white'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#64748B] mt-2">
                  Modifying your grade will automatically update syllabus recommendations.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Languages */}
          {activeTab === 'languages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">
                  Select the languages you want active in your toolbar:
                </span>
                <button
                  type="button"
                  onClick={() => setEnabledLangIds(new Set(Array.from(suggestedIds)))}
                  className="text-xs text-indigo-400 hover:underline font-medium cursor-pointer"
                >
                  Class {studentClass} Suggestions
                </button>
              </div>

              <div className="space-y-2">
                {ALL_SUPPORTED_LANGUAGES.map((lang) => {
                  const isEnabled = enabledLangIds.has(lang.id);
                  const isSuggested = suggestedIds.has(lang.id);

                  return (
                    <div
                      key={lang.id}
                      onClick={() => toggleLanguage(lang.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isEnabled
                          ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                          : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold">{lang.name}</span>
                        {isSuggested && (
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                            Syllabus
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isEnabled
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-[#334155] bg-[#0B0F19]'
                        }`}
                      >
                        {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Editor */}
          {activeTab === 'editor' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
                  Editor Font Size
                </label>
                <div className="flex items-center gap-2">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCurrentFontSize(size)}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                        currentFontSize === size
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-[#0B0F19] text-[#94A3B8] border border-[#1E293B] hover:border-[#334155] hover:text-white'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                <span className="text-xs font-semibold text-white block">Keyboard Shortcuts</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] font-mono pt-2">
                  <div>Ctrl + S: Save file</div>
                  <div>F5: Run program</div>
                  <div>Ctrl + Shift + A: Admin Portal</div>
                  <div>Ctrl + F: Search in editor</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: About Platform */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">STUDENT IDE</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE. A complete coding environment designed for school students, with offline programming tools.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold">Proudly Built in India 🇮🇳</span>
                  {onOpenAbout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAbout();
                      }}
                      className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      <span>Full About Page</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-6 border-t border-[#1E293B] bg-[#0B0F19] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Close
            </button>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                title="Teacher & Administrator Portal (Ctrl+Shift+A)"
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#64748B] hover:text-indigo-400 hover:bg-[#1E293B] rounded-lg transition-colors border border-transparent hover:border-[#1E293B] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>

          {activeTab !== 'about' && (
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
