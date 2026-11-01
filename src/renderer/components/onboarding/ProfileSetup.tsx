import React, { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen, User, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface ProfileSetupProps {
  initialName?: string;
  initialClass?: number;
  onComplete: (name: string, studentClass: number) => void;
  isEditing?: boolean;
  onCancel?: () => void;
}

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  initialName = '',
  initialClass = 8,
  onComplete,
  isEditing = false,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [studentClass, setStudentClass] = useState<number>(initialClass);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name should be at least 2 characters long.');
      return;
    }
    setError('');
    onComplete(trimmed, studentClass);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-[#F8FAFC] flex items-center justify-center p-6 select-none relative overflow-hidden animate-fade-in">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#0F172A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Tricolour Accent Line at Top of Card */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-tricolour rounded-t-2xl" />

        {/* Decorative branding header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">
                STUDENT <span className="text-brand-gradient">IDE</span>
              </span>
              <span className="block text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                Learn. Code. Build.
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            100% Offline
          </span>
        </div>

        {/* Headline Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">
          {isEditing ? 'Update Student Profile' : 'Welcome to Student IDE!'}
        </h1>
        <p className="text-[#94A3B8] text-xs leading-relaxed mb-6">
          {isEditing
            ? 'Update your name or grade level. Your local code projects and settings are automatically preserved.'
            : 'A complete coding environment designed for school students, with offline programming tools. No sign-up, password or internet required.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
              Your Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Aarav Sharma"
                autoFocus
                className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
              <User className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            {error && <p className="text-rose-400 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Class selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
                Select Your School Class
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
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-[#0B0F19] text-[#94A3B8] border border-[#1E293B] hover:border-[#334155] hover:text-white'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#64748B] mt-2">
              We recommend programming languages tailored to your school grade syllabus.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {isEditing && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#1E293B] border border-[#1E293B] text-[#CBD5E1] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <div className="text-[11px] text-[#64748B]">
                Proudly Built in India 🇮🇳
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer ml-auto"
            >
              <span>{isEditing ? 'Save Changes' : 'Continue to Languages'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer Attribution */}
        <div className="mt-8 pt-4 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>By DeveloperHut • https://developerhut.in</span>
          <span>Offline Ready</span>
        </div>
      </div>
    </div>
  );
};
