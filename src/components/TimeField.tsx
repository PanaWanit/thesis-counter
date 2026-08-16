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
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const slots = buildSlots(slotStep);
  const listboxId = `${id}-listbox`;

  // Keep the visible text in sync when the value changes from outside.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Scroll the list so the active slot is visible while it's open.
  useEffect(() => {
    if (!open) return;
    const target = listRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
    target?.scrollIntoView({ block: 'center' });
  }, [open, activeIndex]);

  const commit = (raw: string) => {
    const next = parseTimeInput(raw, value);
    setDraft(next);
    if (next !== value) onChange(next);
  };

  const nearestSlot = slots.reduce((best, slot) => (slot <= value ? slot : best), slots[0]);

  const openList = () => {
    setActiveIndex(slots.indexOf(nearestSlot));
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      openList();
      return;
    }

    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, slots.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        onChange(slots[activeIndex]);
        setOpen(false);
        return;
      }
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? step : -step;
      const base = parseTimeInput(draft, value);
      onChange(addMinutes(base, delta));
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
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? `${id}-slot-${activeIndex}` : undefined}
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
        onClick={() => (open ? setOpen(false) : openList())}
      >
        ▾
      </button>

      <Popover anchor={wrapRef} open={open} onClose={() => setOpen(false)}>
        <div className="time-slots" id={listboxId} ref={listRef} role="listbox" aria-label="Time options">
          {slots.map((slot, index) => (
            <button
              key={slot}
              id={`${id}-slot-${index}`}
              className="time-slot"
              type="button"
              role="option"
              aria-selected={slot === value}
              data-current={slot === nearestSlot}
              data-selected={slot === value}
              data-active={index === activeIndex}
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
