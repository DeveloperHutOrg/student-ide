import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Code2, 
  Globe, 
  Database, 
  Cpu, 
  ArrowLeft, 
  ArrowRight,
  Info,
  Terminal
} from 'lucide-react';
import { SupportedLanguageId, LanguagePreference } from '@/common/types';
import { ALL_SUPPORTED_LANGUAGES, getSuggestedLanguagesForClass } from '@/common/languages';

interface LanguageSelectionProps {
  studentName: string;
  studentClass: number;
  initialPreferences?: LanguagePreference[];
  onComplete: (enabledLanguageIds: SupportedLanguageId[]) => void;
  onBack?: () => void;
  isSettingsMode?: boolean;
}

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  studentName,
  studentClass,
  initialPreferences,
  onComplete,
  onBack,
  isSettingsMode = false,
}) => {
  const suggestedIds = new Set(getSuggestedLanguagesForClass(studentClass));

  // Determine initial selection
  const [selectedLanguages, setSelectedLanguages] = useState<Set<SupportedLanguageId>>(() => {
    if (initialPreferences && initialPreferences.length > 0) {
      return new Set(
        initialPreferences.filter((p) => p.enabled).map((p) => p.id)
      );
    }
    // Default to suggested languages for this class
    return new Set(Array.from(suggestedIds));
  });

  const toggleLanguage = (id: SupportedLanguageId) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Prevent deselecting all languages
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedLanguages(new Set(ALL_SUPPORTED_LANGUAGES.map((l) => l.id)));
  };

  const resetToSuggested = () => {
    setSelectedLanguages(new Set(Array.from(suggestedIds)));
  };

  const handleSubmit = () => {
    onComplete(Array.from(selectedLanguages));
  };

  const getLanguageIcon = (id: SupportedLanguageId) => {
    switch (id) {
      case 'html':
        return <Globe className="w-5 h-5 text-orange-400" />;
      case 'css':
        return <Globe className="w-5 h-5 text-sky-400" />;
      case 'sql':
        return <Database className="w-5 h-5 text-purple-400" />;
      case 'cpp':
        return <Cpu className="w-5 h-5 text-rose-400" />;
      case 'php':
        return <Terminal className="w-5 h-5 text-indigo-400" />;
      default:
        return <Code2 className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-[#F8FAFC] flex items-center justify-center p-6 select-none relative overflow-hidden animate-fade-in">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#0F172A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        {/* Tricolour Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-tricolour rounded-t-2xl" />

        {/* Header */}
        <div className="mb-6 pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">
              {isSettingsMode ? 'Preferences' : 'Step 2 • Curriculum Customization'}
            </span>
            <span className="text-xs text-[#CBD5E1] bg-[#0B0F19] px-3 py-1 rounded-full border border-[#1E293B] font-mono">
              {studentName} • Class {studentClass}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-white">Choose Your Languages</h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Highlighted cards are recommended for <strong className="text-white">Class {studentClass}</strong>. You can adjust this anytime in Settings.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={resetToSuggested}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              Reset to Class {studentClass} Syllabus
            </button>
            <span className="text-[#334155]">•</span>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              Select All (7 Languages)
            </button>
          </div>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {ALL_SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.has(lang.id);
            const isSuggested = suggestedIds.has(lang.id);

            return (
              <div
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : 'bg-[#0B0F19] border-[#1E293B] hover:border-[#334155] opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600/20' : 'bg-[#1E293B]'
                    }`}
                  >
                    {getLanguageIcon(lang.id)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{lang.name}</span>
                      {isSuggested && (
                        <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Class {studentClass} Suggestion
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] line-clamp-1 mt-0.5">{lang.description}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-[#334155] bg-[#0B0F19]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-4 border-t border-[#1E293B] flex items-center justify-between">
          {onBack && !isSettingsMode ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#1E293B] border border-[#1E293B] text-[#CBD5E1] text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-[11px] text-[#64748B]">
              {selectedLanguages.size} of {ALL_SUPPORTED_LANGUAGES.length} selected
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer ml-auto"
          >
            <span>{isSettingsMode ? 'Save Preferences' : 'Launch Student IDE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
