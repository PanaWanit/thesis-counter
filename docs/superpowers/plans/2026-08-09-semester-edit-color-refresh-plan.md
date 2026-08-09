# Semester Editing and Color Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full semester editing, improve credit input feedback, and replace purple-heavy UI with a warm neutral, teal, green, and coral system.

**Architecture:** Keep the existing SQLite schema and shared semester form. `App` relays an edit request from the workspace header to `Sidebar`, which owns semester persistence; `Sidebar` selects create or update, refreshes the list, and publishes the refreshed semester. Pure credit/date rules live in a small library module tested with Node's built-in test runner.

**Tech Stack:** React 18, strict TypeScript, Tauri v2, `tauri-plugin-sql`, SQLite, CSS custom properties, Node 24 built-in test runner.

## Global Constraints

- Keep the app single-user, local-only, and free of network calls or cloud sync.
- Add no third-party dependencies or remote fonts.
- Store dates as ISO 8601 strings and keep `duration_minutes` unchanged.
- Keep UI copy in English.
- Preserve the SQLite schema and automatic migration behavior.
- Keep all action targets at least 44×44px and preserve keyboard focus, Escape handling, focus trapping, and alert semantics.
- Purple must not remain as a structural UI color; category colors remain user-controlled data marks.

## File Map

- Create `src/lib/semester.ts`: pure credit parsing, weekly-hour derivation, and semester form validation.
- Create `tests/semester.test.mjs`: dependency-free tests for semester rules.
- Modify `package.json`: add the built-in Node test command.
- Modify `src/components/SemesterForm.tsx`: create/edit copy, permissive credit typing, live weekly target, and field errors.
- Modify `src/components/Sidebar.tsx`: open edit mode, call `updateSemester`, refresh selection, and restore focus.
- Modify `src/components/Tabs.tsx`: expose the header edit action.
- Modify `src/App.tsx`: relay edit requests between sibling components.
- Modify `src/components/Icons.tsx`: add the edit icon.
- Modify `src/components/CategoryManager.tsx`: replace the purple default category color.
- Modify `src/components/SessionsTab.tsx`: replace the purple fallback category color.
- Modify `src/components/StatsTab.tsx`: use the renamed accent button class.
- Modify `src/styles.css`: semantic warm-neutral palette, green active-semester badge, teal accents, edit-action layout, and field-error styles.

---

### Task 1: Tested semester form rules

**Files:**
- Create: `src/lib/semester.ts`
- Create: `tests/semester.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseSemesterCredits(value: string): number | null`
- Produces: `requiredWeeklyHours(value: string): number | null`
- Produces: `validateSemesterDraft(startDate: string, endDate: string, credits: string): SemesterFieldErrors`

- [ ] **Step 1: Add the test command and failing tests**

Add this script to `package.json`:

```json
"test": "node --test tests/*.test.mjs"
```

Create `tests/semester.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseSemesterCredits,
  requiredWeeklyHours,
  validateSemesterDraft,
} from '../src/lib/semester.ts';

test('accepts positive whole-number credits and derives weekly hours', () => {
  assert.equal(parseSemesterCredits('6'), 6);
  assert.equal(requiredWeeklyHours('6'), 18);
});

test('rejects empty, zero, negative, decimal, and nonnumeric credits', () => {
  for (const value of ['', '0', '-1', '1.5', 'six']) {
    assert.equal(parseSemesterCredits(value), null);
  }
});

test('reports reversed semester dates and invalid credits', () => {
  assert.deepEqual(validateSemesterDraft('2026-08-10', '2026-08-09', '0'), {
    dates: 'End date must be on or after the start date.',
    credits: 'Credits must be a whole number of at least 1.',
  });
});
```

- [ ] **Step 2: Run the tests and prove RED**

Run: `npm test`

Expected: FAIL because `src/lib/semester.ts` does not exist.

- [ ] **Step 3: Implement the smallest rule module**

Create `src/lib/semester.ts`:

```ts
export interface SemesterFieldErrors {
  dates?: string;
  credits?: string;
}

export function parseSemesterCredits(value: string): number | null {
  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;
  const credits = Number(normalized);
  return Number.isSafeInteger(credits) ? credits : null;
}

export function requiredWeeklyHours(value: string): number | null {
  const credits = parseSemesterCredits(value);
  return credits === null ? null : credits * 3;
}

export function validateSemesterDraft(
  startDate: string,
  endDate: string,
  credits: string
): SemesterFieldErrors {
  const errors: SemesterFieldErrors = {};
  if (endDate < startDate) {
    errors.dates = 'End date must be on or after the start date.';
  }
  if (parseSemesterCredits(credits) === null) {
    errors.credits = 'Credits must be a whole number of at least 1.';
  }
  return errors;
}
```

- [ ] **Step 4: Run tests and type checking**

Run: `npm test`

Expected: 3 tests pass.

Run: `npm run build`

Expected: TypeScript and Vite build succeed.

- [ ] **Step 5: Commit**

```bash
git add package.json src/lib/semester.ts tests/semester.test.mjs
git commit -m "test(semester): cover credit validation"
```

### Task 2: Create and edit form UX

**Files:**
- Modify: `src/components/SemesterForm.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `parseSemesterCredits`, `requiredWeeklyHours`, and `validateSemesterDraft` from `src/lib/semester.ts`.
- Preserves: `onSave(input: SemesterInput): void | Promise<void>`.

- [ ] **Step 1: Extend tests for live helper boundaries**

Add to `tests/semester.test.mjs`:

```js
test('does not show a weekly target for invalid credit input', () => {
  assert.equal(requiredWeeklyHours(''), null);
  assert.equal(requiredWeeklyHours('1.5'), null);
});
```

- [ ] **Step 2: Run the focused tests**

Run: `npm test`

Expected: tests pass because the underlying boundary is already implemented; this is a characterization gate before UI wiring.

- [ ] **Step 3: Update `SemesterForm`**

Use string state for credits:

```ts
const isEditing = Boolean(semester);
const [credits, setCredits] = useState(String(semester?.credits ?? 6));
const [fieldErrors, setFieldErrors] = useState<SemesterFieldErrors>({});
const weeklyHours = requiredWeeklyHours(credits);
```

On submit, call `validateSemesterDraft`, stop when either error exists, then call `onSave` with `parseSemesterCredits(credits)!`. Use mode-specific copy:

```tsx
<h2 id="semester-dialog-title">{isEditing ? 'Edit semester' : 'Create a semester'}</h2>
```

```tsx
{isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create semester'}
```

Let the number field receive `event.target.value`, set `step={1}`, and connect `aria-invalid` plus field-error IDs. Render this live helper when valid:

```tsx
{weeklyHours === null
  ? '1 credit = 3 required research hours per week.'
  : `${credits} credits = ${weeklyHours} required research hours per week.`}
```

- [ ] **Step 4: Add concise field-error styling**

Add `.field-error` using the existing danger token, 11px text, and no extra top margin. Do not remove the existing operation-level alert.

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Run: `npm run build`

Expected: all tests pass and production build succeeds.

```bash
git add src/components/SemesterForm.tsx src/styles.css tests/semester.test.mjs
git commit -m "feat(semester): improve form validation"
```

### Task 3: Reachable semester update flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Tabs.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Icons.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `Tabs` adds `onEditSemester: () => void`.
- `Sidebar` adds `editRequest?: number`.
- `AppIcon` adds icon name `edit`.

- [ ] **Step 1: Add edit trigger contract and prove the compiler fails**

Pass `onEditSemester={() => setEditRequest((value) => value + 1)}` from `App` to `Tabs` before changing `Tabs` props.

Run: `npm run build`

Expected: FAIL because `Tabs` does not accept `onEditSemester`.

- [ ] **Step 2: Add the header edit action**

Add the `edit` SVG path to `Icons.tsx`. Extend `Tabs` props and render a `.semester-header-actions` group containing the green active badge and:

```tsx
<button
  id="edit-semester-button"
  className="button button-secondary"
  type="button"
  onClick={onEditSemester}
>
  <AppIcon name="edit" size={17} />
  Edit semester
</button>
```

- [ ] **Step 3: Relay edit requests into `Sidebar`**

Add `editRequest` state in `App`, pass it to `Sidebar`, and increment it only from the selected-semester header. In `Sidebar`, add `editingSemester: Semester | null`, react to a positive `editRequest` by copying `selected` into `editingSemester`, clearing form errors, and opening the form.

Import `updateSemester`. In `handleSave`, branch once:

```ts
const editedId = editingSemester?.id;
if (editedId === undefined) {
  await createSemester(input);
} else {
  await updateSemester(editedId, input);
}
```

Reload semesters, select the row matching `editedId` after edits or the newest row after creation, and pass `semester={editingSemester}` into `SemesterForm`. Use create/update-specific failure copy. Reset edit state on close and success. Return edit-mode focus to `#edit-semester-button`; create mode continues returning to `addButtonRef`.

- [ ] **Step 4: Add responsive header-action layout**

Keep badge and edit button grouped at desktop width. At 600px and below, allow the group to wrap and align to the start without horizontal overflow.

- [ ] **Step 5: Verify and commit**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass; the compiler confirms the new prop chain and form contracts.

```bash
git add src/App.tsx src/components/Tabs.tsx src/components/Sidebar.tsx src/components/Icons.tsx src/styles.css
git commit -m "feat(semester): add full editing flow"
```

### Task 4: Semantic color refresh

**Files:**
- Modify: `src/styles.css`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/StatsTab.tsx`
- Modify: `src/components/SessionsTab.tsx`
- Modify: `src/components/CategoryManager.tsx`

**Interfaces:**
- Replace structural `indigo` naming with `accent` tokens and `.button-accent`.
- Add `--status` and `--status-soft` for active state.

- [ ] **Step 1: Establish semantic tokens**

Set warm-neutral and semantic values:

```css
--research-paper: #f4f1eb;
--annotation-ink: #232824;
--canvas-strong: #e9e4da;
--surface: #fbfaf6;
--surface-raised: #fffdf8;
--surface-inset: #eeeae1;
--ink-secondary: #4f5953;
--ink-tertiary: #66716a;
--accent: #176b67;
--accent-strong: #105450;
--accent-soft: #dceee9;
--status: #2f7d4a;
--status-soft: #e0f1e5;
--focus: #177a73;
```

Use neutral green-gray alpha values for borders and shadows. Keep coral, amber, and danger roles.

- [ ] **Step 2: Assign colors by meaning**

Use accent tokens for app mark, navigation, informational states, Research Trail, empty-state icon, retry/new-semester buttons, and fallback category marks. Use status tokens only for `.badge` and its dot. Rename `.button-indigo` to `.button-accent` in CSS and components. Change the default new-category color from `#4f46e5` to `#176b67`.

- [ ] **Step 3: Remove purple residues**

Run:

```bash
rg -n "indigo|violet|lavender|#4f46e5|#3e36c6|#e6e4ff|79, 70, 229|101, 92, 240" src
```

Expected: no structural purple token, class, literal, or fallback remains.

- [ ] **Step 4: Verify and commit**

Run: `npm test`

Run: `npm run build`

Expected: tests and production build pass.

```bash
git add src/styles.css src/components/Sidebar.tsx src/components/StatsTab.tsx src/components/SessionsTab.tsx src/components/CategoryManager.tsx
git commit -m "style(ui): refresh semantic color system"
```

### Task 5: Integrated smoke and visual verification

**Files:**
- Modify only if verification exposes a scoped defect.

**Interfaces:**
- Verifies the complete semester and palette behavior; produces no new API.

- [ ] **Step 1: Run clean automated verification**

Run: `npm test`

Expected: all Node tests pass.

Run: `npm run build`

Expected: strict TypeScript and Vite production build succeed.

- [ ] **Step 2: Run local Tauri smoke test**

Run: `npm run tauri dev`.

Verify create semester, select semester, open edit from header, edit name/dates/credits, save, observe refreshed sidebar/header/weekly target, cancel an edit, reject invalid credits and reversed dates, and delete a semester.

- [ ] **Step 3: Inspect visual and keyboard states**

Inspect normal desktop width and 600px-or-narrower width. Confirm warm canvas, teal Research Trail/navigation, green active-semester dot, coral primary actions, no unintended purple, no clipping, visible focus rings, modal Tab loop, Escape close, and correct focus return.

- [ ] **Step 4: Review final diff**

Run: `git diff --check`

Run: `git status --short`

Confirm no generated bundle, database, remote dependency, or unrelated file is included.

- [ ] **Step 5: Commit verification-only fixes if any**

If verification required a code change, rerun `npm test` and `npm run build`, then commit only that scoped correction with a specific `fix:` message. If no change was required, do not create an empty commit.
