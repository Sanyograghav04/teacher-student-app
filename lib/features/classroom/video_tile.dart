import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart' as rtc;
import 'package:livekit_client/livekit_client.dart';

class VideoTile extends StatelessWidget {
  final Participant participant;
  final bool isLocal;
  final bool isMuted;
  final bool isCameraOff;
  final String label;
  final bool isTeacher;
  final VoidCallback? onMute;
  final VoidCallback? onKick;
  final VoidCallback? onToggleVideo;

  const VideoTile({
    super.key,
    required this.participant,
    required this.isLocal,
    required this.isMuted,
    required this.isCameraOff,
    required this.label,
    required this.isTeacher,
    this.onMute,
    this.onKick,
    this.onToggleVideo,
  });

  VideoTrack? _getActiveVideoTrack() {
    for (final pub in participant.videoTrackPublications) {
      final track = pub.track;
      if (track is VideoTrack && !pub.muted) {
        return track;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final videoTrack = _getActiveVideoTrack();
    final showVideo = !isCameraOff && videoTrack != null;

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        color: Colors.grey[900],
        child: Stack(
          children: [
            // Video renderer
            if (showVideo)
              Positioned.fill(
                child: VideoTrackRenderer(
                  videoTrack,
                  fit: rtc.RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                ),
              )
            else
              // Camera off / no track placeholder
              Positioned.fill(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.grey[700],
                        child: Text(
                          label.isNotEmpty ? label[0].toUpperCase() : '?',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Icon(Icons.videocam_off,
                          color: Colors.grey, size: 16),
                    ],
                  ),
                ),
              ),
            // Label overlay
            Positioned(
              bottom: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isMuted)
                      const Icon(Icons.mic_off, color: Colors.red, size: 12),
                    if (isMuted) const SizedBox(width: 4),
                    Text(label,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 12)),
                  ],
                ),
              ),
            ),
            // Teacher control buttons (only shown for teacher on other participants)
            if (isTeacher && !isLocal)
              Positioned(
                top: 8,
                right: 8,
                child: Column(
                  children: [
                    _ControlIcon(
                      icon: isMuted ? Icons.mic_off : Icons.mic,
                      color: isMuted ? Colors.red : Colors.white,
                      tooltip: isMuted ? 'Unmute' : 'Mute',
                      onTap: onMute,
                    ),
                    const SizedBox(height: 4),
                    _ControlIcon(
                      icon: isCameraOff ? Icons.videocam_off : Icons.videocam,
                      color: isCameraOff ? Colors.red : Colors.white,
                      tooltip: isCameraOff ? 'Enable Video' : 'Disable Video',
                      onTap: onToggleVideo,
                    ),
                    const SizedBox(height: 4),
                    _ControlIcon(
                      icon: Icons.person_remove,
                      color: Colors.red,
                      tooltip: 'Kick',
                      onTap: onKick,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ControlIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback? onTap;

  const _ControlIcon({
    required this.icon,
    required this.color,
    required this.tooltip,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, color: color, size: 16),
        ),
      ),
    );
  }
}
