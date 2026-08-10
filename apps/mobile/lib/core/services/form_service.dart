import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class FormService {
  // Get Authorization Header
  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Get all forms
  static Future<Map<String, dynamic>> getForms() async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}');
      final headers = await _getHeaders();
      
      final response = await http.get(
        url,
        headers: headers,
      ).timeout(ApiConfig.timeout);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch forms',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Create form
  static Future<Map<String, dynamic>> createForm({
    required String title,
    required int categoryId,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}${ApiConfig.createFormEndpoint}');
      final headers = await _getHeaders();
      
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'title': title,
          'category_id': categoryId,
        }),
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'Form created successfully',
          'data': data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create form',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }
  
  // Get user's forms
  static Future<Map<String, dynamic>> getUserForms() async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/user');
      final headers = await _getHeaders();
      
      final response = await http.get(
        url,
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch forms',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Get form by slug
  static Future<Map<String, dynamic>> getFormBySlug(String slug) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/slug?slug=$slug');
      final headers = await _getHeaders();
      
      final response = await http.get(
        url,
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch form',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Get questions from form
  static Future<Map<String, dynamic>> getFormQuestions(int formId) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/soal/$formId');
      final headers = await _getHeaders();
      
      final response = await http.get(
        url,
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch questions',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Create questions for form
  static Future<Map<String, dynamic>> createQuestions({
    required int formId,
    required List<Map<String, dynamic>> questions,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/soal/$formId');
      final headers = await _getHeaders();
      
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(questions),
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'Questions created successfully',
          'data': data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create questions',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Generate QR Code (JSON format)
  static Future<Map<String, dynamic>> generateQrCode(String slug) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/qrcode/json?slug=$slug');
      final headers = await _getHeaders();
      
      final response = await http.get(
        url,
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to generate QR code',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  // Get QR Code Image URL
  static String getQrCodeImageUrl(String slug) {
    return '${ApiConfig.formApiBaseUrl}/qrcode/image?slug=$slug';
  }
}
