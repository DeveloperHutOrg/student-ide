import React, { useState } from 'react';
import { 
  User, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { StudentProfile } from '@/common/types';
import { BrandLogo } from '../common/BrandLogo';

interface LoginViewProps {
  profile: StudentProfile | null;
  onLogin: () => void;
  onSwitchStudent: (name: string, studentClass: number) => void;
  onOpenAdminAuth: () => void;
}

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  onLogin,
  onSwitchStudent,
  onOpenAdminAuth,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchName, setSwitchName] = useState('');
  const [switchClass, setSwitchClass] = useState<number>(profile?.student_class || 8);
  const [nameError, setNameError] = useState('');
  const [allProfiles, setAllProfiles] = useState<StudentProfile[]>([]);

  React.useEffect(() => {
    if (window.api?.getAllProfiles) {
      window.api.getAllProfiles().then((list) => {
        if (list && Array.isArray(list)) {
          setAllProfiles(list);
        }
      }).catch(() => {});
    }
  }, [isSwitching]);

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = switchName.trim();
    if (!trimmed) {
      setNameError('Please enter the student name');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    onSwitchStudent(trimmed, switchClass);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-[#1E293B]/60 bg-[#0B0F19]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <BrandLogo size={32} />
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              STUDENT <span className="text-brand-gradient">IDE</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Learn. Code. Build.
            </div>
          </div>
        </div>

        {/* Offline Badge & Admin Link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Offline Mode</span>
          </div>

          <button
            onClick={onOpenAdminAuth}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E293B] rounded-lg border border-[#1E293B] transition-colors cursor-pointer"
            title="School Teacher & Lab Administrator Portal"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Admin Portal</span>
          </button>
        </div>
      </header>

      {/* Indian Tricolour Accent Line */}
      <div className="h-1 w-full bg-tricolour shadow-sm z-10" />

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-lg bg-[#0F172A] border border-[#1E293B] rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Official Branding Headline */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Offline Programming Workspace</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">
              INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              A complete coding environment designed for school students, with offline programming tools.
            </p>
          </div>

          {!isSwitching ? (
            /* Saved Profile Login View */
            <div className="space-y-6 pt-2">
              <div className="p-5 rounded-2xl bg-[#0B0F19] border border-[#1E293B] text-center space-y-3">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 mx-auto shadow-lg shadow-indigo-600/20">
                    <div className="w-full h-full bg-[#0F172A] rounded-2xl flex items-center justify-center">
                      <User className="w-10 h-10 text-indigo-400" />
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Welcome back
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                    {profile ? profile.student_name : 'Student'}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    <BookOpen className="w-3 h-3" />
                    <span>Class {profile ? profile.student_class : '8'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onLogin}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer group"
                >
                  <span>Continue to Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSwitchName(profile?.student_name || '');
                    setSwitchClass(profile?.student_class || 8);
                    setIsSwitching(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-transparent hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#334155] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Student / Change Profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* Switch Student Form */
            <form onSubmit={handleSwitchSubmit} className="space-y-4 pt-2">
              <div className="text-left space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Switch Student Profile</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select your profile below or enter your name to log in on this computer.
                </p>
              </div>

              {allProfiles.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[11px] font-semibold text-slate-400">Saved Students on this PC:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {allProfiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSwitchName(p.student_name);
                          setSwitchClass(p.student_class);
                          if (nameError) setNameError('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          switchName.toLowerCase() === p.student_name.toLowerCase() && switchClass === p.student_class
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                            : 'bg-[#0B0F19] border-[#1E293B] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {p.student_name} (Class {p.student_class})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Student Name
                </label>
                <input
                  type="text"
                  value={switchName}
                  onChange={(e) => {
                    setSwitchName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Enter full name"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none transition-colors"
                />
                {nameError && (
                  <p className="text-xs text-rose-400 font-medium">{nameError}</p>
                )}
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    School Class
                  </label>
                  <span className="text-xs font-bold text-indigo-400">Class {switchClass}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {CLASSES.map((cls) => {
                    const isSelected = switchClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setSwitchClass(cls)}
                        className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-[#0B0F19] text-slate-400 border border-[#1E293B] hover:border-[#334155] hover:text-white'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSwitching(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Save & Log In
                </button>
              </div>
            </form>
          )}

          {/* Offline Security Note */}
          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Private & offline: Student data and projects stay securely on this PC.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-[#1E293B]/60 text-center text-xs text-slate-500 z-10 bg-[#0B0F19]/80">
        Student IDE v1.0.0 • Developed by DeveloperHut • Proudly Built in India 🇮🇳
      </footer>
    </div>
  );
};
