import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateLiveKitToken, LIVEKIT_URL } from '../lib/livekit';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext
} from '@livekit/components-react';
import '@livekit/components-styles';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  MicOff, 
  UserX, 
  Users, 
  Gem, 
  X,
  Volume2
} from 'lucide-react';

function TeacherModerationDrawer({ isOpen, onClose, isTeacher }) {
  const participants = useParticipants();
  const room = useRoomContext();

  if (!isOpen) return null;

  const handleMuteAll = async () => {
    if (!room) return;
    try {
      const strData = JSON.stringify({ action: 'mute_all' });
      const encoder = new TextEncoder();
      await room.localParticipant.publishData(encoder.encode(strData), { reliable: true });
      alert('Mute signal sent to all students.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickParticipant = async (identity) => {
    if (!room || !identity) return;
    if (!window.confirm(`Are you sure you want to remove this student from the live room?`)) return;
    try {
      const strData = JSON.stringify({ action: 'kick_user', target: identity });
      const encoder = new TextEncoder();
      await room.localParticipant.publishData(encoder.encode(strData), { reliable: true });
      alert(`Removal signal sent for ${identity}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Class Participants ({participants.length})
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isTeacher && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={handleMuteAll}
            className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>Mute All Students</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => {
          const isLocal = p.isLocal;
          const isAudioEnabled = p.isMicrophoneEnabled;

          return (
            <div 
              key={p.identity} 
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {p.name ? p.name[0].toUpperCase() : p.identity[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name || p.identity} {isLocal && '(You)'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {p.isSpeaking ? 'Speaking 🎙️' : 'Listening'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className={`p-1.5 rounded-lg text-xs ${isAudioEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                  {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </div>

                {isTeacher && !isLocal && (
                  <button
                    onClick={() => handleKickParticipant(p.identity)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Remove Student"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Classroom() {
  const { roomId } = useParams();
  const { user, profile } = useAuth();
  const [token, setToken] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const navigate = useNavigate();

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    let isMounted = true;

    async function initClassroom() {
      try {
        setLoading(true);
        setError('');

        const { data: room, error: roomErr } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomErr || !room) {
          throw new Error('Classroom not found.');
        }

        if (isMounted) setRoomData(room);

        const identity = user.id;
        const name = profile?.full_name || (isTeacher ? 'Teacher' : 'Student');
        const roomName = `room_${room.id}`;

        const jwtToken = await generateLiveKitToken({
          roomId: roomName,
          userId: identity,
          userName: name,
          isTeacher: isTeacher,
        });
        if (isMounted) setToken(jwtToken);
      } catch (err) {
        console.error('Failed to initialize classroom:', err);
        if (isMounted) setError(err.message || 'Failed to connect to classroom.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (user && roomId) {
      initClassroom();
    }

    return () => {
      isMounted = false;
    };
  }, [roomId, user, profile, isTeacher]);

  const handleCopyCode = () => {
    if (roomData?.room_code) {
      navigator.clipboard.writeText(roomData.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (isTeacher && roomData) {
      try {
        await supabase.from('rooms').update({ is_active: false }).eq('id', roomData.id);
      } catch (_) {}
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to Live Classroom...</h2>
        <p className="text-sm text-slate-400 mt-2">Setting up your HD WebRTC video connection</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Classroom Connection Error</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'Unable to generate room token.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden relative">
      {/* Classroom Custom Top Bar */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Leave Class"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white line-clamp-1 max-w-[200px] sm:max-w-md">
                  {roomData?.title || 'Live Classroom'}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase font-bold">
                  Gurukul
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Teacher: {roomData?.teacher_name || 'Instructor'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Room Code Badge */}
          {roomData?.room_code && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all"
              title="Click to copy Room Code"
            >
              <span className="text-slate-400 text-[10px] uppercase font-sans hidden sm:inline">Code:</span>
              <span className="text-rose-400">{roomData.room_code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          {/* Participant Drawer Toggle */}
          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Class Participants & Controls"
          >
            <Users className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Manage</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-600/20"
          >
            {isTeacher ? 'End Class' : 'Leave'}
          </button>
        </div>
      </header>

      {/* LiveKit Official WebRTC Video Room */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={LIVEKIT_URL}
          data-lk-theme="default"
          className="h-full w-full"
          onDisconnected={handleLeave}
        >
          <VideoConference />
          <RoomAudioRenderer />
          <TeacherModerationDrawer 
            isOpen={showParticipantsDrawer}
            onClose={() => setShowParticipantsDrawer(false)}
            isTeacher={isTeacher}
          />
        </LiveKitRoom>
      </div>
    </div>
  );
}
