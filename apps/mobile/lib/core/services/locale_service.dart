import 'package:flutter/foundation.dart';

import 'storage_service.dart';

/// Holds the app language selection ('id' = Bahasa Indonesia, 'en' = English),
/// persists it locally, and notifies the app state so the whole UI rebuilds
/// with the new locale immediately.
class LocaleService {
  static const String defaultLanguage = 'id';
  static String _languageCode = defaultLanguage;
  static VoidCallback? _onLanguageChanged;

  /// The currently selected language code ('id' or 'en').
  static String get languageCode => _languageCode;

  /// Register a callback that fires after the language changes so the app can
  /// rebuild its [MaterialApp] with the new [Locale].
  static void setOnLanguageChanged(VoidCallback callback) {
    _onLanguageChanged = callback;
  }

  /// Load the persisted language preference (after app restart).
  static Future<void> load() async {
    final String? saved = await StorageService.getLanguage();
    _languageCode = saved == 'en' ? 'en' : 'id';
  }

  /// Select a language and persist it. Triggers [setOnLanguageChanged] so the
  /// UI updates instantly.
  static Future<void> select(String languageCode) async {
    final String code = languageCode == 'en' ? 'en' : 'id';
    if (_languageCode == code) {
      return;
    }
    _languageCode = code;
    await StorageService.saveLanguage(code);
    _onLanguageChanged?.call();
  }
}