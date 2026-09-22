import React, { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// ── Escape HTML (mencegah double escaping jika sudah ter-escape) ─────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&(?!(amp|lt|gt|quot|#39|#x?[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Decode HTML entities ─────────────────────────────────────────────────────
function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

// ── Render satu ekspresi math → HTML ────────────────────────────────────────
function renderMath(expr, display) {
  const isLatex = /\\[a-zA-Z{([\\]/.test(expr);
  if (isLatex) {
    try {
      const rendered = katex.renderToString(expr.trim(), {
        displayMode: display,
        throwOnError: false,
        output: 'html',
      });
      const cls = display ? 'katex-display-wrap' : 'katex-inline-wrap';
      return `<span class="${cls}">${rendered}</span>`;
    } catch {
      // fallback ke unicode display
    }
  }
  const cls = display ? 'math-display' : 'math-inline';
  return `<span class="${cls}">${escapeHtml(expr.trim())}</span>`;
}

// ── Syntax highlight satu blok kode ─────────────────────────────────────────
function highlightCode(code, lang) {
  try {
    const cleanCode = decodeEntities(code);
    const result = lang
      ? hljs.highlight(cleanCode, { language: lang, ignoreIllegals: true })
      : hljs.highlightAuto(cleanCode);
    return result.value;
  } catch {
    return escapeHtml(code);
  }
}

// ── Strip HTML tags dari dalam ekspresi math, konversi <sup> → ^{} ──────────
function stripHtmlFromMath(expr) {
  if (!expr) return '';
  let result = expr.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    return text.length === 1 ? `^${text}` : `^{${text}}`;
  });
  result = result.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    return text.length === 1 ? `_${text}` : `_{${text}}`;
  });
  result = result.replace(/<[^>]+>/g, '');
  result = decodeEntities(result);
  return result;
}

// ── Cek apakah string terlihat seperti ekspresi math ────────────────────────
function looksLikeMath(text) {
  if (!text) return false;
  return /[a-zA-Z]\^/.test(text) ||
         /[0-9]\^/.test(text) ||
         /[a-zA-Z]_[0-9a-zA-Z]/.test(text) ||
         /\^[{0-9a-zA-Z]/.test(text);
}

// ── Daftar tag WYSIWYG yang aman ───────────────────────────────────────────
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
  'pre', 'code', 'span', 'ul', 'ol', 'li', 'a', 'img', 'audio',
  'video', 'source', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th',
  'td', 'caption', 'hr', 'div'
]);

// ── Sanitize tag HTML non-WYSIWYG/berbahaya agar tidak merusak tata letak ──
function sanitizeRawHtmlTags(html) {
  if (!html) return '';

  return html.replace(/<\/?([!a-zA-Z0-9_-]+)([\s\S]*?)>/g, (match, tagName, attrs) => {
    const lower = tagName.toLowerCase();
    
    // Tag berbahaya / non-wysiwyg (doctype, html, head, meta, link, script, style, header, footer, etc.)
    if (!ALLOWED_TAGS.has(lower) || lower.startsWith('!')) {
      return `&lt;${match.slice(1, -1)}&gt;`;
    }

    // Bersihkan event handlers berbahaya (onclick, onerror, onload, dll)
    const cleanAttrs = attrs
      .replace(/\s*on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
      .replace(/\s*href\s*=\s*["']\s*javascript:[^"']*["']/gi, ' href="#"')
      .replace(/\s*src\s*=\s*["']\s*javascript:[^"']*["']/gi, ' src=""');

    return `<${match.startsWith('</') ? '/' : ''}${tagName}${cleanAttrs}>`;
  });
}

/**
 * Parse teks biasa (dari import docx / plain text) → HTML
 */
function parseTextToHtml(text) {
  if (!text) return '';

  const segments = [];
  let rest = text;

  while (rest.length > 0) {
    const fenceStart = rest.indexOf('```');
    const mathStart  = rest.indexOf('$$');

    const hasFence = fenceStart !== -1;
    const hasMath  = mathStart !== -1;

    if (!hasFence && !hasMath) {
      segments.push({ type: 'text', content: rest });
      rest = '';
      break;
    }

    const pickFence = hasFence && (!hasMath || fenceStart <= mathStart);

    if (pickFence) {
      if (fenceStart > 0) {
        segments.push({ type: 'text', content: rest.slice(0, fenceStart) });
      }
      const afterFence = rest.slice(fenceStart + 3);
      const newlineIdx = afterFence.indexOf('\n');
      const lang = newlineIdx !== -1 ? afterFence.slice(0, newlineIdx).trim() : '';
      const codeStart = newlineIdx !== -1 ? newlineIdx + 1 : 0;
      const endFence = afterFence.indexOf('```', codeStart);
      if (endFence === -1) {
        segments.push({ type: 'code', lang, content: afterFence.slice(codeStart) });
        rest = '';
      } else {
        const code = afterFence.slice(codeStart, endFence).replace(/\n$/, '');
        segments.push({ type: 'code', lang, content: code });
        rest = afterFence.slice(endFence + 3);
      }
    } else {
      if (mathStart > 0) {
        segments.push({ type: 'text', content: rest.slice(0, mathStart) });
      }
      const afterMath = rest.slice(mathStart + 2);
      const endMath = afterMath.indexOf('$$');
      if (endMath === -1) {
        segments.push({ type: 'text', content: rest.slice(mathStart) });
        rest = '';
      } else {
        const expr = afterMath.slice(0, endMath);
        segments.push({ type: 'math', display: true, content: expr });
        rest = afterMath.slice(endMath + 2);
      }
    }
  }

  let html = '';
  for (const seg of segments) {
    if (seg.type === 'code') {
      const highlighted = highlightCode(seg.content, seg.lang);
      const langClass = seg.lang ? ` language-${seg.lang}` : '';
      html += `<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`;
    } else if (seg.type === 'math') {
      html += `<span class="katex-display-wrap">${renderMath(seg.content, true)}</span>`;
    } else {
      html += renderInlineText(seg.content);
    }
  }

  return html;
}

// ── Render teks biasa dengan inline math dan inline code ─────────────────────
function renderInlineText(text) {
  if (!text) return '';
  let html = '';
  let i = 0;

  while (i < text.length) {
    // Inline code `...`
    if (text[i] === '`' && text.slice(i).match(/^`[^`\n]+`/)) {
      const m = text.slice(i).match(/^`([^`\n]+)`/);
      html += `<code class="inline-code">${escapeHtml(m[1])}</code>`;
      i += m[0].length;
      continue;
    }
    // Inline math $...$
    if (text[i] === '$' && text[i + 1] !== '$') {
      const m = text.slice(i).match(/^\$([^$\n]+?)\$/);
      if (m) {
        html += renderMath(m[1], false);
        i += m[0].length;
        continue;
      }
    }
    // Newline → <br>
    if (text[i] === '\n') {
      html += '<br>';
      i++;
      continue;
    }
    // Normal text — collect until next special char
    let j = i + 1;
    while (j < text.length && text[j] !== '`' && text[j] !== '$' && text[j] !== '\n') j++;
    html += escapeHtml(text.slice(i, j));
    i = j;
  }

  return html;
}

/**
 * Pre-process Quill HTML to merge consecutive <p> tags that form a fenced
 * code block (``` ... ```) into a single <pre> block.
 */
function collapseFencedCodeBlocks(html) {
  if (!html) return '';
  const parts = [];
  const pRegex = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  let lastIndex = 0;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'raw', content: html.slice(lastIndex, match.index) });
    }
    const innerDecoded = match[2]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    const innerText = decodeEntities(innerDecoded);
    parts.push({ type: 'p', attrs: match[1], raw: match[2], text: innerText });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    parts.push({ type: 'raw', content: html.slice(lastIndex) });
  }

  const out = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (part.type !== 'p') {
      out.push(part.type === 'raw' ? part.content : `<p${part.attrs}>${part.raw}</p>`);
      i++;
      continue;
    }

    const fenceMatch = part.text.match(/^```([a-zA-Z0-9_#-]*)\n?([\s\S]*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1].trim().toLowerCase();
      const firstLineCode = fenceMatch[2];

      if (firstLineCode.includes('\n```')) {
        const endIdx = firstLineCode.indexOf('\n```');
        const code = (firstLineCode.slice(0, endIdx))
          .replace(/^\n+/, '').replace(/\n+$/, '');
        const highlighted = highlightCode(code, lang);
        const langClass = lang ? ` language-${lang}` : '';
        out.push(`<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`);
        i++;
        continue;
      }

      const codeLines = firstLineCode ? [firstLineCode] : [];
      i++;
      while (i < parts.length) {
        const next = parts[i];
        if (next.type !== 'p') {
          i++;
          continue;
        }
        const lineText = next.text;
        if (lineText.trim() === '```') {
          i++;
          break;
        }
        codeLines.push(lineText);
        i++;
      }

      const code = codeLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
      const highlighted = highlightCode(code, lang);
      const langClass = lang ? ` language-${lang}` : '';
      out.push(`<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`);
      continue;
    }

    out.push(`<p${part.attrs}>${part.raw}</p>`);
    i++;
  }

  return out.join('');
}

// ── Post-process HTML dari Quill ─────────────────────────────────────────────
function processQuillHtml(html) {
  if (!html) return '';

  // 1. Collapse fenced code blocks that span multiple <p> tags
  html = collapseFencedCodeBlocks(html);

  // 1b. Fenced Code Blocks ```lang ... ``` (remaining inline / cross-tag cases)
  html = html.replace(/(?:<p[^>]*>)?```([a-zA-Z0-9_#-]*)([\s\S]*?)```(?:<\/p>)?/gi, (_, lang, inner) => {
    let code = inner
      .replace(/^<br\s*\/?>/i, '')
      .replace(/<br\s*\/?>$/i, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');

    const cleanLang = lang ? lang.trim().toLowerCase() : '';
    const highlighted = highlightCode(code, cleanLang);
    const langClass = cleanLang ? ` language-${cleanLang}` : '';
    return `<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`;
  });

  // 2. Quill v2 .ql-code-block-container
  html = html.replace(/<div class="ql-code-block-container"[^>]*>([\s\S]*?)<\/div>(?=(?:(?!<div class="ql-code-block">)|$))/gi, (full, inner) => {
    const lines = [];
    const lineRegex = /<div class="ql-code-block"[^>]*>([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = lineRegex.exec(inner)) !== null) {
      const line = m[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '');
      lines.push(line);
    }
    const code = lines.length > 0 ? lines.join('\n') : inner.replace(/<[^>]+>/g, '');
    const highlighted = highlightCode(code, '');
    return `<pre class="hljs-pre"><code class="hljs">${highlighted}</code></pre>`;
  });

  // 3. Quill <pre class="ql-syntax"> atau <pre> biasa
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/gi, (_, attrs, inner) => {
    const langMatch = attrs.match(/data-language=["']([^"']+)["']/i) || attrs.match(/class=["'][^"']*language-([^"'\s]+)/i);
    const lang = langMatch ? langMatch[1] : '';

    let code = inner
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '');

    const highlighted = highlightCode(code, lang);
    const langClass = lang ? ` language-${lang}` : '';
    return `<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`;
  });

  // 4. Display math $$...$$ — strip inner HTML tags dulu
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const clean = stripHtmlFromMath(expr);
    return `<span class="katex-display-wrap">${renderMath(clean, true)}</span>`;
  });

  // 5. Inline math $...$ — tangani kasus ada tag HTML di dalam $...$
  html = html.replace(/\$((?:[^$]|<[^>]+>)+?)\$/g, (match, expr) => {
    const clean = stripHtmlFromMath(expr).trim();
    if (!clean) return match;
    return renderMath(clean, false);
  });

  // 6. Handle ekspresi math di luar $...$ dalam <p> tag
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (fullMatch, attrs, inner) => {
    if (/\$|katex|hljs/i.test(inner)) return fullMatch;

    const plainText = stripHtmlFromMath(inner).trim();
    if (!looksLikeMath(plainText)) return fullMatch;

    try {
      const rendered = katex.renderToString(plainText, {
        throwOnError: true,
        output: 'html',
      });
      const cls = 'katex-inline-wrap';
      return `<p${attrs}><span class="${cls}">${rendered}</span></p>`;
    } catch {
      const converted = plainText.replace(
        /([a-zA-Z0-9]+(?:\^[{]?[a-zA-Z0-9]+[}]?|_[{]?[a-zA-Z0-9]+[}]?)+)/g,
        (seg) => {
          if (!looksLikeMath(seg)) return escapeHtml(seg);
          try {
            const r = katex.renderToString(seg, { throwOnError: true, output: 'html' });
            return `<span class="katex-inline-wrap">${r}</span>`;
          } catch { return escapeHtml(seg); }
        }
      );
      return `<p${attrs}>${converted}</p>`;
    }
  });

  // 7. Inline code `code` dan Quill <code>
  html = html.replace(/`([^`\n<]+)`/g, '<code class="inline-code">$1</code>');
  html = html.replace(/<code>((?:(?!<\/code>)[\s\S])+)<\/code>/gi, (match, inner) => {
    if (match.includes('class=')) return match;
    return `<code class="inline-code">${inner}</code>`;
  });

  // 8. Sanitize tag berbahaya / non-WYSIWYG agar tidak merusak struktur DOM
  html = sanitizeRawHtmlTags(html);

  return html;
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function RichTextDisplay({ content, className = '', style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false },
        ],
        throwOnError: false,
        output: 'html',
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoredClasses: ['katex', 'katex-display', 'hljs', 'hljs-pre', 'inline-code'],
      });
    } catch {
      // ignore render errors
    }
  }, [content]);

  if (!content) return null;

  const isHtml = /<(!DOCTYPE|[a-z/][\s\S]*?)>/i.test(content);

  const finalHtml = isHtml
    ? processQuillHtml(content)
    : parseTextToHtml(content);

  return (
    <div
      ref={containerRef}
      className={`rich-display ql-snow ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
