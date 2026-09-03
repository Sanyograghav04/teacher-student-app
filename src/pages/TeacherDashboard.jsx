import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import StudentFeesManager from '../components/StudentFeesManager';
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
  Sparkles,
  Users,
  LayoutGrid,
  Radio,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'students'
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

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            title: title.trim(),
            teacher_id: user.id,
            code: roomCode,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setShowModal(false);
      setTitle('');
      await loadRooms();
      navigate(`/classroom/${data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create classroom.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to end and delete this classroom?')) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) {
      alert(err.message || 'Failed to delete room.');
    }
  };

  const copyToClipboard = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Teacher';
  const activeRoomsCount = rooms.filter(r => r.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Instructor Hero Banner (Inspired by Media 2 & Media 3) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-primary-700 to-indigo-800 text-white p-6 sm:p-10 shadow-2xl shadow-brand-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 -mb-12 w-48 h-48 bg-brand-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-4 text-brand-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Instructor Control Center</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Welcome back, {displayName}! 🎓
              </h2>
              <p className="mt-2 text-brand-100/90 text-sm sm:text-base font-normal max-w-xl">
                Create real-time live video classrooms, moderate participants, and manage your students' fees seamlessly.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Create Live Room</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher Segmented Control (Inspired by Media 4 Tabs) */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80">
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'classes'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Live Classrooms</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students & Fees</span>
            </button>
          </div>

          {activeTab === 'classes' && (
            <button
              onClick={loadRooms}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {/* Tab 1: Live Classes */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-9 h-9 text-brand-600 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading your classrooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
                <div className="w-16 h-16 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Classrooms Created Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                  Get started by creating your first interactive live classroom. You can share the code instantly with students.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:from-brand-500 hover:to-indigo-500 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Classroom</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Chips */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          ONLINE
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => copyToClipboard(room.code, e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors"
                            title="Copy Room Code"
                          >
                            <span>{room.code}</span>
                            {copiedCode === room.code ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleDeleteRoom(room.id, e)}
                            className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Metadata */}
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                        {room.title}
                      </h4>

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Created {new Date(room.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => navigate(`/classroom/${room.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-primary-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch & Host Classroom</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Students & Fee Management */}
        {activeTab === 'students' && (
          <StudentFeesManager />
        )}
      </main>

      {/* Create Room Modal (Inspired by Modern E-learning Modals) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Create Classroom
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Setup a new interactive live video session
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Classroom Title / Subject
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mathematics - Calculus 101"
                  className="w-full py-3.5 px-4 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                  autoFocus
                />
              </div>

              {/* Subject suggestions chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setTitle(`${sub} Lecture`)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-600 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    + {sub}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/30 transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Launch Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
