import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import ClassNotesManager from '../components/ClassNotesManager';
import StudentFeeViewer from '../components/StudentFeeViewer';
import AccountSettingsModal from '../components/AccountSettingsModal';
import ClassroomBlackboard from '../components/ClassroomBlackboard';
import { 
  KeyRound, Video, Play, RotateCcw, AlertCircle, Loader2, Radio, 
  ArrowRight, FileText, CreditCard, Copy, Check, Clock, Sparkles,
  Calendar, BookOpen, MessageCircle, Heart, CheckCircle2, BookmarkCheck,
  GraduationCap, Sun, CloudSun, Moon, Settings
} from 'lucide-react';

const DEFAULT_CHECKLIST = [
  { id: 1, text: "Attend scheduled live lecture with notebook & pen ready", done: false },
  { id: 2, text: "Download and review today's class notes", done: false },
  { id: 3, text: "Solve daily practice problems (DPP)", done: false },
  { id: 4, text: "Mark any questions or doubts for teacher discussion", done: false }
];

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [activeRooms, setActiveRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [checklist, setChecklist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gurukul_student_checklist') || JSON.stringify(DEFAULT_CHECKLIST));
    } catch {
      return DEFAULT_CHECKLIST;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadActiveRooms();
    const subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadActiveRooms())
      .subscribe();
    return () => supabase.removeChannel(subscription);
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
    }
    finally { setLoading(false); }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true); setError('');
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', code)
        .single();
      if (error || !data) throw new Error('Classroom code not found. Please double check with Ruby Ma\'am or your teacher.');
      if (!data.is_active) throw new Error('This classroom session is not currently active.');
      navigate('/classroom/' + data.id);
    } catch (err) { 
      setError(err.message || 'Failed to join classroom.'); 
    }
    finally { setJoining(false); }
  };

  const copyToClipboard = (text) => { 
    navigator.clipboard.writeText(text); 
    setCopiedCode(text); 
    setTimeout(() => setCopiedCode(null), 2000); 
  };

  const toggleChecklist = (id) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    localStorage.setItem('gurukul_student_checklist', JSON.stringify(updated));
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Shubh Prabhat / Good Morning', icon: <Sun className="w-7 h-7 text-amber-300 inline-block align-middle ml-2" /> };
    if (hour < 17) return { text: 'Good Afternoon', icon: <CloudSun className="w-7 h-7 text-amber-300 inline-block align-middle ml-2" /> };
    return { text: 'Good Evening', icon: <Moon className="w-7 h-7 text-indigo-200 inline-block align-middle ml-2" /> };
  };

  const greeting = getGreeting();
  const todayFormatted = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen doodle-bg transition-colors pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-7">
        {/* Real Handcrafted Classroom Blackboard Banner */}
        <ClassroomBlackboard
          userName={displayName}
          teacherName="Ruby Ma'am"
          role="student"
          activeClassCount={activeRooms.length}
          onJoinClass={activeRooms.length > 0 ? () => navigate('/classroom/' + activeRooms[0].id) : null}
        />

        {/* Student Welcome & Profile Quick Bar */}
        <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              onClick={() => setShowSettingsModal(true)}
              className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 border-2 border-white flex items-center justify-center font-extrabold text-lg text-white shadow-sm overflow-hidden cursor-pointer transition-transform hover:scale-105 shrink-0"
              title="Click to change profile picture or avatar"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{displayName ? displayName[0].toUpperCase() : 'S'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-800 text-base">
                  {greeting.text}, {displayName}!
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Student
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {todayFormatted} • Welcome to your tuition portal with Ruby Ma'am
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Profile & Avatar</span>
          </button>
        </div>

        {/* Message from Ruby Ma'am & Faculty (Notice Card) */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl border border-brand-100/80 dark:border-slate-800 p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Message from Ruby Ma'am & Faculty
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    Daily Notice
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  "Namaste dear students! Remember: Consistent daily practice is the secret to scoring well. Keep your notebooks, formula sheets, and questions ready before every class. We are here to support you every step of the way!"
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/?text=Namaste%20Ruby%20Ma'am!%20I%20have%20a%20doubt%20regarding%20my%20class..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Ask a Doubt on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Interactive Quick Navigation Cards (Open Tabs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-400/40'
                : 'bg-white dark:bg-slate-900 border-brand-100/80 dark:border-slate-800 hover:border-brand-300 shadow-soft'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-transform group-hover:scale-110 ${
                activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400'
              }`}>
                <Video className="w-5 h-5" />
              </div>
              {activeRooms.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {activeRooms.length} Live
                </span>
              )}
            </div>
            <div>
              <h4 className={`text-base font-extrabold ${activeTab === 'classes' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                Live Lectures
              </h4>
              <p className={`text-xs mt-0.5 ${activeTab === 'classes' ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Join live video classrooms
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-400/40'
                : 'bg-white dark:bg-slate-900 border-brand-100/80 dark:border-slate-800 hover:border-brand-300 shadow-soft'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-transform group-hover:scale-110 ${
                activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                Materials
              </span>
            </div>
            <div>
              <h4 className={`text-base font-extrabold ${activeTab === 'notes' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                Class Notes
              </h4>
              <p className={`text-xs mt-0.5 ${activeTab === 'notes' ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                PDFs, summaries & assignments
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-400/40'
                : 'bg-white dark:bg-slate-900 border-brand-100/80 dark:border-slate-800 hover:border-brand-300 shadow-soft'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-transform group-hover:scale-110 ${
                activeTab === 'fees' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'fees' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}>
                Receipts
              </span>
            </div>
            <div>
              <h4 className={`text-base font-extrabold ${activeTab === 'fees' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                Fee Status
              </h4>
              <p className={`text-xs mt-0.5 ${activeTab === 'fees' ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Track paid dues & receipts
              </p>
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
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
              <span>Live Classes & Join</span>
              {activeRooms.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeRooms.length} Live
                </span>
              )}
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
              <span>Class Notes & Downloads</span>
            </button>

            <button 
              onClick={() => setActiveTab('fees')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'fees' 
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-brand-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Fee Status & Receipts</span>
            </button>
          </div>

          {activeTab === 'classes' && (
            <button 
              onClick={loadActiveRooms} 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {/* Tab 1: Classes & Join */}
        {activeTab === 'classes' && (
          <div className="space-y-7">
            {/* Join by Code Card & Daily Study Routine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Join by Code Form */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-brand-100/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">
                        Join Class by Code
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Provided by Ruby Ma'am / Teacher
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="my-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
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
                        placeholder="e.g. 5UB8AD8E" 
                        maxLength={10} 
                        className="w-full text-center tracking-[0.25em] font-mono text-lg uppercase font-extrabold py-3.5 px-4 bg-brand-50/50 dark:bg-slate-800/90 border border-brand-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={joining || !roomCode.trim()} 
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Enter Live Classroom</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <p className="text-[11px] text-center text-slate-400 mt-4">
                  Check your WhatsApp group for today's 6-character room code.
                </p>
              </div>

              {/* Student Daily Study Routine Checklist */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-brand-100/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">
                        My Gurukul Daily Checklist
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {checklist.filter(c => c.done).length} / {checklist.length} Completed
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Tick off your study tasks every day to build a steady learning habit!
                  </p>

                  <div className="space-y-2.5">
                    {checklist.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => toggleChecklist(item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          item.done 
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-500 line-through' 
                            : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:border-brand-300 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium flex-1">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Tip: Keep notes updated daily</span>
                  <span className="text-brand-600 font-semibold cursor-pointer" onClick={() => setActiveTab('notes')}>
                    View Study Notes
                  </span>
                </div>
              </div>
            </div>

            {/* Active Live Classrooms Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                      Active Live Classrooms
                    </h3>
                    <p className="text-xs text-slate-400">
                      Join directly if your teacher has started a live lecture
                    </p>
                  </div>
                </div>

                <button 
                  onClick={loadActiveRooms} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500">Looking for ongoing live lectures...</p>
                </div>
              ) : activeRooms.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-2 border-dashed border-brand-200 dark:border-slate-800 text-center shadow-soft">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-500 mx-auto mb-3">
                    <Video className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">
                    No Live Lectures Right Now
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Your teachers haven't started a session yet. If you have a room code from WhatsApp, enter it in the "Join Class by Code" box above!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeRooms.map((room) => {
                    const code = room.room_code || room.code;
                    return (
                      <div 
                        key={room.id} 
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-100/80 dark:border-slate-800 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-brand-500" />

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE NOW
                            </span>

                            <button 
                              onClick={() => copyToClipboard(code)} 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 text-brand-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors border border-brand-100 dark:border-slate-700"
                              title="Click to copy Room Code"
                            >
                              <span>{code}</span>
                              {copiedCode === code ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>

                          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors">
                            {room.title || 'Interactive Class'}
                          </h4>

                          <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                              <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
                              <span>Conducted by: {room.teacher_name || 'Ruby Ma\'am / Faculty'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Started {new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-brand-100/40 dark:border-slate-800">
                          <button 
                            onClick={() => navigate('/classroom/' + room.id)} 
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Join Classroom Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Class Notes */}
        {activeTab === 'notes' && (
          <ClassNotesManager isTeacher={false} />
        )}

        {/* Tab 3: Student Fee Status & Receipts */}
        {activeTab === 'fees' && (
          <StudentFeeViewer />
        )}
      </main>

      {/* Account Settings & Profile / Avatar / Delete Modal */}
      <AccountSettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
}