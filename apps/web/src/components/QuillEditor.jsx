import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image', 'clean'],
];

export default function QuillEditor({ value, onChange, placeholder = 'Tulis pertanyaan di sini...' }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!quillRef.current) {
      const editorContainer = containerRef.current.appendChild(
        containerRef.current.ownerDocument.createElement('div')
      );

      const quill = new Quill(editorContainer, {
        theme: 'snow',
        placeholder: placeholder,
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
    }
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current;

    // Do not reset content if the user is currently editing (has focus)
    if (quill.hasFocus()) return;

    const currentHtml = quill.root.innerHTML;
    const normValue = value || '';
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

  return (
    <div className="quill-wrapper rounded-xl border border-gray-200 overflow-hidden bg-white hover:border-[#1a4fa0] focus-within:border-[#1a4fa0] focus-within:ring-2 focus-within:ring-[#1a4fa0]/15 transition-all">
      <div ref={containerRef} />
    </div>
  );
}
