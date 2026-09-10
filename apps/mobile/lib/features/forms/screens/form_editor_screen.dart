import 'dart:typed_data' show Uint8List;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/download_utils.dart';
import '../../../core/services/form_service.dart';
import 'add_question_screen.dart';
import 'form_viewer_screen.dart';
import 'form_qr_screen.dart';
import 'import_word_screen.dart';
import '../../../core/utils/html_utils.dart';

class FormEditorScreen extends StatefulWidget {
  final String formId;
  final String formTitle;
  final String formSlug;
  final String? formStatus;

  const FormEditorScreen({
    super.key,
    required this.formId,
    required this.formTitle,
    required this.formSlug,
    this.formStatus,
  });

  @override
  State<FormEditorScreen> createState() => _FormEditorScreenState();
}

class _FormEditorScreenState extends State<FormEditorScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _questions = [];
  bool _isLoading = true;
  String _errorMessage = '';
  bool _isPublic = false;
  int _totalSubmissions = 0;
  int _durationMinutes = 0; // loaded from backend via getFormBySlug
  bool _isRandom = false;   // loaded from backend via getFormBySlug
  String _tokenRespon = ''; // loaded from backend via getFormBySlug

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _isPublic = widget.formStatus?.toLowerCase() == 'public';
    _loadForm();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadForm() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final result = await FormService.getFormBySlug(widget.formSlug);
      if (result['success']) {
        final data = result['data']['data'];
        // Backend returns soal grouped by page: [{page:1, soal:[...]}, ...]
        // Flatten all page groups into a single list of soal items.
        final rawSoal = data['soal'] is List ? data['soal'] as List : [];
        final List<dynamic> listSoal = rawSoal.expand<dynamic>((pageGroup) {
          if (pageGroup is Map && pageGroup['soal'] is List) {
            return pageGroup['soal'] as List;
          }
          // Fallback: item is already a soal (flat list, old format)
          return [pageGroup];
        }).toList();

        setState(() {
          _isPublic =
              (data['form_status'] ?? data['status'] ?? 'private') == 'public';

          // Parse duration from backend (integer minutes, nullable)
          final rawDur = data['duration'];
          _durationMinutes = rawDur == null
              ? 0
              : (rawDur is num
                    ? rawDur.toInt()
                    : int.tryParse(rawDur.toString()) ?? 0);

          // Parse is_random from backend (bool/int, nullable)
          final rawRandom = data['is_random'];
          _isRandom = rawRandom == true ||
              rawRandom == 1 ||
              rawRandom?.toString() == 'true' ||
              rawRandom?.toString() == '1';

          // Parse token_respon
          _tokenRespon = data['token_respon']?.toString() ?? '';

          _questions = listSoal.asMap().entries.map((entry) {
            final index = entry.key;
            final soal = entry.value;
            final type = soal['type']?.toString() ?? 'text';
            return {
              'id': soal['id']?.toString() ?? '',
              'number': index + 1,
              'question': soal['question']?.toString() ?? '',
              'type': type,
              'typeDisplay': _mapQuestionType(type),
              'options': soal['options'] ?? [],
              'audio': soal['audio']?.toString(),
            };
          }).toList();
          _isLoading = false;
        });

        _loadSubmitStats();
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load form';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadSubmitStats() async {
    final result = await FormService.getSubmitStats(widget.formSlug);
    if (result['success'] && mounted) {
      final data = result['data'];
      int total = 0;
      if (data is Map && data['data'] is Map) {
        total = (data['data']['total_submit'] as num?)?.toInt() ?? 0;
      } else if (data is List) {
        total = data.length;
      }
      setState(() {
        _totalSubmissions = total;
      });
    }
  }

  String _mapQuestionType(String type) {
    switch (type.toLowerCase()) {
      case 'radio':
        return 'SINGLE CHOICE';
      case 'checkbox':
        return 'MULTIPLE CHOICE';
      case 'text':
        return 'TEXT';
      case 'file':
        return 'FILE UPLOAD';
      case 'rating':
        return 'RATING';
      default:
        return type.toUpperCase();
    }
  }

  Future<void> _toggleStatus() async {
    final newStatus = _isPublic ? 'private' : 'public';
    final result = await FormService.updateFormStatus(
      slug: widget.formSlug,
      status: newStatus,
    );

    if (result['success'] && mounted) {
      setState(() {
        _isPublic = !_isPublic;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Status changed to ${_isPublic ? 'Public' : 'Private'}',
          ),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Failed to update status'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _deleteForm() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Form'),
        content: const Text(
          'Are you sure you want to delete this form? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final result = await FormService.deleteForm(widget.formSlug);
      if (result['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Form deleted successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to delete form'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _copyShareLink() {
    Clipboard.setData(ClipboardData(text: widget.formSlug));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Form slug copied to clipboard!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0FCF9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppColors.textPrimary, size: 20),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.formTitle,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: _isPublic
                        ? const Color(0xFFDFF7EE)
                        : const Color(0xFFDFF7EE),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _isPublic ? 'Public' : 'Draft',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: _isPublic
                          ? const Color(0xFF1BAE75)
                          : const Color(0xFF1BAE75),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '• ${_questions.length} Questions',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => FormViewerScreen(slug: widget.formSlug),
            )),
            icon: const Icon(Icons.visibility_outlined,
                color: AppColors.textSecondary, size: 22),
            tooltip: 'Preview form',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFEAF5F2), height: 1),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _errorMessage.isNotEmpty
          ? _buildErrorState()
          : Column(
              children: [
                // ── Custom TabBar ──────────────────────────────
                Container(
                  color: Colors.white,
                  child: TabBar(
                    controller: _tabController,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: AppColors.textSecondary,
                    indicatorColor: AppColors.primary,
                    indicatorWeight: 2.5,
                    indicatorSize: TabBarIndicatorSize.label,
                    dividerColor: const Color(0xFFEAF5F2),
                    labelStyle: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                    tabs: const [
                      Tab(text: 'Questions'),
                      Tab(text: 'Responses'),
                      Tab(text: 'Settings'),
                    ],
                  ),
                ),
                // ── Content ────────────────────────────────────
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _QuestionsTab(
                        questions: _questions,
                        formTitle: widget.formTitle,
                        formSlug: widget.formSlug,
                        onRefresh: _loadForm,
                      ),
                      _ResponsesTab(
                        formId: widget.formId,
                        formSlug: widget.formSlug,
                        totalSubmissions: _totalSubmissions,
                      ),
                      _SettingsTab(
                        isPublic: _isPublic,
                        formSlug: widget.formSlug,
                        onToggleStatus: _toggleStatus,
                        onDeleteForm: _deleteForm,
                        initialDurationMinutes: _durationMinutes,
                        initialIsRandom: _isRandom,
                        initialTokenRespon: _tokenRespon,
                      ),
                    ],
                  ),
                ),
              ],
            ),
      // ── Save Changes bottom bar ──────────────────────────────
      bottomNavigationBar: _isLoading || _errorMessage.isNotEmpty
          ? null
          : Container(
              color: Colors.transparent,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Material(
                color: const Color(0xFF1B4A5E),
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: _loadForm,
                  child: Container(
                    height: 52,
                    alignment: Alignment.center,
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Save Changes',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              _errorMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _loadForm, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

// ============ QUESTIONS TAB ============

class _QuestionsTab extends StatelessWidget {
  final List<Map<String, dynamic>> questions;
  final String formTitle;
  final String formSlug;
  final VoidCallback onRefresh;

  const _QuestionsTab({
    required this.questions,
    required this.formTitle,
    required this.formSlug,
    required this.onRefresh,
  });

  Future<void> _openImportWord(BuildContext context) async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            ImportWordScreen(formSlug: formSlug, formTitle: formTitle),
      ),
    );
    if (result == true) {
      onRefresh();
    }
  }

  Future<void> _openAddQuestion(
    BuildContext context, {
    Map<String, dynamic>? questionToEdit,
  }) async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AddQuestionScreen(
          formTitle: formTitle,
          formSlug: formSlug,
          questionToEdit: questionToEdit,
        ),
      ),
    );
    if (result == true) {
      onRefresh();
    }
  }

  Future<void> _confirmDelete(
    BuildContext context,
    Map<String, dynamic> question,
  ) async {
    final id = int.tryParse(question['id'].toString());
    if (id == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Question'),
        content: Text(
          'Are you sure you want to delete this question?\n\n${question['question']}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true || !context.mounted) return;

    final result = await FormService.deleteQuestion(id);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result['message'] ??
              (result['success']
                  ? 'Question deleted'
                  : 'Failed to delete question'),
        ),
        backgroundColor: result['success']
            ? AppColors.success
            : AppColors.error,
      ),
    );
    if (result['success']) {
      onRefresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Slug banner ──────────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F8F5),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              const Icon(Icons.link_rounded, color: AppColors.primary, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  formSlug,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.primary,
                    fontFamily: 'monospace',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              // Copy icon
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: formSlug));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Slug copied!'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                },
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(7),
                    border: Border.all(color: const Color(0xFFBDE8E0)),
                  ),
                  child: const Icon(Icons.copy_rounded,
                      color: AppColors.primary, size: 15),
                ),
              ),
              const SizedBox(width: 6),
              // QR icon
              GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => FormQrScreen(
                    formSlug: formSlug,
                    formTitle: formTitle,
                  ),
                )),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: const Icon(Icons.qr_code_rounded,
                      color: Colors.white, size: 15),
                ),
              ),
            ],
          ),
        ),

        // ── Questions header ─────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Row(
            children: [
              Text(
                'Questions (${questions.length})',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _openImportWord(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBDE8E0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.upload_file_rounded,
                          size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text('Import Word',
                          style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => _openAddQuestion(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBDE8E0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_rounded, size: 16, color: AppColors.primary),
                      const SizedBox(width: 2),
                      Text('Add',
                          style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        Expanded(
          child: questions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz_outlined,
                          size: 56,
                          color: AppColors.textSecondary.withOpacity(0.4)),
                      const SizedBox(height: 14),
                      const Text('No Questions Yet',
                          style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      const Text('Tap "+ Add" to create your first question',
                          style: TextStyle(fontSize: 13, color: AppColors.textHint)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  itemCount: questions.length,
                  itemBuilder: (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _buildQuestionCard(context, questions[index]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildQuestionCard(BuildContext context, Map<String, dynamic> question) {
    final options = question['options'] as List? ?? [];
    return Container(
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
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 8, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDFF7EE),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Center(
                    child: Text(
                      question['number'].toString(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(
                      stripHtmlTags(question['question']?.toString() ?? ''),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                        height: 1.35,
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () =>
                      _openAddQuestion(context, questionToEdit: question),
                  child: Padding(
                    padding: const EdgeInsets.all(6),
                    child: Icon(Icons.edit_outlined,
                        size: 18,
                        color: AppColors.textSecondary.withOpacity(0.8)),
                  ),
                ),
                GestureDetector(
                  onTap: () => _confirmDelete(context, question),
                  child: Padding(
                    padding: const EdgeInsets.all(6),
                    child: Icon(Icons.delete_outline,
                        size: 18, color: AppColors.error.withOpacity(0.5)),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 5, 14, 10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFDFF7EE),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                question['typeDisplay'],
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),
          if (options.isNotEmpty) ...[
            Divider(height: 1, color: const Color(0xFFEAF5F2), thickness: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 10),
              child: Column(
                children: options.map<Widget>((option) {
                  final val = option['value'] ?? option['option_value'] ?? '';
                  final isCorrect = _isCorrectOption(option['is_correct']);
                  final isCheckbox = question['type'] == 'checkbox';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: isCheckbox ? BoxShape.rectangle : BoxShape.circle,
                            borderRadius: isCheckbox ? BorderRadius.circular(4) : null,
                            border: Border.all(
                              color: isCorrect
                                  ? AppColors.primary
                                  : const Color(0xFFCCDEDA),
                              width: isCorrect ? 2 : 1.5,
                            ),
                            color: isCorrect
                                ? const Color(0xFFDFF7EE)
                                : Colors.transparent,
                          ),
                          child: isCorrect
                              ? const Center(
                                  child: Icon(Icons.circle,
                                      size: 8, color: AppColors.primary))
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(val,
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textPrimary,
                                fontWeight: isCorrect
                                    ? FontWeight.w500
                                    : FontWeight.normal,
                              )),
                        ),
                        if (isCorrect)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDFF7EE),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('CORRECT',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                )),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ============ RESPONSES TAB ============

class _ResponsesTab extends StatefulWidget {
  final String formId;
  final String formSlug;
  final int totalSubmissions;

  const _ResponsesTab({
    required this.formId,
    required this.formSlug,
    required this.totalSubmissions,
  });

  @override
  State<_ResponsesTab> createState() => _ResponsesTabState();
}

class _ResponsesTabState extends State<_ResponsesTab> {
  List<dynamic> _summaryQuestions = [];
  List<dynamic> _detailQuestions = [];
  bool _isLoading = true;
  bool _isExporting = false;
  String _subTab = 'Ringkasan';

  @override
  void initState() {
    super.initState();
    _loadResponses();
  }

  Future<void> _loadResponses() async {
    setState(() => _isLoading = true);

    final summaryResult = await FormService.getSubmitStats(widget.formSlug);
    final detailResult = await FormService.getSubmitDetail(widget.formSlug);

    if (!mounted) return;

    List<dynamic> summary = [];
    if (summaryResult['success']) {
      final data = summaryResult['data'];
      if (data is Map &&
          data['data'] is Map &&
          data['data']['questions'] is List) {
        // Backend returns questions as page groups: [{page, soal:[...]}, ...]
        // Flatten all soal from every page into a single list.
        final pageGroups = data['data']['questions'] as List;
        summary = pageGroups.expand<dynamic>((pageGroup) {
          if (pageGroup is Map && pageGroup['soal'] is List) {
            return pageGroup['soal'] as List;
          }
          return [pageGroup];
        }).toList();
      }
    }

    List<dynamic> detail = [];
    if (detailResult['success']) {
      final data = detailResult['data'];
      // Backend returns data as page groups: [{page, soal:[...]}, ...]
      // Flatten all soal from every page into a single list.
      List<dynamic> rawList = [];
      if (data is Map && data['data'] is List) {
        rawList = data['data'] as List;
      } else if (data is List) {
        rawList = data;
      }
      detail = rawList.expand<dynamic>((pageGroup) {
        if (pageGroup is Map && pageGroup['soal'] is List) {
          return pageGroup['soal'] as List;
        }
        return [pageGroup];
      }).toList();
    }

    setState(() {
      _summaryQuestions = summary;
      _detailQuestions = detail;
      _isLoading = false;
    });
  }

  Future<void> _exportExcel() async {
    if (_isExporting) return;
    setState(() => _isExporting = true);
    try {
      final result = await FormService.exportSubmitToExcel(widget.formSlug);
      if (!mounted) return;
      if (result['success']) {
        final bytes = result['bytes'] as Uint8List;
        final filename = result['filename'] as String;
        triggerFileDownload(bytes, filename);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('File Excel berhasil diunduh.'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Gagal mengunduh file Excel.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengunduh file Excel.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          )
        : Column(
            children: [
              // Sub tabs
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    _buildSubTab('Ringkasan'),
                    const SizedBox(width: 8),
                    _buildSubTab('Jawaban'),
                    const Spacer(),
                    // Export Excel button
                    SizedBox(
                      height: 36,
                      child: ElevatedButton.icon(
                        onPressed: _isExporting ? null : _exportExcel,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 0,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 0,
                        ),
                        icon: _isExporting
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.table_chart_rounded, size: 16),
                        label: const Text(
                          'Export Excel',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Stats header
              Container(
                width: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    _buildStatCard(
                      'Total Submit',
                      '${widget.totalSubmissions}',
                    ),
                    const SizedBox(width: 12),
                    _buildStatCard('Soal', '${_summaryQuestions.length}'),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Content
              Expanded(
                child: _subTab == 'Ringkasan'
                    ? _buildSummaryView()
                    : _buildDetailView(),
              ),
            ],
          );
  }

  Widget _buildSubTab(String label) {
    final isSelected = _subTab == label;
    return GestureDetector(
      onTap: () => setState(() => _subTab = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryView() {
    if (_summaryQuestions.isEmpty) {
      return _buildNoResponses();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _summaryQuestions.length,
      itemBuilder: (context, index) {
        final q = _summaryQuestions[index];
        if (q is! Map) return const SizedBox.shrink();
        final options = q['options'] as List? ?? [];
        final totalAnswered = options.fold<int>(
          0,
          (sum, o) =>
              sum + ((o is Map ? o['total_answer'] : 0) as num? ?? 0).toInt(),
        );

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
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
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      q['question'] ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              if (options.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...options.map((o) {
                  final count = (o is Map ? o['total_answer'] : 0) as num? ?? 0;
                  final pct = totalAnswered > 0
                      ? (count.toDouble() / totalAnswered * 100)
                      : 0;
                  final value = (o is Map ? o['value'] : o) ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '$value',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Text(
                              '$count (${pct.toStringAsFixed(0)}%)',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct / 100,
                            minHeight: 6,
                            backgroundColor: AppColors.primary.withOpacity(0.1),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ] else if (totalAnswered > 0) ...[
                const SizedBox(height: 8),
                Text(
                  '$totalAnswered jawaban teks',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailView() {
    if (_detailQuestions.isEmpty) {
      return _buildNoResponses();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _detailQuestions.length,
      itemBuilder: (context, index) {
        final q = _detailQuestions[index];
        if (q is! Map) return const SizedBox.shrink();
        final responses = q['responses'] as List? ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
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
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      q['question'] ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              if (responses.isEmpty)
                const Text(
                  'Belum ada jawaban',
                  style: TextStyle(fontSize: 13, color: AppColors.textHint),
                )
              else
                ...responses.asMap().entries.map((entry) {
                  final resp = entry.value;
                  final answerText = resp is Map
                      ? (resp['answer'] ?? 'No answer')
                      : resp;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.person,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${entry.key + 1}. $answerText',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNoResponses() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.analytics_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'No Responses Yet',
              style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Responses will appear here once users submit the form',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textHint),
            ),
          ],
        ),
      ),
    );
  }
}

// ============ SETTINGS TAB ============

class _SettingsTab extends StatefulWidget {
  final bool isPublic;
  final String formSlug;
  final VoidCallback onToggleStatus;
  final VoidCallback onDeleteForm;
  final int initialDurationMinutes;
  final bool initialIsRandom;
  final String initialTokenRespon;

  const _SettingsTab({
    required this.isPublic,
    required this.formSlug,
    required this.onToggleStatus,
    required this.onDeleteForm,
    this.initialDurationMinutes = 0,
    this.initialIsRandom = false,
    this.initialTokenRespon = '',
  });

  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab> {
  late TextEditingController _durationController;
  late TextEditingController _tokenController;
  bool _isSavingDuration = false;
  bool _isSavingToken = false;
  bool _isRandom = false;
  bool _isSavingRandom = false;
  String? _durationError;
  String? _durationSuccessMsg;
  String? _tokenError;
  String? _tokenSuccessMsg;

  @override
  void initState() {
    super.initState();
    _isRandom = widget.initialIsRandom;
    _durationController = TextEditingController(
      text: widget.initialDurationMinutes > 0
          ? widget.initialDurationMinutes.toString()
          : '',
    );
    _tokenController = TextEditingController(
      text: widget.initialTokenRespon,
    );
  }

  @override
  void dispose() {
    _durationController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _saveDuration() async {
    final raw = _durationController.text.trim();
    final minutes = raw.isEmpty ? 0 : int.tryParse(raw);

    if (minutes == null || minutes < 0) {
      setState(() {
        _durationError = 'Masukkan angka menit yang valid (0 = tanpa batas).';
        _durationSuccessMsg = null;
      });
      return;
    }

    setState(() {
      _isSavingDuration = true;
      _durationError = null;
      _durationSuccessMsg = null;
    });

    final result = await FormService.updateFormSetting(
      slug: widget.formSlug,
      durationMinutes: minutes,
      isRandom: _isRandom,
    );

    if (!mounted) return;
    setState(() {
      _isSavingDuration = false;
      if (result['success']) {
        _durationSuccessMsg = minutes == 0
            ? 'Durasi dihapus — form tanpa batasan waktu.'
            : 'Durasi disimpan: $minutes menit.';
        _durationError = null;
      } else {
        _durationError = result['message'] ?? 'Gagal menyimpan durasi.';
        _durationSuccessMsg = null;
      }
    });
  }

  Future<void> _saveToken() async {
    setState(() {
      _isSavingToken = true;
      _tokenError = null;
      _tokenSuccessMsg = null;
    });

    final result = await FormService.updateTokenRespon(
      slug: widget.formSlug,
      tokenRespon: _tokenController.text.trim(),
    );

    if (!mounted) return;
    setState(() {
      _isSavingToken = false;
      if (result['success']) {
        _tokenSuccessMsg = _tokenController.text.trim().isEmpty
            ? 'Token dihapus — form dapat diakses tanpa token.'
            : 'Token berhasil disimpan.';
        _tokenError = null;
      } else {
        _tokenError = result['message'] ?? 'Gagal menyimpan token.';
        _tokenSuccessMsg = null;
      }
    });
  }

  Future<void> _toggleShuffle(bool value) async {
    setState(() {
      _isRandom = value;
      _isSavingRandom = true;
    });

    final raw = _durationController.text.trim();
    final minutes = raw.isEmpty ? 0 : (int.tryParse(raw) ?? 0);

    final result = await FormService.updateFormSetting(
      slug: widget.formSlug,
      durationMinutes: minutes,
      isRandom: value,
    );

    if (!mounted) return;
    setState(() => _isSavingRandom = false);

    if (!result['success']) {
      setState(() => _isRandom = !value);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Gagal menyimpan pengaturan.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // ── TOKEN UJIAN ───────────────────────────────────────
          _buildSectionLabel('TOKEN UJIAN'),
          const SizedBox(height: 8),
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCardHeader(
                  icon: Icons.key_rounded,
                  title: 'Token Akses',
                  subtitle: 'Masukkan atau ubah token kode akses untuk peserta ujian.',
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTextField(
                            controller: _tokenController,
                            hint: 'cth. UBI-2024',
                            suffixIcon: _tokenController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.copy_rounded,
                                        size: 16, color: AppColors.primary),
                                    onPressed: () {
                                      Clipboard.setData(ClipboardData(
                                          text: _tokenController.text));
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(const SnackBar(
                                        content: Text('Token disalin!'),
                                        backgroundColor: AppColors.success,
                                        duration: Duration(seconds: 2),
                                      ));
                                    },
                                  )
                                : null,
                            onChanged: (_) {
                              if (_tokenError != null ||
                                  _tokenSuccessMsg != null) {
                                setState(() {
                                  _tokenError = null;
                                  _tokenSuccessMsg = null;
                                });
                              }
                            },
                          ),
                          if (_tokenError != null)
                            _buildFeedback(_tokenError!, isError: true),
                          if (_tokenSuccessMsg != null)
                            _buildFeedback(_tokenSuccessMsg!, isError: false),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    _buildSaveButton(
                      label: 'Ubah',
                      isSaving: _isSavingToken,
                      onTap: _saveToken,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // "Wajibkan Token untuk Masuk" toggle
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Wajibkan Token untuk Masuk',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            _tokenController.text.trim().isNotEmpty
                                ? 'Siswa harus memasukkan form dengan token ini.'
                                : 'Kosongkan token untuk akses bebas.',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildToggle(
                      value: _tokenController.text.trim().isNotEmpty,
                      onTap: () {
                        setState(() {
                          if (_tokenController.text.trim().isNotEmpty) {
                            _tokenController.clear();
                          }
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── PENGATURAN WAKTU ──────────────────────────────────
          _buildSectionLabel('PENGATURAN WAKTU'),
          const SizedBox(height: 8),
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCardHeader(
                  icon: Icons.timer_outlined,
                  title: 'Durasi Pengerjaan',
                  subtitle: 'Isi 0 atau kosongkan untuk tanpa batasan waktu.',
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTextField(
                            controller: _durationController,
                            hint: 'cth. 60',
                            suffixText: 'menit',
                            keyboardType: TextInputType.number,
                            onChanged: (_) {
                              if (_durationError != null ||
                                  _durationSuccessMsg != null) {
                                setState(() {
                                  _durationError = null;
                                  _durationSuccessMsg = null;
                                });
                              }
                            },
                          ),
                          if (_durationError != null)
                            _buildFeedback(_durationError!, isError: true),
                          if (_durationSuccessMsg != null)
                            _buildFeedback(_durationSuccessMsg!, isError: false),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    _buildSaveButton(
                      label: 'Simpan',
                      isSaving: _isSavingDuration,
                      onTap: _saveDuration,
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _buildPresetChip('30 mnt', 30),
                    _buildPresetChip('45 mnt', 45),
                    _buildPresetChip('60 mnt', 60),
                    _buildPresetChip('90 mnt', 90),
                    _buildPresetChip('120 mnt', 120),
                    _buildPresetChip('Tanpa batas', 0),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── URUTAN SOAL ───────────────────────────────────────
          _buildSectionLabel('URUTAN SOAL'),
          const SizedBox(height: 8),
          _buildCard(
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: _isRandom
                        ? const Color(0xFFDFF7EE)
                        : AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.shuffle_rounded,
                      color: _isRandom
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Acak Urutan Soal',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary),
                      ),
                      Text(
                        _isRandom
                            ? 'Urutan soal akan diacak setiap kali form dibuka'
                            : 'Urutan soal tetap sesuai yang dibuat',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _isSavingRandom
                    ? const SizedBox(
                        width: 36,
                        height: 36,
                        child: Padding(
                          padding: EdgeInsets.all(8),
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primary),
                        ),
                      )
                    : _buildToggle(
                        value: _isRandom,
                        onTap: () => _toggleShuffle(!_isRandom),
                      ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── VISIBILITAS ───────────────────────────────────────
          _buildSectionLabel('VISIBILITAS'),
          const SizedBox(height: 8),
          _buildCard(
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDFF7EE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    widget.isPublic ? Icons.public : Icons.lock_outline,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Status Form',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary),
                      ),
                      Text(
                        widget.isPublic
                            ? 'Public — siapapun bisa mengisi form ini'
                            : 'Private — hanya kamu yang bisa melihat',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                _buildToggle(
                  value: widget.isPublic,
                  onTap: widget.onToggleStatus,
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Bagikan Form
          _buildCard(
            onTap: () {
              Clipboard.setData(ClipboardData(text: widget.formSlug));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Link form disalin!'),
                    backgroundColor: AppColors.success),
              );
            },
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDFF7EE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.share,
                      color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Bagikan Form',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary)),
                      Text('Salin slug form untuk dibagikan',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    size: 14, color: AppColors.textSecondary),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── DANGER ZONE ───────────────────────────────────────
          _buildCard(
            onTap: widget.onDeleteForm,
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.delete_outline,
                      color: AppColors.error, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hapus Form',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.error)),
                      Text('Hapus form ini secara permanen',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios,
                    size: 14, color: AppColors.error),
              ],
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ── Shared helper widgets ─────────────────────────────────────

  Widget _buildSectionLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.textSecondary,
        letterSpacing: 1.0,
      ),
    );
  }

  Widget _buildCard({required Widget child, VoidCallback? onTap}) {
    final card = Container(
      padding: const EdgeInsets.all(16),
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
      child: child,
    );
    if (onTap == null) return card;
    return GestureDetector(onTap: onTap, child: card);
  }

  Widget _buildCardHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: const Color(0xFFDFF7EE),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
              Text(subtitle,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    String? hint,
    String? suffixText,
    Widget? suffixIcon,
    TextInputType? keyboardType,
    ValueChanged<String>? onChanged,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      onChanged: onChanged,
      style: const TextStyle(
          fontSize: 14,
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle:
            const TextStyle(color: AppColors.textHint, fontSize: 13),
        suffixText: suffixText,
        suffixStyle: const TextStyle(
            color: AppColors.textSecondary, fontSize: 13),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: const Color(0xFFF5FEFA),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide:
              const BorderSide(color: Color(0xFFBDE8E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide:
              const BorderSide(color: Color(0xFFBDE8E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildSaveButton({
    required String label,
    required bool isSaving,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: isSaving ? null : onTap,
      child: Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: isSaving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Colors.white)),
                )
              : Text(label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 14)),
        ),
      ),
    );
  }

  Widget _buildToggle({required bool value, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeInOut,
        width: 48,
        height: 26,
        decoration: BoxDecoration(
          color: value ? AppColors.primary : const Color(0xFFCCDEDA),
          borderRadius: BorderRadius.circular(13),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          alignment:
              value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 22,
            height: 22,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: Color(0x22000000),
                    blurRadius: 4,
                    offset: Offset(0, 1))
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeedback(String msg, {required bool isError}) {
    return Padding(
      padding: const EdgeInsets.only(top: 5),
      child: Row(
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.check_circle_outline,
            size: 13,
            color: isError ? AppColors.error : AppColors.success,
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(msg,
                style: TextStyle(
                    fontSize: 11,
                    color: isError ? AppColors.error : AppColors.success)),
          ),
        ],
      ),
    );
  }

  Widget _buildPresetChip(String label, int minutes) {
    final isActive = _durationController.text.trim() ==
        (minutes == 0 ? '' : minutes.toString());
    return GestureDetector(
      onTap: () {
        setState(() {
          _durationController.text =
              minutes == 0 ? '' : minutes.toString();
          _durationError = null;
          _durationSuccessMsg = null;
        });
      },
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFFDFF7EE)
              : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive
                ? AppColors.primary
                : const Color(0xFFBDE8E0),
            width: isActive ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isActive
                  ? AppColors.primary
                  : AppColors.textSecondary),
        ),
      ),
    );
  }
}

bool _isCorrectOption(dynamic value) {
  if (value == null) return false;
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final v = value.trim().toLowerCase();
    return v == 'true' || v == '1';
  }
  return false;
}
