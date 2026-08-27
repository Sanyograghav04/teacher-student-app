class RoomModel {
  final String id;
  final String title;
  final String teacherId;
  final String teacherName;
  final bool isActive;
  final String? roomCode;
  final DateTime createdAt;

  const RoomModel({
    required this.id,
    required this.title,
    required this.teacherId,
    required this.teacherName,
    required this.isActive,
    this.roomCode,
    required this.createdAt,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    return RoomModel(
      id: json['id'] as String,
      title: json['title'] as String,
      teacherId: json['teacher_id'] as String,
      teacherName: json['teacher_name'] as String? ?? 'Teacher',
      isActive: json['is_active'] as bool? ?? false,
      roomCode: json['room_code'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'teacher_id': teacherId,
        'teacher_name': teacherName,
        'is_active': isActive,
        'room_code': roomCode,
        'created_at': createdAt.toIso8601String(),
      };
}

class ParticipantModel {
  final String id;
  final String roomId;
  final String userId;
  final String userName;
  final String? avatarUrl;
  final bool isMuted;
  final bool isVideoOff;
  final bool isKicked;
  final DateTime joinedAt;

  const ParticipantModel({
    required this.id,
    required this.roomId,
    required this.userId,
    required this.userName,
    this.avatarUrl,
    required this.isMuted,
    required this.isVideoOff,
    required this.isKicked,
    required this.joinedAt,
  });

  factory ParticipantModel.fromJson(Map<String, dynamic> json) {
    return ParticipantModel(
      id: json['id'] as String,
      roomId: json['room_id'] as String,
      userId: json['user_id'] as String,
      userName: json['user_name'] as String? ?? 'Student',
      avatarUrl: json['avatar_url'] as String?,
      isMuted: json['is_muted'] as bool? ?? false,
      isVideoOff: json['is_video_off'] as bool? ?? false,
      isKicked: json['is_kicked'] as bool? ?? false,
      joinedAt: DateTime.parse(json['joined_at'] as String),
    );
  }

  ParticipantModel copyWith({
    bool? isMuted,
    bool? isVideoOff,
    bool? isKicked,
  }) {
    return ParticipantModel(
      id: id,
      roomId: roomId,
      userId: userId,
      userName: userName,
      avatarUrl: avatarUrl,
      isMuted: isMuted ?? this.isMuted,
      isVideoOff: isVideoOff ?? this.isVideoOff,
      isKicked: isKicked ?? this.isKicked,
      joinedAt: joinedAt,
    );
  }
}
