import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _usernameKey = 'username';
  static const String _userIdKey = 'user_id';

  // Save token
  static Future<bool> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_tokenKey, token);
    } catch (e) {
      return false;
    }
  }

  // Get token
  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    } catch (e) {
      return null;
    }
  }

  // Save username
  static Future<bool> saveUsername(String username) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setString(_usernameKey, username);
    } catch (e) {
      return false;
    }
  }

  // Get username
  static Future<String?> getUsername() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_usernameKey);
    } catch (e) {
      return null;
    }
  }

  // Clear token
  static Future<bool> clearToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.remove(_tokenKey);
    } catch (e) {
      return false;
    }
  }

  // Clear username
  static Future<bool> clearUsername() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.remove(_usernameKey);
    } catch (e) {
      return false;
    }
  }

  // Clear all data (logout)
  static Future<bool> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.clear();
    } catch (e) {
      return false;
    }
  }

  // Check if logged in
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
