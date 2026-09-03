import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  CreditCard, CheckCircle2, Clock, AlertCircle, 
  RotateCcw, Loader2, MessageCircle, Calendar, FileText
} from 'lucide-react';

const RUPEE = '\u20B9';

export default function StudentFeeViewer() {
  const { user, profile } = useAuth();
  const [feeRecord, setFeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const studentEmail = user?.email || '';

  useEffect(() => {
    loadFeeRecord();
  }, [user]);

  const loadFeeRecord = async () => {
    setLoading(true);
    try {
      // 1. Check database for match by student_email or student_name
      let found = null;
      if (studentEmail) {
        const { data } = await supabase
          .from('student_fees')
          .select('*')
          .ilike('student_email', studentEmail.trim())
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          found = data[0];
        }
      }

      if (!found && studentName) {
        const { data } = await supabase
          .from('student_fees')
          .select('*')
          .ilike('student_name', studentName.trim())
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          found = data[0];
        }
      }

      // 2. Check all student_fees if no direct match yet
      if (!found) {
        const { data } = await supabase
          .from('student_fees')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const match = data.find(s => 
            (s.student_email && s.student_email.toLowerCase() === studentEmail.toLowerCase()) ||
            (s.student_name && s.student_name.toLowerCase().includes(studentName.toLowerCase()))
          );
          if (match) found = match;
        }
      }

      setFeeRecord(found);
    } catch (err) {
      console.warn('Error loading student fee record:', err);
    } finally {
      setLoading(false);
    }
  };

  const total = feeRecord ? Number(feeRecord.total_fees) || 0 : 0;
  const paid = feeRecord ? Number(feeRecord.paid_fees) || 0 : 0;
  const pending = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isPaid = total > 0 && pending === 0;

  const whatsappInquiryUrl = `https://wa.me/?text=${encodeURIComponent(
    `Namaste Ruby Ma'am! I am ${studentName} (${studentEmail}). I would like to check my fee status and receipts. Thank you!`
  )}`;

  if (loading) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-brand-100/60 dark:border-slate-800 shadow-soft">
        <Loader2 className="w-9 h-9 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Checking your fee records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shadow-inner">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              My Fee Status & Receipts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official tuition fee breakdown and verified receipts
            </p>
          </div>
        </div>

        <button
          onClick={loadFeeRecord}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {feeRecord ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Course Fee
              </span>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {RUPEE}{total.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrolled batch: {feeRecord.class_name || 'Standard Batch'}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>Amount Paid</span>
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {RUPEE}{paid.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{progress}% cleared</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/80 dark:border-slate-800 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>Pending Balance</span>
                <Clock className="w-4 h-4" />
              </span>
              <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                {RUPEE}{pending.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {feeRecord.due_date ? `Due by ${feeRecord.due_date}` : 'Due this term'}
              </p>
            </div>
          </div>

          {/* Detailed Status Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-brand-100/80 dark:border-slate-800 shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Receipt for: {feeRecord.student_name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Email: {feeRecord.student_email || studentEmail} | Phone: {feeRecord.phone || 'On file'}
                </p>
              </div>

              <div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Fees Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    Payment Pending: {RUPEE}{pending.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-600 dark:text-slate-300">Payment Completion</span>
                <span className="text-brand-600 dark:text-brand-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-brand-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {feeRecord.notes && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">Teacher's Note:</span>
                <p className="leading-relaxed">{feeRecord.notes}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Managed by Gurukul by Ruby Administration
              </span>
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Unlinked State */
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-soft space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto">
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              No Fee Record Linked Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your registered email (<strong className="text-slate-700 dark:text-slate-300">{studentEmail}</strong>) has not been connected to a fee ledger by your teacher yet, or you may be enrolled under a phone number.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Teacher / Ruby Ma'am for Fee Details</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
