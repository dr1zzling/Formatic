import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/config/api_config.dart';
import '../../../core/services/form_service.dart';

const _questionTypes = [
  ('radio', 'Pilihan Ganda'),
  ('checkbox', 'Kotak Centang'),
  ('text', 'Jawaban Singkat'),
  ('file', 'Unggah File'),
];

const _tabs = ['Pertanyaan', 'Jawaban', 'Setelan'];

class FormDetailScreen extends StatefulWidget {
  final String formId;
  final String formTitle;
  final String? formStatus;
  final String? formSlug;

  const FormDetailScreen({
    super.key,
    required this.formId,
    required this.formTitle,
    this.formStatus,
    this.formSlug,
  });

  @override
  State<FormDetailScreen> createState() => _FormDetailScreenState();
}

class _FormDetailScreenState extends State<FormDetailScreen> {
  String _formSlug = '';
  String _formId = '';
  Map<String, dynamic>? _form;

  String _activeTab = 'Pertanyaan';
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isPublishing = false;
  String _error = '';

  List<Map<String, dynamic>> _questions = [];

  int _totalResponses = 0;
  List<Map<String, dynamic>> _responses = [];
  bool _responsesLoading = false;
  String _responsesError = '';

  String get _fillUrl => '${ApiConfig.formApiBaseUrl}/fill/$_formSlug';

  @override
  void initState() {
    super.initState();
    _formSlug = widget.formSlug ?? '';
    _formId = widget.formId;
    _loadForm();
  }

  Future<void> _loadForm() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    if (_formSlug.isEmpty) {
      setState(() {
        _error = 'Form tidak ditemukan.';
        _isLoading = false;
      });
      return;
    }

    final result = await FormService.getFormBySlug(_formSlug);

    if (!mounted) return;

    if (result['success']) {
      final f = result['data'] is Map
          ? result['data']['data'] is Map
              ? Map<String, dynamic>.from(result['data']['data'] as Map)
              : <String, dynamic>{}
          : <String, dynamic>{};

      final List<dynamic> soal =
          f['soal'] is List ? f['soal'] : <dynamic>[];

      setState(() {
        _form = f;
        _formId = (f['form_id'] ?? _formId).toString();
        _questions = soal.map((s) {
          final sMap = s is Map ? Map<String, dynamic>.from(s) : <String, dynamic>{};
          return {
            'id': sMap['id']?.toString(),
            'question': sMap['question'] ?? '',
            'type': sMap['type'] ?? 'radio',
            'required': true,
            'options': (sMap['options'] is List ? sMap['options'] : [])
                .map((o) => {
                      'id': o['id'],
                      'value': o['option_value'] ?? o['value'] ?? '',
                      'is_correct': o['is_correct'] == true || o['is_correct'] == 1,
                    })
                .toList(),
          };
        }).toList();
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = result['message'] ?? 'Form tidak ditemukan.';
        _isLoading = false;
      });
    }
  }

  bool get _isPublic =>
      (_form?['form_status'] ?? widget.formStatus ?? '') == 'public';

  void _addQuestion() {
    setState(() {
      _questions.add({
        '_new': true,
        'question': '',
        'type': 'radio',
        'required': true,
        'options': [
          {'value': 'Opsi 1', 'is_correct': false},
          {'value': 'Opsi 2', 'is_correct': false},
        ],
      });
    });
  }

  void _updateQ(int idx, String field, dynamic val) {
    setState(() => _questions[idx][field] = val);
  }

  void _updateOpt(int qIdx, int oIdx, String val) {
    setState(() {
      _questions[qIdx]['options'][oIdx]['value'] = val;
    });
  }

  void _toggleCorrect(int qIdx, int oIdx) {
    final q = _questions[qIdx];
    if (q['type'] == 'radio') {
      setState(() {
        for (final o in q['options'] as List) {
          o['is_correct'] = false;
        }
        q['options'][oIdx]['is_correct'] = true;
      });
    } else {
      setState(() {
        q['options'][oIdx]['is_correct'] =
            !(q['options'][oIdx]['is_correct'] ?? false);
      });
    }
  }

  void _addOpt(int qIdx) {
    setState(() {
      _questions[qIdx]['options']
          .add({'value': 'Opsi ${_questions[qIdx]['options'].length + 1}', 'is_correct': false});
    });
  }

  void _removeOpt(int qIdx, int oIdx) {
    setState(() => _questions[qIdx]['options'].removeAt(oIdx));
  }

  void _removeQ(int idx) {
    setState(() => _questions.removeAt(idx));
  }

  void _duplicateQ(int idx) {
    final copy = Map<String, dynamic>.from(_questions[idx]);
    copy['_new'] = true;
    copy['id'] = null;
    setState(() => _questions.insert(idx + 1, copy));
  }

  Future<void> _saveQuestions() async {
    final newOnes = _questions.where((q) => q['_new'] == true).toList();
    if (newOnes.isEmpty) {
      _showToast('Tidak ada soal baru.');
      return;
    }
    if (newOnes.any((q) => (q['question'] as String).trim().isEmpty)) {
      setState(() => _error = 'Pertanyaan wajib diisi.');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = '';
    });

    final payload = newOnes.map((q) {
      final hasOpts = ['radio', 'checkbox', 'rating'].contains(q['type']);
      return {
        'soal': {'question': q['question'], 'type': q['type']},
        'options': hasOpts
            ? (q['options'] as List)
                .where((o) => (o['value'] as String).trim().isNotEmpty)
                .map((o) => {'value': o['value'], 'is_correct': o['is_correct'] ?? false})
                .toList()
            : <Map<String, dynamic>>[],
      };
    }).toList();

    final result = await FormService.createQuestions(
      formSlug: _formSlug,
      questions: payload,
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result['success']) {
      _showToast('${newOnes.length} soal berhasil disimpan!');
      _loadForm();
    } else {
      setState(() => _error = result['message'] ?? 'Gagal menyimpan.');
    }
  }

  Future<void> _publishForm() async {
    if (_form == null) return;
    final newStatus = _isPublic ? 'private' : 'public';

    setState(() {
      _isPublishing = true;
      _error = '';
    });

    final result = await FormService.updateFormStatus(_formSlug, newStatus);

    if (!mounted) return;
    setState(() => _isPublishing = false);

    if (result['success']) {
      _showToast(newStatus == 'public'
          ? 'Form berhasil dipublikasi! 🌐'
          : 'Form dijadikan privat.');
      _loadForm();
    } else {
      setState(() => _error = result['message'] ?? 'Gagal mengubah status.');
    }
  }

  void _copyLink() {
    Clipboard.setData(ClipboardData(text: _fillUrl));
    _showToast('Link disalin!');
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1F2937),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _loadResponses() async {
    if (_responses.isNotEmpty || _responsesLoading) return;
    if (_formId.isEmpty) return;

    setState(() {
      _responsesLoading = true;
      _responsesError = '';
    });

    final result = await FormService.getFormResponses(_formId);

    if (!mounted) return;
    setState(() => _responsesLoading = false);

    if (result['success']) {
      final data = result['data'] is Map
          ? Map<String, dynamic>.from(result['data'] as Map)
          : <String, dynamic>{};
      final list = data['respon'] is List ? data['respon'] : <dynamic>[];
      setState(() {
        _totalResponses = data['total_respon'] is int ? data['total_respon'] : 0;
        _responses = list
            .map((r) => Map<String, dynamic>.from(r as Map))
            .toList();
      });
    } else {
      setState(() {
        _responsesError =
            result['message'] ?? 'Gagal memuat respons.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? _buildCenteredLoading()
          : _error.isNotEmpty && _form == null
              ? _buildErrorState()
              : Column(
                  children: [
                    _buildTopBar(),
                    _buildTabs(),
                    Expanded(child: _buildTabContent()),
                  ],
                ),
    );
  }

  Widget _buildCenteredLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
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
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF005FB3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Kembali',
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back, color: Color(0xFF9CA3AF)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _form?['form_title'] ?? widget.formTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                if ((_form?['category'] ?? '') != '')
                  Text(
                    '${_form?['category']}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
              ],
            ),
          ),
          _topBtn(Icons.qr_code, 'QR Code', () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => _QrModal(slug: _formSlug, fillUrl: _fillUrl),
            );
          }),
          _topBtn(Icons.link, 'Salin link', _copyLink),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: _isPublishing ? null : _publishForm,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                gradient: _isPublic
                    ? const LinearGradient(
                        colors: [Color(0xFF16A34A), Color(0xFF22C55E)],
                      )
                    : AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: _isPublishing
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isPublic ? Icons.lock_outline : Icons.public,
                          size: 13,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _isPublic ? 'Privat' : 'Publish',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _topBtn(IconData icon, String tooltip, VoidCallback onTap) {
    return IconButton(
      onPressed: onTap,
      tooltip: tooltip,
      icon: Icon(icon, size: 18, color: const Color(0xFF9CA3AF)),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildTabs() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: _tabs.map((tab) {
          final active = _activeTab == tab;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() => _activeTab = tab);
                if (tab == 'Jawaban') _loadResponses();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: active
                          ? const Color(0xFF3B82F6)
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        tab,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: active
                              ? const Color(0xFF2563EB)
                              : const Color(0xFF6B7280),
                        ),
                      ),
                      if (tab == 'Jawaban') ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE),
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: Text(
                            '$_totalResponses',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case 'Pertanyaan':
        return _buildQuestionsTab();
      case 'Jawaban':
        return _buildResponsesTab();
      case 'Setelan':
        return const _SettingsTab();
      default:
        return _buildQuestionsTab();
    }
  }

  // ── Pertanyaan ────────────────────────────────────────────────────────────
  Widget _buildQuestionsTab() {
    return Container(
      color: const Color(0xFFF9FAFB),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          // Form title card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: const Border(
                left: BorderSide(color: Color(0xFF3B82F6), width: 4),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _form?['form_title'] ?? widget.formTitle,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Deskripsi form (opsional)...',
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
              child: Text(
                _error,
                style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626)),
              ),
            ),
          ],

          const SizedBox(height: 12),

          ...List.generate(_questions.length, (qIdx) {
            final q = _questions[qIdx];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _QuestionCard(
                question: q,
                index: qIdx,
                onUpdate: (field, value) => _updateQ(qIdx, field, value),
                onUpdateOpt: (oIdx, value) => _updateOpt(qIdx, oIdx, value),
                onToggleCorrect: (oIdx) => _toggleCorrect(qIdx, oIdx),
                onAddOpt: () => _addOpt(qIdx),
                onRemoveOpt: (oIdx) => _removeOpt(qIdx, oIdx),
                onRemove: () => _removeQ(qIdx),
                onDuplicate: () => _duplicateQ(qIdx),
              ),
            );
          }),

          // Tambah pertanyaan
          GestureDetector(
            onTap: _addQuestion,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFE5E7EB),
                  width: 2,
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, size: 16, color: Color(0xFF9CA3AF)),
                  SizedBox(width: 6),
                  Text(
                    'Tambah Pertanyaan',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Simpan Soal Baru (mobile)
          GestureDetector(
            onTap: _isSaving ? null : _saveQuestions,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Simpan Soal Baru',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Jawaban ───────────────────────────────────────────────────────────────
  Widget _buildResponsesTab() {
    return Container(
      color: const Color(0xFFF9FAFB),
      child: _responsesLoading
          ? const Center(
              child: SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: AppColors.primary,
                ),
              ),
            )
          : _responsesError.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🔒', style: TextStyle(fontSize: 36)),
                      const SizedBox(height: 8),
                      Text(
                        _responsesError,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Stat cards
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.4,
                      children: [
                        _statCard('📊', '$_totalResponses', 'Total Respons'),
                        _statCard('⏱', '—', 'Rata-rata Waktu'),
                        _statCard(
                          '✅',
                          _totalResponses > 0 ? '100%' : '—',
                          'Tingkat Selesai',
                        ),
                        _statCard('📅', '$_totalResponses', 'Hari Ini'),
                      ],
                    ),

                    const SizedBox(height: 20),

                    if (_responses.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Column(
                          children: const [
                            Text('📭', style: TextStyle(fontSize: 44)),
                            SizedBox(height: 12),
                            Text(
                              'Belum ada respons',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF374151),
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Bagikan link form untuk mulai mengumpulkan jawaban.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ..._responses.asMap().entries.map((entry) {
                        final resp = entry.value;
                        final idx = entry.key;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ResponseCard(
                            number: idx + 1,
                            response: resp,
                          ),
                        );
                      }),
                  ],
                ),
    );
  }

  Widget _statCard(String icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(14),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(icon, style: const TextStyle(fontSize: 22)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }

  // ── Setelan ───────────────────────────────────────────────────────────────
}

class _EditField extends StatefulWidget {
  final String initial;
  final bool enabled;
  final String? hint;
  final ValueChanged<String> onChanged;
  final TextStyle? style;
  final InputDecoration decoration;

  const _EditField({
    required this.initial,
    this.enabled = true,
    this.hint,
    required this.onChanged,
    this.style,
    required this.decoration,
  });

  @override
  State<_EditField> createState() => _EditFieldState();
}

class _EditFieldState extends State<_EditField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initial);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      enabled: widget.enabled,
      onChanged: widget.onChanged,
      style: widget.style,
      decoration: widget.decoration.copyWith(hintText: widget.hint),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  final Map<String, dynamic> question;
  final int index;
  final void Function(String field, dynamic value) onUpdate;
  final void Function(int oIdx, String value) onUpdateOpt;
  final void Function(int oIdx) onToggleCorrect;
  final VoidCallback onAddOpt;
  final void Function(int oIdx) onRemoveOpt;
  final VoidCallback onRemove;
  final VoidCallback onDuplicate;

  const _QuestionCard({
    required this.question,
    required this.index,
    required this.onUpdate,
    required this.onUpdateOpt,
    required this.onToggleCorrect,
    required this.onAddOpt,
    required this.onRemoveOpt,
    required this.onRemove,
    required this.onDuplicate,
  });

  bool get _isNew => question['_new'] == true;
  bool get _hasOptions => ['radio', 'checkbox', 'rating'].contains(question['type']);

  @override
  Widget build(BuildContext context) {
    final options = question['options'] as List? ?? [];
    final typeRaw = question['type'] as String? ?? 'radio';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isNew ? const Color(0xFF3B82F6) : const Color(0xFFF3F4F6),
        ),
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
          // Question input + type
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  '${index + 1}.',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _EditField(
                  initial: question['question'] as String? ?? '',
                  enabled: _isNew,
                  hint: 'Masukkan pertanyaan...',
                  onChanged: (v) => onUpdate('question', v),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF374151),
                  ),
                  decoration: const InputDecoration(
                    hintStyle: TextStyle(fontSize: 14, color: Color(0xFF9CA3AF)),
                    border: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFF3B82F6)),
                    ),
                    disabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0xFFF3F4F6)),
                    ),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Type dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: typeRaw,
                    isDense: true,
                    onChanged: _isNew
                        ? (v) => onUpdate('type', v)
                        : null,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF374151)),
                    items: _questionTypes
                        .map((t) => DropdownMenuItem(
                              value: t.$1,
                              child: Text(t.$2),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Options
          if (_hasOptions)
            Padding(
              padding: const EdgeInsets.only(left: 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_isNew)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 6),
                      child: Text(
                        'Ketuk ikon di kiri opsi untuk menandai jawaban benar',
                        style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                      ),
                    ),
                  ...options.asMap().entries.map((entry) {
                    final oIdx = entry.key;
                    final opt = entry.value;
                    final isCorrect = opt['is_correct'] == true;
                    final marker = typeRaw == 'checkbox'
                        ? (isCorrect ? Icons.check_box : Icons.check_box_outline_blank)
                        : (isCorrect ? Icons.check_circle : Icons.radio_button_unchecked);
                    return Row(
                      children: [
                        GestureDetector(
                          onTap: _isNew ? () => onToggleCorrect(oIdx) : null,
                          child: Icon(
                            marker,
                            size: 16,
                            color: isCorrect
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFD1D5DB),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _EditField(
                            initial: opt['value'] as String? ?? '',
                            enabled: _isNew,
                            onChanged: (v) => onUpdateOpt(oIdx, v),
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF4B5563),
                            ),
                            decoration: const InputDecoration(
                              isDense: true,
                              enabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Color(0xFFF3F4F6)),
                              ),
                              focusedBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Color(0xFF60A5FA)),
                              ),
                              disabledBorder: UnderlineInputBorder(
                                borderSide: BorderSide(color: Color(0xFFF9FAFB)),
                              ),
                            ),
                          ),
                        ),
                        if (_isNew)
                          GestureDetector(
                            onTap: () => onRemoveOpt(oIdx),
                            child: const Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(
                                Icons.close,
                                size: 14,
                                color: Color(0xFFD1D5DB),
                              ),
                            ),
                          ),
                      ],
                    );
                  }),
                  if (_isNew)
                    GestureDetector(
                      onTap: onAddOpt,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 22, top: 8),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.add, size: 12, color: Color(0xFF9CA3AF)),
                            SizedBox(width: 4),
                            Text(
                              'Tambah opsi',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

          if (typeRaw == 'text')
            const Padding(
              padding: EdgeInsets.only(left: 22, top: 4),
              child: Text(
                'Jawaban teks pendek...',
                style: TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
              ),
            ),

          if (typeRaw == 'file')
            const Padding(
              padding: EdgeInsets.only(left: 22, top: 6),
              child: Row(
                children: [
                  Text('📎', style: TextStyle(fontSize: 13)),
                  SizedBox(width: 6),
                  Text(
                    'Pengguna dapat mengunggah file',
                    style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                  ),
                ],
              ),
            ),

          // Footer: duplicate / delete / wajib
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.only(top: 10),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFFF9FAFB))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                GestureDetector(
                  onTap: onDuplicate,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
                    child: const Icon(
                      Icons.copy_outlined,
                      size: 14,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: onRemove,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
                    child: const Icon(
                      Icons.delete_outline,
                      size: 14,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Row(
                  children: [
                    Text(
                      'Wajib',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Transform.scale(
                      scale: 0.8,
                      child: Checkbox(
                        value: question['required'] == true,
                        activeColor: const Color(0xFF3B82F6),
                        onChanged: (v) => onUpdate('required', v),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ResponseCard extends StatelessWidget {
  final int number;
  final Map<String, dynamic> response;

  const _ResponseCard({required this.number, required this.response});

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    final answers = response['answers'] is List ? response['answers'] : <dynamic>[];

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Respons #$number',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF374151),
                ),
              ),
              Text(
                _formatDate(response['submitted_at']?.toString()),
                style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...answers.asMap().entries.map((entry) {
            final aIdx = entry.key;
            final ans = entry.value is Map
                ? Map<String, dynamic>.from(entry.value as Map)
                : <String, dynamic>{};
            final value = ans['answer_text'] ??
                ans['option_value'] ??
                (ans['file_name'] != null ? '📎 ${ans['file_name']}' : '—');
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 16,
                    child: Text(
                      '${aIdx + 1}.',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${ans['question'] ?? ''}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        Text(
                          '$value',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _SettingsTab extends StatefulWidget {
  const _SettingsTab();

  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab> {
  final List<bool> _main = [false, false, false];
  final List<bool> _defaults = [false, false];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF9FAFB),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _settingRow('Jadikan semua kuis', 'Penetapan poin yang tepat dan nilai pertanyaan', _main[0], (v) => setState(() => _main[0] = v)),
          _settingRow('Jawaban', 'Mengoleksi data respon, nilai dan lainnya', _main[1], (v) => setState(() => _main[1] = v)),
          _settingRow('Presentasi', 'Pengaturan cara formulir dan respons ditampilkan', _main[2], (v) => setState(() => _main[2] = v)),
          const SizedBox(height: 4),
          Container(
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
                const Text(
                  'DEFAULT',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF9CA3AF),
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                _defaultRow('Formulir default', 'Gunakan pengaturan untuk formulir ini dan formulir baru', _defaults[0], (v) => setState(() => _defaults[0] = v)),
                _defaultRow('Pertanyaan default', 'Gunakan pengaturan sebagai pertanyaan baru', _defaults[1], (v) => setState(() => _defaults[1] = v)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingRow(String title, String desc, bool value, ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
          _Toggle(value: value, onChanged: onChanged),
        ],
      ),
    );
  }

  Widget _defaultRow(String title, String desc, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF374151),
                  ),
                ),
                Text(
                  desc,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
          _Toggle(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _Toggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _Toggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44,
        height: 24,
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          gradient: value ? AppColors.primaryGradient : null,
          color: value ? null : const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(50),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 200),
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 20,
            height: 20,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Color(0x22000000), blurRadius: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QrModal extends StatefulWidget {
  final String slug;
  final String fillUrl;

  const _QrModal({required this.slug, required this.fillUrl});

  @override
  State<_QrModal> createState() => _QrModalState();
}

class _QrModalState extends State<_QrModal> {
  String? _qrDataUrl;
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadQr();
  }

  Future<void> _loadQr() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    final result = await FormService.generateQrCode(widget.fillUrl);
    if (!mounted) return;
    if (result['success']) {
      final data = result['data'] is Map
          ? Map<String, dynamic>.from(result['data'] as Map)
          : <String, dynamic>{};
      setState(() {
        _qrDataUrl = data['qrCode'];
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = result['message'] ?? 'Gagal memuat QR Code.';
        _isLoading = false;
      });
    }
  }

  Uint8List? _decodeQrBytes() {
    final dataUrl = _qrDataUrl;
    if (dataUrl == null || dataUrl.isEmpty) return null;
    try {
      final base64Data =
          dataUrl.contains(',') ? dataUrl.split(',').last : dataUrl;
      return base64Decode(base64Data);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bytes = _decodeQrBytes();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.qr_code, size: 18, color: Color(0xFF1F2937)),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'QR Code Form',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: const Icon(Icons.close, size: 18, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: 192,
              height: 192,
              child: Center(
                child: _isLoading
                    ? const SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          color: AppColors.primary,
                        ),
                      )
                    : _error.isNotEmpty
                        ? Text(
                            _error,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFFEF4444),
                            ),
                          )
                        : bytes == null
                            ? const Icon(
                                Icons.qr_code,
                                size: 80,
                                color: Color(0xFF9CA3AF),
                              )
                            : Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  border: Border.all(color: const Color(0xFFF3F4F6)),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Image.memory(bytes, fit: BoxFit.contain),
                              ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              widget.fillUrl,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: widget.fillUrl));
                      Navigator.of(context).pop();
                    },
                    child: Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: const Center(
                        child: Text(
                          'Salin Link',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: bytes == null
                        ? null
                        : () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Gunakan Salin Link untuk membagikan QR.'),
                                behavior: SnackBarBehavior.floating,
                                backgroundColor: Color(0xFF1F2937),
                              ),
                            );
                          },
                    child: Container(
                      height: 42,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text(
                          'Download QR',
                          style: TextStyle(
                            fontSize: 13,
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
}
