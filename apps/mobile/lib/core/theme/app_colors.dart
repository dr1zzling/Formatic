import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors - Matching web palette
  static const Color navy = Color(0xFF0F2C46);
  static const Color cyan = Color(0xFF28ACCE);
  static const Color cyanDeep = Color(0xFF1D93B4);

  // Primary aliases
  static const Color primary = Color(0xFF28ACCE);
  static const Color primaryDark = Color(0xFF1D93B4);
  static const Color primaryLight = Color(0xFF4DC0DA);

  // Sidebar / Brand gradient colors
  static const Color sidebarStart = Color(0xFF06245A);
  static const Color sidebarMid = Color(0xFF0A438F);
  static const Color sidebarEnd = Color(0xFF257DC6);

  // Background Colors
  static const Color background = Color(0xFFF5F9FF);
  static const Color surface = Colors.white;

  // Text Colors
  static const Color textPrimary = Color(0xFF102F68);
  static const Color textSecondary = Color(0xFF8195B2);
  static const Color textHint = Color(0xFF9AACBF);
  static const Color textWhite = Colors.white;
  static const Color gray = Color(0xFF8A94A1);

  // Input Colors
  static const Color inputBorder = Color(0xFFDCE7F5);
  static const Color inputFill = Colors.white;

  // Card / Border Colors
  static const Color cardBorder = Color(0xFFE0EAF6);
  static const Color cardShadow = Color(0x14235391);

  // Accent Colors
  static const Color blueAccent = Color(0xFF1261DF);
  static const Color blueButton = Color(0xFF1764D6);

  // Status Colors
  static const Color success = Color(0xFF2EB56E);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Category Colors
  static const Color catUjian = Color(0xFF7850D9);
  static const Color catUjianBg = Color(0xFFEEE7FF);
  static const Color catSurvey = Color(0xFF1768DF);
  static const Color catSurveyBg = Color(0xFFE9F2FF);
  static const Color catDefault = Color(0xFF21A964);
  static const Color catDefaultBg = Color(0xFFE5FAEE);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1D93B4), Color(0xFF28ACCE)],
  );

  static const LinearGradient authGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF06245A),
      Color(0xFF0A438F),
      Color(0xFF257DC6),
    ],
  );

  static const LinearGradient avatarGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1D93B4), Color(0xFF28ACCE)],
  );

  static const List<LinearGradient> cardGradients = [
    LinearGradient(colors: [Color(0xFF667EEA), Color(0xFF764BA2)]),
    LinearGradient(colors: [Color(0xFFF093FB), Color(0xFFF5576C)]),
    LinearGradient(colors: [Color(0xFF4FACFE), Color(0xFF00F2FE)]),
    LinearGradient(colors: [Color(0xFF43E97B), Color(0xFF38F9D7)]),
    LinearGradient(colors: [Color(0xFFFA709A), Color(0xFFFEE140)]),
  ];
}
