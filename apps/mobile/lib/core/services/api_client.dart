import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../services/storage_service.dart';

class ApiClient {
  static bool _isHandling401 = false;
  static VoidCallback? _onUnauthorized;

  static void setOnUnauthorized(VoidCallback callback) {
    _onUnauthorized = callback;
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<http.Response> get(String path, {Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConfig.formApiBaseUrl}$path').replace(queryParameters: queryParams);
    final headers = await _getHeaders();
    final response = await http.get(uri, headers: headers).timeout(ApiConfig.timeout);
    _handle401(response);
    return response;
  }

  static Future<http.Response> post(String path, {Map<String, dynamic>? body, Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConfig.formApiBaseUrl}$path').replace(queryParameters: queryParams);
    final headers = await _getHeaders();
    final response = await http.post(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(ApiConfig.timeout);
    _handle401(response);
    return response;
  }

  static Future<http.Response> patch(String path, {Map<String, dynamic>? body, Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConfig.formApiBaseUrl}$path').replace(queryParameters: queryParams);
    final headers = await _getHeaders();
    final response = await http.patch(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(ApiConfig.timeout);
    _handle401(response);
    return response;
  }

  static Future<http.Response> delete(String path, {Map<String, String>? queryParams}) async {
    final uri = Uri.parse('${ApiConfig.formApiBaseUrl}$path').replace(queryParameters: queryParams);
    final headers = await _getHeaders();
    final response = await http.delete(uri, headers: headers).timeout(ApiConfig.timeout);
    _handle401(response);
    return response;
  }

  static void _handle401(http.Response response) {
    if (response.statusCode == 401 && !_isHandling401) {
      _isHandling401 = true;
      StorageService.clearAll();
      if (_onUnauthorized != null) {
        _onUnauthorized!();
      }
      Future.delayed(const Duration(seconds: 2), () {
        _isHandling401 = false;
      });
    }
  }
}

typedef VoidCallback = void Function();
