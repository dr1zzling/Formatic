import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:xml/xml.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';

class ImportWordScreen extends StatefulWidget {
  final String formSlug;
  final String formTitle;

  const ImportWordScreen({
    super.key,
    required this.formSlug,
    required this.formTitle,
  });

  @override
  State<ImportWordScreen> createState() => _ImportWordScreenState();
}

class _ImportWordScreenState extends State<ImportWordScreen> {
  bool _isLoading = false;
  String? _errorMessage;

  String? _fileName;
  Uint8List? _fileBytes;
  int _fileSize = 0;

  Future<void> _pickFile() async {
    setState(() {
      _errorMessage = null;
    });

    List<PlatformFile> files;
    try {
      files = await FilePickerPlatform.instance.pickFiles(
        dialogTitle: 'Pilih file .docx',
        type: FileType.custom,
        allowedExtensions: ['docx'],
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Gagal membuka file picker: ${e.toString()}';
      });
      return;
    }

    if (files.isEmpty) {
      return;
    }

    final file = files.first;

    Uint8List bytes;
    try {
      bytes = await file.xFile.readAsBytes();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Gagal membaca file: ${e.toString()}';
      });
      return;
    }

    if (!mounted) return;

    // A .docx is a ZIP container, always starts with "PK".
    if (bytes.length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4B) {
      setState(() {
        _fileName = null;
        _fileBytes = null;
        _fileSize = 0;
        _errorMessage =
            'File yang dipilih bukan file .docx yang valid. Silakan pilih ulang.';
      });
      return;
    }

    setState(() {
      _fileName = _displayNameFor(file);
      _fileBytes = bytes;
      _fileSize = bytes.length;
      _errorMessage = null;
    });
  }

  String _displayNameFor(PlatformFile file) {
    final name = file.name.trim();
    if (name.isNotEmpty) return name;
    final path = file.path;
    if (path != null && path.isNotEmpty) {
      final segments = path.replaceAll('\\', '/').split('/');
      if (segments.isNotEmpty && segments.last.isNotEmpty) {
        return segments.last;
      }
    }
    return 'soal_import.docx';
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  Future<void> _import() async {
    final fileBytes = _fileBytes;
    final fileName = _fileName;
    if (fileBytes == null || fileName == null) {
      setState(() {
        _errorMessage = 'Pilih file .docx terlebih dahulu. ${_formatTemplateHint()}';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await FormService.importQuestions(
      formSlug: widget.formSlug,
      fileBytes: fileBytes,
      filename: fileName,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result['success']) {
      final data = result['data'] is Map ? result['data']['data'] : null;
      final listSoal = data is Map && data['list_soal'] is List
          ? data['list_soal'] as List
          : <dynamic>[];
      final count = listSoal.length;
      await _showSuccessDialog(count);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _errorMessage =
            result['message'] ?? 'Gagal mengimpor soal. ${_formatTemplateHint()}';
      });
    }
  }

  Future<void> _showSuccessDialog(int count) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle_outline, color: AppColors.success),
            SizedBox(width: 12),
            Text('Import Berhasil'),
          ],
        ),
        content: Text(
          'Berhasil mengimpor $count soal dari file $_fileName ke form "${widget.formTitle}".',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(
              'OK',
              style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTemplateHint() {
    return 'Pastikan format mengikuti template_import.docx yang tersedia di repositori.';
  }

  Future<void> _showTemplateFormat() async {
    // Try to render the real content of the bundled template_import.docx.
    String? preview;
    try {
      final data = await rootBundle.load('template_import.docx');
      preview = _docxParagraphText(data.buffer
          .asUint8List(data.offsetInBytes, data.lengthInBytes));
    } catch (_) {
      preview = null;
    }

    if (!mounted) return;

    if (preview != null) {
      await showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.description_outlined, color: AppColors.primary),
              SizedBox(width: 12),
              Text('Contoh Format (template_import.docx)'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    preview!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      height: 1.6,
                      color: AppColors.textPrimary,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Ini adalah isi file template resmi (template_import.docx). '
                  'Buat file .docx Anda mengikuti pola yang sama: setiap soal '
                  'diawali nomor, pilihan jawaban dilengkapi Kunci dan Tipe.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Tutup',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      );
    } else {
      _showTemplateInstructions();
    }
  }

  void _showTemplateInstructions() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.description_outlined, color: AppColors.primary),
            SizedBox(width: 12),
            Text('Format Template DOCX'),
          ],
        ),
        content: const SingleChildScrollView(
          child: Text(
            'File template (template_import.docx) tersedia di folder apps/mobile.\n\n'
            'Format soal di dalam file .docx harus mengikuti urutan berikut (satu soal per blok):\n\n'
            '1. Pertanyaan soal...\n'
            'A. Pilihan pertama\n'
            'B. Pilihan kedua\n'
            'C. Pilihan ketiga\n'
            'Kunci: A\n'
            'Tipe: radio\n\n'
            'Keterangan:\n'
            '• Nomor soal diawali angka, contoh "1." atau "1)"\n'
            '• Pilihan jawaban diawali huruf A/B/C, contoh "A." atau "A)"\n'
            '• "Kunci:" atau "Jawaban:" diisi huruf pilihan benar (A/B/C). '
            'Lebih dari satu huruf (misal "A,C") otomatis menjadi tipe checkbox.\n'
            '• "Tipe:" (opsional) berisi radio, checkbox, text, atau file. '
            'Tanpa baris tipe, soal otomatis radio/checkbox bila ada pilihan, '
            'atau text bila tanpa pilihan.\n\n'
            'Catatan: tipe "rating" tidak didukung oleh database backend saat ini.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Tutup'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasFile = _fileBytes != null && _fileName != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
        title: const Text(
          'Import Word',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.formTitle,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Impor soal dari file .docx ke form ini',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // File picker
            GestureDetector(
              onTap: _isLoading ? null : _pickFile,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: hasFile ? AppColors.success.withValues(alpha: 0.05) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: hasFile ? AppColors.success : AppColors.inputBorder,
                    width: hasFile ? 2 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      hasFile ? Icons.insert_drive_file : Icons.upload_file,
                      size: 48,
                      color: hasFile ? AppColors.success : AppColors.textSecondary,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      hasFile ? _fileName! : 'Tap to choose .docx file',
                      style: TextStyle(
                        fontSize: 15,
                        color: hasFile ? AppColors.textPrimary : AppColors.textSecondary,
                        fontWeight: hasFile ? FontWeight.w700 : FontWeight.normal,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      hasFile
                          ? '${_formatSize(_fileSize)} · siap diimpor (ketuk untuk ganti)'
                          : 'Hanya menerima file .docx',
                      style: TextStyle(
                        fontSize: 12,
                        color: hasFile ? AppColors.success : AppColors.textHint,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            TextButton.icon(
              onPressed: _showTemplateFormat,
              icon: const Icon(Icons.help_outline, color: AppColors.primary),
              label: const Text(
                'Lihat format template',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(fontSize: 13, color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Import button
            ElevatedButton(
              onPressed: (hasFile && !_isLoading) ? _import : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.textHint.withValues(alpha: 0.4),
                disabledForegroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      hasFile ? 'Import Soal' : 'Pilih file terlebih dahulu',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------
  // Minimal .docx text reader (ZIP + raw DEFLATE + WordprocessingML).
  // Only used to preview the bundled template_import.docx.
  // ---------------------------------------------------------------
  String? _docxParagraphText(Uint8List bytes) {
    try {
      final xmlBytes = _zipEntryBytes(bytes, 'word/document.xml');
      if (xmlBytes == null) return null;
      final document = XmlDocument.parse(utf8.decode(xmlBytes, allowMalformed: true));
      return _extractParagraphs(document);
    } catch (_) {
      return null;
    }
  }

  String? _extractParagraphs(XmlDocument document) {
    const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    final paragraphs = <String>[];
    for (final element in document.descendants.whereType<XmlElement>()) {
      if (element.name.local == 'p' && element.name.namespaceUri == ns) {
        final text = element.descendants
            .whereType<XmlElement>()
            .where((e) => e.name.local == 't' && e.name.namespaceUri == ns)
            .map((e) => e.innerText)
            .join()
            .trimRight();
        if (text.trim().isNotEmpty) {
          paragraphs.add(text);
        }
      }
    }
    if (paragraphs.isEmpty) return null;
    return paragraphs.join('\n');
  }

  Uint8List? _zipEntryBytes(Uint8List bytes, String targetName) {
    var offset = 0;
    while (offset + 30 <= bytes.length) {
      if (bytes[offset] != 0x50 || bytes[offset + 1] != 0x4B) {
        offset++;
        continue;
      }
      if (bytes[offset + 2] == 0x03 && bytes[offset + 3] == 0x04) {
        final method = _u16(bytes, offset + 8);
        final compressedSize = _u32(bytes, offset + 18);
        final nameLength = _u16(bytes, offset + 26);
        final extraLength = _u16(bytes, offset + 28);
        final dataStart = offset + 30 + nameLength + extraLength;
        final name = utf8.decode(
          bytes.sublist(offset + 30, offset + 30 + nameLength),
          allowMalformed: true,
        );
        if (name == targetName &&
            dataStart + compressedSize <= bytes.length) {
          final compressed = bytes.sublist(dataStart, dataStart + compressedSize);
          if (method == 8) {
            try {
              return Uint8List.fromList(
                ZLibDecoder(raw: true).convert(compressed),
              );
            } catch (_) {
              return null;
            }
          }
          if (method == 0) return compressed;
          return null;
        }
        offset = dataStart + compressedSize;
        continue;
      }
      // Central directory or end-of-central-directory signatures.
      if (bytes[offset + 2] == 0x01 && bytes[offset + 3] == 0x02) break;
      if (bytes[offset + 2] == 0x05 && bytes[offset + 3] == 0x06) break;
      offset++;
    }
    return null;
  }

  int _u16(Uint8List bytes, int offset) =>
      bytes[offset] | (bytes[offset + 1] << 8);

  int _u32(Uint8List bytes, int offset) =>
      bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24);
}