import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../widgets/app_logo.dart';
import '../widgets/visibility_toggle.dart';

class CreateFormScreen extends StatefulWidget {
  const CreateFormScreen({super.key});

  @override
  State<CreateFormScreen> createState() => _CreateFormScreenState();
}

class _CreateFormScreenState extends State<CreateFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  String _visibility = 'Public';
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  void _handleCreateForm() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      final result = await FormService.createForm(
        title: _titleController.text.trim(),
        categoryId: 1, // Default to category 1
      );

      setState(() {
        _isLoading = false;
      });

      if (result['success'] && mounted) {
        Navigator.of(context).pop(true); // Return true to indicate success
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to create form'),
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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppLogo(),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Create New Form',
                          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Design your data collection flow with ease.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 32),
                        Text(
                          'FORM TITLE',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _titleController,
                          decoration: InputDecoration(
                            hintText: 'e.g. Customer Satisfaction Survey',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: AppColors.inputBorder,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter a form title';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'VISIBILITY',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: VisibilityToggle(
                                label: 'Public',
                                icon: Icons.public,
                                isSelected: _visibility == 'Public',
                                onTap: () {
                                  setState(() {
                                    _visibility = 'Public';
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: VisibilityToggle(
                                label: 'Private',
                                icon: Icons.lock_outline,
                                isSelected: _visibility == 'Private',
                                onTap: () {
                                  setState(() {
                                    _visibility = 'Private';
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleCreateForm,
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Text('Create Form'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: Text(
                              'Cancel',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
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
        ),
      ),
    );
  }
}
