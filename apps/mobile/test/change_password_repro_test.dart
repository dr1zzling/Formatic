import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/theme/app_theme.dart';

// Mirrors ProfileScreen._showChangePasswordDialog's lifecycle (the FIXED
// version: controllers are NOT disposed while the dialog is still mounted).
// The network request is replaced by an injected future so the async
// lifecycle (submit -> loading -> response -> pop / retry) can be driven
// deterministically.
Future<void> showChangePasswordDialog(
  BuildContext context,
  String username,
  Future<Map<String, dynamic>> Function() submitRequest,
) {
  final currentPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmController = TextEditingController();

  bool lifting = false;
  bool obscureCurrentPassword = true;
  bool obscureNewPassword = true;
  bool obscureConfirmPassword = true;
  bool dialogClosed = false;

  return showDialog(
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
                              'Akun: $username',
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
                          () => obscureCurrentPassword = !obscureCurrentPassword,
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
                          () => obscureConfirmPassword = !obscureConfirmPassword,
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
                                  final currentPassword = currentPasswordController
                                      .text
                                      .trim();
                                  final newPassword = newPasswordController.text
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
                                  final result = await submitRequest();
                                  if (!context.mounted || dialogClosed) {
                                    return;
                                  }

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
  ).whenComplete(() => dialogClosed = true);
}

class _Harness extends StatefulWidget {
  const _Harness({
    required this.username,
    required this.submitResult,
  });

  final String username;
  final Map<String, dynamic> submitResult;

  @override
  State<_Harness> createState() => _HarnessState();
}

class _HarnessState extends State<_Harness> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: TextButton(
          onPressed: () => showChangePasswordDialog(
            context,
            widget.username,
            () async {
              await Future<void>.delayed(const Duration(milliseconds: 300));
              return widget.submitResult;
            },
          ),
          child: const Text('Open change password'),
        ),
      ),
    );
  }
}

Future<void> openDialog(
  WidgetTester tester,
  Map<String, dynamic> result,
) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.lightTheme,
      home: _Harness(username: 'testuser', submitResult: result),
    ),
  );
  await tester.pump();
  await tester.tap(find.text('Open change password'));
  await tester.pump(const Duration(milliseconds: 300));
  await tester.pump(const Duration(milliseconds: 300));
  expect(find.text('Simpan'), findsOneWidget);
}

Future<void> fillFields(WidgetTester tester) async {
  await tester.enterText(find.byType(TextField).at(0), 'WrongPw123');
  await tester.enterText(find.byType(TextField).at(1), 'NewPw12345');
  await tester.enterText(find.byType(TextField).at(2), 'NewPw12345');
  await tester.pump();
}

void main() {
  testWidgets(
    'Wrong current password (API error): dialog stays open, no crash, retry',
    (WidgetTester tester) async {
      await openDialog(tester, {
        'success': false,
        'message': 'Password saat ini salah.',
      });
      await fillFields(tester);
      await tester.tap(find.text('Simpan'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pump(const Duration(milliseconds: 1500));
      expect(find.text('Simpan'), findsOneWidget);

      await tester.tap(find.text('Simpan'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1500));
      expect(find.text('Simpan'), findsOneWidget);
    },
  );

  testWidgets(
    'Correct password (success): dialog closes cleanly, no crash',
    (WidgetTester tester) async {
      await openDialog(tester, {
        'success': true,
        'message': 'Password berhasil diubah',
      });
      await fillFields(tester);
      await tester.tap(find.text('Simpan'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pump(const Duration(milliseconds: 1500));
      expect(find.text('Simpan'), findsNothing);
    },
  );

  testWidgets(
    'Network/API error: dialog stays open, loading reset, no crash',
    (WidgetTester tester) async {
      await openDialog(tester, {
        'success': false,
        'message': 'Connection error',
      });
      await fillFields(tester);
      await tester.tap(find.text('Simpan'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pump(const Duration(milliseconds: 1500));
      expect(find.text('Simpan'), findsOneWidget);
    },
  );

  testWidgets(
    'Dialog closed while request in flight: late completion must not crash',
    (WidgetTester tester) async {
      await openDialog(tester, {
        'success': false,
        'message': 'late error',
      });
      await fillFields(tester);
      await tester.tap(find.text('Simpan'));
      await tester.pump();
      await tester.tap(find.text('Batal'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1500));
      await tester.pump(const Duration(milliseconds: 1500));
    },
  );
}