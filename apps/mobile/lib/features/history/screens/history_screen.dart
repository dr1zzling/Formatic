import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_colors.dart';
import '../../forms/screens/form_viewer_screen.dart';

/// History Screen — stores and displays form submission history locally
/// (SharedPreferences), matching Web FE behavior (localStorage).
/// No backend endpoint exists for per-user history.
/// Simpan entry riwayat ke SharedPreferences setelah form disubmit.
/// Dipanggil dari FormViewerScreen.
Future<void> saveHistoryEntry({
  required String formSlug,
  required String formTitle,
  String? category,
}) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('formatic_history');
    List<Map<String, dynamic>> list = [];
    if (raw != null) {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        list = decoded
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
    }
    list.insert(0, {
      'slug': formSlug,
      'title': formTitle,
      'category': category ?? '',
      'submittedAt': DateTime.now().toIso8601String(),
    });
    if (list.length > 50) list = list.sublist(0, 50);
    await prefs.setString('formatic_history', jsonEncode(list));
  } catch (_) {}
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  static const _storageKey = 'formatic_history';
  static const _maxEntries = 50;

  List<Map<String, dynamic>> _items = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          setState(() {
            _items = decoded
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList();
          });
        }
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() => _isLoading = false);
  }

  Future<void> _removeEntry(int index) async {
    final updated = List<Map<String, dynamic>>.from(_items)..removeAt(index);
    setState(() => _items = updated);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, jsonEncode(updated));
    } catch (_) {}
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items
        .where((e) => (e['title'] as String? ?? '').toLowerCase().contains(q))
        .toList();
  }

  String _relativeTime(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    if (diff.inDays < 30) return '${diff.inDays} hari lalu';
    return '${(diff.inDays / 30).floor()} bulan lalu';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  const Text(
                    'Riwayat',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  if (_items.isNotEmpty)
                    TextButton(
                      onPressed: () async {
                        final ok = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16)),
                            title: const Text('Hapus Semua Riwayat'),
                            content: const Text(
                                'Seluruh riwayat pengisian form akan dihapus. Lanjutkan?'),
                            actions: [
                              TextButton(
                                  onPressed: () =>
                                      Navigator.of(ctx).pop(false),
                                  child: const Text('Batal')),
                              TextButton(
                                onPressed: () => Navigator.of(ctx).pop(true),
                                style: TextButton.styleFrom(
                                    foregroundColor: AppColors.error),
                                child: const Text('Hapus'),
                              ),
                            ],
                          ),
                        );
                        if (ok == true && mounted) {
                          setState(() => _items = []);
                          final prefs =
                              await SharedPreferences.getInstance();
                          await prefs.remove(_storageKey);
                        }
                      },
                      child: const Text(
                        'Hapus semua',
                        style: TextStyle(
                            color: AppColors.error, fontSize: 13),
                      ),
                    ),
                ],
              ),
            ),

            // Search
            if (_items.isNotEmpty)
              Padding(
                padding:
                    const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Cari riwayat...',
                    prefixIcon: const Icon(Icons.search,
                        size: 18, color: AppColors.textHint),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: AppColors.inputBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: AppColors.inputBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                          color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 16),

            // List
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: AppColors.primary))
                  : filtered.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: _loadHistory,
                          color: AppColors.primary,
                          child: ListView.separated(
                            padding:
                                const EdgeInsets.fromLTRB(20, 0, 20, 24),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final item = filtered[i];
                              final realIndex = _items
                                  .indexWhere((e) =>
                                      e['submittedAt'] ==
                                      item['submittedAt']);
                              return _HistoryItem(
                                item: item,
                                relativeTime: _relativeTime(
                                    item['submittedAt'] as String?),
                                onTap: () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => FormViewerScreen(
                                        slug: item['slug'] as String),
                                  ),
                                ),
                                onDelete: () => _removeEntry(realIndex),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.history,
                  size: 40, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            const Text(
              'Belum ada riwayat',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Riwayat pengisian form akan muncul\ndi sini setelah kamu submit form.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 14, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryItem extends StatelessWidget {
  final Map<String, dynamic> item;
  final String relativeTime;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _HistoryItem({
    required this.item,
    required this.relativeTime,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final category = item['category'] as String? ?? '';
    final isQuiz = category.toLowerCase().contains('ujian') ||
        category.toLowerCase().contains('quiz');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: isQuiz
                    ? AppColors.primary.withOpacity(0.1)
                    : AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(
                isQuiz ? Icons.quiz_outlined : Icons.poll_outlined,
                size: 22,
                color: isQuiz ? AppColors.primary : AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'] as String? ?? 'Form',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (category.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            category,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      const Icon(Icons.check_circle_outline,
                          size: 12, color: AppColors.success),
                      const SizedBox(width: 4),
                      Text(
                        'Selesai · $relativeTime',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: onDelete,
              icon: const Icon(Icons.close,
                  size: 18, color: AppColors.textHint),
              padding: EdgeInsets.zero,
              constraints:
                  const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ],
        ),
      ),
    );
  }
}
