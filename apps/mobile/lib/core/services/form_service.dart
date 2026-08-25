import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class FormService {
  static VoidCallback? _onUnauthorized;

  static void setOnUnauthorized(VoidCallback callback) {
    _onUnauthorized = callback;
  }

  static void _handle401(int statusCode) {
    if (statusCode == 401 && _onUnauthorized != null) {
      StorageService.clearAll();
      _onUnauthorized!();
    }
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await StorageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static int _getCategoryId(String categoryName) {
    switch (categoryName.toLowerCase()) {
      case 'ujian':
        return 1;
      case 'survei':
        return 2;
      case 'pengumpulan data':
        return 3;
      default:
        return 1;
    }
  }

  static Future<Map<String, dynamic>> getForms({String? category}) async {
    try {
      if (category != null && category.isNotEmpty && category != 'All') {
        final url = Uri.parse(
          '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}?category=$category',
        );
        final headers = await _getHeaders();
        final response = await http
            .get(url, headers: headers)
            .timeout(ApiConfig.timeout);

        _handle401(response.statusCode);
        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        } else {
          return {'success': false, 'message': 'Failed to fetch forms'};
        }
      }

      final knownCategories = ['Ujian', 'Survei', 'Pengumpulan Data'];
      final List<dynamic> allForms = [];

      for (final cat in knownCategories) {
        final url = Uri.parse(
          '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}?category=$cat',
        );
        final headers = await _getHeaders();
        final response = await http
            .get(url, headers: headers)
            .timeout(ApiConfig.timeout);

        if (response.statusCode == 200) {
          final decoded = jsonDecode(response.body);
          final data = decoded['data'];
          if (data is List) {
            allForms.addAll(data);
          }
        }
      }

      return {
        'success': true,
        'data': {'data': allForms},
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getFormsByCategory(
    String category,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}?category=$category',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to fetch forms'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> createForm({
    required String title,
    required String category,
    required String tokenRespon,
    Uint8List? bannerBytes,
    String? bannerName,
    String? bannerMimeType,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.createFormEndpoint}',
      );
      final headers = await _getHeaders();
      final categoryId = _getCategoryId(category);

      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'title': title,
              'category_id': categoryId,
            }),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);

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

  static Future<Map<String, dynamic>> getUserForms() async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.userFormsEndpoint}',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to fetch forms'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getFormBySlug(String slug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formSlugEndpoint}?slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
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

  static Future<Map<String, dynamic>> updateFormStatus({
    required String slug,
    required String status,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formStatusEndpoint}?form_slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .patch(
            url,
            headers: headers,
            body: jsonEncode({'status': status}),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'message': 'Status updated'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to update status',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> deleteForm(String slug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formStatusEndpoint}?form_slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .delete(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200 || response.statusCode == 204) {
        return {'success': true, 'message': 'Form deleted'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to delete form',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getFormQuestions(int formId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}/form/soal/$formId',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return {'success': true, 'data': decoded};
      } else {
        String message = 'Failed to fetch questions';
        try {
          final data = jsonDecode(response.body);
          message = data['message'] ?? message;
        } catch (_) {}
        return {'success': false, 'message': message};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> createQuestions({
    required int formId,
    required List<Map<String, dynamic>> questions,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}/form/soal/$formId',
      );
      final headers = await _getHeaders();

      final backendPayload = questions.map((q) {
        final soal = q['soal'] as Map<String, dynamic>;
        final options = q['options'] as List<dynamic>? ?? [];
        final hasCorrect =
            options.any((o) => o['is_correct'] == true);

        return {
          'soal': {
            'question': soal['question'],
            'type': soal['type'],
          },
          'option_value': options
              .map((o) => {'value': o['value']})
              .toList(),
          'soal_option': {'is_correct': hasCorrect},
        };
      }).toList();

      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode(
              backendPayload.length == 1
                  ? backendPayload.first
                  : backendPayload,
            ),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
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

  static Future<Map<String, dynamic>> submitForm({
    required int formId,
    required List<Map<String, dynamic>> answers,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}/form/submit/$formId',
      );
      final token = await StorageService.getToken();

      var request = http.MultipartRequest('POST', url);
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.fields['data'] = jsonEncode(answers);

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true, 'message': 'Form submitted successfully'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to submit form',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getSubmitStats(String formId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitEndpoint}?form_id=$formId',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to fetch stats'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getSubmitDetail(String formId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitEndpoint}?form_id=$formId',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch response details',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> shareForm({
    required String formSlug,
    required String tokenCollab,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.shareEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({'token_collab': tokenCollab}),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true, 'message': 'Shared successfully'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to share form',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> generateQrCode(String slug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.qrCodeJsonEndpoint}?slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to generate QR code'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static String getQrCodeImageUrl(String slug) {
    return '${ApiConfig.formApiBaseUrl}${ApiConfig.qrCodeImageEndpoint}?slug=$slug';
  }
}
