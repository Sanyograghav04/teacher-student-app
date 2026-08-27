import 'package:flutter/material.dart';
import '../../models/room_model.dart';

class TeacherControls extends StatelessWidget {
  final List<ParticipantModel> participants;
  final Function(ParticipantModel) onMute;
  final Function(ParticipantModel) onKick;
  final Function(ParticipantModel) onToggleVideo;

  const TeacherControls({
    super.key,
    required this.participants,
    required this.onMute,
    required this.onKick,
    required this.onToggleVideo,
  });

  @override
  Widget build(BuildContext context) {
    final students = participants.where((p) => !p.isKicked).toList();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Participants',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (students.isEmpty)
            const Center(
              child: Text('No students yet',
                  style: TextStyle(color: Colors.grey)),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              itemCount: students.length,
              itemBuilder: (ctx, i) {
                final p = students[i];
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: Colors.grey[700],
                    child: Text(p.userName[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white)),
                  ),
                  title: Text(p.userName,
                      style: const TextStyle(color: Colors.white)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: Icon(
                          p.isMuted ? Icons.mic_off : Icons.mic,
                          color: p.isMuted ? Colors.red : Colors.white,
                          size: 20,
                        ),
                        tooltip: p.isMuted ? 'Unmute' : 'Mute',
                        onPressed: () => onMute(p),
                      ),
                      IconButton(
                        icon: Icon(
                          p.isVideoOff ? Icons.videocam_off : Icons.videocam,
                          color: p.isVideoOff ? Colors.red : Colors.white,
                          size: 20,
                        ),
                        tooltip: p.isVideoOff ? 'Enable Video' : 'Disable Video',
                        onPressed: () => onToggleVideo(p),
                      ),
                      IconButton(
                        icon: const Icon(Icons.person_remove,
                            color: Colors.red, size: 20),
                        tooltip: 'Kick',
                        onPressed: () => onKick(p),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
