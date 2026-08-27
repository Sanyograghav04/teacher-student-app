import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/room_model.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  final _supabase = Supabase.instance.client;
  List<RoomModel> _activeRooms = [];
  bool _isLoading = true;
  String? _userName;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final profile = await _supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();

    final rooms = await _supabase
        .from('rooms')
        .select()
        .eq('is_active', true)
        .order('created_at', ascending: false);

    if (mounted) {
      setState(() {
        _userName = profile?['full_name'] as String? ?? 'Student';
        _activeRooms = (rooms as List).map((r) => RoomModel.fromJson(r)).toList();
        _isLoading = false;
      });
    }
  }

  Future<void> _joinByCode() async {
    final codeController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Join Class'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the room code provided by your teacher'),
            const SizedBox(height: 16),
            TextField(
              controller: codeController,
              decoration: const InputDecoration(
                labelText: 'Room Code',
                hintText: 'e.g. AB12CD34',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.characters,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, codeController.text),
            child: const Text('Join'),
          ),
        ],
      ),
    );

    if (result == null || result.isEmpty) return;

    final room = await _supabase
        .from('rooms')
        .select()
        .eq('room_code', result.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

    if (!mounted) return;
    if (room == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Room not found or class is not active'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    context.push('/classroom/${room['id']}');
  }

  Future<void> _joinRoom(RoomModel room) async {
    context.push('/classroom/${room.id}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Live Classes', style: TextStyle(fontWeight: FontWeight.bold)),
            if (_userName != null)
              Text('Welcome, $_userName', style: const TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () async {
              await _supabase.auth.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _joinByCode,
        icon: const Icon(Icons.keyboard),
        label: const Text('Enter Code'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _activeRooms.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.live_tv_outlined,
                            size: 80, color: theme.colorScheme.outline),
                        const SizedBox(height: 16),
                        Text('No live classes right now',
                            style: theme.textTheme.titleLarge
                                ?.copyWith(color: theme.colorScheme.outline)),
                        const SizedBox(height: 8),
                        const Text('Pull to refresh or enter a room code'),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: _joinByCode,
                          icon: const Icon(Icons.keyboard),
                          label: const Text('Enter Room Code'),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _activeRooms.length,
                    itemBuilder: (ctx, i) {
                      final room = _activeRooms[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(
                              color: theme.colorScheme.outlineVariant),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primaryContainer,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.live_tv,
                                color: theme.colorScheme.primary),
                          ),
                          title: Text(room.title,
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('Teacher: ${room.teacherName}'),
                          trailing: FilledButton(
                            onPressed: () => _joinRoom(room),
                            style: FilledButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Join'),
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
