import { useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { formatDateInput } from '../lib/date';
import { AppIcon } from './Icons';

interface Props {
  semester?: Semester | null;
  onSave: (input: SemesterInput) => void | Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string;
}

export default function SemesterForm({
  semester,
  onSave,
  onCancel,
  isSaving = false,
  error = '',
}: Props) {
  const [name, setName] = useState(semester?.name ?? '');
  const [startDate, setStartDate] = useState(semester?.start_date ?? formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(semester?.end_date ?? formatDateInput(new Date()));
  const [credits, setCredits] = useState(semester?.credits ?? 6);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (endDate < startDate) {
      setValidationError('End date must be on or after the start date.');
      return;
    }
    setValidationError('');
    void onSave({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      credits: Math.max(1, Number(credits) || 1),
    });
  };

  return (
    <>
      <div className="dialog-header">
        <div>
          <p className="eyebrow">Semester setup</p>
          <h2 id="semester-dialog-title">Create a semester</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Close semester form"
          title="Close"
          disabled={isSaving}
          onClick={onCancel}
        >
          <AppIcon name="close" size={19} />
        </button>
      </div>

      <form className="dialog-form" onSubmit={handleSubmit}>
        <div className="field field-full">
          <label htmlFor="semester-name">Semester name</label>
          <input
            id="semester-name"
            className="control"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Semester 1/2026"
            autoFocus
            required
          />
        </div>

        <div className="field">
          <label htmlFor="semester-start">Start date</label>
          <input
            id="semester-start"
            className="control"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="semester-end">End date</label>
          <input
            id="semester-end"
            className="control"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
        </div>

        <div className="field field-full">
          <label htmlFor="semester-credits">Registered credits</label>
          <input
            id="semester-credits"
            className="control"
            type="number"
            min={1}
            value={credits}
            onChange={(event) => setCredits(Math.max(1, Number(event.target.value) || 1))}
            aria-describedby="credits-help"
            required
          />
          <p id="credits-help" className="helper-text">
            1 credit = 3 required research hours per week.
          </p>
        </div>

        {(validationError || error) && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        <div className="dialog-actions">
          <button className="button button-secondary" type="button" disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={isSaving}>
            <AppIcon name="check" size={18} />
            {isSaving ? 'Saving…' : 'Create semester'}
          </button>
        </div>
      </form>
    </>
  );
}
