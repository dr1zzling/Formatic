class ApiConfig {
  // Base URLs
  // Web browser: http://localhost:3000
  // Android Emulator: http://10.0.2.2:3000
  // Physical Device: use computer IP
  static const String userApiBaseUrl = 'http://localhost:3000';
  static const String formApiBaseUrl = 'http://localhost:3002';

  // User API Endpoints
  static const String loginEndpoint = '/user/login';
  static const String registerEndpoint = '/user/register';
  static const String forgotPasswordEndpoint = '/user/forgot-password';

  // Form API Endpoints
  static const String formsEndpoint = '/form';
  static const String createFormEndpoint = '/form';
  static const String userFormsEndpoint = '/form/user';
  static const String formSlugEndpoint = '/form/slug';
  static const String formStatusEndpoint = '/form';
  static const String soalEndpoint = '/form/soal';
  static const String submitEndpoint = '/form/submit';
  static const String categoryEndpoint = '/form/category';
  static const String shareEndpoint = '/form/share';
  static const String qrCodeJsonEndpoint = '/qrcode/json';
  static const String qrCodeImageEndpoint = '/qrcode/image';

  // Request timeout
  static const Duration timeout = Duration(seconds: 30);
}
