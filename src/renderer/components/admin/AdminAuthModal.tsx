import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, AlertCircle, Loader2, X, CheckCircle2 } from 'lucide-react';
import { AdminAuthStatus } from '@/common/types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (token: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      setLoading(true);
      setErrorMsg(null);
      try {
        if (window.api?.admin) {
          const status = await window.api.admin.getAuthStatus();
          if (isMounted) {
            setAuthStatus(status);
            if (status.isAuthenticated) {
              onAuthenticated('active_session');
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to check admin credentials.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [isOpen, onAuthenticated]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!window.api?.admin) {
      setErrorMsg('Admin API not available.');
      return;
    }

    if (!authStatus?.isConfigured) {
      // First-time setup
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await window.api.admin.setupPassword(password);
        if (res.success && res.token) {
          onAuthenticated(res.token);
        } else {
          setErrorMsg(res.error || 'Failed to set up admin password.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Setup error.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Login
      if (!password) {
        setErrorMsg('Please enter your admin password.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await window.api.admin.login(password);
        if (res.success && res.token) {
          onAuthenticated(res.token);
        } else {
          setErrorMsg(res.error || 'Incorrect admin password.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication error.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-[#181825] border border-[#313244] rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#a6adc8] hover:text-white hover:bg-[#313244] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#cdd6f4]">
            <Loader2 className="w-8 h-8 text-[#89b4fa] animate-spin mb-3" />
            <p className="text-xs text-[#a6adc8]">Verifying admin security...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#89b4fa]/15 border border-[#89b4fa]/30 text-[#89b4fa]">
                {authStatus?.isConfigured ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {authStatus?.isConfigured ? 'Admin Survey Access' : 'First-Time Admin Setup'}
                </h2>
                <p className="text-xs text-[#a6adc8]">
                  {authStatus?.isConfigured 
                    ? 'Enter master password to access analytics & export records.' 
                    : 'Create a local master password to protect survey data.'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-[#f38ba8]/15 border border-[#f38ba8]/30 text-xs text-[#f38ba8] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#cdd6f4] mb-1.5">
                  {authStatus?.isConfigured ? 'Master Admin Password' : 'Create Admin Password (min 6 chars)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#11111b] border border-[#313244] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] focus:ring-1 focus:ring-[#89b4fa] transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-[#6c7086] absolute right-3.5 top-3" />
                </div>
              </div>

              {!authStatus?.isConfigured && (
                <div>
                  <label className="block text-xs font-medium text-[#cdd6f4] mb-1.5">
                    Confirm Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#11111b] border border-[#313244] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] focus:ring-1 focus:ring-[#89b4fa] transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-[#6c7086] absolute right-3.5 top-3" />
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#6c7086] mb-5">
              🔒 Admin credentials and survey analytics are configured locally on this machine using scrypt cryptographic hashing.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[#a6adc8] hover:text-white bg-[#11111b] border border-[#313244] hover:bg-[#313244] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-[#11111b] bg-[#89b4fa] hover:bg-[#b4befe] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>{authStatus?.isConfigured ? 'Unlock Dashboard' : 'Set Admin Password'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
