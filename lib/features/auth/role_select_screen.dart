import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

  Future<void> _selectRole(BuildContext context, String role) async {
    await Supabase.instance.client.auth.updateUser(UserAttributes(
      data: {'role': role},
    ));
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      await Supabase.instance.client.from('profiles').upsert({
        'id': user.id,
        'full_name': user.userMetadata?['full_name'] ?? '',
        'email': user.email ?? '',
        'role': role,
      });
    }
    if (context.mounted) {
      context.go(role == 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Who are you?',
                    style: theme.textTheme.headlineMedium
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Select your role to continue',
                    style: TextStyle(color: theme.colorScheme.outline)),
                const SizedBox(height: 48),
                Row(
                  children: [
                    Expanded(
                      child: _BigRoleCard(
                        label: 'Teacher',
                        icon: Icons.person_pin,
                        color: const Color(0xFF4F46E5),
                        description: 'Host classes & manage students',
                        onTap: () => _selectRole(context, 'teacher'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _BigRoleCard(
                        label: 'Student',
                        icon: Icons.school,
                        color: const Color(0xFF059669),
                        description: 'Join classes & learn',
                        onTap: () => _selectRole(context, 'student'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BigRoleCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final String description;
  final VoidCallback onTap;

  const _BigRoleCard({
    required this.label,
    required this.icon,
    required this.color,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, size: 48, color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(label,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
