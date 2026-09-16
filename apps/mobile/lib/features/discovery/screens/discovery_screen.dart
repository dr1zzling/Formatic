import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/config/api_config.dart';
import '../../forms/screens/form_viewer_screen.dart';

/// Discovery Screen — browse public forms, preview soal, copy ke form milik sendiri.
/// Sesuai Web FE: GET /form (public), GET /form/slug (soal preview), POST /form/soal (copy).
class DiscoveryScreen extends StatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  List<Map<String, dynamic>> _forms = [];
  bool _isLoading = true;
  String _search = '';
  String _selectedCategory = 'Semua';

  static const _categories = ['Semua', 'Ujian', 'Survei', 'Pengumpulan Data'];

  @override
  void initState() {
    super.initState();
    _loadForms();
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);
    final result = await FormService.getForms();
    if (!mounted) return;
    if (result['success'] == true) {
      final raw = (result['data'] as Map?)?['data'];
      final List<dynamic> list = raw is List ? raw : [];
      setState(() {
        _forms = list
            .whereType<Map>()
            .map((f) {
              final kategori = f['kategori'];
              return {
                'id': f['id'] ?? f['form_id'],
                'title': f['title'] ?? f['form_title'] ?? 'Untitled',
                'slug': f['slug'] ?? f['form_slug'] ?? '',
                // Backend menaruh kategori di form.kategori.{primary_kategori,sub_kategori}
                'category': kategori is Map
                    ? ((kategori['primary_kategori'] ??
                            kategori['sub_kategori'] ??
                            '')
                        .toString())
                    : (f['category'] ?? '').toString(),
                'banner': f['banner'] ?? '',
              };
            })
            .toList();
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    return _forms.where((f) {
      final title = (f['title'] as String? ?? '').toLowerCase();
      final cat = (f['category'] as String? ?? '').toLowerCase();
      final matchSearch =
          _search.isEmpty || title.contains(_search.toLowerCase());
      final matchCat = _selectedCategory == 'Semua' ||
          cat.contains(_selectedCategory.toLowerCase());
      return matchSearch && matchCat;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Discovery',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Cari form publik...',
                prefixIcon: const Icon(Icons.search,
                    size: 18, color: AppColors.textHint),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
            ),
          ),
          // Category chips
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final cat = _categories[i];
                final selected = _selectedCategory == cat;
                return GestureDetector(
                  onTap: () =>
                      setState(() => _selectedCategory = cat),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected
                            ? AppColors.primary
                            : AppColors.inputBorder,
                      ),
                    ),
                    child: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: selected
                            ? Colors.white
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AppColors.primary))
                : _filtered.isEmpty
                    ? _buildEmpty()
                    : RefreshIndicator(
                        onRefresh: _loadForms,
                        color: AppColors.primary,
                        child: GridView.builder(
                          padding: const EdgeInsets.fromLTRB(
                              16, 0, 16, 24),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.82,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) =>
                              _DiscoveryCard(
                            form: _filtered[i],
                            onTap: () => _openPreview(_filtered[i]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _openPreview(Map<String, dynamic> form) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _FormPreviewSheet(form: form),
    ));
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.explore_outlined,
                size: 64, color: AppColors.textSecondary),
            const SizedBox(height: 16),
            const Text(
              'Tidak ada form',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Belum ada form publik yang tersedia.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _DiscoveryCard extends StatelessWidget {
  final Map<String, dynamic> form;
  final VoidCallback onTap;

  const _DiscoveryCard({required this.form, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final banner = form['banner'] as String? ?? '';
    final category = form['category'] as String? ?? '';
    final bannerUrl = banner.isNotEmpty
        ? '${ApiConfig.formApiBaseUrl}$banner'
        : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14)),
              child: Container(
                height: 90,
                color: AppColors.primary.withOpacity(0.08),
                child: bannerUrl != null
                    ? Image.network(
                        bannerUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.description_outlined,
                              size: 36,
                              color: AppColors.primary),
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.description_outlined,
                            size: 36, color: AppColors.primary),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (category.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 5),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        category,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  Text(
                    form['title'] as String? ?? '',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.visibility_outlined,
                          size: 13, color: AppColors.textHint),
                      const SizedBox(width: 4),
                      const Text(
                        'Lihat soal',
                        style: TextStyle(
                            fontSize: 11, color: AppColors.textHint),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Preview + Copy soal ──────────────────────────────────────────────────────

class _FormPreviewSheet extends StatefulWidget {
  final Map<String, dynamic> form;

  const _FormPreviewSheet({required this.form});

  @override
  State<_FormPreviewSheet> createState() => _FormPreviewSheetState();
}

class _FormPreviewSheetState extends State<_FormPreviewSheet> {
  List<Map<String, dynamic>> _soal = [];
  bool _isLoading = true;
  bool _isCopying = false;

  // Form milik sendiri (target copy) — Creator only
  List<Map<String, dynamic>> _myForms = [];
  bool _isLoadingMyForms = false;

  @override
  void initState() {
    super.initState();
    _loadSoal();
  }

  Future<void> _loadSoal() async {
    final slug = widget.form['slug'] as String? ?? '';
    if (slug.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }
    final result = await FormService.getFormBySlug(slug);
    if (!mounted) return;
    if (result['success'] == true) {
      final data = result['data']?['data'];
      final rawSoal = data is Map && data['soal'] is List
          ? data['soal'] as List
          : [];
      final flat = rawSoal.expand<dynamic>((pg) {
        if (pg is Map && pg['soal'] is List) return pg['soal'] as List;
        return [pg];
      }).toList();
      setState(() {
        _soal = flat.whereType<Map>().map((s) {
          return {
            'question': s['question']?.toString() ?? '',
            'type': s['type']?.toString() ?? 'text',
            'options': s['options'] ?? [],
          };
        }).toList();
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMyForms() async {
    setState(() => _isLoadingMyForms = true);
    final result = await FormService.getUserForms();
    if (!mounted) return;
    if (result['success'] == true) {
      final inner = (result['data'] as Map?)?['data'];
      final rawForms = inner is Map
          ? (inner['forms'] ?? inner['form'] ?? [])
          : [];
      final forms = (rawForms as List)
          .whereType<Map>()
          .where((f) =>
              (f['access_type'] ?? '').toString().toUpperCase() == 'CREATOR')
          .map((f) => {
                'title': f['form_title'] ?? f['title'] ?? 'Untitled',
                'slug': f['form_slug'] ?? f['slug'] ?? '',
              })
          .toList();
      setState(() {
        _myForms = List<Map<String, dynamic>>.from(forms);
        _isLoadingMyForms = false;
      });
    } else {
      setState(() => _isLoadingMyForms = false);
    }
  }

  Future<void> _copySoal(String targetSlug) async {
    if (_soal.isEmpty || targetSlug.isEmpty) return;
    setState(() => _isCopying = true);

    // Build payload sesuai backend contract POST /form/soal
    final payload = _soal.map((s) {
      final type = s['type'] as String? ?? 'text';
      final hasOpts = ['radio', 'checkbox'].contains(type);
      return {
        'soal': {
          'question': s['question'],
          'type': type,
          'page': 1,
          'score': null,
        },
        'options': hasOpts
            ? (s['options'] as List? ?? [])
                .whereType<Map>()
                .map((o) => {
                      'value': o['value'] ?? o['option_value'] ?? '',
                      'is_correct': false, // tidak copy jawaban benar (Web FE behavior)
                    })
                .toList()
            : [],
      };
    }).toList();

    final result = await FormService.createQuestions(
      formSlug: targetSlug,
      questions: payload,
    );
    if (!mounted) return;
    setState(() => _isCopying = false);
    if (result['success'] == true) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Soal berhasil disalin ke form Anda.'),
        backgroundColor: AppColors.success,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? 'Gagal menyalin soal.'),
        backgroundColor: AppColors.error,
      ));
    }
  }

  void _showCopyDialog() async {
    await _loadMyForms();
    if (!mounted) return;
    if (_myForms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text(
            'Tidak ada form milik Anda. Buat form terlebih dahulu.'),
        backgroundColor: AppColors.warning,
      ));
      return;
    }
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Salin ke Form Saya',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              'Pilih form tujuan (${_soal.length} soal akan disalin):',
              style: const TextStyle(
                  fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ..._myForms.map((f) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.description_outlined,
                        size: 20, color: AppColors.primary),
                  ),
                  title: Text(
                    f['title'] as String,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary),
                  ),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _copySoal(f['slug'] as String);
                  },
                )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.form['title'] as String? ?? '';
    final category = widget.form['category'] as String? ?? '';
    final slug = widget.form['slug'] as String? ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (category.isNotEmpty)
              Text(
                category,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary),
              ),
          ],
        ),
        actions: [
          if (slug.isNotEmpty)
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => FormViewerScreen(slug: slug)),
              ),
              child: const Text('Isi Form',
                  style: TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _soal.isEmpty
              ? _buildEmpty()
              : Column(
                  children: [
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        itemCount: _soal.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                        itemBuilder: (ctx, i) {
                          final q = _soal[i];
                          final type = q['type'] as String? ?? 'text';
                          final opts =
                              (q['options'] as List? ?? []).cast<Map>();
                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 6,
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
                                      width: 26,
                                      height: 26,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: AppColors.primary
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '${i + 1}',
                                        style: const TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 7, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.background,
                                        borderRadius:
                                            BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        type.toUpperCase(),
                                        style: const TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  (q['question'] as String? ?? '')
                                      .replaceAll(
                                          RegExp(r'<[^>]*>'), '')
                                      .trim(),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                if (opts.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  ...opts.map((o) => Padding(
                                        padding: const EdgeInsets.only(
                                            top: 4),
                                        child: Row(
                                          children: [
                                            const Icon(
                                                Icons
                                                    .radio_button_unchecked,
                                                size: 14,
                                                color:
                                                    AppColors.textHint),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                o['value']?.toString() ??
                                                    '',
                                                style: const TextStyle(
                                                    fontSize: 13,
                                                    color: AppColors
                                                        .textSecondary),
                                              ),
                                            ),
                                          ],
                                        ),
                                      )),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    // Copy soal bar
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      color: Colors.white,
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed:
                              (_isCopying || _isLoadingMyForms)
                                  ? null
                                  : _showCopyDialog,
                          icon: _isCopying
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white))
                              : const Icon(Icons.copy_all, size: 18),
                          label: Text(_isCopying
                              ? 'Menyalin...'
                              : 'Salin ${_soal.length} Soal ke Form Saya'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                                vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.quiz_outlined,
              size: 56, color: AppColors.textSecondary),
          SizedBox(height: 12),
          Text('Tidak ada soal',
              style: TextStyle(
                  fontSize: 15, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
