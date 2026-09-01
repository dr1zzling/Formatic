import 'dart:typed_data' show Uint8List;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/download_utils.dart';
import '../../../core/services/form_service.dart';
import 'add_question_screen.dart';
import 'form_viewer_screen.dart';
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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
        title: Text(
          widget.formTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _copyShareLink,
            icon: const Icon(Icons.link, color: AppColors.primary),
            tooltip: 'Copy share link',
          ),
          IconButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => FormViewerScreen(slug: widget.formSlug),
                ),
              );
            },
            icon: const Icon(Icons.preview, color: AppColors.primary),
            tooltip: 'Preview form',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
          tabs: const [
            Tab(text: 'Questions'),
            Tab(text: 'Responses'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _errorMessage.isNotEmpty
          ? _buildErrorState()
          : TabBarView(
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
                ),
              ],
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
        // Share link banner
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.link, color: AppColors.primary, size: 20),
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
              IconButton(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: formSlug));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Slug copied!'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                },
                icon: const Icon(
                  Icons.copy,
                  color: AppColors.primary,
                  size: 18,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),

        // Questions header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(
                'Questions (${questions.length})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _openImportWord(context),
                icon: const Icon(Icons.upload_file, color: AppColors.primary),
                label: const Text(
                  'Import Word',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: () => _openAddQuestion(context),
                icon: const Icon(Icons.add, color: AppColors.primary),
                label: const Text(
                  'Add',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 8),

        // Questions list
        Expanded(
          child: questions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.quiz_outlined,
                        size: 64,
                        color: AppColors.textSecondary.withOpacity(0.5),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No Questions Yet',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Tap "Add" to create your first question',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textHint,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: questions.length,
                  itemBuilder: (context, index) {
                    final question = questions[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: _buildQuestionCard(context, question),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildQuestionCard(
    BuildContext context,
    Map<String, dynamic> question,
  ) {
    final options = question['options'] as List? ?? [];
    return Container(
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
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    question['number'].toString(),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  stripHtmlTags(question['question']?.toString() ?? ''),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              IconButton(
                onPressed: () =>
                    _openAddQuestion(context, questionToEdit: question),
                icon: const Icon(
                  Icons.edit_outlined,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                onPressed: () => _confirmDelete(context, question),
                icon: const Icon(
                  Icons.delete_outline,
                  color: AppColors.error,
                  size: 20,
                ),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              question['typeDisplay'],
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (options.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            ...options
                .map(
                  (option) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        Icon(
                          question['type'] == 'checkbox'
                              ? Icons.check_box_outline_blank
                              : Icons.radio_button_unchecked,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            option['value'] ?? option['option_value'] ?? '',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (_isCorrectOption(option['is_correct']))
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'CORRECT',
                              style: TextStyle(
                                fontSize: 9,
                                color: AppColors.success,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                )
                .toList(),
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

class _SettingsTab extends StatelessWidget {
  final bool isPublic;
  final String formSlug;
  final VoidCallback onToggleStatus;
  final VoidCallback onDeleteForm;

  const _SettingsTab({
    required this.isPublic,
    required this.formSlug,
    required this.onToggleStatus,
    required this.onDeleteForm,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status toggle
          Container(
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
            child: Row(
              children: [
                Icon(
                  isPublic ? Icons.public : Icons.lock_outline,
                  color: AppColors.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Public Status',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isPublic
                            ? 'Form can be accessed by anyone with the link'
                            : 'Form is private',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onToggleStatus,
                  child: Container(
                    width: 52,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isPublic
                          ? AppColors.primary
                          : AppColors.inputBorder,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 200),
                      alignment: isPublic
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        width: 24,
                        height: 24,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Copy link
          Container(
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
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: formSlug));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Share link copied!'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.share,
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Share Form',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Copy the form link to share',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward_ios,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Delete form
          Container(
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
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: onDeleteForm,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.delete_outline,
                          color: AppColors.error,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delete Form',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: AppColors.error,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Permanently delete this form',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward_ios,
                        size: 16,
                        color: AppColors.error,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.info.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppColors.info, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Questions can be edited or deleted from the Questions tab. Use "Import Word" to bulk-import .docx questions.',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
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
