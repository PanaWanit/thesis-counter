import { useEffect, useRef, useState } from 'react';
import type { Session } from '../types';
import MarkdownPreview from './MarkdownPreview';
import MarkdownEditor from './MarkdownEditor';
import { AppIcon } from './Icons';

interface Props {
  session: Session;
  onClose: () => void;
  onSave: (id: number, title: string, note: string) => void | Promise<void>;
}

export default function NoteCard({ session, onClose, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [editNote, setEditNote] = useState(session.note);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isEditing) {
          setIsEditing(false);
          setEditTitle(session.title);
          setEditNote(session.note);
          setSaveError('');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (trigger && document.body.contains(trigger) && !isEditing) {
        trigger.focus();
      }
    };
  }, [onClose, isEditing, session.title, session.note]);

  useEffect(() => {
    if (isEditing) {
      titleRef.current?.focus();
    } else {
      editRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await onSave(session.id, editTitle.trim(), editNote.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      setSaveError('Could not save the note. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(session.title);
    setEditNote(session.note);
    setSaveError('');
  };

  const displayTitle = session.title.trim() || 'No title';

  return (
    <div
      className="dialog-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (!isEditing && event.target === event.currentTarget) onClose();
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
          {isEditing ? (
            <div className="note-edit-form">
              <div className="field">
                <label htmlFor="note-edit-title">Title</label>
                <input
                  ref={titleRef}
                  id="note-edit-title"
                  className="control"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Short name for this session"
                />
              </div>
              <div className="field">
                <label htmlFor="note-edit-description">Description <span className="helper-text">(markdown supported)</span></label>
                <MarkdownEditor id="note-edit-description" value={editNote} onChange={setEditNote} />
              </div>
            </div>
          ) : (
            <MarkdownPreview markdown={session.note} />
          )}
        </div>

        {saveError && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{saveError}</span>
          </div>
        )}

        <div className="note-card-actions">
          {isEditing ? (
            <>
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                type="button"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </>
          ) : (
            <>
              <button
                ref={editRef}
                className="button button-secondary"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                <AppIcon name="edit" size={17} />
                Edit note
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={onClose}
              >
                Done
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
