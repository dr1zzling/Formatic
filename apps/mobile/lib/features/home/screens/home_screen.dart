import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/category_chip.dart';
import '../../forms/screens/create_form_screen.dart';
import '../../forms/screens/my_forms_screen.dart';
import '../../forms/screens/form_editor_screen.dart';
import '../../forms/screens/form_viewer_screen.dart';
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
    final result = await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => const CreateFormScreen()));

    _handleCreateResult(result);
  }

  void _handleCreateResult(Object? result) {
    if (result is Map && result['success'] == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Form berhasil dibuat'),
          backgroundColor: AppColors.success,
        ),
      );

      final slug = result['slug'];
      if (slug is String && slug.isNotEmpty && mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => FormEditorScreen(
              formId: result['form_id']?.toString() ?? '',
              formTitle: result['form_title'] ?? 'Untitled',
              formSlug: slug,
              formStatus: result['form_status'],
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _selectedIndex == 2 ? const SizedBox() : _screens[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE0EAF6), width: 1)),
          boxShadow: [
            BoxShadow(
              color: Color(0x0D000000),
              blurRadius: 20,
              offset: Offset(0, -4),
            ),
          ],
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
          backgroundColor: Colors.white,
          elevation: 0,
          selectedItemColor: AppColors.blueAccent,
          unselectedItemColor: AppColors.textHint,
          selectedFontSize: 10,
          unselectedFontSize: 10,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.description_outlined),
              activeIcon: Icon(Icons.description),
              label: 'My Forms',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle, size: 36),
              label: '',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history_outlined),
              activeIcon: Icon(Icons.history),
              label: 'History',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
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
  String _searchQuery = '';

  final List<Map<String, dynamic>> _categories = [
    {'label': 'All', 'selected': true},
    {'label': 'Ujian', 'selected': false},
    {'label': 'Survei', 'selected': false},
    {'label': 'Pengumpulan Data', 'selected': false},
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
        _allForms = forms
            .map(
              (form) => {
                'id': (form['id'] ?? '').toString(),
                'form_id': form['id'],
                'title': form['title'] ?? form['form_title'] ?? 'Untitled Form',
                'slug': form['slug'] ?? form['form_slug'] ?? '',
                'status': form['status'] ?? form['form_status'] ?? 'private',
                'category': form['category'] ?? '',
                'category_id': form['category_id'],
                'questions': 0,
                'responses': '0',
                'badge':
                    ((form['status'] ?? form['form_status'] ?? 'private')
                            as String)
                        .toUpperCase(),
                'hasImage': false,
              },
            )
            .toList();
        _applyFilter();
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _navigateToCreateForm() async {
    final result = await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => const CreateFormScreen()));

    _handleCreateResult(result);
  }

  void _handleCreateResult(Object? result) {
    if (result is Map && result['success'] == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Form berhasil dibuat'),
          backgroundColor: AppColors.success,
        ),
      );

      final slug = result['slug'];
      if (slug is String && slug.isNotEmpty && mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => FormEditorScreen(
              formId: result['form_id']?.toString() ?? '',
              formTitle: result['form_title'] ?? 'Untitled',
              formSlug: slug,
              formStatus: result['form_status'],
            ),
          ),
        );
      }
    }
  }

  void _applyFilter() {
    List<Map<String, dynamic>> filtered = List.from(_allForms);

    if (_selectedCategory != 'All') {
      filtered = filtered.where((form) {
        final category = (form['category'] as String).toLowerCase();
        return category == _selectedCategory.toLowerCase();
      }).toList();
    }

    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((form) {
        final title = (form['title'] as String).toLowerCase();
        return title.contains(_searchQuery.toLowerCase());
      }).toList();
    }

    setState(() {
      _filteredForms = filtered;
    });
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'ujian':
      case 'exam':
        return AppColors.catUjian;
      case 'survey':
        return AppColors.catSurvey;
      default:
        return AppColors.catDefault;
    }
  }

  Color _getCategoryBgColor(String category) {
    switch (category.toLowerCase()) {
      case 'ujian':
      case 'exam':
        return AppColors.catUjianBg;
      case 'survey':
        return AppColors.catSurveyBg;
      default:
        return AppColors.catDefaultBg;
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
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontSize: 15),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _navigateToCreateForm,
              icon: const Icon(Icons.add),
              label: const Text('Create Form'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueAccent,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hi, $_username! 👋',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Fill out forms, give responses, and share your feedback.',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 39,
                    height: 39,
                    decoration: BoxDecoration(
                      color: AppColors.blueAccent,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.inputBorder),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.cardShadow,
                      blurRadius: 12,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: TextField(
                  onChanged: (value) {
                    _searchQuery = value;
                    _applyFilter();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search forms or templates...',
                    hintStyle: TextStyle(
                      color: AppColors.textHint,
                      fontSize: 13,
                    ),
                    prefixIcon: Icon(
                      Icons.search,
                      color: AppColors.blueButton,
                      size: 20,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Category Chips
            SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
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
            const SizedBox(height: 20),
            // Content
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.blueAccent,
                      ),
                    )
                  : _allForms.isEmpty
                  ? _buildEmptyState(context)
                  : RefreshIndicator(
                      onRefresh: _loadForms,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        children: [
                          // Create Form Card
                          _buildCreateFormCard(),
                          const SizedBox(height: 16),
                          // Forms List
                          if (_filteredForms.isEmpty)
                            Padding(
                              padding: const EdgeInsets.all(40),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.search_off,
                                    size: 64,
                                    color: AppColors.textSecondary.withOpacity(
                                      0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No $_selectedCategory forms found',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else
                            ..._filteredForms.map((form) {
                              final cat =
                                  (form['category'] as String?) ?? 'default';
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildFormListItem(form, cat),
                              );
                            }),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreateFormCard() {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.of(context).push(
          MaterialPageRoute(builder: (context) => const CreateFormScreen()),
        );
        _handleCreateResult(result);
        _loadForms();
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFFFFFFF), Color(0xFFF2F8FF)],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 25,
              offset: const Offset(0, 8),
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
                    'FORM MAKER',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.blueButton,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Buat Form\nSemudah Ini',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF103B86),
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Buat form yang menarik, bagikan ke\nsiapapun, dan dapatkan respons.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.blueAccent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.add, color: Colors.white, size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Create Form',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Mini form illustration
            Container(
              width: 120,
              height: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0x29195496),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    height: 26,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1760CE),
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: List.generate(
                        3,
                        (i) => Padding(
                          padding: const EdgeInsets.only(left: 10, top: 9),
                          child: Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.7),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: List.generate(
                        3,
                        (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: const Color(0xFF5596D8),
                                    width: 2,
                                  ),
                                  shape: i == 1
                                      ? BoxShape.rectangle
                                      : BoxShape.circle,
                                  borderRadius: i == 1
                                      ? BorderRadius.circular(3)
                                      : null,
                                  color: i == 1
                                      ? const Color(0xFFE3F2FF)
                                      : null,
                                ),
                                child: i == 1
                                    ? const Center(
                                        child: Text(
                                          '✓',
                                          style: TextStyle(
                                            fontSize: 8,
                                            color: Color(0xFF1767CE),
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      height: 4,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCE7F3),
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Container(
                                      height: 4,
                                      width: 50,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCE7F3),
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
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

  Widget _buildFormListItem(Map<String, dynamic> form, String category) {
    final catColor = _getCategoryColor(category);
    final catBg = _getCategoryBgColor(category);

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => FormViewerScreen(slug: form['slug'] ?? ''),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: catBg,
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(
                Icons.description_outlined,
                color: catColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    form['title'] ?? 'Untitled',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${form['category'] ?? '—'} • 0 responses',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textHint),
          ],
        ),
      ),
    );
  }
}
