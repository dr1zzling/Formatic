import 'dart:async';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/config/api_config.dart';

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

  // Timer state
  int? _durationSeconds;
  int? _remainingSeconds;
  Timer? _countdownTimer;
  bool _hasShownWarning = false;

  // When the form requires a token, submission is gated until it is validated.
  bool _tokenValidated = false;
  bool _tokenNeeded = false;

  // Pre-Start screen state
  bool _preStartCompleted = false;
  String _formBanner = '';
  final TextEditingController _tokenController = TextEditingController();
  bool _isCheckingToken = false;
  String _tokenError = '';

  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _loadForm();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _loadForm() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final result = await FormService.getFormBySlug(widget.slug);

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
          _formTitle = data['title'] ?? data['form_title'] ?? 'Untitled Form';
          _category = data['category'] ?? '';
          _tokenRespon = data['token_respon']?.toString() ?? '';
          _tokenNeeded = _tokenRespon.trim().isNotEmpty;
          _tokenValidated = false;

          // Parse banner
          _formBanner = data['banner']?.toString() ?? '';

          // Parse duration — check root level first, then nested setting object.
          // tryParse safely handles int, double, String, or num from JSON.
          final rawDur =
              data['duration'] ??
              (data['setting'] is Map
                  ? (data['setting'] as Map)['duration']
                  : null);
          // Handle num/double (e.g. 60.0) by truncating, then String/int via tryParse.
          final int? duration = rawDur == null
              ? null
              : (rawDur is num
                    ? rawDur.toInt()
                    : int.tryParse(rawDur.toString()));
          if (duration != null && duration > 0) {
            _durationSeconds = duration * 60; // convert minutes to seconds
            _remainingSeconds = _durationSeconds;
            // Timer starts in _onStartForm(), not here
          }

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
              'answer': null,
            };
          }).toList();
          _isLoading = false;
        });
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

  /// Called when user taps "Mulai Form" on the Pre-Start screen.
  /// Validates token if required, then transitions to the active form.
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
        setState(
          () => _tokenError =
              check['message'] ??
              'Token yang Anda masukkan salah. Silakan periksa kembali.',
        );
        return;
      }
      // Token validated — mark as validated so submit works
      setState(() => _tokenValidated = true);
    }

    // Transition to active form and start timer
    setState(() => _preStartCompleted = true);
    if (_durationSeconds != null && _durationSeconds! > 0) {
      _startTimer();
    }
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

  void _startTimer() {
    _countdownTimer?.cancel(); // Cancel any existing timer
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      setState(() {
        if (_remainingSeconds != null && _remainingSeconds! > 0) {
          _remainingSeconds = _remainingSeconds! - 1;

          // Show warning at 60 seconds
          if (_remainingSeconds == 60) {
            _showTimeWarning();
          }

          // Auto-submit at 0 (optional behavior)
          if (_remainingSeconds == 0) {
            timer.cancel();
            _handleAutoSubmit();
          }
        } else {
          timer.cancel();
        }
      });
    });
  }

  Widget _buildTimerDisplay() {
    final minutes = _remainingSeconds! ~/ 60;
    final seconds = _remainingSeconds! % 60;
    final timeString =
        '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    // Color based on remaining time
    Color timerColor;
    if (_remainingSeconds! > 300) {
      // > 5 minutes
      timerColor = AppColors.success;
    } else if (_remainingSeconds! > 120) {
      // 2-5 minutes
      timerColor = AppColors.warning;
    } else {
      // < 2 minutes
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
    if (!_hasShownWarning) {
      _hasShownWarning = true;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: Row(
            children: const [
              Icon(Icons.warning_amber, color: AppColors.error, size: 28),
              SizedBox(width: 8),
              Text('Time Warning'),
            ],
          ),
          content: const Text(
            'You have less than 1 minute remaining! Please submit your answers soon.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text('Continue'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _handleAutoSubmit() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Time is up! Submitting your answers...'),
        backgroundColor: AppColors.error,
      ),
    );

    // Give user 2 seconds to see the message
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      await _handleSubmit(); // Call existing submit logic
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
          decoration: const InputDecoration(
            hintText: 'Masukkan token yang diberikan',
          ),
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
      // Token is required for submit; show a clear notice rather than a fake
      // success. The form stays available to view.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Token wajib diisi untuk mengirim jawaban'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final check = await FormService.checkTokenResponden(
      formSlug: widget.slug,
      token: result.trim(),
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (check['success']) {
      setState(() => _tokenValidated = true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(check['message'] ?? 'Token salah'),
          backgroundColor: AppColors.error,
        ),
      );
      _promptToken();
    }
  }

  Future<void> _pickFile(int index) async {
    final picked = await FilePickerPlatform.instance.pickFiles();
    if (picked.isEmpty) return;
    final file = picked.first;
    final bytes = await file.xFile.readAsBytes();
    if (!mounted) return;

    setState(() {
      _questions[index]['answer'] = {'bytes': bytes, 'filename': file.name};
    });
  }

  Future<void> _handleSubmit() async {
    if (_tokenNeeded && !_tokenValidated) {
      _promptToken();
      return;
    }

    bool hasUnanswered = _questions.any((q) {
      final type = q['type'];
      if (type == 'file') return false;
      return q['answer'] == null;
    });

    if (hasUnanswered) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please answer all questions before submitting'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final List<Map<String, dynamic>> answers = [];
      final List<({Uint8List bytes, String filename})> uploadFiles = [];

      for (final question in _questions) {
        final soalId = question['id'];
        final type = question['type'];
        final answer = question['answer'];

        final Map<String, dynamic> jawaban = {'soal_id': soalId};

        if (type == 'radio') {
          final options = question['options'] as List;
          final selectedOption = options.firstWhere(
            (o) => (o['value'] ?? o['option_value'] ?? '') == answer,
            orElse: () => null,
          );
          if (selectedOption != null) {
            jawaban['soal_option_id'] =
                selectedOption['id'] ?? selectedOption['soal_option_id'];
          }
        } else if (type == 'rating') {
          final options = question['options'] as List;
          final ratingValue = (answer as num?)?.toInt() ?? 0;
          if (ratingValue > 0 && ratingValue <= options.length) {
            final selectedOption = options[ratingValue - 1];
            final id = selectedOption is Map
                ? (selectedOption['id'] ?? selectedOption['soal_option_id'])
                : null;
            if (id != null) {
              jawaban['soal_option_id'] = id;
            }
          }
        } else if (type == 'checkbox') {
          final rawAnswer = question['answer'];
          final List<String> selectedValues = rawAnswer is List
              ? rawAnswer.map((e) => e.toString()).toList()
              : <String>[];
          final options = question['options'] as List;
          final selectedIds = <int>[];
          for (final selected in selectedValues) {
            final opt = options.firstWhere(
              (o) => (o['value'] ?? o['option_value'] ?? '') == selected,
              orElse: () => null,
            );
            if (opt != null) {
              final id = opt['id'] ?? opt['soal_option_id'];
              if (id != null) selectedIds.add(id);
            }
          }
          if (selectedIds.isNotEmpty) {
            jawaban['soal_option_id'] = selectedIds;
          }
        } else if (type == 'text') {
          jawaban['answer_text'] = answer ?? '';
        } else if (type == 'file') {
          final fileMap = answer as Map<dynamic, dynamic>?;
          if (fileMap != null && fileMap['bytes'] != null) {
            uploadFiles.add((
              bytes: fileMap['bytes'] as Uint8List,
              filename: fileMap['filename']?.toString() ?? 'answer.bin',
            ));
            // File-type answers carry no soal_option_id and no answer_text;
            // the backend pairs them by the order in `files`.
          } else {
            // Skip unanswered file questions entirely so the backend does not
            // demand a file for them.
            continue;
          }
        }

        answers.add({'jawaban': jawaban});
      }

      final result = await FormService.submitForm(
        formSlug: widget.slug,
        answers: answers,
        files: uploadFiles,
      );

      setState(() => _isSubmitting = false);

      if (result['success'] && mounted) {
        setState(() => _isSubmitted = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Form submitted successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else if (mounted) {
        final statusCode = result['statusCode'];
        String message = result['message'] ?? 'Failed to submit form';
        if (statusCode == 409) {
          message = 'You have already submitted this form.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Failed to submit form. Please check your connection and try again.',
            ),
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
      appBar:
          (_preStartCompleted &&
              !_isLoading &&
              _errorMessage.isEmpty &&
              !_isSubmitted)
          ? null // SliverAppBar inside _buildActiveForm() handles this
          : AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              leading: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(
                  Icons.arrow_back,
                  color: AppColors.textPrimary,
                ),
              ),
              title: Text(
                _isLoading
                    ? 'Memuat...'
                    : (_isSubmitted ? 'Selesai' : 'Fill Form'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
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
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_outline,
                size: 60,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Thank You!',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your response has been submitted successfully.',
              style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Back to Form'),
              ),
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

  Widget _buildPreStart() {
    final hasBanner = _formBanner.isNotEmpty;
    final bannerUrl = hasBanner
        ? '${ApiConfig.formApiBaseUrl}$_formBanner'
        : '';

    String durationText;
    if (_durationSeconds != null && _durationSeconds! > 0) {
      final mins = _durationSeconds! ~/ 60;
      durationText = '$mins Menit';
    } else {
      durationText = 'Tanpa Batasan Waktu';
    }

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
          'Informasi Form',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Banner
            if (hasBanner)
              Image.network(
                bannerUrl,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 200,
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    size: 64,
                    color: Colors.white54,
                  ),
                ),
              )
            else
              Container(
                height: 200,
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                ),
                child: const Center(
                  child: Icon(
                    Icons.description_outlined,
                    size: 64,
                    color: Colors.white54,
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    _formTitle,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Category badge
                  if (_category.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _category.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),
                  const Divider(color: AppColors.inputBorder),
                  const SizedBox(height: 20),

                  // Info rows
                  _buildInfoRow(
                    icon: Icons.quiz_outlined,
                    label: 'Jumlah Soal',
                    value: '${_questions.length} Pertanyaan',
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    icon: Icons.timer_outlined,
                    label: 'Durasi',
                    value: durationText,
                  ),

                  // Token input (conditional)
                  if (_tokenNeeded) ...[
                    const SizedBox(height: 24),
                    const Divider(color: AppColors.inputBorder),
                    const SizedBox(height: 20),
                    const Text(
                      'Form ini memerlukan token responden.',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _tokenController,
                      decoration: InputDecoration(
                        labelText: 'Token Responden',
                        hintText: 'Masukkan token yang diberikan',
                        prefixIcon: const Icon(
                          Icons.key_outlined,
                          color: AppColors.primary,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.inputBorder,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.inputBorder,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.error),
                        ),
                        errorText: _tokenError.isNotEmpty ? _tokenError : null,
                      ),
                      onChanged: (_) {
                        if (_tokenError.isNotEmpty) {
                          setState(() => _tokenError = '');
                        }
                      },
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Start button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isCheckingToken ? null : _onStartForm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isCheckingToken
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'Mulai Form',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Active form view: sticky banner header + question list.
  /// All question/submit/option logic lives in _buildContent().
  Widget _buildActiveForm() {
    final hasBanner = _formBanner.isNotEmpty;
    final bannerUrl = hasBanner
        ? '${ApiConfig.formApiBaseUrl}$_formBanner'
        : '';

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
            titlePadding: const EdgeInsets.only(
              left: 56,
              bottom: 12,
              right: 16,
            ),
            title: Text(
              _formTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            background: hasBanner
                ? Image.network(
                    bannerUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      decoration: const BoxDecoration(
                        gradient: AppColors.primaryGradient,
                      ),
                    ),
                  )
                : Container(
                    decoration: const BoxDecoration(
                      gradient: AppColors.primaryGradient,
                    ),
                  ),
            collapseMode: CollapseMode.parallax,
          ),
        ),
      ],
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        Container(
          width: double.infinity,
          color: Colors.white,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _formTitle,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _category,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${_questions.length} Questions',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        Expanded(
          child: _questions.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _questions.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildQuestionCard(_questions[index], index),
                    );
                  },
                ),
        ),

        if (_questions.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_tokenNeeded && !_tokenValidated)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: _promptToken,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.info.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.key, size: 18, color: AppColors.info),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Form ini memerlukan token responden. Ketuk untuk memasukkan token.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.info,
                                ),
                              ),
                            ),
                          ],
                        ),
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
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text(
                          'Submit Form',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.quiz_outlined,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Questions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "This form doesn't have any questions yet",
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> question, int index) {
    final options = question['options'] as List? ?? [];
    final type = question['type'] as String;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Q${question['number']}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  question['typeDisplay'],
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
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
              height: 1.5,
            ),
          ),

          // Display question image if exists
          if (question['image'] != null &&
              (question['image'] as String).isNotEmpty)
            _buildQuestionImage(question['image']),

          const SizedBox(height: 20),
          if (type == 'radio' && options.isNotEmpty)
            _buildRadioOptions(question, options, index)
          else if (type == 'checkbox' && options.isNotEmpty)
            _buildCheckboxOptions(question, options, index)
          else if (type == 'text')
            _buildTextInput(question, index)
          else if (type == 'file')
            _buildFileUpload(question, index)
          else if (type == 'rating')
            _buildRatingInput(question, index),
        ],
      ),
    );
  }

  Widget _buildRadioOptions(
    Map<String, dynamic> question,
    List options,
    int index,
  ) {
    return Column(
      children: options.map((option) {
        final optionValue = option['value'] ?? option['option_value'] ?? '';
        final isSelected = question['answer'] == optionValue;

        return InkWell(
          onTap: () {
            setState(() {
              _questions[index]['answer'] = optionValue;
            });
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withOpacity(0.1)
                  : AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.inputBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    optionValue,
                    style: TextStyle(
                      fontSize: 14,
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.textPrimary,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCheckboxOptions(
    Map<String, dynamic> question,
    List options,
    int index,
  ) {
    // Use List<dynamic> cast first to avoid ClassCastException, then convert.
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
              color: isSelected
                  ? AppColors.primary.withOpacity(0.1)
                  : AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.inputBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    optionValue,
                    style: TextStyle(
                      fontSize: 14,
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.textPrimary,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
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
    return TextField(
      maxLines: 4,
      decoration: InputDecoration(
        hintText: 'Type your answer here...',
        filled: true,
        fillColor: AppColors.background,
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
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
      onChanged: (value) {
        _questions[index]['answer'] = value;
      },
    );
  }

  Widget _buildFileUpload(Map<String, dynamic> question, int index) {
    final Map<dynamic, dynamic>? selected =
        question['answer'] as Map<dynamic, dynamic>?;

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
            color: selected != null ? AppColors.success : AppColors.inputBorder,
          ),
        ),
        child: Column(
          children: [
            Icon(
              selected != null ? Icons.insert_drive_file : Icons.upload_file,
              size: 40,
              color: selected != null
                  ? AppColors.success
                  : AppColors.textSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              selected != null
                  ? selected['filename']?.toString() ?? 'File selected'
                  : 'Tap to upload a file',
              style: TextStyle(
                fontSize: 14,
                fontWeight: selected != null
                    ? FontWeight.w600
                    : FontWeight.normal,
                color: selected != null
                    ? AppColors.textPrimary
                    : AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
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
          onPressed: () {
            setState(() {
              _questions[index]['answer'] = rating;
            });
          },
          icon: Icon(
            rating <= selectedRating ? Icons.star : Icons.star_border,
            color: rating <= selectedRating
                ? Colors.amber
                : AppColors.textSecondary,
            size: 32,
          ),
        );
      }),
    );
  }

  Widget _buildQuestionImage(String imagePath) {
    final imageUrl = '${ApiConfig.formApiBaseUrl}$imagePath';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 12),
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
              errorBuilder: (context, error, stackTrace) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(
                      Icons.broken_image,
                      size: 48,
                      color: AppColors.textHint,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Image not available',
                      style: TextStyle(fontSize: 12, color: AppColors.textHint),
                    ),
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
                errorBuilder: (context, error, stackTrace) => const Center(
                  child: Icon(
                    Icons.broken_image,
                    size: 64,
                    color: Colors.white,
                  ),
                ),
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

/// Renders a Quill HTML string as Flutter widgets.
/// Handles: plain text, <p>, <strong>, <em>, <u>, <s>, <pre class="ql-syntax">, <br>.
/// Falls back to plain text if parsing fails.
class QuillRichText extends StatelessWidget {
  final String content;
  final TextStyle? baseStyle;

  const QuillRichText({super.key, required this.content, this.baseStyle});

  @override
  Widget build(BuildContext context) {
    if (content.isEmpty) return const SizedBox.shrink();

    // If no HTML tags, render as plain text
    final hasHtml = RegExp(r'<[a-zA-Z][^>]*>').hasMatch(content);
    if (!hasHtml) {
      return Text(
        content,
        style:
            baseStyle ??
            const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
              height: 1.5,
            ),
      );
    }

    // Parse HTML into blocks
    return _buildHtmlContent(content, baseStyle);
  }

  Widget _buildHtmlContent(String html, TextStyle? base) {
    // Split into block-level segments: paragraphs and code blocks
    final blocks = _splitBlocks(html);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: blocks.map((block) => _renderBlock(block, base)).toList(),
    );
  }

  List<_HtmlBlock> _splitBlocks(String html) {
    final blocks = <_HtmlBlock>[];
    // Match <pre class="ql-syntax"...>...</pre> as code blocks
    final codeRe = RegExp(
      r'<pre[^>]*class="[^"]*ql-syntax[^"]*"[^>]*>([\s\S]*?)<\/pre>',
      caseSensitive: false,
    );
    int pos = 0;
    for (final m in codeRe.allMatches(html)) {
      if (m.start > pos) {
        blocks.add(_HtmlBlock(html.substring(pos, m.start), isCode: false));
      }
      // Decode inner text of code block
      final inner = m.group(1) ?? '';
      blocks.add(_HtmlBlock(_decodeHtmlEntities(inner), isCode: true));
      pos = m.end;
    }
    if (pos < html.length) {
      blocks.add(_HtmlBlock(html.substring(pos), isCode: false));
    }
    return blocks.isEmpty ? [_HtmlBlock(html, isCode: false)] : blocks;
  }

  Widget _renderBlock(_HtmlBlock block, TextStyle? base) {
    if (block.isCode) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF0F0F0),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFD0D0D0)),
        ),
        child: Text(
          block.content,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 14,
            color: Color(0xFF1A1A1A),
            height: 1.5,
          ),
        ),
      );
    }
    // Parse inline rich text from HTML paragraphs
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: _parseInlineHtml(block.content, base),
    );
  }

  Widget _parseInlineHtml(String html, TextStyle? base) {
    // Remove wrapping <p>...</p> tags, replace <br> with newlines
    var text = html
        .replaceAll(RegExp(r'<p[^>]*>', caseSensitive: false), '')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .trim();

    if (text.isEmpty) return const SizedBox.shrink();

    // Check for inline formatting tags
    final hasInline = RegExp(
      r'<(strong|em|u|s|b|i)\b',
      caseSensitive: false,
    ).hasMatch(text);
    if (!hasInline) {
      // No inline formatting â€” strip any remaining tags and render plain
      final plain = _decodeHtmlEntities(
        text.replaceAll(RegExp(r'<[^>]+>'), ''),
      );
      if (plain.trim().isEmpty) return const SizedBox.shrink();
      return Text(
        plain,
        style:
            base ??
            const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
              height: 1.5,
            ),
      );
    }

    // Build a RichText with inline spans
    final spans = _buildInlineSpans(text, base);
    return RichText(text: TextSpan(children: spans));
  }

  List<TextSpan> _buildInlineSpans(String html, TextStyle? base) {
    final defaultStyle =
        base ??
        const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
          height: 1.5,
        );

    final spans = <TextSpan>[];
    // Process strong/em/u/s tags iteratively
    final tagRe = RegExp(
      r'(<(strong|em|u|s|b|i)[^>]*>|<\/(strong|em|u|s|b|i)>)',
      caseSensitive: false,
    );

    bool isBold = false;
    bool isItalic = false;
    bool isUnderline = false;
    bool isStrike = false;
    int pos = 0;

    void flushText(String text) {
      if (text.isEmpty) return;
      final decoded = _decodeHtmlEntities(
        text.replaceAll(RegExp(r'<[^>]+>'), ''),
      );
      if (decoded.isEmpty) return;
      spans.add(
        TextSpan(
          text: decoded,
          style: defaultStyle.copyWith(
            fontWeight: isBold ? FontWeight.bold : defaultStyle.fontWeight,
            fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
            decoration: TextDecoration.combine([
              if (isUnderline) TextDecoration.underline,
              if (isStrike) TextDecoration.lineThrough,
            ]),
          ),
        ),
      );
    }

    for (final m in tagRe.allMatches(html)) {
      if (m.start > pos) {
        flushText(html.substring(pos, m.start));
      }
      final tag = m.group(0)!.toLowerCase();
      if (tag.startsWith('</')) {
        final name = tag.replaceAll(RegExp(r'[<>/]'), '').trim();
        if (name == 'strong' || name == 'b') isBold = false;
        if (name == 'em' || name == 'i') isItalic = false;
        if (name == 'u') isUnderline = false;
        if (name == 's') isStrike = false;
      } else {
        if (tag.contains('strong') || tag.contains('<b')) isBold = true;
        if (tag.contains('em') || tag.contains('<i')) isItalic = true;
        if (tag.contains('<u')) isUnderline = true;
        if (tag.contains('<s')) isStrike = true;
      }
      pos = m.end;
    }
    if (pos < html.length) {
      flushText(html.substring(pos));
    }
    return spans;
  }

  String _decodeHtmlEntities(String text) {
    return text
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ');
  }
}

class _HtmlBlock {
  final String content;
  final bool isCode;
  const _HtmlBlock(this.content, {required this.isCode});
}
