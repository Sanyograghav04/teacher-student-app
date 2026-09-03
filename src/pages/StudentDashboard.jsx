import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { 
  KeyRound, 
  Video, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Loader2, 
  Radio, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  FileText,
  CreditCard,
  Copy,
  Check,
  Search,
  Clock,
  UserCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveRooms();

    const subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadActiveRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadActiveRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveRooms(data || []);
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    setJoining(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        throw new Error('Classroom code not found. Please double check with your teacher.');
      }

      if (!data.is_active) {
        throw new Error('This classroom session is not currently active.');
      }

      navigate(`/classroom/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to join classroom.');
    } finally {
      setJoining(false);
    }
  };

  const handleDirectJoin = (roomId) => {
    navigate(`/classroom/${roomId}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Hero Banner (Inspired by BrainByte E-Learning App Media 2) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-primary-700 to-indigo-800 text-white p-6 sm:p-10 shadow-2xl shadow-brand-500/20">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-primary-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-4 text-brand-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Interactive Learning Hub</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Welcome, {displayName}! 👋
              </h2>
              <p className="mt-2 text-brand-100/90 text-sm sm:text-base font-normal leading-relaxed">
                Join your scheduled live lectures, interact directly with your instructors, and access your study materials.
              </p>
            </div>

            {/* Quick Live Status Card */}
            <div className="flex flex-row md:flex-col items-center sm:items-end justify-between gap-3 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Live Rooms
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeRooms.length} <span className="text-xs font-normal text-brand-200">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Join Card & Quick Tools Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join by Code Card (Inspired by Media 1 & Media 4) */}
          <div className="lg:col-span-1 glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Join by Code
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter code provided by teacher
                  </p>
                </div>
              </div>

              {error && (
                <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleJoinByCode} className="mt-4 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7X9K2P"
                    maxLength={10}
                    className="w-full text-center tracking-[0.25em] font-mono text-lg uppercase font-bold py-3.5 px-4 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={joining || !roomCode.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enter Classroom</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-4">
              Need help? Ask your teacher for the 6-character room code.
            </p>
          </div>

          {/* Quick Action Bento Grid (Inspired by Media 3 Filoo App) */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Live Lectures</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High definition stream</p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Class Notes</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PDFs & Assignments</p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Fee Status</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track paid receipts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Classrooms Section (Media 2 style Course List) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Active Live Classrooms
              </h3>
            </div>
            
            <button
              onClick={loadActiveRooms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading active rooms...</p>
            </div>
          ) : activeRooms.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Video className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No Live Classes Right Now</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Your teachers haven't started a live room yet. You can also join directly using a room code above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Tags */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        LIVE
                      </span>

                      <button
                        onClick={() => copyToClipboard(room.code)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono font-medium transition-colors"
                        title="Copy Room Code"
                      >
                        <span>{room.code}</span>
                        {copiedCode === room.code ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Class Info */}
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {room.title || 'Interactive Class'}
                    </h4>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Started {new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Join Action */}
                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      onClick={() => handleDirectJoin(room.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Join Live Classroom</span>
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
