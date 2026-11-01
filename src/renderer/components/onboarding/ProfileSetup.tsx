import React, { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#1e1e2e] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-lg bg-[#181825] border border-[#313244] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative branding header */}
        <div className="flex items-center gap-3 mb-6 text-[#89b4fa]">
          <BrandLogo size={36} />
          <div>
            <span className="font-bold text-white text-base">Student <span className="text-[#89b4fa]">IDE</span></span>
            <span className="block text-[11px] text-[#a6adc8] font-mono">Offline Edition</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isEditing ? 'Update Student Profile' : 'Welcome to Student IDE!'}
        </h1>
        <p className="text-[#a6adc8] text-sm mb-6">
          {isEditing
            ? 'Change your name or class level to update curriculum language suggestions.'
            : 'Get ready to code! No internet connection, password, or sign-up required.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Aarav Sharma"
              autoFocus
              className="w-full px-4 py-3 bg-[#11111b] border border-[#313244] rounded-xl text-white placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
            />
            {error && <p className="text-[#f38ba8] text-xs mt-1.5">{error}</p>}
          </div>

          {/* Class selection */}
          <div>
            <label className="block text-sm font-medium text-[#cdd6f4] mb-2 flex items-center justify-between">
              <span>Select Your Class</span>
              <span className="text-xs text-[#89b4fa]">Class {studentClass}</span>
            </label>

            <div className="grid grid-cols-7 gap-2">
              {CLASSES.map((cls) => {
                const isSelected = studentClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setStudentClass(cls)}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#89b4fa] text-[#11111b] shadow-lg shadow-[#89b4fa]/20 scale-105'
                        : 'bg-[#11111b] text-[#a6adc8] border border-[#313244] hover:border-[#45475a] hover:text-white'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>

            {/* Quick helper tip based on class */}
            <div className="mt-3 p-3 bg-[#11111b]/60 rounded-xl border border-[#313244]/50 flex items-start gap-2 text-xs text-[#a6adc8]">
              <BookOpen className="w-4 h-4 text-[#89b4fa] shrink-0 mt-0.5" />
              <div>
                {studentClass <= 8 && (
                  <span>
                    Suggested for Class {studentClass}: <strong>HTML, CSS, Python, JavaScript</strong> (Web basics & computational thinking).
                  </span>
                )}
                {studentClass >= 9 && studentClass <= 10 && (
                  <span>
                    Suggested for Class {studentClass}: <strong>Python, SQL, JavaScript</strong> (Algorithms, data querying & problem solving).
                  </span>
                )}
                {studentClass >= 11 && (
                  <span>
                    Suggested for Class {studentClass}: <strong>Python, C++, SQL, JavaScript, PHP</strong> (High-performance code & backend scripting).
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            {isEditing && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/3 py-3 px-4 rounded-xl border border-[#313244] text-[#a6adc8] hover:text-white hover:bg-[#313244]/40 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`flex-1 py-3 px-6 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#89b4fa]/20 hover:shadow-[#89b4fa]/30`}
            >
              <span>{isEditing ? 'Save Profile' : 'Next: Language Selection'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
