import 'dart:convert';

/// Extracts plain text from a question string that may be:
///   1. Quill Delta JSON  — `[{"insert":"text",...}, ...]`
///   2. Legacy HTML       — `<p>text</p>` etc.
///   3. Plain text        — returned as-is
///
/// Used anywhere a question needs to be shown as plain text
/// (lists, previews, confirmations) rather than in the WYSIWYG editor.
String stripHtmlTags(String input) {
  if (input.isEmpty) return input;

  // ── Quill Delta JSON ────────────────────────────────────────
  // Delta is a JSON array: [{"insert": "text"}, {"insert":"\n"}, ...]
  final trimmed = input.trim();
  if (trimmed.startsWith('[')) {
    try {
      final decoded = jsonDecode(trimmed);
      if (decoded is List) {
        final buffer = StringBuffer();
        for (final op in decoded) {
          if (op is Map) {
            final insert = op['insert'];
            if (insert is String) {
              // Skip pure newline-only inserts that are just Quill's block markers
              final text = insert.replaceAll('\n', ' ');
              buffer.write(text);
            }
            // Skip non-text inserts (e.g. embedded images: {"insert": {...}})
          }
        }
        return buffer.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
      }
    } catch (_) {
      // Not valid JSON — fall through to HTML/plain text handling
    }
  }

  // ── Legacy HTML ─────────────────────────────────────────────
  if (RegExp(r'<[a-zA-Z][^>]*>').hasMatch(trimmed)) {
    return trimmed
        .replaceAll(
            RegExp(r'</(p|div|li|h[1-6]|br)>', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), ' ')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  // ── Plain text ───────────────────────────────────────────────
  return input;
}
