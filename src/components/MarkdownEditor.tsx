import { useEffect, useRef, useState } from 'react';
import MarkdownPreview from './MarkdownPreview';

interface Props {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
}

type Action = 'bold' | 'italic' | 'heading' | 'list' | 'link' | 'code';

interface ToolButton {
  action: Action;
  label: string;
  title: string;
}

const TOOLS: ToolButton[] = [
  { action: 'bold', label: 'B', title: 'Bold (Cmd/Ctrl+B)' },
  { action: 'italic', label: 'I', title: 'Italic (Cmd/Ctrl+I)' },
  { action: 'heading', label: 'H', title: 'Heading' },
  { action: 'list', label: '•', title: 'Bullet list' },
  { action: 'link', label: 'Link', title: 'Link (Cmd/Ctrl+K)' },
  { action: 'code', label: '</>', title: 'Inline code' },
];

// Returns the next text plus where the selection should land afterwards.
function applyAction(
  action: Action,
  text: string,
  start: number,
  end: number
): { text: string; start: number; end: number } {
  const selected = text.slice(start, end);

  const wrap = (marker: string) => ({
    text: `${text.slice(0, start)}${marker}${selected}${marker}${text.slice(end)}`,
    start: start + marker.length,
    end: end + marker.length,
  });

  const prefixLines = (marker: string) => {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const block = text.slice(lineStart, end);
    const lines = block.split('\n');
    const firstAlreadyPrefixed = lines[0].startsWith(marker);
    const prefixed = lines
      .map((line) => (line.startsWith(marker) ? line : `${marker}${line}`))
      .join('\n');
    return {
      text: `${text.slice(0, lineStart)}${prefixed}${text.slice(end)}`,
      start: firstAlreadyPrefixed ? start : start + marker.length,
      end: end + (prefixed.length - block.length),
    };
  };

  switch (action) {
    case 'bold':
      return wrap('**');
    case 'italic':
      return wrap('*');
    case 'code':
      return wrap('`');
    case 'heading':
      return prefixLines('## ');
    case 'list':
      return prefixLines('- ');
    case 'link': {
      const label = selected || 'text';
      const next = `${text.slice(0, start)}[${label}](url)${text.slice(end)}`;
      const urlStart = start + label.length + 3;
      return { text: next, start: urlStart, end: urlStart + 3 };
    }
  }
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = 'What did you move forward?',
  minRows = 4,
}: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const panelId = `${id}-panel`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number; value: string } | null>(null);

  // Grow with content up to a cap, then scroll.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node || tab !== 'write') return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
  }, [value, tab]);

  useEffect(() => {
    const selection = pendingSelection.current;
    const node = textareaRef.current;
    if (!selection || !node) return;
    if (selection.value !== value) {
      pendingSelection.current = null;
      return;
    }
    pendingSelection.current = null;
    node.focus();
    node.setSelectionRange(selection.start, selection.end);
  }, [value]);

  const run = (action: Action) => {
    const node = textareaRef.current;
    if (!node) return;
    const next = applyAction(action, value, node.selectionStart, node.selectionEnd);
    pendingSelection.current = { start: next.start, end: next.end, value: next.text };
    onChange(next.text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.metaKey && !event.ctrlKey) return;
    const shortcuts: Record<string, Action> = { b: 'bold', i: 'italic', k: 'link' };
    const action = shortcuts[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    run(action);
  };

  return (
    <div className="md-editor">
      <div className="md-editor-bar">
        <div className="md-editor-tabs" role="tablist" aria-label="Editor mode">
          <button
            className="md-editor-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'write'}
            aria-controls={panelId}
            data-active={tab === 'write'}
            onClick={() => setTab('write')}
          >
            Write
          </button>
          <button
            className="md-editor-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            aria-controls={panelId}
            data-active={tab === 'preview'}
            onClick={() => setTab('preview')}
          >
            Preview
          </button>
        </div>

        <div className="md-editor-tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.action}
              className="md-editor-tool"
              type="button"
              title={tool.title}
              aria-label={tool.title}
              disabled={tab !== 'write'}
              onClick={() => run(tool.action)}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md-editor-panel" role="tabpanel" id={panelId} aria-label="Note content">
        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            id={id}
            className="control md-editor-input"
            rows={minRows}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className="md-editor-preview">
            <MarkdownPreview markdown={value} />
          </div>
        )}
      </div>
    </div>
  );
}
