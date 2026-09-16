import 'dart:convert';
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
import 'monitoring_screen.dart';
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
  int? _startAtMillis;      // loaded from backend via getFormBySlug
  String? _themeColor;      // loaded from backend via getFormBySlug
  bool _isSavingChanges = false;
  final GlobalKey<_SettingsTabState> _settingsKey = GlobalKey<_SettingsTabState>();

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
        // Flatten all page groups into a single list of soal items,
        // propagate group-level page ke setiap item (soal['page'] tidak ada
        // di response item soal).
        final rawSoal = data['soal'] is List ? data['soal'] as List : [];
        final List<dynamic> listSoal = rawSoal.expand<dynamic>((pageGroup) {
          if (pageGroup is Map && pageGroup['soal'] is List) {
            final pageNum = pageGroup['page'] is num
                ? (pageGroup['page'] as num).toInt()
                : 1;
            return (pageGroup['soal'] as List).map((s) {
              if (s is Map && s['page'] == null) {
                return {...s, 'page': pageNum};
              }
              return s;
            });
          }
          // Fallback: item is already a soal (flat list, old format)
          return [pageGroup];
        }).toList();

        setState(() {
          // Backend getFormBySlug returns: data: { form: formPayload, soal: [...] }.
          // Nilai setting berada di dalam form.setting dan form.token (nested),
          // bukan di top-level. Dukung juga bentuk flat (fallback) bila ada.
          final Map<String, dynamic> form =
              data['form'] is Map
                  ? Map<String, dynamic>.from(data['form'] as Map)
                  : <String, dynamic>{};
          final Map<String, dynamic> setting =
              form['setting'] is Map
                  ? Map<String, dynamic>.from(form['setting'] as Map)
                  : form;
          final Map<String, dynamic> token =
              form['token'] is Map
                  ? Map<String, dynamic>.from(form['token'] as Map)
                  : form;

          _isPublic =
              (setting['status'] ?? form['status'] ?? 'private') == 'public';

          // Parse duration from backend (integer minutes, nullable)
          final rawDur = setting['duration'] ?? form['duration'];
          _durationMinutes = rawDur == null
              ? 0
              : (rawDur is num
                    ? rawDur.toInt()
                    : int.tryParse(rawDur.toString()) ?? 0);

          // Parse is_random from backend (bool/int, nullable)
          final rawRandom = setting['is_random'] ?? form['is_random'];
          _isRandom = rawRandom == true ||
              rawRandom == 1 ||
              rawRandom?.toString() == 'true' ||
              rawRandom?.toString() == '1';

          // Parse token_respon (nested di form.token)
          _tokenRespon = (token['token_respon'] ?? form['token_respon'])
                  ?.toString() ??
              '';

          // Parse start_at (timestamp milliseconds, nullable)
          final rawStartAt = setting['start_at'] ?? form['start_at'];
          if (rawStartAt != null) {
            if (rawStartAt is num) {
              _startAtMillis = rawStartAt.toInt();
            } else {
              // Jika string ISO timestamp, parse ke milliseconds
              final parsed = DateTime.tryParse(rawStartAt.toString());
              _startAtMillis = parsed?.millisecondsSinceEpoch;
            }
          } else {
            _startAtMillis = null;
          }

          // Parse theme_color
          final rawTheme = setting['theme_color'] ?? form['theme_color'];
          _themeColor = rawTheme?.toString().isNotEmpty == true
              ? rawTheme.toString()
              : null;

          _questions = listSoal.asMap().entries.map((entry) {
            final index = entry.key;
            final soal = entry.value;
            final type = soal['type']?.toString() ?? 'text';
            // Parse score — DECIMAL(10,2) nullable dari backend
            final rawScore = soal['score'];
            final double? score = rawScore == null
                ? null
                : (rawScore is num
                    ? rawScore.toDouble()
                    : double.tryParse(rawScore.toString()));
            return {
              'id': soal['id']?.toString() ?? '',
              'number': index + 1,
              'question': soal['question']?.toString() ?? '',
              'type': type,
              'typeDisplay': _mapQuestionType(type),
              'options': soal['options'] ?? [],
              'audio': soal['audio']?.toString(),
              'page': soal['page'] is num ? (soal['page'] as num).toInt() : 1,
              'is_required': soal['is_required'],
              'score': score,
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

  Future<void> _saveAllChanges() async {
    if (_isSavingChanges) return;

    final settingsState = _settingsKey.currentState;
    if (settingsState == null) return;

    setState(() => _isSavingChanges = true);

    try {
      final result = await settingsState.saveAll();
      if (!mounted) return;

      if (result['success'] == true) {
        await _loadForm();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] as String? ?? 'Perubahan berhasil disimpan.'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] as String? ?? 'Gagal menyimpan perubahan.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSavingChanges = false);
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
                        key: _settingsKey,
                        isPublic: _isPublic,
                        formSlug: widget.formSlug,
                        onToggleStatus: _toggleStatus,
                        onDeleteForm: _deleteForm,
                        initialDurationMinutes: _durationMinutes,
                        initialIsRandom: _isRandom,
                        initialTokenRespon: _tokenRespon,
                        initialStartAtMillis: _startAtMillis,
                        initialThemeColor: _themeColor,
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
                color: _isSavingChanges
                    ? const Color(0xFF1B4A5E).withValues(alpha: 0.6)
                    : const Color(0xFF1B4A5E),
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: _isSavingChanges ? null : _saveAllChanges,
                  child: Container(
                    height: 52,
                    alignment: Alignment.center,
                    child: _isSavingChanges
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Row(
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

class _QuestionsTab extends StatefulWidget {
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

  @override
  State<_QuestionsTab> createState() => _QuestionsTabState();
}

class _QuestionsTabState extends State<_QuestionsTab> {
  int _selectedPage = 1;

  /// Page numbers yang muncul di daftar soal. Halaman kosong (belum ada soal)
  /// tetap muncul via tombol "+" sehingga bisa ditambahkan soal di sana.
  List<int> get _pageNumbers {
    final nums = <int>{};
    for (final q in widget.questions) {
      final p = q['page'] is num ? (q['page'] as num).toInt() : 1;
      nums.add(p);
    }
    if (nums.isEmpty) nums.add(1);
    return nums.toList()..sort();
  }

  Future<void> _openImportWord(BuildContext context) async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ImportWordScreen(
          formSlug: widget.formSlug,
          formTitle: widget.formTitle,
          targetPage: _selectedPage,
        ),
      ),
    );
    if (result == true) {
      widget.onRefresh();
    }
  }

  Future<void> _openAddQuestion(
    BuildContext context, {
    Map<String, dynamic>? questionToEdit,
  }) async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AddQuestionScreen(
          formTitle: widget.formTitle,
          formSlug: widget.formSlug,
          questionToEdit: questionToEdit,
          initialPage: _selectedPage,
        ),
      ),
    );
    if (result == true) {
      widget.onRefresh();
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
      widget.onRefresh();
    }
  }

  Future<void> _openScoreSheet(BuildContext context) async {
    final allQuestions = widget.questions;
    if (allQuestions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tambahkan soal terlebih dahulu.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ScoreSheet(
        questions: allQuestions,
        formSlug: widget.formSlug,
        onSaved: widget.onRefresh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final questions = widget.questions;
    final formSlug = widget.formSlug;
    final formTitle = widget.formTitle;
    final pageNumbers = _pageNumbers;
    final filteredQuestions = questions.where((q) {
      final p = q['page'] is num ? (q['page'] as num).toInt() : 1;
      return p == _selectedPage;
    }).toList();

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

        // ── Page selector ───────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          height: 42,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final p in pageNumbers) ...[
                GestureDetector(
                  onTap: () => setState(() => _selectedPage = p),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: _selectedPage == p
                          ? AppColors.primary
                          : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _selectedPage == p
                            ? AppColors.primary
                            : const Color(0xFFBDE8E0),
                      ),
                    ),
                    child: Text(
                      'Halaman $p',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _selectedPage == p
                            ? Colors.white
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ],
              // Tambah halaman baru (max + 1)
              GestureDetector(
                onTap: () {
                  final next = pageNumbers.isEmpty ? 1 : (pageNumbers.last + 1);
                  setState(() => _selectedPage = next);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFFBDE8E0),
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_rounded,
                          size: 16, color: AppColors.primary),
                      SizedBox(width: 4),
                      Text(
                        'Tambah Halaman',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
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
              Expanded(
                child: Text(
                  filteredQuestions.isEmpty
                      ? 'Halaman $_selectedPage kosong'
                      : 'Halaman $_selectedPage (${filteredQuestions.length})',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Buttons row — scrollable horizontal jika perlu
              Flexible(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Tombol Atur Skor
                      GestureDetector(
                        onTap: () => _openScoreSheet(context),
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
                              Icon(Icons.star_outline_rounded, size: 14, color: AppColors.warning),
                              const SizedBox(width: 4),
                              Text('Skor',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.warning,
                                      fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
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
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        Expanded(
          child: filteredQuestions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz_outlined,
                          size: 56,
                          color: AppColors.textSecondary.withOpacity(0.4)),
                      const SizedBox(height: 14),
                      const Text('Belum Ada Soal',
                          style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      const Text('Tap "+ Add" untuk menambahkan soal ke halaman ini',
                          style: TextStyle(fontSize: 13, color: AppColors.textHint)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  itemCount: filteredQuestions.length,
                  itemBuilder: (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _buildQuestionCard(
                        context, filteredQuestions[index]),
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
            child: Row(
              children: [
                Container(
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
                if (question['is_required'] == true ||
                    question['is_required'] == 1 ||
                    question['is_required']?.toString() == 'true' ||
                    question['is_required']?.toString() == '1') ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'WAJIB',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ],
                // Score badge
                if (question['score'] != null) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star_rounded, size: 11, color: AppColors.warning),
                        const SizedBox(width: 3),
                        Text(
                          () {
                            final s = question['score'] as double;
                            return s % 1 == 0
                                ? '${s.toInt()} pts'
                                : '${s.toStringAsFixed(2)} pts';
                          }(),
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.warning,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
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
                          child: QuillRichText(
                            content: val.toString(),
                            baseStyle: TextStyle(
                              fontSize: 13,
                              color: AppColors.textPrimary,
                              fontWeight: isCorrect
                                  ? FontWeight.w500
                                  : FontWeight.normal,
                            ),
                          ),
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

// ============ SCORE SHEET ============

/// Bottom sheet untuk mengatur skor semua soal sekaligus.
/// Mode Manual: creator memasukkan skor per soal.
/// Mode Otomatis: creator memasukkan total target, skor dibagi proporsional.
///
/// Algoritma pembagian otomatis (bebas pembulatan):
///   perSoal = floor(total / n)
///   sisa    = total - perSoal * n
///   → soal pertama 'sisa' buah mendapat perSoal + 1
///   Hasilnya: sum(scores) == target selalu tepat.
class _ScoreSheet extends StatefulWidget {
  final List<Map<String, dynamic>> questions;
  final String formSlug;
  final VoidCallback onSaved;

  const _ScoreSheet({
    required this.questions,
    required this.formSlug,
    required this.onSaved,
  });

  @override
  State<_ScoreSheet> createState() => _ScoreSheetState();
}

class _ScoreSheetState extends State<_ScoreSheet> {
  // 'manual' | 'auto'
  String _mode = 'auto';
  bool _isSaving = false;
  String _errorMsg = '';

  // Auto mode
  final _totalController = TextEditingController(text: '100');
  // Manual mode — satu controller per soal (urutan sesuai widget.questions)
  late List<TextEditingController> _manualControllers;

  @override
  void initState() {
    super.initState();
    _manualControllers = widget.questions.map((q) {
      final s = q['score'] as double?;
      final text = s == null
          ? ''
          : (s % 1 == 0 ? s.toInt().toString() : s.toStringAsFixed(2));
      return TextEditingController(text: text);
    }).toList();
  }

  @override
  void dispose() {
    _totalController.dispose();
    for (final c in _manualControllers) {
      c.dispose();
    }
    super.dispose();
  }

  // Hitung distribusi otomatis bebas float error
  // Mengembalikan list integer (atau double jika total tidak bulat)
  List<double> _calcAutoScores(double total, int n) {
    if (n <= 0) return [];
    // Jika total habis dibagi n → tiap soal sama
    if (total % n == 0) {
      final perSoal = total / n;
      return List.filled(n, perSoal);
    }
    // Integer distribution: base = floor(total/n), sisa soal pertama +1
    // Untuk total non-integer, gunakan pendekatan floating yang presisi
    final base = (total / n).floorToDouble();
    final remainder = total - base * n;
    // 'remainder' soal pertama mendapat base + 1 (jika total integer)
    // Untuk distribusi desimal: soal 0..remainder-1 mendapat base + 1
    final remainderInt = remainder.round();
    return List.generate(n, (i) => i < remainderInt ? base + 1 : base);
  }

  double get _currentTotal {
    if (_mode == 'auto') {
      return double.tryParse(_totalController.text.trim()) ?? 0;
    }
    return _manualControllers.fold<double>(0, (sum, c) {
      return sum + (double.tryParse(c.text.trim()) ?? 0);
    });
  }

  Future<void> _save() async {
    setState(() { _isSaving = true; _errorMsg = ''; });

    try {
      final n = widget.questions.length;
      List<double?> scores;

      if (_mode == 'auto') {
        final total = double.tryParse(_totalController.text.trim());
        if (total == null || total <= 0) {
          setState(() {
            _errorMsg = 'Masukkan total skor yang valid (> 0).';
            _isSaving = false;
          });
          return;
        }
        scores = _calcAutoScores(total, n);
      } else {
        // Manual — validasi tidak ada yang negatif
        scores = <double?>[];
        for (final c in _manualControllers) {
          final txt = c.text.trim();
          if (txt.isEmpty) {
            scores.add(null);
          } else {
            final v = double.tryParse(txt);
            if (v == null || v < 0) {
              setState(() {
                _errorMsg = 'Skor tidak valid. Pastikan semua nilai >= 0.';
                _isSaving = false;
              });
              return;
            }
            scores.add(v);
          }
        }
      }

      // PATCH setiap soal: PATCH /form/soal/:id body {soal:{score}, options:[]}
      // Menggunakan updateQuestion dari FormService (multipart, field 'data')
      for (var i = 0; i < widget.questions.length; i++) {
        final q = widget.questions[i];
        final soalIdStr = q['id']?.toString() ?? '';
        final soalId = int.tryParse(soalIdStr);
        if (soalId == null) continue;

        final newScore = scores.length > i ? scores[i] : null;

        // Payload minimal sesuai backend contract PATCH /form/soal/:id
        // field 'data' berisi JSON: { soal: { question, type, score }, options: [...] }
        final payload = <String, dynamic>{
          'soal': {
            'question': q['question'] ?? '',
            'type': q['type'] ?? 'text',
            'score': newScore,
          },
          'options': (q['options'] as List? ?? []).whereType<Map>().map((o) => {
            if (o['id'] != null) 'id': o['id'],
            'value': o['value'] ?? o['option_value'] ?? '',
            'is_correct': o['is_correct'] ?? false,
          }).toList(),
        };

        final result = await FormService.updateQuestion(
          soalId: soalId,
          payload: payload,
        );
        if (result['success'] != true) {
          setState(() {
            _errorMsg = result['message'] ?? 'Gagal menyimpan skor soal ${i + 1}.';
            _isSaving = false;
          });
          return;
        }
      }

      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onSaved();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _mode == 'auto'
                ? 'Skor otomatis berhasil disimpan (total: ${_currentTotal.toStringAsFixed(0)} pts).'
                : 'Skor manual berhasil disimpan.',
          ),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      setState(() {
        _errorMsg = 'Terjadi kesalahan: ${e.toString()}';
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final n = widget.questions.length;
    final maxHeight = MediaQuery.of(context).size.height * 0.85;

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFDDE5EE),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                const Icon(Icons.star_rounded, color: AppColors.warning, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Atur Skor Soal',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$n soal',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Mode selector
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
            child: Row(
              children: [
                Expanded(child: _modeTab('auto', 'Otomatis', Icons.auto_fix_high_rounded)),
                const SizedBox(width: 8),
                Expanded(child: _modeTab('manual', 'Manual', Icons.edit_note_rounded)),
              ],
            ),
          ),

          const SizedBox(height: 4),
          const Divider(height: 1),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: _mode == 'auto' ? _buildAutoMode(n) : _buildManualMode(),
            ),
          ),

          // Error
          if (_errorMsg.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, size: 16, color: AppColors.error),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMsg,
                        style: const TextStyle(fontSize: 12, color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Save button
          Padding(
            padding: EdgeInsets.fromLTRB(
                20, 8, 20, MediaQuery.of(context).padding.bottom + 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'Simpan Skor',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _modeTab(String mode, String label, IconData icon) {
    final selected = _mode == mode;
    return GestureDetector(
      onTap: () => setState(() { _mode = mode; _errorMsg = ''; }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : const Color(0xFFF0F4F8),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: selected ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAutoMode(int n) {
    final total = double.tryParse(_totalController.text.trim()) ?? 0;
    final valid = total > 0;
    final perSoal = valid && n > 0
        ? _calcAutoScores(total, n)
        : <double>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Penjelasan
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Sistem membagi total skor secara merata ke seluruh soal. '
                  'Jika tidak habis dibagi, soal pertama mendapat 1 poin lebih.',
                  style: TextStyle(fontSize: 12, color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Input total
        const Text(
          'Target Total Skor',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _totalController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            hintText: 'Contoh: 100 atau 200',
            suffixText: 'pts',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.inputBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.inputBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
          ),
          onChanged: (_) => setState(() {}),
        ),

        if (valid && perSoal.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text(
            'Distribusi Preview',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          // Preview distribusi (maks 5 soal ditampilkan)
          ...List.generate(
            perSoal.length > 5 ? 5 : perSoal.length,
            (i) {
              final s = perSoal[i];
              final label = s % 1 == 0
                  ? s.toInt().toString()
                  : s.toStringAsFixed(2);
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                        child: Text(
                          '${i + 1}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _previewQuestionText(widget.questions[i]),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$label pts',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.warning,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          if (perSoal.length > 5)
            Padding(
              padding: const EdgeInsets.only(top: 2, bottom: 6),
              child: Text(
                '... dan ${perSoal.length - 5} soal lainnya',
                style: const TextStyle(fontSize: 12, color: AppColors.textHint),
              ),
            ),
          const SizedBox(height: 8),
          // Konfirmasi total
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle_outline, size: 16, color: AppColors.success),
                const SizedBox(width: 8),
                Text(
                  'Total: ${perSoal.fold<double>(0, (a, b) => a + b).toStringAsFixed(0)} pts '
                  '(${perSoal.length} soal)',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.success,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildManualMode() {
    double total = _manualControllers.fold<double>(
        0, (s, c) => s + (double.tryParse(c.text.trim()) ?? 0));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Total display
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              const Icon(Icons.calculate_outlined, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                'Total skor saat ini: ${total % 1 == 0 ? total.toInt() : total.toStringAsFixed(2)} pts',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // List soal
        ...widget.questions.asMap().entries.map((entry) {
          final i = entry.key;
          final q = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _previewQuestionText(q),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 72,
                  child: TextFormField(
                    controller: _manualControllers[i],
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: '0',
                      hintStyle: const TextStyle(
                          color: AppColors.textHint, fontSize: 13),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: AppColors.inputBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            const BorderSide(color: AppColors.inputBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(
                            color: AppColors.primary, width: 1.5),
                      ),
                      suffixText: 'pts',
                      suffixStyle: const TextStyle(
                          fontSize: 10, color: AppColors.textHint),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 8),
      ],
    );
  }

  String _previewQuestionText(Map<String, dynamic> q) {
    final raw = q['question']?.toString() ?? '';
    if (raw.isEmpty) return '(Soal tanpa teks)';
    // Strip HTML dan Quill delta
    if (raw.startsWith('[')) {
      try {
        // Quill Delta — ambil plain text
        final decoded = jsonDecode(raw) as List;
        final buf = StringBuffer();
        for (final op in decoded) {
          if (op is Map && op['insert'] is String) {
            buf.write(op['insert']);
          }
        }
        final plain = buf.toString().replaceAll('\n', ' ').trim();
        return plain.isEmpty ? '(Soal tanpa teks)' : plain;
      } catch (_) {}
    }
    // HTML / plain
    return raw.replaceAll(RegExp(r'<[^>]*>'), '').trim();
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
  final int? initialStartAtMillis;
  final String? initialThemeColor;

  const _SettingsTab({
    super.key,
    required this.isPublic,
    required this.formSlug,
    required this.onToggleStatus,
    required this.onDeleteForm,
    this.initialDurationMinutes = 0,
    this.initialIsRandom = false,
    this.initialTokenRespon = '',
    this.initialStartAtMillis,
    this.initialThemeColor,
  });

  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab>
    with AutomaticKeepAliveClientMixin {
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
  // start_at disimpan sebagai milliseconds; null = tidak ada
  int? _startAtMillis;
  // theme_color dari backend — bisa diubah di Settings
  String? _themeColor;
  bool _isSavingTheme = false;

  // Preset warna yang sama dengan create_form_screen
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
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _isRandom = widget.initialIsRandom;
    _startAtMillis = widget.initialStartAtMillis;
    _themeColor = widget.initialThemeColor;
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
  void didUpdateWidget(covariant _SettingsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Saat induk melakukan reload (mis. selesai Save Changes), sinkronkan
    // nilai lokal agar menampilkan nilai terbaru dari server.
    if (oldWidget.initialDurationMinutes != widget.initialDurationMinutes) {
      _durationController.text = widget.initialDurationMinutes > 0
          ? widget.initialDurationMinutes.toString()
          : '';
    }
    if (oldWidget.initialIsRandom != widget.initialIsRandom) {
      _isRandom = widget.initialIsRandom;
    }
    if (oldWidget.initialTokenRespon != widget.initialTokenRespon) {
      _tokenController.text = widget.initialTokenRespon;
    }
    if (oldWidget.initialStartAtMillis != widget.initialStartAtMillis) {
      _startAtMillis = widget.initialStartAtMillis;
    }
    if (oldWidget.initialThemeColor != widget.initialThemeColor) {
      _themeColor = widget.initialThemeColor;
    }
  }

  @override
  void dispose() {
    _durationController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  /// Dipanggil oleh tombol "Save Changes" pada tab bar induk.
  /// Menyimpan SEMUA perubahan sekaligus: status (PUT /form) lalu pengaturan
  /// lain via PATCH /form/setting. Berhasil hanya jika semua request sukses.
  Future<Map<String, dynamic>> saveAll() async {
    final raw = _durationController.text.trim();
    final minutes = raw.isEmpty ? 0 : int.tryParse(raw);

    if (minutes == null || minutes < 0) {
      return {
        'success': false,
        'message': 'Masukkan angka menit yang valid (0 = tanpa batas).',
      };
    }

    final status = widget.isPublic ? 'public' : 'private';

    final statusResult = await FormService.updateFormStatus(
      slug: widget.formSlug,
      status: status,
    );
    if (!statusResult['success']) {
      return {
        'success': false,
        'message': statusResult['message'] ?? 'Gagal menyimpan status form.',
      };
    }

    final settingResult = await FormService.updateFormSetting(
      slug: widget.formSlug,
      durationMinutes: minutes == 0 ? null : minutes,
      startAtMillis: _startAtMillis,
      isRandom: _isRandom,
      tokenRespon: _tokenController.text.trim().isEmpty
          ? null
          : _tokenController.text.trim(),
      themeColor: _themeColor,
    );
    if (!settingResult['success']) {
      return {
        'success': false,
        'message': settingResult['message'] ?? 'Gagal menyimpan pengaturan.',
      };
    }

    return {'success': true, 'message': 'Perubahan berhasil disimpan.'};
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
      durationMinutes: minutes == 0 ? null : minutes,
      startAtMillis: _startAtMillis,
      isRandom: _isRandom,
      tokenRespon: _tokenController.text.trim().isEmpty
          ? null
          : _tokenController.text.trim(),
      themeColor: _themeColor,
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
      durationMinutes: _durationController.text.trim().isEmpty
          ? null
          : int.tryParse(_durationController.text.trim()),
      startAtMillis: _startAtMillis,
      isRandom: _isRandom,
      themeColor: _themeColor,
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
      durationMinutes: minutes == 0 ? null : minutes,
      startAtMillis: _startAtMillis,
      isRandom: value,
      tokenRespon: _tokenController.text.trim().isEmpty
          ? null
          : _tokenController.text.trim(),
      themeColor: _themeColor,
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

  Future<void> _saveThemeColor(String? selectedHex) async {
    setState(() {
      _themeColor = selectedHex;
      _isSavingTheme = true;
    });

    final raw = _durationController.text.trim();
    final minutes = raw.isEmpty ? 0 : (int.tryParse(raw) ?? 0);

    final result = await FormService.updateFormSetting(
      slug: widget.formSlug,
      durationMinutes: minutes == 0 ? null : minutes,
      startAtMillis: _startAtMillis,
      isRandom: _isRandom,
      tokenRespon: _tokenController.text.trim().isEmpty
          ? null
          : _tokenController.text.trim(),
      themeColor: selectedHex,
    );

    if (!mounted) return;
    setState(() => _isSavingTheme = false);

    if (!result['success']) {
      // Rollback ke nilai sebelumnya jika gagal
      setState(() => _themeColor = selectedHex == null ? null : _themeColor);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Gagal menyimpan warna tema.'),
          backgroundColor: AppColors.error,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(selectedHex == null
              ? 'Warna tema dihapus.'
              : 'Warna tema berhasil disimpan.'),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
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

          // ── WARNA TEMA ────────────────────────────────────────
          _buildSectionLabel('WARNA TEMA'),
          const SizedBox(height: 8),
          _buildCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCardHeader(
                  icon: Icons.palette_outlined,
                  title: 'Warna Tema Form',
                  subtitle: 'Pilih warna untuk tampilan form.',
                ),
                const SizedBox(height: 14),
                _isSavingTheme
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      )
                    : Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          // Opsi "Tanpa warna"
                          GestureDetector(
                            onTap: () => _saveThemeColor(null),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: _themeColor == null
                                      ? AppColors.primary
                                      : AppColors.inputBorder,
                                  width: _themeColor == null ? 2.5 : 1.5,
                                ),
                              ),
                              child: _themeColor == null
                                  ? const Icon(Icons.close,
                                      size: 16,
                                      color: AppColors.primary)
                                  : const Icon(Icons.close,
                                      size: 14,
                                      color: AppColors.textHint),
                            ),
                          ),
                          ..._presetColors.map((color) {
                            final hex = color['hex'] as String;
                            final isSelected = _themeColor == hex;
                            final colorVal = Color(
                              int.parse(hex.replaceFirst('#', '0xFF')),
                            );
                            return GestureDetector(
                              onTap: () => _saveThemeColor(hex),
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
                                            color: colorVal
                                                .withOpacity(0.6),
                                            blurRadius: 8,
                                            spreadRadius: 1,
                                          ),
                                        ]
                                      : null,
                                ),
                                child: isSelected
                                    ? const Icon(Icons.check,
                                        color: Colors.white, size: 18)
                                    : null,
                              ),
                            );
                          }),
                        ],
                      ),
                if (_themeColor != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Warna aktif: $_themeColor',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
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

          // ── MONITORING ────────────────────────────────────────
          _buildSectionLabel('MONITORING'),
          const SizedBox(height: 8),
          _buildCard(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MonitoringScreen(
                    formSlug: widget.formSlug,
                    formTitle: 'Monitoring Peserta',
                  ),
                ),
              );
            },
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.people_outline,
                      color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Status Peserta',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary)),
                      Text('Lihat dan kelola status pengerjaan peserta',
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
