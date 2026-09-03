import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Sparkles, KeyRound } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/15 dark:bg-brand-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-primary-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-brand-500/30 mb-4 transform hover:scale-105 transition-transform">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Enter your registered email to receive a recovery link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-2xl rounded-3xl backdrop-blur-2xl transition-all">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                We sent a password reset link to <br />
                <span className="text-brand-600 dark:text-brand-400 font-semibold">{email}</span>.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
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
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-primary-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
