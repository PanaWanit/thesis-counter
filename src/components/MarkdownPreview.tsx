import { useMemo } from 'react';
import { renderMarkdown } from '../lib/markdown';

interface Props {
  markdown: string;
}

export default function MarkdownPreview({ markdown }: Props) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  if (!markdown.trim()) {
    return (
      <div className="markdown-preview markdown-preview-empty" aria-live="polite">
        <p className="helper-text">Preview will appear here.</p>
      </div>
    );
  }

  return (
    <div
      className="markdown-preview markdown-body"
      aria-live="polite"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
