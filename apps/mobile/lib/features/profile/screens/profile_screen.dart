import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../auth/screens/login_screen.dart';

const _profileTabs = ['Profil', 'Keamanan', 'Notifikasi', 'Integrasi'];

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _username = 'User';
  String _activeTab = 'Profil';

  String _fullName = '';
  String _uname = '';
  String _bio = 'Membuat form, mengumpulkan respons, dan berbagi ide.';
  String _lang = 'Bahasa Indonesia';
  bool _saving = false;

  String _currentPassword = '';
  String _newPassword = '';
  String _confirmPassword = '';
  bool _changingPassword = false;

  late final TextEditingController _fullNameController;
  late final TextEditingController _unameController;
  late final TextEditingController _bioController;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController(text: _fullName);
    _unameController = TextEditingController(text: _uname);
    _bioController = TextEditingController(text: _bio);
    _loadUserInfo();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _unameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadUserInfo() async {
    final username = await StorageService.getUsername();
    if (username != null && mounted) {
      setState(() {
        _username = username;
        _fullName = username;
        _uname = username;
        _fullNameController.text = username;
        _unameController.text = username;
      });
    }
  }

  String get _initials =>
      _username.length >= 2 ? _username.substring(0, 2).toUpperCase() : _username.toUpperCase();

  void _showToast(String message, {bool success = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              success ? Icons.check_circle : Icons.error,
              size: 16,
              color: success ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF1F2937),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _handleSave() async {
    setState(() => _saving = true);
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _saving = false);
    _showToast('Perubahan berhasil disimpan!');
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Keluar dari Akun'),
        content: const Text('Yakin ingin keluar dari akun ini?'),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await StorageService.clearToken();
      await StorageService.clearUsername();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  void _changePassword() {
    if (_currentPassword.isEmpty ||
        _newPassword.isEmpty ||
        _confirmPassword.isEmpty) {
      _showToast('Semua kolom password wajib diisi.', success: false);
      return;
    }
    if (_newPassword != _confirmPassword) {
      _showToast('Konfirmasi password tidak cocok.', success: false);
      return;
    }
    _showToast('Password berhasil diganti!');
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hi, $_username! 👋',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Kelola informasi profil dan pengaturan akunmu.',
                        style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                      ),
                    ],
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
                      _initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: _profileTabs.map((tab) {
                final active = _activeTab == tab;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _activeTab = tab),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: active
                                ? const Color(0xFF3B82F6)
                                : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          tab,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: active
                                ? const Color(0xFF2563EB)
                                : const Color(0xFF6B7280),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Content
          Expanded(
            child: Container(
              color: AppColors.background,
              child: _buildTabContent(),
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
      child: Center(child: child),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case 'Keamanan':
        return _buildKeamanan();
      case 'Notifikasi':
      case 'Integrasi':
        return _buildComingSoon();
      default:
        return _buildProfil();
    }
  }

  Widget _buildComingSoon() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('🚧', style: TextStyle(fontSize: 44)),
          SizedBox(height: 12),
          Text(
            'Coming Soon',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Fitur ini sedang dalam pengembangan.',
            style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }

  Widget _buildProfil() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Informasi Profil',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Kelola informasi profil yang akan ditampilkan di Formatic.',
          style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
        ),
        const SizedBox(height: 20),

        // Avatar
        Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    gradient: AppColors.avatarGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      _initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                    ),
                    child: const Icon(
                      Icons.photo_camera_outlined,
                      size: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'JPG, PNG, atau GIF. Maks. 3MB',
                  style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _showToast('Pilih foto dari galeri.', success: false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: const Text(
                      'Ganti Foto',
                      style: TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 24),

        _field(
          label: 'Nama Lengkap',
          child: _buildTextField(
            controller: _fullNameController,
            onChanged: (v) => _fullName = v,
          ),
        ),
        const SizedBox(height: 16),
        _field(
          label: 'Username',
          helper: 'Username dapat diperbarui sebagai form',
          child: _buildTextField(
            controller: _unameController,
            onChanged: (v) => _uname = v,
          ),
        ),
        const SizedBox(height: 16),
        _field(
          label: 'Bio',
          child: TextField(
            controller: _bioController,
            maxLines: 3,
            maxLength: 160,
            onChanged: (v) => setState(() => _bio = v),
            style: const TextStyle(fontSize: 14),
            decoration: _inputDecoration(),
            buildCounter: (context,
                {required currentLength, required isFocused, maxLength}) {
              return Text(
                '$currentLength/$maxLength',
                style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        _field(
          label: 'Bahasa',
          child: DropdownButtonFormField<String>(
            initialValue: _lang,
            decoration: _inputDecoration(),
            items: ['Bahasa Indonesia', 'English']
                .map((l) => DropdownMenuItem(value: l, child: Text(l)))
                .toList(),
            onChanged: (v) => setState(() => _lang = v ?? 'Bahasa Indonesia'),
          ),
        ),

        const SizedBox(height: 20),

        GestureDetector(
          onTap: _saving ? null : _handleSave,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Simpan Perubahan',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Aksi Cepat
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF3F4F6)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Aksi Cepat',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              _quickAction('Ganti Password', () {
                setState(() => _activeTab = 'Keamanan');
              }),
              _quickAction('Unduh Data Saya', () {
                _showToast('Fitur unduh data belum tersedia.', success: false);
              }),
              _quickAction('Log Aktivitas', () {
                _showToast('Fitur log aktivitas belum tersedia.', success: false);
              }),
              const Divider(height: 1, color: Color(0xFFF3F4F6)),
              GestureDetector(
                onTap: _handleLogout,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    children: [
                      const Text(
                        '🚪 ',
                        style: TextStyle(fontSize: 15),
                      ),
                      const Expanded(
                        child: Text(
                          'Keluar dari Akun',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFFEF4444),
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        size: 14,
                        color: Color(0xFFD1D5DB),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _quickAction(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
              ),
            ),
            const Icon(Icons.chevron_right, size: 14, color: Color(0xFFD1D5DB)),
          ],
        ),
      ),
    );
  }

  Widget _buildKeamanan() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Keamanan Akun',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF3F4F6)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _field(
                label: 'Password Saat Ini',
                child: TextField(
                  obscureText: true,
                  onChanged: (v) => _currentPassword = v,
                  decoration: _inputDecoration(hint: '••••••••'),
                ),
              ),
              const SizedBox(height: 16),
              _field(
                label: 'Password Baru',
                child: TextField(
                  obscureText: true,
                  onChanged: (v) => _newPassword = v,
                  decoration: _inputDecoration(hint: '••••••••'),
                ),
              ),
              const SizedBox(height: 16),
              _field(
                label: 'Konfirmasi Password',
                child: TextField(
                  obscureText: true,
                  onChanged: (v) => _confirmPassword = v,
                  decoration: _inputDecoration(hint: '••••••••'),
                ),
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: _changingPassword ? null : _changePassword,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      'Ganti Password',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _field({required String label, String? helper, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF6B7280),
            letterSpacing: 0.6,
          ),
        ),
        const SizedBox(height: 8),
        child,
        if (helper != null) ...[
          const SizedBox(height: 4),
          Text(
            helper,
            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
          ),
        ],
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
  }) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: const TextStyle(fontSize: 14),
      decoration: _inputDecoration(),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF93C5FD), width: 2),
      ),
    );
  }
}
