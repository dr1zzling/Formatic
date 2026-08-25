import 'package:flutter/material.dart';
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
  String _errorMessage = '';
  bool _isSubmitting = false;
  bool _isSubmitted = false;

  String _formTitle = '';
  String _category = '';
  int _formId = 0;
  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _loadForm();
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
        final formId = data['form_id'] ?? data['id'];
        final questionsResult = await FormService.getFormQuestions(formId);

        if (questionsResult['success']) {
          final questionsData = questionsResult['data'];
          final List<dynamic> listSoal;
          String categoryFromQuestions = '';
          if (questionsData is List) {
            listSoal = questionsData;
          } else if (questionsData is Map && questionsData['data'] is List) {
            listSoal = questionsData['data'];
            categoryFromQuestions = questionsData['category'] ?? '';
          } else {
            listSoal = [];
          }

          setState(() {
            _formId = formId;
            _formTitle = data['form_title'] ?? 'Untitled Form';
            _category = data['category'] ?? categoryFromQuestions;
            _questions = listSoal.asMap().entries.map((entry) {
              final index = entry.key;
              final soal = entry.value;
              return {
                'id': soal['id'],
                'number': index + 1,
                'question': soal['question'],
                'type': soal['type'],
                'typeDisplay': _mapQuestionType(soal['type']),
                'options': soal['options'] ?? [],
                'answer': null,
              };
            }).toList();
            _isLoading = false;
          });
        } else {
          setState(() {
            _errorMessage = questionsResult['message'] ?? 'Failed to load questions';
            _isLoading = false;
          });
        }
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

  String _mapQuestionType(String type) {
    switch (type.toLowerCase()) {
      case 'radio': return 'Single Choice';
      case 'checkbox': return 'Multiple Choice';
      case 'text': return 'Text Answer';
      case 'file': return 'File Upload';
      case 'rating': return 'Rating';
      default: return type;
    }
  }

  Future<void> _handleSubmit() async {
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

      for (final question in _questions) {
        final soalId = question['id'];
        final type = question['type'];
        final answer = question['answer'];

        final Map<String, dynamic> jawaban = {'soal_id': soalId};

        if (type == 'radio') {
          final options = question['options'] as List;
          final selectedOption = options.firstWhere(
            (o) => (o['option_value'] ?? '') == answer,
            orElse: () => null,
          );
          if (selectedOption != null) {
            jawaban['soal_option_id'] = selectedOption['soal_option_id'] ?? selectedOption['id'];
          }
        } else if (type == 'checkbox') {
          final List<String> selectedValues = (answer as List<String>?) ?? [];
          final options = question['options'] as List;
          final selectedIds = <int>[];
          for (final selected in selectedValues) {
            final opt = options.firstWhere(
              (o) => (o['option_value'] ?? '') == selected,
              orElse: () => null,
            );
            if (opt != null && (opt['soal_option_id'] != null || opt['id'] != null)) {
              selectedIds.add(opt['soal_option_id'] ?? opt['id']);
            }
          }
          jawaban['soal_option_id'] = selectedIds;
        } else if (type == 'text') {
          jawaban['answer_text'] = answer ?? '';
        }

        answers.add({'jawaban': jawaban});
      }

      final result = await FormService.submitForm(
        formId: _formId,
        answers: answers,
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
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
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
        title: const Text(
          'Fill Form',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _isSubmitted
              ? _buildSuccessState()
              : _errorMessage.isNotEmpty
                  ? _buildErrorState()
                  : _buildContent(),
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
              child: const Icon(Icons.check_circle_outline, size: 60, color: AppColors.success),
            ),
            const SizedBox(height: 24),
            const Text(
              'Thank You!',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
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
            Text(_errorMessage, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _loadForm, child: const Text('Retry')),
          ],
        ),
      ),
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
              Text(_formTitle, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_category, style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(width: 12),
                  Text('${_questions.length} Questions', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
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
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
              ],
            ),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                    )
                  : const Text('Submit Form', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
          Icon(Icons.quiz_outlined, size: 80, color: AppColors.textSecondary.withOpacity(0.5)),
          const SizedBox(height: 16),
          const Text('No Questions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text(
            "This form doesn't have any questions yet",
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary.withOpacity(0.7)),
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
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
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
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Q${question['number']}',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  question['typeDisplay'],
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            question['question'],
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textPrimary, height: 1.5),
          ),
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

  Widget _buildRadioOptions(Map<String, dynamic> question, List options, int index) {
    return Column(
      children: options.map((option) {
        final optionValue = option['option_value'] ?? '';
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
              color: isSelected ? AppColors.primary.withOpacity(0.1) : AppColors.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.inputBorder,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    optionValue,
                    style: TextStyle(
                      fontSize: 14,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
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

  Widget _buildCheckboxOptions(Map<String, dynamic> question, List options, int index) {
    List<String> selectedValues = (question['answer'] as List<String>?) ?? [];

    return Column(
      children: options.map((option) {
        final optionValue = option['option_value'] ?? '';
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
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    optionValue,
                    style: TextStyle(
                      fontSize: 14,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
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
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.inputBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.inputBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
      ),
      onChanged: (value) {
        _questions[index]['answer'] = value;
      },
    );
  }

  Widget _buildFileUpload(Map<String, dynamic> question, int index) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        children: [
          const Icon(Icons.upload_file, size: 40, color: AppColors.textSecondary),
          const SizedBox(height: 12),
          Text(
            'File upload not yet supported',
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
        ],
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
            color: rating <= selectedRating ? Colors.amber : AppColors.textSecondary,
            size: 32,
          ),
        );
      }),
    );
  }
}
