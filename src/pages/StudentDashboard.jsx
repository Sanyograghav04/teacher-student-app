import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { 
  KeyRound, Video, Play, RotateCcw, AlertCircle, Loader2, Radio, 
  ArrowRight, FileText, CreditCard, Copy, Check, Clock
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveRooms();
    const subscription = supabase.channel('public:rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadActiveRooms()).subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  const loadActiveRooms = async () => {
    try {
      const { data, error } = await supabase.from('rooms').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      setActiveRooms(data || []);
    } catch (err) { console.error('Error loading rooms:', err); }
    finally { setLoading(false); }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true); setError('');
    try {
      const { data, error } = await supabase.from('rooms').select('*').eq('code', code).single();
      if (error || !data) throw new Error('Classroom code not found. Please check with your teacher.');
      if (!data.is_active) throw new Error('This classroom is not currently active.');
      navigate(`/classroom/${data.id}`);
    } catch (err) { setError(err.message || 'Failed to join classroom.'); }
    finally { setJoining(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); setCopiedCode(text); setTimeout(() => setCopiedCode(null), 2000); };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen doodle-bg transition-colors pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 text-white p-6 sm:p-10 shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Welcome, {displayName}! 👋
              </h2>
              <p className="mt-2 text-brand-100 text-sm sm:text-base font-normal leading-relaxed">
                Join your live lectures, interact with your teachers, and never miss a class ✨
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
              <div><span className="text-2xl font-extrabold">{activeRooms.length}</span> <span className="text-xs text-brand-200">Live Rooms</span></div>
            </div>
          </div>
        </div>

        {/* Join by Code + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center"><KeyRound className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-slate-800 dark:text-white text-base">Join by Code 🔑</h3><p className="text-xs text-slate-500 dark:text-slate-400">Enter code from teacher</p></div>
              </div>
              {error && (<div className="my-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>)}
              <form onSubmit={handleJoinByCode} className="mt-4 space-y-4">
                <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. 7X9K2P" maxLength={10} className="w-full text-center tracking-[0.25em] font-mono text-lg uppercase font-bold py-3.5 px-4 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                <button type="submit" disabled={joining || !roomCode.trim()} className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><span>Enter Classroom</span><ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-4">Need help? Ask your teacher for the 6-character room code.</p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Video, title: 'Live Lectures', desc: 'HD video stream', color: 'brand' },
              { icon: FileText, title: 'Class Notes', desc: 'PDFs & Assignments', color: 'amber' },
              { icon: CreditCard, title: 'Fee Status', desc: 'Track paid receipts', color: 'emerald' },
            ].map((item, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <div className={`w-11 h-11 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-500/15 text-${item.color}-600 dark:text-${item.color}-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div><h4 className="font-bold text-sm text-slate-800 dark:text-white">{item.title}</h4><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Classrooms */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center"><Radio className="w-4 h-4 animate-pulse" /></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Active Live Classrooms 🎯</h3>
            </div>
            <button onClick={loadActiveRooms} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /><span>Refresh</span>
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" /><p className="text-xs text-slate-500">Loading active rooms...</p></div>
          ) : activeRooms.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3"><Video className="w-7 h-7" /></div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">No Live Classes Right Now 😴</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">Your teachers haven't started a room yet. Try joining with a room code above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeRooms.map((room) => (
                <div key={room.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />LIVE
                      </span>
                      <button onClick={() => copyToClipboard(room.code)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-600 dark:text-slate-300 text-xs font-mono font-medium transition-colors border border-brand-100 dark:border-slate-700">
                        <span>{room.code}</span>{copiedCode === room.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors">{room.title || 'Interactive Class'}</h4>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock className="w-3.5 h-3.5" /><span>Started {new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-brand-100/40 dark:border-slate-800">
                    <button onClick={() => navigate(`/classroom/${room.id}`)} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/15 transition-all">
                      <Play className="w-3.5 h-3.5 fill-current" /><span>Join Live Classroom</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
