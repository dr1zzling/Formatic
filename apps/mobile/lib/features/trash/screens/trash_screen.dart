import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  static const _filterTabs = [
    'Semua',
    '1 Hari Tersedia',
    '30 Hari Tersedia',
    'Survey',
    'Quiz',
    'Ujian',
  ];

  String _activeFilter = 'Semua';
  String _username = 'User';
  String _search = '';

  List<Map<String, dynamic>> _items = [
    {
      'title': 'Survey Kepuasan Layanan Sekolah',
      'category': 'Survey',
      'status': 'public',
      'responses': 245,
      'gradient': 0,
    },
    {
      'title': 'Quiz Pengetahuan Umum',
      'category': 'Quiz',
      'status': 'public',
      'responses': 1200,
      'gradient': 1,
    },
    {
      'title': 'Form Pendaftaran Seminar Nasional 2025',
      'category': 'Survey',
      'status': 'public',
      'responses': 312,
      'gradient': 2,
    },
    {
      'title': 'Evaluasi Pembelajaran Siswa',
      'category': 'Exam',
      'status': 'public',
      'responses': 98,
      'gradient': 3,
    },
    {
      'title': 'Pendataan Kegiatan Ekstrakurikuler',
      'category': 'Survey',
      'status': 'public',
      'responses': 156,
      'gradient': 4,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadUsername();
  }

  Future<void> _loadUsername() async {
    final username = await StorageService.getUsername();
    if (username != null && mounted) {
      setState(() => _username = username);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items
        .where((f) => (f['title'] as String)
            .toLowerCase()
            .contains(_search.toLowerCase()))
        .toList();

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

          // Title
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Row(
              children: [
                Icon(Icons.delete_outline, size: 22, color: Color(0xFFEF4444)),
                SizedBox(width: 8),
                Text(
                  'Trash',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ],
            ),
          ),

          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
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
                      onChanged: (v) => setState(() => _search = v),
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search deleted forms...',
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
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Icon(
                    Icons.filter_list,
                    size: 16,
                    color: Color(0xFF4B5563),
                  ),
                ),
              ],
            ),
          ),

          // Filter tabs
          SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: _filterTabs.map((tab) {
                final selected = _activeFilter == tab;
                return GestureDetector(
                  onTap: () => setState(() => _activeFilter = tab),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: selected ? AppColors.primaryGradient : null,
                      color: selected ? null : Colors.white,
                      borderRadius: BorderRadius.circular(50),
                      border: selected
                          ? null
                          : Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Center(
                      child: Text(
                        tab,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: selected
                              ? Colors.white
                              : const Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 12),

          // List
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('🗑️', style: TextStyle(fontSize: 44)),
                        const SizedBox(height: 12),
                        const Text(
                          'Trash kosong',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    children: [
                      ...filtered.map(
                        (form) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _TrashItem(
                            form: form,
                            onRestore: () => setState(
                              () => _items = _items
                                  .where((f) => f['title'] != form['title'])
                                  .toList(),
                            ),
                            onDelete: () => setState(
                              () => _items = _items
                                  .where((f) => f['title'] != form['title'])
                                  .toList(),
                            ),
                          ),
                        ),
                      ),
                      if (filtered.isNotEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: Text(
                              'Forms di Trash akan dihapus permanen setelah 30 hari sejak penghapusan.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
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
}

class _TrashItem extends StatelessWidget {
  final Map<String, dynamic> form;
  final VoidCallback onRestore;
  final VoidCallback onDelete;

  const _TrashItem({
    required this.form,
    required this.onRestore,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final gradient =
        AppColors.cardGradients[form['gradient'] % AppColors.cardGradients.length];

    return Container(
      padding: const EdgeInsets.all(12),
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 64,
            height: 48,
            decoration: BoxDecoration(gradient: gradient, borderRadius: BorderRadius.circular(12)),
            child: Icon(
              Icons.description_outlined,
              color: Colors.black.withOpacity(0.15),
            ),
          ),
          const SizedBox(width: 12),
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
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Text(
                        form['status'],
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF15803D),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${form['category']} · ${form['responses']} responses',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _actionBtn(
                      label: 'Restore',
                      onTap: onRestore,
                      filled: false,
                    ),
                    const SizedBox(width: 8),
                    _actionBtn(
                      label: 'Hapus',
                      onTap: onDelete,
                      filled: true,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionBtn({
    required String label,
    required VoidCallback onTap,
    required bool filled,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: filled ? const Color(0xFFFEF2F2) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: filled ? const Color(0xFFFECACA) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: filled ? const Color(0xFFEF4444) : const Color(0xFF4B5563),
          ),
        ),
      ),
    );
  }
}
