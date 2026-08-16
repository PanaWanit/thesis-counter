# Date/Time Pickers and Note Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every native date/time input with in-app pickers, let a manual session be logged as start+end or start+duration, and rebuild the markdown note writer as one reusable editor.

**Architecture:** Pure date/time logic lives in `src/lib/time.ts` and `src/lib/calendar.ts` and is unit-tested with `node --test`. On top of that sit small React primitives — `Popover`, `Calendar`, `DateField`, `TimeField`, `DurationField`, `MarkdownEditor` — each in its own file. The three existing screens (`SessionsTab`, `SemesterForm`, `NoteCard`) only compose those primitives; no database, schema, or `types.ts` change.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Tauri v2, hand-written CSS in `src/styles.css` driven by CSS custom properties, `node --test` with native TypeScript stripping for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-16-datetime-picker-note-editor-design.md`

## Global Constraints

- No new runtime or dev dependencies. Everything is hand-rolled.
- TypeScript `strict: true`. Type-check with `npx tsc --noEmit` before every commit.
- Never construct a `Date` from a bare `'YYYY-MM-DD'` string — that parses as UTC and shifts the day in negative-offset zones. Split the string and use the `new Date(year, monthIndex, day)` local constructor, or work on the string directly.
- Time values are `'HH:MM'` strings in 24-hour form. Date values are `'YYYY-MM-DD'` local calendar strings. Durations are whole minutes as `number`.
- Weeks start on Monday everywhere (matches `CLAUDE.md` and `getMonday` in `src/lib/date.ts`).
- All new CSS uses only existing custom properties: `--surface`, `--surface-raised`, `--surface-inset`, `--ink`, `--ink-secondary`, `--ink-tertiary`, `--accent`, `--accent-soft`, `--on-accent`, `--line`, `--line-strong`, `--focus`, `--focus-rgb`, `--danger`, `--radius-control`, `--radius-card`, `--shadow-card`, `--shadow-dialog`, `--ease-out`. No hard-coded colors — 11 themes swap these tokens.
- UI text in English.
- Unit tests exist only for `src/lib/*`. There is no DOM test runner in this project; component tasks are verified with `npx tsc --noEmit` plus the manual smoke steps written into each task.
- Run `npm test` (which is `node --test tests/*.test.mjs`) after every library change.

---

### Task 1: Time arithmetic library

**Files:**
- Create: `src/lib/time.ts`
- Test: `tests/time.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseTimeInput(raw: string, fallback: string): string`
  - `addMinutes(time: string, minutes: number): string`
  - `diffMinutes(start: string, end: string): number`
  - `formatDuration(minutes: number): string`
  - `formatTimeRange(start: string, end: string): string`
  - `validateManualEntry(mode: 'end' | 'duration', start: string, end: string, minutes: number): string | null`

- [ ] **Step 1: Write the failing test**

Create `tests/time.test.mjs`:

```javascript
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMinutes,
  diffMinutes,
  formatDuration,
  formatTimeRange,
  parseTimeInput,
  validateManualEntry,
} from '../src/lib/time.ts';

test('parseTimeInput reads progressive digit input', () => {
  assert.equal(parseTimeInput('9', '00:00'), '09:00');
  assert.equal(parseTimeInput('09', '00:00'), '09:00');
  assert.equal(parseTimeInput('93', '00:00'), '09:30');
  assert.equal(parseTimeInput('930', '00:00'), '09:30');
  assert.equal(parseTimeInput('1345', '00:00'), '13:45');
  assert.equal(parseTimeInput('13:45', '00:00'), '13:45');
  assert.equal(parseTimeInput('0907', '00:00'), '09:07');
});

test('parseTimeInput falls back on input it cannot resolve', () => {
  assert.equal(parseTimeInput('', '08:15'), '08:15');
  assert.equal(parseTimeInput('abc', '08:15'), '08:15');
  assert.equal(parseTimeInput('999', '08:15'), '08:15');
  assert.equal(parseTimeInput('2575', '08:15'), '08:15');
  assert.equal(parseTimeInput('123456', '08:15'), '08:15');
});

test('addMinutes wraps around midnight in both directions', () => {
  assert.equal(addMinutes('09:00', 90), '10:30');
  assert.equal(addMinutes('23:50', 20), '00:10');
  assert.equal(addMinutes('00:05', -10), '23:55');
  assert.equal(addMinutes('09:00', 0), '09:00');
});

test('diffMinutes returns signed minutes without wrapping', () => {
  assert.equal(diffMinutes('09:00', '10:30'), 90);
  assert.equal(diffMinutes('09:00', '09:00'), 0);
  assert.equal(diffMinutes('10:00', '09:15'), -45);
});

test('formatDuration renders hours and minutes', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(45), '45m');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(185), '3h 5m');
});

test('formatTimeRange joins the range with its duration', () => {
  assert.equal(formatTimeRange('09:00', '10:30'), '09:00 - 10:30 · 1h 30m');
});

test('validateManualEntry rejects non-positive spans only', () => {
  assert.equal(validateManualEntry('end', '09:00', '10:00', 60), null);
  assert.equal(
    validateManualEntry('end', '10:00', '09:00', 60),
    'End time must be later than start time.'
  );
  assert.equal(
    validateManualEntry('end', '09:00', '09:00', 60),
    'End time must be later than start time.'
  );
  assert.equal(validateManualEntry('duration', '09:00', '10:00', 30), null);
  assert.equal(
    validateManualEntry('duration', '09:00', '10:00', 0),
    'Duration must be longer than zero minutes.'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/lib/time.ts'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/time.ts`:

```typescript
function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

// Convert 'HH:MM' into minutes since midnight. Returns null when malformed.
function toMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

// Interpret free typing as a time: '9' -> 09:00, '93' -> 09:30, '930' -> 09:30,
// '1345' -> 13:45. Anything unresolvable returns `fallback`.
export function parseTimeInput(raw: string, fallback: string): string {
  const digits = raw.replace(/\D/g, '');
  let hour: number;
  let minute: number;

  if (digits.length === 1) {
    hour = Number(digits);
    minute = 0;
  } else if (digits.length === 2) {
    const asHour = Number(digits);
    if (asHour <= 23) {
      hour = asHour;
      minute = 0;
    } else {
      hour = Number(digits[0]);
      minute = Number(digits[1]) * 10;
    }
  } else if (digits.length === 3) {
    hour = Number(digits[0]);
    minute = Number(digits.slice(1));
  } else if (digits.length === 4) {
    hour = Number(digits.slice(0, 2));
    minute = Number(digits.slice(2));
  } else {
    return fallback;
  }

  if (hour > 23 || minute > 59) return fallback;
  return `${pad(hour)}:${pad(minute)}`;
}

// Shift 'HH:MM' by whole minutes, wrapping at midnight in both directions.
export function addMinutes(time: string, minutes: number): string {
  const base = toMinutes(time);
  if (base === null) return time;
  return fromMinutes(base + minutes);
}

// Signed minutes from `start` to `end`. Does not wrap across midnight.
export function diffMinutes(start: string, end: string): number {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null) return 0;
  return to - from;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end} · ${formatDuration(diffMinutes(start, end))}`;
}

// Validation for the manual session form. Returns an error message, or null when valid.
export function validateManualEntry(
  mode: 'end' | 'duration',
  start: string,
  end: string,
  minutes: number
): string | null {
  if (mode === 'duration') {
    return minutes > 0 ? null : 'Duration must be longer than zero minutes.';
  }
  return diffMinutes(start, end) > 0 ? null : 'End time must be later than start time.';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all `time.test.mjs` assertions green, existing suites still green.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/time.ts tests/time.test.mjs
git commit -m "feat: add pure time arithmetic and validation helpers"
```

---

### Task 2: Calendar grid library

**Files:**
- Create: `src/lib/calendar.ts`
- Test: `tests/calendar.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface DayCell { date: string; day: number; inMonth: boolean }`
  - `toDateString(year: number, month: number, day: number): string` — `month` is 0-indexed
  - `parseDateString(value: string): { year: number; month: number; day: number }`
  - `monthGrid(year: number, month: number): DayCell[]` — always 42 cells, Monday-first
  - `shiftDate(date: string, days: number): string`
  - `shiftMonth(date: string, months: number): string`
  - `startOfWeek(date: string): string`
  - `endOfWeek(date: string): string`
  - `isSameDay(a: string, b: string): boolean`
  - `inRange(date: string, start: string, end: string): boolean`
  - `monthLabel(year: number, month: number): string`
  - `formatDateLabel(date: string): string` — e.g. `Sun 16 Aug 2026`
  - `MONTH_NAMES: string[]` — 12 full month names, January first

- [ ] **Step 1: Write the failing test**

Create `tests/calendar.test.mjs`:

```javascript
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  endOfWeek,
  formatDateLabel,
  inRange,
  isSameDay,
  monthGrid,
  parseDateString,
  shiftDate,
  shiftMonth,
  startOfWeek,
  toDateString,
} from '../src/lib/calendar.ts';

test('toDateString and parseDateString round-trip', () => {
  assert.equal(toDateString(2026, 7, 16), '2026-08-16');
  assert.deepEqual(parseDateString('2026-08-16'), { year: 2026, month: 7, day: 16 });
});

test('monthGrid always returns 42 Monday-first cells', () => {
  const grid = monthGrid(2026, 7);
  assert.equal(grid.length, 42);
  assert.equal(grid[0].date, '2026-07-27');
  assert.equal(grid[0].inMonth, false);
  assert.equal(grid[5].date, '2026-08-01');
  assert.equal(grid[5].inMonth, true);
});

test('monthGrid handles a leap February', () => {
  const grid = monthGrid(2024, 1);
  const february = grid.filter((cell) => cell.inMonth);
  assert.equal(february.length, 29);
  assert.equal(february[28].date, '2024-02-29');
});

test('monthGrid handles a month starting on Monday', () => {
  const grid = monthGrid(2026, 5);
  assert.equal(grid[0].date, '2026-06-01');
  assert.equal(grid[0].inMonth, true);
});

test('monthGrid handles a month starting on Sunday', () => {
  const grid = monthGrid(2026, 2);
  assert.equal(grid[0].date, '2026-02-23');
  assert.equal(grid[6].date, '2026-03-01');
  assert.equal(grid[6].inMonth, true);
});

test('shiftDate crosses month and year boundaries', () => {
  assert.equal(shiftDate('2026-08-31', 1), '2026-09-01');
  assert.equal(shiftDate('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDate('2026-08-16', 7), '2026-08-23');
});

test('shiftMonth clamps onto shorter months', () => {
  assert.equal(shiftMonth('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftMonth('2026-03-15', -1), '2026-02-15');
  assert.equal(shiftMonth('2026-12-15', 1), '2027-01-15');
});

test('startOfWeek and endOfWeek use Monday weeks', () => {
  assert.equal(startOfWeek('2026-08-16'), '2026-08-10');
  assert.equal(endOfWeek('2026-08-16'), '2026-08-16');
  assert.equal(startOfWeek('2026-08-10'), '2026-08-10');
});

test('inRange includes both endpoints', () => {
  assert.equal(inRange('2026-08-16', '2026-08-16', '2026-08-20'), true);
  assert.equal(inRange('2026-08-20', '2026-08-16', '2026-08-20'), true);
  assert.equal(inRange('2026-08-21', '2026-08-16', '2026-08-20'), false);
  assert.equal(inRange('2026-08-15', '2026-08-16', '2026-08-20'), false);
});

test('isSameDay compares calendar strings', () => {
  assert.equal(isSameDay('2026-08-16', '2026-08-16'), true);
  assert.equal(isSameDay('2026-08-16', '2026-08-17'), false);
});

test('formatDateLabel renders a readable local label', () => {
  assert.equal(formatDateLabel('2026-08-16'), 'Sun 16 Aug 2026');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/lib/calendar.ts'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/calendar.ts`:

```typescript
export interface DayCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

// `month` is 0-indexed, matching the Date constructor.
export function toDateString(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateString(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month: month - 1, day };
}

// Build a local Date at midnight. Never pass a raw 'YYYY-MM-DD' to `new Date`.
function toLocalDate(value: string): Date {
  const { year, month, day } = parseDateString(value);
  return new Date(year, month, day);
}

// Days since Monday: Monday 0 ... Sunday 6.
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - mondayIndex(first));
  const cells: DayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    cells.push({
      date: toDateString(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
    });
  }

  return cells;
}

export function shiftDate(date: string, days: number): string {
  const d = toLocalDate(date);
  return toDateString(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

// Move by whole months, clamping the day onto shorter months (Jan 31 + 1 -> Feb 28).
export function shiftMonth(date: string, months: number): string {
  const { year, month, day } = parseDateString(date);
  const targetMonth = month + months;
  const lastDay = new Date(year, targetMonth + 1, 0).getDate();
  return toDateString(year, targetMonth, Math.min(day, lastDay));
}

export function startOfWeek(date: string): string {
  return shiftDate(date, -mondayIndex(toLocalDate(date)));
}

export function endOfWeek(date: string): string {
  return shiftDate(startOfWeek(date), 6);
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

// Inclusive on both ends. ISO date strings compare correctly as text.
export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function formatDateLabel(date: string): string {
  const d = toLocalDate(date);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/calendar.ts tests/calendar.test.mjs
git commit -m "feat: add pure Monday-first calendar grid helpers"
```

---

### Task 3: Popover primitive

**Files:**
- Create: `src/components/Popover.tsx`
- Modify: `src/styles.css` (append `.popover` block at end of file)

**Interfaces:**
- Consumes: nothing.
- Produces: default export `Popover` with props `{ anchor: React.RefObject<HTMLElement>; open: boolean; onClose: () => void; labelledBy?: string; children: React.ReactNode }`.

There is no DOM test runner, so this task is verified by type-check plus the manual smoke steps in Task 5, which is the first task that renders a popover.

- [ ] **Step 1: Write the component**

Create `src/components/Popover.tsx`:

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  anchor: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}

// Overlay anchored to a trigger element. Closes on Escape and on outside click,
// and flips above the trigger when there is not enough room below.
export default function Popover({ anchor, open, onClose, labelledBy, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const trigger = anchor.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const gap = 6;
      const margin = 8;

      let top = triggerRect.bottom + gap;
      if (top + panelRect.height > window.innerHeight - margin) {
        top = Math.max(margin, triggerRect.top - gap - panelRect.height);
      }

      let left = triggerRect.left;
      if (left + panelRect.width > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - panelRect.width);
      }

      setPosition({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
      anchor.current?.focus();
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchor.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="popover"
      role="dialog"
      aria-labelledby={labelledBy}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
}
```

Note the `keydown` listener uses capture (`true`) so a popover inside the semester dialog swallows Escape before the dialog's own handler closes the whole dialog.

- [ ] **Step 2: Add the styles**

Append to the end of `src/styles.css`:

```css
.popover {
  position: fixed;
  z-index: 90;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface-raised);
  box-shadow: var(--shadow-dialog);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output. An unused-file warning is not produced by this config, so a clean run is the whole gate here.

- [ ] **Step 4: Commit**

```bash
git add src/components/Popover.tsx src/styles.css
git commit -m "feat: add anchored popover primitive"
```

---

### Task 4: Calendar component

**Files:**
- Create: `src/components/Calendar.tsx`
- Modify: `src/components/Icons.tsx` (add `chevronLeft` and `chevronRight`)
- Modify: `src/styles.css` (append `.calendar` block)

**Interfaces:**
- Consumes: `monthGrid`, `shiftDate`, `shiftMonth`, `startOfWeek`, `endOfWeek`, `inRange`, `isSameDay`, `parseDateString`, `toDateString`, `monthLabel` from `src/lib/calendar.ts`; `AppIcon` from `src/components/Icons.tsx`.
- Produces:
  - `export type CalendarValue = { mode: 'single'; date: string } | { mode: 'range'; start: string; end: string }`
  - default export `Calendar` with props `{ value: CalendarValue; onChange: (next: CalendarValue) => void; min?: string; max?: string }`

- [ ] **Step 1: Add the two chevron icons**

In `src/components/Icons.tsx`, extend the `IconName` union with `'chevronLeft'` and `'chevronRight'` (keep the list alphabetical — they go after `'check'`):

```tsx
export type IconName =
  | 'arrowRight'
  | 'book'
  | 'calendar'
  | 'categories'
  | 'check'
  | 'chevronLeft'
  | 'chevronRight'
  | 'clock'
  | 'close'
  | 'download'
  | 'edit'
  | 'flask'
  | 'insights'
  | 'play'
  | 'plus'
  | 'sessions'
  | 'settings'
  | 'stop'
  | 'trash';
```

Add two cases to the `switch` in `paths()`. The existing cases return bare `<path d="…" />` elements and let the parent `<svg>` carry the stroke, so match that:

```tsx
    case 'chevronLeft':
      return <path d="m15 5-7 7 7 7" />;
    case 'chevronRight':
      return <path d="m9 5 7 7-7 7" />;
```

- [ ] **Step 2: Write the component**

Create `src/components/Calendar.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  MONTH_NAMES,
  endOfWeek,
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
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function anchorDate(value: CalendarValue): string {
  return value.mode === 'single' ? value.date : value.start;
}

export default function Calendar({ value, onChange, min, max }: Props) {
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
      return;
    }

    if (pendingStart === null) {
      setPendingStart(date);
      onChange({ mode: 'range', start: date, end: date });
      return;
    }

    const [start, end] = date < pendingStart ? [date, pendingStart] : [pendingStart, date];
    setPendingStart(null);
    onChange({ mode: 'range', start, end });
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
        {cells.map((cell) => {
          const focusedCell = isSameDay(cell.date, focused);
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
              aria-selected={isSelected(cell.date)}
              aria-label={cell.date}
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
    </div>
  );
}
```

- [ ] **Step 3: Add the styles**

Append to the end of `src/styles.css`:

```css
.calendar {
  display: flex;
  width: 252px;
  flex-direction: column;
  gap: 8px;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.calendar-jump {
  display: flex;
  gap: 4px;
}

.calendar-select {
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
}

.calendar-select:hover {
  border-color: var(--line);
  background: var(--surface-inset);
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-weekdays span {
  padding-bottom: 2px;
  color: var(--ink-tertiary);
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.calendar-day {
  height: 32px;
  border: 0;
  border-radius: 8px;
  outline: none;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background-color 140ms var(--ease-out), color 140ms var(--ease-out);
}

.calendar-day:hover:not(:disabled) {
  background: var(--surface-inset);
}

.calendar-day:focus-visible {
  box-shadow: 0 0 0 2px rgba(var(--focus-rgb), 0.45);
}

.calendar-day[data-outside="true"] {
  color: var(--ink-tertiary);
  opacity: 0.6;
}

.calendar-day[data-within="true"] {
  background: var(--accent-soft);
  border-radius: 0;
}

.calendar-day[data-selected="true"] {
  background: var(--accent);
  border-radius: 8px;
  color: var(--on-accent);
  font-weight: 750;
}

.calendar-day:disabled {
  cursor: default;
  opacity: 0.3;
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/Calendar.tsx src/components/Icons.tsx src/styles.css
git commit -m "feat: add keyboard-navigable calendar grid component"
```

---

### Task 5: DateField, wired into the semester form

**Files:**
- Create: `src/components/DateField.tsx`
- Modify: `src/components/SemesterForm.tsx:87-123` (replace both native date inputs with one range field)
- Modify: `src/styles.css` (append `.date-field` block)

**Interfaces:**
- Consumes: `Popover` (Task 3), `Calendar` and `CalendarValue` (Task 4), `formatDateLabel` from `src/lib/calendar.ts`.
- Produces: default export `DateField` with props `{ id: string; value: CalendarValue; onChange: (next: CalendarValue) => void; min?: string; max?: string; disabled?: boolean }`, and a re-export of `CalendarValue`.

- [ ] **Step 1: Write the component**

Create `src/components/DateField.tsx`:

```tsx
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
}

function label(value: CalendarValue): string {
  if (value.mode === 'single') return formatDateLabel(value.date);
  return `${formatDateLabel(value.start)}  →  ${formatDateLabel(value.end)}`;
}

export default function DateField({ id, value, onChange, min, max, disabled = false }: Props) {
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
          onChange={(next) => {
            onChange(next);
            // Single dates commit on the first click; a range needs a second click.
            if (next.mode === 'single' || next.start !== next.end) {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        />
      </Popover>
    </>
  );
}
```

- [ ] **Step 2: Add the styles**

Append to the end of `src/styles.css`:

```css
.date-field {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.date-field-label {
  overflow: hidden;
  flex: 1;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 3: Replace the two native date inputs in the semester form**

In `src/components/SemesterForm.tsx`, add the import:

```tsx
import DateField from './DateField';
```

Replace the two `<div className="field">` blocks holding `semester-start` and `semester-end` (currently lines 87-123) with a single range field:

```tsx
        <div className="field field-full">
          <label htmlFor="semester-dates">Semester dates</label>
          <DateField
            id="semester-dates"
            value={{ mode: 'range', start: startDate, end: endDate }}
            onChange={(next) => {
              if (next.mode !== 'range') return;
              setStartDate(next.start);
              setEndDate(next.end);
              setFieldErrors((current) => ({ ...current, dates: undefined }));
            }}
          />
          {fieldErrors.dates && (
            <p id="semester-dates-error" className="field-error" role="alert">
              {fieldErrors.dates}
            </p>
          )}
        </div>
```

`startDate`, `endDate`, `validateSemesterDraft`, and the submit handler stay exactly as they are — the field writes the same two `'YYYY-MM-DD'` strings.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Smoke-test manually**

Run: `npm run tauri dev`

Check each of these in the semester dialog:
1. The dates button shows `Sun 16 Aug 2026  →  ...` and opens a calendar on click.
2. Clicking a start day then an end day highlights the span and closes the popover; clicking the later day first still produces an ordered range.
3. Escape closes the calendar but leaves the semester dialog open; a second Escape closes the dialog.
4. Clicking outside the calendar closes only the calendar.
5. Tab to the button, press Enter, then navigate with arrow keys, PageUp/PageDown, Home/End, and select with Enter.
6. Jump months and years with the two selects in the calendar header; focus must stay on the select, not jump into the day grid. The chevrons behave the same way.
7. Saving stores the right dates — reopen the semester for editing and confirm.

- [ ] **Step 6: Commit**

```bash
git add src/components/DateField.tsx src/components/SemesterForm.tsx src/styles.css
git commit -m "feat: replace semester date inputs with an in-app range picker"
```

---

### Task 6: TimeField

**Files:**
- Create: `src/components/TimeField.tsx`
- Modify: `src/styles.css` (append `.time-field` block)

**Interfaces:**
- Consumes: `Popover` (Task 3); `addMinutes`, `parseTimeInput` from `src/lib/time.ts`.
- Produces: default export `TimeField` with props `{ id: string; value: string; onChange: (next: string) => void; step?: number; slotStep?: number }`. `value` and `onChange` use `'HH:MM'`.

- [ ] **Step 1: Write the component**

Create `src/components/TimeField.tsx`:

```tsx
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
```

`Popover`'s `anchor` prop is typed `RefObject<HTMLElement>`, and `wrapRef` is a `RefObject<HTMLDivElement>`, which is assignable. Anchoring to the wrapper rather than the input keeps the popover aligned under the whole field including its caret.

- [ ] **Step 2: Add the styles**

Append to the end of `src/styles.css`:

```css
.time-field {
  position: relative;
  display: flex;
  align-items: center;
}

.time-field-input {
  padding-right: 34px;
  font-variant-numeric: tabular-nums;
}

.time-field-caret {
  position: absolute;
  right: 6px;
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.time-field-caret:hover {
  background: var(--surface-inset);
}

.time-slots {
  display: flex;
  overflow-y: auto;
  max-height: 220px;
  flex-direction: column;
  gap: 1px;
  padding-right: 2px;
}

.time-slot {
  padding: 7px 18px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: left;
}

.time-slot:hover {
  background: var(--surface-inset);
}

.time-slot[data-selected="true"] {
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 750;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/TimeField.tsx src/styles.css
git commit -m "feat: add typed time field with slot dropdown"
```

---

### Task 7: DurationField and segmented control

**Files:**
- Create: `src/components/DurationField.tsx`
- Create: `src/components/Segmented.tsx`
- Modify: `src/styles.css` (append `.duration-field` and `.segmented` blocks)

**Interfaces:**
- Consumes: nothing beyond React.
- Produces:
  - default export `DurationField` with props `{ id: string; value: number; onChange: (next: number) => void; presets?: number[] }`, value in whole minutes.
  - default export `Segmented` with props `{ options: Array<{ value: string; label: string }>; value: string; onChange: (next: string) => void; label: string }`.

- [ ] **Step 1: Write the segmented control**

Create `src/components/Segmented.tsx`:

```tsx
interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}

// Two-or-more-way switch rendered as a radio group so arrow keys work natively.
export default function Segmented({ options, value, onChange, label }: Props) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className="segmented-option"
          type="button"
          role="radio"
          aria-checked={option.value === value}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write the duration field**

Create `src/components/DurationField.tsx`:

```tsx
import { formatDuration } from '../lib/time';

interface Props {
  id: string;
  value: number;
  onChange: (next: number) => void;
  presets?: number[];
}

const DEFAULT_PRESETS = [30, 60, 120, 180];

export default function DurationField({ id, value, onChange, presets = DEFAULT_PRESETS }: Props) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const clamp = (next: number) => Math.max(0, Math.min(next, 24 * 60));

  return (
    <div className="duration-field">
      <div className="duration-inputs">
        <label className="duration-unit">
          <input
            id={id}
            className="control"
            type="number"
            min={0}
            max={24}
            step={1}
            value={hours}
            onChange={(event) => onChange(clamp(Number(event.target.value) * 60 + minutes))}
          />
          <span>h</span>
        </label>
        <label className="duration-unit">
          <input
            className="control"
            type="number"
            min={0}
            max={59}
            step={5}
            value={minutes}
            onChange={(event) => onChange(clamp(hours * 60 + Number(event.target.value)))}
          />
          <span>m</span>
        </label>
      </div>

      <div className="duration-presets">
        {presets.map((preset) => (
          <button
            key={preset}
            className="duration-chip"
            type="button"
            data-active={preset === value}
            aria-pressed={preset === value}
            onClick={() => onChange(preset)}
          >
            {formatDuration(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the styles**

Append to the end of `src/styles.css`:

```css
.segmented {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface-inset);
  gap: 3px;
}

.segmented-option {
  padding: 7px 14px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 140ms var(--ease-out), color 140ms var(--ease-out);
}

.segmented-option[data-active="true"] {
  background: var(--surface-raised);
  color: var(--ink);
  box-shadow: var(--shadow-card-soft);
}

.duration-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.duration-inputs {
  display: flex;
  gap: 8px;
}

.duration-unit {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
}

.duration-unit .control {
  padding-right: 26px;
  font-variant-numeric: tabular-nums;
}

.duration-unit span {
  position: absolute;
  right: 10px;
  color: var(--ink-tertiary);
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
}

.duration-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.duration-chip {
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.duration-chip:hover {
  border-color: var(--line-strong);
}

.duration-chip[data-active="true"] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-strong);
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/DurationField.tsx src/components/Segmented.tsx src/styles.css
git commit -m "feat: add duration field and segmented control"
```

---

### Task 8: Rebuild the manual session entry form

**Files:**
- Modify: `src/components/SessionsTab.tsx:28-44` (state), `:73-110` (submit), `:149-199` (form markup)
- Modify: `src/styles.css` (replace the `.entry-form` grid rules, append `.entry-summary`)

**Interfaces:**
- Consumes: `DateField` (Task 5), `TimeField` (Task 6), `DurationField` and `Segmented` (Task 7); `addMinutes`, `diffMinutes`, `formatTimeRange`, `validateManualEntry` from `src/lib/time.ts`.
- Produces: no new exports. The `SessionInput` sent to `createSession` is byte-for-byte the shape it is today.

- [ ] **Step 1: Replace the time-related state**

In `src/components/SessionsTab.tsx`, add the imports:

```tsx
import { addMinutes, diffMinutes, formatTimeRange, validateManualEntry } from '../lib/time';
import DateField from './DateField';
import TimeField from './TimeField';
import DurationField from './DurationField';
import Segmented from './Segmented';
```

Replace the three lines currently declaring `date`, `start`, and `end` with:

```tsx
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [start, setStart] = useState('09:00');
  const [mode, setMode] = useState<'end' | 'duration'>('end');
  const [end, setEnd] = useState('10:00');
  const [minutes, setMinutes] = useState(60);
```

Add a derived end time just below the state block, before `refresh`:

```tsx
  // The active mode owns the truth; the other value is derived for display.
  const effectiveEnd = mode === 'end' ? end : addMinutes(start, minutes);
```

- [ ] **Step 2: Keep both modes in sync when the toggle flips**

Add this handler next to `handleAdd`:

```tsx
  const handleModeChange = (next: string) => {
    if (next === 'duration') {
      setMinutes(Math.max(0, diffMinutes(start, end)));
      setMode('duration');
    } else {
      setEnd(addMinutes(start, minutes));
      setMode('end');
    }
  };
```

- [ ] **Step 3: Route submission through the shared validator**

Replace the body of `handleAdd` down to the `SessionInput` construction with:

```tsx
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
```

The rest of `handleAdd` — `setSaving(true)`, the `try`/`catch`/`finally`, `setTitle('')`, `setNote('')`, `refresh()` — is unchanged.

`new Date('YYYY-MM-DDTHH:MM:00')` without a `Z` suffix is parsed as local time, which is the existing behavior and is correct here.

- [ ] **Step 4: Replace the date/start/end markup**

Replace the three `<div className="field">` blocks for `session-date`, `session-start`, and `session-end` with:

```tsx
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
              label="Session length entry mode"
              value={mode}
              onChange={handleModeChange}
              options={[
                { value: 'end', label: 'End time' },
                { value: 'duration', label: 'Duration' },
              ]}
            />
          </div>

          <p className="entry-summary">{formatTimeRange(start, effectiveEnd)}</p>
```

The category, title, description fields and the submit button stay where they are.

- [ ] **Step 5: Update the form grid**

In `src/styles.css`, replace the existing `.entry-form` rule (currently a 4-column grid) with:

```css
.entry-form {
  display: grid;
  grid-template-columns: 1.15fr 0.8fr 0.9fr 1fr;
  gap: 14px;
}

.entry-form .field-mode {
  justify-content: flex-end;
}

.entry-form .entry-summary {
  grid-column: 1 / -1;
  margin: -4px 0 0;
  color: var(--ink-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}
```

Leave the `.entry-form .field-title`, `.entry-form .field-description`, and `.entry-form .form-submit` rules that follow it untouched.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Smoke-test manually**

Run: `npm run tauri dev`

On the Sessions tab:
1. Add a session in End-time mode; confirm the row's duration matches the summary line.
2. Switch to Duration mode — the duration must equal the end-time span you just had, not reset to 60.
3. Set `2h`, confirm the summary reads `09:00 - 11:00 · 2h`, add it, and check the row.
4. Switch back to End time — the end field must show the derived end, not a stale value.
5. Set duration to `0m` and submit: expect "Duration must be longer than zero minutes."
6. In End-time mode set end before start and submit: expect "End time must be later than start time."
7. Type `930` into Start and Tab away — it should read `09:30`. Press ArrowUp — `09:35`.

- [ ] **Step 8: Commit**

```bash
git add src/components/SessionsTab.tsx src/styles.css
git commit -m "feat: log manual sessions by end time or duration"
```

---

### Task 9: MarkdownEditor

**Files:**
- Create: `src/components/MarkdownEditor.tsx`
- Modify: `src/styles.css` (append `.md-editor` block)

**Interfaces:**
- Consumes: `MarkdownPreview` from `src/components/MarkdownPreview.tsx`.
- Produces: default export `MarkdownEditor` with props `{ id: string; value: string; onChange: (next: string) => void; placeholder?: string; minRows?: number }`.

- [ ] **Step 1: Write the component**

Create `src/components/MarkdownEditor.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import MarkdownPreview from './MarkdownPreview';

interface Props {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
}

type Action = 'bold' | 'italic' | 'heading' | 'list' | 'link' | 'code';

interface ToolButton {
  action: Action;
  label: string;
  title: string;
}

const TOOLS: ToolButton[] = [
  { action: 'bold', label: 'B', title: 'Bold (Cmd/Ctrl+B)' },
  { action: 'italic', label: 'I', title: 'Italic (Cmd/Ctrl+I)' },
  { action: 'heading', label: 'H', title: 'Heading' },
  { action: 'list', label: '•', title: 'Bullet list' },
  { action: 'link', label: 'Link', title: 'Link (Cmd/Ctrl+K)' },
  { action: 'code', label: '</>', title: 'Inline code' },
];

// Returns the next text plus where the selection should land afterwards.
function applyAction(
  action: Action,
  text: string,
  start: number,
  end: number
): { text: string; start: number; end: number } {
  const selected = text.slice(start, end);

  const wrap = (marker: string) => ({
    text: `${text.slice(0, start)}${marker}${selected}${marker}${text.slice(end)}`,
    start: start + marker.length,
    end: end + marker.length,
  });

  const prefixLines = (marker: string) => {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const block = text.slice(lineStart, end);
    const prefixed = block
      .split('\n')
      .map((line) => (line.startsWith(marker) ? line : `${marker}${line}`))
      .join('\n');
    return {
      text: `${text.slice(0, lineStart)}${prefixed}${text.slice(end)}`,
      start: start + marker.length,
      end: end + (prefixed.length - block.length),
    };
  };

  switch (action) {
    case 'bold':
      return wrap('**');
    case 'italic':
      return wrap('*');
    case 'code':
      return wrap('`');
    case 'heading':
      return prefixLines('## ');
    case 'list':
      return prefixLines('- ');
    case 'link': {
      const label = selected || 'text';
      const next = `${text.slice(0, start)}[${label}](url)${text.slice(end)}`;
      const urlStart = start + label.length + 3;
      return { text: next, start: urlStart, end: urlStart + 3 };
    }
  }
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = 'What did you move forward?',
  minRows = 4,
}: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  // Grow with content up to a cap, then scroll.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node || tab !== 'write') return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
  }, [value, tab]);

  useEffect(() => {
    const selection = pendingSelection.current;
    const node = textareaRef.current;
    if (!selection || !node) return;
    pendingSelection.current = null;
    node.focus();
    node.setSelectionRange(selection.start, selection.end);
  }, [value]);

  const run = (action: Action) => {
    const node = textareaRef.current;
    if (!node) return;
    const next = applyAction(action, value, node.selectionStart, node.selectionEnd);
    pendingSelection.current = { start: next.start, end: next.end };
    onChange(next.text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.metaKey && !event.ctrlKey) return;
    const shortcuts: Record<string, Action> = { b: 'bold', i: 'italic', k: 'link' };
    const action = shortcuts[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    run(action);
  };

  return (
    <div className="md-editor">
      <div className="md-editor-bar">
        <div className="md-editor-tabs" role="tablist" aria-label="Editor mode">
          <button
            className="md-editor-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'write'}
            data-active={tab === 'write'}
            onClick={() => setTab('write')}
          >
            Write
          </button>
          <button
            className="md-editor-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            data-active={tab === 'preview'}
            onClick={() => setTab('preview')}
          >
            Preview
          </button>
        </div>

        <div className="md-editor-tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.action}
              className="md-editor-tool"
              type="button"
              title={tool.title}
              aria-label={tool.title}
              disabled={tab !== 'write'}
              onClick={() => run(tool.action)}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          id={id}
          className="control md-editor-input"
          rows={minRows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className="md-editor-preview">
          <MarkdownPreview markdown={value} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the styles**

Append to the end of `src/styles.css`:

```css
.md-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.md-editor-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.md-editor-tabs {
  display: inline-flex;
  gap: 2px;
}

.md-editor-tab {
  padding: 5px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--ink-tertiary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
}

.md-editor-tab[data-active="true"] {
  border-bottom-color: var(--accent);
  color: var(--ink);
}

.md-editor-tools {
  display: inline-flex;
  gap: 2px;
}

.md-editor-tool {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.md-editor-tool:hover:not(:disabled) {
  background: var(--surface-inset);
  color: var(--ink);
}

.md-editor-tool:disabled {
  opacity: 0.4;
}

.md-editor-input {
  overflow-y: auto;
  max-height: 320px;
  resize: none;
  line-height: 1.55;
}

.md-editor-preview {
  min-height: 82px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface-inset);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/MarkdownEditor.tsx src/styles.css
git commit -m "feat: add markdown editor with toolbar and preview tab"
```

---

### Task 10: Adopt the editor and drop dead styles

**Files:**
- Modify: `src/components/SessionsTab.tsx:185-211` (description field and the standalone preview block)
- Modify: `src/components/NoteCard.tsx:125-138` (description field and preview block)
- Modify: `src/styles.css` (remove `.manual-preview` rules and any native date/time input rules)

**Interfaces:**
- Consumes: `MarkdownEditor` (Task 9).
- Produces: no new exports.

- [ ] **Step 1: Swap the editor into the manual entry form**

In `src/components/SessionsTab.tsx`, add:

```tsx
import MarkdownEditor from './MarkdownEditor';
```

Replace the `field-description` block and the entire `<div className="manual-preview">…</div>` block below the form with a single field:

```tsx
          <div className="field field-description">
            <label htmlFor="session-description">Description <span className="helper-text">(markdown supported)</span></label>
            <MarkdownEditor id="session-description" value={note} onChange={setNote} />
          </div>
```

Remove the now-unused `MarkdownPreview` import from `SessionsTab.tsx`. Strict TypeScript with `noUnusedLocals` will flag it if you forget.

- [ ] **Step 2: Swap the editor into NoteCard**

In `src/components/NoteCard.tsx`, add:

```tsx
import MarkdownEditor from './MarkdownEditor';
```

Replace the description `<div className="field">` and the Preview `<div className="field">` inside `note-edit-form` with:

```tsx
              <div className="field">
                <label htmlFor="note-edit-description">Description <span className="helper-text">(markdown supported)</span></label>
                <MarkdownEditor id="note-edit-description" value={editNote} onChange={setEditNote} />
              </div>
```

Keep the `MarkdownPreview` import in `NoteCard.tsx` — it still renders the read-only view when `isEditing` is false.

- [ ] **Step 3: Remove dead styles**

In `src/styles.css`:
- Delete the `.manual-preview` and `.manual-preview .field-label` rules.
- Search for rules targeting native pickers — `input[type="date"]`, `input[type="time"]`, `::-webkit-calendar-picker-indicator`, `::-webkit-datetime-edit` — and delete any that exist. Run `grep -n 'type="date"\|type="time"\|calendar-picker-indicator\|datetime-edit' src/styles.css` first; if it returns nothing, there is nothing to delete and that is fine.

Confirm no native date or time input remains anywhere:

Run: `grep -rn 'type="date"\|type="time"' src/`
Expected: no matches.

- [ ] **Step 4: Type-check and test**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors, all tests pass.

- [ ] **Step 5: Full build**

Run: `npm run build`
Expected: `tsc` clean and a successful Vite build.

- [ ] **Step 6: Smoke-test manually**

Run: `npm run tauri dev`

1. In the manual form, type text, hit Preview, confirm it renders, hit Write, confirm the text survived.
2. Select a word and press Cmd/Ctrl+B — it wraps in `**` and stays selected.
3. Press Cmd/Ctrl+K with a word selected — `[word](url)` appears with `url` selected.
4. Click the bullet button across a multi-line selection — every line gets `- `.
5. The textarea grows as you type and stops growing at roughly ten lines.
6. Open a session note, click Edit note, edit with the same toolbar, save, and confirm the row and the note both update.
7. Cycle two or three themes from settings and confirm the calendar, time dropdown, chips, and editor all follow the theme with readable contrast.

- [ ] **Step 7: Commit**

```bash
git add src/components/SessionsTab.tsx src/components/NoteCard.tsx src/styles.css
git commit -m "feat: use the shared markdown editor in the session form and note card"
```

---

## Verification Checklist

After Task 10, all of the following must hold:

- `npm test` passes, including the new `time` and `calendar` suites.
- `npm run build` succeeds.
- `grep -rn 'type="date"\|type="time"' src/` returns nothing.
- Manual sessions can be added in both End-time and Duration modes, and the stored duration matches what the summary line showed.
- Semester start and end dates are set from one range calendar and round-trip through save and edit.
- The note editor works in both the manual form and the note dialog.
- Every picker is reachable and operable by keyboard alone.
