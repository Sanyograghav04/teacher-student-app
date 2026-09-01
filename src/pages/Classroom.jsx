import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer, 
  ControlBar,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateLiveKitToken, LIVEKIT_URL } from '../lib/livekit';
import { 
  Loader2, 
  AlertCircle, 
  PhoneOff, 
  Shield, 
  MicOff, 
  VideoOff, 
  UserX, 
  Copy, 
  Check, 
  GraduationCap,
  MessageSquare,
  Users
} from 'lucide-react';

export default function Classroom() {
  const { roomId } = useParams();
  const { user, profile } = useAuth();
  const [token, setToken] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (roomId && user) {
      initRoom();
    }
  }, [roomId, user]);

  const initRoom = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch room details
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomErr || !room) {
        throw new Error('Classroom not found.');
      }
      setRoomData(room);

      // 2. Generate LiveKit token
      const isTeacher = profile?.role === 'teacher' || room.teacher_id === user.id;
      const jwt = await generateLiveKitToken({
        roomId,
        userId: user.id,
        userName: profile?.full_name || user.user_metadata?.full_name || 'Participant',
        isTeacher,
      });

      setToken(jwt);
    } catch (err) {
      console.error('Init room error:', err);
      setError(err.message || 'Failed to connect to classroom.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    navigate('/');
  };

  const handleCopyCode = () => {
    if (!roomData?.room_code) return;
    navigator.clipboard.writeText(roomData.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <h3 className="text-lg font-bold">Connecting to Live Classroom...</h3>
        <p className="text-xs text-slate-400 mt-1">Preparing high-definition video & audio stream</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Classroom Connection Failed</h3>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      {/* Classroom Top Bar */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-white line-clamp-1">
              {roomData?.title || 'Live Class'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Session
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400">
                Teacher: <strong className="text-slate-300">{roomData?.teacher_name}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Room Code Share Button */}
        <div className="flex items-center gap-3">
          {roomData?.room_code && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-200 transition-colors"
            >
              <span className="text-slate-400">Code:</span>
              <span className="font-mono font-bold text-indigo-400">{roomData.room_code}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
              )}
            </button>
          )}

          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* LiveKit Video Conference Room */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-950">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={LIVEKIT_URL}
          data-lk-theme="default"
          style={{ height: '100%' }}
          onDisconnected={handleLeave}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
    </div>
  );
}
