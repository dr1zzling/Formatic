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

  // Login
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
          'username': username,
          'password': password,
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
        await StorageService.saveUsername(username);
        
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

  // Register
  static Future<Map<String, dynamic>> register({
    required String username,
    required String password,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.registerEndpoint}');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
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
        await StorageService.saveUsername(username);
        
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
