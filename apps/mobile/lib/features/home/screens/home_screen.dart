import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/form_service.dart';
import '../widgets/category_chip.dart';
import '../../forms/screens/create_form_screen.dart';
import '../../forms/screens/my_forms_screen.dart';
import '../../forms/screens/form_editor_screen.dart';
import '../../forms/screens/form_viewer_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../scanner/screens/qr_scanner_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  void _navigateToCreateForm() async {
    final result = await Navigator.of(context).push(
        MaterialPageRoute(builder: (context) => const CreateFormScreen()));
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
        Navigator.of(context).push(MaterialPageRoute(
          builder: (context) => FormEditorScreen(
            formId: result['form_id']?.toString() ?? '',
            formTitle: result['form_title'] ?? 'Untitled',
            formSlug: slug,
            formStatus: result['form_status'],
          ),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Map nav index → stack index
    // Nav:   0=Home, 1=MyForms, 2=QR(center), 3=Add, 4=Profile (index 3 di _buildNavItem)
    // Stack: 0=Home, 1=MyForms, 2=Profile
    int stackIndex;
    if (_selectedIndex == 3) {
      stackIndex = 2; // Profile
    } else if (_selectedIndex == 1) {
      stackIndex = 1; // My Forms
    } else {
      stackIndex = 0; // Home (default)
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FA),
      extendBody: true,
      body: IndexedStack(
        index: stackIndex,
        children: const [
          _HomeContent(),
          MyFormsScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // ── Floating Bottom Nav ──────────────────────────────────────
  Widget _buildBottomNav() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: const Color(0xFF1B4A5E),
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1B4A5E).withOpacity(0.45),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            _buildNavItem(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
            _buildNavItem(1, Icons.description_outlined,
                Icons.description_rounded, 'My Forms'),
            _buildNavCenter(),
            _buildNavItemIcon(
                Icons.add_circle_outline_rounded,
                Icons.add_circle_rounded,
                'Add',
                () => _navigateToCreateForm()),
            _buildNavItem(
                3, Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
      int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _selectedIndex == index;
    // Map nav index ke IndexedStack index
    final stackIndex = index == 3 ? 2 : index;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _selectedIndex = index),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              size: 22,
              color: isSelected ? Colors.white : Colors.white.withOpacity(0.5),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                color: isSelected ? Colors.white : Colors.white.withOpacity(0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItemIcon(
      IconData icon, IconData activeIcon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: Colors.white.withOpacity(0.5)),
            const SizedBox(height: 3),
            Text(label,
                style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withOpacity(0.5))),
          ],
        ),
      ),
    );
  }

  Widget _buildNavCenter() {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              fullscreenDialog: true,
              builder: (_) => const QrScannerScreen(),
            ),
          );
        },
        child: Center(
          child: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.5),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.qr_code_scanner_rounded,
                color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HOME CONTENT
// ═══════════════════════════════════════════════════════════════

class _HomeContent extends StatefulWidget {
  const _HomeContent();

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  String _selectedCategory = 'All';
  String _username = 'User';
  bool _isLoading = true;
  List<Map<String, dynamic>> _allForms = [];
  List<Map<String, dynamic>> _filteredForms = [];
  String _searchQuery = '';

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
    if (username != null && mounted) setState(() => _username = username);
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);
    final result = await FormService.getForms();
    if (result['success'] && mounted) {
      // getForms() selalu return {'success': true, 'data': {'data': [...]}}
      final List<dynamic> forms =
          (result['data'] as Map?)?['data'] is List
              ? (result['data'] as Map)['data'] as List
              : [];
      setState(() {
        _allForms = forms.map<Map<String, dynamic>>((form) => {
              'id': (form['id'] ?? '').toString(),
              'form_id': form['id'],
              'title': form['title'] ?? form['form_title'] ?? 'Untitled Form',
              'slug': form['slug'] ?? form['form_slug'] ?? '',
              'status': form['status'] ?? form['form_status'] ?? 'private',
              'category': form['category'] ?? '',
              'questions': 0,
              'responses': '0',
              'banner': form['banner'] ?? '',
            }).toList();
        _applyFilter();
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  void _applyFilter() {
    List<Map<String, dynamic>> filtered = List.from(_allForms);
    if (_selectedCategory != 'All') {
      filtered = filtered.where((f) {
        // Backend stores lowercase ('ujian','survei','pengumpulan data')
        // Chips display with capital first letter
        final formCat = (f['category'] as String? ?? '').toLowerCase().trim();
        final selectedCat = _selectedCategory.toLowerCase().trim();
        return formCat == selectedCat;
      }).toList();
    }
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((f) {
        return (f['title'] as String)
            .toLowerCase()
            .contains(_searchQuery.toLowerCase());
      }).toList();
    }
    setState(() => _filteredForms = filtered);
  }

  void _navigateToCreateForm() async {
    final result = await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const CreateFormScreen()));
    if (result is Map && result['success'] == true && mounted) {
      _loadForms();
      final slug = result['slug'];
      if (slug is String && slug.isNotEmpty) {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => FormEditorScreen(
            formId: result['form_id']?.toString() ?? '',
            formTitle: result['form_title'] ?? 'Untitled',
            formSlug: slug,
            formStatus: result['form_status'],
          ),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // required by AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FA),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            _buildSearchBar(),
            const SizedBox(height: 14),
            _buildCategoryChips(),
            const SizedBox(height: 18),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );  }

  // ── Header ────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      child: Row(
        children: [
          // Hamburger
          GestureDetector(
            onTap: () {},
            child: const Icon(Icons.menu_rounded,
                size: 26, color: AppColors.textPrimary),
          ),
          const SizedBox(width: 14),
          // Greeting
          Expanded(
            child: Text(
              'Hi, $_username',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                fontFamily: 'Plus Jakarta Sans',
              ),
            ),
          ),
          // Avatar
          GestureDetector(
            onTap: () {},
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF28ACCE), Color(0xFF1D93B4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
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
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Search Bar ────────────────────────────────────────────────
  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          onChanged: (value) {
            _searchQuery = value;
            _applyFilter();
          },
          style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search templates...',
            hintStyle:
                const TextStyle(color: AppColors.textHint, fontSize: 13),
            prefixIcon:
                const Icon(Icons.search_rounded, color: AppColors.textHint, size: 20),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 13),
          ),
        ),
      ),
    );
  }

  // ── Category Chips ────────────────────────────────────────────
  Widget _buildCategoryChips() {
    return SizedBox(
      height: 36,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final label = _categories[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CategoryChip(
              label: label,
              isSelected: _selectedCategory == label,
              onTap: () {
                setState(() {
                  _selectedCategory = label;
                  _applyFilter();
                });
              },
            ),
          );
        },
      ),
    );
  }

  // ── Body ──────────────────────────────────────────────────────
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_allForms.isEmpty) {
      return _buildEmptyState();
    }
    return RefreshIndicator(
      onRefresh: _loadForms,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
        children: [
          // Section header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Trending Forms',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                  fontFamily: 'Plus Jakarta Sans',
                ),
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'View all',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_filteredForms.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.search_off,
                        size: 56,
                        color: AppColors.textSecondary.withOpacity(0.4)),
                    const SizedBox(height: 12),
                    Text('Tidak ada form "$_selectedCategory"',
                        style: const TextStyle(
                            fontSize: 14, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            )
          else
            ..._filteredForms.map((form) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _buildFormCard(form),
                )),
        ],
      ),
    );
  }

  // ── Form Card (seperti referensi gambar) ──────────────────────
  Widget _buildFormCard(Map<String, dynamic> form) {
    final status = (form['status'] as String? ?? 'private').toLowerCase();
    final isPublic = status == 'public';
    final category = (form['category'] as String? ?? '').toLowerCase();
    final gradientIndex =
        form['title'].toString().length % AppColors.cardGradients.length;
    final cardGradient = AppColors.cardGradients[gradientIndex];

    return GestureDetector(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => FormViewerScreen(slug: form['slug'] ?? ''))),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top section: badge + title + menu ───────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 12, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPublic
                                ? AppColors.primary.withOpacity(0.12)
                                : AppColors.textSecondary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isPublic ? 'Public' : 'Private',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isPublic
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Title
                        Text(
                          form['title'] ?? 'Untitled Form',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        // Meta: questions · responses
                        Row(
                          children: [
                            Icon(Icons.quiz_outlined,
                                size: 13, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(
                              '${form['questions'] ?? 0} Questions  ·  ${form['responses'] ?? '0'} Responses',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Kebab menu
                  GestureDetector(
                    onTap: () => _showFormMenu(context, form),
                    child: const Padding(
                      padding: EdgeInsets.only(left: 8, top: 2),
                      child: Icon(Icons.more_vert,
                          size: 20, color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),

            // ── Gradient preview banner ──────────────────────────
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(18)),
              child: Container(
                height: 80,
                width: double.infinity,
                decoration: BoxDecoration(gradient: cardGradient),
                child: Stack(
                  children: [
                    // Decorative circles
                    Positioned(
                      right: -20,
                      top: -20,
                      child: Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 30,
                      bottom: -30,
                      child: Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.08),
                        ),
                      ),
                    ),
                    // Category label overlay
                    Positioned(
                      left: 16,
                      bottom: 14,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.22),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          category.isEmpty ? 'Form' : _capitalise(category),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
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
    );
  }

  String _capitalise(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  void _showFormMenu(BuildContext context, Map<String, dynamic> form) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.inputBorder,
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.visibility_outlined,
                  color: AppColors.primary),
              title: const Text('Isi Form'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) =>
                        FormViewerScreen(slug: form['slug'] ?? '')));
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle),
              child: Icon(Icons.description_outlined,
                  size: 50, color: AppColors.primary),
            ),
            const SizedBox(height: 24),
            const Text('Belum Ada Form',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            const Text(
              'Buat form pertama kamu dengan\nmenekan tombol + di bawah.',
              textAlign: TextAlign.center,
              style:
                  TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: _navigateToCreateForm,
              icon: const Icon(Icons.add),
              label: const Text('Buat Form'),
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 28, vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
            ),
          ],
        ),
      ),
    );
  }
}
