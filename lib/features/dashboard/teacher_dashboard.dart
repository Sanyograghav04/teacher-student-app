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
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Ensure user profile exists
      final profile = await _supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      if (profile == null) {
        await _supabase.from('profiles').upsert({
          'id': user.id,
          'full_name': user.userMetadata?['full_name'] ?? 'Teacher',
          'email': user.email ?? '',
          'role': 'teacher',
        });
      }

      final rooms = await _supabase
          .from('rooms')
          .select()
          .eq('teacher_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _userName = profile?['full_name'] as String? ?? user.userMetadata?['full_name'] ?? 'Teacher';
          _rooms = (rooms as List).map((r) => RoomModel.fromJson(r)).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _createRoom() async {
    final titleController = TextEditingController();
    bool isCreating = false;

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Create New Class'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Class Title',
                  hintText: 'e.g. Mathematics - Grade 10',
                  border: OutlineInputBorder(),
                ),
                autofocus: true,
                enabled: !isCreating,
              ),
              if (isCreating) ...[
                const SizedBox(height: 16),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                    SizedBox(width: 12),
                    Text('Creating class...'),
                  ],
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: isCreating ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: isCreating
                  ? null
                  : () async {
                      final title = titleController.text.trim();
                      if (title.isEmpty) return;

                      setDialogState(() => isCreating = true);

                      final user = _supabase.auth.currentUser;
                      if (user == null) {
                        Navigator.pop(ctx);
                        return;
                      }

                      const uuid = Uuid();
                      final roomCode = uuid.v4().substring(0, 8).toUpperCase();

                      try {
                        // 1. Ensure profile exists to satisfy foreign key
                        await _supabase.from('profiles').upsert({
                          'id': user.id,
                          'full_name': _userName ?? user.userMetadata?['full_name'] ?? 'Teacher',
                          'email': user.email ?? '',
                          'role': 'teacher',
                        });

                        // 2. Insert new room
                        await _supabase.from('rooms').insert({
                          'title': title,
                          'teacher_id': user.id,
                          'teacher_name': _userName ?? user.userMetadata?['full_name'] ?? 'Teacher',
                          'is_active': false,
                          'room_code': roomCode,
                        });

                        if (!mounted) return;
                        Navigator.pop(ctx);
                        await _loadData();

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Class "$title" created! Code: $roomCode'),
                              backgroundColor: Colors.green,
                              duration: const Duration(seconds: 4),
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isCreating = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Failed to create room: $e'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      }
                    },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startClass(RoomModel room) async {
    try {
      await _supabase
          .from('rooms')
          .update({'is_active': true}).eq('id', room.id);
    } catch (_) {}
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
      try {
        await _supabase.from('rooms').delete().eq('id', room.id);
        await _loadData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
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
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _loadData,
          ),
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
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off, size: 64, color: Colors.orange),
                        const SizedBox(height: 16),
                        const Text(
                          'Connection Issue',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _loadData,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
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
                          const SizedBox(height: 20),
                          FilledButton.icon(
                            onPressed: _createRoom,
                            icon: const Icon(Icons.add),
                            label: const Text('Create a Class'),
                          ),
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
