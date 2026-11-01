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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-xl bg-[#181825] border border-[#313244] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-[#313244] flex items-center justify-between bg-[#11111b]/50">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#89b4fa]" />
            <h2 className="font-bold text-white text-base">Student IDE Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#a6adc8] hover:text-white hover:bg-[#313244] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#313244] gap-6 text-sm bg-[#181825]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('languages')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'languages'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Languages ({enabledLangIds.size})</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'about'
                ? 'border-[#89b4fa] text-[#89b4fa]'
                : 'border-transparent text-[#a6adc8] hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8] mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student Name"
                  className="w-full px-3 py-2 bg-[#11111b] border border-[#313244] rounded-xl text-white text-sm focus:outline-none focus:border-[#89b4fa]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8] mb-1.5 flex items-center justify-between">
                  <span>Current Class</span>
                  <span className="text-xs text-[#89b4fa]">Class {studentClass}</span>
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setStudentClass(cls)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        studentClass === cls
                          ? 'bg-[#89b4fa] text-[#11111b] scale-105 shadow-sm'
                          : 'bg-[#11111b] text-[#a6adc8] border border-[#313244] hover:text-white'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-[#11111b] rounded-xl border border-[#313244] text-xs text-[#a6adc8] space-y-1">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#a6e3a1]" />
                  <span>Persistent Local Storage</span>
                </div>
                <p className="text-[11px] text-[#a6adc8]">
                  Changes are saved permanently to your local SQLite database. Existing projects, files, and language preferences remain preserved.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="space-y-2">
              <p className="text-xs text-[#a6adc8] mb-3">
                Toggle languages to display in your IDE. Suggestions are tailored for Class {studentClass}.
              </p>

              {ALL_SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = enabledLangIds.has(lang.id);
                const isSuggested = suggestedIds.has(lang.id);

                return (
                  <div
                    key={lang.id}
                    onClick={() => toggleLanguage(lang.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#1e1e2e] border-[#89b4fa]'
                        : 'bg-[#11111b] border-[#313244] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{lang.name}</span>
                        <span className="text-[11px] font-mono text-[#6c7086]">{lang.extension}</span>
                        {isSuggested && (
                          <span className="text-[10px] bg-[#89b4fa]/20 text-[#89b4fa] px-1.5 py-0.2 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Suggested
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#a6adc8] block mt-0.5">{lang.description}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[#89b4fa] border-[#89b4fa] text-[#11111b]'
                          : 'border-[#45475a] bg-[#181825]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8] mb-2">
                  Code Font Size
                </label>
                <div className="flex items-center gap-2">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCurrentFontSize(size)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        currentFontSize === size
                          ? 'bg-[#89b4fa] text-[#11111b]'
                          : 'bg-[#11111b] border border-[#313244] text-[#a6adc8] hover:text-white'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#11111b] rounded-xl border border-[#313244] text-xs text-[#a6adc8]">
                <span>Monaco Editor runs 100% locally from bundled assets without internet.</span>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1e1e2e] border border-[#313244] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#89b4fa] to-[#b4befe] flex items-center justify-center text-[#11111b] font-bold text-sm">
                    V
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Vasu</h3>
                    <p className="text-[11px] text-[#89b4fa]">Founder of Student IDE</p>
                  </div>
                </div>
                <p className="text-xs text-[#a6adc8] leading-relaxed pt-1">
                  A developer and technology enthusiast interested in software development and building useful technology for students.
                </p>
              </div>

              <div className="p-4 bg-[#11111b] border border-[#313244] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-medium text-xs">
                    <Globe className="w-4 h-4 text-[#89dceb]" />
                    <span>DeveloperHut</span>
                  </div>
                  <span className="text-[11px] text-[#6c7086] font-mono">https://developerhut.in</span>
                </div>
                <p className="text-xs text-[#a6adc8] leading-relaxed">
                  Student IDE is connected to the broader development vision of DeveloperHut. DeveloperHut focuses on creating digital products, software solutions and technology experiences.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVisitDeveloperHut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-semibold transition-all"
                  >
                    <span>Visit DeveloperHut</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {onOpenAbout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAbout();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#313244] hover:border-[#89b4fa] text-xs text-[#cdd6f4] transition-colors"
                    >
                      <span>Full Founder Page</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-6 border-t border-[#313244] bg-[#11111b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#a6adc8] hover:text-white"
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
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#6c7086] hover:text-[#89b4fa] hover:bg-[#313244]/40 rounded-lg transition-colors border border-transparent hover:border-[#313244]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#89b4fa]" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>

          {activeTab !== 'about' && (
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-semibold shadow-md transition-all"
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
