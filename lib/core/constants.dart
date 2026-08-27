import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  AppConstants._();

  // Supabase
  static String get supabaseUrl => dotenv.env['SUPABASE_URL']!;
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY']!;

  // LiveKit
  static String get livekitUrl => dotenv.env['LIVEKIT_URL']!;
  static String get livekitApiKey => dotenv.env['LIVEKIT_API_KEY']!;

  // App
  static const String appName = 'ClassRoom';
  static const String teacherRole = 'teacher';
  static const String studentRole = 'student';
}
