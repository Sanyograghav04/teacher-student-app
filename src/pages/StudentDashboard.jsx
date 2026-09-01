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
  ArrowRight
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveRooms();

    // Listen to live room updates
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
        .eq('room_code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('No classroom found with this code.');
        setJoining(false);
        return;
      }

      navigate(`/classroom/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to join class.');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Join by Code Banner */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden mb-8 shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-xl z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Student Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to learn, {profile?.full_name || 'Student'}? ??
            </h2>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              Enter the room code given by your teacher to jump straight into the live session.
            </p>

            <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-digit Room Code"
                  className="block w-full pl-10 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-white placeholder-slate-500 uppercase tracking-widest font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={joining || !roomCode.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {joining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Join Class</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Classes Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-xl font-bold text-white">Active Live Sessions</h3>
          </div>
          <button
            onClick={loadActiveRooms}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Active Classes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Looking for active classes...</p>
          </div>
        ) : activeRooms.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">No live classes right now</h4>
            <p className="text-sm text-slate-400 max-w-sm">
              Classes will appear here in real-time as soon as your teacher starts a session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRooms.map((room) => (
              <div
                key={room.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Now
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Code: <strong className="text-rose-400 font-bold">{room.room_code}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-white mb-1">{room.title}</h3>
                  <p className="text-xs text-slate-400">Teacher: {room.teacher_name}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => navigate(`/classroom/${room.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Join Class</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

