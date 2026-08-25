import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import 'add_question_screen.dart';
import 'form_viewer_screen.dart';

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

class _FormEditorScreenState extends State<FormEditorScreen> with SingleTickerProviderStateMixin {
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
        final formId = data['form_id'] ?? data['id'];

        final questionsResult = await FormService.getFormQuestions(formId);

        setState(() {
          _isPublic = (data['form_status'] ?? data['status'] ?? 'private') == 'public';

          if (questionsResult['success']) {
            final questionsData = questionsResult['data'];
            final List<dynamic> listSoal;
            if (questionsData is List) {
              listSoal = questionsData;
            } else if (questionsData is Map && questionsData['data'] is List) {
              listSoal = questionsData['data'];
            } else {
              listSoal = [];
            }
            _questions = listSoal.asMap().entries.map((entry) {
              final index = entry.key;
              final soal = entry.value;
              return {
                'id': soal['id'].toString(),
                'number': index + 1,
                'question': soal['question'],
                'type': soal['type'],
                'typeDisplay': _mapQuestionType(soal['type']),
                'options': soal['options'] ?? [],
              };
            }).toList();
          }
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
    final result = await FormService.getSubmitStats(widget.formId);
    if (result['success'] && mounted) {
      final data = result['data'];
      if (data is Map && data['data'] != null) {
        final submissions = data['data'];
        setState(() {
          _totalSubmissions = submissions is List ? submissions.length : 1;
        });
      } else if (data is List) {
        setState(() {
          _totalSubmissions = data.length;
        });
      } else {
        setState(() {
          _totalSubmissions = 0;
        });
      }
    }
  }

  String _mapQuestionType(String type) {
    switch (type.toLowerCase()) {
      case 'radio': return 'SINGLE CHOICE';
      case 'checkbox': return 'MULTIPLE CHOICE';
      case 'text': return 'TEXT';
      case 'file': return 'FILE UPLOAD';
      case 'rating': return 'RATING';
      default: return type.toUpperCase();
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
          content: Text('Status changed to ${_isPublic ? 'Public' : 'Private'}'),
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
        content: const Text('Are you sure you want to delete this form? This action cannot be undone.'),
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
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'Questions'),
            Tab(text: 'Responses'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _errorMessage.isNotEmpty
              ? _buildErrorState()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _QuestionsTab(
                      questions: _questions,
                      formId: widget.formId,
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
              style: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadForm,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

// ============ QUESTIONS TAB ============

class _QuestionsTab extends StatelessWidget {
  final List<Map<String, dynamic>> questions;
  final String formId;
  final String formTitle;
  final String formSlug;
  final VoidCallback onRefresh;

  const _QuestionsTab({
    required this.questions,
    required this.formId,
    required this.formTitle,
    required this.formSlug,
    required this.onRefresh,
  });

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
                icon: const Icon(Icons.copy, color: AppColors.primary, size: 18),
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
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => AddQuestionScreen(
                        formId: formId,
                        formTitle: formTitle,
                        formSlug: formSlug,
                      ),
                    ),
                  ).then((_) => onRefresh());
                },
                icon: const Icon(Icons.add, color: AppColors.primary),
                label: const Text(
                  'Add',
                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
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
                      Icon(Icons.quiz_outlined, size: 64, color: AppColors.textSecondary.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      const Text('No Questions Yet', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      const Text('Tap "Add" to create your first question', style: TextStyle(fontSize: 14, color: AppColors.textHint)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: questions.length,
                  itemBuilder: (context, index) {
                    final question = questions[index];
                    return _buildQuestionCard(question);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> question) {
    final options = question['options'] as List? ?? [];
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
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    question['number'].toString(),
                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  question['question'],
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                ),
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
              style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
            ),
          ),
          if (options.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            ...options.map((option) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Icon(
                    question['type'] == 'checkbox' ? Icons.check_box_outline_blank : Icons.radio_button_unchecked,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      option['option_value'] ?? '',
                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                    ),
                  ),
                  if (option['is_correct'] == true || option['is_correct'] == 1)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'CORRECT',
                        style: TextStyle(fontSize: 9, color: AppColors.success, fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
            )).toList(),
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
  List<dynamic> _responses = [];
  bool _isLoading = true;
  String _subTab = 'Ringkasan';

  @override
  void initState() {
    super.initState();
    _loadResponses();
  }

  Future<void> _loadResponses() async {
    setState(() => _isLoading = true);

    final result = await FormService.getSubmitDetail(widget.formId);
    if (result['success'] && mounted) {
      final data = result['data'];
      List<dynamic> responsesList = [];
      if (data is Map && data['data'] != null) {
        final innerData = data['data'];
        if (innerData is List) {
          responsesList = innerData;
        } else if (innerData is Map) {
          responsesList = [innerData];
        }
      } else if (data is List) {
        responsesList = data;
      }
      setState(() {
        _responses = responsesList;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : Column(
            children: [
              // Sub tabs
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _buildSubTab('Ringkasan'),
                    const SizedBox(width: 8),
                    _buildSubTab('Jawaban'),
                  ],
                ),
              ),

              // Stats header
              Container(
                width: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _buildStatCard('Total', _responses.length.toString()),
                        const SizedBox(width: 12),
                        _buildStatCard('Soal', '${widget.totalSubmissions}'),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Content
              Expanded(
                child: _responses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.analytics_outlined, size: 64, color: AppColors.textSecondary.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            const Text('No Responses Yet', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                            const SizedBox(height: 8),
                            const Text(
                              'Responses will appear here once users submit the form',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 14, color: AppColors.textHint),
                            ),
                          ],
                        ),
                      )
                    : _subTab == 'Ringkasan'
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
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryView() {
    if (_responses.isEmpty) {
      return const Center(
        child: Text('No responses yet', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _responses.length,
      itemBuilder: (context, index) {
        final response = _responses[index];
        if (response is! Map) return const SizedBox.shrink();
        final submittedAt = response['submitted_at'] ?? '';
        final questions = response['questions'] ?? response['soal'] ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    response['username'] ?? 'Responden #${index + 1}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const Spacer(),
                  if (submittedAt is String && submittedAt.isNotEmpty)
                    Text(
                      submittedAt.substring(0, submittedAt.length > 19 ? 19 : submittedAt.length),
                      style: const TextStyle(fontSize: 11, color: AppColors.textHint),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${questions is List ? questions.length : 0} questions answered',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailView() {
    if (_responses.isEmpty) {
      return const Center(
        child: Text('No responses yet', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _responses.length,
      itemBuilder: (context, index) {
        final response = _responses[index];
        if (response is! Map) return const SizedBox.shrink();
        final questions = response['questions'] ?? response['soal'] ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Responden #${index + 1}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Divider(),
              if (questions is List)
                ...questions.map((q) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        q['question'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getAnswerText(q),
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                )),
            ],
          ),
        );
      },
    );
  }

  String _getAnswerText(Map<String, dynamic> question) {
    if (question['type'] == 'text') {
      return question['user_answer_text'] ?? 'No answer';
    }
    if (question['type'] == 'radio' || question['type'] == 'checkbox') {
      final options = question['options'] as List? ?? [];
      final selected = options.where((o) => o['is_user_selected'] == true).toList();
      if (selected.isEmpty) return 'No answer';
      return selected.map((o) => o['option_value'] ?? '').join(', ');
    }
    return 'No answer';
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
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
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
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isPublic ? 'Form can be accessed by anyone with the link' : 'Form is private',
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
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
                      color: isPublic ? AppColors.primary : AppColors.inputBorder,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 200),
                      alignment: isPublic ? Alignment.centerRight : Alignment.centerLeft,
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
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: formSlug));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Share link copied!'), backgroundColor: AppColors.success),
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
                        child: const Icon(Icons.share, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Share Form', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            SizedBox(height: 4),
                            Text('Copy the form link to share', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textSecondary),
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
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
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
                        child: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Delete Form', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.error)),
                            SizedBox(height: 4),
                            Text('Permanently delete this form', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.error),
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
                    'Edit/delete individual questions is not supported by the backend yet.',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
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
