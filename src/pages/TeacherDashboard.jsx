import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import StudentFeesManager from '../components/StudentFeesManager';
import ClassNotesManager from '../components/ClassNotesManager';
import { 
  Plus, Video, Trash2, Copy, Check, Play, RotateCcw, AlertCircle, Loader2, 
  Sparkles, Users, Clock, X, FileText
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { if (user) loadRooms(); }, [user]);

  const loadRooms = async () => {
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase.from('rooms').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setRooms(data || []);
    } catch (err) { setError(err.message || 'Failed to load classes.'); }
    finally { setLoading(false); }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true); setError('');
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          { 
            title: title.trim(), 
            teacher_id: user.id, 
            teacher_name: displayName,
            room_code: roomCode, 
            is_active: true 
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setShowModal(false); setTitle(''); await loadRooms(); navigate(`/classroom/${data.id}`);
    } catch (err) { setError(err.message || 'Failed to create classroom.'); }
    finally { setCreating(false); }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to end and delete this classroom?')) return;
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', roomId);
      if (error) throw error;
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) { alert(err.message || 'Failed to delete room.'); }
  };

  const copyToClipboard = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Teacher';

  return (
    <div className="min-h-screen doodle-bg transition-colors pb-16">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 text-white p-6 sm:p-10 shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 -mb-12 w-40 h-40 bg-brand-400/20 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hey {displayName}! 👋
              </h2>
              <p className="mt-2 text-brand-100 text-sm sm:text-base font-normal max-w-xl">
                Ready to teach? Create live classrooms, manage your students, and track fees — all in one place.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" /><span>Create Live Room</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-brand-100/50 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-50/80 dark:bg-slate-800/80 border border-brand-100/60 dark:border-slate-700">
            <button onClick={() => setActiveTab('classes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'classes' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'}`}>
              <Video className="w-4 h-4" /><span>Live Classrooms</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">{rooms.length}</span>
            </button>
            <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'}`}>
              <FileText className="w-4 h-4" /><span>Class Notes & Materials</span>
            </button>
            <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'students' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'}`}>
              <Users className="w-4 h-4" /><span>Students & Fees</span>
            </button>
          </div>
          {activeTab === 'classes' && (
            <button onClick={loadRooms} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {/* Live Classes Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {error && (<div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span></div>)}
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="w-9 h-9 text-brand-600 animate-spin mx-auto mb-3" /><p className="text-xs text-slate-500">Loading your classrooms...</p></div>
            ) : rooms.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4"><Video className="w-8 h-8" /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Classrooms Yet 📚</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">Get started by creating your first interactive live classroom!</p>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all">
                  <Plus className="w-4 h-4" /><span>Create First Classroom</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-100/60 dark:border-slate-800 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />ONLINE
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => copyToClipboard(room.room_code || room.code, e)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors border border-brand-100 dark:border-slate-700">
                            <span>{room.room_code || room.code}</span>{copiedCode === (room.room_code || room.code) ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          </button>
                          <button onClick={(e) => handleDeleteRoom(room.id, e)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">{room.title}</h4>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" /><span>Created {new Date(room.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-brand-100/40 dark:border-slate-800">
                      <button onClick={() => navigate(`/classroom/${room.id}`)} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/15 transition-all">
                        <Play className="w-3.5 h-3.5 fill-current" /><span>Launch & Host</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && <ClassNotesManager isTeacher={true} />}
        {activeTab === 'students' && <StudentFeesManager />}
      </main>

      {/* Create Room Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md p-6 sm:p-8 rounded-2xl border border-brand-100 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowModal(false)} 
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all shadow-sm"
              title="Close"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center"><Video className="w-6 h-6" /></div>
              <div><h3 className="text-xl font-extrabold text-slate-800 dark:text-white">New Classroom 🎬</h3><p className="text-xs text-slate-500 dark:text-slate-400">Setup a live video session</p></div>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-2">Classroom Title / Subject</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Physics Class 10" className="w-full py-3.5 px-4 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all" autoFocus />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'].map((sub) => (
                  <button key={sub} type="button" onClick={() => setTitle(`${sub} Lecture`)} className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 hover:text-brand-600 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-brand-100 dark:border-slate-700 transition-colors">+ {sub}</button>
                ))}
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={creating || !title.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}<span>Launch Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
