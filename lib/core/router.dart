import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/auth/forgot_password_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/role_select_screen.dart';
import '../features/auth/verify_otp_screen.dart';
import '../features/dashboard/teacher_dashboard.dart';
import '../features/dashboard/student_dashboard.dart';
import '../features/classroom/classroom_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ValueNotifier<AsyncValue<Session?>>(const AsyncValue.loading());

  Supabase.instance.client.auth.onAuthStateChange.listen((data) {
    authState.value = AsyncValue.data(data.session);
  });

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: authState,
    redirect: (context, state) async {
      final session = Supabase.instance.client.auth.currentSession;
      final isLoggedIn = session != null;
      final isOnAuthPage = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/role-select' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation.startsWith('/verify-otp');

      if (!isLoggedIn && !isOnAuthPage) return '/login';
      if (isLoggedIn && isOnAuthPage) {
        final role = session.user.userMetadata?['role'] as String?;
        if (role == 'teacher') return '/teacher-dashboard';
        if (role == 'student') return '/student-dashboard';
        return '/role-select';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
      GoRoute(path: '/register', builder: (c, s) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (c, s) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/verify-otp',
        builder: (c, s) => VerifyOtpScreen(
          email: s.uri.queryParameters['email'] ?? '',
          role: s.uri.queryParameters['role'] ?? 'student',
          fullName: s.uri.queryParameters['name'] ?? '',
        ),
      ),
      GoRoute(path: '/role-select', builder: (c, s) => const RoleSelectScreen()),
      GoRoute(path: '/teacher-dashboard', builder: (c, s) => const TeacherDashboard()),
      GoRoute(path: '/student-dashboard', builder: (c, s) => const StudentDashboard()),
      GoRoute(
        path: '/classroom/:roomId',
        builder: (c, s) => ClassroomScreen(roomId: s.pathParameters['roomId']!),
      ),
    ],
  );
});
