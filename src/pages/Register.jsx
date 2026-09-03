import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  GraduationCap, 
  Sparkles,
  Check, 
  Eye, 
  EyeOff,
  BookOpen
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Password validation rules
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please fulfill all password requirements before continuing.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp(email.trim(), password, fullName.trim(), role);
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-500/15 dark:bg-brand-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-primary-500/10 dark:bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-primary-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Choose your role to get started with Gurukul Live
        </p>
      </div>

      {/* Card Form */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-2xl rounded-3xl backdrop-blur-2xl transition-all">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role Selection Cards (Inspired by Media 1 & Media 4) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    role === 'student'
                      ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/20 shadow-md ring-2 ring-brand-500/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      role === 'student'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[11px] ${
                      role === 'student'
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}>
                      {role === 'student' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Student</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Join live classes & learn</p>
                  </div>
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    role === 'teacher'
                      ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/20 shadow-md ring-2 ring-brand-500/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      role === 'teacher'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[11px] ${
                      role === 'teacher'
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}>
                      {role === 'teacher' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Teacher</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Host rooms & manage fees</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Cameron Williamson"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gurukul.com"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Create Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full pl-11 pr-11 py-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Checklist Pills */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    ✓
                  </span>
                  <span>6+ Characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasUppercase ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    ✓
                  </span>
                  <span>1 Uppercase Letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    ✓
                  </span>
                  <span>1 Number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    ✓
                  </span>
                  <span>1 Special Symbol</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-primary-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/45 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create {role === 'teacher' ? 'Teacher' : 'Student'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-7 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
