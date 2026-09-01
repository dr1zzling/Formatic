/// Strips HTML tags from a string to produce plain text for display in lists
/// and previews. Used anywhere a question's HTML content needs to be shown
/// as text (not in the WYSIWYG editor).
///
/// Examples:
///   "<p>coba<br></p>"  →  "coba"
///   "<p>Apa <strong>ibu kota</strong>?</p>"  →  "Apa ibu kota?"
///   "Plain question"  →  "Plain question"
///   ""  →  ""
String stripHtmlTags(String html) {
  if (html.isEmpty) return html;
  if (!RegExp(r'<[a-zA-Z][^>]*>').hasMatch(html)) return html;

  return html
      .replaceAll(RegExp(r'</(p|div|li|h[1-6]|br)>', caseSensitive: false), ' ')
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
