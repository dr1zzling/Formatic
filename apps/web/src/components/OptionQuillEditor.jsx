import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Toolbar minimal untuk opsi jawaban
const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline'],
  [{ color: [] }],
  ['clean'],
];

export default function OptionQuillEditor({ value, onChange, placeholder = 'Tulis opsi...' }) {
  const containerRef  = useRef(null);
  const quillRef      = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
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

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
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
  }, []);

  // Sync value dari luar kalau berubah (mis. reset)
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current;
    if (quill.hasFocus()) return;

    const currentHtml = quill.root.innerHTML;
    const normValue   = value || '';
    const normCurrent =
      currentHtml === '<p><br></p>' || currentHtml === '<p></p>'
        ? ''
        : currentHtml;

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

  return (
    <div className="option-quill-wrapper flex-1 min-w-0 rounded-lg border border-gray-200 overflow-hidden bg-white hover:border-[#1a4fa0] focus-within:border-[#1a4fa0] focus-within:ring-2 focus-within:ring-[#1a4fa0]/15 transition-all">
      <div ref={containerRef} />
    </div>
  );
}
