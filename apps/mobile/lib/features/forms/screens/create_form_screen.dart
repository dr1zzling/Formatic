import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../widgets/app_logo.dart';

class CreateFormScreen extends StatefulWidget {
  const CreateFormScreen({super.key});

  @override
  State<CreateFormScreen> createState() => _CreateFormScreenState();
}

class _CreateFormScreenState extends State<CreateFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _tokenController = TextEditingController();
  final _durationController = TextEditingController();

  // Kategori dari backend API
  List<Map<String, dynamic>> _primaryCategories = [];
  List<Map<String, dynamic>> _subCategories = [];
  int? _selectedPrimaryId;
  int? _selectedSubId;
  bool _isLoadingCategories = true;
  String _categoriesError = '';

  Uint8List? _bannerBytes;
  bool _isLoading = false;
  String? _selectedThemeColor;
  final ImagePicker _picker = ImagePicker();

  static const List<Map<String, dynamic>> _presetColors = [
    {'hex': '#3B82F6', 'label': 'Biru'},
    {'hex': '#EF4444', 'label': 'Merah'},
    {'hex': '#10B981', 'label': 'Hijau'},
    {'hex': '#8B5CF6', 'label': 'Ungu'},
    {'hex': '#F59E0B', 'label': 'Kuning'},
    {'hex': '#EC4899', 'label': 'Pink'},
    {'hex': '#06B6D4', 'label': 'Cyan'},
    {'hex': '#6366F1', 'label': 'Indigo'},
    {'hex': '#64748B', 'label': 'Abu'},
    {'hex': '#0D9488', 'label': 'Teal'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _tokenController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoadingCategories = true;
      _categoriesError = '';
    });
    final result = await FormService.getPrimaryCategories();
    if (!mounted) return;
    if (result['success'] == true) {
      final list = result['data'] as List;
      final categories = list
          .whereType<Map>()
          .map((e) => {'id': e['id'] as int, 'name': e['name']?.toString() ?? ''})
          .toList();
      setState(() {
        _primaryCategories = categories;
        if (categories.isNotEmpty) {
          _selectedPrimaryId = categories.first['id'] as int;
        }
        _categoriesError = '';
        _isLoadingCategories = false;
      });
      if (_selectedPrimaryId != null) {
        await _loadSubCategories(_selectedPrimaryId!);
      }
    } else {
      setState(() {
        _primaryCategories = [];
        _selectedPrimaryId = null;
        _categoriesError =
            result['message']?.toString() ?? 'Gagal memuat kategori';
        _isLoadingCategories = false;
      });
    }
  }

  Future<void> _loadSubCategories(int primaryId) async {
    final result = await FormService.getSubCategories(primaryId);
    if (!mounted) return;
    if (result['success'] == true) {
      final list = result['data'] as List;
      final subs = list
          .whereType<Map>()
          .map((e) => {'id': e['id'] as int, 'name': e['name']?.toString() ?? ''})
          .toList();
      setState(() {
        _subCategories = subs;
        _selectedSubId = subs.isNotEmpty ? subs.first['id'] as int : null;
        _categoriesError = '';
      });
    } else {
      setState(() {
        _subCategories = [];
        _selectedSubId = null;
        _categoriesError =
            result['message']?.toString() ?? 'Gagal memuat sub-kategori';
      });
    }
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (image != null) {
      final bytes = await image.readAsBytes();
      setState(() => _bannerBytes = bytes);
    }
  }

  Future<void> _handleCreateForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_bannerBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Banner image wajib diunggah'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    if (_selectedSubId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Pilih kategori terlebih dahulu'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isLoading = true);

    final titleText = _titleController.text.trim();
    final tokenText = _tokenController.text.trim();
    final durationVal = _durationController.text.trim().isEmpty
        ? null
        : int.tryParse(_durationController.text.trim());

    final result = await FormService.createForm(
      title: titleText,
      bannerBytes: _bannerBytes!,
      subKategoriId: _selectedSubId,
      tokenRespon: tokenText,
      duration: durationVal,
      themeColor: _selectedThemeColor,
    );

    if (!mounted) return;

    if (!result['success']) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? 'Gagal membuat form'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    final data = result['data'] is Map ? result['data']['data'] : null;
    final form = data is Map && data['form'] is Map
        ? data['form'] as Map
        : (data is Map ? data : null);
    final slug = form != null
        ? (form['form_slug'] ?? form['slug'])?.toString()
        : null;

    bool themeColorSaved = true;
    if (_selectedThemeColor != null && slug != null && slug.isNotEmpty) {
      final settingResult = await FormService.updateFormSetting(
        slug: slug,
        tokenRespon: tokenText.isEmpty ? null : tokenText,
        durationMinutes: durationVal,
        startAtMillis: null,
        isRandom: false,
        themeColor: _selectedThemeColor,
      );
      themeColorSaved = settingResult['success'] == true;
    }

    setState(() => _isLoading = false);
    if (!mounted) return;

    if (!themeColorSaved) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text(
          'Form berhasil dibuat. Warna tema tidak tersimpan — atur kembali di Form Settings.',
        ),
        backgroundColor: AppColors.warning,
        duration: Duration(seconds: 4),
      ));
    }

    Navigator.of(context).pop({
      'success': true,
      'message': 'Form berhasil dibuat',
      'slug': slug,
      'form_id': form != null ? (form['form_id'] ?? form['id']) : null,
      'form_title': form != null ? (form['form_title'] ?? form['title']) : null,
      'form_status': form != null ? (form['form_status'] ?? form['status']) : null,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppLogo(),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Buat Form Baru',
                          style: Theme.of(context).textTheme.displayMedium
                              ?.copyWith(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Isi detail form untuk mulai mengumpulkan data.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 32),

                        // ── Judul ───────────────────────────────────────────
                        Text('JUDUL FORM', style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _titleController,
                          decoration: InputDecoration(
                            hintText: 'Contoh: Kuesioner Kepuasan Siswa',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.inputBorder),
                            ),
                          ),
                          validator: (v) =>
                              (v == null || v.isEmpty) ? 'Judul wajib diisi' : null,
                        ),
                        const SizedBox(height: 24),

                        // ── Kategori dari API ───────────────────────────────
                        Text('KATEGORI', style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 8),
                        if (_isLoadingCategories)
                          const SizedBox(
                            height: 48,
                            child: Center(
                              child: CircularProgressIndicator(
                                color: AppColors.primary,
                                strokeWidth: 2,
                              ),
                            ),
                          )
                        else if (_primaryCategories.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.warning_amber,
                                      color: AppColors.error,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    const Expanded(
                                      child: Text(
                                        'Gagal memuat kategori',
                                        style: TextStyle(
                                          color: AppColors.error,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (_categoriesError.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    _categoriesError,
                                    style: const TextStyle(
                                      color: AppColors.error,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: GestureDetector(
                                    onTap: _loadCategories,
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.refresh,
                                          color: AppColors.error,
                                          size: 14,
                                        ),
                                        SizedBox(width: 4),
                                        Text(
                                          'Coba Lagi',
                                          style: TextStyle(
                                            color: AppColors.error,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else ...[
                          // Primary kategori
                          DropdownButtonFormField<int>(
                            value: _selectedPrimaryId,
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.inputBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppColors.inputBorder),
                              ),
                            ),
                            items: _primaryCategories.map((cat) {
                              return DropdownMenuItem<int>(
                                value: cat['id'] as int,
                                child: Text(cat['name'] as String),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val == null) return;
                              setState(() => _selectedPrimaryId = val);
                              _loadSubCategories(val);
                            },
                          ),
                          if (_subCategories.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            DropdownButtonFormField<int>(
                              value: _selectedSubId,
                              decoration: InputDecoration(
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.inputBorder),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.inputBorder),
                                ),
                              ),
                              items: _subCategories.map((sub) {
                                return DropdownMenuItem<int>(
                                  value: sub['id'] as int,
                                  child: Text(sub['name'] as String),
                                );
                              }).toList(),
                              onChanged: (val) => setState(() => _selectedSubId = val),
                            ),
                          ],
                        ],
                        const SizedBox(height: 24),

                        // ── Durasi ─────────────────────────────────────────
                        Text(
                          'DURASI (OPSIONAL)',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _durationController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: 'Contoh: 60',
                            suffixText: 'menit',
                            helperText: 'Kosongkan jika tidak ada batas waktu',
                            helperStyle: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textHint,
                            ),
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
                              borderSide: const BorderSide(
                                color: AppColors.primary,
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (v) {
                            if (v != null && v.trim().isNotEmpty) {
                              final d = int.tryParse(v.trim());
                              if (d == null) return 'Masukkan angka yang valid';
                              if (d < 1) return 'Minimal 1 menit';
                              if (d > 1440) return 'Maksimal 1440 menit (24 jam)';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),

                        // ── Token respon ───────────────────────────────────
                        Text(
                          'TOKEN RESPON (OPSIONAL)',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _tokenController,
                          decoration: InputDecoration(
                            hintText: 'Contoh: TOKEN123',
                            helperText: 'Kosongkan jika form terbuka untuk umum',
                            helperStyle: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textHint,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.inputBorder),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Warna tema ─────────────────────────────────────
                        Text(
                          'WARNA TEMA (OPSIONAL)',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: _presetColors.map((color) {
                            final hex = color['hex'] as String;
                            final isSelected = _selectedThemeColor == hex;
                            final colorVal = Color(
                              int.parse(hex.replaceFirst('#', '0xFF')),
                            );
                            return GestureDetector(
                              onTap: () => setState(() {
                                _selectedThemeColor = isSelected ? null : hex;
                              }),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: colorVal,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.transparent,
                                    width: 3,
                                  ),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: colorVal.withOpacity(0.6),
                                            blurRadius: 8,
                                            spreadRadius: 1,
                                          ),
                                        ]
                                      : [],
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check,
                                        color: Colors.white, size: 18)
                                    : null,
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),

                        // ── Banner ─────────────────────────────────────────
                        Text(
                          'BANNER FORM',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            height: 120,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.inputBorder),
                              image: _bannerBytes != null
                                  ? DecorationImage(
                                      image: MemoryImage(_bannerBytes!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: _bannerBytes == null
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        Icons.cloud_upload_outlined,
                                        size: 40,
                                        color: AppColors.textSecondary,
                                      ),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'Tap untuk upload banner',
                                        style: TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'JPG, PNG, WEBP (Maks 5MB)',
                                        style: TextStyle(
                                          color: AppColors.textHint,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  )
                                : Align(
                                    alignment: Alignment.topRight,
                                    child: GestureDetector(
                                      onTap: () =>
                                          setState(() => _bannerBytes = null),
                                      child: Container(
                                        margin: const EdgeInsets.all(8),
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Colors.black54,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.close,
                                          color: Colors.white,
                                          size: 16,
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // ── Tombol ─────────────────────────────────────────
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: (_isLoading || _isLoadingCategories)
                                ? null
                                : _handleCreateForm,
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : const Text('Buat Form'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton(
                            onPressed: () => Navigator.of(context).pop(),
                            child: const Text(
                              'Batal',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
