import React from 'react';
import 'quill/dist/quill.snow.css';

export default function RichTextDisplay({ content, className = '' }) {
  if (!content) return null;

  // Check if string contains HTML tags
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return <span className={className}>{content}</span>;
  }

  return (
    <div className="ql-snow inline-block max-w-full">
      <div
        className={`ql-editor !p-0 !min-h-0 !h-auto text-inherit leading-relaxed border-none max-w-full ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
