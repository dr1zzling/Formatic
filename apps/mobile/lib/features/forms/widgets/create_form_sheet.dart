import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';

class CreateFormSheet extends StatefulWidget {
  final void Function(String? slug) onCreated;

  const CreateFormSheet({super.key, required this.onCreated});

  @override
  State<CreateFormSheet> createState() => _CreateFormSheetState();
}

class _CreateFormSheetState extends State<CreateFormSheet> {
  static const _categories = ['Ujian', 'Survei', 'Pengumpulan Data'];

  final _titleController = TextEditingController();
  final _tokenController = TextEditingController();
  String _category = 'Ujian';
  bool _loading = false;
  String _error = '';
  XFile? _bannerFile;

  @override
  void dispose() {
    _titleController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _pickBanner() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null && mounted) {
      setState(() => _bannerFile = picked);
    }
  }

  Future<void> _create() async {
    if (_titleController.text.trim().isEmpty) {
      setState(() => _error = 'Judul form wajib diisi.');
      return;
    }
    if (_bannerFile == null) {
      setState(() => _error = 'Banner image wajib diunggah.');
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });

    Uint8List bannerBytes;
    try {
      bannerBytes = await _bannerFile!.readAsBytes();
    } catch (_) {
      setState(() {
        _loading = false;
        _error = 'Gagal membaca banner. Silakan pilih ulang.';
      });
      return;
    }

    final result = await FormService.createForm(
      title: _titleController.text.trim(),
      category: _category,
      bannerBytes: bannerBytes,
      tokenRespon: _tokenController.text.trim(),
    );

    if (!mounted) return;

    setState(() => _loading = false);

    if (result['success']) {
      final data = result['data'] is Map ? result['data']['data'] : null;
      final form = data is Map && data['form'] is Map ? data['form'] : data;
      final slug = form is Map ? (form['form_slug'] ?? form['slug']) : null;
      widget.onCreated(slug is String ? slug : null);
    } else {
      setState(() => _error = result['message'] ?? 'Gagal membuat form.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Buat Form Baru',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: const Icon(Icons.close, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_error.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Text(
                  _error,
                  style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626)),
                ),
              ),
            _label('JUDUL FORM'),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              onChanged: (_) => setState(() => _error = ''),
              decoration: _inputDecoration('Masukkan judul form...'),
            ),
            const SizedBox(height: 16),
            _label('KATEGORI'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: _inputDecoration(null),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => _category = v ?? 'Ujian'),
            ),
            const SizedBox(height: 16),
            _label('TOKEN RESPON (OPSIONAL)'),
            const SizedBox(height: 8),
            TextField(
              controller: _tokenController,
              onChanged: (_) => setState(() => _error = ''),
              decoration: _inputDecoration('Masukkan token respon (opsional)'),
            ),
            const SizedBox(height: 16),
            _label('BANNER IMAGE'),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickBanner,
              child: Container(
                width: double.infinity,
                height: 100,
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFE5E7EB),
                    style: BorderStyle.solid,
                  ),
                ),
                child: _bannerFile != null
                    ? Align(
                        alignment: Alignment.topRight,
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: GestureDetector(
                            onTap: () => setState(() => _bannerFile = null),
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.5),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('🖼️', style: TextStyle(fontSize: 24)),
                          SizedBox(height: 4),
                          Text(
                            'Klik untuk upload banner',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                          Text(
                            'JPG, PNG, WEBP · Maks 5MB',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFFB0B7C3),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: const Center(
                        child: Text(
                          'Batal',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: _loading ? null : _create,
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Buat Form',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: Color(0xFF6B7280),
        letterSpacing: 0.6,
      ),
    );
  }

  InputDecoration _inputDecoration(String? hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primaryLight),
      ),
    );
  }
}
