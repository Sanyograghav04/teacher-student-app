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
  Check, 
  Eye, 
  EyeOff,
  BookOpen,
  Sparkles,
  Heart
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
      navigate('/verify-email?email=' + encodeURIComponent(email.trim()));
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen doodle-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-400/8 dark:bg-brand-600/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-brand-600 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-4 transform hover:scale-105 transition-all duration-300">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl font-extrabold text-brand-700 dark:text-white tracking-tight">
            Join Gurukul <span className="text-brand-500 font-bold text-2xl">by Ruby</span>
          </h1>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Create your account for personalized tuition & live mentorship
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="bg-white dark:bg-slate-900 border border-brand-100/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-card rounded-3xl transition-all">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    role === 'student'
                      ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-500/15 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      role === 'student'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      role === 'student'
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}>
                      {role === 'student' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Student</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Join live classes & learn</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                    role === 'teacher'
                      ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-500/15 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      role === 'teacher'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      role === 'teacher'
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}>
                      {role === 'teacher' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Teacher / Tutor</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Host batches & manage fees</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="e.g. Sanyog Raghav" 
                  className="block w-full pl-11 pr-4 py-3 bg-brand-50/50 dark:bg-slate-800/80 border border-brand-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@gurukul.com" 
                  className="block w-full pl-11 pr-4 py-3 bg-brand-50/50 dark:bg-slate-800/80 border border-brand-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="At least 6 characters" 
                  className="block w-full pl-11 pr-11 py-3 bg-brand-50/50 dark:bg-slate-800/80 border border-brand-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { ok: hasMinLength, label: '6+ Characters' },
                  { ok: hasUppercase, label: '1 Uppercase' },
                  { ok: hasNumber, label: '1 Number' },
                  { ok: hasSpecial, label: '1 Symbol (!@#$)' },
                ].map((r) => (
                  <div key={r.label} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${r.ok ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                      {r.ok ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '-'}
                    </span>
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !isPasswordValid} 
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create {role === 'teacher' ? 'Faculty' : 'Student'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-brand-100/60 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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