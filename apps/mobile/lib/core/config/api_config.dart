import 'package:flutter/foundation.dart';

class ApiConfig {
  // Base URLs:
  // Web browser -> localhost
  // Android physical device -> IP WiFi komputer
  static String get userApiBaseUrl => kIsWeb
      ? 'http://localhost:3000'
      : 'http://10.10.18.201:3000';

  static String get formApiBaseUrl => kIsWeb
      ? 'http://localhost:3002'
      : 'http://10.10.18.201:3002';

  // User API Endpoints
  static const String loginEndpoint = '/user/login';
  static const String registerEndpoint = '/user/register';
  static const String forgotPasswordEndpoint = '/user/forgot-password';

  // Form API Endpoints
  static const String formsEndpoint = '/form';
  static const String formsByCategoryEndpoint = '/form';
  static const String createFormEndpoint = '/form';
  static const String userFormsEndpoint = '/form/user';
  static const String formSlugEndpoint = '/form/slug';
  static const String formStatusEndpoint = '/form';
  static const String formSettingEndpoint = '/form/setting';
  static const String soalEndpoint = '/form/soal';
  static const String submitEndpoint = '/form/submit';
  static const String submitDetailEndpoint = '/form/submit/detail';
  static const String submitCheckTokenEndpoint = '/form/submit/check-token';
  static const String soalImportEndpoint = '/form/soal/import';
  static const String categoryEndpoint = '/form/category';
  static const String shareEndpoint = '/form/share';
  static const String qrCodeJsonEndpoint = '/qrcode/json';
  static const String qrCodeImageEndpoint = '/qrcode/image';
  static const String submitExportExcelEndpoint = '/form/submit/export-excel';

  // Request timeout
  static const Duration timeout = Duration(seconds: 30);
}