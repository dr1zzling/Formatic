import React, { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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
      return katex.renderToString(expr.trim(), {
        displayMode: display,
        throwOnError: false,
        output: 'html',
      });
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

// ── Post-process HTML dari Quill ─────────────────────────────────────────────
function processQuillHtml(html) {
  if (!html) return '';

  // 1. Display math $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) =>
    `<span class="katex-display-wrap">${renderMath(expr, true)}</span>`
  );

  // 2. Inline math $...$
  html = html.replace(/\$([^$\n<>]+?)\$/g, (_, expr) =>
    renderMath(expr, false)
  );

  // 3. <pre> code blocks dari Quill
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
    containerRef.current.querySelectorAll('pre code.hljs').forEach((block) => {
      hljs.highlightElement(block);
    });
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
