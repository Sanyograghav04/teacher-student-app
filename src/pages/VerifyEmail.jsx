import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, RotateCw, CheckCircle2, AlertCircle, Gem, ExternalLink } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [timer, setTimer] = useState(30);
  const { user, resendOtp } = useAuth();
  const navigate = useNavigate();

  // If user becomes authenticated (after clicking email link), auto-redirect
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    }
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    setResendMessage('');
    setResendError('');

    try {
      await resendOtp(email);
      setResendMessage('A new verification link has been sent to your email!');
      setTimer(60);
    } catch (err) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 items-center justify-center text-white shadow-xl shadow-rose-500/30 mb-4">
          <Gem className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gurukul
          </h2>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            by Ruby
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-xl text-center transition-colors">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-5 animate-bounce">
            <Mail className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            We sent a verification link to: <br />
            <span className="font-semibold text-rose-600 dark:text-rose-400 text-base">{email || 'your email'}</span>
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 bg-slate-100 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-left">
            ?? <strong>Next step:</strong> Open the email from <em>Gurukul / Supabase</em> and click the <strong>"Confirm your email address"</strong> link to activate your account.
          </p>

          {resendMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {resendError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          <div className="space-y-3">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all"
            >
              <span>Open Gmail</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${timer > 0 ? '' : 'animate-spin-once'}`} />
              <span>{timer > 0 ? `Resend Link in ${timer}s` : 'Resend Verification Link'}</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Already confirmed?{' '}
            <Link to="/login" className="font-semibold text-rose-600 dark:text-rose-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
