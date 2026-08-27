import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../models/room_model.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  final _supabase = Supabase.instance.client;
  List<RoomModel> _rooms = [];
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
        .eq('teacher_id', user.id)
        .order('created_at', ascending: false);

    if (mounted) {
      setState(() {
        _userName = profile?['full_name'] as String? ?? 'Teacher';
        _rooms = (rooms as List).map((r) => RoomModel.fromJson(r)).toList();
        _isLoading = false;
      });
    }
  }

  Future<void> _createRoom() async {
    final titleController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create New Class'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: 'Class Title',
            hintText: 'e.g. Mathematics - Grade 10',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, titleController.text),
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (result == null || result.isEmpty) return;

    final user = _supabase.auth.currentUser!;
    const uuid = Uuid();
    final roomCode = uuid.v4().substring(0, 8).toUpperCase();

    await _supabase
        .from('rooms')
        .insert({
          'title': result,
          'teacher_id': user.id,
          'teacher_name': _userName,
          'is_active': false,
          'room_code': roomCode,
        })
        .select()
        .single();

    if (!mounted) return;
    await _loadData();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Room created! Code: $roomCode'),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _startClass(RoomModel room) async {
    await _supabase
        .from('rooms')
        .update({'is_active': true}).eq('id', room.id);
    if (mounted) context.push('/classroom/${room.id}');
  }

  Future<void> _deleteRoom(RoomModel room) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Class'),
        content: Text('Are you sure you want to delete "${room.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await _supabase.from('rooms').delete().eq('id', room.id);
      await _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Classes', style: TextStyle(fontWeight: FontWeight.bold)),
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
        onPressed: _createRoom,
        icon: const Icon(Icons.add),
        label: const Text('New Class'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _rooms.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.class_outlined,
                          size: 80, color: theme.colorScheme.outline),
                      const SizedBox(height: 16),
                      Text('No classes yet',
                          style: theme.textTheme.titleLarge
                              ?.copyWith(color: theme.colorScheme.outline)),
                      const SizedBox(height: 8),
                      const Text('Tap + to create your first class'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _rooms.length,
                    itemBuilder: (ctx, i) {
                      final room = _rooms[i];
                      return _RoomCard(
                        room: room,
                        onStart: () => _startClass(room),
                        onDelete: () => _deleteRoom(room),
                        onCopyCode: () {
                          Clipboard.setData(
                              ClipboardData(text: room.roomCode ?? ''));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Room code copied!'),
                                duration: Duration(seconds: 2)),
                          );
                        },
                      );
                    },
                  ),
                ),
    );
  }
}

class _RoomCard extends StatelessWidget {
  final RoomModel room;
  final VoidCallback onStart;
  final VoidCallback onDelete;
  final VoidCallback onCopyCode;

  const _RoomCard({
    required this.room,
    required this.onStart,
    required this.onDelete,
    required this.onCopyCode,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(room.title,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                ),
                if (room.isActive)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('Live',
                            style: TextStyle(
                                color: Colors.green,
                                fontSize: 12,
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: onCopyCode,
              child: Row(
                children: [
                  Icon(Icons.key, size: 14, color: theme.colorScheme.outline),
                  const SizedBox(width: 4),
                  Text('Code: ${room.roomCode ?? 'N/A'}',
                      style: TextStyle(
                          color: theme.colorScheme.outline, fontSize: 13)),
                  const SizedBox(width: 4),
                  Icon(Icons.copy, size: 14, color: theme.colorScheme.outline),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onStart,
                    icon: const Icon(Icons.video_call),
                    label: Text(room.isActive ? 'Rejoin Class' : 'Start Class'),
                    style: FilledButton.styleFrom(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.delete_outlined, color: Colors.red),
                  onPressed: onDelete,
                  tooltip: 'Delete',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
