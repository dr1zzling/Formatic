import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/form_card.dart';
import '../../forms/widgets/create_form_sheet.dart';
import '../../forms/screens/form_viewer_screen.dart';
import '../../forms/screens/my_forms_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../trash/screens/trash_screen.dart';

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
    const TrashScreen(),
    const ProfileScreen(),
  ];

  void _createForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => CreateFormSheet(
        onCreated: (slug) {
          Navigator.of(sheetContext).pop();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Form created successfully!'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(index: _selectedIndex, children: _screens),
      bottomNavigationBar: _FloatingNav(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        onAdd: _createForm,
      ),
    );
  }
}

// ── Floating pill bottom navigation (sama dengan web mobile) ────────────────
class _FloatingNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final VoidCallback onAdd;

  const _FloatingNav({
    required this.currentIndex,
    required this.onTap,
    required this.onAdd,
  });

  static const _items = [
    (icon: Icons.home, label: 'Home'),
    (icon: Icons.description_outlined, label: 'My Form'),
    (icon: Icons.delete_outline, label: 'Trash'),
    (icon: Icons.person_outline, label: 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1F000000),
              blurRadius: 32,
              offset: Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: List.generate(_items.length, (i) {
            final item = _items[i];
            final active = currentIndex == i;
            return Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => onTap(i),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: active
                        ? const Color(0x1F005FB3)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        item.icon,
                        size: 21,
                        color: active
                            ? AppColors.primary
                            : const Color(0xFF9CA3AF),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: active
                              ? AppColors.primary
                              : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ── Dashboard content (sama dengan web Home) ────────────────────────────────
class _HomeContent extends StatefulWidget {
  const _HomeContent();

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent> {
  static const _categories = ['All', 'Public', 'Quiz', 'Survey'];

  String _selectedCategory = 'All';
  String _username = 'User';
  bool _isLoading = true;
  String _error = '';
  List<Map<String, dynamic>> _allForms = [];
  List<Map<String, dynamic>> _filteredForms = [];
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadUsername();
    _loadForms();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _categoryName(Map<String, dynamic> form) {
    final cat = form['category'];
    if (cat is String && cat.isNotEmpty) return cat;
    final id = form['category_id'];
    if (id == 1) return 'Quiz';
    if (id == 2) return 'Survey';
    return '';
  }

  Future<void> _loadUsername() async {
    final username = await StorageService.getUsername();
    if (username != null && mounted) {
      setState(() => _username = username);
    }
  }

  Future<void> _loadForms() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });

    final result = await FormService.getForms();

    if (result['success'] && mounted) {
      final responseData =
          result['data'] is Map ? result['data']['data'] : null;
      final List<dynamic> forms = responseData is List ? responseData : [];

      setState(() {
        _allForms = forms.asMap().entries.map((entry) {
          final form = (entry.value is Map)
              ? Map<String, dynamic>.from(entry.value as Map)
              : <String, dynamic>{};
          return {
            'index': entry.key,
            'title': form['title'] ?? form['form_title'] ?? 'Untitled Form',
            'slug': form['slug'] ?? form['form_slug'] ?? '',
            'status': form['status'] ?? form['form_status'] ?? 'private',
            'category': _categoryName(form),
            'responses': form['total_respon'] is int
                ? form['total_respon']
                : (form['responses'] ?? 0),
          };
        }).toList();
        _applyFilter();
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = result['message'] ?? 'Gagal memuat form.';
        _isLoading = false;
      });
    }
  }

  void _applyFilter() {
    final query = _searchQuery.trim().toLowerCase();
    _filteredForms = _allForms.where((form) {
      final matchesCategory = _selectedCategory == 'All' ||
          (_selectedCategory == 'Public'
              ? (form['status'] as String).toLowerCase() == 'public'
              : (form['category'] as String).toLowerCase() ==
                  _selectedCategory.toLowerCase());
      final matchesQuery = query.isEmpty ||
          (form['title'] as String).toLowerCase().contains(query);
      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Hi, $_username!',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _circleBtn(const Icon(Icons.notifications_none, size: 18)),
                const SizedBox(width: 8),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: AppColors.avatarGradient,
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

          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                    _applyFilter();
                  });
                },
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search forms or templates...',
                  hintStyle: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 14,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: Color(0xFF9CA3AF),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: AppColors.primaryLight,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),

          // Category tabs + refresh
          const SizedBox(height: 16),
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                ..._categories.map((cat) {
                  final selected = _selectedCategory == cat;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedCategory = cat;
                        _applyFilter();
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: selected
                            ? AppColors.primaryGradient
                            : null,
                        color: selected ? null : Colors.white,
                        borderRadius: BorderRadius.circular(50),
                        border: selected
                            ? null
                            : Border.all(color: const Color(0xFFE5E7EB)),
                        boxShadow: selected
                            ? [
                                BoxShadow(
                                  color:
                                      AppColors.primary.withOpacity(0.3),
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
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: selected
                                ? Colors.white
                                : const Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: _loadForms,
                  child: Container(
                    width: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: const Icon(
                      Icons.refresh,
                      size: 15,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Recommended Forms',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const Text(
                        'View all →',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(child: _buildBody()),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _circleBtn(Widget child) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Center(
        child: DefaultTextStyle(
          style: const TextStyle(color: Color(0xFF6B7280)),
          child: child,
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return ListView(
        children: List.generate(4, (_) => const _SkeletonCard()),
      );
    }

    if (_error.isNotEmpty && _allForms.isEmpty) {
      return _EmptyState(
        icon: '😕',
        title: _error,
        buttonLabel: 'Coba Lagi',
        onPressed: _loadForms,
      );
    }

    if (_filteredForms.isEmpty) {
      return _EmptyState(
        icon: _allForms.isEmpty ? '📋' : '🔍',
        title: _allForms.isEmpty ? 'Belum ada form tersedia' : 'Form tidak ditemukan',
        subtitle: _allForms.isEmpty
            ? 'Coba kategori lain atau buat form baru.'
            : 'Coba kata kunci lain.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadForms,
      child: ListView.separated(
        padding: const EdgeInsets.only(bottom: 24),
        itemCount: _filteredForms.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final form = _filteredForms[index];
          final slug = form['slug'] as String;
          return FormCard(
            title: form['title'],
            category: form['category'],
            status: form['status'],
            responses: form['responses'],
            gradientIndex: form['index'],
            onTap: slug.isNotEmpty
                ? () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => FormViewerScreen(slug: slug),
                      ),
                    );
                  }
                : null,
            onFill: slug.isNotEmpty
                ? () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => FormViewerScreen(slug: slug),
                      ),
                    );
                  }
                : null,
          );
        },
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(height: 120, color: const Color(0xFFF3F4F6)),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 80,
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  width: 180,
                  height: 16,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String icon;
  final String title;
  final String? subtitle;
  final String? buttonLabel;
  final VoidCallback? onPressed;

  const _EmptyState({
    required this.icon,
    required this.title,
    this.subtitle,
    this.buttonLabel,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 44)),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ],
            if (buttonLabel != null) ...[
              const SizedBox(height: 16),
              GestureDetector(
                onTap: onPressed,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    buttonLabel!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
