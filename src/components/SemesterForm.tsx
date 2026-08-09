import { useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { formatDateInput } from '../lib/date';
import {
  getSemesterFormPresentation,
  parseSemesterCredits,
  requiredWeeklyHours,
  validateSemesterDraft,
  type SemesterFieldErrors,
} from '../lib/semester';
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
  const [credits, setCredits] = useState(String(semester?.credits ?? 6));
  const [fieldErrors, setFieldErrors] = useState<SemesterFieldErrors>({});
  const presentation = getSemesterFormPresentation(Boolean(semester));
  const weeklyHours = requiredWeeklyHours(credits);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateSemesterDraft(startDate, endDate, credits);
    const parsedCredits = parseSemesterCredits(credits);
    setFieldErrors(nextErrors);

    if (nextErrors.dates || nextErrors.credits || parsedCredits === null) {
      return;
    }

    void onSave({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      credits: parsedCredits,
    });
  };

  return (
    <>
      <div className="dialog-header">
        <div>
          <p className="eyebrow">{presentation.eyebrow}</p>
          <h2 id="semester-dialog-title">{presentation.title}</h2>
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
            onChange={(event) => {
              setStartDate(event.target.value);
              setFieldErrors((current) => ({ ...current, dates: undefined }));
            }}
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
            onChange={(event) => {
              setEndDate(event.target.value);
              setFieldErrors((current) => ({ ...current, dates: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.dates)}
            aria-describedby={fieldErrors.dates ? 'semester-dates-error' : undefined}
            required
          />
          {fieldErrors.dates && (
            <p id="semester-dates-error" className="field-error" role="alert">
              {fieldErrors.dates}
            </p>
          )}
        </div>

        <div className="field field-full">
          <label htmlFor="semester-credits">Registered credits</label>
          <input
            id="semester-credits"
            className="control"
            type="number"
            min={1}
            step={1}
            value={credits}
            onChange={(event) => {
              setCredits(event.target.value);
              setFieldErrors((current) => ({ ...current, credits: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.credits)}
            aria-describedby={fieldErrors.credits ? 'credits-help credits-error' : 'credits-help'}
            required
          />
          <p id="credits-help" className="helper-text">
            {weeklyHours === null
              ? '1 credit = 3 required research hours per week.'
              : `${credits} ${credits === '1' ? 'credit' : 'credits'} = ${weeklyHours} required research hours per week.`}
          </p>
          {fieldErrors.credits && (
            <p id="credits-error" className="field-error" role="alert">
              {fieldErrors.credits}
            </p>
          )}
        </div>

        {error && (
          <div className="alert" role="alert">
            <AppIcon name="close" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="dialog-actions">
          <button className="button button-secondary" type="button" disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={isSaving}>
            <AppIcon name="check" size={18} />
            {isSaving ? 'Saving…' : presentation.submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}
