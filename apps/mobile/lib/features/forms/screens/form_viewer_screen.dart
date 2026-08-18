import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';

class FormViewerScreen extends StatefulWidget {
  final String slug;

  const FormViewerScreen({
    super.key,
    required this.slug,
  });

  @override
  State<FormViewerScreen> createState() => _FormViewerScreenState();
}

class _FormViewerScreenState extends State<FormViewerScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _submitted = false;
  String _error = '';

  String _formTitle = '';
  String _category = '';
  String _formStatus = '';
  int? _formId;
  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _loadForm();
  }

  Future<void> _loadForm() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    final result = await FormService.getFormBySlug(widget.slug);

    if (!mounted) return;

    if (result['success']) {
      final data = result['data'] is Map
          ? result['data']['data'] is Map
              ? Map<String, dynamic>.from(result['data']['data'] as Map)
              : <String, dynamic>{}
          : <String, dynamic>{};

      final List<dynamic> listSoal =
          data['soal'] is List ? data['soal'] : <dynamic>[];

      setState(() {
        _formTitle = (data['title'] ?? data['form_title'] ?? 'Untitled Form')
            .toString();
        _formId = int.tryParse('${data['form_id'] ?? data['id'] ?? ''}');
        _category = _categoryName(data['category'], data['category_id']);
        _formStatus = (data['status'] ?? data['form_status'] ?? '').toString();
        _questions = listSoal.asMap().entries.map((entry) {
          final index = entry.key;
          final soal = entry.value is Map
              ? Map<String, dynamic>.from(entry.value as Map)
              : <String, dynamic>{};
          return {
            'id': soal['id'],
            'number': index + 1,
            'question': soal['question'] ?? '',
            'type': soal['type'] ?? 'text',
            'options': soal['options'] is List ? soal['options'] : [],
            'answer': null,
            'file': null,
          };
        }).toList();
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = result['message'] ?? 'Form tidak ditemukan atau tidak tersedia.';
        _isLoading = false;
      });
    }
  }

  String _categoryName(dynamic category, dynamic categoryId) {
    if (category is String && category.isNotEmpty) return category;
    if (categoryId == 1) return 'Quiz';
    if (categoryId == 2) return 'Survey';
    return '';
  }

  Future<void> _pickFile(Map<String, dynamic> question, int index) async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null && mounted) {
      setState(() {
        _questions[index]['answer'] = picked.name;
        _questions[index]['file'] = picked;
      });
    }
  }

  void _removeFile(int index) {
    setState(() {
      _questions[index]['answer'] = null;
      _questions[index]['file'] = null;
    });
  }

  Future<void> _handleSubmit() async {
    if (_formId == null) {
      _showError('Form tidak valid, silakan muat ulang.');
      return;
    }

    for (final q in _questions) {
      final val = q['answer'];
      if (val == null || (val is List && val.isEmpty)) {
        _showError('Pertanyaan "${q['question']}" wajib diisi.');
        return;
      }
    }

    setState(() => _isSubmitting = true);

    final answers = <Map<String, dynamic>>[];
    final files = <XFile>[];

    for (final q in _questions) {
      final type = q['type'] as String;
      final soalId = q['id'];

      if (type == 'text') {
        answers.add({'jawaban': {'soal_id': soalId, 'answer_text': q['answer']}});
      } else if (type == 'file') {
        final file = q['file'] as XFile;
        files.add(file);
        answers.add({'jawaban': {'soal_id': soalId, 'file_name': file.name}});
      } else {
        answers.add({
          'jawaban': {'soal_id': soalId, 'soal_option_id': q['answer']},
        });
      }
    }

    final result = await FormService.submitForm(
      formId: _formId!,
      answers: answers,
      files: files,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result['success']) {
      setState(() => _submitted = true);
    } else {
      _showError(result['message'] ?? 'Gagal mengirim jawaban. Coba lagi.');
    }
  }

  void _showError(String message) {
    setState(() => _error = message);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget body;

    if (_isLoading) {
      body = const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: AppColors.primary,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Memuat form...',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      );
    } else if (_error.isNotEmpty && _formTitle.isEmpty) {
      body = _buildErrorState();
    } else if (_submitted) {
      body = _buildSubmittedState();
    } else {
      body = _buildContent();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _isLoading || (_error.isNotEmpty && _formTitle.isEmpty)
          ? null
          : _buildHeader(),
      body: SafeArea(
        child: _submitted || (_error.isNotEmpty && _formTitle.isEmpty)
            ? body
            : body,
      ),
    );
  }

  PreferredSizeWidget? _buildHeader() {
    return PreferredSize(
      preferredSize: const Size.fromHeight(60),
      child: Container(
        color: Colors.white,
        child: SafeArea(
          bottom: false,
          child: Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back, color: Color(0xFF9CA3AF)),
              ),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    if (_category.isNotEmpty)
                      Text(
                        _category,
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
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: _formStatus == 'public'
                      ? const Color(0xFFDCFCE7)
                      : const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Text(
                  (_formStatus.isEmpty ? 'private' : _formStatus).toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: _formStatus == 'public'
                        ? const Color(0xFF15803D)
                        : const Color(0xFF6B7280),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('😕', style: TextStyle(fontSize: 44)),
            const SizedBox(height: 12),
            Text(
              _error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Kembali ke Beranda',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmittedState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, size: 56, color: Color(0xFF22C55E)),
              const SizedBox(height: 16),
              const Text(
                'Jawaban Terkirim!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                  children: [
                    const TextSpan(text: 'Terima kasih telah mengisi '),
                    TextSpan(
                      text: _formTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF374151),
                      ),
                    ),
                  ],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      'Kembali ke Beranda',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Container(
      color: AppColors.background,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
        children: [
          // Form intro card
          Container(
            padding: const EdgeInsets.all(20),
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
                Text(
                  _formTitle,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_questions.length} pertanyaan',
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),

          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('⚠️', style: TextStyle(fontSize: 13)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 12),

          if (_questions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Column(
                children: [
                  Text('📝', style: TextStyle(fontSize: 36)),
                  SizedBox(height: 12),
                  Text(
                    'Form ini belum memiliki pertanyaan.',
                    style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            )
          else ...[
            ...List.generate(_questions.length, (index) {
              final q = _questions[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _QuestionField(
                  question: q,
                  index: index,
                  onAnswer: (v) => setState(() => _questions[index]['answer'] = v),
                  onToggleCheckbox: (optId) {
                    final current = _questions[index]['answer'];
                    final list = current is List
                        ? List<int>.from(current)
                        : <int>[];
                    if (list.contains(optId)) {
                      list.remove(optId);
                    } else {
                      list.add(optId);
                    }
                    setState(() => _questions[index]['answer'] = list);
                  },
                  onFile: () => _pickFile(q, index),
                  onRemoveFile: () => _removeFile(index),
                ),
              );
            }),
            const SizedBox(height: 8),
            // Submit button
            GestureDetector(
              onTap: _isSubmitting ? null : _handleSubmit,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Center(
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Kirim Jawaban',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.chevron_right,
                              size: 18,
                              color: Colors.white,
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuestionField extends StatelessWidget {
  final Map<String, dynamic> question;
  final int index;
  final void Function(dynamic value) onAnswer;
  final void Function(int optId) onToggleCheckbox;
  final VoidCallback onFile;
  final VoidCallback onRemoveFile;

  const _QuestionField({
    required this.question,
    required this.index,
    required this.onAnswer,
    required this.onToggleCheckbox,
    required this.onFile,
    required this.onRemoveFile,
  });

  @override
  Widget build(BuildContext context) {
    final type = (question['type'] as String? ?? 'text');
    final options = (question['options'] as List? ?? [])
        .map((o) => Map<String, dynamic>.from(o as Map))
        .toList();
    final answer = question['answer'];

    return Container(
      padding: const EdgeInsets.all(16),
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
          Text.rich(
            TextSpan(
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
              children: [
                TextSpan(
                  text: '${index + 1}. ',
                  style: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontWeight: FontWeight.normal,
                  ),
                ),
                TextSpan(text: '${question['question'] ?? ''}'),
                const TextSpan(
                  text: ' *',
                  style: TextStyle(color: Color(0xFFEF4444)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (type == 'radio') ...[
            ...options.asMap().entries.map((entry) {
              final oIdx = entry.key;
              final opt = entry.value;
              final selected = answer == opt['id'];
              return _optionRow(
                isCheckbox: false,
                selected: selected,
                value: opt['option_value'] ?? opt['value'],
                index: oIdx,
                onTap: () => onAnswer(opt['id']),
              );
            }),
          ] else if (type == 'checkbox') ...[
            ...options.asMap().entries.map((entry) {
              final oIdx = entry.key;
              final opt = entry.value;
              final selected = (answer is List) && answer.contains(opt['id']);
              return _optionRow(
                isCheckbox: true,
                selected: selected,
                value: opt['option_value'] ?? opt['value'],
                index: oIdx,
                onTap: () => onToggleCheckbox(opt['id']),
              );
            }),
          ] else if (type == 'text') ...[
            TextField(
              maxLines: 3,
              style: const TextStyle(fontSize: 14),
              onChanged: onAnswer,
              decoration: InputDecoration(
                hintText: 'Tulis jawaban Anda di sini...',
                hintStyle: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF9CA3AF),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.all(14),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF60A5FA), width: 2),
                ),
              ),
            ),
          ] else if (type == 'file') ...[
            _FileUploadField(
              file: question['file'],
              fileName: question['answer']?.toString(),
              onPick: onFile,
              onRemove: onRemoveFile,
            ),
          ] else if (type == 'rating') ...[
            Wrap(
              spacing: 8,
              children: options.asMap().entries.map((entry) {
                final oIdx = entry.key;
                final opt = entry.value;
                final selected = answer == opt['id'];
                return GestureDetector(
                  onTap: () => onAnswer(opt['id']),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: selected ? const Color(0xFF3B82F6) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selected
                            ? const Color(0xFF3B82F6)
                            : const Color(0xFFE5E7EB),
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        opt['option_value'] != null
                            ? opt['option_value'].toString()
                            : '${oIdx + 1}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
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
          ],
        ],
      ),
    );
  }

  Widget _optionRow({
    required bool isCheckbox,
    required bool selected,
    required dynamic value,
    required int index,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected
                ? const Color(0xFF93C5FD)
                : const Color(0xFFF3F4F6),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: isCheckbox ? BoxShape.rectangle : BoxShape.circle,
                borderRadius: isCheckbox
                    ? BorderRadius.circular(5)
                    : null,
                border: Border.all(
                  color: selected
                      ? const Color(0xFF3B82F6)
                      : const Color(0xFFD1D5DB),
                  width: 2,
                ),
                color: selected && isCheckbox
                    ? const Color(0xFF3B82F6)
                    : Colors.white,
              ),
              child: selected && isCheckbox
                  ? const Icon(Icons.check, size: 13, color: Colors.white)
                  : (selected
                      ? Padding(
                          padding: const EdgeInsets.all(4),
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Color(0xFF3B82F6),
                              shape: BoxShape.circle,
                            ),
                          ),
                        )
                      : null),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                value == null || value.toString().isEmpty
                    ? 'Opsi ${index + 1}'
                    : value.toString(),
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF374151),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FileUploadField extends StatelessWidget {
  final XFile? file;
  final String? fileName;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _FileUploadField({
    this.file,
    this.fileName,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    if (file != null) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF93C5FD)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('📎', style: TextStyle(fontSize: 16))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fileName ?? (file?.name ?? 'file'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  Text(
                    'Terpilih',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: onRemove,
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Icon(Icons.close, size: 16, color: Color(0xFF9CA3AF)),
              ),
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: onPick,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFFE5E7EB),
            width: 2,
          ),
        ),
        child: const Column(
          children: [
            Icon(Icons.upload_outlined, size: 24, color: Color(0xFF9CA3AF)),
            SizedBox(height: 8),
            Text(
              'Klik untuk unggah file',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF6B7280),
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Semua format file diterima',
              style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      ),
    );
  }
}
