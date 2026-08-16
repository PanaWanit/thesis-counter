import { useEffect, useRef, useState } from 'react';
import { addMinutes, parseTimeInput } from '../lib/time';
import Popover from './Popover';

interface Props {
  id: string;
  value: string;
  onChange: (next: string) => void;
  step?: number;
  slotStep?: number;
}

function buildSlots(slotStep: number): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 1440; minutes += slotStep) {
    slots.push(addMinutes('00:00', minutes));
  }
  return slots;
}

export default function TimeField({ id, value, onChange, step = 5, slotStep = 15 }: Props) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const slots = buildSlots(slotStep);

  // Keep the visible text in sync when the value changes from outside.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Scroll the list so the nearest slot is visible when it opens.
  useEffect(() => {
    if (!open) return;
    const target = listRef.current?.querySelector<HTMLButtonElement>('[data-current="true"]');
    target?.scrollIntoView({ block: 'center' });
  }, [open]);

  const commit = (raw: string) => {
    const next = parseTimeInput(raw, value);
    setDraft(next);
    if (next !== value) onChange(next);
  };

  const nearestSlot = slots.reduce((best, slot) => (slot <= value ? slot : best), slots[0]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? step : -step;
      onChange(addMinutes(value, delta));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(draft);
      setOpen(false);
    }
  };

  return (
    <div className="time-field" ref={wrapRef}>
      <input
        ref={inputRef}
        id={id}
        className="control time-field-input"
        inputMode="numeric"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="time-field-caret"
        type="button"
        tabIndex={-1}
        aria-label="Choose a time"
        title="Choose a time"
        onClick={() => setOpen((current) => !current)}
      >
        ▾
      </button>

      <Popover anchor={wrapRef} open={open} onClose={() => setOpen(false)}>
        <div className="time-slots" ref={listRef} role="listbox" aria-label="Time options">
          {slots.map((slot) => (
            <button
              key={slot}
              className="time-slot"
              type="button"
              role="option"
              aria-selected={slot === value}
              data-current={slot === nearestSlot}
              data-selected={slot === value}
              onClick={() => {
                onChange(slot);
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}
