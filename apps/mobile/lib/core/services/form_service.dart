import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as path;
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
    return {if (token != null) 'Authorization': 'Bearer $token'};
  }

  static Future<Map<String, dynamic>> _decodeResponse(
    http.Response response,
  ) async {
    Map<String, dynamic> data = {};
    try {
      data = jsonDecode(response.body);
    } catch (_) {}
    return data;
  }

  /// Fetch all public forms. Backend returns same data regardless of category param.
  /// Menggunakan satu call dengan category=ujian sebagai trigger, karena backend
  /// mengembalikan semua form public tanpa filter.
  static Future<Map<String, dynamic>> getForms({String? category}) async {
    try {
      // Backend mengembalikan semua form public — gunakan satu call saja
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formsEndpoint}?category=ujian',
      );
      final headers = await _getAuthHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = await _decodeResponse(response);
        // Backend: { message: "...", data: [...] } — data langsung array
        final List<dynamic> allForms =
            data['data'] is List ? data['data'] as List : [];

        // Filter di client jika category spesifik
        if (category != null && category.isNotEmpty && category != 'All') {
          final catLower = category.toLowerCase();
          final filtered = allForms.where((f) {
            if (f is! Map) return false;
            // Backend menaruh kategori di f.kategori.{primary_kategori,sub_kategori}
            final kategori = f['kategori'];
            final fCat = kategori is Map
                ? (kategori['primary_kategori'] ??
                        kategori['sub_kategori'] ??
                        '')
                    .toString()
                : (f['category'] ?? '').toString();
            return fCat.toLowerCase().trim() == catLower;
          }).toList();
          return {'success': true, 'data': {'data': filtered}};
        }

        return {'success': true, 'data': {'data': allForms}};
      }

      if (response.statusCode == 404) {
        return {'success': true, 'data': {'data': <dynamic>[]}};
      }

      final data = await _decodeResponse(response);
      return {
        'success': false,
        'message': data['message'] ?? 'Failed (${response.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
    required Uint8List bannerBytes,
    int? subKategoriId,
    String? tokenRespon,
    int? duration,
    String? themeColor,
    // Legacy — kept for backward compat, not sent to backend
    String? category,
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
      // Backend membutuhkan sub_kategori sebagai ID integer dari tabel sub_kategori
      if (subKategoriId != null) {
        request.fields['sub_kategori'] = subKategoriId.toString();
      }
      if (tokenRespon != null && tokenRespon.trim().isNotEmpty) {
        request.fields['token_respon'] = tokenRespon.trim();
      }
      if (duration != null && duration > 0) {
        request.fields['duration'] = duration.toString();
      }
      if (themeColor != null && themeColor.trim().isNotEmpty) {
        request.fields['theme_color'] = themeColor.trim();
      }
      request.files.add(
        http.MultipartFile.fromBytes(
          'banner',
          bannerBytes,
          filename: 'banner.$imageExt',
          contentType: MediaType('image', imageExt),
        ),
      );

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
        'message':
            data['message'] ?? 'Failed to create form (${response.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Update token_respon untuk form.
  /// Mengirim semua field setting sekaligus ke PATCH /form/setting
  /// agar tidak ada field yang ter-overwrite dengan null.
  static Future<Map<String, dynamic>> updateTokenRespon({
    required String slug,
    required String tokenRespon,
    int? durationMinutes,
    int? startAtMillis,
    bool isRandom = false,
    String? themeColor,
  }) async {
    return updateFormSetting(
      slug: slug,
      tokenRespon: tokenRespon.isEmpty ? null : tokenRespon.trim(),
      durationMinutes: durationMinutes,
      startAtMillis: startAtMillis,
      isRandom: isRandom,
      themeColor: themeColor,
    );
  }

  /// Update form settings: duration, start_at, is_random, token_respon, theme_color.
  /// Calls PATCH /form/setting?form_slug=<slug>
  /// Backend body: { duration, start_at, is_random, token_respon, theme_color }
  /// Backend contract (verified): semua field nullable, dikirim bersamaan.
  static Future<Map<String, dynamic>> updateFormSetting({
    required String slug,
    int? durationMinutes,   // null → kirim null (hapus timer)
    int? startAtMillis,     // null → kirim null (hapus start_at)
    bool isRandom = false,
    String? tokenRespon,    // null → kirim null (hapus token)
    String? themeColor,     // null → tidak dikirim (biarkan backend tidak mengubah)
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formSettingEndpoint}?form_slug=$slug',
      );
      final headers = await _getHeaders();
      final bodyMap = <String, dynamic>{
        'duration': durationMinutes,
        'start_at': startAtMillis,
        'is_random': isRandom,
        'token_respon': tokenRespon,
      };
      if (themeColor != null) bodyMap['theme_color'] = themeColor;
      final response = await http
          .patch(url, headers: headers, body: jsonEncode(bodyMap))
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Pengaturan berhasil disimpan',
          'data': data['data'],
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal menyimpan pengaturan',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Ubah status form ke public/private.
  /// Backend: PUT /form?form_slug=<slug> body { status }
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
          .put(url, headers: headers, body: jsonEncode({'status': status}))
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Status berhasil diperbarui',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal memperbarui status',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
        return {'success': true, 'message': data['message'] ?? 'Form deleted'};
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to delete form',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      request.files.add(
        http.MultipartFile.fromBytes('file', fileBytes, filename: filename),
      );

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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
          .post(url, headers: headers, body: jsonEncode({'token': token}))
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);

      // _decodeResponse sudah try-catch; body kosong/tidak valid → data = {}
      final data = await _decodeResponse(response);

      // Debug: log full response untuk keperluan diagnosa (tidak ditampilkan ke user)
      assert(() {
        debugPrint(
          '[checkToken] status=${response.statusCode} '
          'slug=$formSlug '
          'body=${response.body.length > 500 ? response.body.substring(0, 500) : response.body}',
        );
        return true;
      }());

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Backend response check-token mengembalikan form_submit record di data.data
        // yang berisi: { id, user_id, user_username, form_id, status, attemps, start_at }
        // start_at dibutuhkan untuk hitung timer end ketika form.start_at tidak tersedia.
        final responseData = data['data'];
        return {
          'success': true,
          'message': data['message'] ?? 'Token validated',
          'data': responseData, // form_submit record (bisa Map atau null)
        };
      }

      // Semua status non-200/201 → success: false
      // statusCode disertakan agar caller bisa membedakan 400 (token salah)
      // dari 500 (server error) tanpa melihat pesan.
      // rawMessage menyertakan seluruh body error untuk keperluan diagnostik
      // (tidak ditampilkan mentah ke user — UI memetakan ke pesan yang lebih baik).
      final rawMessage = data['message'] ?? data['error'] ?? data['statusCode']?.toString();
      return {
        'success': false,
        'statusCode': response.statusCode,
        'message': rawMessage ?? 'Token validation failed (HTTP ${response.statusCode})',
      };
    } catch (e) {
      return {
        'success': false,
        'statusCode': 0, // 0 = network/timeout error
        'message': 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
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

      // [SubmitDebug] Log submit request details
      assert(() {
        debugPrint('[SubmitDebug] SUBMIT_REQUEST_START');
        debugPrint('[SubmitDebug] method=POST');
        debugPrint('[SubmitDebug] endpoint=${ApiConfig.submitEndpoint}');
        debugPrint('[SubmitDebug] url=$url');
        debugPrint('[SubmitDebug] form_slug=$formSlug');
        debugPrint('[SubmitDebug] answersCount=${answers.length}');
        debugPrint('[SubmitDebug] filesCount=${files.length}');
        
        // Log payload structure without sensitive data
        try {
          final payload = jsonEncode(answers);
          final truncated = payload.length > 200 
            ? '${payload.substring(0, 200)}...' 
            : payload;
          debugPrint('[SubmitDebug] payload=$truncated');
          
          // Log answer types breakdown
          for (int i = 0; i < answers.length && i < 5; i++) {
            final ans = answers[i];
            final jawaban = ans['jawaban'] as Map?;
            if (jawaban != null) {
              final soalId = jawaban['soal_id'];
              final hasSoalOptionId = jawaban.containsKey('soal_option_id');
              final hasAnswerText = jawaban.containsKey('answer_text');
              debugPrint('[SubmitDebug] answer[$i] soal_id=$soalId has_option=$hasSoalOptionId has_text=$hasAnswerText');
            }
          }
        } catch (e) {
          debugPrint('[SubmitDebug] payload_debug_error=$e');
        }
        
        return true;
      }());

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      
      // [SubmitDebug] Log headers (without token value)
      assert(() {
        debugPrint('[SubmitDebug] headers_keys=${request.headers.keys.join(",")}');
        return true;
      }());
      
      request.fields['data'] = jsonEncode(answers);

      for (final file in files) {
        request.files.add(
          http.MultipartFile.fromBytes(
            'files',
            file.bytes,
            filename: file.filename,
          ),
        );
      }

      // [SubmitDebug] Log before sending
      assert(() {
        debugPrint('[SubmitDebug] SUBMIT_SENDING');
        return true;
      }());

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      
      // [SubmitDebug] Log response details
      assert(() {
        debugPrint('[SubmitDebug] SUBMIT_RESPONSE_RECEIVED');
        debugPrint('[SubmitDebug] statusCode=${response.statusCode}');
        debugPrint('[SubmitDebug] responseContentLength=${response.bodyBytes.length}');
        
        final bodyPreview = response.body.length > 200
          ? '${response.body.substring(0, 200)}...'
          : response.body;
        debugPrint('[SubmitDebug] responseBody=$bodyPreview');
        
        return true;
      }());
      
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        // [SubmitDebug] Success
        assert(() {
          debugPrint('[SubmitDebug] SUBMIT_SUCCESS statusCode=${response.statusCode}');
          return true;
        }());
        
        return {
          'success': true,
          'message': data['message'] ?? 'Form submitted successfully',
          'data': data,
        };
      }

      // [SubmitDebug] Error response
      assert(() {
        debugPrint('[SubmitDebug] SUBMIT_ERROR statusCode=${response.statusCode}');
        debugPrint('[SubmitDebug] errorMessage=${data['message']}');
        return true;
      }());

      return {
        'success': false,
        'message':
            data['message'] ?? 'Failed to submit form (${response.statusCode})',
        'statusCode': response.statusCode,
      };
    } catch (e) {
      // [SubmitDebug] Exception
      assert(() {
        debugPrint('[SubmitDebug] SUBMIT_EXCEPTION error=$e');
        return true;
      }());
      
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  static String getQrCodeImageUrl(String slug) {
    return '${ApiConfig.formApiBaseUrl}${ApiConfig.qrCodeImageEndpoint}?slug=$slug';
  }

  /// Download Excel export of form submissions.
  /// Returns the raw bytes of the .xlsx file on success, or an error map on failure.
  static Future<Map<String, dynamic>> exportSubmitToExcel(
    String formSlug,
  ) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.submitExportExcelEndpoint}?form_slug=$formSlug',
      );
      // Use auth-only headers — no Content-Type on a GET binary download.
      // Adding Content-Type on cross-origin GET triggers CORS preflight in browsers.
      final token = await StorageService.getToken();
      final headers = <String, String>{
        if (token != null) 'Authorization': 'Bearer $token',
        'Accept':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      final response = await http
          .get(url, headers: headers)
          .timeout(const Duration(seconds: 60)); // Excel export may take longer

      _handle401(response.statusCode);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'bytes': response.bodyBytes,
          'filename':
              'Hasil_Submit_${formSlug}_${DateTime.now().millisecondsSinceEpoch}.xlsx',
        };
      }

      // Try to decode error message
      String message = 'Gagal mengunduh file Excel';
      try {
        final data = jsonDecode(response.body);
        message = data['message'] ?? message;
      } catch (_) {}

      return {'success': false, 'message': message};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Create a question with optional image upload. The image is sent as multipart
  /// with field name 'soal_images' and the question data is sent as JSON in the 'data' field.
  static Future<Map<String, dynamic>> createQuestionWithImage({
    required String formSlug,
    required Map<String, dynamic> questionData,
    File? imageFile,
    Uint8List? imageBytes,
    String? imageName,
    Uint8List? audioBytes,
    String? audioName,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}?form_slug=$formSlug',
      );

      final request = http.MultipartRequest('POST', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);

      // Add image if provided (bytes for web, file path for native)
      if (imageBytes != null && imageName != null) {
        if (questionData['soal'] is Map<String, dynamic>) {
          questionData['soal']['image_filename'] = imageName;
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'soal_images',
            imageBytes,
            filename: imageName,
          ),
        );
      } else if (imageFile != null) {
        final filename = path.basename(imageFile.path);
        if (questionData['soal'] is Map<String, dynamic>) {
          questionData['soal']['image_filename'] = filename;
        }
        request.files.add(
          await http.MultipartFile.fromPath(
            'soal_images',
            imageFile.path,
            filename: filename,
          ),
        );
      }

      // Add audio if provided (bytes for web, file for native)
      if (audioBytes != null && audioName != null) {
        if (questionData['soal'] is Map<String, dynamic>) {
          questionData['soal']['audio_filename'] = audioName;
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'soal_audios',
            audioBytes,
            filename: audioName,
          ),
        );
      }

      // Add JSON data as array with single question
      request.fields['data'] = jsonEncode([questionData]);

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Question created successfully',
          'data': data,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Failed to create question',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Update a question with optional image upload or removal.
  /// - If imageFile is provided: uploads new image
  /// - If removeImage is true: removes existing image
  /// - If neither: keeps existing image
  static Future<Map<String, dynamic>> updateQuestionWithImage({
    required int soalId,
    required Map<String, dynamic> payload,
    File? imageFile,
    Uint8List? imageBytes,
    String? imageName,
    bool removeImage = false,
    Uint8List? audioBytes,
    String? audioName,
    bool removeAudio = false,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}/$soalId',
      );

      final request = http.MultipartRequest('PATCH', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);

      // Handle image updates
      if (removeImage) {
        // Signal backend to remove image
        if (payload['soal'] is Map<String, dynamic>) {
          payload['soal']['image_filename'] = null;
        }
      } else if (imageBytes != null && imageName != null) {
        // Upload new image (web/bytes path)
        if (payload['soal'] is Map<String, dynamic>) {
          payload['soal']['image_filename'] = imageName;
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'soal_images',
            imageBytes,
            filename: imageName,
          ),
        );
      } else if (imageFile != null) {
        // Upload new image (native/file path)
        final filename = path.basename(imageFile.path);
        if (payload['soal'] is Map<String, dynamic>) {
          payload['soal']['image_filename'] = filename;
        }
        request.files.add(
          await http.MultipartFile.fromPath(
            'soal_images',
            imageFile.path,
            filename: filename,
          ),
        );
      }
      // If neither removeImage nor imageFile, keep existing image (don't modify)

      // Handle audio updates — mirrors Web FE contract:
      // - removeAudio: send `audio: null` (backend parity, same as Web FE)
      // - audioBytes: replace with new file in `soal_audios`
      // - otherwise: keep existing audio (payload may carry `audio` from screen)
      if (removeAudio) {
        if (payload['soal'] is Map<String, dynamic>) {
          payload['soal']['audio'] = null;
        }
      } else if (audioBytes != null && audioName != null) {
        if (payload['soal'] is Map<String, dynamic>) {
          payload['soal']['audio_filename'] = audioName;
        }
        request.files.add(
          http.MultipartFile.fromBytes(
            'soal_audios',
            audioBytes,
            filename: audioName,
          ),
        );
      }

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
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// GET /kategori/primary — list semua primary kategori dari backend.
  /// Response: { message, data: [{ id, name }] }
  static Future<Map<String, dynamic>> getPrimaryCategories() async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}${ApiConfig.primaryCategoriesEndpoint}');
      final headers = await _getAuthHeaders();
      final response = await http.get(url, headers: headers).timeout(ApiConfig.timeout);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        final list = data['data'] is List
            ? data['data'] as List
            : (data['categories'] is List ? data['categories'] as List : []);
        final items = list.whereType<Map>().map((e) {
          return {
            'id': (e['id'] as num?)?.toInt() ?? 0,
            'name': (e['name'] ?? e['category_name'] ?? '').toString(),
          };
        }).toList();
        return {'success': true, 'data': items};
      }

      return {
        'success': false,
        'message': _extractErrorMessage(data, 'Gagal memuat kategori'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// GET /kategori/sub/:primaryId — list sub-kategori berdasarkan primary kategori id.
  /// Response: { message, data: [{ id, name }] }
  static Future<Map<String, dynamic>> getSubCategories(int primaryId) async {
    try {
      final url = Uri.parse('${ApiConfig.formApiBaseUrl}${ApiConfig.subCategoriesEndpoint}/$primaryId');
      final headers = await _getAuthHeaders();
      final response = await http.get(url, headers: headers).timeout(ApiConfig.timeout);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        final list = data['data'] is List
            ? data['data'] as List
            : (data['categories'] is List ? data['categories'] as List : []);
        final items = list.whereType<Map>().map((e) {
          return {
            'id': (e['id'] as num?)?.toInt() ?? 0,
            'name': (e['name'] ?? e['category_name'] ?? '').toString(),
          };
        }).toList();
        return {'success': true, 'data': items};
      }

      return {
        'success': false,
        'message': _extractErrorMessage(data, 'Gagal memuat sub-kategori'),
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Hanya mengambil pesan error dari body response tanpa menampilkan
  /// credential/hash/secret apapun. Untuk envelope error NestJS
  /// ({ statusCode, message }) maupun pesan custom backend.
  static String _extractErrorMessage(Map<String, dynamic> data, String fallback) {
    final msg = data['message'];
    if (msg is String && msg.trim().isNotEmpty) return msg.trim();
    if (msg is List && msg.isNotEmpty) return msg.join(', ');
    final err = data['error'];
    if (err is String && err.trim().isNotEmpty) return err.trim();
    return fallback;
  }

  /// GET monitoring status submit semua user untuk satu form.
  /// Endpoint: GET /form/monitoring?form_slug=<slug>
  /// Response: { message, status: [{ user_id, user_username, start_at, submitted_at, status, attemps }] }
  /// Hanya Creator/Collaborator yang dapat mengakses.
  static Future<Map<String, dynamic>> getMonitoringStatus(String formSlug) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.monitoringEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .get(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        // Response: { message, status: [...] }
        final List<dynamic> statusList =
            data['status'] is List ? data['status'] as List : [];
        return {
          'success': true,
          'message': data['message'] ?? 'Berhasil mendapatkan status submit',
          'status': statusList,
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal memuat data monitoring',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Reset status pengerjaan user ke kondisi awal.
  /// Endpoint: PUT /form/monitoring/reset?form_slug=<slug>
  /// Body: { user_id: number }
  /// Hanya bisa reset user dengan status "progress".
  /// Response: { message: "Berhasil Reset" }
  static Future<Map<String, dynamic>> resetMonitoringUser({
    required String formSlug,
    required int userId,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.monitoringResetEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .put(url, headers: headers, body: jsonEncode({'user_id': userId}))
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Berhasil Reset',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal melakukan reset',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Responden melaporkan posisi halaman/soal aktif (monitoring real-time creator).
  /// Endpoint: `PATCH /form/monitoring/progress?form_slug=<slug>`
  /// Body: `{current_page, current_soal, total_pages, total_soal}`
  /// Response 200: { message: "Progress diperbarui" }.
  /// 403 jika pemanggil creator; tanpa record → { message: "Tidak ada record pengerjaan" }.
  /// Dipakai fire-and-forget dari viewer; tidak pernah throw.
  static Future<Map<String, dynamic>> updateMonitoringProgress({
    required String formSlug,
    required int currentPage,
    required int currentSoal,
    required int totalPages,
    required int totalSoal,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.monitoringProgressEndpoint}?form_slug=$formSlug',
      );
      final headers = await _getHeaders();
      final response = await http
          .patch(
            url,
            headers: headers,
            body: jsonEncode({
              'current_page': currentPage,
              'current_soal': currentSoal,
              'total_pages': totalPages,
              'total_soal': totalSoal,
            }),
          )
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'Progress diperbarui',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal memperbarui progress',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Update banner form (creator only).
  /// Endpoint: `PATCH /form/banner?form_slug=<slug>`, multipart field `banner`.
  /// Backend: maks 5MB, hanya JPG/JPEG/PNG/WEBP.
  /// Response 200: { message: "Berhasil Update Banner", data: { banner: "..." } }
  static Future<Map<String, dynamic>> updateBanner({
    required String slug,
    required Uint8List bannerBytes,
    required String filename,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formBannerEndpoint}?form_slug=$slug',
      );

      final request = http.MultipartRequest('PATCH', url);
      final headers = await _getAuthHeaders();
      request.headers.addAll(headers);
      request.files.add(
        http.MultipartFile.fromBytes('banner', bannerBytes, filename: filename),
      );

      final streamedResponse = await request.send().timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final banner =
            data['data'] is Map ? (data['data'] as Map)['banner'] : null;
        return {
          'success': true,
          'message': data['message'] ?? 'Banner berhasil diupdate',
          'banner': banner?.toString(),
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal upload banner',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }

  /// Hapus banner form (creator only).
  /// Endpoint: `DELETE /form/banner?form_slug=<slug>`
  /// Response 200: { message: "Berhasil Hapus Banner", data: { banner: null } }
  static Future<Map<String, dynamic>> deleteBanner({
    required String slug,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.formApiBaseUrl}${ApiConfig.formBannerEndpoint}?form_slug=$slug',
      );
      final headers = await _getHeaders();
      final response = await http
          .delete(url, headers: headers)
          .timeout(ApiConfig.timeout);

      _handle401(response.statusCode);
      final data = await _decodeResponse(response);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Banner berhasil dihapus',
        };
      }

      return {
        'success': false,
        'message': data['message'] ?? 'Gagal hapus banner',
      };
    } catch (e) {
      return {'success': false, 'message': 'Connection error: ${e.toString()}'};
    }
  }
}

typedef VoidCallback = void Function();
