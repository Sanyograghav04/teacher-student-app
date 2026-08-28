import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class LiveKitTokenGenerator {
  static String generateToken({
    required String roomId,
    required String userId,
    required String userName,
    required bool isTeacher,
  }) {
    final apiKey = dotenv.env['LIVEKIT_API_KEY'] ?? 'APIjDzyVNf6jFD8';
    final apiSecret = dotenv.env['LIVEKIT_API_SECRET'] ?? 'SLhU9LInqTIWtJ7k2uoykRcl7IvDS4VSX5eb5jkxqeS';

    final jwt = JWT(
      {
        'sub': userId,
        'name': userName,
        'video': {
          'room': roomId,
          'roomJoin': true,
          'canPublish': true,
          'canSubscribe': true,
          'canPublishData': true,
          'roomAdmin': isTeacher,
          'roomRecord': isTeacher,
        },
      },
      issuer: apiKey,
    );

    return jwt.sign(
      SecretKey(apiSecret),
      expiresIn: const Duration(hours: 6),
    );
  }
}
