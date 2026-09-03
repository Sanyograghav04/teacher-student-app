import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteUserAccount } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Trash2, 
  AlertTriangle, 
  X, 
  Loader2, 
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const isTeacher = profile?.role === 'teacher';

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteUserAccount(user.id);
      await signOut();
      onClose();
      alert('Your account and all associated data have been permanently deleted.');
      navigate('/login');
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-brand-100/80 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-extrabold text-xl shadow-sm">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
              Account Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your personal profile and account credentials
            </p>
          </div>
        </div>

        {/* Profile Information Summary */}
        <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-slate-800/60 border border-brand-100/60 dark:border-slate-700/60 space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-brand-500" /> Full Name
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {profile?.full_name || 'User'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-brand-500" /> Email Address
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
              {user.email}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-brand-500" /> Account Type
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isTeacher 
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' 
                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            }`}>
              {profile?.role || 'Student'}
            </span>
          </div>

          {user.created_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-500" /> Member Since
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {new Date(user.created_at).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-rose-700 dark:text-rose-400">
                Danger Zone: Delete Account
              </h4>
              <p className="text-xs text-rose-600/90 dark:text-rose-400/80 mt-0.5 leading-relaxed">
                Permanently delete your account and all associated classroom records. This action cannot be reversed.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!confirmStep ? (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-3 pt-2 border-t border-rose-200 dark:border-rose-900/40">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                To confirm permanent deletion, please type <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 font-bold">DELETE</span> below:
              </p>

              <input
                type="text"
                autoFocus
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold tracking-wider"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setConfirmStep(false);
                    setConfirmText('');
                    setError('');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
