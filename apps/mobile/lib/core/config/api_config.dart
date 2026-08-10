class ApiConfig {
  // Base URLs - Using localhost for web
  // For Android Emulator: use 10.0.2.2
  // For Physical Device: use computer IP (10.10.18.61)
  static const String userApiBaseUrl = 'http://localhost:3001';
  static const String formApiBaseUrl = 'http://localhost:3000';
  
  // User API Endpoints
  static const String loginEndpoint = '/user/login';
  static const String registerEndpoint = '/user/register';
  
  // Form API Endpoints
  static const String formsEndpoint = '/form';
  static const String createFormEndpoint = '/form';
  
  // Request timeout
  static const Duration timeout = Duration(seconds: 30);
}
