import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/storage_service.dart';
import '../../auth/screens/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  String _username = 'User';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    setState(() => _isLoading = true);
    final username = await StorageService.getUsername();
    if (mounted) {
      setState(() {
        _username = username ?? 'User';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Logout'),
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

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmController = TextEditingController();
    var controllersDisposed = false;
    void disposeControllers() {
      if (!controllersDisposed) {
        controllersDisposed = true;
        currentPasswordController.dispose();
        newPasswordController.dispose();
        confirmController.dispose();
      }
    }

    bool lifting = false;
    bool obscureCurrentPassword = true;
    bool obscureNewPassword = true;
    bool obscureConfirmPassword = true;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) {
          final mediaQuery = MediaQuery.of(context);
          final maxDialogHeight =
              (mediaQuery.size.height -
                      mediaQuery.viewInsets.bottom -
                      mediaQuery.padding.top -
                      mediaQuery.padding.bottom -
                      48)
                  .clamp(300.0, mediaQuery.size.height)
                  .toDouble();

          InputDecoration passwordDecoration({
            required String label,
            required String hint,
            required bool obscureText,
            required VoidCallback onToggleVisibility,
          }) {
            return InputDecoration(
              labelText: label,
              hintText: hint,
              filled: true,
              fillColor: AppColors.inputFill,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 15,
              ),
              suffixIcon: IconButton(
                tooltip: obscureText
                    ? 'Tampilkan password'
                    : 'Sembunyikan password',
                onPressed: lifting ? null : onToggleVisibility,
                icon: Icon(
                  obscureText
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: AppColors.primary,
                  width: 1.6,
                ),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.inputBorder),
              ),
            );
          }

          return Dialog(
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 24,
            ),
            elevation: 0,
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22),
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 360,
                maxHeight: maxDialogHeight,
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          height: 44,
                          width: 44,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.lock_outline,
                            color: AppColors.primary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Change Password',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 19,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Akun: $_username',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    TextField(
                      controller: currentPasswordController,
                      obscureText: obscureCurrentPassword,
                      textInputAction: TextInputAction.next,
                      decoration: passwordDecoration(
                        label: 'Password Saat Ini',
                        hint: 'Masukkan password saat ini',
                        obscureText: obscureCurrentPassword,
                        onToggleVisibility: () {
                          setDialogState(
                            () => obscureCurrentPassword =
                                !obscureCurrentPassword,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: newPasswordController,
                      obscureText: obscureNewPassword,
                      textInputAction: TextInputAction.next,
                      decoration: passwordDecoration(
                        label: 'Password Baru',
                        hint: 'Masukkan password baru',
                        obscureText: obscureNewPassword,
                        onToggleVisibility: () {
                          setDialogState(
                            () => obscureNewPassword = !obscureNewPassword,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: confirmController,
                      obscureText: obscureConfirmPassword,
                      textInputAction: TextInputAction.done,
                      decoration: passwordDecoration(
                        label: 'Konfirmasi Password Baru',
                        hint: 'Ulangi password baru',
                        obscureText: obscureConfirmPassword,
                        onToggleVisibility: () {
                          setDialogState(
                            () => obscureConfirmPassword =
                                !obscureConfirmPassword,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: lifting
                                ? null
                                : () {
                                    disposeControllers();
                                    Navigator.of(dialogContext).pop();
                                  },
                            style: TextButton.styleFrom(
                              minimumSize: const Size.fromHeight(48),
                              foregroundColor: AppColors.textSecondary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'Batal',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: lifting
                                ? null
                                : () async {
                                    final currentPassword =
                                        currentPasswordController.text.trim();
                                    final newPassword = newPasswordController
                                        .text
                                        .trim();
                                    final confirm = confirmController.text;
                                    if (currentPassword.isEmpty ||
                                        newPassword.isEmpty ||
                                        confirm.isEmpty) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Isi semua field terlebih dahulu',
                                          ),
                                          backgroundColor: AppColors.error,
                                        ),
                                      );
                                      return;
                                    }
                                    if (newPassword != confirm) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Konfirmasi password tidak cocok',
                                          ),
                                          backgroundColor: AppColors.error,
                                        ),
                                      );
                                      return;
                                    }

                                    setDialogState(() => lifting = true);
                                    final result =
                                        await AuthService.resetPassword(
                                          username: _username,
                                          newPassword: newPassword,
                                        );
                                    if (!context.mounted) return;

                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          result['message'] ??
                                              (result['success']
                                                  ? 'Password berhasil diubah'
                                                  : 'Gagal mengubah password'),
                                        ),
                                        backgroundColor: result['success']
                                            ? AppColors.success
                                            : AppColors.error,
                                      ),
                                    );
                                    if (result['success']) {
                                      disposeControllers();
                                      Navigator.of(dialogContext).pop();
                                    } else {
                                      setDialogState(() => lifting = false);
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: AppColors.primary
                                  .withValues(alpha: 0.45),
                              disabledForegroundColor: Colors.white,
                              elevation: 0,
                              minimumSize: const Size.fromHeight(48),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: lifting
                                ? const SizedBox(
                                    height: 18,
                                    width: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : const Text(
                                    'Simpan',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    ).whenComplete(disposeControllers);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // required by AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SafeArea(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          Text(
                            'Profile',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                              fontFamily: 'Plus Jakarta Sans',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Avatar
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF28ACCE), Color(0xFF1D93B4)],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.30),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          _username.isNotEmpty
                              ? _username[0].toUpperCase()
                              : 'U',
                          style: const TextStyle(
                            fontSize: 38,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _username,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        fontFamily: 'Plus Jakarta Sans',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Form Creator',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Plus Jakarta Sans',
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          _buildMenuItem(
                            icon: Icons.lock_outline,
                            title: 'Change Password',
                            subtitle: 'Update your password',
                            onTap: _showChangePasswordDialog,
                          ),
                          const SizedBox(height: 12),
                          _buildMenuItem(
                            icon: Icons.info_outline,
                            title: 'About',
                            subtitle: 'App version and information',
                            onTap: () {
                              showAboutDialog(
                                context: context,
                                applicationName: 'Formatic',
                                applicationVersion: '1.0.0',
                                applicationIcon: Container(
                                  width: 60,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: AppColors.blueAccent,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.description,
                                    color: Colors.white,
                                    size: 32,
                                  ),
                                ),
                                children: [
                                  const Text(
                                    'A modern form builder application',
                                  ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(height: 32),
                          // Logout button
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.cardBorder),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.cardShadow,
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: _handleLogout,
                                borderRadius: BorderRadius.circular(12),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: AppColors.error.withValues(
                                            alpha: 0.1,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.logout,
                                          color: AppColors.error,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      const Expanded(
                                        child: Text(
                                          'Logout',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.error,
                                            fontFamily: 'Plus Jakarta Sans',
                                          ),
                                        ),
                                      ),
                                      const Icon(
                                        Icons.arrow_forward_ios,
                                        size: 16,
                                        color: AppColors.error,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                          fontFamily: 'Plus Jakarta Sans',
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontFamily: 'Plus Jakarta Sans',
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: AppColors.textHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
