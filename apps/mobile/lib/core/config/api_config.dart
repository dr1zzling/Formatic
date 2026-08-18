import 'package:flutter/foundation.dart';

class ApiConfig {
  // Base URLs - Using localhost for web & desktop.
  // For Android Emulator, 10.0.2.2 maps to the host machine's localhost.
  // For Physical Device: use computer IP (10.10.18.61) instead.
  static String get userApiBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static String get formApiBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3001';
    }
    return 'http://localhost:3001';
  }
  
  // User API Endpoints
  static const String loginEndpoint = '/user/login';
  static const String registerEndpoint = '/user/register';
  
  // Form API Endpoints
  static const String formsEndpoint = '/form';
  static const String createFormEndpoint = '/form';
  
  // Request timeout
  static const Duration timeout = Duration(seconds: 30);
}
