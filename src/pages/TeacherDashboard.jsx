import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import StudentFeesManager from '../components/StudentFeesManager';
import ClassNotesManager from '../components/ClassNotesManager';
import { 
  Plus, Video, Trash2, Copy, Check, Play, RotateCcw, AlertCircle, Loader2, 
  Sparkles, Users, Clock, X, FileText, Share2, Pin, MessageCircle, Heart,
  BookOpen, Calendar, HelpCircle, CheckCircle2
} from 'lucide-react';

const DAILY_QUOTES = [
  { quote: "à¤µà¤¿à¤¦à¥à¤¯à¤¾ à¤¦à¤¦à¤¾à¤¤à¤¿ à¤µà¤¿à¤¨à¤¯à¤‚ â€” True education brings humility, wisdom, and character.", author: "Gurukul Tradition" },
  { quote: "A teacher affects eternity; they can never tell where their influence stops.", author: "Henry Adams" },
  { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" }
];

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gurukul_teacher_notes') || '[]');
    } catch {
      return [];
    }
  });
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { if (user) loadRooms(); }, [user]);

  const loadRooms = async () => {
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRooms(data || []);
    } catch (err) { 
      console.error('Error loading classrooms:', err);
      setError(err.message || 'Failed to load classes.'); 
    }
    finally { setLoading(false); }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Teacher';

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
      setShowModal(false); setTitle(''); await loadRooms(); navigate('/classroom/' + data.id);
    } catch (err) { 
      setError(err.message || 'Failed to create classroom.'); 
    }
    finally { setCreating(false); }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to end and delete this live classroom?')) return;
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

  const shareOnWhatsApp = (room, e) => {
    if (e) e.stopPropagation();
    const code = room.room_code || room.code;
    const url = https://teacher-student-app-blue.vercel.app/classroom/;
    const message = Namaste Students & Parents! ðŸŽ“\n\nLive Class: **\nTeacher: **\nRoom Code: **\nJoin Link: \n\nPlease join on time with your notebook & pen ready! ðŸ“š\n- Gurukul by Ruby;
    window.open(https://api.whatsapp.com/send?text=, '_blank');
  };

  const addStickyNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const updated = [{ id: Date.now(), text: newNote.trim(), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }, ...notes];
    setNotes(updated);
    localStorage.setItem('gurukul_teacher_notes', JSON.stringify(updated));
    setNewNote('');
    setShowNoteInput(false);
  };

  const deleteStickyNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('gurukul_teacher_notes', JSON.stringify(updated));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Shubh Prabhat / Good Morning', emoji: 'â˜€ï¸' };
    if (hour < 17) return { greeting: 'Good Afternoon', emoji: 'ðŸŒ¤ï¸' };
    return { greeting: 'Good Evening', emoji: 'ðŸŒ†' };
  };

  const todayGreeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  const randomQuote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];

  return (
    <div className="min-h-screen doodle-bg transition-colors pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-7">
        {/* Warm Teacher Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white p-6 sm:p-9 shadow-card">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-3 text-brand-100">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>{todayFormatted}</span>
                <span className="text-white/40">â€¢</span>
                <span>Gurukul by Ruby Faculty</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {todayGreeting.greeting}, {displayName}! {todayGreeting.emoji}
              </h2>
              <p className="mt-2 text-brand-100 text-sm sm:text-base font-normal leading-relaxed">
                Welcome to your teaching desk. Start live lectures for your batches, share links directly on WhatsApp, and manage student fees.
              </p>

              {/* Gurukul Wisdom Pill */}
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-brand-100 italic">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>"{randomQuote.quote}"</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button 
                onClick={() => setShowModal(true)} 
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Start New Live Class ðŸš€</span>
              </button>
              
              <div className="flex items-center justify-around bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs">
                <div className="text-center px-2">
                  <div className="font-extrabold text-base text-white">{rooms.length}</div>
                  <div className="text-[10px] text-brand-200 uppercase">Batches</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="text-center px-2">
                  <div className="font-extrabold text-base text-emerald-300">Active</div>
                  <div className="text-[10px] text-brand-200 uppercase">Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ma'am's Desk Notice Board / Sticky Reminders */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-brand-100/80 dark:border-slate-800 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Teacher's Desk Reminders ðŸ“Œ
              </h3>
              <span className="text-[11px] text-slate-400">Personal scratchpad</span>
            </div>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showNoteInput ? 'Cancel' : 'Add Note'}</span>
            </button>
          </div>

          {showNoteInput && (
            <form onSubmit={addStickyNote} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Discuss Chapter 5 questions with Class 10th batch today..."
                className="flex-1 px-3.5 py-2 text-xs bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
              >
                Save
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {notes.length === 0 ? (
              <div className="col-span-full py-2 text-center text-xs text-slate-400 italic">
                No reminders yet. Click "+ Add Note" to jot down tests, homework, or student follow-ups! ðŸ“
              </div>
            ) : (
              notes.map((n) => (
                <div 
                  key={n.id} 
                  className="bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3 rounded-xl flex items-start justify-between gap-2 shadow-sm text-xs"
                >
                  <p className="text-slate-700 dark:text-amber-100 flex-1 leading-relaxed">
                    {n.text}
                  </p>
                  <button 
                    onClick={() => deleteStickyNote(n.id)}
                    className="text-amber-400 hover:text-rose-500 transition-colors p-0.5"
                    title="Done / Delete"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-brand-100/50 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-brand-50/80 dark:bg-slate-800/80 border border-brand-100/60 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('classes')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'classes' 
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Live Classrooms</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                {rooms.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('notes')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notes' 
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Class Notes & Study Material</span>
            </button>

            <button 
              onClick={() => setActiveTab('students')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'students' 
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Students & Fee Register ðŸ’°</span>
            </button>
          </div>

          {activeTab === 'classes' && (
            <button 
              onClick={loadRooms} 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
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
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-9 h-9 text-brand-600 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Checking your live classrooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-soft">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  No Active Classrooms Right Now ðŸ“š
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
                  Start your first live class! Once created, you can send the join link and code directly to students or parents via WhatsApp with one click.
                </p>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start Live Class Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const code = room.room_code || room.code;
                  return (
                    <div 
                      key={room.id} 
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-100/80 dark:border-slate-800 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-400" />

                      <div>
                        {/* Status + Quick Actions */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE NOW
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* WhatsApp Share Button */}
                            <button
                              onClick={(e) => shareOnWhatsApp(room, e)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy Code Button */}
                            <button 
                              onClick={(e) => copyToClipboard(code, e)} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors border border-brand-100 dark:border-slate-700"
                              title="Click to copy Room Code"
                            >
                              <span>{code}</span>
                              {copiedCode === code ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>

                            <button 
                              onClick={(e) => handleDeleteRoom(room.id, e)} 
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                              title="End and Delete Class"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Teacher Info */}
                        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                          {room.title}
                        </h4>

                        <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                            <span>Instructor: {room.teacher_name || displayName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Started: {new Date(room.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Launch Actions */}
                      <div className="mt-6 pt-4 border-t border-brand-100/50 dark:border-slate-800 flex gap-2">
                        <button 
                          onClick={() => navigate('/classroom/' + room.id)} 
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Enter Classroom ðŸŽ™ï¸</span>
                        </button>
                        
                        <button
                          onClick={(e) => shareOnWhatsApp(room, e)}
                          className="px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                          title="Send to WhatsApp Group"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Class Notes & Study Materials */}
        {activeTab === 'notes' && (
          <ClassNotesManager isTeacher={true} />
        )}

        {/* Tab 3: Students & Fee Management */}
        {activeTab === 'students' && (
          <StudentFeesManager />
        )}
      </main>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 sm:p-8 rounded-3xl border border-brand-100 dark:border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">
                  Launch Live Classroom ðŸŽ“
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gurukul by Ruby Virtual Classroom
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-slate-300 mb-2">
                  Batch / Subject Name *
                </label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Class 10th CBSE - Trigonometry" 
                  className="w-full py-3.5 px-4 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all" 
                  autoFocus 
                />
              </div>

              {/* Realistic Preset Batches */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Quick Batch Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Class 10 CBSE Math', 
                    'Physics Board Exam Revision', 
                    'Class 9 Science Doubt Class', 
                    'Chemistry Foundation', 
                    'Spoken English & Grammar'
                  ].map((preset) => (
                    <button 
                      key={preset} 
                      type="button" 
                      onClick={() => setTitle(preset)} 
                      className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 hover:text-brand-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-brand-100 dark:border-slate-700 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
                <span>Tip: You can instantly share the join link on your student WhatsApp group once launched!</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !title.trim()} 
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Launch Now ðŸš€</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}