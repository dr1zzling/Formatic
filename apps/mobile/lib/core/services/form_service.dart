import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class FormService {
  static Map<String, dynamic> _decodeBody(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> getForms() async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      final data = _decodeBody(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch forms',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> createForm({
    required String title,
    required String category,
    required XFile bannerFile,
  }) async {
    try {
      final token = await StorageService.getToken();
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.createFormEndpoint}',
      );
      final request = http.MultipartRequest('POST', url);
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.fields['title'] = title;
      request.fields['category'] = category;

      final bytes = await bannerFile.readAsBytes();
      final filename = bannerFile.name;
      final ext = filename.split('.').last.toLowerCase();
      final mimeType = ext == 'png'
          ? 'image/png'
          : ext == 'webp'
          ? 'image/webp'
          : 'image/jpeg';

      request.files.add(
        http.MultipartFile.fromBytes(
          'banner',
          bytes,
          filename: filename,
          contentType: MediaType.parse(mimeType),
        ),
      );

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {
          'success': true,
          'message': 'Form created successfully',
          'data': data,
        };
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create form',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> getUserForms() async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/user');
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {'success': true, 'data': data};
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch forms',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> getFormBySlug(String slug) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/slug?slug=$slug');
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {'success': true, 'data': data};
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch form',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  // Loads the questions of a form by its SLUG (backend resolves it as slug).
  static Future<Map<String, dynamic>> getFormQuestions(String formSlug) async {
    try {
      final url =
          Uri.parse('${ApiConfig.formApiBaseUrl}/form/slug?slug=$formSlug');
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 200) {
        final data = _decodeBody(response.body);
        final formData = data['data'];
        final listSoal =
            (formData is Map && formData['soal'] is List)
                ? (formData['soal'] as List).toList()
                : <dynamic>[];
        return {'success': true, 'data': listSoal};
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch questions',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> createQuestions({
    required String formSlug,
    required List<Map<String, dynamic>> questions,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}/form/soal?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .post(url, headers: headers, body: jsonEncode(questions))
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {
          'success': true,
          'message': 'Questions created successfully',
          'data': data,
        };
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create questions',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  // Fetch responses of a form by its ID (only creator/admin).
  static Future<Map<String, dynamic>> getFormResponses(String formId) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/$formId/submit');
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {'success': true, 'data': data};
      } else {
        final data = _decodeBody(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch responses',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  // Toggle form visibility: status = 'public' | 'private'
  static Future<Map<String, dynamic>> updateFormStatus(
    String formSlug,
    String status,
  ) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form?form_slug=$formSlug');
      final headers = await _getHeaders();
      final response = await http
          .patch(url, headers: headers, body: jsonEncode({'status': status}))
          .timeout(ApiConfig.timeout);
      final data = _decodeBody(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': data['message'] ?? 'Status updated'};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to update status',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> deleteForm(String formSlug) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form?form_slug=$formSlug');
      final headers = await _getHeaders();
      final response = await http
          .delete(url, headers: headers)
          .timeout(ApiConfig.timeout);
      final data = _decodeBody(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': data['message'] ?? 'Form deleted'};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to delete form',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  // Submit answers to POST /form/submit/:form_id.
  // answers: list of {jawaban: {soal_id, answer_text | soal_option_id | file_name}}
  // files: (optional) picked files for 'file' type questions.
  static Future<Map<String, dynamic>> submitForm({
    required int formId,
    required List<Map<String, dynamic>> answers,
    List<XFile> files = const [],
  }) async {
    try {
      final token = await StorageService.getToken();
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}/form/submit/$formId');
      final request = http.MultipartRequest('POST', url);
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      request.fields['data'] = jsonEncode(answers);

      for (final file in files) {
        final bytes = await file.readAsBytes();
        request.files.add(
          http.MultipartFile.fromBytes(
            'files',
            bytes,
            filename: file.name,
          ),
        );
      }

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      final data = _decodeBody(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true, 'message': data['message'] ?? 'Submitted', 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to submit form',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> generateQrCode(String slug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}/qrcode/json?slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      if (response.statusCode == 200) {
        final data = _decodeBody(response.body);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': 'Failed to generate QR code'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static String getQrCodeImageUrl(String slug) {
    return '${ApiConfig.formApiBaseUrl}/qrcode/image?slug=$slug';
  }
}
