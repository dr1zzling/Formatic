import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { LatexModal } from './QuillEditor';
import { OPTION_LATEX_SYMBOLS } from '../utils/latexSymbols';
import RichTextDisplay from './RichTextDisplay';

// Toolbar minimal untuk opsi jawaban
const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  ['clean'],
];

function isEmptyHtml(html) {
  if (!html) return true;
  const t = html.replace(/<[^>]*>/g, '').trim();
  return t === '';
}

export default function OptionQuillEditor({ value, onChange, placeholder = 'Tulis opsi...' }) {
  const containerRef  = useRef(null);
  const wrapperRef    = useRef(null);
  const quillRef      = useRef(null);
  const isUpdatingRef = useRef(false);
  const isComposingRef = useRef(false);
  const [showLatex, setShowLatex] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // kalau value kosong → auto edit mode (biar langsung bisa ketik)
  useEffect(() => {
    if (isEmptyHtml(value)) setIsEditing(true);
  }, [value]);

  // click outside / Esc untuk tutup editor (kecuali masih kosong → tetap edit)
  useEffect(() => {
    if (!isEditing) return;
    function onDown(e) {
      if (showLatex) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        if (!isEmptyHtml(value)) setIsEditing(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape' && !isEmptyHtml(value)) setIsEditing(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isEditing, value, showLatex]);

  useEffect(() => {
    if (!isEditing) return;
    if (!containerRef.current) return;
    if (quillRef.current) return;

    const editorEl = containerRef.current.appendChild(
      document.createElement('div')
    );

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    quillRef.current = quill;

    // Auto-focus setelah Quill ready
    requestAnimationFrame(() => {
      quill.focus();
    });

    const handlePaste = (e) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text && /<(!doctype|html|head|meta|link|script|style|body|header|footer|nav)[\s>/]/i.test(text)) {
        e.preventDefault();
        e.stopPropagation();
        const selection = quill.getSelection(true);
        const idx = selection ? selection.index : quill.getLength();
        quill.insertText(idx, text, 'user');
        quill.setSelection(idx + text.length, 0);
      }
    };
    editorEl.addEventListener('paste', handlePaste, true);

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
        const isEmpty =
          html === '<p><br></p>' || html === '<p></p>' || html.trim() === '';
        onChange(isEmpty ? '' : html);
      }
    });

    // Track composition events for IME input
    quill.root.addEventListener('compositionstart', () => { isComposingRef.current = true; });
    quill.root.addEventListener('compositionend', () => { isComposingRef.current = false; });

    return () => {
      editorEl.removeEventListener('paste', handlePaste, true);
    };
  }, [isEditing]);

  // Sync value dari luar kalau berubah (mis. reset) — hanya saat editing
  useEffect(() => {
    if (!isEditing) return;
    if (!quillRef.current) return;
    const quill = quillRef.current;
    // Skip sync if focused OR composing (IME input)
    if (quill.hasFocus() || isComposingRef.current) return;

    const currentHtml = quill.root.innerHTML;
    const normValue   = value || '';
    const normCurrent =
      currentHtml === '<p><br></p>' || currentHtml === '<p></p>'
        ? ''
        : currentHtml;

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
  }, [value, isEditing]);

  function insertAtCursor(text) {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection(true);
    const idx   = range ? range.index : quill.getLength();
    quill.insertText(idx, text, 'user');
    quill.setSelection(idx + text.length, 0);
  }

  // reset quill instance saat keluar edit mode biar mount ulang fresh
  useEffect(() => {
    if (!isEditing) {
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    }
  }, [isEditing]);

if (!isEditing) {
    return (
      <>
        <div
          ref={wrapperRef}
          onClick={() => setIsEditing(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true); }}
          role="button"
          tabIndex={0}
          title="Klik untuk edit opsi"
          className="flex-1 min-w-0 rounded-lg border px-3 py-2 cursor-text transition-all min-h-[42px] flex items-center hover:border-[#1a4fa0] group/preview"
          style={{ borderColor: 'var(--fm-border, #e5eef7)', backgroundColor: 'transparent' }}
        >
          {isEmptyHtml(value) ? (
            <span className="text-[13px] italic" style={{ color: 'var(--fm-text-3, #8aaac8)' }}>{placeholder}</span>
          ) : (
            <RichTextDisplay content={value} className="text-[14px] leading-snug flex-1 min-w-0" />
          )}
          <span className="ml-2 text-[10px] font-medium opacity-0 group-hover/preview:opacity-60 transition-opacity shrink-0" style={{ color: 'var(--fm-text-3)' }}>✎ edit</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div ref={wrapperRef} className="option-quill-wrapper flex-1 min-w-0 rounded-lg border border-gray-200 bg-white hover:border-[#1a4fa0] focus-within:border-[#1a4fa0] focus-within:ring-2 focus-within:ring-[#1a4fa0]/15 transition-all flex flex-col relative animate-fadeIn duration-200 ease-out">
        <div ref={containerRef} className="flex-1 option-quill-container" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowLatex(true); }}
          title="Insert rumus matematika"
          className="option-rumus-btn absolute top-[5px] right-[6px] z-[1] inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer"
          style={{ color: '#1a4fa0', backgroundColor: '#fff', borderColor: '#d4e5fa' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef5fb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
        >
          <span className="font-serif text-[13px] leading-none font-bold">∑</span>
          <span>Rumus</span>
        </button>
      </div>

      {showLatex && (
        <LatexModal
          symbols={OPTION_LATEX_SYMBOLS}
          onInsert={insertAtCursor}
          onClose={() => setShowLatex(false)}
        />
      )}
    </>
  );
}
