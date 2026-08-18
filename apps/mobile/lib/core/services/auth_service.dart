import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class AuthService {
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

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        await StorageService.saveToken(data['token']);
        await StorageService.saveUsername(username);
        
        return {
          'success': true,
          'message': data['message'],
          'token': data['token'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Login failed',
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

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        await StorageService.saveToken(data['token']);
        await StorageService.saveUsername(username);
        
        return {
          'success': true,
          'message': data['message'],
          'token': data['token'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Forgot password / Reset password
  static Future<Map<String, dynamic>> resetPassword({
    required String username,
    required String newPassword,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.userApiBaseUrl}${ApiConfig.forgotPasswordEndpoint}');
      
      final response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': newPassword,
        }),
      ).timeout(ApiConfig.timeout);

      final data = jsonDecode(response.body);

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
