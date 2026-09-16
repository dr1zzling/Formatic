import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/services/storage_service.dart';

/// Trash Screen — stores deleted forms in SharedPreferences,
/// matching Web FE behavior (localStorage). Permanent delete calls
/// DELETE /form backend endpoint.
/// Tambah form ke trash (SharedPreferences) saat user menghapus dari My Forms.
/// Dipanggil dari MyFormsScreen.
Future<void> addFormToTrash({
  required String slug,
  required String title,
  String? category,
  String? status,
}) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('formatic_trash');
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
    list.removeWhere((e) => e['slug'] == slug);
    list.insert(0, {
      'slug': slug,
      'title': title,
      'category': category ?? '',
      'status': status ?? 'private',
      'deletedAt': DateTime.now().toIso8601String(),
    });
    await prefs.setString('formatic_trash', jsonEncode(list));
  } catch (_) {}
}

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  static const _storageKey = 'formatic_trash';
  static const _retentionDays = 30;

  List<Map<String, dynamic>> _items = [];
  bool _isLoading = true;
  String _search = '';
  String _username = 'User';

  @override
  void initState() {
    super.initState();
    _loadUsername();
    _loadTrash();
  }

  Future<void> _loadUsername() async {
    final u = await StorageService.getUsername();
    if (u != null && mounted) setState(() => _username = u);
  }

  Future<void> _loadTrash() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          final now = DateTime.now();
          // Filter expired items (> 30 hari)
          final valid = decoded.whereType<Map>().where((e) {
            final deletedAt = DateTime.tryParse(e['deletedAt'] as String? ?? '');
            if (deletedAt == null) return true;
            return now.difference(deletedAt).inDays < _retentionDays;
          }).map((e) => Map<String, dynamic>.from(e)).toList();
          setState(() => _items = valid);
          // Simpan kembali setelah purge expired
          await prefs.setString(_storageKey, jsonEncode(valid));
        }
      }
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  Future<void> _restore(int index) async {
    // Restore: hanya hapus dari trash lokal. Form tetap ada di server (status private).
    final updated = List<Map<String, dynamic>>.from(_items)..removeAt(index);
    setState(() => _items = updated);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, jsonEncode(updated));
    } catch (_) {}
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Form dipulihkan. Cek di My Forms.'),
        backgroundColor: AppColors.success,
        duration: Duration(seconds: 2),
      ));
    }
  }

  Future<void> _permanentDelete(int index) async {
    final item = _items[index];
    final slug = item['slug'] as String? ?? '';
    final title = item['title'] as String? ?? 'Form';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber, color: AppColors.error),
            SizedBox(width: 8),
            Text('Hapus Permanen'),
          ],
        ),
        content: Text(
          'Form "$title" akan dihapus secara permanen dan tidak dapat dikembalikan.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Hapus Permanen'),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;

    // Hapus dari backend jika slug tersedia
    if (slug.isNotEmpty) {
      final result = await FormService.deleteForm(slug);
      if (!mounted) return;
      if (!result['success'] && result['message'] != null) {
        // Ignore 404 (sudah terhapus sebelumnya), tampilkan error lain
        final statusHint = result['message'] as String;
        if (!statusHint.contains('404') && !statusHint.contains('tidak ada')) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(result['message'] ?? 'Gagal menghapus form'),
            backgroundColor: AppColors.error,
          ));
          return;
        }
      }
    }

    final updated = List<Map<String, dynamic>>.from(_items)..removeAt(index);
    setState(() => _items = updated);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, jsonEncode(updated));
    } catch (_) {}
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Form berhasil dihapus permanen.'),
        backgroundColor: AppColors.success,
        duration: Duration(seconds: 2),
      ));
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _items;
    final q = _search.toLowerCase();
    return _items
        .where((e) =>
            (e['title'] as String? ?? '').toLowerCase().contains(q))
        .toList();
  }

  String _daysLeft(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = _retentionDays - DateTime.now().difference(dt).inDays;
    if (diff <= 0) return 'Kedaluwarsa';
    if (diff == 1) return '1 hari tersisa';
    return '$diff hari tersisa';
  }

  String _deletedAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt).inDays;
    if (diff == 0) return 'Dihapus hari ini';
    if (diff == 1) return 'Dihapus 1 hari lalu';
    return 'Dihapus $diff hari lalu';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(
              children: [
                const Icon(Icons.delete_outline,
                    size: 22, color: AppColors.error),
                const SizedBox(width: 8),
                const Text(
                  'Trash',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: AppColors.avatarGradient,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      _username.isNotEmpty
                          ? _username[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Info banner
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppColors.warning.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline,
                      size: 16, color: AppColors.warning),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Form akan dihapus permanen setelah 30 hari.',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search
          if (_items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: TextField(
                onChanged: (v) => setState(() => _search = v),
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Cari form di trash...',
                  prefixIcon: const Icon(Icons.search,
                      size: 18, color: AppColors.textHint),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 0),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                        color: AppColors.inputBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                        color: AppColors.inputBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                        color: AppColors.primary, width: 1.5),
                  ),
                ),
              ),
            ),

          const SizedBox(height: 12),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AppColors.primary))
                : filtered.isEmpty
                    ? _buildEmpty()
                    : RefreshIndicator(
                        onRefresh: _loadTrash,
                        color: AppColors.primary,
                        child: ListView.separated(
                          padding:
                              const EdgeInsets.fromLTRB(20, 0, 20, 24),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (ctx, i) {
                            final item = filtered[i];
                            final realIndex = _items.indexWhere(
                                (e) =>
                                    e['deletedAt'] ==
                                    item['deletedAt']);
                            return _TrashItem(
                              item: item,
                              deletedAgo: _deletedAgo(
                                  item['deletedAt'] as String?),
                              daysLeft: _daysLeft(
                                  item['deletedAt'] as String?),
                              onRestore: () => _restore(realIndex),
                              onDelete: () =>
                                  _permanentDelete(realIndex),
                            );
                          },
                        ),
                      ),
          ),
        ],
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
                color: AppColors.error.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.delete_outline,
                  size: 40, color: AppColors.error),
            ),
            const SizedBox(height: 20),
            const Text(
              'Trash kosong',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Form yang dihapus akan muncul di sini\nsebelum dihapus permanen.',
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

class _TrashItem extends StatelessWidget {
  final Map<String, dynamic> item;
  final String deletedAgo;
  final String daysLeft;
  final VoidCallback onRestore;
  final VoidCallback onDelete;

  const _TrashItem({
    required this.item,
    required this.deletedAgo,
    required this.daysLeft,
    required this.onRestore,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final category = item['category'] as String? ?? '';

    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(Icons.description_outlined,
                    size: 22, color: AppColors.error),
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
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        if (category.isNotEmpty) ...[
                          Text(
                            category,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const Text(' · ',
                              style: TextStyle(
                                  color: AppColors.textHint)),
                        ],
                        Text(
                          deletedAgo,
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
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  daysLeft,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onRestore,
                  icon: const Icon(Icons.restore, size: 16),
                  label: const Text('Pulihkan'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_forever, size: 16),
                  label: const Text('Hapus'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
