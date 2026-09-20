import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/config/api_config.dart';
import '../../../core/utils/html_utils.dart';
import '../widgets/form_audio_player.dart';
import '../../history/screens/history_screen.dart';

class FormViewerScreen extends StatefulWidget {
  final String slug;

  const FormViewerScreen({super.key, required this.slug});

  @override
  State<FormViewerScreen> createState() => _FormViewerScreenState();
}

class _FormViewerScreenState extends State<FormViewerScreen> {
  bool _isLoading = true;
  String _errorMessage = '';
  bool _isSubmitting = false;
  bool _isSubmitted = false;

  String _formTitle = '';
  String _category = '';
  String _tokenRespon = '';

  // Quiz / survey mode
  bool _isQuiz = false;
  bool _isRandom = false;
  // Per-page groups untuk quiz mode (List<{page, soal:[]}>)
  List<Map<String, dynamic>> _pageGroups = [];
  int _currentPageIndex = 0;
  // Set of soal IDs yang ditandai ragu-ragu
  final Set<int> _doubtfulIds = {};

  // Debounce laporan progress monitoring (paritas Web FillForm: 400ms)
  Timer? _progressDebounce;

  // Timer state
  int? _durationSeconds;        // durasi dalam detik (duration menit * 60)
  int? _remainingSeconds;       // sisa waktu countdown
  int? _timerEndMillis;         // absolute end timestamp (ms), persisted
  Timer? _countdownTimer;
  bool _hasShownWarning = false;

  // Timestamps dari backend (digunakan untuk hitung timer end)
  int? _formStartAtMillis;      // form.start_at (form settings) — ms
  int? _submitStartAtMillis;    // form_submit.start_at (dari check-token response) — ms

  bool _tokenValidated = false;
  bool _tokenNeeded = false;

  // Pre-Start screen state
  bool _preStartCompleted = false;
  String _formBanner = '';
  final TextEditingController _tokenController = TextEditingController();
  bool _isCheckingToken = false;
  String _tokenError = '';

  List<Map<String, dynamic>> _questions = [];
  
  // Text input controllers - keyed by question ID to avoid mixing up answers
  // Maps question ID → TextEditingController
  final Map<dynamic, TextEditingController> _textControllers = {};

  @override
  void initState() {
    super.initState();
    _loadForm();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _progressDebounce?.cancel();
    _tokenController.dispose();
    // Dispose all text controllers
    for (final controller in _textControllers.values) {
      controller.dispose();
    }
    _textControllers.clear();
    super.dispose();
  }

  Future<void> _loadForm() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    
    // Clear old controllers when loading new form
    for (final controller in _textControllers.values) {
      controller.dispose();
    }
    _textControllers.clear();

    try {
      final result = await FormService.getFormBySlug(widget.slug);
      if (!mounted) return;

      if (result['success']) {
        final data = result['data']['data'];
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
          return [pageGroup];
        }).toList();

        setState(() {
          // Backend getFormBySlug returns: data: { form: formPayload, soal: [...] }.
          // Nilai setting berada di dalam form.setting, form.token, form.kategori.
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
          final Map<String, dynamic> kategori =
              form['kategori'] is Map
                  ? Map<String, dynamic>.from(form['kategori'] as Map)
                  : <String, dynamic>{};

          _formTitle = form['title']?.toString() ??
              data['title']?.toString() ??
              'Untitled Form';
          _category = (kategori['primary_kategori'] ??
              data['category'] ??
              '')
              .toString();
          _tokenRespon = (token['token_respon'] ??
              data['token_respon'])
              ?.toString() ?? '';
          _tokenNeeded = _tokenRespon.trim().isNotEmpty;
          _tokenValidated = false;
          _formBanner = form['banner']?.toString() ??
              data['banner']?.toString() ??
              '';

          // Parse duration dari backend (integer menit)
          final rawDur = setting['duration'] ?? data['duration'];
          final int? duration = rawDur == null
              ? null
              : (rawDur is num ? rawDur.toInt() : int.tryParse(rawDur.toString()));
          _durationSeconds = (duration != null && duration > 0) ? duration * 60 : null;

          // Parse form.start_at (timestamp milliseconds dari form settings)
          final rawStartAt = setting['start_at'] ?? data['start_at'];
          if (rawStartAt != null) {
            if (rawStartAt is num && rawStartAt > 0) {
              _formStartAtMillis = rawStartAt.toInt();
            } else if (rawStartAt is String) {
              // Bisa ISO string atau numeric string
              final asInt = int.tryParse(rawStartAt);
              if (asInt != null && asInt > 0) {
                _formStartAtMillis = asInt;
              } else {
                final parsed = DateTime.tryParse(rawStartAt);
                _formStartAtMillis = parsed?.millisecondsSinceEpoch;
              }
            }
          }

          // Parse is_random — bisa bool atau int dari backend
          final rawRandom = setting['is_random'] ?? data['is_random'];
          _isRandom = rawRandom == true ||
              rawRandom == 1 ||
              rawRandom?.toString() == 'true' ||
              rawRandom?.toString() == '1';

          // Tentukan mode quiz berdasarkan primary_kategori
          final primaryKat = _category.toLowerCase();
          _isQuiz = primaryKat.contains('ujian');

          _questions = listSoal.asMap().entries.map((entry) {
            final index = entry.key;
            final soal = entry.value;
            final type = soal['type']?.toString() ?? 'text';
            return {
              'id': soal['id'],
              'number': index + 1,
              'question': soal['question']?.toString() ?? '',
              'type': type,
              'typeDisplay': _mapQuestionType(type),
              'options': soal['options'] ?? [],
              'image': soal['image']?.toString(),
              'audio': soal['audio']?.toString(),
              // page diambil dari soal item langsung (sudah di-flatten dari groups)
              'page': soal['page'] is num ? (soal['page'] as num).toInt() : 1,
              'is_required': soal['is_required'],
              'answer': null,
            };
          }).toList();

          // Build page groups dari rawSoal (format [{page, soal:[]}])
          // Digunakan untuk quiz mode step-by-step
          _pageGroups = _buildPageGroups(rawSoal, _isRandom, _isQuiz);
          _currentPageIndex = 0;
          _isLoading = false;
        });

        // Form tanpa token: daftarkan pengerjaan ke backend sekarang
        // (paritas Web FillForm). Backend menolak submit tanpa record
        // form_submit (400 "Submit form belum dimulai").
        if (!_tokenNeeded) {
          _registerNoTokenProgress();
        }
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load form';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _onStartForm() async {
    if (_tokenNeeded) {
      final token = _tokenController.text.trim();
      if (token.isEmpty) {
        setState(() => _tokenError = 'Token wajib diisi.');
        return;
      }
      setState(() {
        _isCheckingToken = true;
        _tokenError = '';
      });
      final check = await FormService.checkTokenResponden(
        formSlug: widget.slug,
        token: token,
      );
      if (!mounted) return;
      setState(() => _isCheckingToken = false);
      if (!check['success']) {
        final statusCode = check['statusCode'] as int? ?? 0;
        final backendMessage = check['message'] as String? ?? '';
        final String displayError;
        if (statusCode >= 500) {
          // HTTP 5xx — masalah server/database, bukan token salah.
          // Sertakan pesan backend asli untuk membantu diagnosa.
          // Jangan tampilkan raw stack trace — hanya message level saja.
          final serverDetail = backendMessage.isNotEmpty
              ? backendMessage
              : 'HTTP $statusCode';
          displayError =
              'Server mengalami gangguan saat memproses token ($serverDetail). '
              'Coba beberapa saat lagi atau hubungi penyelenggara form.';
        } else if (statusCode == 0) {
          // Network / timeout error.
          displayError = backendMessage.isNotEmpty
              ? backendMessage
              : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
          // HTTP 4xx — token salah, expired, atau form private.
          // Tampilkan pesan dari backend langsung karena sudah actionable.
          displayError = backendMessage.isNotEmpty
              ? backendMessage
              : 'Token yang Anda masukkan salah. Silakan periksa kembali.';
        }
        setState(() => _tokenError = displayError);
        return;
      }
      // Ambil form_submit.start_at dari response check-token
      // Backend: form_submit table memiliki kolom start_at (timestamp default now())
      // Response check-token mengembalikan record form_submit: { id, user_id,
      //   user_username, form_id, status, attemps, start_at }
      final checkData = check['data'];
      if (checkData is Map) {
        final rawSubmitStartAt = checkData['start_at'];
        if (rawSubmitStartAt != null) {
          if (rawSubmitStartAt is num && rawSubmitStartAt > 0) {
            _submitStartAtMillis = rawSubmitStartAt.toInt();
          } else if (rawSubmitStartAt is String) {
            final asInt = int.tryParse(rawSubmitStartAt);
            if (asInt != null && asInt > 0) {
              _submitStartAtMillis = asInt;
            } else {
              final parsed = DateTime.tryParse(rawSubmitStartAt);
              _submitStartAtMillis = parsed?.millisecondsSinceEpoch;
            }
          }
        }
      }
      setState(() => _tokenValidated = true);
    }

    setState(() => _preStartCompleted = true);
    if (_durationSeconds != null && _durationSeconds! > 0) {
      _initAndStartTimer();
    }
    _emitProgress();
  }

  /// Form tanpa token: daftarkan pengerjaan ke backend sekali agar record
  /// form_submit (status progress) dibuat. Backend menolak submit tanpa
  /// record ("Submit form belum dimulai"). Fire-and-forget (paritas Web).
  Future<void> _registerNoTokenProgress() async {
    final result = await FormService.checkTokenResponden(
      formSlug: widget.slug,
      token: '',
    );
    if (!mounted) return;
    if (result['success']) {
      setState(() => _tokenValidated = true);
      _emitProgress();
    }
    // Registrasi gagal (mis. 4xx/5xx backend): jangan kirim progress —
    // tanpa record form_submit, laporan progress pasti ditolak.
    // Fill form, jawaban, dan submit tidak terpengaruh.
  }

  /// Laporkan posisi halaman aktif ke monitoring creator (debounced 400ms,
  /// fire-and-forget). Paritas Web FillForm.emitProgress.
  void _emitProgress() {
    if (_pageGroups.isEmpty || _isSubmitted) return;
    _progressDebounce?.cancel();
    _progressDebounce = Timer(const Duration(milliseconds: 400), () {
      if (!mounted || _isSubmitted || _pageGroups.isEmpty) return;
      final idx = _currentPageIndex.clamp(0, _pageGroups.length - 1);
      final soalOnPage =
          (_pageGroups[idx]['soal'] as List? ?? []).length;
      // Hasil sengaja diabaikan: endpoint boleh gagal (mis. 4xx/5xx atau
      // kolom progress belum tersedia di DB runtime) tanpa mengganggu
      // pengerjaan, jawaban, pagination, token, maupun submit.
      FormService.updateMonitoringProgress(
        formSlug: widget.slug,
        currentPage: idx + 1,
        currentSoal: soalOnPage,
        totalPages: _pageGroups.length,
        totalSoal: _allSoal.length,
      );
    });
  }

  /// Hitung dan mulai timer. Hanya dipanggil sekali saat user memulai pengerjaan.
  /// Logic (sesuai contract backend & Web FE):
  ///   1. form.start_at tersedia → endTime = form.start_at + duration * 1000
  ///   2. form_submit.start_at tersedia → endTime = form_submit.start_at + duration * 1000
  ///   3. Fallback (tidak ada timestamp backend) → endTime = now + duration * 1000
  void _initAndStartTimer() {
    if (_timerEndMillis != null) {
      // Timer sudah diinisialisasi sebelumnya (hindari reset saat rebuild)
      _startTimer();
      return;
    }
    final durationMs = (_durationSeconds ?? 0) * 1000;
    if (durationMs <= 0) return;

    if (_formStartAtMillis != null && _formStartAtMillis! > 0) {
      // Prioritas 1: gunakan form.start_at dari form settings
      _timerEndMillis = _formStartAtMillis! + durationMs;
    } else if (_submitStartAtMillis != null && _submitStartAtMillis! > 0) {
      // Prioritas 2: gunakan form_submit.start_at dari response check-token
      _timerEndMillis = _submitStartAtMillis! + durationMs;
    } else {
      // Fallback: tidak ada timestamp backend — gunakan waktu device saat mulai
      _timerEndMillis = DateTime.now().millisecondsSinceEpoch + durationMs;
    }

    // Hitung remaining saat ini
    final now = DateTime.now().millisecondsSinceEpoch;
    final remaining = ((_timerEndMillis! - now) / 1000).ceil();
    setState(() => _remainingSeconds = remaining.clamp(0, _durationSeconds!));

    if (remaining <= 0) {
      _handleAutoSubmit();
      return;
    }
    _startTimer();
  }

  String _mapQuestionType(String type) {
    switch (type.toLowerCase()) {
      case 'radio':
        return 'Single Choice';
      case 'checkbox':
        return 'Multiple Choice';
      case 'text':
        return 'Text Answer';
      case 'file':
        return 'File Upload';
      case 'rating':
        return 'Rating';
      default:
        return type;
    }
  }

  /// Build page groups dari raw soal response backend.
  /// Backend format: [{page: 1, soal: [...]}, {page: 2, soal: [...]}]
  /// Survey: semua soal dalam 1 halaman.
  /// Quiz: step-by-step per page, page 1 = identitas (tidak diacak),
  ///   page 2+ = soal ujian (diacak jika is_random).
  /// CRITICAL: Store references to original _questions objects, not copies!
  /// This ensures answer updates persist across page navigation.
  List<Map<String, dynamic>> _buildPageGroups(
      List rawSoal, bool isRandom, bool isQuiz) {
    if (!isQuiz) {
      // Survey: satu page saja dengan semua soal (store references, not copies!)
      return [
        {
          'page': 1,
          'soal': _questions,  // ✅ Direct reference, not List.from()
        }
      ];
    }

    // Quiz: gunakan page grouping dari backend
    final Map<int, List<Map<String, dynamic>>> pageMap = {};
    for (final pg in rawSoal) {
      if (pg is Map && pg['soal'] is List) {
        final pageNum = pg['page'] is num ? (pg['page'] as num).toInt() : 1;
        final soalList = (pg['soal'] as List).map((s) {
          // Cari di _questions berdasarkan id untuk dapat answer state
          final id = s['id'];
          final found = _questions.firstWhere(
            (q) => q['id'] == id,
            orElse: () {
              final type = s['type']?.toString() ?? 'text';
              return {
                'id': id,
                'number': 0,
                'question': s['question']?.toString() ?? '',
                'type': type,
                'typeDisplay': _mapQuestionType(type),
                'options': s['options'] ?? [],
                'image': s['image']?.toString(),
                'audio': s['audio']?.toString(),
                'page': pageNum,
                'is_required': s['is_required'],
                'answer': null,
              };
            },
          );
          return found;  // ✅ Store reference to _questions object, not copy
        }).toList();
        pageMap[pageNum] = soalList;
      }
    }

    // Jika rawSoal bukan format groups (flat array), build dari _questions
    if (pageMap.isEmpty) {
      for (final q in _questions) {
        final p = q['page'] as int? ?? 1;
        pageMap.putIfAbsent(p, () => []).add(q);  // ✅ Direct reference
      }
    }

    final sortedPages = pageMap.keys.toList()..sort();
    final groups = sortedPages.map((p) {
      var soal = pageMap[p]!;
      // Shuffle soal di page 2+ jika is_random (page 1 = identitas, tidak diacak)
      // ⚠️ Create shuffled list, but still contains references to original objects
      if (isRandom && p > 1) {
        soal = List<Map<String, dynamic>>.from(soal)..shuffle();  // Shuffle list only, not objects
      }
      return {'page': p, 'soal': soal};
    }).toList();

    return groups.isEmpty
        ? [
            {'page': 1, 'soal': _questions}  // ✅ Direct reference, not List.from()
          ]
        : groups;
  }

  /// Ambil semua soal dari page groups (flattened) — untuk keperluan submit
  List<Map<String, dynamic>> get _allSoal {
    if (_pageGroups.isEmpty) return _questions;
    return _pageGroups
        .expand<Map<String, dynamic>>((pg) =>
            (pg['soal'] as List? ?? []).cast<Map<String, dynamic>>())
        .toList();
  }

  /// Soal di page aktif (untuk quiz step-by-step)
  List<Map<String, dynamic>> get _currentPageSoal {
    if (_pageGroups.isEmpty) return _questions;
    if (_currentPageIndex >= _pageGroups.length) return [];
    return (_pageGroups[_currentPageIndex]['soal'] as List? ?? [])
        .cast<Map<String, dynamic>>();
  }

  bool _hasAnswered(Map<String, dynamic> q) {
    final type = q['type'] as String? ?? '';
    final answer = q['answer'];
    if (type == 'file') return answer != null;
    if (type == 'checkbox') return answer is List && answer.isNotEmpty;
    return answer != null && answer.toString().isNotEmpty;
  }

  /// Wajib diisi jika is_required == true.
  /// is_required null (legacy soal, backend belum mengembalikan field ini)
  ///   tetap dianggap wajib untuk menjaga perilaku lama (semua soal wajib).
  /// is_required explicit false → opsional.
  bool _isRequiredSoal(Map<String, dynamic> q) {
    final raw = q['is_required'];
    if (raw == null) return true;
    if (raw is bool) return raw;
    if (raw is num) return raw != 0;
    final s = raw.toString().toLowerCase();
    return s == 'true' || s == '1';
  }

  int get _answeredCount =>
      _allSoal.where(_hasAnswered).length;

  double get _progressValue {
    final total = _allSoal.length;
    if (total == 0) return 0;
    return _answeredCount / total;
  }

  /// Validasi halaman saat ini sebelum lanjut ke halaman berikutnya.
  /// Hanya soal wajib diisi (is_required true, atau null untuk legacy) yang
  /// dicek belum dijawab; soal opsional (explicit false) boleh dilewati.
  bool _validateCurrentPage() {
    for (final q in _currentPageSoal) {
      if (!_isRequiredSoal(q)) continue;
      if (!_hasAnswered(q)) {
        final qText = stripHtmlTags(q['question']?.toString() ?? '');
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
            '"${qText.isEmpty ? 'Soal ini' : (qText.length > 40 ? '${qText.substring(0, 40)}...' : qText)}" '
            'belum dijawab.',
          ),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 2),
        ));
        return false;
      }
    }
    return true;
  }

  void _goToNextPage() {
    if (!_validateCurrentPage()) return;
    if (_currentPageIndex < _pageGroups.length - 1) {
      // [FillForm] DEBUG: Log page change
      assert(() {
        final currentAnswers = _currentPageSoal.map((q) {
          final ans = q['answer'];
          return 'Q${q['id']}=${ans is String ? (ans.isEmpty ? "(empty)" : ans.substring(0, (ans.length < 20 ? ans.length : 20))) : ans}';
        }).join(', ');
        debugPrint(
          '[FillForm] PAGE_CHANGE '
          'from=${_currentPageIndex + 1} '
          'to=${_currentPageIndex + 2} '
          'currentPageAnswers=[$currentAnswers]'
        );
        return true;
      }());
      setState(() => _currentPageIndex++);
      _emitProgress();
    }
  }

  void _goToPreviousPage() {
    if (_currentPageIndex > 0) {
      // [FillForm] DEBUG: Log page change
      assert(() {
        final nextPageAnswers = _currentPageSoal.map((q) {
          final ans = q['answer'];
          return 'Q${q['id']}=${ans is String ? (ans.isEmpty ? "(empty)" : ans.substring(0, (ans.length < 20 ? ans.length : 20))) : ans}';
        }).join(', ');
        debugPrint(
          '[FillForm] PAGE_CHANGE '
          'from=${_currentPageIndex + 1} '
          'to=${_currentPageIndex} '
          'currentPageAnswers=[$nextPageAnswers]'
        );
        return true;
      }());
      setState(() => _currentPageIndex--);
      _emitProgress();
    }
  }

  void _toggleDoubt(int soalId) {
    setState(() {
      if (_doubtfulIds.contains(soalId)) {
        _doubtfulIds.remove(soalId);
      } else {
        _doubtfulIds.add(soalId);
      }
    });
  }

  void _startTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      // Hitung sisa waktu berdasarkan endTimestamp absolut (bukan decrement)
      final now = DateTime.now().millisecondsSinceEpoch;
      final remaining = _timerEndMillis != null
          ? ((_timerEndMillis! - now) / 1000).ceil()
          : ((_remainingSeconds ?? 0) - 1);

      if (remaining <= 0) {
        timer.cancel();
        setState(() => _remainingSeconds = 0);
        _handleAutoSubmit();
        return;
      }
      setState(() {
        _remainingSeconds = remaining;
        if (remaining == 60) _showTimeWarning();
      });
    });
  }

  Widget _buildTimerDisplay() {
    final minutes = _remainingSeconds! ~/ 60;
    final seconds = _remainingSeconds! % 60;
    final timeString =
        '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    Color timerColor;
    if (_remainingSeconds! > 300) {
      timerColor = AppColors.success;
    } else if (_remainingSeconds! > 120) {
      timerColor = AppColors.warning;
    } else {
      timerColor = AppColors.error;
    }

    return Container(
      margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: timerColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: timerColor, width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer, color: timerColor, size: 18),
          const SizedBox(width: 6),
          Text(
            timeString,
            style: TextStyle(
              color: timerColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  void _showTimeWarning() {
    if (!_hasShownWarning && mounted) {
      _hasShownWarning = true;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: Row(children: const [
            Icon(Icons.warning_amber, color: AppColors.error, size: 28),
            SizedBox(width: 8),
            Text('Time Warning'),
          ]),
          content: const Text(
              'You have less than 1 minute remaining! Please submit your answers soon.'),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Continue'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _handleAutoSubmit() async {
    _countdownTimer?.cancel();
    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).popUntil(
        (route) => route.isFirst || route is PageRoute);
    if (!mounted) return;

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(children: [
          Icon(Icons.timer_off, color: Colors.white, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Waktu habis! Jawaban kamu otomatis dikumpulkan.',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ]),
        backgroundColor: AppColors.error,
        duration: Duration(seconds: 4),
      ),
    );

    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    await _forceSubmit();
  }

  Future<void> _forceSubmit() async {
    if (_isSubmitting || _isSubmitted) return;
    setState(() => _isSubmitting = true);

    try {
      final List<Map<String, dynamic>> answers = [];
      final List<({Uint8List bytes, String filename})> uploadFiles = [];

      for (final question in _allSoal) {
        final soalId = question['id'];
        final type = question['type'];
        final answer = question['answer'];

        if (answer == null && type != 'file') continue;

        final Map<String, dynamic> jawaban = {'soal_id': soalId};

        if (type == 'radio') {
          final options = question['options'] as List;
          final selected = options.firstWhere(
              (o) => (o['value'] ?? o['option_value'] ?? '') == answer,
              orElse: () => null);
          if (selected != null) {
            jawaban['soal_option_id'] = selected['id'] ?? selected['soal_option_id'];
          } else {
            continue;
          }
        } else if (type == 'rating') {
          final options = question['options'] as List;
          final ratingValue = (answer as num?)?.toInt() ?? 0;
          if (ratingValue > 0 && ratingValue <= options.length) {
            final sel = options[ratingValue - 1];
            final id = sel is Map ? (sel['id'] ?? sel['soal_option_id']) : null;
            if (id != null) {
              jawaban['soal_option_id'] = id;
            } else {
              continue;
            }
          } else {
            continue;
          }
        } else if (type == 'checkbox') {
          final rawAnswer = question['answer'];
          final List<String> selectedValues = rawAnswer is List
              ? rawAnswer.map((e) => e.toString()).toList()
              : <String>[];
          if (selectedValues.isEmpty) continue;
          final options = question['options'] as List;
          final selectedIds = <int>[];
          for (final s in selectedValues) {
            final opt = options.firstWhere(
                (o) => (o['value'] ?? o['option_value'] ?? '') == s,
                orElse: () => null);
            if (opt != null) {
              final id = opt['id'] ?? opt['soal_option_id'];
              if (id != null) selectedIds.add(id);
            }
          }
          if (selectedIds.isEmpty) continue;
          jawaban['soal_option_id'] = selectedIds;
        } else if (type == 'text') {
          jawaban['answer_text'] = answer ?? '';
        } else if (type == 'file') {
          final fileMap = answer as Map<dynamic, dynamic>?;
          if (fileMap != null && fileMap['bytes'] != null) {
            uploadFiles.add((
              bytes: fileMap['bytes'] as Uint8List,
              filename: fileMap['filename']?.toString() ?? 'answer.bin',
            ));
          } else {
            continue;
          }
        }
        answers.add({'jawaban': jawaban});
      }

      // [FillForm] DEBUG: Log submit request
      assert(() {
        debugPrint(
          '[FillForm] SUBMIT_REQUEST '
          'endpoint=POST /api/submit '
          'formSlug=${widget.slug} '
          'answersCount=${answers.length} '
          'filesCount=${uploadFiles.length} '
          'payload=${answers.toString().substring(0, (answers.toString().length < 100 ? answers.toString().length : 100))}'
        );
        return true;
      }());

      final result = await FormService.submitForm(
        formSlug: widget.slug,
        answers: answers,
        files: uploadFiles,
      );

      // [FillForm] DEBUG: Log submit response
      assert(() {
        debugPrint(
          '[FillForm] SUBMIT_RESPONSE '
          'success=${result['success']} '
          'statusCode=${result['statusCode'] ?? "N/A"} '
          'message="${result['message'] ?? "N/A"}" '
          'answersCount=${answers.length}'
        );
        return true;
      }());

      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _isSubmitted = true;
      });

      if (!result['success']) {
        final statusCode = result['statusCode'];
        final message = result['message'] as String? ?? '';
        
        // Distinguish validation errors (4xx) from server errors (5xx)
        if (statusCode >= 400 && statusCode < 500) {
          // Validation/client error - show "Isi Tidak Sesuai" warning
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Isi Tidak Sesuai',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (message.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      message,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ] else
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Text(
                        'Periksa kembali jawaban Anda.',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                ],
              ),
              backgroundColor: AppColors.warning,
              duration: const Duration(seconds: 5),
            ),
          );
          // Reset submission state to allow retry
          if (!mounted) return;
          setState(() {
            _isSubmitted = false;
          });
        } else if (statusCode != 409) {
          // Server error (5xx) or other issue
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(
              statusCode >= 500 
                ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
                : (message.isNotEmpty ? message : 'Gagal mengirim, tapi waktu telah habis.'),
            ),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ));
          // Reset submission state to allow retry even on server error
          if (!mounted) return;
          setState(() {
            _isSubmitted = false;
          });
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _isSubmitted = false;
      });
      // Show generic error but don't crash
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Terjadi kesalahan. Silakan coba lagi.'),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Future<void> _promptToken() async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Token Responden'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Masukkan token yang diberikan'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(controller.text),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Lanjutkan'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (!mounted) return;

    if (result == null || result.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Token wajib diisi untuk mengirim jawaban'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isSubmitting = true);
    final check = await FormService.checkTokenResponden(
        formSlug: widget.slug, token: result.trim());
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (check['success']) {
      setState(() => _tokenValidated = true);
    } else {
      final statusCode = check['statusCode'] as int? ?? 0;
      final backendMessage = check['message'] as String? ?? '';
      final String displayMsg;
      if (statusCode >= 500) {
        displayMsg =
            'Server mengalami gangguan. Coba beberapa saat lagi.';
      } else if (statusCode == 0) {
        displayMsg = backendMessage.isNotEmpty
            ? backendMessage
            : 'Tidak dapat terhubung ke server.';
      } else {
        displayMsg = backendMessage.isNotEmpty ? backendMessage : 'Token salah.';
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(displayMsg),
        backgroundColor: AppColors.error,
      ));
      // Hanya ulangi dialog untuk error 4xx (token salah).
      // Error 5xx/network: biarkan user memutuskan sendiri untuk mencoba lagi.
      if (statusCode > 0 && statusCode < 500) {
        _promptToken();
      }
    }
  }

  Future<void> _pickFile(int index) async {
    try {
      final picked = await FilePickerPlatform.instance.pickFiles();
      if (picked.isEmpty) return;
      final file = picked.first;
      final bytes = await file.xFile.readAsBytes();
      if (!mounted) return;
      setState(() {
        _questions[index]['answer'] = {'bytes': bytes, 'filename': file.name};
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Gagal memilih file. Coba lagi.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting || _isSubmitted) return;
    if (_tokenNeeded && !_tokenValidated) {
      _promptToken();
      return;
    }

    // Cek soal yang ragu-ragu
    if (_doubtfulIds.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
          'Ada ${_doubtfulIds.length} soal yang ditandai ragu-ragu. '
          'Periksa kembali sebelum submit.',
        ),
        backgroundColor: AppColors.warning,
        duration: const Duration(seconds: 3),
      ));
      return;
    }

    // Validasi soal wajib diisi (is_required true / null legacy); soal
    // opsional (explicit false) boleh dilewati
    final unanswered = _allSoal.where((q) {
      return _isRequiredSoal(q) && !_hasAnswered(q);
    }).toList();

    if (unanswered.isNotEmpty) {
      final qText = stripHtmlTags(unanswered.first['question']?.toString() ?? '');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
          '"${qText.isEmpty ? 'Beberapa soal' : (qText.length > 40 ? '${qText.substring(0, 40)}...' : qText)}" '
          'belum dijawab.',
        ),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final List<Map<String, dynamic>> answers = [];
      final List<({Uint8List bytes, String filename})> uploadFiles = [];

      for (final question in _allSoal) {
        final soalId = question['id'];
        final type = question['type'];
        final answer = question['answer'];
        final Map<String, dynamic> jawaban = {'soal_id': soalId};

        if (type == 'radio') {
          final options = question['options'] as List;
          final selected = options.firstWhere(
              (o) => (o['value'] ?? o['option_value'] ?? '') == answer,
              orElse: () => null);
          if (selected != null) {
            jawaban['soal_option_id'] = selected['id'] ?? selected['soal_option_id'];
          }
        } else if (type == 'rating') {
          final options = question['options'] as List;
          final ratingValue = (answer as num?)?.toInt() ?? 0;
          if (ratingValue > 0 && ratingValue <= options.length) {
            final sel = options[ratingValue - 1];
            final id = sel is Map ? (sel['id'] ?? sel['soal_option_id']) : null;
            if (id != null) jawaban['soal_option_id'] = id;
          }
        } else if (type == 'checkbox') {
          final rawAnswer = question['answer'];
          final List<String> selectedValues = rawAnswer is List
              ? rawAnswer.map((e) => e.toString()).toList()
              : <String>[];
          final options = question['options'] as List;
          final selectedIds = <int>[];
          for (final s in selectedValues) {
            final opt = options.firstWhere(
                (o) => (o['value'] ?? o['option_value'] ?? '') == s,
                orElse: () => null);
            if (opt != null) {
              final id = opt['id'] ?? opt['soal_option_id'];
              if (id != null) selectedIds.add(id);
            }
          }
          if (selectedIds.isNotEmpty) jawaban['soal_option_id'] = selectedIds;
        } else if (type == 'text') {
          jawaban['answer_text'] = answer ?? '';
        } else if (type == 'file') {
          final fileMap = answer as Map<dynamic, dynamic>?;
          if (fileMap != null && fileMap['bytes'] != null) {
            uploadFiles.add((
              bytes: fileMap['bytes'] as Uint8List,
              filename: fileMap['filename']?.toString() ?? 'answer.bin',
            ));
          } else {
            continue;
          }
        }
        answers.add({'jawaban': jawaban});
      }

      final result = await FormService.submitForm(
          formSlug: widget.slug, answers: answers, files: uploadFiles);
      
      // [SubmitDebug] Log result
      assert(() {
        debugPrint('[SubmitDebug] HANDLESUBMIT_RESULT_RECEIVED');
        debugPrint('[SubmitDebug] success=${result['success']}');
        debugPrint('[SubmitDebug] statusCode=${result['statusCode']}');
        debugPrint('[SubmitDebug] message=${result['message']}');
        return true;
      }());
      
      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (result['success']) {
        if (!mounted) return;
        setState(() => _isSubmitted = true);
        // Simpan ke riwayat lokal (SharedPreferences) sesuai Web FE behavior
        await saveHistoryEntry(
          formSlug: widget.slug,
          formTitle: _formTitle,
          category: _category,
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Form submitted successfully!'),
          backgroundColor: AppColors.success,
        ));
      } else {
        if (!mounted) return;
        final statusCode = result['statusCode'];
        if (statusCode == 409) {
          // Backend memastikan user sudah pernah submit (completed) —
          // terminal state, tampilkan layar selesai bukan error berulang.
          setState(() => _isSubmitted = true);
          await saveHistoryEntry(
            formSlug: widget.slug,
            formTitle: _formTitle,
            category: _category,
          );
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Anda sudah mengisi form ini sebelumnya.'),
            backgroundColor: AppColors.success,
          ));
          return;
        }
        String message = result['message'] ?? 'Failed to submit form';
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message), backgroundColor: AppColors.error));
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Failed to submit form. Please check your connection and try again.'),
          backgroundColor: AppColors.error,
        ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: (_preStartCompleted && !_isLoading && _errorMessage.isEmpty && !_isSubmitted)
          ? null
          : AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              leading: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
              ),
              title: Text(
                _isLoading ? 'Memuat...' : (_isSubmitted ? 'Selesai' : 'Fill Form'),
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _isSubmitted
              ? _buildSuccessState()
              : _errorMessage.isNotEmpty
                  ? _buildErrorState()
                  : !_preStartCompleted
                      ? _buildPreStart()
                      : _buildActiveForm(),
    );
  }

  Widget _buildSuccessState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.check_circle_outline, size: 60, color: AppColors.success),
            ),
            const SizedBox(height: 24),
            const Text('Thank You!',
                style: TextStyle(
                    fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            const Text('Your response has been submitted successfully.',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                textAlign: TextAlign.center),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Back to Form')),
            ),
          ],
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
            Text(_errorMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _loadForm, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildPreStart() {
    final hasBanner = _formBanner.isNotEmpty;
    final bannerUrl = hasBanner ? '${ApiConfig.formApiBaseUrl}$_formBanner' : '';
    final durationText = (_durationSeconds != null && _durationSeconds! > 0)
        ? '${_durationSeconds! ~/ 60} Menit'
        : 'Tanpa Batasan Waktu';

    return SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (hasBanner)
              Image.network(bannerUrl, height: 200, fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 200,
                    decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                    child: const Icon(Icons.description_outlined, size: 64, color: Colors.white54),
                  ))
            else
              Container(
                height: 200,
                decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                child: const Center(
                    child: Icon(Icons.description_outlined, size: 64, color: Colors.white54)),
              ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_formTitle,
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 8),
                  if (_category.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20)),
                      child: Text(_category.toUpperCase(),
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                              letterSpacing: 0.5)),
                    ),
                  const SizedBox(height: 24),
                  const Divider(color: AppColors.inputBorder),
                  const SizedBox(height: 20),
                  _buildInfoRow(
                      icon: Icons.quiz_outlined,
                      label: 'Jumlah Soal',
                      value: '${_questions.length} Pertanyaan'),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                      icon: Icons.timer_outlined, label: 'Durasi', value: durationText),
                  if (_tokenNeeded) ...[
                    const SizedBox(height: 24),
                    const Divider(color: AppColors.inputBorder),
                    const SizedBox(height: 20),
                    const Text('Form ini memerlukan token responden.',
                        style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _tokenController,
                      autocorrect: false,
                      enableSuggestions: false,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: 'Token Responden',
                        hintText: 'Masukkan token yang diberikan',
                        prefixIcon:
                            const Icon(Icons.key_outlined, color: AppColors.primary),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.inputBorder)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.inputBorder)),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide:
                                const BorderSide(color: AppColors.primary, width: 2)),
                        errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.error)),
                        errorText: _tokenError.isNotEmpty ? _tokenError : null,
                      ),
                      onChanged: (_) {
                        if (_tokenError.isNotEmpty) setState(() => _tokenError = '');
                      },
                    ),
                  ],
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isCheckingToken ? null : _onStartForm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isCheckingToken
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor:
                                      AlwaysStoppedAnimation<Color>(Colors.white)))
                          : const Text('Mulai Form',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
  }

  Widget _buildInfoRow(
      {required IconData icon, required String label, required String value}) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActiveForm() {
    final hasBanner = _formBanner.isNotEmpty;
    final bannerUrl = hasBanner ? '${ApiConfig.formApiBaseUrl}$_formBanner' : '';

    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverAppBar(
          pinned: true,
          expandedHeight: hasBanner ? 160.0 : 80.0,
          backgroundColor: AppColors.primary,
          automaticallyImplyLeading: false,
          leading: IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          actions: [if (_remainingSeconds != null) _buildTimerDisplay()],
          flexibleSpace: FlexibleSpaceBar(
            titlePadding:
                const EdgeInsets.only(left: 56, bottom: 12, right: 16),
            title: Text(_formTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            background: hasBanner
                ? Image.network(bannerUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                        decoration:
                            const BoxDecoration(gradient: AppColors.primaryGradient)))
                : Container(
                    decoration:
                        const BoxDecoration(gradient: AppColors.primaryGradient)),
            collapseMode: CollapseMode.parallax,
          ),
        ),
      ],
      body: _isQuiz ? _buildQuizContent() : _buildSurveyContent(),
    );
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  Widget _buildProgressBar() {
    final total = _allSoal.length;
    final answered = _answeredCount;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$answered/$total dijawab',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary),
              ),
              Text(
                '${(_progressValue * 100).round()}%',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _progressValue,
              minHeight: 6,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  // ── Survey mode: semua soal tampil sekaligus, scroll ─────────────────────
  Widget _buildSurveyContent() {
    return Column(
      children: [
        _buildProgressBar(),
        Expanded(
          child: _questions.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  itemCount: _questions.length,
                  itemBuilder: (ctx, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _buildQuestionCard(_questions[i], i,
                        globalIndex: i),
                  ),
                ),
        ),
        _buildSubmitBar(),
      ],
    );
  }

  // ── Quiz mode: navigasi per halaman ──────────────────────────────────────
  Widget _buildQuizContent() {
    if (_pageGroups.isEmpty) return _buildSurveyContent();

    final totalPages = _pageGroups.length;
    final currentSoal = _currentPageSoal;
    final isLastPage = _currentPageIndex == totalPages - 1;

    return Column(
      children: [
        // Progress header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Halaman ${_currentPageIndex + 1} dari $totalPages',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary),
                  ),
                  Text(
                    '${_answeredCount}/${_allSoal.length} dijawab',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: ((_currentPageIndex + 1) / totalPages),
                  minHeight: 6,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              ),
            ],
          ),
        ),

        // Soal list untuk halaman ini
        Expanded(
          child: currentSoal.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  itemCount: currentSoal.length,
                  itemBuilder: (ctx, i) {
                    final q = currentSoal[i];
                    // Cari global index di _questions untuk update answer
                    final globalIdx = _questions
                        .indexWhere((gq) => gq['id'] == q['id']);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildQuestionCard(
                        q,
                        globalIdx >= 0 ? globalIdx : i,
                        globalIndex: globalIdx >= 0 ? globalIdx : i,
                      ),
                    );
                  },
                ),
        ),

        // Nav bar
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4)),
            ],
          ),
          child: Row(
            children: [
              if (_currentPageIndex > 0)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _goToPreviousPage,
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: const Text('Kembali'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                )
              else
                const Expanded(child: SizedBox.shrink()),
              const SizedBox(width: 12),
              Expanded(
                child: isLastPage
                    ? ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white))
                            : const Icon(Icons.send, size: 16),
                        label: Text(
                            _isSubmitting ? 'Mengirim...' : 'Submit'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      )
                    : ElevatedButton.icon(
                        onPressed: _goToNextPage,
                        icon: const Icon(Icons.arrow_forward, size: 16),
                        label: const Text('Lanjut'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_doubtfulIds.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: AppColors.warning.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.help_outline,
                        size: 16, color: AppColors.warning),
                    const SizedBox(width: 8),
                    Text(
                      '${_doubtfulIds.length} soal ditandai ragu-ragu',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.warning),
                    ),
                  ],
                ),
              ),
            ),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white)))
                : const Text('Submit Form',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.quiz_outlined, size: 80, color: AppColors.textSecondary.withOpacity(0.5)),
          const SizedBox(height: 16),
          const Text('No Questions',
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text("This form doesn't have any questions yet",
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary.withOpacity(0.7))),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> question, int index, {int? globalIndex}) {
    final options = question['options'] as List? ?? [];
    final type = question['type'] as String;
    final soalId = question['id'];
    final isDoubtful = soalId != null && _doubtfulIds.contains(soalId);
    // Gunakan globalIndex untuk update state jika tersedia
    final updateIndex = globalIndex ?? index;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: isDoubtful
            ? Border.all(color: AppColors.warning, width: 1.5)
            : null,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8)),
                child: Text('Q${question['number']}',
                    style: const TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                    color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                child: Text(question['typeDisplay'],
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              ),
              if (_isRequiredSoal(question))
                const Padding(
                  padding: EdgeInsets.only(left: 6),
                  child: Text(
                    '*',
                    style: TextStyle(
                      color: AppColors.error,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              const Spacer(),
              // Tombol ragu-ragu
              if (soalId != null)
                GestureDetector(
                  onTap: () => _toggleDoubt(soalId as int),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDoubtful
                          ? AppColors.warning.withOpacity(0.15)
                          : AppColors.background,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isDoubtful
                            ? AppColors.warning
                            : AppColors.inputBorder,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isDoubtful ? Icons.help : Icons.help_outline,
                          size: 14,
                          color: isDoubtful
                              ? AppColors.warning
                              : AppColors.textHint,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Ragu',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDoubtful
                                ? AppColors.warning
                                : AppColors.textHint,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          QuillRichText(
            content: question['question'] as String? ?? '',
            baseStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
                height: 1.5),
          ),
          if (question['image'] != null && (question['image'] as String).isNotEmpty)
            _buildQuestionImage(question['image']),
          if (question['audio'] != null && (question['audio'] as String).isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: FormAudioPlayer(
                url: '${ApiConfig.formApiBaseUrl}${question['audio']}',
              ),
            ),
          const SizedBox(height: 20),
          if (type == 'radio' && options.isNotEmpty)
            _buildRadioOptions(question, options, updateIndex)
          else if (type == 'checkbox' && options.isNotEmpty)
            _buildCheckboxOptions(question, options, updateIndex)
          else if (type == 'text')
            _buildTextInput(question, updateIndex)
          else if (type == 'file')
            _buildFileUpload(question, updateIndex)
          else if (type == 'rating')
            _buildRatingInput(question, updateIndex),
        ],
      ),
    );
  }

  Widget _buildRadioOptions(Map<String, dynamic> question, List options, int index) {
    return Column(
      children: options.map((option) {
        final optionValue = option['value'] ?? option['option_value'] ?? '';
        final isSelected = question['answer'] == optionValue;
        return InkWell(
          onTap: () => setState(() => _questions[index]['answer'] = optionValue),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.inputBorder,
                  width: isSelected ? 2 : 1),
            ),
            child: Row(
              children: [
                Icon(
                    isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: QuillRichText(
                    content: optionValue.toString(),
                    baseStyle: TextStyle(
                        fontSize: 14,
                        color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCheckboxOptions(Map<String, dynamic> question, List options, int index) {
    final rawAnswer = question['answer'];
    List<String> selectedValues = rawAnswer is List
        ? rawAnswer.map((e) => e.toString()).toList()
        : <String>[];

    return Column(
      children: options.map((option) {
        final optionValue = option['value'] ?? option['option_value'] ?? '';
        final isSelected = selectedValues.contains(optionValue);
        return InkWell(
          onTap: () {
            setState(() {
              if (isSelected) {
                selectedValues.remove(optionValue);
              } else {
                selectedValues.add(optionValue);
              }
              _questions[index]['answer'] = selectedValues;
            });
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.inputBorder,
                  width: isSelected ? 2 : 1),
            ),
            child: Row(
              children: [
                Icon(isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                    color: isSelected ? AppColors.primary : AppColors.textSecondary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: QuillRichText(
                    content: optionValue.toString(),
                    baseStyle: TextStyle(
                        fontSize: 14,
                        color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTextInput(Map<String, dynamic> question, int index) {
    // FIX: Use TextEditingController to bind TextField to stored answer
    // Ensures answer persists when page navigation causes widget rebuild
    
    final questionId = question['id'];
    final storedAnswer = question['answer']?.toString() ?? '';
    
    // Get or create controller for this specific question ID
    // Using question ID (not index) to prevent controller mixing when questions reorder
    if (!_textControllers.containsKey(questionId)) {
      final controller = TextEditingController(text: storedAnswer);
      _textControllers[questionId] = controller;
      
      // [FillForm] DEBUG: Log controller creation
      assert(() {
        debugPrint(
          '[FillForm] ANSWER_CONTROLLER_CREATED '
          'questionId=$questionId '
          'index=$index '
          'initialValue="$storedAnswer"'
        );
        return true;
      }());
    } else {
      // Controller exists - sync stored answer to controller if out of sync
      final controller = _textControllers[questionId]!;
      if (controller.text != storedAnswer && storedAnswer.isNotEmpty) {
        // Answer was updated externally (e.g., via page change), sync to controller
        controller.text = storedAnswer;
        
        // [FillForm] DEBUG: Log controller sync
        assert(() {
          debugPrint(
            '[FillForm] ANSWER_CONTROLLER_SYNCED '
            'questionId=$questionId '
            'synced_to="$storedAnswer"'
          );
          return true;
        }());
      }
    }
    
    final controller = _textControllers[questionId]!;
    
    // [FillForm] DEBUG: Log answer render
    assert(() {
      debugPrint(
        '[FillForm] ANSWER_RENDER '
        'questionId=$questionId '
        'index=$index '
        'controllerText="${controller.text.isEmpty ? "(empty)" : controller.text.substring(0, (controller.text.length < 50 ? controller.text.length : 50))}"'
      );
      return true;
    }());
    
    return TextField(
      controller: controller,  // ✅ FIX: Use controller bound to question ID
      maxLines: 4,
      decoration: InputDecoration(
        hintText: 'Type your answer here...',
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.inputBorder)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.inputBorder)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
      ),
      onChanged: (value) {
        // Update stored answer in _questions
        // [FillForm] DEBUG: Log answer updates
        assert(() {
          debugPrint(
            '[FillForm] ANSWER_UPDATE '
            'questionId=$questionId '
            'index=$index '
            'newAnswer="${value.isEmpty ? "(empty)" : value.substring(0, (value.length < 50 ? value.length : 50))}"'
          );
          return true;
        }());
        
        setState(() => _questions[index]['answer'] = value);
      },
    );
  }

  Widget _buildFileUpload(Map<String, dynamic> question, int index) {
    final Map<dynamic, dynamic>? selected = question['answer'] as Map<dynamic, dynamic>?;
    return InkWell(
      onTap: () => _pickFile(index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected != null ? AppColors.success : AppColors.inputBorder),
        ),
        child: Column(
          children: [
            Icon(selected != null ? Icons.insert_drive_file : Icons.upload_file,
                size: 40,
                color: selected != null ? AppColors.success : AppColors.textSecondary),
            const SizedBox(height: 12),
            Text(
                selected != null
                    ? selected['filename']?.toString() ?? 'File selected'
                    : 'Tap to upload a file',
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected != null ? FontWeight.w600 : FontWeight.normal,
                    color: selected != null ? AppColors.textPrimary : AppColors.textSecondary),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingInput(Map<String, dynamic> question, int index) {
    int selectedRating = question['answer'] ?? 0;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (starIndex) {
        final rating = starIndex + 1;
        return IconButton(
          onPressed: () => setState(() => _questions[index]['answer'] = rating),
          icon: Icon(rating <= selectedRating ? Icons.star : Icons.star_border,
              color: rating <= selectedRating ? Colors.amber : AppColors.textSecondary,
              size: 32),
        );
      }),
    );
  }

  Widget _buildQuestionImage(String imagePath) {
    final imageUrl = '${ApiConfig.formApiBaseUrl}$imagePath';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: GestureDetector(
        onTap: () => _showImageDialog(imageUrl),
        child: Container(
          height: 200,
          width: double.infinity,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.inputBorder),
            borderRadius: BorderRadius.circular(12),
            color: AppColors.background,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                        : null,
                    color: AppColors.primary,
                  ),
                );
              },
              errorBuilder: (_, __, ___) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.broken_image, size: 48, color: AppColors.textHint),
                    SizedBox(height: 8),
                    Text('Image not available',
                        style: TextStyle(fontSize: 12, color: AppColors.textHint)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showImageDialog(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) =>
                    const Center(child: Icon(Icons.broken_image, size: 64, color: Colors.white)),
              ),
            ),
            Positioned(
              top: 0,
              right: 0,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
                style: IconButton.styleFrom(backgroundColor: Colors.black54),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── QuillRichText ───────────────────────────────────────────────────────────
// Renders a question string that may be:
//   1. Quill Delta JSON  (new format: stored by add_question_screen with flutter_quill)
//   2. Plain text        (no formatting)
//   3. Legacy HTML       (old format: stored by old quill_html_editor)
//
// Uses a read-only QuillEditor for Delta JSON.
// Falls back to plain text (stripped of HTML) for legacy content.
class QuillRichText extends StatefulWidget {
  final String content;
  final TextStyle? baseStyle;

  const QuillRichText({super.key, required this.content, this.baseStyle});

  @override
  State<QuillRichText> createState() => _QuillRichTextState();
}

class _QuillRichTextState extends State<QuillRichText> {
  quill.QuillController? _controller;
  bool _isQuillDelta = false;
  late final ScrollController _scrollController;
  late final FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _focusNode = FocusNode(canRequestFocus: false);
    _parse();
  }

  @override
  void didUpdateWidget(covariant QuillRichText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.content != widget.content) {
      _controller?.dispose();
      _controller = null;
      _parse();
    }
  }

  void _parse() {
    final content = widget.content.trim();
    if (content.isEmpty) {
      _isQuillDelta = false;
      return;
    }

    // Detect Quill Delta JSON: starts with '[' and is valid JSON list
    if (content.startsWith('[')) {
      try {
        final decoded = jsonDecode(content);
        if (decoded is List) {
          final doc = quill.Document.fromJson(decoded);
          _controller = quill.QuillController(
            document: doc,
            selection: const TextSelection.collapsed(offset: 0),
            readOnly: true,
          );
          _isQuillDelta = true;
          return;
        }
      } catch (_) {
        // Not valid Delta — fall through
      }
    }
    _isQuillDelta = false;
  }

  @override
  void dispose() {
    _controller?.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.content.isEmpty) return const SizedBox.shrink();

    final base = widget.baseStyle ??
        const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
            height: 1.5);

    // ── Quill Delta (new format) ────────────────────────────────
    if (_isQuillDelta && _controller != null) {
      return ExcludeSemantics(
        child: quill.QuillEditor(
          controller: _controller!,
          scrollController: _scrollController,
          focusNode: _focusNode,
          config: quill.QuillEditorConfig(
            autoFocus: false,
            expands: false,
            scrollable: false,
            padding: EdgeInsets.zero,
            showCursor: false,
            customStyles: quill.DefaultStyles(
              paragraph: quill.DefaultTextBlockStyle(
                base,
                const quill.HorizontalSpacing(0, 0),
                quill.VerticalSpacing.zero,
                quill.VerticalSpacing.zero,
                null,
              ),
            ),
          ),
        ),
      );
    }

    // ── Plain text / legacy HTML ────────────────────────────────
    return Text(_stripHtml(widget.content), style: base);
  }

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
}
