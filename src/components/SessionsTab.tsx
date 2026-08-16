import { useCallback, useEffect, useState } from 'react';
import type { Category, Session, Semester, SessionInput } from '../types';
import { listSessions, createSession, deleteSession, updateSessionNote, listCategories } from '../db';
import { formatDateInput } from '../lib/date';
import {
  addMinutes,
  diffMinutes,
  formatDuration,
  formatTimeRange,
  validateManualEntry,
} from '../lib/time';
import { AppIcon } from './Icons';
import NoteCard from './NoteCard';
import MarkdownEditor from './MarkdownEditor';
import DateField from './DateField';
import TimeField from './TimeField';
import DurationField from './DurationField';
import Segmented from './Segmented';

interface Props {
  semester: Semester;
}

function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatSessionTime(value: string) {
  return new Date(value).toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionsTab({ semester }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [start, setStart] = useState('09:00');
  const [mode, setMode] = useState<'end' | 'duration'>('end');
  const [end, setEnd] = useState('10:00');
  const [minutes, setMinutes] = useState(60);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [viewingNote, setViewingNote] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // The active mode owns the truth; the other value is derived for display.
  const effectiveEnd = mode === 'end' ? end : addMinutes(start, minutes);

  const refresh = useCallback(async () => {
    const data = await listSessions(semester.id);
    setSessions(data);
  }, [semester.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [sessionData, categoryData] = await Promise.all([
          listSessions(semester.id),
          listCategories(),
        ]);
        setSessions(sessionData);
        setCategories(categoryData);
        setCategoryId((current) => current === '' ? categoryData[0]?.id ?? '' : current);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        setLoadError('Could not load session history.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [semester.id]);

  const handleModeChange = (next: string) => {
    if (next === 'duration') {
      setMinutes(Math.max(0, diffMinutes(start, end)));
      setMode('duration');
    } else {
      setEnd(addMinutes(start, minutes));
      setMode('end');
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const message = validateManualEntry(mode, start, end, minutes);
    if (message) {
      setFormError(message);
      return;
    }
    if (categoryId === '') {
      setFormError('Choose a category before adding the session.');
      return;
    }

    const started = new Date(`${date}T${start}:00`);
    const ended = new Date(`${date}T${effectiveEnd}:00`);

    const input: SessionInput = {
      semester_id: semester.id,
      category_id: categoryId,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      title: title.trim(),
      note: note.trim(),
      manual: 1,
    };

    setSaving(true);
    try {
      await createSession(input);
      setTitle('');
      setNote('');
      await refresh();
    } catch (error) {
      console.error('Failed to add session:', error);
      setFormError('Could not add this session. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteSession(id);
      setPendingDelete(null);
      await refresh();
    } catch (error) {
      console.error('Failed to delete session:', error);
      setDeleteError('Could not delete the session. It is still in your history.');
    } finally {
      setDeleting(false);
    }
  };

  const categoryFor = (id: number) => categories.find((category) => category.id === id);

  return (
    <section aria-labelledby="sessions-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Research record</p>
          <h2 id="sessions-title">Sessions</h2>
          <p className="supporting-copy">Log past work and review where your research time went.</p>
        </div>
        <span className="count-pill">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
      </div>

      <section className="panel" aria-labelledby="manual-entry-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Manual entry</p>
            <h3 id="manual-entry-title">Log a session</h3>
          </div>
          <AppIcon name="plus" size={21} />
        </div>

        <form className="entry-form" onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="session-date">Date</label>
            <DateField
              id="session-date"
              value={{ mode: 'single', date }}
              onChange={(next) => {
                if (next.mode === 'single') setDate(next.date);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="session-start">Start</label>
            <TimeField id="session-start" value={start} onChange={setStart} />
          </div>

          <div className="field">
            <label htmlFor={mode === 'end' ? 'session-end' : 'session-duration'}>
              {mode === 'end' ? 'End' : 'Duration'}
            </label>
            {mode === 'end' ? (
              <TimeField id="session-end" value={end} onChange={setEnd} />
            ) : (
              <DurationField id="session-duration" value={minutes} onChange={setMinutes} />
            )}
          </div>

          <div className="field field-mode">
            <span className="field-label">Enter as</span>
            <Segmented
              id="session-mode"
              label="Session length entry mode"
              value={mode}
              onChange={handleModeChange}
              options={[
                { value: 'end', label: 'End time' },
                { value: 'duration', label: 'Duration' },
              ]}
            />
          </div>

          {/*
            In duration mode the entered minutes are the truth. Deriving the span
            from the two clock times would read 0m whenever the duration crosses
            midnight, because `diffMinutes` goes negative there.
          */}
          <p className="entry-summary">
            {mode === 'end'
              ? formatTimeRange(start, end)
              : `${start} - ${effectiveEnd} · ${formatDuration(minutes)}`}
          </p>

          <div className="field">
            <label htmlFor="session-category">Category</label>
            <select
              id="session-category"
              className="control"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value === '' ? '' : Number(event.target.value))}
              required
            >
              <option value="">Choose category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="field field-title">
            <label htmlFor="session-title">Title <span className="helper-text">(optional)</span></label>
            <input
              id="session-title"
              className="control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short name for this session"
            />
          </div>
          <div className="field field-description">
            <label htmlFor="session-description">Description <span className="helper-text">(markdown supported)</span></label>
            <MarkdownEditor id="session-description" value={note} onChange={setNote} />
          </div>
          <button className="button button-primary form-submit" type="submit" disabled={saving || categories.length === 0}>
            <AppIcon name="plus" size={18} />
            {saving ? 'Adding…' : 'Add session'}
          </button>
        </form>

        {formError && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{formError}</span>
          </div>
        )}
      </section>

      <section className="panel history-panel" aria-labelledby="history-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3 id="history-title">Session history</h3>
          </div>
        </div>

        {loadError && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{loadError}</span>
          </div>
        )}
        {deleteError && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{deleteError}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-stack" aria-label="Loading session history">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state compact">
            <span className="empty-icon"><AppIcon name="sessions" size={25} /></span>
            <h3>No sessions yet</h3>
            <p>Start a focus timer or use the form above to create your first research record.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '19%' }} />
                <col />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr><th>Date</th><th>Duration</th><th>Category</th><th>Note</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const category = categoryFor(session.category_id);
                  return (
                    <tr key={session.id}>
                      <td className="date-cell" data-label="Date">
                        {formatSessionDate(session.started_at)}
                        <span className="semester-meta">{formatSessionTime(session.started_at)} – {formatSessionTime(session.ended_at)}</span>
                      </td>
                      <td className="numeric" data-label="Duration">{(session.duration_minutes / 60).toFixed(2)}h</td>
                      <td data-label="Category">
                        <span className="category-label">
                          <span className="category-dot" style={{ '--category-color': category?.color ?? 'var(--accent)' } as React.CSSProperties} />
                          {category?.name ?? `Category ${session.category_id}`}
                        </span>
                      </td>
                      <td className="note-cell" data-label="Note">
                        <button
                          className="note-cell-button"
                          type="button"
                          onClick={() => setViewingNote(session)}
                        >
                          <span className="note-cell-title">{session.title.trim() || 'No title'}</span>
                          {session.note ? (
                            <span className="note-cell-hint">View note</span>
                          ) : (
                            <span className="helper-text">No description</span>
                          )}
                        </button>
                        {session.manual === 1 && <span className="manual-badge">Manual</span>}
                      </td>
                      <td data-label="Actions">
                        {pendingDelete === session.id ? (
                          <div className="inline-confirm">
                            <span>Delete?</span>
                            <button className="button button-secondary button-small" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancel</button>
                            <button className="button button-danger button-small" type="button" disabled={deleting} onClick={() => handleDelete(session.id)}>{deleting ? 'Deleting…' : 'Delete'}</button>
                          </div>
                        ) : (
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Delete session from ${formatSessionDate(session.started_at)}`}
                            title="Delete session"
                            onClick={() => {
                              setDeleteError('');
                              setPendingDelete(session.id);
                            }}
                          >
                            <AppIcon name="trash" size={17} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {viewingNote && (
          <NoteCard
            session={viewingNote}
            onClose={() => setViewingNote(null)}
            onSave={async (id, title, note) => {
              await updateSessionNote(id, title, note);
              await refresh();
            }}
          />
        )}
      </section>
    </section>
  );
}
