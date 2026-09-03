import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  deleteUserAccount, 
  uploadAvatar, 
  updateUserProfile,
  supabase 
} from '../lib/supabase';
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
  Camera, 
  Sparkles, 
  KeyRound, 
  Save, 
  Image as ImageIcon 
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av1', label: 'Scholar', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GurukulScholar' },
  { id: 'av2', label: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sanyog' },
  { id: 'av3', label: 'Learner', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby' },
  { id: 'av4', label: 'Professor', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Professor' },
  { id: 'av5', label: 'Mentor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherAlex' },
  { id: 'av6', label: 'Genius', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GeniusBot' },
];

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'profile', 'security', 'danger'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Edit State
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete Account State
  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isTeacher = profile?.role === 'teacher';

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size exceeds 5MB limit.');
      return;
    }

    setUploadingAvatar(true);
    setProfileError('');
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setProfileError('Failed to upload picture. Please try another image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Display name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateUserProfile(user.id, {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || null,
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      setProfileSuccess('Profile and display name updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3500);
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteUserAccount(user.id);
      await signOut();
      onClose();
      alert('Your account and all associated data have been permanently deleted.');
      navigate('/login');
    } catch (err) {
      console.error('Account deletion error:', err);
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-brand-100/80 dark:border-slate-800 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with HIGH VISIBILITY Close Button */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
                Account Centre & Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update display name, profile photo, and credentials
              </p>
            </div>
          </div>

          {/* Cross (Close) Button - High Contrast & Easily Clickable */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all shadow-sm flex items-center justify-center"
            title="Close Account Centre"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {[
            { id: 'profile', label: 'My Profile & Avatar', icon: User },
            { id: 'security', label: 'Password', icon: KeyRound },
            { id: 'danger', label: 'Delete Account', icon: Trash2 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-1 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? tab.id === 'danger'
                    ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: Profile & Avatar Management */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar Selector & Preview */}
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-slate-800/60 border border-brand-100/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-brand-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md overflow-hidden border-2 border-white dark:border-slate-700">
                    {uploadingAvatar ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        onError={() => setAvatarUrl('')}
                      />
                    ) : (
                      <span>{fullName ? fullName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <label 
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Upload profile picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Profile Picture
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload your own photo or select a cool avatar below
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm transition-all">
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                      <span>{uploadingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        className="hidden" 
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatars Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Choose from Preset Avatars
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      className={`p-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group ${
                        avatarUrl === av.url
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/20 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 bg-white dark:bg-slate-800'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-10 h-10 rounded-xl" />
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-brand-600">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Account Details */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Username / Display Name on Screen *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sanyog Raghav"
                    className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This name appears on classroom video badges, notes, and dashboards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Account Role
                    </label>
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex items-center justify-between">
                      <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                        {profile?.role || 'student'}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${isTeacher ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Profile Button & Delete Account Link */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('danger')}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Danger Zone - Account Deletion */}
          {activeTab === 'danger' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-700 dark:text-rose-400">
                    Delete Your Account Permanently
                  </h4>
                  <p className="text-xs text-rose-600/90 dark:text-rose-400/80 mt-0.5 leading-relaxed">
                    This will delete your login credentials, classrooms, uploaded notes, and student records. This action is irreversible.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {deleteError}
                </div>
              )}

              {!confirmStep ? (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmStep(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>I want to delete my account</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-3 pt-3 border-t border-rose-200 dark:border-rose-900/40">
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
                        setDeleteError('');
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Deleting Account...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Confirm Permanent Deletion</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
