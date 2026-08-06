import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/my_form_card.dart';
import 'form_detail_screen.dart';

class MyFormsScreen extends StatefulWidget {
  const MyFormsScreen({super.key});

  @override
  State<MyFormsScreen> createState() => _MyFormsScreenState();
}

class _MyFormsScreenState extends State<MyFormsScreen> {
  int _selectedTab = 0;
  String _username = 'User';
  bool _isLoading = true;
  
  // Forms from backend
  List<Map<String, dynamic>> _myForms = [];
  final List<Map<String, dynamic>> _sharedForms = [];

  @override
  void initState() {
    super.initState();
    _loadUsername();
    _loadForms();
  }

  Future<void> _loadUsername() async {
    final username = await StorageService.getUsername();
    if (username != null && mounted) {
      setState(() {
        _username = username;
      });
    }
  }

  Future<void> _loadForms() async {
    setState(() {
      _isLoading = true;
    });

    final result = await FormService.getUserForms();
    
    if (result['success'] && mounted) {
      final responseData = result['data']['data'];
      final List<dynamic> forms = responseData['form'] ?? [];
      
      setState(() {
        _myForms = forms.map((form) => {
          'id': form['form_id'].toString(),
          'title': form['form_title'] ?? 'Untitled Form',
          'slug': form['form_slug'] ?? '',
          'questions': 0,
          'responses': 0,
          'role': form['access_type'] ?? 'CREATOR',
          'visibility': form['form_status'] ?? 'private',
          'category': form['category'] ?? '',
        }).toList();
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final forms = _selectedTab == 0 ? _myForms : _sharedForms;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Text(
                    'My Forms',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.filter_list, color: AppColors.textPrimary),
                  ),
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Tabs
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _buildTab('All', 0),
                  const SizedBox(width: 12),
                  _buildTab('Shared with me', 1),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Forms List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : forms.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadForms,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: forms.length,
                            itemBuilder: (context, index) {
                              final form = forms[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: MyFormCard(
                                  title: form['title'],
                                  questions: form['questions'],
                                  responses: form['responses'],
                                  role: form['role'],
                                  visibility: form['visibility'],
                                  lastUpdated: form['lastUpdated'],
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => FormDetailScreen(
                                          formId: form['id'],
                                          formTitle: form['title'],
                                          formStatus: form['visibility'],
                                          formSlug: form['slug'],
                                        ),
                                      ),
                                    ).then((_) => _loadForms());
                                  },
                                ),
                              );
                            },
                          ),
                        ),
            ),

            // Create new workspace button
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 48,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create a new workspace',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
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

  Widget _buildTab(String label, int index) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.inputBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
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
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.description_outlined,
                size: 60,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No Forms Yet',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'Create your first form to get started',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
