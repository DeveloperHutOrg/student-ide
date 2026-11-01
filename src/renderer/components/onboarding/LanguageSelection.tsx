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
  Info
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
      case 'css':
        return <Globe className="w-5 h-5 text-[#89dceb]" />;
      case 'sql':
        return <Database className="w-5 h-5 text-[#fab387]" />;
      case 'cpp':
        return <Cpu className="w-5 h-5 text-[#f38ba8]" />;
      default:
        return <Code2 className="w-5 h-5 text-[#a6e3a1]" />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1e1e2e] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-2xl bg-[#181825] border border-[#313244] rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#89b4fa]">
              Step 2 • Curriculum Customization
            </span>
            <span className="text-xs text-[#a6adc8] bg-[#11111b] px-3 py-1 rounded-full border border-[#313244]">
              {studentName} • Class {studentClass}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white">Choose Your Languages</h1>
          <p className="text-[#a6adc8] text-sm mt-1">
            Languages recommended for Class {studentClass} are highlighted. You can enable any other language you wish to practice.
          </p>
        </div>

        {/* Quick controls */}
        <div className="flex items-center justify-between pb-3 text-xs text-[#a6adc8] border-b border-[#313244]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToSuggested}
              className="text-[#89b4fa] hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Reset to Class {studentClass} Suggested
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={selectAll}
              className="hover:text-white transition-colors"
            >
              Select All (7)
            </button>
          </div>
          <span>{selectedLanguages.size} of 7 enabled</span>
        </div>

        {/* Language Cards Grid */}
        <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1">
          {ALL_SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.has(lang.id);
            const isSuggested = suggestedIds.has(lang.id);
            const isWeb = lang.category === 'web';

            return (
              <div
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1e1e2e] border-[#89b4fa] shadow-sm'
                    : 'bg-[#11111b] border-[#313244] opacity-70 hover:opacity-100 hover:border-[#45475a]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#313244]' : 'bg-[#181825]'
                    }`}
                  >
                    {getLanguageIcon(lang.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {lang.name}
                      </span>
                      <span className="text-xs text-[#6c7086] font-mono">
                        {lang.extension}
                      </span>
                      {isSuggested && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#89b4fa]/15 text-[#89b4fa] border border-[#89b4fa]/30 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Suggested
                        </span>
                      )}
                      {isWeb && (
                        <span className="text-[11px] font-medium bg-[#89dceb]/15 text-[#89dceb] border border-[#89dceb]/30 px-2 py-0.5 rounded-full">
                          Web Engine
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#a6adc8] mt-0.5">
                      {lang.description}
                    </p>
                  </div>
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ml-3 ${
                    isSelected
                      ? 'bg-[#89b4fa] border-[#89b4fa] text-[#11111b]'
                      : 'border-[#45475a] bg-[#181825]'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Offline info note */}
        <div className="p-3 bg-[#11111b] rounded-xl border border-[#313244] flex items-start gap-2.5 text-xs text-[#a6adc8] mt-3">
          <Info className="w-4 h-4 text-[#89b4fa] shrink-0 mt-0.5" />
          <span>
            <strong>Offline Guarantee:</strong> HTML and CSS execute live via Electron's built-in preview. JavaScript runs with V8, and SQL runs with the built-in SQLite engine. No cloud connection or compilation servers needed.
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-5 border-t border-[#313244] mt-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="py-2.5 px-4 rounded-xl border border-[#313244] text-[#a6adc8] hover:text-white hover:bg-[#313244]/40 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 px-6 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#89b4fa]/20 hover:shadow-[#89b4fa]/30"
          >
            <span>{isSettingsMode ? 'Save Language Preferences' : 'Launch Student IDE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
