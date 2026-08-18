import 'package:flutter/material.dart';

class AppColors {
  // Brand colors (sama dengan web)
  static const Color navy = Color(0xFF0F2C46);
  static const Color cyan = Color(0xFF28ACCE);
  static const Color cyanDeep = Color(0xFF1D93B4);

  // Gradient utama (sama dengan web: linear-gradient(90deg,#005fb3,#009bf5))
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF005FB3), Color(0xFF009BF5)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Gradient avatar (sama dengan web: linear-gradient(135deg,#005fb3,#009bf5))
  static const LinearGradient avatarGradient = LinearGradient(
    colors: [Color(0xFF005FB3), Color(0xFF009BF5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Primary Colors
  static const Color primary = Color(0xFF005FB3);
  static const Color primaryDark = Color(0xFF00458A);
  static const Color primaryLight = Color(0xFF009BF5);

  // Background Colors
  static const Color background = Color(0xFFF8FAFC); // slate-50
  static const Color surface = Colors.white;

  // Text Colors
  static const Color textPrimary = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF8A94A1);
  static const Color textHint = Color(0xFF9CA3AF);
  static const Color gray = Color(0xFF8A94A1);

  // Input Colors
  static const Color inputBorder = Color(0xFFE3E8EC);
  static const Color inputFill = Colors.white;

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Sidebar gradient (sama dengan web: from-[#002673] via-[#005fb3] to-[#009bf5])
  static const LinearGradient sidebarGradient = LinearGradient(
    colors: [Color(0xFF002673), Color(0xFF005FB3), Color(0xFF009BF5)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Background auth (sama dengan web login/register)
  static const LinearGradient authGradient = LinearGradient(
    colors: [
      Color(0xFF062457),
      Color(0xFF0B3F66),
      Color(0xFF1C5F86),
      Color(0xFF4D91B2),
      Color(0xFF8FBCCB),
      Color(0xFFCDE3EA),
      Color(0xFFF7FAFB),
      Color(0xFFFFFFFF),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Gradient kartu form (sama dengan web CARD_GRADIENTS)
  static const List<LinearGradient> cardGradients = [
    LinearGradient(colors: [Color(0xFFDBEAFE), Color(0xFF93C5FD)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFEDE9FE), Color(0xFFC4B5FD)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFDCFCE7), Color(0xFF86EFAC)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFFEF9C3), Color(0xFFFDE047)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFFFEDD5), Color(0xFFFB923C)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    LinearGradient(colors: [Color(0xFFFCE7F3), Color(0xFFF9A8D4)], begin: Alignment.topLeft, end: Alignment.bottomRight),
  ];
}
