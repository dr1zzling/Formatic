import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';

class AddQuestionScreen extends StatefulWidget {
  final String? formSlug;
  final String formTitle;
  final Map<String, dynamic>? questionToEdit;

  const AddQuestionScreen({
    super.key,
    this.formSlug,
    required this.formTitle,
    this.questionToEdit,
  });

  @override
  State<AddQuestionScreen> createState() => _AddQuestionScreenState();
}

class _AddQuestionScreenState extends State<AddQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _questionController = TextEditingController();
  final List<TextEditingController> _optionControllers = [];

  String _selectedType = 'radio';
  int? _correctOptionIndex;
  bool _isLoading = false;
  bool _isEditing = false;

  final List<Map<String, dynamic>> _questionTypes = [
    {
      'value': 'radio',
      'label': 'Single Choice',
      'icon': Icons.radio_button_checked,
    },
    {'value': 'checkbox', 'label': 'Multiple Choice', 'icon': Icons.check_box},
    {'value': 'text', 'label': 'Text Input', 'icon': Icons.text_fields},
    {'value': 'file', 'label': 'File Upload', 'icon': Icons.upload_file},
  ];

  @override
  void initState() {
    super.initState();
    _isEditing = widget.questionToEdit != null;
    if (_isEditing) {
      _loadExistingQuestion();
    } else {
      _addOption();
      _addOption();
    }
  }

  void _loadExistingQuestion() {
    final question = widget.questionToEdit;
    _selectedType = question?['type']?.toString() ?? 'radio';
    _questionController.text = question?['question']?.toString() ?? '';

    final options = question?['options'] as List? ?? [];
    for (final option in options) {
      if (option is Map) {
        final controller = TextEditingController(
          text: option['value']?.toString() ?? '',
        );
        _optionControllers.add(controller);
        if (option['is_correct'] == true ||
            option['is_correct'] == 1 ||
            option['is_correct'] == '1' ||
            option['is_correct'] == 'true') {
          _correctOptionIndex = _optionControllers.length - 1;
        }
      }
    }
    if (_optionControllers.isEmpty) {
      _addOption();
      _addOption();
    }
  }

  @override
  void dispose() {
    _questionController.dispose();
    for (var controller in _optionControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    setState(() {
      _optionControllers.add(TextEditingController());
    });
  }

  void _removeOption(int index) {
    if (_optionControllers.length > 1) {
      setState(() {
        _optionControllers[index].dispose();
        _optionControllers.removeAt(index);
        if (_correctOptionIndex == index) {
          _correctOptionIndex = null;
        } else if (_correctOptionIndex != null &&
            _correctOptionIndex! > index) {
          _correctOptionIndex = _correctOptionIndex! - 1;
        }
      });
    }
  }

  bool _needsOptions() {
    return ['radio', 'checkbox', 'rating'].contains(_selectedType);
  }

  Future<void> _saveQuestion() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.formSlug == null || widget.formSlug!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Form slug tidak tersedia'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Validate options if needed
    if (_needsOptions()) {
      bool hasEmptyOption = _optionControllers.any(
        (c) => c.text.trim().isEmpty,
      );
      if (hasEmptyOption) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please fill all options'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final List<Map<String, dynamic>> optionValues = _needsOptions()
          ? _optionControllers.asMap().entries.map((entry) {
              final index = entry.key;
              final controller = entry.value;
              return {
                'value': controller.text.trim(),
                'is_correct': _correctOptionIndex == index,
              };
            }).toList()
          : <Map<String, dynamic>>[];

      final soalPayload = {
        'question': _questionController.text.trim(),
        'type': _selectedType,
      };

      final Map<String, dynamic> result;
      if (_isEditing) {
        final soalId = int.tryParse(widget.questionToEdit!['id'].toString());
        if (soalId == null) {
          throw Exception('Invalid soal id');
        }
        // Attach existing option ids so the backend updates instead of
        // duplicating them.
        final optionsForUpdate = List<Map<String, dynamic>>.from(optionValues);
        final existing = widget.questionToEdit!['options'] as List? ?? [];
        for (var i = 0; i < optionsForUpdate.length; i++) {
          if (i < existing.length && existing[i] is Map) {
            final id = existing[i]['id'];
            if (id != null) {
              optionsForUpdate[i]['id'] = id;
            }
          }
        }
        result = await FormService.updateQuestion(
          soalId: soalId,
          payload: {'soal': soalPayload, 'options': optionsForUpdate},
        );
      } else {
        result = await FormService.createQuestions(
          formSlug: widget.formSlug!,
          questions: [
            {'soal': soalPayload, 'options': optionValues},
          ],
        );
      }

      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        if (result['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _isEditing
                    ? 'Question updated successfully!'
                    : 'Question added successfully!',
              ),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.of(context).pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to save question'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
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
        title: Text(
          _isEditing ? 'Edit Question' : 'Add Question',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Form Title
            Text(
              widget.formTitle,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 24),

            // Question Type Selector
            const Text(
              'Question Type',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _questionTypes.map((type) {
                final isSelected = _selectedType == type['value'];
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedType = type['value'];
                      // Reset options when changing type
                      if (!_needsOptions()) {
                        for (var controller in _optionControllers) {
                          controller.dispose();
                        }
                        _optionControllers.clear();
                        _correctOptionIndex = null;
                      } else if (_optionControllers.isEmpty) {
                        _addOption();
                        _addOption();
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.inputBorder,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          type['icon'],
                          size: 20,
                          color: isSelected
                              ? Colors.white
                              : AppColors.textSecondary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          type['label'],
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // Question Input
            const Text(
              'Question',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _questionController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter your question here...',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.inputBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                    color: AppColors.primary,
                    width: 2,
                  ),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a question';
                }
                return null;
              },
            ),

            // Options (for radio/checkbox/rating)
            if (_needsOptions()) ...[
              const SizedBox(height: 24),

              // Show rating stars for rating type
              if (_selectedType == 'rating') ...[
                const Text(
                  'Rating Scale',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'Preview: 5-Star Rating',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return const Icon(
                            Icons.star,
                            color: Colors.amber,
                            size: 32,
                          );
                        }),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Show options for radio/checkbox
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Options',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _addOption,
                      icon: const Icon(Icons.add, size: 20),
                      label: const Text('Add Option'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._optionControllers.asMap().entries.map((entry) {
                  final index = entry.key;
                  final controller = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        // Show correct icon based on type
                        Icon(
                          _selectedType == 'radio'
                              ? Icons.radio_button_unchecked
                              : Icons.check_box_outline_blank,
                          color: AppColors.textSecondary,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        // Correct answer checkbox (for quiz/exam)
                        Checkbox(
                          value: _correctOptionIndex == index,
                          onChanged: (value) {
                            setState(() {
                              _correctOptionIndex = value == true
                                  ? index
                                  : null;
                            });
                          },
                          activeColor: AppColors.success,
                        ),
                        // Option input
                        Expanded(
                          child: TextFormField(
                            controller: controller,
                            decoration: InputDecoration(
                              hintText: 'Option ${index + 1}',
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
                            ),
                          ),
                        ),
                        // Delete button
                        if (_optionControllers.length > 1)
                          IconButton(
                            onPressed: () => _removeOption(index),
                            icon: const Icon(
                              Icons.delete_outline,
                              color: AppColors.error,
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
                if (_correctOptionIndex != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '✓ Option ${_correctOptionIndex! + 1} marked as correct answer',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.success,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ],

            const SizedBox(height: 32),

            // Save Button
            ElevatedButton(
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
                  : const Text(
                      'Save Question',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
