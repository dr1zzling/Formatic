import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/form_card.dart';
import '../widgets/category_chip.dart';
import '../../forms/screens/create_form_screen.dart';
import '../../forms/screens/my_forms_screen.dart';
import '../../history/screens/history_screen.dart';
import '../../profile/screens/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  
  final List<Widget> _screens = [
    const _HomeContent(),
    const MyFormsScreen(),
    const SizedBox(),
    const HistoryScreen(),
    const ProfileScreen(),
  ];

  void _navigateToCreateForm() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const CreateFormScreen(),
      ),
    );
    
    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Form created successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _selectedIndex == 2 
          ? const SizedBox()
          : _screens[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) {
            if (index == 2) {
              _navigateToCreateForm();
            } else {
              setState(() {
                _selectedIndex = index;
              });
            }
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: Colors.white,
          unselectedItemColor: Colors.white.withOpacity(0.6),
          selectedFontSize: 12,
          unselectedFontSize: 12,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.description_outlined),
              label: 'My Forms',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle, size: 32),
              label: '',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history),
              label: 'History',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeContent extends StatefulWidget {
  const _HomeContent();

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent> {
  String _selectedCategory = 'All';
  String _username = 'User';
  bool _isLoading = true;
  List<Map<String, dynamic>> _allForms = [];
  List<Map<String, dynamic>> _filteredForms = [];

  final List<Map<String, dynamic>> _categories = [
    {'label': 'All', 'selected': true},
    {'label': 'Exam', 'selected': false},
    {'label': 'Quiz', 'selected': false},
    {'label': 'Survey', 'selected': false},
  ];

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

    final result = await FormService.getForms();
    
    if (result['success'] && mounted) {
      final responseData = result['data']['data'];
      final List<dynamic> forms = responseData ?? [];
      
      setState(() {
        _allForms = forms.map((form) => {
          'id': form['id'].toString(),
          'form_id': form['id'],
          'title': form['form_title'] ?? 'Untitled Form',
          'slug': form['form_slug'] ?? '',
          'status': form['form_status'] ?? 'private',
          'category': form['category'] ?? '',
          'category_id': form['category_id'],
          'questions': 0,
          'responses': '0',
          'badge': (form['form_status'] ?? 'private').toUpperCase(),
          'hasImage': false,
        }).toList();
        _applyFilter();
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _applyFilter() {
    if (_selectedCategory == 'All') {
      _filteredForms = List.from(_allForms);
    } else {
      _filteredForms = _allForms.where((form) {
        final category = (form['category'] as String).toLowerCase();
        return category == _selectedCategory.toLowerCase();
      }).toList();
    }
  }

  Widget _buildEmptyState(BuildContext context) {
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
              'Start creating your first form by tapping\nthe + button below',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const CreateFormScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('Create Form'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const Icon(Icons.menu, size: 24),
                  const SizedBox(width: 12),
                  Text(
                    'Hi, $_username',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const Spacer(),
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search templates...',
                  prefixIcon: const Icon(Icons.search, color: AppColors.textHint),
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
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Category Chips
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: CategoryChip(
                      label: category['label'],
                      isSelected: _selectedCategory == category['label'],
                      onTap: () {
                        setState(() {
                          _selectedCategory = category['label'];
                          _applyFilter();
                        });
                      },
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // Trending Forms Section
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _allForms.isEmpty
                      ? _buildEmptyState(context)
                      : RefreshIndicator(
                          onRefresh: _loadForms,
                          child: ListView(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _selectedCategory == 'All' 
                                        ? 'Trending Forms' 
                                        : '$_selectedCategory Forms',
                                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  Text(
                                    '${_filteredForms.length} forms',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              if (_filteredForms.isEmpty)
                                Padding(
                                  padding: const EdgeInsets.all(40),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.search_off,
                                        size: 64,
                                        color: AppColors.textSecondary.withOpacity(0.5),
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No $_selectedCategory forms found',
                                        style: TextStyle(
                                          fontSize: 16,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              else
                                ..._filteredForms.map((form) => Padding(
                                      padding: const EdgeInsets.only(bottom: 16),
                                      child: FormCard(
                                        title: form['title'],
                                        questions: form['questions'],
                                        responses: form['responses'],
                                        badge: form['badge'],
                                        hasImage: form['hasImage'],
                                      ),
                                    )),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
