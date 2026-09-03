import React, { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// ── Escape HTML ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      // Bungkus dalam span dengan font-size eksplisit agar bisa dikontrol CSS
      const cls = display ? 'katex-display-wrap' : 'katex-inline-wrap';
      return `<span class="${cls}">${rendered}</span>`;
    } catch {
      // fallback ke unicode display
    }
  }
  // Unicode math (√, ², ∫, ±, →, lim, dll) → styled span
  const cls = display ? 'math-display' : 'math-inline';
  return `<span class="${cls}">${escapeHtml(expr.trim())}</span>`;
}

// ── Syntax highlight satu blok kode ─────────────────────────────────────────
function highlightCode(code, lang) {
  try {
    const result = lang
      ? hljs.highlight(code, { language: lang, ignoreIllegals: true })
      : hljs.highlightAuto(code);
    return result.value;
  } catch {
    return escapeHtml(code);
  }
}

/**
 * Parse teks biasa (dari import docx) → HTML
 *
 * Format yang didukung:
 *   ```lang          → fenced code block (diakhiri ```)
 *   $$expr$$         → display math (satu baris atau multi via \n)
 *   $expr$           → inline math
 *   `expr`           → inline code
 *   \n               → <br>
 */
function parseTextToHtml(text) {
  if (!text) return '';

  // Split teks menjadi segmen: code block, math block, atau teks biasa
  // Strategi: pisahkan berdasarkan fence ``` dan $$...$$
  const segments = [];

  // Regex untuk split: fenced code block atau display math
  // Diproses satu per satu
  let rest = text;

  while (rest.length > 0) {
    // ── Cari fenced code block ─────────────────────────────────────────────
    const fenceStart = rest.indexOf('```');
    const mathStart  = rest.indexOf('$$');

    // Mana yang lebih dulu?
    const hasFence = fenceStart !== -1;
    const hasMath  = mathStart !== -1;

    if (!hasFence && !hasMath) {
      // Tidak ada blok khusus — semua teks biasa
      segments.push({ type: 'text', content: rest });
      rest = '';
      break;
    }

    // Pilih yang paling awal
    const pickFence = hasFence && (!hasMath || fenceStart <= mathStart);

    if (pickFence) {
      // Teks sebelum fence
      if (fenceStart > 0) {
        segments.push({ type: 'text', content: rest.slice(0, fenceStart) });
      }
      // Ambil isi fence
      const afterFence = rest.slice(fenceStart + 3); // setelah ```
      const newlineIdx = afterFence.indexOf('\n');
      const lang = newlineIdx !== -1 ? afterFence.slice(0, newlineIdx).trim() : '';
      const codeStart = newlineIdx !== -1 ? newlineIdx + 1 : 0;
      const endFence = afterFence.indexOf('\n```', codeStart);
      if (endFence === -1) {
        // Tidak ada penutup — sisa dianggap kode
        segments.push({ type: 'code', lang, content: afterFence.slice(codeStart) });
        rest = '';
      } else {
        const code = afterFence.slice(codeStart, endFence);
        segments.push({ type: 'code', lang, content: code });
        rest = afterFence.slice(endFence + 4); // +4 = \n```
      }
    } else {
      // Teks sebelum $$
      if (mathStart > 0) {
        segments.push({ type: 'text', content: rest.slice(0, mathStart) });
      }
      const afterMath = rest.slice(mathStart + 2); // setelah $$
      const endMath = afterMath.indexOf('$$');
      if (endMath === -1) {
        // Tidak ada penutup — output literal
        segments.push({ type: 'text', content: rest.slice(mathStart) });
        rest = '';
      } else {
        const expr = afterMath.slice(0, endMath);
        segments.push({ type: 'math', display: true, content: expr });
        rest = afterMath.slice(endMath + 2);
      }
    }
  }

  // ── Render tiap segmen ───────────────────────────────────────────────────
  let html = '';
  for (const seg of segments) {
    if (seg.type === 'code') {
      const highlighted = highlightCode(seg.content, seg.lang);
      const langClass = seg.lang ? ` language-${seg.lang}` : '';
      html += `<pre class="hljs-pre"><code class="hljs${langClass}">${highlighted}</code></pre>`;
    } else if (seg.type === 'math') {
      html += `<span class="katex-display-wrap">${renderMath(seg.content, true)}</span>`;
    } else {
      // Teks biasa — render inline math $...$ dan inline code `...`
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

// ── Strip HTML tags dari dalam ekspresi math, konversi <sup> → ^{} ──────────
function stripHtmlFromMath(expr) {
  // Konversi <sup>...</sup> → ^{...} (Quill mengubah pangkat jadi <sup>)
  let result = expr.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    return text.length === 1 ? `^${text}` : `^{${text}}`;
  });
  // Konversi <sub>...</sub> → _{...}
  result = result.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    return text.length === 1 ? `_${text}` : `_{${text}}`;
  });
  // Strip sisa tag HTML
  result = result.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return result;
}

// ── Cek apakah string terlihat seperti ekspresi math (ada pangkat, operasi) ──
function looksLikeMath(text) {
  return /[a-zA-Z]\^/.test(text) ||      // a^2, x^n
         /[0-9]\^/.test(text) ||          // 2^3
         /[a-zA-Z]_[0-9a-zA-Z]/.test(text) || // x_n, a_1
         /\^[{0-9a-zA-Z]/.test(text);    // ^2, ^{...}
}

// ── Konversi satu segmen teks HTML (dalam satu blok) yang mengandung <sup>/<sub> ──
function convertSupSubToKatex(segment) {
  // Ambil teks plain dari segmen (dengan konversi sup/sub ke LaTeX)
  const latexExpr = stripHtmlFromMath(segment);
  if (!latexExpr.trim()) return segment;
  if (!looksLikeMath(latexExpr)) return segment;
  try {
    return katex.renderToString(latexExpr.trim(), {
      throwOnError: true,
      output: 'html',
    });
  } catch {
    return segment; // fallback
  }
}

// ── Post-process HTML dari Quill ─────────────────────────────────────────────
function processQuillHtml(html) {
  if (!html) return '';

  // 1. Display math $$...$$ — strip inner HTML tags dulu
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const clean = stripHtmlFromMath(expr);
    return `<span class="katex-display-wrap">${renderMath(clean, true)}</span>`;
  });

  // 2. Inline math $...$ — tangani kasus ada tag HTML di dalam $...$
  html = html.replace(/\$((?:[^$]|<[^>]+>)+?)\$/g, (match, expr) => {
    const clean = stripHtmlFromMath(expr).trim();
    if (!clean) return match;
    return renderMath(clean, false);
  });

  // 3. Handle ekspresi math di luar $...$ dalam <p> tag
  //    Kasus A: Quill <sup>/<sub> mewakili pangkat  → <p>x<sup>2</sup></p>
  //    Kasus B: User ketik ^ langsung sebagai teks   → <p>a^2-b^3</p>
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (fullMatch, attrs, inner) => {
    // Sudah dihandle dollar sign di atas
    if (/\$/.test(inner)) return fullMatch;

    // Dapatkan teks bersih dari inner HTML
    const plainText = stripHtmlFromMath(inner).trim();

    // Cek apakah terlihat seperti ekspresi math
    if (!looksLikeMath(plainText)) return fullMatch;

    // Coba render seluruh ekspresi sebagai KaTeX
    try {
      const rendered = katex.renderToString(plainText, {
        throwOnError: true,
        output: 'html',
      });
      const cls = 'katex-inline-wrap';
      return `<p${attrs}><span class="${cls}">${rendered}</span></p>`;
    } catch {
      // Kalau gagal render sekaligus, coba split per token math
      // dan render bagian-bagian yang mengandung ^ atau _ saja
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
      // Escape karakter non-math yang tersisa
      return `<p${attrs}>${converted}</p>`;
    }
  });

  // 4. <pre> code blocks dari Quill
  html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => {
    const decoded = inner
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const code = decoded.replace(/<[^>]+>/g, '');
    const highlighted = highlightCode(code, '');
    return `<pre class="hljs-pre"><code class="hljs">${highlighted}</code></pre>`;
  });

  return html;
}

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function RichTextDisplay({ content, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Syntax highlight code blocks
    containerRef.current.querySelectorAll('pre code.hljs').forEach((block) => {
      hljs.highlightElement(block);
    });

    // Auto-render LaTeX: scan semua $...$ dan $$...$$ di dalam elemen,
    // termasuk yang ada di dalam tag HTML dari Quill (span, p, dll)
    try {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false },
        ],
        throwOnError: false,
        output: 'html',
        // Jangan masuk ke dalam elemen yang sudah dirender katex
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoredClasses: ['katex', 'katex-display'],
      });
    } catch {
      // ignore render errors
    }
  }, [content]);

  if (!content) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  const finalHtml = isHtml
    ? processQuillHtml(content)
    : parseTextToHtml(content);

  return (
    <div
      ref={containerRef}
      className={`rich-display ql-snow ${className}`}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
