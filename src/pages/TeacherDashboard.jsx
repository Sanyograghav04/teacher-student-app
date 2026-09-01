import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { 
  Plus, 
  Video, 
  Trash2, 
  Copy, 
  Check, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Loader2, 
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  const loadRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError(err.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError('');

    const roomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile?.full_name || 'Teacher',
        email: user.email || '',
        role: 'teacher',
      });

      const { data, error } = await supabase.from('rooms').insert({
        title: title.trim(),
        teacher_id: user.id,
        teacher_name: profile?.full_name || 'Teacher',
        is_active: false,
        room_code: roomCode,
      }).select().single();

      if (error) throw error;

      setTitle('');
      setShowModal(false);
      await loadRooms();
    } catch (err) {
      console.error('Create room error:', err);
      setError(err.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleStartClass = async (room) => {
    try {
      await supabase.from('rooms').update({ is_active: true }).eq('id', room.id);
    } catch (_) {}
    navigate(`/classroom/${room.id}`);
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      await supabase.from('rooms').delete().eq('id', roomId);
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) {
      setError(err.message || 'Failed to delete room.');
    }
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-600/10 via-amber-500/10 to-slate-100 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden mb-8 shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Teacher Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {profile?.full_name || 'Teacher'} ??
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your classrooms, generate invite codes, and host live sessions.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={loadRooms}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
              title="Refresh classes"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              <span>Create Class</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your classrooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No classrooms created yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              Create your first live classroom to get a shareable code for your students.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Class</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl hover:shadow-rose-500/5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <Video className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      {room.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium">
                          Inactive
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDeleteRoom(room.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete Class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                    {room.title}
                  </h3>

                  {/* Room Code Badge */}
                  <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                        Room Code
                      </p>
                      <p className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 tracking-widest">
                        {room.room_code || 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleCopyCode(room.room_code, e)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-transparent transition-colors shadow-sm"
                    >
                      {copiedCode === room.room_code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => handleStartClass(room)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{room.is_active ? 'Rejoin Class' : 'Start Class'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create New Class</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Give your class a title. A unique room code will be generated for your students.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Class Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Physics - Section B"
                  className="block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Class</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
