import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' as services;

import '../../../core/localizations/formatic_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/screens/home_screen.dart';

/// OTP Screen — verifikasi kode 6 digit yang dikirim ke email.
/// Dapat digunakan voor flow login (verify-login) dan register (verify-register).
/// Resend = re-call API step-1 (backend heeft geen aparte resend endpoint).
class OtpScreen extends StatefulWidget {
  final String email;
  final Future<Map<String, dynamic>> Function(String otp) verify;
  final Future<Map<String, dynamic>> Function() resend;

  const OtpScreen({
    super.key,
    required this.email,
    required this.verify,
    required this.resend,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();
  Timer? _cooldownTimer;
  int _cooldown = 0;
  bool _isLoading = false;
  bool _isResending = false;
  bool _resent = false;
  String _error = '';

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _onOtpChanged(String value) {
    setState(() {
      _error = '';
      _resent = false;
    });
  }

  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() {
      _cooldown = 30;
    });
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_cooldown <= 1) {
        timer.cancel();
        setState(() {
          _cooldown = 0;
        });
        return;
      }
      setState(() {
        _cooldown = _cooldown - 1;
      });
    });
  }

  Future<void> _handleVerify() async {
    final l10n = FormaticLocalizations.of(context);
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() {
        _error = l10n.otpInvalidCode;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = '';
    });

    final result = await widget.verify(otp);

    if (!mounted) return;
    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const HomeScreen()),
      );
    } else {
      setState(() {
        _error = result['message']?.toString() ?? l10n.otpVerifyFailed;
      });
    }
  }

  Future<void> _handleResend() async {
    final l10n = FormaticLocalizations.of(context);
    if (_isResending || _cooldown > 0) return;

    setState(() {
      _isResending = true;
      _error = '';
      _resent = false;
    });

    final result = await widget.resend();

    if (!mounted) return;
    setState(() {
      _isResending = false;
    });

    if (result['success'] == true) {
      _startCooldown();
      setState(() {
        _resent = true;
      });
    } else {
      setState(() {
        _error = result['message']?.toString() ?? l10n.otpResendFailed;
      });
    }
  }

  void _goBack() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = FormaticLocalizations.of(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.authGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 400),
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 40,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF6FA),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.mail_outlined,
                        color: AppColors.cyan,
                        size: 30,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.otpTitle,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.navy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text.rich(
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, color: AppColors.gray),
                      TextSpan(
                        text: l10n.otpBody(widget.email),
                        style: const TextStyle(
                          color: AppColors.gray,
                          fontSize: 13,
                        ),
                        children: [
                          WidgetSpan(
                            child: GestureDetector(
                              onTap: () {
                                _goBack();
                              },
                              child: Text(
                                ' ${l10n.otpWrongEmail}',
                                style: const TextStyle(
                                  color: AppColors.cyan,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    if (_error.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Text(
                          _error,
                          style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626)),
                        ),
                      ),

                    if (_resent)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Text(
                          l10n.otpResent,
                          style: const TextStyle(fontSize: 13, color: AppColors.success),
                        ),
                      ),

                    Text(
                      l10n.otpCodeLabel,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gray,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _otpController,
                      onChanged: _onOtpChanged,
                      keyboardType: services.TextInputType.number,
                      inputFormatters: [
                        services.FilteringTextInputFormatter.allow(RegExp(r'[0-9]')),
                        services.LengthLimitingTextInputFormatter(6),
                      ],
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      autofocus: true,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.navy,
                        letterSpacing: 8,
                      ),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        hintText: '••••••',
                        hintStyle: const TextStyle(
                          color: AppColors.textHint,
                          fontSize: 16,
                          letterSpacing: 8,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.inputBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.cyan, width: 1.5),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.error),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    GestureDetector(
                      onTap: _isLoading ? null : _handleVerify,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        height: 48,
                        decoration: BoxDecoration(
                          color: _isLoading
                              ? AppColors.cyanDeep.withValues(alpha: 0.7)
                              : AppColors.cyanDeep,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.cyanDeep.withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Text(
                                  l10n.otpVerify,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF6FA),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text.rich(
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, color: AppColors.gray),
                          TextSpan(
                            text: l10n.otpResendHint,
                            style: const TextStyle(fontSize: 13, color: AppColors.gray),
                            children: [
                              WidgetSpan(
                                child: GestureDetector(
                                  onTap: _isResending || _cooldown > 0
                                      ? null
                                      : () {
                                          _handleResend();
                                        },
                                  child: Text(
                                    _cooldown > 0
                                        ? l10n.otpResendCooldown(_cooldown)
                                        : l10n.otpResend,
                                    style: TextStyle(
                                      color: AppColors.cyan,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        TextButton(
                          onPressed: _goBack,
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            '← ${l10n.back}',
                            style: const TextStyle(fontSize: 13, color: AppColors.gray),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}