import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/localizations/formatic_localizations.dart';
import '../../home/screens/home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    final l10n = FormaticLocalizations.of(context);
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      final result = await AuthService.register(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });

      if (result['success'] && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? l10n.signUpFailed),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final FormaticLocalizations l10n = FormaticLocalizations.of(context);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF062457),
              Color(0xFF0B3F66),
              Color(0xFF1C5F86),
              Color(0xFF4D91B2),
              Color(0xFF8FBCCB),
              Color(0xFFF7FAFB),
            ],
            stops: [0.0, 0.2, 0.38, 0.55, 0.72, 0.94],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              children: [
                const SizedBox(height: 20),
                // Brand header
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: const Center(
                        child: Text(
                          'F',
                          style: TextStyle(
                            color: Color(0xFF1251AA),
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Formatic',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned(
                      top: -30,
                      right: size.width * 0.15,
                      child: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.15),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.25),
                          ),
                        ),
                      ),
                    ),
                    Column(
                      children: [
                        const Text(
                          'Form',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Matic',
                          style: TextStyle(
                            color: AppColors.cyan,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          l10n.tagline,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.75),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 40),
                // Form card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        Center(
                          child: Column(
                            children: [
                              RichText(
                                text: TextSpan(
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Plus Jakarta Sans',
                                  ),
                                  children: [
                                    TextSpan(
                                      text: l10n.createAccount,
                                      style: TextStyle(color: AppColors.navy),
                                    ),
                                    TextSpan(
                                      text: l10n.account,
                                      style: TextStyle(color: AppColors.cyan),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                l10n.enterYourDetails,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.gray,
                                  fontFamily: 'Plus Jakarta Sans',
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 28),
                        // Username
                        Text(
                          l10n.username,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _usernameController,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return l10n.usernameRequired;
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: l10n.usernameHint,
                            hintStyle: TextStyle(
                              color: AppColors.textHint,
                              fontSize: 13,
                            ),
                            prefixIcon: Icon(
                              Icons.person_outline,
                              color: AppColors.textHint,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Password
                        Text(
                          l10n.password,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return l10n.enterYourPassword;
                            }
                            if (value.length < 8) {
                              return l10n.pwMin8;
                            }
                            if (!value.contains(RegExp(r'[A-Z]'))) {
                              return l10n.pwUpper;
                            }
                            if (!value.contains(RegExp(r'[a-z]'))) {
                              return l10n.pwLower;
                            }
                            if (!value.contains(RegExp(r'[0-9]'))) {
                              return l10n.pwNumber;
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: '••••••••••',
                            hintStyle: TextStyle(
                              color: AppColors.textHint,
                              fontSize: 13,
                            ),
                            prefixIcon: Icon(
                              Icons.lock_outline,
                              color: AppColors.textHint,
                              size: 20,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                color: AppColors.textHint,
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Confirm Password
                        Text(
                          l10n.confirmPassword,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                            fontFamily: 'Plus Jakarta Sans',
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirmPassword,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return l10n.confirmPasswordRequired;
                            }
                            if (value != _passwordController.text) {
                              return l10n.passwordsDoNotMatch;
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: '••••••••••',
                            hintStyle: TextStyle(
                              color: AppColors.textHint,
                              fontSize: 13,
                            ),
                            prefixIcon: Icon(
                              Icons.lock_outline,
                              color: AppColors.textHint,
                              size: 20,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmPassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                color: AppColors.textHint,
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmPassword = !_obscureConfirmPassword;
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 28),
                        // Register button
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.cyanDeep,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              elevation: 2,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Text(
                                    l10n.signUp,
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'Plus Jakarta Sans',
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Sign in link
                        Center(
                          child: Text.rich(
                            TextSpan(
                              text: l10n.haveAccount,
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.gray,
                                fontFamily: 'Plus Jakarta Sans',
                              ),
                              children: [
                                WidgetSpan(
                                  child: GestureDetector(
                                    onTap: () {
                                      Navigator.of(context).pop();
                                    },
                                    child: Text(
                                      l10n.signIn,
                                      style: TextStyle(
                                        color: AppColors.cyan,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                        fontFamily: 'Plus Jakarta Sans',
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
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
