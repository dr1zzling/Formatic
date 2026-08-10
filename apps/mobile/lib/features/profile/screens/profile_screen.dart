import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/storage_service.dart';
import '../../auth/screens/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _username = 'User';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    setState(() {
      _isLoading = true;
    });

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
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
            ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SafeArea(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    
                    // Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          const Text(
                            'Profile',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () {
                              // Settings coming soon
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Settings coming soon!'),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            },
                            icon: const Icon(Icons.settings_outlined),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Profile Avatar
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          _username.isNotEmpty ? _username[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Username
                    Text(
                      _username,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Role badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Form Creator',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Menu Items
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          _buildMenuItem(
                            icon: Icons.person_outline,
                            title: 'Account Information',
                            subtitle: 'View and edit your profile',
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Profile edit feature coming soon!'),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 12),

                          _buildMenuItem(
                            icon: Icons.lock_outline,
                            title: 'Change Password',
                            subtitle: 'Update your password',
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Change password requires backend endpoint!'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 12),

                          _buildMenuItem(
                            icon: Icons.notifications_outlined,
                            title: 'Notifications',
                            subtitle: 'Manage your notifications',
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Notifications coming soon!'),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 12),

                          _buildMenuItem(
                            icon: Icons.help_outline,
                            title: 'Help & Support',
                            subtitle: 'Get help and contact support',
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Support page coming soon!'),
                                  backgroundColor: AppColors.primary,
                                ),
                              );
                            },
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
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.description,
                                    color: Colors.white,
                                    size: 32,
                                  ),
                                ),
                                children: [
                                  const Text('A modern form builder application'),
                                ],
                              );
                            },
                          ),

                          const SizedBox(height: 32),

                          // Logout Button
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
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
                                          color: AppColors.error.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(8),
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: AppColors.primary,
                    size: 20,
                  ),
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
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
