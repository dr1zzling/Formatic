import 'dart:convert';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/config/api_config.dart';
import '../widgets/form_audio_player.dart';

class AddQuestionScreen extends StatefulWidget {
  final String? formSlug;
  final String formTitle;
  final Map<String, dynamic>? questionToEdit;
  final int initialPage;

  const AddQuestionScreen({
    super.key,
    this.formSlug,
    required this.formTitle,
    this.questionToEdit,
    this.initialPage = 1,
  });

  @override
  State<AddQuestionScreen> createState() => _AddQuestionScreenState();
}

class _AddQuestionScreenState extends State<AddQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  late QuillController _quillController;
  final List<QuillController> _optionQuillControllers = [];
  final List<FocusNode> _optionFocusNodes = [];
  int _focusedOptionIndex = 0;

  String _selectedType = 'radio';
  int? _correctOptionIndex;
  bool _isLoading = false;
  bool _isEditing = false;
  bool _isRequired = false;
  int _selectedPage = 1;

  // Image upload state
  Uint8List? _selectedImageBytes;
  String? _selectedImageName;
  String? _existingImageUrl;

  // Audio upload state
  Uint8List? _selectedAudioBytes;
  String? _selectedAudioName;
  String? _selectedAudioPath;
  String? _existingAudioUrl;

  // Validation flag — track if question was ever submitted empty
  bool _questionEmpty = false;
  // Score per soal (null = tidak diset, 0 = 0 poin)
  double? _score;
  // Controller untuk input skor — diinisialisasi di initState, dispose di dispose()
  late final TextEditingController _scoreController;

  final List<Map<String, dynamic>> _questionTypes = [
    {'value': 'radio',    'label': 'Single Choice',  'icon': Icons.radio_button_checked},
    {'value': 'checkbox', 'label': 'Multiple Choice', 'icon': Icons.check_box},
    {'value': 'text',     'label': 'Text Input',      'icon': Icons.text_fields},
    {'value': 'file',     'label': 'File Upload',     'icon': Icons.upload_file},
  ];

  @override
  void initState() {
    super.initState();
    _isEditing = widget.questionToEdit != null;
    _quillController = QuillController.basic();
    _selectedPage = widget.initialPage;
    _scoreController = TextEditingController();

    if (_isEditing) {
      _loadExistingQuestion();
    } else {
      _addOption();
      _addOption();
    }

    // Listen for changes to reset validation state
    _quillController.addListener(() {
      if (_questionEmpty && !_isQuestionEmpty()) {
        setState(() => _questionEmpty = false);
      }
    });
  }

  void _loadExistingQuestion() {
    final question = widget.questionToEdit!;
    _selectedType = question['type']?.toString() ?? 'radio';

    // Load question text — may be plain text or legacy HTML
    final raw = question['question']?.toString() ?? '';
    if (raw.isNotEmpty) {
      // Try to load as Quill Delta JSON first, then fall back to plain text
      try {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          final doc = Document.fromJson(decoded);
          _quillController = QuillController(
            document: doc,
            selection: const TextSelection.collapsed(offset: 0),
          );
        } else {
          _setPlainText(_stripHtml(raw));
        }
      } catch (_) {
        _setPlainText(_stripHtml(raw));
      }
    }

    // Listen for changes
    _quillController.addListener(() {
      if (_questionEmpty && !_isQuestionEmpty()) {
        setState(() => _questionEmpty = false);
      }
    });

    // Parse existing image URL
    final imageUrl = question['image']?.toString();
    if (imageUrl != null && imageUrl.isNotEmpty) {
      _existingImageUrl = imageUrl;
    }

    // Parse existing audio URL (backend contract: `soal.audio`)
    final audioUrl = question['audio']?.toString();
    if (audioUrl != null && audioUrl.isNotEmpty) {
      _existingAudioUrl = audioUrl;
    }

    // Parse is_required (boolean)
    final rawRequired = question['is_required'];
    _isRequired = rawRequired == true ||
        rawRequired == 1 ||
        rawRequired?.toString() == 'true' ||
        rawRequired?.toString() == '1';

    // Parse score — kolom DECIMAL(10,2) nullable di backend
    final rawScore = question['score'];
    if (rawScore != null) {
      _score = rawScore is num
          ? rawScore.toDouble()
          : double.tryParse(rawScore.toString());
      if (_score != null) {
        _scoreController.text = _score! % 1 == 0
            ? _score!.toInt().toString()
            : _score!.toString();
      }
    }

    // Parse page
    _selectedPage = question['page'] is num
        ? (question['page'] as num).toInt()
        : widget.initialPage;

    final options = question['options'] as List? ?? [];
    for (final option in options) {
      if (option is Map) {
        final controller = _quillFromRaw(option['value']?.toString() ?? '');
        _optionQuillControllers.add(controller);
        _optionFocusNodes.add(_createOptionFocusNode(_optionQuillControllers.length - 1));
        if (option['is_correct'] == true ||
            option['is_correct'] == 1 ||
            option['is_correct'] == '1' ||
            option['is_correct'] == 'true') {
          _correctOptionIndex = _optionQuillControllers.length - 1;
        }
      }
    }
    if (_optionQuillControllers.isEmpty) {
      _addOption();
      _addOption();
    }
  }

  /// Build QuillController dari nilai opsi lama (plain text / HTML) atau
  /// baru (Quill Delta JSON), agar data lama tetap terbaca.
  QuillController _quillFromRaw(String raw) {
    final trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        final decoded = jsonDecode(trimmed);
        if (decoded is List) {
          final doc = Document.fromJson(decoded);
          return QuillController(
            document: doc,
            selection: const TextSelection.collapsed(offset: 0),
          );
        }
      } catch (_) {
        // Bukan Delta valid — lanjut ke plain text
      }
    }
    final doc = Document()..insert(0, _stripHtml(trimmed));
    return QuillController(
      document: doc,
      selection: const TextSelection.collapsed(offset: 0),
    );
  }

  FocusNode _createOptionFocusNode(int index) {
    final node = FocusNode();
    node.addListener(() {
      if (!mounted) return;
      if (node.hasFocus && _focusedOptionIndex != index) {
        setState(() => _focusedOptionIndex = index);
      }
    });
    return node;
  }

  /// Get option content as Quill Delta JSON string
  String _getOptionJson(QuillController controller) {
    final delta = controller.document.toDelta();
    return jsonEncode(delta.toJson());
  }

  bool _isOptionEmpty(QuillController controller) {
    final text = controller.document.toPlainText().trim();
    return text.isEmpty;
  }

  void _setPlainText(String text) {
    final doc = Document()..insert(0, text);
    _quillController = QuillController(
      document: doc,
      selection: const TextSelection.collapsed(offset: 0),
    );
  }

  bool _isQuestionEmpty() {
    final text = _quillController.document.toPlainText().trim();
    return text.isEmpty || text == '\n';
  }

  /// Get question content as Quill Delta JSON string
  String _getQuestionJson() {
    final delta = _quillController.document.toDelta();
    return jsonEncode(delta.toJson());
  }

  /// Strip HTML tags — for legacy soal that stored HTML strings
  String _stripHtml(String html) {
    return html
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .trim();
  }

  @override
  void dispose() {
    _quillController.dispose();
    _scoreController.dispose();
    for (var c in _optionQuillControllers) {
      c.dispose();
    }
    for (var f in _optionFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    setState(() {
      _optionQuillControllers.add(QuillController.basic());
      _optionFocusNodes.add(
        _createOptionFocusNode(_optionQuillControllers.length - 1),
      );
      _focusedOptionIndex = _optionQuillControllers.length - 1;
    });
  }

  void _removeOption(int index) {
    if (_optionQuillControllers.length > 1) {
      setState(() {
        _optionQuillControllers[index].dispose();
        _optionFocusNodes[index].dispose();
        _optionQuillControllers.removeAt(index);
        _optionFocusNodes.removeAt(index);
        if (_focusedOptionIndex >= _optionQuillControllers.length) {
          _focusedOptionIndex = _optionQuillControllers.length - 1;
        }
        if (_correctOptionIndex == index) {
          _correctOptionIndex = null;
        } else if (_correctOptionIndex != null && _correctOptionIndex! > index) {
          _correctOptionIndex = _correctOptionIndex! - 1;
        }
      });
    }
  }

  bool _needsOptions() => ['radio', 'checkbox', 'rating'].contains(_selectedType);

  Future<void> _pickImage() async {
    try {
      final result = await FilePickerPlatform.instance.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      );
      if (result.isEmpty) return;
      final file = result.first;
      final ext = (file.extension ?? '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Format tidak valid. Pilih JPG, PNG, atau WEBP.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }
      final bytes = await file.xFile.readAsBytes();
      if (bytes.isEmpty) return;
      if (bytes.lengthInBytes > 5 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gambar terlalu besar. Maksimal 5MB.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }
      setState(() {
        _selectedImageBytes = bytes;
        _selectedImageName = file.name;
        _existingImageUrl = null;
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal memilih gambar. Coba lagi.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _removeImage() {
    setState(() {
      _selectedImageBytes = null;
      _selectedImageName = null;
      _existingImageUrl = null;
    });
  }

  static const List<String> _audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

  Future<void> _pickAudio() async {
    try {
      final result = await FilePickerPlatform.instance.pickFiles(
        type: FileType.custom,
        allowedExtensions: _audioExtensions,
      );
      if (result.isEmpty) return;
      final file = result.first;
      final ext = (file.extension ?? '').toLowerCase();
      if (!_audioExtensions.contains(ext)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Format audio tidak didukung. Gunakan MP3, WAV, OGG, M4A, atau AAC.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }
      final bytes = await file.xFile.readAsBytes();
      if (bytes.isEmpty) return;
      if (mounted) {
        setState(() {
          _selectedAudioBytes = bytes;
          _selectedAudioName = file.name;
          _selectedAudioPath = (file.path != null && file.path!.isNotEmpty)
              ? file.path
              : null;
          _existingAudioUrl = null;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal memilih audio. Coba lagi.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _removeAudio() {
    setState(() {
      _selectedAudioBytes = null;
      _selectedAudioName = null;
      _selectedAudioPath = null;
      _existingAudioUrl = null;
    });
  }

  Future<void> _saveQuestion() async {
    if (_isQuestionEmpty()) {
      setState(() => _questionEmpty = true);
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    if (widget.formSlug == null || widget.formSlug!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Form slug tidak tersedia'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_needsOptions()) {
      final hasEmpty =
          _optionQuillControllers.any((c) => _isOptionEmpty(c));
      if (hasEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Isi semua opsi terlebih dahulu'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      // Store as Quill Delta JSON — backward compatible, can be rendered or plain-text extracted
      final questionJson = _getQuestionJson();
      final Map<String, dynamic> soalPayload = {
        'question': questionJson,
        'type': _selectedType,
        'is_required': _isRequired,
        'page': _selectedPage,
        // score: null berarti tidak ada skor (nullable, sesuai DB schema)
        'score': _score,
      };

      final List<Map<String, dynamic>> optionValues = _needsOptions()
          ? _optionQuillControllers.asMap().entries.map((e) => {
                'value': _getOptionJson(e.value),
                'is_correct': _correctOptionIndex == e.key,
              }).toList()
          : <Map<String, dynamic>>[];

      final Map<String, dynamic> result;

      if (_isEditing) {
        final soalId = int.tryParse(widget.questionToEdit!['id'].toString());
        if (soalId == null) throw Exception('Invalid soal id');

        final optionsForUpdate = List<Map<String, dynamic>>.from(optionValues);
        final existing = widget.questionToEdit!['options'] as List? ?? [];
        for (var i = 0; i < optionsForUpdate.length; i++) {
          if (i < existing.length && existing[i] is Map) {
            final id = existing[i]['id'];
            if (id != null) optionsForUpdate[i]['id'] = id;
          }
        }

        final removeImage =
            _existingImageUrl != null &&
            _selectedImageBytes == null &&
            _existingImageUrl!.isNotEmpty;

        final removeAudio =
            _existingAudioUrl != null &&
            _selectedAudioBytes == null &&
            _existingAudioUrl!.isNotEmpty;

        // Audio contract (Web FE parity): delete → `audio: null`,
        // keep → `audio: <existing url>`, replace → audio_filename + file
        if (removeAudio) {
          soalPayload['audio'] = null;
        } else if (_existingAudioUrl != null && _selectedAudioBytes == null) {
          soalPayload['audio'] = _existingAudioUrl;
        }

        result = await FormService.updateQuestionWithImage(
          soalId: soalId,
          payload: {'soal': soalPayload, 'options': optionsForUpdate},
          imageBytes: _selectedImageBytes,
          imageName: _selectedImageName,
          removeImage: removeImage,
          audioBytes: _selectedAudioBytes,
          audioName: _selectedAudioName,
          removeAudio: removeAudio,
        );
      } else {
        result = await FormService.createQuestionWithImage(
          formSlug: widget.formSlug!,
          questionData: {'soal': soalPayload, 'options': optionValues},
          imageBytes: _selectedImageBytes,
          imageName: _selectedImageName,
          audioBytes: _selectedAudioBytes,
          audioName: _selectedAudioName,
        );
      }

      setState(() => _isLoading = false);

      if (mounted) {
        if (result['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _isEditing
                    ? 'Soal berhasil diperbarui!'
                    : 'Soal berhasil ditambahkan!',
              ),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Gagal menyimpan soal'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (_) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal menyimpan soal. Coba lagi.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
        title: Text(
          _isEditing ? 'Edit Soal' : 'Tambah Soal',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveQuestion,
            child: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  )
                : const Text(
                    'Simpan',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Breadcrumb ────────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.description_outlined,
                    size: 14,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.formTitle,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Tipe Soal ─────────────────────────────────────────
            _buildSectionLabel('Tipe Soal'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _questionTypes.map((type) {
                final isSelected = _selectedType == type['value'];
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedType = type['value'] as String;
                      if (!_needsOptions()) {
                        for (var c in _optionQuillControllers) c.dispose();
                        for (var f in _optionFocusNodes) f.dispose();
                        _optionQuillControllers.clear();
                        _optionFocusNodes.clear();
                        _correctOptionIndex = null;
                        _focusedOptionIndex = 0;
                      } else if (_optionQuillControllers.isEmpty) {
                        _addOption();
                        _addOption();
                      }
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 11,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.inputBorder,
                        width: isSelected ? 1.5 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.18),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          type['icon'] as IconData,
                          size: 18,
                          color: isSelected
                              ? Colors.white
                              : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          type['label'] as String,
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // ── Halaman ───────────────────────────────────────────
            _buildSectionLabel('Halaman'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.description_outlined,
                      size: 20, color: AppColors.primary),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Halaman penempatan soal',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _selectedPage > 1
                        ? () => setState(() => _selectedPage--)
                        : null,
                    icon: const Icon(Icons.remove_circle_outline,
                        color: AppColors.primary),
                    tooltip: 'Halaman sebelumnya',
                  ),
                  SizedBox(
                    width: 40,
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _selectedPage.toString(),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _selectedPage++),
                    icon: const Icon(Icons.add_circle_outline,
                        color: AppColors.primary),
                    tooltip: 'Halaman berikutnya',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── WYSIWYG Editor ────────────────────────────────────
            _buildSectionLabel('Pertanyaan'),
            const SizedBox(height: 10),

            // Toolbar
            ExcludeSemantics(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: QuillSimpleToolbar(
                  controller: _quillController,
                  config: QuillSimpleToolbarConfig(
                    toolbarIconAlignment: WrapAlignment.start,
                    showDividers: false,
                    showFontFamily: false,
                    showFontSize: false,
                    showBoldButton: true,
                    showItalicButton: true,
                    showUnderLineButton: true,
                    showStrikeThrough: false,
                    showInlineCode: true,
                    showColorButton: false,
                    showBackgroundColorButton: false,
                    showClearFormat: true,
                    showAlignmentButtons: false,
                    showLeftAlignment: false,
                    showCenterAlignment: false,
                    showRightAlignment: false,
                    showJustifyAlignment: false,
                    showHeaderStyle: false,
                    showListNumbers: true,
                    showListBullets: true,
                    showListCheck: false,
                    showCodeBlock: true,
                    showQuote: false,
                    showIndent: false,
                    showLink: false,
                    showUndo: true,
                    showRedo: true,
                    showSearchButton: false,
                    showSubscript: false,
                    showSuperscript: false,
                    iconTheme: QuillIconTheme(
                      iconButtonSelectedData: IconButtonData(
                        color: AppColors.primary,
                      ),
                      iconButtonUnselectedData: IconButtonData(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Editor area
            ExcludeSemantics(
              child: GestureDetector(
                onTap: () => FocusScope.of(context).requestFocus(),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 120),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(12),
                    ),
                    border: Border(
                      left: BorderSide(
                        color: _questionEmpty
                            ? AppColors.error
                            : AppColors.inputBorder,
                      ),
                      right: BorderSide(
                        color: _questionEmpty
                            ? AppColors.error
                            : AppColors.inputBorder,
                      ),
                      bottom: BorderSide(
                        color: _questionEmpty
                            ? AppColors.error
                            : AppColors.inputBorder,
                      ),
                    ),
                  ),
                  child: QuillEditor.basic(
                    controller: _quillController,
                    config: QuillEditorConfig(
                      placeholder: 'Tulis pertanyaan di sini...',
                      padding: const EdgeInsets.all(14),
                      autoFocus: false,
                      expands: false,
                      scrollable: true,
                      minHeight: 120,
                    ),
                  ),
                ),
              ),
            ),

            if (_questionEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 4),
                child: Text(
                  'Pertanyaan tidak boleh kosong',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.error,
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // ── Wajib Diisi Toggle ────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_rounded,
                    size: 20,
                    color: _isRequired ? AppColors.primary : AppColors.textHint,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Wajib diisi',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          'Responden harus menjawab soal ini',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _isRequired,
                    onChanged: (val) => setState(() => _isRequired = val),
                    activeColor: AppColors.primary,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Skor Soal ─────────────────────────────────────────
            _buildSectionLabel('Skor Soal (Opsional)'),
            const SizedBox(height: 10),
            _buildScoreInput(),

            const SizedBox(height: 24),

            // ── Gambar ────────────────────────────────────────────
            _buildSectionLabel('Gambar (Opsional)'),
            const SizedBox(height: 10),
            if (_selectedImageBytes == null && _existingImageUrl == null)
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.add_photo_alternate_outlined,
                        size: 20,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Tambah Gambar',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '(JPG, PNG, WEBP · maks 5MB)',
                        style: TextStyle(
                          color: AppColors.textHint,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              _buildImagePreview(),

            // ── Audio ─────────────────────────────────────────────
            const SizedBox(height: 24),
            _buildSectionLabel('Audio (Opsional)'),
            const SizedBox(height: 10),
            if (_selectedAudioBytes == null && _existingAudioUrl == null)
              GestureDetector(
                onTap: _pickAudio,
                child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.audiotrack_rounded,
                        size: 20,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Tambah Audio',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '(MP3, WAV, OGG, M4A, AAC)',
                        style: TextStyle(
                          color: AppColors.textHint,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              _buildAudioPreview(),

            // ── Opsi Jawaban ──────────────────────────────────────
            if (_needsOptions()) ...[
              const SizedBox(height: 24),
              if (_selectedType == 'rating') ...[
                _buildSectionLabel('Skala Rating'),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Preview: Bintang 1–5',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          5,
                          (_) => const Icon(
                            Icons.star_rounded,
                            color: Colors.amber,
                            size: 34,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(child: _buildSectionLabel('Pilihan Jawaban')),
                    TextButton.icon(
                      onPressed: _addOption,
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('Tambah'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        padding: EdgeInsets.zero,
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 2, bottom: 10),
                  child: Text(
                    'Centang ✓ untuk menandai jawaban benar',
                    style: TextStyle(fontSize: 12, color: AppColors.textHint),
                  ),
                ),
                // ── Toolbar opsi (mengontrol opsi yang sedang aktif) ──
                if (_optionQuillControllers.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: QuillSimpleToolbar(
                      controller: _optionQuillControllers[
                          _focusedOptionIndex.clamp(
                              0, _optionQuillControllers.length - 1)],
                      config: QuillSimpleToolbarConfig(
                        toolbarIconAlignment: WrapAlignment.start,
                        showDividers: false,
                        showFontFamily: false,
                        showFontSize: false,
                        showBoldButton: true,
                        showItalicButton: true,
                        showUnderLineButton: true,
                        showStrikeThrough: false,
                        showInlineCode: true,
                        showColorButton: false,
                        showBackgroundColorButton: false,
                        showClearFormat: true,
                        showAlignmentButtons: false,
                        showHeaderStyle: false,
                        showListNumbers: true,
                        showListBullets: true,
                        showListCheck: false,
                        showCodeBlock: false,
                        showQuote: false,
                        showIndent: false,
                        showLink: false,
                        showUndo: true,
                        showRedo: true,
                        showSearchButton: false,
                        showSubscript: false,
                        showSuperscript: false,
                        iconTheme: QuillIconTheme(
                          iconButtonSelectedData: IconButtonData(
                            color: AppColors.primary,
                          ),
                          iconButtonUnselectedData: IconButtonData(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ..._optionQuillControllers.asMap().entries.map((entry) {
                  final index = entry.key;
                  final controller = entry.value;
                  final focusNode = _optionFocusNodes[index];
                  final isCorrect = _correctOptionIndex == index;
                  final isFocused = _focusedOptionIndex == index;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Correct toggle
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _correctOptionIndex =
                                  isCorrect ? null : index;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: isCorrect
                                  ? AppColors.success
                                  : Colors.white,
                              shape: _selectedType == 'checkbox'
                                  ? BoxShape.rectangle
                                  : BoxShape.circle,
                              borderRadius: _selectedType == 'checkbox'
                                  ? BorderRadius.circular(6)
                                  : null,
                              border: Border.all(
                                color: isCorrect
                                    ? AppColors.success
                                    : AppColors.inputBorder,
                                width: 2,
                              ),
                            ),
                            child: isCorrect
                                ? const Icon(
                                    Icons.check_rounded,
                                    size: 16,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 2, vertical: 2),
                            decoration: BoxDecoration(
                              color: isCorrect
                                  ? AppColors.success.withOpacity(0.05)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isFocused
                                    ? AppColors.primary
                                    : (isCorrect
                                        ? AppColors.success
                                        : AppColors.inputBorder),
                                width: isFocused ? 2 : 1,
                              ),
                            ),
                            child: ExcludeSemantics(
                              child: QuillEditor.basic(
                                controller: controller,
                                focusNode: focusNode,
                                config: QuillEditorConfig(
                                  placeholder: 'Opsi ${index + 1}',
                                  padding:
                                      const EdgeInsets.all(10),
                                  autoFocus: false,
                                  expands: false,
                                  scrollable: false,
                                  minHeight: 44,
                                ),
                              ),
                            ),
                          ),
                        ),
                        if (_optionQuillControllers.length > 1) ...[
                          const SizedBox(width: 6),
                          IconButton(
                            onPressed: () => _removeOption(index),
                            icon: const Icon(
                              Icons.close_rounded,
                              color: AppColors.textHint,
                              size: 20,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(
                              minWidth: 32,
                              minHeight: 32,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
                if (_correctOptionIndex != null)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          size: 16,
                          color: AppColors.success,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Opsi ${_correctOptionIndex! + 1} ditandai sebagai jawaban benar',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.success,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ],

            const SizedBox(height: 32),

            // ── Simpan ────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveQuestion,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        _isEditing ? 'Perbarui Soal' : 'Simpan Soal',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: [
          Icon(
            Icons.star_outline_rounded,
            size: 20,
            color: _score != null ? AppColors.warning : AppColors.textHint,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Skor soal ini',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  'Kosongkan jika tidak menggunakan skor',
                  style: TextStyle(fontSize: 12, color: AppColors.textHint),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: TextFormField(
              controller: _scoreController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: '—',
                hintStyle: TextStyle(color: AppColors.textHint, fontSize: 15),
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                ),
                filled: true,
                fillColor: AppColors.background,
              ),
              onChanged: (val) {
                final trimmed = val.trim();
                if (trimmed.isEmpty) {
                  setState(() => _score = null);
                } else {
                  final parsed = double.tryParse(trimmed);
                  if (parsed != null && parsed >= 0) {
                    setState(() => _score = parsed);
                  }
                }
              },
            ),
          ),
          if (_score != null) ...[
            const SizedBox(width: 4),
            GestureDetector(
              onTap: () {
                setState(() => _score = null);
                _scoreController.clear();
              },
              child: const Icon(Icons.close_rounded, size: 18, color: AppColors.textHint),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
        letterSpacing: 0.2,
      ),
    );
  }

  Widget _buildImagePreview() {
    return Stack(
      children: [
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.inputBorder),
            borderRadius: BorderRadius.circular(12),
            color: AppColors.background,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _selectedImageBytes != null
                ? Image.memory(
                    _selectedImageBytes!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Icon(
                        Icons.broken_image,
                        size: 48,
                        color: AppColors.textHint,
                      ),
                    ),
                  )
                : Image.network(
                    '${ApiConfig.formApiBaseUrl}$_existingImageUrl',
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) {
                      if (progress == null) return child;
                      return const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                      );
                    },
                    errorBuilder: (_, __, ___) => const Center(
                      child: Icon(
                        Icons.broken_image,
                        size: 48,
                        color: AppColors.textHint,
                      ),
                    ),
                  ),
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: GestureDetector(
            onTap: _removeImage,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.65),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.close_rounded,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 8,
          right: 8,
          child: GestureDetector(
            onTap: _pickImage,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.65),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.edit_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'Ganti',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAudioPreview() {
    final String label = _selectedAudioName ??
        _existingAudioUrl?.split('/').last ??
        'Audio';
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.audiotrack_rounded,
                  size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              GestureDetector(
                onTap: _pickAudio,
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: Icon(
                    Icons.edit_rounded,
                    size: 16,
                    color: AppColors.textSecondary.withOpacity(0.8),
                  ),
                ),
              ),
              GestureDetector(
                onTap: _removeAudio,
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: Icon(
                    Icons.close_rounded,
                    size: 16,
                    color: AppColors.error.withOpacity(0.7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_existingAudioUrl != null)
            FormAudioPlayer(url: '${ApiConfig.formApiBaseUrl}$_existingAudioUrl')
          else if (_selectedAudioPath != null)
            FormAudioPlayer(url: '', deviceFilePath: _selectedAudioPath)
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Preview audio tersedia setelah soal disimpan.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ),
        ],
      ),
    );
  }
}
