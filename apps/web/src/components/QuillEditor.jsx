import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { FORM_API_URL } from '../utils/api';
import { LATEX_SYMBOLS } from '../utils/latexSymbols';

// Toolbar tanpa tombol formula bawaan Quill (kita bikin sendiri)
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image', 'clean'],
  ['code-block'],
];

// ── Modal input LaTeX ──────────────────────────────────────────────────────
export function LatexModal({ onInsert, onClose, symbols = LATEX_SYMBOLS }) {
  const [latex, setLatex]       = useState('');
  const [mode, setMode]         = useState('inline'); // 'inline' | 'display'
  const [activeTab, setActiveTab] = useState(symbols[0]?.label ?? 'Dasar');
  const inputRef                = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Insert simbol ke textarea di posisi kursor
  function insertSymbol(sym) {
    const el = inputRef.current;
    if (!el) { setLatex(prev => prev + sym); return; }
    const start = el.selectionStart ?? latex.length;
    const end   = el.selectionEnd   ?? latex.length;
    const next  = latex.slice(0, start) + sym + latex.slice(end);
    setLatex(next);
    // Kembalikan fokus + geser kursor ke setelah sisipan
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + sym.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleInsert() {
    const trimmed = latex.trim();
    if (!trimmed) return;
    const wrapped = mode === 'display' ? `$$${trimmed}$$` : `$${trimmed}$`;
    onInsert(wrapped);
    onClose();
  }

  const currentCategory = symbols.find(c => c.label === activeTab) ?? symbols[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#102f56] text-[16px] flex items-center gap-2">
            <span className="text-[18px]">∑</span> Insert Rumus LaTeX
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 text-[18px] leading-none transition">×</button>
        </div>

        {/* ── Symbol Palette ─────────────────────────────────────────── */}
        <div className="mb-4 rounded-xl border border-[#e2edf7] overflow-hidden">
          {/* Tab kategori (disembunyikan kalau cuma 1 kategori) */}
          {symbols.length > 1 && (
          <div className="flex overflow-x-auto bg-[#f7fafd] border-b border-[#e2edf7] scrollbar-hide">
            {symbols.map(cat => (
              <button
                key={cat.label}
                onClick={() => setActiveTab(cat.label)}
                className={`px-3 py-2 text-[12px] font-semibold whitespace-nowrap shrink-0 border-b-2 transition ${
                  activeTab === cat.label
                    ? 'border-[#1a4fa0] text-[#1a4fa0] bg-white'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          )}

          {/* Grid simbol */}
          <div className="grid grid-cols-4 gap-1.5 p-3 bg-white">
            {currentCategory?.items.map((sym) => (
              <button
                key={sym.latex}
                title={sym.tip}
                onClick={() => insertSymbol(sym.latex)}
                className="flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-lg border border-[#e2edf7] bg-[#f7fafd] hover:bg-[#eef5fb] hover:border-[#1a4fa0] transition-all group"
              >
                <SymbolPreview latex={sym.latex} />
                <span className="text-[10px] text-gray-400 group-hover:text-[#1a4fa0] text-center leading-tight line-clamp-1">
                  {sym.tip}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode('inline')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition ${
              mode === 'inline' ? 'border-[#1a4fa0] bg-[#eef5fb] text-[#1a4fa0]' : 'border-gray-200 text-gray-500'
            }`}>
            Di dalam teks <code className="ml-1 text-[11px]">$...$</code>
          </button>
          <button
            onClick={() => setMode('display')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition ${
              mode === 'display' ? 'border-[#1a4fa0] bg-[#eef5fb] text-[#1a4fa0]' : 'border-gray-200 text-gray-500'
            }`}>
            Baris sendiri <code className="ml-1 text-[11px]">$$...$$</code>
          </button>
        </div>

        {/* Textarea LaTeX */}
        <textarea
          ref={inputRef}
          value={latex}
          onChange={e => setLatex(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleInsert(); }}
          placeholder={'Klik simbol di atas, atau ketik manual: \\frac{a}{b}'}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-mono outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/15 resize-none mb-3"
        />

        {/* Preview */}
        {latex.trim() && (
          <div className="mb-4 p-3 bg-[#f7fafd] rounded-xl border border-[#e2edf7] text-center overflow-x-auto min-h-[48px] flex items-center justify-center">
            <LatexPreview latex={latex} display={mode === 'display'} />
          </div>
        )}
        {!latex.trim() && (
          <div className="mb-4 p-3 bg-[#f7fafd] rounded-xl border border-[#e2edf7] text-center min-h-[48px] flex items-center justify-center">
            <span className="text-[12px] text-gray-300 italic">Preview rumus akan muncul di sini</span>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mb-4">
          <kbd className="px-1.5 py-0.5 border border-gray-200 rounded text-[10px] bg-gray-50">Ctrl+Enter</kbd> untuk insert cepat
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 transition">
            Batal
          </button>
          <button onClick={handleInsert} disabled={!latex.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40 transition"
            style={{ backgroundColor: '#1a4fa0' }}>
            Insert Rumus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview simbol kecil di palette ───────────────────────────────────────
function SymbolPreview({ latex }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(latex, ref.current, {
        displayMode: false,
        throwOnError: false,
        output: 'html',
        maxSize: 40,
      });
    } catch {
      ref.current.textContent = latex;
    }
  }, [latex]);
  return <span ref={ref} className="text-[15px] leading-none" />;
}

// ── LaTeX preview kecil di dalam modal ────────────────────────────────────
function LatexPreview({ latex, display }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(latex.trim(), ref.current, {
        displayMode: display,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      ref.current.textContent = latex;
    }
  }, [latex, display]);
  return <span ref={ref} />;
}

// ── Modal input Code Block ─────────────────────────────────────────────────
function CodeModal({ onInsert, onClose }) {
  const [code, setCode]   = useState('');
  const [lang, setLang]   = useState('javascript');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const LANGS = ['javascript','typescript','python','java','kotlin','sql','html','css','bash','plaintext'];

  function handleInsert() {
    if (!code.trim()) return;
    onInsert(`\`\`\`${lang}\n${code}\n\`\`\``);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="font-bold text-[#102f56] text-[16px] mb-4 flex items-center gap-2">
          <span className="font-mono">&lt;/&gt;</span> Insert Code Block
        </h3>

        <div className="flex items-center gap-3 mb-3">
          <label className="text-[13px] font-semibold text-gray-600 shrink-0">Bahasa:</label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#1a4fa0]">
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <textarea
          ref={inputRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleInsert(); }}
          placeholder={'// tulis kode di sini\nfunction hello() {\n  return "world";\n}'}
          rows={8}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-mono outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/15 resize-none mb-3"
        />

        <p className="text-[11px] text-gray-400 mb-4">
          <kbd className="px-1 border rounded text-[10px]">Ctrl+Enter</kbd> untuk insert
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleInsert} disabled={!code.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40 transition"
            style={{ backgroundColor: '#1a4fa0' }}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QuillEditor utama ──────────────────────────────────────────────────────
export default function QuillEditor({ value, onChange, placeholder = 'Tulis pertanyaan di sini...' }) {
  const containerRef   = useRef(null);
  const quillRef       = useRef(null);
  const isUpdatingRef  = useRef(false);
  const [showLatex, setShowLatex] = useState(false);
  const [showCode, setShowCode]   = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (quillRef.current) return;

    const editorContainer = containerRef.current.appendChild(
      containerRef.current.ownerDocument.createElement('div')
    );

    const quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });

    quillRef.current = quill;

    // Override image handler — upload ke server, bukan base64
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
          alert('Ukuran gambar maksimal 5MB');
          return;
        }
        try {
          const fd = new FormData();
          fd.append('image', file);
          const res = await fetch(`${FORM_API_URL}/form/soal/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: fd,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.message || 'Gagal upload gambar');
          const url = `${FORM_API_URL}${data.url}`;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url, 'user');
          quill.setSelection(range.index + 1, 0);
        } catch (e) {
          alert(e.message || 'Gagal upload gambar. Coba lagi.');
        }
      };
    });

    // Capture paste listener to preserve raw code and HTML document tags cleanly
    const handlePaste = (e) => {
      const text = e.clipboardData?.getData('text/plain');
      // If pasting text that contains full HTML document tags or code that Quill's DOM parser would strip
      if (text && /<(!doctype|html|head|meta|link|script|style|body|header|footer|nav)[\s>/]/i.test(text)) {
        e.preventDefault();
        e.stopPropagation();
        const selection = quill.getSelection(true);
        const idx = selection ? selection.index : quill.getLength();
        quill.insertText(idx, text, 'user');
        quill.setSelection(idx + text.length, 0);
      }
    };
    editorContainer.addEventListener('paste', handlePaste, true);

    if (value) {
      try {
        quill.clipboard.dangerouslyPasteHTML(value);
      } catch {
        quill.setText(value);
      }
    }

    quill.on('text-change', (delta, oldDelta, source) => {
      if (isUpdatingRef.current) return;
      if (source === 'user') {
        const html = quill.root.innerHTML;
        const isEmpty = html === '<p><br></p>' || html === '<p></p>' || html.trim() === '';
        onChange(isEmpty ? '' : html);
      }
    });

    return () => {
      editorContainer.removeEventListener('paste', handlePaste, true);
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current;
    if (quill.hasFocus()) return;

    const currentHtml = quill.root.innerHTML;
    const normValue   = value || '';
    const normCurrent = (currentHtml === '<p><br></p>' || currentHtml === '<p></p>') ? '' : currentHtml;

    if (normValue !== normCurrent) {
      isUpdatingRef.current = true;
      if (normValue) {
        try {
          quill.clipboard.dangerouslyPasteHTML(normValue);
        } catch {
          quill.setText(normValue);
        }
      } else {
        quill.setText('');
      }
      isUpdatingRef.current = false;
    }
  }, [value]);

  // Insert teks ke posisi kursor Quill
  function insertAtCursor(text) {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    const idx   = range ? range.index : quill.getLength();
    // Insert sebagai teks biasa agar LaTeX/code tidak di-escape
    quill.insertText(idx, text, 'user');
    quill.setSelection(idx + text.length, 0);
  }

  return (
    <>
      <div className="quill-wrapper rounded-xl border border-gray-200 bg-white hover:border-[#1a4fa0] focus-within:border-[#1a4fa0] focus-within:ring-2 focus-within:ring-[#1a4fa0]/15 transition-all">
        <div ref={containerRef} />

        {/* ── Tombol ekstra: LaTeX & Code ─────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowLatex(true); }}
            title="Insert rumus matematika (LaTeX)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#d4e5fa] text-[#1a4fa0] bg-white hover:bg-[#eef5fb] transition">
            <span className="text-[14px] font-serif">∑</span> Rumus LaTeX
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowCode(true); }}
            title="Insert code block"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#d4e5fa] text-[#1a4fa0] bg-white hover:bg-[#eef5fb] transition">
            <span className="font-mono text-[13px]">&lt;/&gt;</span> Code Block
          </button>
          <span className="ml-auto text-[11px] text-gray-400">
            LaTeX: <code className="text-[10px]">$x^2$</code> &nbsp;|&nbsp; Code: <code className="text-[10px]">```js</code>
          </span>
        </div>
      </div>

      {showLatex && (
        <LatexModal
          onInsert={insertAtCursor}
          onClose={() => setShowLatex(false)}
        />
      )}
      {showCode && (
        <CodeModal
          onInsert={insertAtCursor}
          onClose={() => setShowCode(false)}
        />
      )}
    </>
  );
}
