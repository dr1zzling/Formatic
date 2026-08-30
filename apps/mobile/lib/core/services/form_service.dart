import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
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

  static Future<Map<String, String>> _getAuthHeaders() async {
    final token = await StorageService.getToken();
    return {
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> _decodeResponse(http.Response response) async {
    Map<String, dynamic> data = {};
    try {
      data = jsonDecode(response.body);
    } catch (_) {}
    return data;
  }

  /// Fetch all public forms (GET /form). Backend only returns `status == public`.
  /// When a category is provided (and not 'All'), filtering happens in Flutter
  /// against the `category` string, matching the backend's lowercase values.
  static Future<Map<String, dynamic>> getForms({String? category}) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}',
      );
      final headers = await _getAuthHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      final data = await _decodeResponse(response);

      if (response.statusCode == 404) {
        return {
          'success': true,
          'data': {'data': <dynamic>[]},
        };
      }

      if (response.statusCode == 200) {
        final List<dynamic> all = data['data'] is List ? data['data'] : [];

        if (category != null && category.isNotEmpty && category != 'All') {
          final catLower = category.toLowerCase();
          final filtered = all.where((form) {
            if (form is! Map) return false;
            return (form['category'] as String? ?? '').toLowerCase() == catLower;
          }).toList();
          return {
            'success': true,
            'data': {'data': filtered},
          };
        }

        return {'success': true, 'data': data};
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to fetch forms (${response.statusCode})',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Create a form. Backend requires multipart with a banner image file plus
  /// the `title` and `category` text fields. `category` must be the lowercase
  /// string value (e.g. 'ujian', 'survei').
  ///
  /// The banner MIME type and filename are resolved from the image magic
  /// bytes, so the request always carries a real `image/...` content type that
  /// matches the backend validator (`/^image\/(jpeg|png|webp)$/`) regardless
  /// of what the file picker reports.
  static Future<Map<String, dynamic>> createForm({
    required String title,
    required String category,
    required Uint8List bannerBytes,
    String? tokenRespon,
  }) async {
    try {
      final imageExt = _detectImageExt(bannerBytes);
      if (imageExt == null) {
        return {
          'success': false,
          'message':
              'Format banner tidak valid. Hanya menerima JPG, PNG, atau WEBP.',
        };
      }

      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.createFormEndpoint}',
      );

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.fields['title'] = title;
      request.fields['category'] = category.trim().toLowerCase();
      if (tokenRespon != null && tokenRespon.trim().isNotEmpty) {
        request.fields['token_respon'] = tokenRespon.trim();
      }
      request.files.add(http.MultipartFile.fromBytes(
        'banner',
        bannerBytes,
        filename: 'banner.$imageExt',
        contentType: MediaType('image', imageExt),
      ));

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Form created successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to create form (${response.statusCode})',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Detects whether the byte content is a real JPG, PNG, or WEBP image by
  /// inspecting its magic numbers, and returns the matching file extension
  /// ('jpeg', 'png', or 'webp'). Returns `null` for any other content.
  static String? _detectImageExt(Uint8List bytes) {
    if (bytes.length >= 3 &&
        bytes[0] == 0xFF &&
        bytes[1] == 0xD8 &&
        bytes[2] == 0xFF) {
      return 'jpeg';
    }
    if (bytes.length >= 8 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4E &&
        bytes[3] == 0x47 &&
        bytes[4] == 0x0D &&
        bytes[5] == 0x0A &&
        bytes[6] == 0x1A &&
        bytes[7] == 0x0A) {
      return 'png';
    }
    if (bytes.length >= 12 &&
        bytes[0] == 0x52 &&
        bytes[1] == 0x49 &&
        bytes[2] == 0x46 &&
        bytes[3] == 0x46 &&
        bytes[8] == 0x57 &&
        bytes[9] == 0x45 &&
        bytes[10] == 0x42 &&
        bytes[11] == 0x50) {
      return 'webp';
    }
    return null;
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
      }
      final data = await _decodeResponse(response);
      return {
        'success': false,
        'message': data['message'] ?? 'Failed to fetch forms',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Fetch form detail by slug. Response `data` includes `soal` (the question
  /// list with per-option `is_correct`). Always prefer this over the broken
  /// GET /form/soal/:id endpoint.
  static Future<Map<String, dynamic>> getFormBySlug(String slug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formSlugEndpoint}?slug=$slug',
      );
      final headers = await _getAuthHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to fetch form',
      };
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
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Status updated',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to update status',
      };
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
      final data = await _decodeResponse(response);

      if (response.statusCode == 200 || response.statusCode == 204) {
        return {
          'success': true,
          'message': data['message'] ?? 'Form deleted',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to delete form',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Create one or more questions for a form using the multipart `data` field.
  /// Each question shape: {"soal":{"question":..., "type":...},
  /// "options":[{"value":..., "is_correct": ...}]}
  static Future<Map<String, dynamic>> createQuestions({
    required String formSlug,
    required List<Map<String, dynamic>> questions,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}?form_slug=$formSlug',
      );

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.fields['data'] = jsonEncode(questions);

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Questions created successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to create questions',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Update a single soal. Payload shape:
  /// {"soal":{"question":..., "type":...},
  ///  "options":[{"id":..., "value":..., "is_correct": ...}]}
  static Future<Map<String, dynamic>> updateQuestion({
    required int soalId,
    required Map<String, dynamic> payload,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}/$soalId',
      );

      final request = http.MultipartRequest('PATCH', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.fields['data'] = jsonEncode(payload);

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Question updated successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to update question',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> deleteQuestion(int soalId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}/$soalId',
      );
      final headers = await _getHeaders();
      final response = await http
          .delete(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200 || response.statusCode == 204) {
        return {
          'success': true,
          'message': data['message'] ?? 'Question deleted',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to delete question',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Import questions from a .docx file. The `file` field is sent as a
  /// memory-uploaded multipart file to POST /form/soal/import.
  static Future<Map<String, dynamic>> importQuestions({
    required String formSlug,
    required List<int> fileBytes,
    required String filename,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalImportEndpoint}?form_slug=$formSlug',
      );

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.files.add(http.MultipartFile.fromBytes(
        'file',
        fileBytes,
        filename: filename,
      ));

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Questions imported successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to import questions',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Validate the respondent token against the form before submitting.
  static Future<Map<String, dynamic>> checkTokenResponden({
    required String formSlug,
    required String token,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitCheckTokenEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({'token': token}),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Token validated',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Token validation failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  /// Submit a form. `answers` must be a list of {"jawaban": {...}} maps.
  /// `files` are attached in the same order the file-type answers appear in
  /// `answers` (the backend consumes them sequentially).
  static Future<Map<String, dynamic>> submitForm({
    required String formSlug,
    required List<Map<String, dynamic>> answers,
    List<({Uint8List bytes, String filename})> files = const [],
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitEndpoint}?form_slug=$formSlug',
      );

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.fields['data'] = jsonEncode(answers);

      for (final file in files) {
        request.files.add(http.MultipartFile.fromBytes(
          'files',
          file.bytes,
          filename: file.filename,
        ));
      }

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Form submitted successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to submit form (${response.statusCode})',
        'statusCode': response.statusCode,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getSubmitStats(String formSlug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }

      final data = await _decodeResponse(response);
      return {
        'success': false,
        'message': data['message'] ?? 'Failed to fetch stats',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> getSubmitDetail(String formSlug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitDetailEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      }

      final data = await _decodeResponse(response);
      return {
        'success': false,
        'message': data['message'] ?? 'Failed to fetch response details',
      };
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
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Shared successfully',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to share form',
      };
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
      final headers = await _getAuthHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to generate QR code',
      };
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

typedef VoidCallback = void Function();