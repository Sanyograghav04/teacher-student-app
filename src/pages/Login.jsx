import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow accents inspired by modern e-learning UI */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/15 dark:bg-brand-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 bg-primary-500/10 dark:bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-primary-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back!
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Sign in to access your interactive Gurukul classroom
        </p>
      </div>

      {/* Card Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-2xl rounded-3xl backdrop-blur-2xl transition-all">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
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
                  placeholder="student@gurukul.com"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-primary-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/45 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-7 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Don't have an account yet?{' '}
              <Link 
                to="/register" 
                className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
