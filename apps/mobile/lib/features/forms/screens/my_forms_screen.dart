import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/my_form_card.dart';
import 'form_editor_screen.dart';

class MyFormsScreen extends StatefulWidget {
  const MyFormsScreen({super.key});

  @override
  State<MyFormsScreen> createState() => _MyFormsScreenState();
}

class _MyFormsScreenState extends State<MyFormsScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  int _selectedTab = 0;
  String _username = 'User';
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedCategory = 'All';
  List<Map<String, dynamic>> _myForms = [];
  List<Map<String, dynamic>> _filteredForms = [];

  final List<String> _categories = [
    'All',
    'Ujian',
    'Survei',
    'Pengumpulan Data',
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
      setState(() => _username = username);
    }
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);

    final result = await FormService.getUserForms();

    if (result['success'] && mounted) {
      // Backend: { message, data: { user_id, username, forms: [...] } }
      // getUserForms() returns: {'success': true, 'data': jsonDecode(body)}
      // So result['data'] = { message, data: { user_id, username, forms: [] } }
      final dynamic topLevel = result['data'];
      List<dynamic> forms = [];

      if (topLevel is Map) {
        final inner = topLevel['data'];
        if (inner is Map) {
          // { user_id, username, forms: [...] }
          final f = inner['forms'] ?? inner['form'] ?? [];
          forms = f is List ? f : [];
        } else if (inner is List) {
          forms = inner;
        }
      }

      setState(() {
        _myForms = forms
            .map(
              (form) => {
                'id': (form['form_id'] ?? form['id'] ?? '').toString(),
                'title': form['form_title'] ?? form['title'] ?? 'Untitled Form',
                'slug': form['form_slug'] ?? form['slug'] ?? '',
                'questions': 0,
                'responses': 0,
                'role': (form['access_type'] ?? 'CREATOR')
                    .toString()
                    .toUpperCase(),
                'visibility': form['form_status'] ?? form['status'] ?? 'private',
                'category': form['category'] ?? '',
              },
            )
            .toList();
        _applyFilters();
        _isLoading = false;
      });
      // Load question and response counts in background
      _loadFormCounts();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadFormCounts() async {
    if (_myForms.isEmpty) return;

    // Load all counts in parallel
    final futures = _myForms.map((form) async {
      final slug = form['slug'] as String? ?? '';
      if (slug.isEmpty) return {'slug': slug, 'questions': 0, 'responses': 0};

      int questionCount = 0;
      int responseCount = 0;

      // Load questions count from getFormBySlug
      try {
        final formResult = await FormService.getFormBySlug(slug);
        if (formResult['success'] == true) {
          final data = formResult['data']?['data'];
          final rawSoal = data is Map && data['soal'] is List
              ? data['soal'] as List
              : [];
          // Flatten page-grouped structure
          questionCount = rawSoal.fold<int>(0, (count, pageGroup) {
            if (pageGroup is Map && pageGroup['soal'] is List) {
              return count + (pageGroup['soal'] as List).length;
            }
            return count + 1;
          });
        }
      } catch (_) {}

      // Load responses count from getSubmitStats
      try {
        final statsResult = await FormService.getSubmitStats(slug);
        if (statsResult['success'] == true) {
          final statsData = statsResult['data'];
          if (statsData is Map) {
            final inner = statsData['data'];
            if (inner is Map) {
              responseCount = (inner['total_submit'] as num?)?.toInt() ?? 0;
            }
          }
        }
      } catch (_) {}

      return {
        'slug': slug,
        'questions': questionCount,
        'responses': responseCount,
      };
    }).toList();

    final results = await Future.wait(futures);

    if (!mounted) return;

    setState(() {
      final countMap = {for (final r in results) (r['slug'] as String): r};
      _myForms = _myForms.map((form) {
        final slug = form['slug'] as String? ?? '';
        final counts = countMap[slug];
        if (counts == null) return form;
        return {
          ...form,
          'questions': counts['questions'] as int,
          'responses': counts['responses'] as int,
        };
      }).toList();
      _applyFilters();
    });
  }

  void _applyFilters() {
    _filteredForms = _myForms.where((form) {
      final matchesSearch =
          _searchQuery.isEmpty ||
          (form['title'] as String).toLowerCase().contains(
            _searchQuery.toLowerCase(),
          );
      final matchesCategory =
          _selectedCategory == 'All' ||
          (form['category'] as String).toLowerCase() ==
              _selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // required by AutomaticKeepAliveClientMixin
    final forms = _selectedTab == 0
        ? _filteredForms
        : _filteredForms.where((f) => f['role'] == 'COLLABORATOR').toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  Text(
                    'My Forms',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF28ACCE), Color(0xFF1D93B4)],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          fontFamily: 'Plus Jakarta Sans',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Search
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE4EEF8)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: TextField(
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                      _applyFilters();
                    });
                  },
                  decoration: const InputDecoration(
                    hintText: 'Cari form...',
                    hintStyle: TextStyle(
                      color: AppColors.textHint,
                      fontSize: 13,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 13),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Category filter
            SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedCategory = cat;
                          _applyFilters();
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : const Color(0xFFD9E6F6),
                            width: isSelected ? 1.5 : 1,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.20),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            cat,
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : AppColors.textSecondary,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              fontSize: 12,
                              fontFamily: 'Plus Jakarta Sans',
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 14),

            // Tabs
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _buildTab('Semua', 0),
                  const SizedBox(width: 10),
                  _buildTab('Dibagikan', 1),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Forms List
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    )
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
                                Navigator.of(context)
                                    .push(
                                      MaterialPageRoute(
                                        builder: (context) => FormEditorScreen(
                                          formId: form['id'],
                                          formTitle: form['title'],
                                          formSlug: form['slug'],
                                          formStatus: form['visibility'],
                                        ),
                                      ),
                                    )
                                    .then((_) => _loadForms());
                              },
                            ),
                          );
                        },
                      ),
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
      onTap: () => setState(() => _selectedTab = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFD9E6F6),
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.20),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            fontSize: 13,
            fontFamily: 'Plus Jakarta Sans',
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
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontSize: 15),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
