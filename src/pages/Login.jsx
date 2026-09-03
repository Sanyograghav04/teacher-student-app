import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, BookOpen, Sparkles, Heart } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen doodle-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Soft ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-400/10 dark:bg-brand-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-brand-600 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-4 transform hover:scale-105 transition-all duration-300">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl font-extrabold text-brand-700 dark:text-white tracking-tight">
            Gurukul <span className="text-brand-500 font-bold text-2xl">by Ruby</span>
          </h1>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Welcome back! Sign in to join your live classroom
        </p>
      </div>

      {/* Card Form */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white dark:bg-slate-900 border border-brand-100/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-card rounded-3xl transition-all">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-1.5">
                Registered Email
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
                  placeholder="student@gurukul.com"
                  className="block w-full pl-11 pr-4 py-3.5 bg-brand-50/50 dark:bg-slate-800/80 border border-brand-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-11 pr-11 py-3.5 bg-brand-50/50 dark:bg-slate-800/80 border border-brand-200/80 dark:border-slate-700/80 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Classroom</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-5 border-t border-brand-100/60 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              New to Gurukul by Ruby?{' '}
              <Link 
                to="/register" 
                className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Personal Mentorship & Tuition with Ruby Ma'am</span>
        </div>
      </div>
    </div>
  );
}