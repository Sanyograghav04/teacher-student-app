import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, RotateCw, CheckCircle2, AlertCircle, ExternalLink, BookOpen } from 'lucide-react';
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

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);
  useEffect(() => { if (timer > 0) { const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); } }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true); setResendMessage(''); setResendError('');
    try { await resendOtp(email); setResendMessage('A new verification link has been sent!'); setTimer(60); }
    catch (err) { setResendError(err.message || 'Failed to resend verification email.'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen doodle-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      <div className="absolute top-6 right-6 z-20"><ThemeToggle /></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-400/8 dark:bg-brand-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-600 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-5">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-700 dark:text-white tracking-tight">Gurukul <span className="text-brand-500 text-xl">by Ruby</span></h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white dark:bg-slate-900 border border-brand-100/80 dark:border-slate-800/80 py-8 px-6 sm:px-9 shadow-card rounded-2xl text-center transition-all">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Check Your Inbox</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">We sent a verification link to:<br /><span className="font-semibold text-brand-600 dark:text-brand-400 text-base">{email || 'your email'}</span></p>
          <div className="text-xs text-slate-600 dark:text-slate-300 mb-6 bg-brand-50/50 dark:bg-slate-800/70 p-4 rounded-xl border border-brand-100/60 dark:border-slate-700/60 text-left space-y-1">
            <p className="font-semibold text-brand-700 dark:text-white">Next steps:</p>
            <p className="text-slate-500 dark:text-slate-400">1. Open the confirmation email from Gurukul.</p>
            <p className="text-slate-500 dark:text-slate-400">2. Click <strong>"Confirm your email address"</strong>.</p>
          </div>
          {resendMessage && (<div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{resendMessage}</span></div>)}
          {resendError && (<div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{resendError}</span></div>)}
          <div className="space-y-3">
            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all">
              <span>Open Gmail</span><ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={handleResend} disabled={timer > 0 || resending} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-700 dark:text-slate-300 font-semibold text-xs border border-brand-200 dark:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <RotateCw className={`w-3.5 h-3.5 ${timer > 0 ? '' : 'animate-spin'}`} />
              <span>{timer > 0 ? `Resend Link in ${timer}s` : 'Resend Verification Link'}</span>
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-brand-100/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Already verified?{' '}<Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">Sign In Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
