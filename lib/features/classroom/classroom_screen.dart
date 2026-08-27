import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/constants.dart';
import '../../models/room_model.dart';
import 'video_tile.dart';

class ClassroomScreen extends StatefulWidget {
  final String roomId;
  const ClassroomScreen({super.key, required this.roomId});

  @override
  State<ClassroomScreen> createState() => _ClassroomScreenState();
}

class _ClassroomScreenState extends State<ClassroomScreen> {
  final _supabase = Supabase.instance.client;
  Room? _room;
  bool _isConnecting = true;
  bool _isMicMuted = false;
  bool _isCameraOff = false;
  String? _error;
  String? _currentUserRole;
  String? _currentUserId;
  RoomModel? _roomModel;
  List<ParticipantModel> _participants = [];
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;
    _currentUserId = user.id;
    _currentUserRole = user.userMetadata?['role'] as String?;

    // Request permissions
    await [Permission.camera, Permission.microphone].request();

    // Load room info
    final roomData = await _supabase
        .from('rooms')
        .select()
        .eq('id', widget.roomId)
        .single();
    if (mounted) {
      setState(() => _roomModel = RoomModel.fromJson(roomData));
    }

    // Subscribe to participant changes via Supabase Realtime
    _channel = _supabase
        .channel('room:${widget.roomId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'room_participants',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'room_id',
            value: widget.roomId,
          ),
          callback: (payload) => _loadParticipants(),
        )
        .subscribe();

    // Add self to participants
    await _supabase.from('room_participants').upsert({
      'room_id': widget.roomId,
      'user_id': user.id,
      'user_name': user.userMetadata?['full_name'] ?? 'User',
      'is_muted': false,
      'is_video_off': false,
      'is_kicked': false,
    });

    await _loadParticipants();
    await _connectToLiveKit();
  }

  Future<void> _loadParticipants() async {
    final data = await _supabase
        .from('room_participants')
        .select()
        .eq('room_id', widget.roomId)
        .eq('is_kicked', false);

    // Check if current user was kicked
    final me = (data as List).firstWhere(
      (p) => p['user_id'] == _currentUserId,
      orElse: () => null,
    );

    if (me != null && me['is_kicked'] == true && mounted) {
      _showKickedDialog();
      return;
    }

    // Check if current user was muted by teacher
    if (me != null && me['is_muted'] == true && _room != null) {
      await _room!.localParticipant?.setMicrophoneEnabled(false);
      if (mounted) setState(() => _isMicMuted = true);
    }

    // Check if video was disabled by teacher
    if (me != null && me['is_video_off'] == true && _room != null) {
      await _room!.localParticipant?.setCameraEnabled(false);
      if (mounted) setState(() => _isCameraOff = true);
    }

    if (mounted) {
      setState(() {
        _participants = data
            .map<ParticipantModel>((p) => ParticipantModel.fromJson(p))
            .toList();
      });
    }
  }

  Future<void> _connectToLiveKit() async {
    try {
      // Get token from Supabase Edge Function
      final response = await _supabase.functions.invoke(
        'generate-livekit-token',
        body: {
          'room_id': widget.roomId,
          'user_id': _currentUserId,
          'user_name': _supabase.auth.currentUser?.userMetadata?['full_name'] ?? 'User',
          'role': _currentUserRole,
        },
      );

      final token = response.data['token'] as String;
      final room = Room(
        roomOptions: const RoomOptions(
          defaultCameraCaptureOptions: CameraCaptureOptions(
            cameraPosition: CameraPosition.front,
          ),
          defaultAudioCaptureOptions: AudioCaptureOptions(
            noiseSuppression: true,
            echoCancellation: true,
          ),
        ),
      );
      await room.connect(AppConstants.livekitUrl, token);

      // Enable camera and mic
      await room.localParticipant?.setMicrophoneEnabled(true);
      await room.localParticipant?.setCameraEnabled(true);

      room.addListener(_onRoomUpdate);

      if (mounted) {
        setState(() {
          _room = room;
          _isConnecting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isConnecting = false;
        });
      }
    }
  }

  void _onRoomUpdate() {
    if (mounted) setState(() {});
  }

  void _showKickedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Removed from Class'),
        content: const Text(
            'You have been removed from this class by the teacher.'),
        actions: [
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.go('/student-dashboard');
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleMic() async {
    await _room?.localParticipant?.setMicrophoneEnabled(_isMicMuted);
    if (mounted) setState(() => _isMicMuted = !_isMicMuted);
    await _supabase
        .from('room_participants')
        .update({'is_muted': _isMicMuted})
        .eq('room_id', widget.roomId)
        .eq('user_id', _currentUserId!);
  }

  Future<void> _toggleCamera() async {
    await _room?.localParticipant?.setCameraEnabled(_isCameraOff);
    if (mounted) setState(() => _isCameraOff = !_isCameraOff);
    await _supabase
        .from('room_participants')
        .update({'is_video_off': _isCameraOff})
        .eq('room_id', widget.roomId)
        .eq('user_id', _currentUserId!);
  }

  Future<void> _leaveClass() async {
    await _room?.disconnect();
    await _supabase
        .from('room_participants')
        .delete()
        .eq('room_id', widget.roomId)
        .eq('user_id', _currentUserId!);
    if (_currentUserRole == 'teacher') {
      await _supabase
          .from('rooms')
          .update({'is_active': false}).eq('id', widget.roomId);
    }
    if (mounted) {
      context.go(_currentUserRole == 'teacher'
          ? '/teacher-dashboard'
          : '/student-dashboard');
    }
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    _room?.removeListener(_onRoomUpdate);
    _room?.disconnect();
    _room?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isConnecting) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 16),
              Text(
                'Connecting to class...',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 64),
              const SizedBox(height: 16),
              const Text('Failed to connect', style: TextStyle(color: Colors.white)),
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final room = _room!;
    final remoteParticipants = room.remoteParticipants.values.toList();
    final isTeacher = _currentUserRole == 'teacher';

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              roomTitle: _roomModel?.title ?? 'Classroom',
              participantCount: remoteParticipants.length + 1,
              onLeave: _leaveClass,
            ),
            Expanded(
              child: _buildVideoGrid(room, remoteParticipants, isTeacher),
            ),
            _BottomControls(
              isMuted: _isMicMuted,
              isCameraOff: _isCameraOff,
              onToggleMic: _toggleMic,
              onToggleCamera: _toggleCamera,
              onLeave: _leaveClass,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoGrid(
      Room room, List<RemoteParticipant> remoteParticipants, bool isTeacher) {
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: remoteParticipants.isEmpty ? 1 : 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 16 / 9,
      ),
      itemCount: remoteParticipants.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) {
          return VideoTile(
            participant: room.localParticipant!,
            isLocal: true,
            isMuted: _isMicMuted,
            isCameraOff: _isCameraOff,
            label: 'You',
            isTeacher: isTeacher,
            onMute: null,
            onKick: null,
            onToggleVideo: null,
          );
        }
        final remote = remoteParticipants[i - 1];
        final pModel = _participants.firstWhere(
          (p) => p.userId == remote.identity,
          orElse: () => ParticipantModel(
            id: '',
            roomId: widget.roomId,
            userId: remote.identity,
            userName: remote.name.isNotEmpty ? remote.name : remote.identity,
            isMuted: false,
            isVideoOff: false,
            isKicked: false,
            joinedAt: DateTime.now(),
          ),
        );
        return VideoTile(
          participant: remote,
          isLocal: false,
          isMuted: remote.isMuted,
          isCameraOff: !remote.isCameraEnabled(),
          label: pModel.userName,
          isTeacher: isTeacher,
          onMute: isTeacher ? () => _muteParticipant(pModel) : null,
          onKick: isTeacher ? () => _kickParticipant(pModel) : null,
          onToggleVideo:
              isTeacher ? () => _toggleParticipantVideo(pModel) : null,
        );
      },
    );
  }

  Future<void> _muteParticipant(ParticipantModel p) async {
    await _supabase
        .from('room_participants')
        .update({'is_muted': !p.isMuted})
        .eq('room_id', widget.roomId)
        .eq('user_id', p.userId);
    await _loadParticipants();
  }

  Future<void> _toggleParticipantVideo(ParticipantModel p) async {
    await _supabase
        .from('room_participants')
        .update({'is_video_off': !p.isVideoOff})
        .eq('room_id', widget.roomId)
        .eq('user_id', p.userId);
    await _loadParticipants();
  }

  Future<void> _kickParticipant(ParticipantModel p) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Kick Participant'),
        content: Text('Remove ${p.userName} from the class?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Kick'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await _supabase
          .from('room_participants')
          .update({'is_kicked': true})
          .eq('room_id', widget.roomId)
          .eq('user_id', p.userId);
      await _loadParticipants();
    }
  }
}

class _TopBar extends StatelessWidget {
  final String roomTitle;
  final int participantCount;
  final VoidCallback onLeave;

  const _TopBar({
    required this.roomTitle,
    required this.participantCount,
    required this.onLeave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.black,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(roomTitle,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16)),
                Text('$participantCount participant(s)',
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                        color: Colors.green, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                const Text('LIVE',
                    style: TextStyle(
                        color: Colors.green,
                        fontSize: 11,
                        fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            icon: const Icon(Icons.call_end, color: Colors.red, size: 28),
            onPressed: onLeave,
            tooltip: 'Leave',
          ),
        ],
      ),
    );
  }
}

class _BottomControls extends StatelessWidget {
  final bool isMuted;
  final bool isCameraOff;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCamera;
  final VoidCallback onLeave;

  const _BottomControls({
    required this.isMuted,
    required this.isCameraOff,
    required this.onToggleMic,
    required this.onToggleCamera,
    required this.onLeave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
      color: Colors.black,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _ControlButton(
            icon: isMuted ? Icons.mic_off : Icons.mic,
            label: isMuted ? 'Unmute' : 'Mute',
            color: isMuted ? Colors.red : Colors.white,
            onTap: onToggleMic,
          ),
          _ControlButton(
            icon: isCameraOff ? Icons.videocam_off : Icons.videocam,
            label: isCameraOff ? 'Start Video' : 'Stop Video',
            color: isCameraOff ? Colors.red : Colors.white,
            onTap: onToggleCamera,
          ),
          _ControlButton(
            icon: Icons.call_end,
            label: 'Leave',
            color: Colors.red,
            backgroundColor: Colors.red.withOpacity(0.2),
            onTap: onLeave,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color? backgroundColor;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.color,
    this.backgroundColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: backgroundColor ?? Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: color, fontSize: 11)),
        ],
      ),
    );
  }
}
