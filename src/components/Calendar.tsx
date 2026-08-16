import { useEffect, useRef, useState } from 'react';
import {
  MONTH_NAMES,
  endOfWeek,
  formatDateLabel,
  inRange,
  isSameDay,
  monthGrid,
  monthLabel,
  parseDateString,
  shiftDate,
  shiftMonth,
  startOfWeek,
  toDateString,
} from '../lib/calendar';
import { AppIcon } from './Icons';

export type CalendarValue =
  | { mode: 'single'; date: string }
  | { mode: 'range'; start: string; end: string };

interface Props {
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  min?: string;
  max?: string;
  onComplete?: () => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function anchorDate(value: CalendarValue): string {
  return value.mode === 'single' ? value.date : value.start;
}

export default function Calendar({ value, onChange, min, max, onComplete }: Props) {
  const [focused, setFocused] = useState(() => anchorDate(value));
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldRefocus = useRef(false);

  const { year, month } = parseDateString(focused);
  const cells = monthGrid(year, month);

  const isDisabled = (date: string) => {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const tabbable =
    (!isDisabled(focused) && cells.some((cell) => cell.date === focused) ? focused : null) ??
    cells.find((cell) => !isDisabled(cell.date))?.date ??
    focused;

  const isSelected = (date: string) => {
    if (value.mode === 'single') return isSameDay(date, value.date);
    return isSameDay(date, value.start) || isSameDay(date, value.end);
  };

  const isWithin = (date: string) =>
    value.mode === 'range' && inRange(date, value.start, value.end);

  const select = (date: string) => {
    if (isDisabled(date)) return;

    if (value.mode === 'single') {
      onChange({ mode: 'single', date });
      onComplete?.();
      return;
    }

    // Arm the first endpoint without committing: an abandoned selection must
    // leave the existing range intact, so `onChange` waits for the second click.
    if (pendingStart === null) {
      setPendingStart(date);
      return;
    }

    const [start, end] = date < pendingStart ? [date, pendingStart] : [pendingStart, date];
    setPendingStart(null);
    onChange({ mode: 'range', start, end });
    onComplete?.();
  };

  // Keyboard navigation must pull DOM focus onto the newly focused day.
  // Mouse-driven jumps (chevrons, selects) must not, or they would yank focus
  // out of the control the user just clicked.
  const moveFocus = (next: string) => {
    shouldRefocus.current = true;
    setFocused(next);
  };

  const years: number[] = [];
  for (let option = year - 10; option <= year + 10; option += 1) {
    years.push(option);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => string> = {
      ArrowLeft: () => shiftDate(focused, -1),
      ArrowRight: () => shiftDate(focused, 1),
      ArrowUp: () => shiftDate(focused, -7),
      ArrowDown: () => shiftDate(focused, 7),
      PageUp: () => shiftMonth(focused, -1),
      PageDown: () => shiftMonth(focused, 1),
      Home: () => startOfWeek(focused),
      End: () => endOfWeek(focused),
    };

    const move = keys[event.key];
    if (move) {
      event.preventDefault();
      moveFocus(move());
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(focused);
    }
  };

  useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    const target = gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]');
    target?.focus();
  }, [focused]);

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          className="icon-button icon-button-quiet"
          type="button"
          aria-label="Previous month"
          title="Previous month"
          onClick={() => setFocused(shiftMonth(focused, -1))}
        >
          <AppIcon name="chevronLeft" size={17} />
        </button>

        <div className="calendar-jump">
          <select
            className="calendar-select"
            aria-label="Month"
            value={month}
            onChange={(event) => setFocused(toDateString(year, Number(event.target.value), 1))}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>
          <select
            className="calendar-select"
            aria-label="Year"
            value={year}
            onChange={(event) => setFocused(toDateString(Number(event.target.value), month, 1))}
          >
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <span className="sr-only" aria-live="polite">{monthLabel(year, month)}</span>

        <button
          className="icon-button icon-button-quiet"
          type="button"
          aria-label="Next month"
          title="Next month"
          onClick={() => setFocused(shiftMonth(focused, 1))}
        >
          <AppIcon name="chevronRight" size={17} />
        </button>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>

      <div
        ref={gridRef}
        className="calendar-grid"
        role="grid"
        aria-label={monthLabel(year, month)}
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: 6 }, (_, week) => cells.slice(week * 7, week * 7 + 7)).map((row) => (
          <div key={row[0].date} className="calendar-row" role="row">
            {row.map((cell) => {
              const focusedCell = cell.date === tabbable;
              return (
                <button
                  key={cell.date}
                  type="button"
                  role="gridcell"
                  className="calendar-day"
                  data-focused={focusedCell}
                  data-outside={!cell.inMonth}
                  data-selected={isSelected(cell.date)}
                  data-within={isWithin(cell.date)}
                  data-pending={cell.date === pendingStart}
                  aria-selected={isSelected(cell.date)}
                  aria-label={formatDateLabel(cell.date)}
                  disabled={isDisabled(cell.date)}
                  tabIndex={focusedCell ? 0 : -1}
                  onClick={() => {
                    setFocused(cell.date);
                    select(cell.date);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
