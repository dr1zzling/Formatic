import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/config/api_config.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/create_form_sheet.dart';
import 'form_detail_screen.dart';

class MyFormsScreen extends StatefulWidget {
  const MyFormsScreen({super.key});

  @override
  State<MyFormsScreen> createState() => _MyFormsScreenState();
}

class _MyFormsScreenState extends State<MyFormsScreen> {
  static const int _itemsPerPage = 7;

  String _username = 'User';
  bool _isLoading = true;
  bool _gridView = false;
  String _search = '';
  int _page = 1;

  List<Map<String, dynamic>> _myForms = [];

  @override
  void initState() {
    super.initState();
    _loadUsername();
    _loadForms();
  }

  Future<void> _loadUsername() async {
    final username = await StorageService.getUsername();
    if (username != null && mounted) {
      setState(() => _username = username);
    }
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);

    final result = await FormService.getUserForms();

    if (result['success'] && mounted) {
      final responseData = result['data'] is Map ? result['data']['data'] : null;
      final responseDataMap =
          responseData is Map ? Map<String, dynamic>.from(responseData) : {};
      final List<dynamic> forms =
          responseDataMap['forms'] is List ? responseDataMap['forms'] : [];

      setState(() {
        _myForms = forms.asMap().entries.map((entry) {
          final form = (entry.value is Map)
              ? Map<String, dynamic>.from(entry.value as Map)
              : <String, dynamic>{};
          return {
            'form_id': form['form_id'].toString(),
            'title': form['form_title'] ?? 'Untitled Form',
            'slug': form['form_slug'] ?? '',
            'responses': form['total_respon'] is int ? form['total_respon'] : 0,
            'category': form['category'] ?? '',
            'status': form['form_status'] ?? 'private',
          };
        }).toList();
        _isLoading = false;
      });
    } else {
      setState(() {
        _myForms = [];
        _isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filtered => _myForms
      .where((f) => (f['title'] as String)
          .toLowerCase()
          .contains(_search.toLowerCase()))
      .toList();

  int get _totalPages => (1 + (_filtered.length - 1) ~/ _itemsPerPage).clamp(1, 1 << 31);

  List<Map<String, dynamic>> get _paged {
    final start = (_page - 1) * _itemsPerPage;
    final end = (start + _itemsPerPage).clamp(0, _filtered.length);
    if (start >= _filtered.length) return [];
    return _filtered.sublist(start, end);
  }

  void _openForm(Map<String, dynamic> form) {
    Navigator.of(context)
        .push(
          MaterialPageRoute(
            builder: (context) => FormDetailScreen(
              formId: form['form_id'],
              formTitle: form['title'],
              formStatus: form['status'],
              formSlug: form['slug'],
            ),
          ),
        )
        .then((_) => _loadForms());
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final paged = _paged;

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Hi, $_username!',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                _circleBtn(const Icon(Icons.notifications_none, size: 18)),
                const SizedBox(width: 8),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: AppColors.avatarGradient,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
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

          // Toolbar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: TextField(
                      onChanged: (v) {
                        setState(() {
                          _search = v;
                          _page = 1;
                        });
                      },
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search your forms...',
                        hintStyle: const TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontSize: 14,
                        ),
                        prefixIcon: const Icon(
                          Icons.search,
                          size: 15,
                          color: Color(0xFF9CA3AF),
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primaryLight,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 11),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Row(
                    children: [
                      _toggleBtn(
                        icon: Icons.format_list_bulleted,
                        selected: !_gridView,
                        onTap: () => setState(() => _gridView = false),
                      ),
                      _toggleBtn(
                        icon: Icons.grid_view_rounded,
                        selected: _gridView,
                        onTap: () => setState(() => _gridView = true),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _showCreateModal,
                  child: Container(
                    height: 42,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.add, size: 16, color: Colors.white),
                        SizedBox(width: 4),
                        Text(
                          'Create',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Title + count
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Forms',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                if (filtered.isNotEmpty)
                  Text(
                    '${(_page - 1) * _itemsPerPage + 1}–${( _page * _itemsPerPage).clamp(0, filtered.length)} / ${filtered.length}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : paged.isEmpty
                    ? _buildEmptyState(filtered.isEmpty)
                    : RefreshIndicator(
                        onRefresh: _loadForms,
                        child: _gridView
                            ? _buildGrid(paged)
                            : _buildList(paged),
                      ),
          ),

          // Pagination
          if (!_isLoading && filtered.length > _itemsPerPage)
            Container(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _pageBtn(
                    icon: Icons.chevron_left,
                    enabled: _page > 1,
                    onTap: () => setState(() => _page -= 1),
                  ),
                  const SizedBox(width: 6),
                  ...List.generate(_totalPages, (i) {
                    final p = i + 1;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: _pageBtn(
                        label: '$p',
                        selected: p == _page,
                        enabled: true,
                        onTap: () => setState(() => _page = p),
                      ),
                    );
                  }),
                  const SizedBox(width: 6),
                  _pageBtn(
                    icon: Icons.chevron_right,
                    enabled: _page < _totalPages,
                    onTap: () => setState(() => _page += 1),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> paged) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      itemCount: paged.length,
      separatorBuilder: (_, __) => const Divider(
        height: 1,
        color: Color(0xFFF9FAFB),
      ),
      itemBuilder: (context, index) {
        final form = paged[index];
        return _ListRow(
          form: form,
          onTap: () => _openForm(form),
          onCopy: () => _copyLink(form),
          onEdit: () => _openForm(form),
          onDelete: () => _confirmDelete(form),
        );
      },
    );
  }

  Widget _buildGrid(List<Map<String, dynamic>> paged) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 240,
        mainAxisExtent: 150,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: paged.length,
      itemBuilder: (context, index) {
        final form = paged[index];
        final status = (form['status'] as String).toLowerCase();
        final isPublic = status == 'public';
        return GestureDetector(
          onTap: () => _openForm(form),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF3F4F6)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    size: 18,
                    color: Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  form['title'],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${form['category']} · ${form['responses']} Responses',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _statusBadge(status, isPublic),
                    GestureDetector(
                      onTap: () => _confirmDelete(form),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.delete_outline,
                          size: 15,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(bool noSearch) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(noSearch ? '📝' : '🔍', style: const TextStyle(fontSize: 44)),
            const SizedBox(height: 12),
            Text(
              noSearch ? 'Belum ada form' : 'Form tidak ditemukan',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              noSearch ? 'Buat form pertamamu!' : 'Tidak ada hasil untuk pencarian ini',
              style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            ),
            if (noSearch) ...[
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _showCreateModal,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '+ Buat Form',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _circleBtn(Widget child) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Center(child: child),
    );
  }

  Widget _toggleBtn({
    required IconData icon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 16,
          color: selected ? Colors.white : const Color(0xFF9CA3AF),
        ),
      ),
    );
  }

  Widget _pageBtn({
    IconData? icon,
    String? label,
    bool selected = false,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          gradient: selected ? AppColors.primaryGradient : null,
          color: selected ? null : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: selected ? null : Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Center(
          child: icon != null
              ? Icon(icon, size: 16, color: enabled ? const Color(0xFF6B7280) : const Color(0xFFD1D5DB))
              : Text(
                  label!,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: selected ? Colors.white : const Color(0xFF4B5563),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _statusBadge(String status, bool isPublic) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isPublic ? const Color(0xFFDCFCE7) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(50),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isPublic ? const Color(0xFF15803D) : const Color(0xFF6B7280),
        ),
      ),
    );
  }

  void _copyLink(Map<String, dynamic> form) {
    final url = '${ApiConfig.formApiBaseUrl}/fill/${form['slug']}';
    Clipboard.setData(ClipboardData(text: url));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link form disalin!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _confirmDelete(Map<String, dynamic> form) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Text('🗑️', style: TextStyle(fontSize: 28)),
            SizedBox(width: 10),
            Text(
              'Hapus Form',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Yakin ingin menghapus "${form['title']}"? Tindakan ini tidak bisa dibatalkan.',
          style: const TextStyle(fontSize: 14, height: 1.5),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          Expanded(
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF4B5563),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
              child: const Text('Batal'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                final result = await FormService.deleteForm(form['slug']);
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      result['success']
                          ? 'Form berhasil dihapus'
                          : (result['message'] ?? 'Gagal menghapus form'),
                    ),
                    backgroundColor: result['success']
                        ? AppColors.success
                        : AppColors.error,
                  ),
                );
                _loadForms();
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: const Color(0xFFEF4444),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text('Hapus'),
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CreateFormSheet(
        onCreated: (slug) {
          Navigator.of(context).pop();
          _loadForms();
        },
      ),
    );
  }
}

// ── List row (sama dengan web ListView) ─────────────────────────────────────
class _ListRow extends StatelessWidget {
  final Map<String, dynamic> form;
  final VoidCallback onTap;
  final VoidCallback onCopy;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ListRow({
    required this.form,
    required this.onTap,
    required this.onCopy,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final status = (form['status'] as String).toLowerCase();
    final isPublic = status == 'public';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.description_outlined,
                size: 18,
                color: Color(0xFF2563EB),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    form['title'],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${form['category']} · ${form['responses']} Responses',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isPublic ? const Color(0xFFDCFCE7) : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Text(
                status.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isPublic ? const Color(0xFF15803D) : const Color(0xFF6B7280),
                ),
              ),
            ),
            const SizedBox(width: 4),
            _iconBtn(Icons.share_outlined, onCopy, title: 'Salin link'),
            _iconBtn(Icons.edit_outlined, onEdit, title: 'Edit'),
            _iconBtn(Icons.delete_outline, onDelete, title: 'Hapus', danger: true),
          ],
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap, {String? title, bool danger = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: title ?? '',
        child: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
          child: Icon(
            icon,
            size: 15,
            color: danger ? const Color(0xFF9CA3AF) : const Color(0xFF9CA3AF),
          ),
        ),
      ),
    );
  }
}

