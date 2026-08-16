# Date/Time Pickers and Note Editor Redesign

Date: 2026-08-16
Status: Approved

## Problem

Three surfaces rely on native `type="date"` / `type="time"` inputs:

- `SessionsTab` manual entry — date, start, end
- `SemesterForm` — start date, end date

Native controls render inconsistently, ignore the app's design tokens, and force
every manual session to be expressed as a start/end pair even when the user only
remembers "I worked two hours". The note writer is a bare `<textarea>` with an
always-visible preview block below it, which crowds the form and the note dialog.

## Goals

- Replace every native date/time control with in-app components that follow the
  existing CSS tokens.
- Let a manual session be entered either as start + end time, or as start +
  duration.
- Rebuild the markdown note writer as one reusable editor with a toolbar and
  Write/Preview tabs, used by both the manual entry form and `NoteCard`.

## Non-Goals

- No change to the SQLite schema, `types.ts`, or any `db.ts` function.
- No overnight sessions. An end time earlier than the start time stays an error.
- No new runtime dependencies. Everything is hand-rolled against existing CSS.
- No change to timer-driven sessions in `TimerTab`.

## Architecture

Small primitives composed by the existing screens, plus a shared popover layer.
Pure logic lives in `src/lib` so it can be unit-tested with the project's
existing `node --test` setup.

### New files

| File | Responsibility |
| --- | --- |
| `src/lib/time.ts` | Pure time helpers: `parseTimeInput`, `addMinutes`, `diffMinutes`, `formatDuration`, `formatDateLabel`, and the entry-form validation predicates. |
| `src/lib/calendar.ts` | Pure calendar helpers: `monthGrid(year, month)` returning a Monday-first 6x7 cell array, plus `isSameDay` and `inRange`. |
| `src/components/Popover.tsx` | Anchored overlay: closes on Escape and outside click, returns focus to its trigger, flips above the trigger when there is no room below. |
| `src/components/Calendar.tsx` | Month grid with `mode="single" \| "range"`, roving-focus keyboard navigation, and month/year selects for fast jumps. |
| `src/components/DateField.tsx` | Trigger button showing a formatted date; opens `Calendar` inside `Popover`. Supports single and range value shapes. |
| `src/components/TimeField.tsx` | Text input accepting typed digits, with a caret that opens a 15-minute slot list. |
| `src/components/DurationField.tsx` | Hour and minute number inputs plus preset chips. |
| `src/components/MarkdownEditor.tsx` | Write/Preview tabs, formatting toolbar, keyboard shortcuts, auto-growing textarea. |

`MarkdownPreview` is unchanged and is rendered by the editor's Preview tab.

### Component contracts

```ts
// Popover.tsx
interface PopoverProps {
  anchor: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}

// Calendar.tsx
type CalendarValue =
  | { mode: 'single'; date: string }                  // 'YYYY-MM-DD'
  | { mode: 'range'; start: string; end: string };    // 'YYYY-MM-DD'

interface CalendarProps {
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  min?: string;
  max?: string;
}

// DateField.tsx
interface DateFieldProps {
  id: string;
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}

// TimeField.tsx — value and onChange use 'HH:MM' in 24-hour form
interface TimeFieldProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  step?: number;      // arrow-key increment in minutes, default 5
  slotStep?: number;  // dropdown slot spacing in minutes, default 15
}

// DurationField.tsx — value and onChange use whole minutes
interface DurationFieldProps {
  id: string;
  value: number;
  onChange: (next: number) => void;
  presets?: number[]; // default [30, 60, 120, 180]
}

// MarkdownEditor.tsx
interface MarkdownEditorProps {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
}
```

## Behavior

### TimeField

- Typing digits is interpreted progressively: `9` -> `09:00`, `93` -> `09:30`,
  `930` -> `09:30`, `1345` -> `13:45`. Input that cannot resolve to a valid time
  reverts to the last valid value on blur.
- `ArrowUp` / `ArrowDown` step the value by `step` minutes and wrap at midnight.
- The caret button opens a scrollable list of slots spaced `slotStep` minutes
  apart, scrolled so the current value is visible and marked `aria-selected`.
- Free typing is preserved, so odd values such as `09:07` remain enterable.

### Manual session entry

`SessionsTab` replaces its `date` / `start` / `end` state with:

```ts
const [date, setDate] = useState(formatDateInput(new Date())); // 'YYYY-MM-DD'
const [start, setStart] = useState('09:00');                   // 'HH:MM'
const [mode, setMode] = useState<'end' | 'duration'>('end');
const [end, setEnd] = useState('10:00');                       // 'HH:MM'
const [minutes, setMinutes] = useState(60);                    // whole minutes
```

A segmented control switches `mode`. Switching keeps both representations in
sync so no input is lost:

- `end` -> `duration` sets `minutes = diffMinutes(start, end)`.
- `duration` -> `end` sets `end = addMinutes(start, minutes)`.

The active mode is the source of truth on submit; the other value is derived
from it. A summary line below the fields always reads
`09:00 - 10:30 · 1h 30m`.

`mode` is UI state only. It is not written to the database and resets when the
app restarts.

Submission builds the same `SessionInput` the form builds today, so `db.ts` and
the schema are untouched.

### Validation

Validation predicates move into `src/lib/time.ts`; the form only renders the
returned message.

- `duration` mode: `minutes` must be greater than zero.
- `end` mode: end must be later than start. Otherwise the existing message
  "End time must be later than start time." is shown.
- Category selection validation is unchanged.

### Semester form

`startDate` and `endDate` remain two `'YYYY-MM-DD'` strings. One
`DateField mode="range"` writes both from a single popover that highlights the
selected span. `validateSemesterDraft` in `src/lib/semester.ts` is unchanged.

### Note editor

`MarkdownEditor` replaces the textarea plus standalone preview block in both the
manual entry form and `NoteCard`.

- Tabs: Write and Preview. Preview renders through the existing
  `MarkdownPreview`.
- Toolbar: bold, italic, heading, bullet list, link, inline code. Each wraps or
  prefixes the current selection and restores the selection afterwards.
- Shortcuts: `Cmd/Ctrl+B` bold, `Cmd/Ctrl+I` italic, `Cmd/Ctrl+K` link.
- The textarea grows with its content from `minRows` up to a capped height,
  after which it scrolls.

`NoteCard`'s `isEditing`, save, cancel, and focus-restoration logic is unchanged;
only the editing body is swapped.

## Styling

New rules are appended to `src/styles.css` using the existing tokens
(`--accent`, `--surface`, `--border`, `--radius`). No new palette and no
Tailwind. New blocks: `.popover`, `.calendar`, `.time-field`, `.duration-field`,
`.segmented`, `.md-editor`. Rules that exist only to style native date and time
inputs are removed once no consumer remains.

## Accessibility

- `Popover` renders `role="dialog"`; its trigger carries `aria-haspopup="dialog"`
  and `aria-expanded`.
- `Calendar` is `role="grid"`; days are `role="gridcell"` with `aria-selected`
  and a roving `tabIndex`. Arrow keys move by day, `PageUp`/`PageDown` by month,
  `Home`/`End` to the start and end of the week. An `aria-live="polite"` region
  announces the visible month.
- `TimeField` keeps a real `<input>` with `aria-autocomplete="list"` and
  `aria-expanded` for its slot list.
- Every control is operable with the keyboard alone, and focus returns to the
  trigger when a popover closes.

## Testing

New unit tests run under the existing `npm test` (`node --test tests/*.test.mjs`):

- `tests/time.test.mjs` — `parseTimeInput` across partial and invalid input,
  `addMinutes` wrapping at midnight, `diffMinutes`, `formatDuration`, and the
  validation predicates.
- `tests/calendar.test.mjs` — `monthGrid` for a leap February, a month starting
  on a Sunday, a month starting on a Monday, and a day on which local time
  shifts, plus `inRange` boundary cases.

Components are smoke-tested manually per `CLAUDE.md`: add a session in both
modes, edit a note, and create and edit a semester.

## Risks

- The calendar and popover are hand-rolled, so keyboard and focus handling are
  the most likely sources of defects. They are isolated in two files and covered
  by manual keyboard passes.
- Date arithmetic is done on local calendar dates, matching the existing
  `src/lib/date.ts` helpers, so the pickers must never construct a `Date` from a
  bare `'YYYY-MM-DD'` string, which parses as UTC.
