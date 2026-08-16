import { useRef, useState } from 'react';
import { formatDateLabel } from '../lib/calendar';
import Calendar, { type CalendarValue } from './Calendar';
import Popover from './Popover';
import { AppIcon } from './Icons';

export type { CalendarValue };

interface Props {
  id: string;
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

function label(value: CalendarValue): string {
  if (value.mode === 'single') return formatDateLabel(value.date);
  return `${formatDateLabel(value.start)}  →  ${formatDateLabel(value.end)}`;
}

export default function DateField({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
  invalid = false,
  describedBy,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        className="control date-field"
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
      >
        <AppIcon name="calendar" size={16} />
        <span className="date-field-label">{label(value)}</span>
      </button>

      <Popover anchor={triggerRef} open={open} onClose={() => setOpen(false)}>
        <Calendar
          value={value}
          min={min}
          max={max}
          onChange={onChange}
          onComplete={() => {
            // Single dates commit on the first click; a range needs a second click.
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      </Popover>
    </>
  );
}
