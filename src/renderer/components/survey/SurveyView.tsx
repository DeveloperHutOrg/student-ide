import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck, 
  ArrowLeft, 
  Send, 
  Loader2, 
  Sparkles,
  HelpCircle,
  Clock,
  User
} from 'lucide-react';
import { 
  SurveyDefinition, 
  SurveyStatus, 
  SurveyResponseRecord, 
  StudentProfile 
} from '@/common/types';
import { INITIAL_SURVEY, DEFAULT_SURVEY_ID } from '@/common/surveyData';

interface SurveyViewProps {
  onBackToEditor: () => void;
  onSurveySubmitted: () => void;
}

export const SurveyView: React.FC<SurveyViewProps> = ({
  onBackToEditor,
  onSurveySubmitted,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<SurveyStatus | null>(null);
  const [surveyDef, setSurveyDef] = useState<SurveyDefinition>(INITIAL_SURVEY);
  const [existingResponse, setExistingResponse] = useState<SurveyResponseRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Answers State
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [q3, setQ3] = useState<string>('');
  const [q4, setQ4] = useState<string[]>([]);
  const [q5, setQ5] = useState<string[]>([]);
  const [q6, setQ6] = useState<string>('');

  // 1. Fetch survey status, questions, and any existing response on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSurvey() {
      setLoading(true);
      setErrorMsg(null);
      try {
        if (!window.api) {
          setLoading(false);
          return;
        }

        const surveyStatus = await window.api.getSurveyStatus();
        const questions = await window.api.getSurveyQuestions();

        if (isMounted) {
          setStatus(surveyStatus);
          if (questions) {
            setSurveyDef(questions);
          }

          if (surveyStatus.hasSubmitted) {
            const resp = await window.api.getSurveyResponse();
            if (isMounted && resp) {
              setExistingResponse(resp);
            }
          }
        }
      } catch (err: any) {
        console.error('[SurveyView] Error loading survey:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load survey.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSurvey();
    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-select toggle helper
  const toggleMultiSelect = (
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    option: string
  ) => {
    setter(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
    // Clear validation error on change
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next['q4'];
      delete next['q5'];
      return next;
    });
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!q1) errors['q1'] = 'Please select how easy Student IDE is to use.';
    if (!q2) errors['q2'] = 'Please select the programming language you use most.';
    if (!q3) errors['q3'] = 'Please select how often you use Student IDE.';
    if (q4.length === 0) errors['q4'] = 'Please select at least one useful feature.';
    if (q5.length === 0) errors['q5'] = 'Please select at least one improvement you would like to see.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) {
      return;
    }

    if (!window.api) {
      setErrorMsg('Electron API is not available.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        surveyId: surveyDef.id || DEFAULT_SURVEY_ID,
        answers: {
          q1,
          q2,
          q3,
          q4,
          q5,
          q6: q6.trim(),
        },
      };

      const result = await window.api.submitSurvey(payload);
      if (result && result.success) {
        // Notify parent to display the green tick immediately in Navbar
        onSurveySubmitted();

        // Refresh status and response
        const newStatus = await window.api.getSurveyStatus();
        const newResp = await window.api.getSurveyResponse();
        setStatus(newStatus);
        setExistingResponse(newResp);
      } else {
        setErrorMsg('Submission failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[SurveyView] Submission error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred while saving feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e2e] text-[#cdd6f4] p-6">
        <Loader2 className="w-8 h-8 text-[#89b4fa] animate-spin mb-3" />
        <p className="text-sm text-[#a6adc8]">Loading feedback survey...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: SURVEY ALREADY COMPLETED (CONFIRMATION SCREEN)
  // -------------------------------------------------------------
  if (status?.hasSubmitted) {
    const formattedDate = status.submittedAt 
      ? new Date(status.submittedAt.replace(' ', 'T')).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Recently';

    return (
      <div className="flex-1 flex flex-col bg-[#1e1e2e] text-[#cdd6f4] overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 py-10">
          {/* Back button */}
          <button
            onClick={onBackToEditor}
            className="flex items-center gap-2 text-xs text-[#a6adc8] hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Code Editor</span>
          </button>

          {/* Success Hero Card */}
          <div className="bg-[#181825] border border-[#313244] rounded-2xl p-8 mb-8 text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#a6e3a1] via-[#89b4fa] to-[#cba6f7]" />
            <div className="inline-flex p-3 rounded-full bg-[#a6e3a1]/15 text-[#a6e3a1] mb-4 ring-8 ring-[#a6e3a1]/5">
              <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Feedback Survey Completed!
            </h1>
            <p className="text-sm text-[#a6adc8] max-w-lg mx-auto">
              Thank you for sharing your thoughts. Your feedback helps us make Student IDE the best offline coding tool for students.
            </p>

            {/* Metadata Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#313244] text-xs">
              <div className="bg-[#11111b] p-3 rounded-xl border border-[#313244]/60">
                <span className="text-[#a6adc8] block mb-1">Student Profile</span>
                <span className="font-semibold text-white">
                  {status.studentProfile?.name || 'Student'} (Class {status.studentProfile?.studentClass || '?'})
                </span>
              </div>
              <div className="bg-[#11111b] p-3 rounded-xl border border-[#313244]/60">
                <span className="text-[#a6adc8] block mb-1">Submission Date</span>
                <span className="font-semibold text-[#a6e3a1]">
                  {formattedDate}
                </span>
              </div>
              <div className="bg-[#11111b] p-3 rounded-xl border border-[#313244]/60">
                <span className="text-[#a6adc8] block mb-1">Privacy Guarantee</span>
                <span className="font-semibold text-[#89b4fa]">
                  100% Offline SQLite
                </span>
              </div>
            </div>
          </div>

          {/* Summary of Submitted Answers */}
          {existingResponse?.answers && (
            <div className="bg-[#181825] border border-[#313244] rounded-2xl p-6 mb-8">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#89b4fa]" />
                <span>Your Submitted Answers (Read-Only)</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                  <span className="text-[#a6adc8] block font-medium mb-1">
                    1. How easy is Student IDE to use?
                  </span>
                  <span className="text-[#89b4fa] font-semibold text-sm">
                    {existingResponse.answers.q1}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                  <span className="text-[#a6adc8] block font-medium mb-1">
                    2. Primary programming language:
                  </span>
                  <span className="text-[#89b4fa] font-semibold text-sm">
                    {existingResponse.answers.q2}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                  <span className="text-[#a6adc8] block font-medium mb-1">
                    3. Usage frequency:
                  </span>
                  <span className="text-[#89b4fa] font-semibold text-sm">
                    {existingResponse.answers.q3}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                  <span className="text-[#a6adc8] block font-medium mb-1">
                    4. Most useful features:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(existingResponse.answers.q4) ? (
                      existingResponse.answers.q4.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#89b4fa]/15 text-[#89b4fa] font-medium">
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#89b4fa] font-semibold">{existingResponse.answers.q4}</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                  <span className="text-[#a6adc8] block font-medium mb-1">
                    5. Desired improvements:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(existingResponse.answers.q5) ? (
                      existingResponse.answers.q5.map((imp, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#cba6f7]/15 text-[#cba6f7] font-medium">
                          {imp}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#cba6f7] font-semibold">{existingResponse.answers.q5}</span>
                    )}
                  </div>
                </div>

                {existingResponse.answers.q6 && (
                  <div className="p-3 rounded-lg bg-[#11111b] border border-[#313244]/40">
                    <span className="text-[#a6adc8] block font-medium mb-1">
                      6. Additional suggestions:
                    </span>
                    <p className="text-[#cdd6f4] italic whitespace-pre-wrap">
                      "{existingResponse.answers.q6}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-center">
            <button
              onClick={onBackToEditor}
              className="px-6 py-2.5 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Coding in IDE</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: SURVEY ACTIVE FORM (INCOMPLETE STATE)
  // -------------------------------------------------------------
  const q1Options = surveyDef.questions[0]?.options || [];
  const q2Options = surveyDef.questions[1]?.options || [];
  const q3Options = surveyDef.questions[2]?.options || [];
  const q4Options = surveyDef.questions[3]?.options || [];
  const q5Options = surveyDef.questions[4]?.options || [];

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e2e] text-[#cdd6f4] overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToEditor}
            className="flex items-center gap-2 text-xs text-[#a6adc8] hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Code Editor</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fab387]/15 text-[#fab387] border border-[#fab387]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fab387] animate-pulse" />
            Incomplete • Please share your feedback
          </span>
        </div>

        {/* Survey Header Banner */}
        <div className="bg-[#181825] border border-[#313244] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#89b4fa]/15 text-[#89b4fa] shrink-0 border border-[#89b4fa]/20">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-1.5 tracking-tight">
                {surveyDef.title}
              </h1>
              <p className="text-xs text-[#a6adc8] leading-relaxed">
                {surveyDef.description}
              </p>
            </div>
          </div>

          {/* Student Profile Card (Prefilled & Read-Only from SQLite) */}
          <div className="mt-5 pt-4 border-t border-[#313244] flex flex-wrap items-center justify-between gap-3 text-xs bg-[#11111b]/60 p-3 rounded-xl border border-[#313244]/50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#89b4fa]" />
              <span className="text-[#a6adc8]">Student:</span>
              <span className="font-semibold text-white">
                {status?.studentProfile ? status.studentProfile.name : 'Registered Student'}
              </span>
              <span className="bg-[#313244] text-[#cdd6f4] px-2 py-0.5 rounded text-[11px] font-medium">
                Class {status?.studentProfile ? status.studentProfile.studentClass : '8'}
              </span>
              {status?.studentProfile?.id && (
                <span className="text-[#6c7086] text-[11px]">
                  (Profile ID: #{status.studentProfile.id})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[#a6adc8] text-[11px]">
              <Lock className="w-3.5 h-3.5 text-[#a6adc8]" />
              <span>Prefilled from local SQLite profile</span>
            </div>
          </div>

          {/* Privacy & Offline Operation Banner */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#a6e3a1] bg-[#a6e3a1]/10 px-3 py-1.5 rounded-lg border border-[#a6e3a1]/20">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              <strong>100% Offline & Private:</strong> Responses are stored locally on your device. No data is sent over the internet.
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#f38ba8]/15 border border-[#f38ba8]/30 text-xs text-[#f38ba8] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1: How easy is Student IDE to use? */}
          <div className={`p-5 rounded-2xl bg-[#181825] border transition-all ${
            validationErrors['q1'] ? 'border-[#f38ba8] ring-1 ring-[#f38ba8]/40' : 'border-[#313244]'
          }`}>
            <label className="block text-sm font-semibold text-white mb-1.5">
              1. How easy is Student IDE to use? <span className="text-[#f38ba8]">*</span>
            </label>
            <p className="text-xs text-[#a6adc8] mb-3">Select the option that best matches your experience.</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {q1Options.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    setQ1(opt);
                    setValidationErrors(prev => { const n = { ...prev }; delete n['q1']; return n; });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    q1 === opt
                      ? 'bg-[#89b4fa]/20 border-[#89b4fa] text-[#89b4fa] shadow-sm'
                      : 'bg-[#11111b] border-[#313244] text-[#cdd6f4] hover:bg-[#313244]/40 hover:border-[#45475a]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {validationErrors['q1'] && (
              <p className="text-[11px] text-[#f38ba8] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors['q1']}
              </p>
            )}
          </div>

          {/* Question 2: Which programming language do you use most? */}
          <div className={`p-5 rounded-2xl bg-[#181825] border transition-all ${
            validationErrors['q2'] ? 'border-[#f38ba8] ring-1 ring-[#f38ba8]/40' : 'border-[#313244]'
          }`}>
            <label className="block text-sm font-semibold text-white mb-1.5">
              2. Which programming language do you use most? <span className="text-[#f38ba8]">*</span>
            </label>
            <p className="text-xs text-[#a6adc8] mb-3">Choose your primary language in Student IDE.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {q2Options.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    setQ2(opt);
                    setValidationErrors(prev => { const n = { ...prev }; delete n['q2']; return n; });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                    q2 === opt
                      ? 'bg-[#89b4fa]/20 border-[#89b4fa] text-[#89b4fa] shadow-sm'
                      : 'bg-[#11111b] border-[#313244] text-[#cdd6f4] hover:bg-[#313244]/40 hover:border-[#45475a]'
                  }`}
                >
                  <span>{opt}</span>
                  {q2 === opt && <CheckCircle2 className="w-3.5 h-3.5 text-[#89b4fa]" />}
                </button>
              ))}
            </div>
            {validationErrors['q2'] && (
              <p className="text-[11px] text-[#f38ba8] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors['q2']}
              </p>
            )}
          </div>

          {/* Question 3: How often do you use Student IDE? */}
          <div className={`p-5 rounded-2xl bg-[#181825] border transition-all ${
            validationErrors['q3'] ? 'border-[#f38ba8] ring-1 ring-[#f38ba8]/40' : 'border-[#313244]'
          }`}>
            <label className="block text-sm font-semibold text-white mb-1.5">
              3. How often do you use Student IDE? <span className="text-[#f38ba8]">*</span>
            </label>
            <p className="text-xs text-[#a6adc8] mb-3">Select your typical coding schedule.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {q3Options.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    setQ3(opt);
                    setValidationErrors(prev => { const n = { ...prev }; delete n['q3']; return n; });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    q3 === opt
                      ? 'bg-[#89b4fa]/20 border-[#89b4fa] text-[#89b4fa] shadow-sm'
                      : 'bg-[#11111b] border-[#313244] text-[#cdd6f4] hover:bg-[#313244]/40 hover:border-[#45475a]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {validationErrors['q3'] && (
              <p className="text-[11px] text-[#f38ba8] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors['q3']}
              </p>
            )}
          </div>

          {/* Question 4: Which features do you find most useful? (Multi-select) */}
          <div className={`p-5 rounded-2xl bg-[#181825] border transition-all ${
            validationErrors['q4'] ? 'border-[#f38ba8] ring-1 ring-[#f38ba8]/40' : 'border-[#313244]'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-white">
                4. Which features do you find most useful? <span className="text-[#f38ba8]">*</span>
              </label>
              <span className="text-[11px] text-[#a6adc8]">Select one or more</span>
            </div>
            <p className="text-xs text-[#a6adc8] mb-3">Check all features that help your school studies.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q4Options.map((opt) => {
                const selected = q4.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleMultiSelect(q4, setQ4, opt)}
                    className={`py-2.5 px-3.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-[#89b4fa]/20 border-[#89b4fa] text-[#89b4fa] shadow-sm'
                        : 'bg-[#11111b] border-[#313244] text-[#cdd6f4] hover:bg-[#313244]/40 hover:border-[#45475a]'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected ? 'bg-[#89b4fa] border-[#89b4fa]' : 'border-[#45475a] bg-[#181825]'
                    }`}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-[#11111b] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {validationErrors['q4'] && (
              <p className="text-[11px] text-[#f38ba8] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors['q4']}
              </p>
            )}
          </div>

          {/* Question 5: What improvements would you like to see? (Multi-select) */}
          <div className={`p-5 rounded-2xl bg-[#181825] border transition-all ${
            validationErrors['q5'] ? 'border-[#f38ba8] ring-1 ring-[#f38ba8]/40' : 'border-[#313244]'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-white">
                5. What improvements would you like to see? <span className="text-[#f38ba8]">*</span>
              </label>
              <span className="text-[11px] text-[#a6adc8]">Select one or more</span>
            </div>
            <p className="text-xs text-[#a6adc8] mb-3">Vote on the capabilities we should add in upcoming versions.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q5Options.map((opt) => {
                const selected = q5.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleMultiSelect(q5, setQ5, opt)}
                    className={`py-2.5 px-3.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-[#cba6f7]/20 border-[#cba6f7] text-[#cba6f7] shadow-sm'
                        : 'bg-[#11111b] border-[#313244] text-[#cdd6f4] hover:bg-[#313244]/40 hover:border-[#45475a]'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected ? 'bg-[#cba6f7] border-[#cba6f7]' : 'border-[#45475a] bg-[#181825]'
                    }`}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-[#11111b] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {validationErrors['q5'] && (
              <p className="text-[11px] text-[#f38ba8] mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors['q5']}
              </p>
            )}
          </div>

          {/* Question 6: Additional suggestions (Optional text area) */}
          <div className="p-5 rounded-2xl bg-[#181825] border border-[#313244]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-white">
                6. Additional suggestions:
              </label>
              <span className="text-[11px] text-[#a6adc8]">Optional</span>
            </div>
            <p className="text-xs text-[#a6adc8] mb-3">
              Share any thoughts, ideas, or feedback you'd like the Student IDE team to know.
            </p>

            <textarea
              value={q6}
              onChange={(e) => setQ6(e.target.value.slice(0, 2000))}
              placeholder="Tell us anything else that could make your programming experience better (optional)..."
              rows={4}
              className="w-full bg-[#11111b] border border-[#313244] rounded-xl p-3 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] focus:ring-1 focus:ring-[#89b4fa] transition-all resize-none"
            />
            <div className="flex justify-end mt-1 text-[10px] text-[#6c7086]">
              {q6.length} / 2000 characters
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBackToEditor}
              className="px-5 py-2.5 rounded-xl border border-[#313244] bg-[#11111b] hover:bg-[#313244] text-[#a6adc8] hover:text-white text-xs font-medium transition-colors"
            >
              Cancel & Back to Editor
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#89b4fa] to-[#b4befe] hover:from-[#b4befe] hover:to-[#cba6f7] text-[#11111b] text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Feedback Locally...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
