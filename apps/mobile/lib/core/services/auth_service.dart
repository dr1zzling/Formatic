import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class AuthService {
  static Map<String, dynamic> _safeDecode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
      return {};
    } catch (_) {
      return {};
    }
  }

  // Login — Step 1: verifikasi username/email + password.
  // Backend kirim OTP ke email dan return `email` (token hanya di step 2).
  static Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.loginEndpoint}');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'data': username,
          'password': password,
        }),
      ).timeout(ApiConfig.timeout);

      final data = _safeDecode(response.body);

      if (response.statusCode == 200) {
        final email = data['email']?.toString();
        if (email == null || email.isEmpty) {
          return {
            'success': false,
            'message': data['message'],
          };
        }
        await StorageService.saveUsername(username);

        return {
          'success': true,
          'message': data['message'],
          'email': email,
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Login — Step 2: verifikasi OTP yang dikirim ke email.
  static Future<Map<String, dynamic>> verifyLogin({
    required String email,
    required String otp,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.verifyLoginEndpoint}');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
        }),
      ).timeout(ApiConfig.timeout);

      final data = _safeDecode(response.body);

      if (response.statusCode == 200) {
        final token = data['token']?.toString();
        if (token == null || token.isEmpty) {
          return {
            'success': false,
            'message': data['message'],
          };
        }
        await StorageService.saveToken(token);
        
        return {
          'success': true,
          'message': data['message'],
          'token': token,
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Register — Step 1: username + email + password → OTP dikirim ke email.
  static Future<Map<String, dynamic>> register({
    required String username,
    required String password,
    required String email,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.registerEndpoint}');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
          'email': email,
        }),
      ).timeout(ApiConfig.timeout);

      final data = _safeDecode(response.body);

      if (response.statusCode == 200) {
        await StorageService.saveUsername(username);

        return {
          'success': true,
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Register — Step 2: verifikasi OTP + buat akun, return token.
  static Future<Map<String, dynamic>> verifyRegister({
    required String email,
    required String otp,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.verifyRegisterEndpoint}');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
        }),
      ).timeout(ApiConfig.timeout);

      final data = _safeDecode(response.body);

      if (response.statusCode == 201) {
        final token = data['token']?.toString();
        if (token == null || token.isEmpty) {
          return {
            'success': false,
            'message': data['message'],
          };
        }
        await StorageService.saveToken(token);

        return {
          'success': true,
          'message': data['message'],
          'token': token,
        };
      } else {
        return {
          'success': false,
          'message': data['message'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Forgot password / Reset password / Change password
  // Wanneer `currentPassword` word meegegeven (change-password flow), stuurt
  // de backend dit naar bcrypt.compare en weigert het de update als het niet
  // matcht met de huidige password.
  static Future<Map<String, dynamic>> resetPassword({
    required String username,
    required String newPassword,
    String? currentPassword,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.forgotPasswordEndpoint}');
      
      final response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': newPassword,
          if (currentPassword != null && currentPassword.isNotEmpty)
            'current_password': currentPassword,
        }),
      ).timeout(ApiConfig.timeout);

      final data = _safeDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Password updated successfully',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to update password',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Logout
  static Future<bool> logout() async {
    return await StorageService.clearAll();
  }

  // Check if logged in
  static Future<bool> isLoggedIn() async {
    return await StorageService.isLoggedIn();
  }
}
