# Markdown Session Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `title` field and markdown `description` to research sessions, render a live markdown preview while editing, and open the rendered note in a popup card from the session history.

**Architecture:** Keep `note` as the markdown description, add a new `title` column, and introduce two reusable components (`MarkdownPreview`, `NoteCard`) plus a small `renderMarkdown` helper. Forms in `TimerTab` and `SessionsTab` add title/description inputs and live preview; the history table opens a read-only `NoteCard`.

**Tech Stack:** React + TypeScript, Tauri + SQLite, `marked` + `isomorphic-dompurify` for markdown rendering and sanitization, Node built-in test runner.

## Global Constraints

- TypeScript `strict: true`.
- Dates stored as ISO 8601 strings in SQLite.
- Compute stats in SQL when possible; store `duration_minutes` on each session.
- UI text in English.
- Tests run with `npm test` (`node --test tests/*.test.mjs`).
- No cloud/network dependencies; `isomorphic-dompurify` chosen so markdown sanitization can be unit-tested under Node.

## File Structure

- **Create** `src/lib/markdown.ts` — `renderMarkdown(markdown: string): string`.
- **Create** `tests/markdown.test.mjs` — unit tests for the renderer.
- **Create** `src/components/MarkdownPreview.tsx` — live preview using `renderMarkdown`.
- **Create** `src/components/NoteCard.tsx` — read-only popup dialog for a session note.
- **Modify** `src-tauri/src/main.rs` — add migration v6 for `title` column.
- **Modify** `src/types.ts` — add `title` to `Session` and `SessionInput`.
- **Modify** `src/db.ts` — include `title` in `createSession` insert.
- **Modify** `src/components/TimerTab.tsx` — title input, markdown description, live preview.
- **Modify** `src/components/SessionsTab.tsx` — title input, markdown description, live preview, clickable history note.
- **Modify** `src/components/ExportButton.tsx` — add `title` to CSV export.
- **Modify** `src/styles.css` — markdown preview/card styles and form layout tweaks.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm install)

**Interfaces:**
- Produces: `marked` and `isomorphic-dompurify` available for import.

- [ ] **Step 1: Install packages**

```bash
npm install marked isomorphic-dompurify
npm install -D @types/isomorphic-dompurify
```

- [ ] **Step 2: Verify packages appear in `package.json` dependencies/devDependencies**

Expected: `marked`, `isomorphic-dompurify` under `dependencies`; `@types/isomorphic-dompurify` under `devDependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add marked and isomorphic-dompurify for markdown notes"
```

---

### Task 2: Markdown Renderer Helper + Tests

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `tests/markdown.test.mjs`

**Interfaces:**
- Produces: `renderMarkdown(markdown: string): string` used by `MarkdownPreview`.

- [ ] **Step 1: Write the failing test**

Create `tests/markdown.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/lib/markdown.ts';

test('renders a heading and paragraph', () => {
  const html = renderMarkdown('# Session title\n\nSome details here.');
  assert.match(html, /<h1[^>]*>Session title<\/h1>/);
  assert.match(html, /<p>Some details here\.<\/p>/);
});

test('renders emphasis and lists', () => {
  const html = renderMarkdown('**Bold** and *italic*.\n\n- one\n- two');
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<li>one<\/li>/);
  assert.match(html, /<li>two<\/li>/);
});

test('sanitizes dangerous html', () => {
  const html = renderMarkdown('<script>alert(1)</script><p>safe</p>');
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /<p>safe<\/p>/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL with module/file not found for `src/lib/markdown.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/markdown.ts`:

```ts
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(raw);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS for all three tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts tests/markdown.test.mjs
git commit -m "feat: add markdown renderer helper with tests"
```

---

### Task 3: Add `title` Column Migration

**Files:**
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: SQLite `sessions` table has `title TEXT NOT NULL DEFAULT ''`.

- [ ] **Step 1: Insert migration version 6 after version 5**

Replace this block in `src-tauri/src/main.rs`:

```rust
        Migration {
            version: 5,
            description: "convert_category_created_at_to_iso",
            sql: "UPDATE categories SET created_at = strftime('%Y-%m-%dT%H:%M:%SZ', created_at) WHERE created_at NOT LIKE '%T%';",
            kind: MigrationKind::Up,
        },
```

with:

```rust
        Migration {
            version: 5,
            description: "convert_category_created_at_to_iso",
            sql: "UPDATE categories SET created_at = strftime('%Y-%m-%dT%H:%M:%SZ', created_at) WHERE created_at NOT LIKE '%T%';",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_session_title",
            sql: "ALTER TABLE sessions ADD COLUMN title TEXT NOT NULL DEFAULT '';",
            kind: MigrationKind::Up,
        },
```

- [ ] **Step 2: Verify Rust compiles**

```bash
cd src-tauri && cargo check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/main.rs
git commit -m "db: add title column to sessions"
```

---

### Task 4: Update Types and DB API

**Files:**
- Modify: `src/types.ts`
- Modify: `src/db.ts`

**Interfaces:**
- Produces: `Session.title: string` and `SessionInput.title: string`.
- Produces: `createSession` binds `input.title`.

- [ ] **Step 1: Add `title` to `Session` and `SessionInput`**

In `src/types.ts`, update the interfaces:

```ts
export interface Session {
  id: number;
  semester_id: number;
  category_id: number;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  title: string;
  note: string;
  manual: number;
  created_at: string;
}

export interface SessionInput {
  semester_id: number;
  category_id: number;
  started_at: string;
  ended_at: string;
  title: string;
  note: string;
  manual: number;
}
```

- [ ] **Step 2: Update `createSession` insert statement**

In `src/db.ts`, replace the `createSession` SQL and bindings:

```ts
export async function createSession(input: SessionInput): Promise<void> {
  const started = new Date(input.started_at);
  const ended = new Date(input.ended_at);
  const duration = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  await execute(
    `INSERT INTO sessions
     (semester_id, category_id, started_at, ended_at, duration_minutes, title, note, manual, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, datetime("now"))`,
    [input.semester_id, input.category_id, input.started_at, input.ended_at, duration, input.title, input.note, input.manual]
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npm run build
```

Expected: `tsc` succeeds. Vite build may succeed or not needed yet; focus on no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/db.ts
git commit -m "feat: add title to Session types and db insert"
```

---

### Task 5: Create `MarkdownPreview` Component

**Files:**
- Create: `src/components/MarkdownPreview.tsx`

**Interfaces:**
- Consumes: `renderMarkdown` from `src/lib/markdown.ts`.
- Produces: `MarkdownPreview({ markdown }: { markdown: string })`.

- [ ] **Step 1: Create component**

```tsx
import { useMemo } from 'react';
import { renderMarkdown } from '../lib/markdown';

interface Props {
  markdown: string;
}

export default function MarkdownPreview({ markdown }: Props) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  if (!markdown.trim()) {
    return (
      <div className="markdown-preview markdown-preview-empty" aria-live="polite">
        <p className="helper-text">Preview will appear here.</p>
      </div>
    );
  }

  return (
    <div
      className="markdown-preview markdown-body"
      aria-live="polite"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MarkdownPreview.tsx
git commit -m "feat: add MarkdownPreview component"
```

---

### Task 6: Create `NoteCard` Popup Component

**Files:**
- Create: `src/components/NoteCard.tsx`

**Interfaces:**
- Consumes: `MarkdownPreview`.
- Produces: `NoteCard({ title, note, onClose }: { title: string; note: string; onClose: () => void })`.

- [ ] **Step 1: Create component**

```tsx
import { useEffect, useRef } from 'react';
import MarkdownPreview from './MarkdownPreview';
import { AppIcon } from './Icons';

interface Props {
  title: string;
  note: string;
  onClose: () => void;
}

export default function NoteCard({ title, note, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displayTitle = title.trim() || 'No title';

  return (
    <div
      className="dialog-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-panel note-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-card-title"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Session note</p>
            <h2 id="note-card-title">{displayTitle}</h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            type="button"
            aria-label="Close note"
            title="Close"
            onClick={onClose}
          >
            <AppIcon name="close" size={19} />
          </button>
        </div>
        <div className="note-card-body">
          <MarkdownPreview markdown={note} />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteCard.tsx
git commit -m "feat: add NoteCard popup component"
```

---

### Task 7: Update `TimerTab` for Title + Markdown Description

**Files:**
- Modify: `src/components/TimerTab.tsx`

**Interfaces:**
- Consumes: `MarkdownPreview`.
- Produces: `createSession` now includes `title`.

- [ ] **Step 1: Add `title` state and update save/clear logic**

Add state near existing `note` state:

```ts
const [title, setTitle] = useState('');
```

Update `stop` to include `title`:

```ts
await createSession({
  semester_id: semester.id,
  category_id: categoryId,
  started_at: startTime.toISOString(),
  ended_at: endedAt.toISOString(),
  title: title.trim(),
  note: note.trim(),
  manual: 0,
});
setStartTime(null);
setElapsed(0);
setTitle('');
setNote('');
```

- [ ] **Step 2: Replace the note field with title + description + preview**

Replace:

```tsx
            <div className="field timer-note">
              <label htmlFor="timer-note">Session note <span className="helper-text">(optional)</span></label>
              <textarea
                id="timer-note"
                className="control"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What will you move forward?"
              />
            </div>
```

with:

```tsx
            <div className="field timer-title">
              <label htmlFor="timer-title">Title <span className="helper-text">(optional)</span></label>
              <input
                id="timer-title"
                className="control"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short name for this session"
              />
            </div>

            <div className="field timer-note">
              <label htmlFor="timer-note">Description <span className="helper-text">(markdown supported)</span></label>
              <textarea
                id="timer-note"
                className="control"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What will you move forward?"
              />
            </div>

            <div className="field timer-preview">
              <p className="field-label">Preview</p>
              <MarkdownPreview markdown={note} />
            </div>
```

- [ ] **Step 3: Add CSS layout classes for timer form**

In `src/styles.css`, update the timer form grid to place title, description, and preview full-width:

```css
.timer-title,
.timer-note,
.timer-preview {
  grid-column: 1 / -1;
}

.timer-preview .field-label {
  margin-bottom: 6px;
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/TimerTab.tsx src/styles.css
git commit -m "feat: add title and markdown preview to timer tab"
```

---

### Task 8: Update `SessionsTab` for Title, Markdown, and Popup

**Files:**
- Modify: `src/components/SessionsTab.tsx`

**Interfaces:**
- Consumes: `MarkdownPreview`, `NoteCard`.
- Produces: manual entry saves `title`; history note cell opens `NoteCard`.

- [ ] **Step 1: Add `title` state and update form save/clear**

Add state:

```ts
const [title, setTitle] = useState('');
```

Update `handleAdd` input:

```ts
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

After `createSession`, clear title:

```ts
setTitle('');
setNote('');
```

- [ ] **Step 2: Update manual entry form**

Replace the existing `field-note` block:

```tsx
          <div className="field field-note">
            <label htmlFor="session-note">Note <span className="helper-text">(optional)</span></label>
            <input
              id="session-note"
              className="control"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you move forward?"
            />
          </div>
```

with:

```tsx
          <div className="field field-title">
            <label htmlFor="session-title">Title <span className="helper-text">(optional)</span></label>
            <input
              id="session-title"
              className="control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short name for this session"
            />
          </div>
          <div className="field field-description">
            <label htmlFor="session-description">Description <span className="helper-text">(markdown supported)</span></label>
            <textarea
              id="session-description"
              className="control"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you move forward?"
            />
          </div>
```

- [ ] **Step 3: Add live preview under the form**

After the `formError` block (still inside the panel), add:

```tsx
        <div className="manual-preview">
          <p className="field-label">Preview</p>
          <MarkdownPreview markdown={note} />
        </div>
```

- [ ] **Step 4: Add popup state and note cell**

Add state near other session states:

```ts
const [viewingNote, setViewingNote] = useState<Session | null>(null);
```

Import `NoteCard` at the top:

```ts
import NoteCard from './NoteCard';
import MarkdownPreview from './MarkdownPreview';
```

Update the history `Note` cell:

```tsx
                      <td className="note-cell" data-label="Note">
                        <button
                          className="note-cell-button"
                          type="button"
                          onClick={() => setViewingNote(session)}
                        >
                          <span className="note-cell-title">{session.title.trim() || 'No title'}</span>
                          {session.note ? (
                            <span className="note-cell-hint">View note</span>
                          ) : (
                            <span className="helper-text">No description</span>
                          )}
                        </button>
                        {session.manual === 1 && <span className="manual-badge">Manual</span>}
                      </td>
```

Replace the previous Note cell markup that showed `session.note` directly.

- [ ] **Step 5: Render popup when a note is being viewed**

After the history table closing markup, render `NoteCard` conditionally:

```tsx
        {viewingNote && (
          <NoteCard
            title={viewingNote.title}
            note={viewingNote.note}
            onClose={() => setViewingNote(null)}
          />
        )}
```

- [ ] **Step 6: Add CSS for new form layout and note cell**

In `src/styles.css`, add:

```css
.entry-form .field-title,
.entry-form .field-description {
  grid-column: 1 / -2;
}

.manual-preview {
  margin-top: 18px;
}

.manual-preview .field-label {
  margin-bottom: 6px;
}

.note-cell {
  min-width: 0;
}

.note-cell-button {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.note-cell-button:hover .note-cell-title {
  color: var(--accent-strong);
}

.note-cell-title {
  display: block;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-cell-hint {
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 650;
}
```

- [ ] **Step 7: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/SessionsTab.tsx src/styles.css
git commit -m "feat: add title, markdown preview, and note popup to sessions tab"
```

---

### Task 9: Update CSV Export

**Files:**
- Modify: `src/components/ExportButton.tsx`

**Interfaces:**
- Consumes: `Session.title`.

- [ ] **Step 1: Add title column to export**

Update headers:

```ts
const headers = ['date', 'start_time', 'end_time', 'duration_hours', 'category', 'title', 'note', 'manual'];
```

Update row array:

```ts
        return [
          started.toISOString().split('T')[0],
          started.toLocaleTimeString(),
          ended.toLocaleTimeString(),
          (session.duration_minutes / 60).toFixed(2),
          categories.find((category) => category.id === session.category_id)?.name ?? '',
          session.title,
          session.note,
          session.manual ? 'yes' : 'no',
        ];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExportButton.tsx
git commit -m "feat: include title in csv export"
```

---

### Task 10: Add Markdown Preview/Card Styles

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: styled `.markdown-preview`, `.markdown-body`, and `.note-card`.

- [ ] **Step 1: Append markdown styles**

Add to the end of `src/styles.css`:

```css
.markdown-preview {
  padding: 14px 16px;
  border-radius: var(--radius-control);
  background: var(--surface-inset);
}

.markdown-preview-empty {
  color: var(--ink-tertiary);
}

.markdown-body {
  font-size: 14px;
  line-height: 1.55;
}

.markdown-body :first-child {
  margin-top: 0;
}

.markdown-body :last-child {
  margin-bottom: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin: 18px 0 8px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 750;
}

.markdown-body h1 {
  font-size: 18px;
}

.markdown-body p {
  margin: 8px 0;
}

.markdown-body ul,
.markdown-body ol {
  margin: 8px 0;
  padding-left: 22px;
}

.markdown-body li {
  margin: 3px 0;
}

.markdown-body code {
  padding: 2px 5px;
  border-radius: 6px;
  background: var(--canvas-strong);
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 12px;
}

.markdown-body pre {
  padding: 12px;
  overflow-x: auto;
  border-radius: var(--radius-control);
  background: var(--canvas-strong);
}

.markdown-body pre code {
  padding: 0;
  background: transparent;
}

.markdown-body a {
  color: var(--accent-strong);
  text-decoration: underline;
}

.markdown-body blockquote {
  margin: 10px 0;
  padding-left: 14px;
  border-left: 3px solid var(--line-strong);
  color: var(--ink-secondary);
}

.note-card {
  width: min(560px, 100%);
}

.note-card-body {
  max-height: 60dvh;
  overflow-y: auto;
}

@media (max-width: 1060px) {
  .entry-form .field-title,
  .entry-form .field-description {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .entry-form .field-title,
  .entry-form .field-description {
    grid-column: 1;
  }

  .note-cell-button {
    align-items: stretch;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.css
git commit -m "style: add markdown preview and note card styles"
```

---

### Task 11: Final Verification

**Files:**
- All modified files.

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run TypeScript and frontend build**

```bash
npm run build
```

Expected: `tsc` and `vite build` succeed.

- [ ] **Step 3: Run Rust check**

```bash
cd src-tauri && cargo check
```

Expected: no errors.

- [ ] **Step 4: Smoke test the app (manual)**

```bash
npm run tauri:dev
```

Verify:
- Timer tab shows Title and Description inputs.
- Typing markdown in Description renders live preview.
- Stopping timer saves session with title/description.
- Sessions tab manual entry shows Title and Description inputs and preview.
- History table shows title and "View note".
- Clicking note opens popup card with rendered markdown.
- CSV export includes `title` column.

- [ ] **Step 5: Final commit if not already committed**

If any fixes were needed, commit them. Otherwise the previous commits cover the work.

---

## Self-Review

**Spec coverage:**
- Title + description fields: Tasks 4, 7, 8.
- Markdown live preview: Tasks 2, 5, 7, 8, 10.
- Popup card: Tasks 6, 8, 10.
- DB migration: Task 3.
- CSV export: Task 9.
- Security (sanitization): Task 2.

**Placeholder scan:** All steps include exact code or commands; no TBD/TODO/filler.

**Type consistency:** `title: string` appears in `Session`, `SessionInput`, `createSession`, `TimerTab`, `SessionsTab`, and `ExportButton`. `renderMarkdown` is the single rendering entry point used by `MarkdownPreview` and tested directly.
