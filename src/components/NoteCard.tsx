import { useEffect, useRef } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { AppIcon } from './Icons';

interface Props {
  title: string;
  note: string;
  onClose: () => void;
}

export default function NoteCard({ title, note, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (trigger && document.body.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [onClose]);

  const displayTitle = title.trim() || 'No title';

  return (
    <div
      className="dialog-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-panel note-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-card-title"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Session note</p>
            <h2 id="note-card-title">{displayTitle}</h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            aria-label="Close note"
            title="Close"
            onClick={onClose}
          >
            <AppIcon name="close" size={19} />
          </button>
        </div>
        <div className="note-card-body">
          <MarkdownPreview markdown={note} />
        </div>
      </section>
    </div>
  );
}
