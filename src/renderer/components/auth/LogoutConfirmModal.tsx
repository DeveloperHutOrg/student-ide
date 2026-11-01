import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  studentName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoggingOut?: boolean;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  studentName,
  onCancel,
  onConfirm,
  isLoggingOut = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0B0F19]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 id="logout-title" className="text-base font-bold text-white tracking-tight">
              Confirm Logout
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoggingOut}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-200 font-semibold">
            Are you sure you want to log out{studentName ? `, ${studentName}` : ''}?
          </p>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>What happens upon logout:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
              <li>Running code processes (Python, C++, etc.) will be terminated immediately.</li>
              <li>Your current session will be cleared.</li>
              <li>Your saved projects, files, and survey answers remain safe on disk.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E293B] bg-[#0B0F19]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoggingOut}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
