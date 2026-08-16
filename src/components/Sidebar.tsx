import { useCallback, useEffect, useRef, useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { listSemesters, createSemester, updateSemester, deleteSemester } from '../db';
import { persistSemester, shouldHandleSemesterEditRequest } from '../lib/semester';
import type { ThemeId } from '../lib/theme';
import SemesterForm from './SemesterForm';
import { AppIcon } from './Icons';
import SettingsDialog from './SettingsDialog';

interface Props {
  selected: Semester | null;
  onSelect: (semester: Semester | null) => void;
  createRequest?: number;
  editRequest?: number;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export default function Sidebar({
  selected,
  onSelect,
  createRequest = 0,
  editRequest = 0,
  theme,
  onThemeChange,
}: Props) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const handledEditRequestRef = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await listSemesters();
      setSemesters(data);
      const current = data.find((semester) => semester.id === selected?.id);
      onSelect(current ?? data[0] ?? null);
      return data;
    } catch (error) {
      console.error('Failed to refresh semesters:', error);
      setLoadError('Could not load semesters.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [onSelect, selected?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (createRequest > 0) {
      setFormError('');
      setEditingSemester(null);
      setShowForm(true);
    }
  }, [createRequest]);

  useEffect(() => {
    if (!shouldHandleSemesterEditRequest(
      editRequest,
      handledEditRequestRef.current,
      Boolean(selected)
    )) return;

    handledEditRequestRef.current = editRequest;
    setFormError('');
    setEditingSemester(selected);
    setShowForm(true);
  }, [editRequest, selected]);

  const returnFocus = (target: 'create' | 'edit' | 'settings' = 'create') => {
    window.setTimeout(() => {
      if (target === 'edit') {
        document.getElementById('edit-semester-button')?.focus();
        return;
      }
      if (target === 'settings') {
        settingsButtonRef.current?.focus();
        return;
      }
      addButtonRef.current?.focus();
    }, 0);
  };

  const closeSettings = () => {
    setShowSettings(false);
    returnFocus('settings');
  };

  const closeForm = () => {
    if (saving) return;
    const focusTarget = editingSemester ? 'edit' : 'create';
    setShowForm(false);
    setEditingSemester(null);
    setFormError('');
    returnFocus(focusTarget);
  };

  useEffect(() => {
    if (!showForm && !deleteTarget && !showSettings) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        // Popovers opened from inside the dialog are portalled to document.body,
        // so they are neither descendants of the panel nor adjacent to it in DOM
        // order. Trap the dialog's controls and any open popover's as one ordered
        // list, so focus cannot leak out through the seam between the two.
        // `[tabindex="-1"]` is excluded because the calendar grid roves a single
        // tabbable day across 42 buttons.
        const selector =
          'button:not([disabled]):not([tabindex="-1"]),' +
          'input:not([disabled]):not([tabindex="-1"]),' +
          'select:not([disabled]):not([tabindex="-1"]),' +
          'textarea:not([disabled]):not([tabindex="-1"])';
        const collect = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>(selector));
        const panel = document.querySelector<HTMLElement>('.dialog-panel');
        const focusable = [
          ...(panel ? collect(panel) : []),
          ...Array.from(document.querySelectorAll<HTMLElement>('[data-popover-root]')).flatMap(collect),
        ];
        if (focusable.length === 0) return;
        const index = focusable.indexOf(document.activeElement as HTMLElement);
        if (index === -1) return;
        // Same wrap-around as before — past the last lands on the first and before
        // the first lands on the last — applied to the combined list.
        event.preventDefault();
        const step = event.shiftKey ? -1 : 1;
        focusable[(index + step + focusable.length) % focusable.length].focus();
        return;
      }
      if (event.key === 'Escape') {
        if (showForm) closeForm();
        if (showSettings) closeSettings();
        if (deleteTarget && !deleting) {
          setDeleteTarget(null);
          returnFocus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, deleting, showForm, showSettings, saving]);

  const handleSave = async (input: SemesterInput) => {
    setSaving(true);
    setFormError('');
    const editedId = editingSemester?.id ?? null;
    try {
      await persistSemester(editedId, input, {
        create: createSemester,
        update: updateSemester,
      });
      const data = await listSemesters();
      setSemesters(data);
      const savedSemester = editedId === null
        ? data[0]
        : data.find((semester) => semester.id === editedId);
      onSelect(savedSemester ?? null);
      setShowForm(false);
      setEditingSemester(null);
      returnFocus(editedId === null ? 'create' : 'edit');
    } catch (error) {
      console.error(`Failed to ${editedId === null ? 'create' : 'update'} semester:`, error);
      setFormError(
        editedId === null
          ? 'Could not create the semester. Check the fields and try again.'
          : 'Could not update the semester. Check the fields and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setLoadError('');
    try {
      await deleteSemester(deleteTarget.id);
      const data = await listSemesters();
      setSemesters(data);
      if (selected?.id === deleteTarget.id) {
        onSelect(data[0] ?? null);
      }
      setDeleteTarget(null);
      returnFocus();
    } catch (error) {
      console.error('Failed to delete semester:', error);
      setLoadError('Could not delete this semester. Try again.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <aside className="sidebar" aria-label="Semester navigation">
      <div className="brand">
        <span className="brand-mark"><AppIcon name="flask" size={21} /></span>
        <div className="brand-copy">
          <p className="brand-title">Thesis Counter</p>
          <p className="brand-subtitle">Research Studio</p>
        </div>
        <button
          ref={settingsButtonRef}
          className="icon-button icon-button-quiet"
          type="button"
          aria-label="Open settings"
          title="Settings"
          aria-haspopup="dialog"
          onClick={() => setShowSettings(true)}
        >
          <AppIcon name="settings" size={17} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <p className="sidebar-label">Semesters</p>
          {!loading && <span className="count-pill">{semesters.length}</span>}
        </div>

        {loadError && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{loadError}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-stack" aria-label="Loading semesters">
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : (
          <ul className="semester-list">
            {semesters.map((semester) => (
              <li
                key={semester.id}
                className={`semester-item ${selected?.id === semester.id ? 'selected' : ''}`}
              >
                <button
                  className="semester-select"
                  type="button"
                  aria-current={selected?.id === semester.id ? 'page' : undefined}
                  onClick={() => onSelect(semester)}
                >
                  <span className="semester-name">{semester.name}</span>
                  <span className="semester-meta">{semester.credits} credits · {semester.credits * 3}h/week</span>
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Delete ${semester.name}`}
                  title={`Delete ${semester.name}`}
                  onClick={() => setDeleteTarget(semester)}
                >
                  <AppIcon name="trash" size={17} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          ref={addButtonRef}
          className="button button-accent button-block"
          type="button"
          onClick={() => {
            setFormError('');
            setEditingSemester(null);
            setShowForm(true);
          }}
        >
          <AppIcon name="plus" />
          New semester
        </button>
      </div>

      {showSettings && (
        <SettingsDialog
          theme={theme}
          onThemeChange={onThemeChange}
          onClose={closeSettings}
        />
      )}

      {showForm && (
        <div
          className="dialog-scrim"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="semester-dialog-title"
          >
            <SemesterForm
              semester={editingSemester}
              onSave={handleSave}
              onCancel={closeForm}
              isSaving={saving}
              error={formError}
            />
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="dialog-scrim" role="presentation">
          <section
            className="dialog-panel dialog-small"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-semester-title"
            aria-describedby="delete-semester-copy"
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Delete semester</p>
                <h2 id="delete-semester-title">Remove {deleteTarget.name}?</h2>
              </div>
            </div>
            <p id="delete-semester-copy" className="confirm-copy">
              This removes the semester and its saved sessions. This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                type="button"
                autoFocus
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null);
                  returnFocus();
                }}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                type="button"
                disabled={deleting}
                onClick={handleDelete}
              >
                <AppIcon name="trash" size={17} />
                {deleting ? 'Deleting…' : 'Delete semester'}
              </button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
