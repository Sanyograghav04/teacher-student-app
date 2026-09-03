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
  Sparkles, 
  X,
  Volume2,
  Radio
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 max-w-[100vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Participants ({participants.length})
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isTeacher && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={handleMuteAll}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
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
              className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {p.name ? p.name[0].toUpperCase() : p.identity[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name || p.identity} {isLocal && '(You)'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {p.isSpeaking ? 'Speaking' : 'Listening'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className={`p-1.5 rounded-lg text-xs ${isAudioEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-200 dark:bg-slate-700'}`}>
                  {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </div>

                {isTeacher && !isLocal && (
                  <button
                    onClick={() => handleKickParticipant(p.identity)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
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
    const codeToCopy = roomData?.room_code || roomData?.code;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold">Connecting to Live Classroom...</h3>
        <p className="text-xs text-slate-400 mt-1">Configuring audio & video streams</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full glass-card border border-slate-800 p-8 rounded-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Classroom Connection Error</h3>
          <p className="text-xs text-slate-400 mb-6">{error || 'Unable to obtain classroom access token.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] w-screen flex flex-col bg-[#0B0F19] text-white overflow-hidden select-none">
      {/* Top Glass Header (Media 4 style) */}
      <header className="h-14 sm:h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Leave Classroom"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-xs">
                {roomData?.title || 'Live Classroom'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[9px] sm:text-[10px] font-extrabold tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden xs:block truncate">
              Room ID: {roomData?.id?.substring(0, 8)}...
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {(roomData?.room_code || roomData?.code) && (
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-medium text-slate-200 transition-colors"
              title="Click to copy room code"
            >
              <span>{roomData?.room_code || roomData?.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/30 border border-brand-500/40 hover:bg-brand-600/40 text-xs font-bold text-brand-300 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roster</span>
          </button>
        </div>
      </header>

      {/* Main LiveKit Video Area */}
      <div className="flex-1 relative overflow-hidden">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={LIVEKIT_URL}
          data-lk-theme="default"
          className="h-full w-full"
          onDisconnected={() => navigate('/')}
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
