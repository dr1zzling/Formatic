import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
function LatexModal({ onInsert, onClose }) {
  const [latex, setLatex] = useState('');
  const [mode, setMode]   = useState('inline'); // 'inline' | 'display'
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleInsert() {
    const trimmed = latex.trim();
    if (!trimmed) return;
    const wrapped = mode === 'display' ? `$$${trimmed}$$` : `$${trimmed}$`;
    onInsert(wrapped);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-[#102f56] text-[16px] mb-4 flex items-center gap-2">
          <span>∑</span> Insert Rumus LaTeX
        </h3>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode('inline')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition ${
              mode === 'inline' ? 'border-[#1a4fa0] bg-[#eef5fb] text-[#1a4fa0]' : 'border-gray-200 text-gray-500'
            }`}>
            Inline <code className="ml-1 text-[11px]">$...$</code>
          </button>
          <button
            onClick={() => setMode('display')}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition ${
              mode === 'display' ? 'border-[#1a4fa0] bg-[#eef5fb] text-[#1a4fa0]' : 'border-gray-200 text-gray-500'
            }`}>
            Baris sendiri <code className="ml-1 text-[11px]">$$...$$</code>
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={latex}
          onChange={e => setLatex(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleInsert(); }}
          placeholder={'Contoh: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}'}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-mono outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/15 resize-none mb-3"
        />

        {/* Preview */}
        {latex.trim() && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center overflow-x-auto">
            <LatexPreview latex={latex} display={mode === 'display'} />
          </div>
        )}

        <div className="text-[11px] text-gray-400 mb-4 space-y-0.5">
          <p>Tips: <code>x^2</code> → x², <code>\sqrt{"{x}"}</code> → √x, <code>\frac{"{a}"}{"{"+"b}"}</code> → a/b</p>
          <p><kbd className="px-1 border rounded text-[10px]">Ctrl+Enter</kbd> untuk insert</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleInsert} disabled={!latex.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40 transition"
            style={{ backgroundColor: '#1a4fa0' }}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
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

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', (delta, oldDelta, source) => {
      if (isUpdatingRef.current) return;
      if (source === 'user') {
        const html = quill.root.innerHTML;
        const isEmpty = html === '<p><br></p>' || html === '<p></p>' || html.trim() === '';
        onChange(isEmpty ? '' : html);
      }
    });
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
        quill.clipboard.dangerouslyPasteHTML(normValue);
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
      <div className="quill-wrapper rounded-xl border border-gray-200 overflow-hidden bg-white hover:border-[#1a4fa0] focus-within:border-[#1a4fa0] focus-within:ring-2 focus-within:ring-[#1a4fa0]/15 transition-all">
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
