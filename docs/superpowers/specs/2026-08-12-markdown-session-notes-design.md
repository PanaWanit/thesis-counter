# Markdown Session Notes Design

## Goal
Replace the single plain-text `Note` field on research sessions with a **Title** plus a **Markdown description**, add a live markdown preview while editing, and show the rendered note in a popup card from the session history.

## Decisions

- Two fields instead of one markdown blob: `title` (plain text) and `note` (markdown description). This keeps the history table title clean and makes the popup rendering straightforward.
- Existing sessions keep their old `note` as the description and get an empty `title`. They can be edited later if needed.
- Markdown rendering uses `marked` for parsing and `dompurify` for sanitization.
- Live preview is rendered under the input fields in both timer and manual forms.
- The popup card is a read-only dialog, not an editor.

## Data Changes

### Migration
Add migration version 6 in `src-tauri/src/main.rs`:

```sql
ALTER TABLE sessions ADD COLUMN title TEXT NOT NULL DEFAULT '';
```

The existing `note` column becomes the markdown description. No content conversion is performed.

### Types
Update `src/types.ts`:

```ts
export interface Session {
  id: number;
  semester_id: number;
  category_id: number;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  title: string;
  note: string; // markdown description
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

### DB API
Update `src/db.ts`:

- `createSession` inserts `title` alongside existing fields.
- `listSessions` selects `title` (already uses `SELECT *`).

## Components

### `MarkdownPreview`
Location: `src/components/MarkdownPreview.tsx`

Props: `{ markdown: string }`

- Uses `useMemo` to parse markdown with `marked.parse(markdown, { async: false })`.
- Sanitizes the result with `DOMPurify.sanitize`.
- Renders with `dangerouslySetInnerHTML` inside a styled container.
- Memoization keeps preview cheap while typing.

### `NoteCard`
Location: `src/components/NoteCard.tsx`

Props: `{ title: string; note: string; onClose: () => void }`

- Uses existing `.dialog-scrim` / `.dialog-panel` styling.
- Header shows the title (or "No title" fallback) and a close button.
- Body renders the note with `MarkdownPreview`.
- Closes on scrim click, Escape key, or close button.
- `aria-modal="true"`, `role="dialog"`, labelled by the title element.

### `SessionNoteCell`
Location: inline in `src/components/SessionsTab.tsx` (or extracted if reused)

- Displays the title as primary text.
- Shows a secondary "View note" trigger when a note exists.
- Clicking anywhere in the cell opens `NoteCard`.
- Keyboard accessible (button semantics or clickable row cell with Enter/Space).

## Form Changes

### Timer tab (`src/components/TimerTab.tsx`)

- Add `title` state.
- Rename note label to `Description` with helper text `(markdown supported)`.
- Add `Title` input above description.
- Add live `MarkdownPreview` below the textarea.
- On stop/save, include `title` and `note` in `createSession`.
- Clear both fields after save.

### Manual entry (`src/components/SessionsTab.tsx`)

- Add `title` state.
- Add `Title` input and relabel `Note` to `Description`.
- Add live `MarkdownPreview` below the form.
- Include `title` in `SessionInput` on add.
- Clear title and note after save.

## History Table

In `src/components/SessionsTab.tsx`:

- Note column shows `title` with fallback to "No title".
- If a note exists, show "View note".
- Click opens `NoteCard` for that session.

## Export

Update `src/components/ExportButton.tsx`:

- Add `title` header before `note`.
- Include `session.title` in the CSV row.

## Styling

Add to `src/styles.css`:

- `.markdown-preview` and `.markdown-body` base styles.
- Heading, paragraph, list, code, link, and blockquote styles inside rendered markdown.
- `.note-card` body sizing and overflow.

## Dependencies

```bash
npm install marked dompurify
npm install -D @types/dompurify
```

`marked` includes its own TypeScript types. `dompurify` requires `@types/dompurify`.

## Security

- All markdown is rendered through `DOMPurify.sanitize` before insertion.
- No inline scripts, event handlers, or dangerous HTML tags survive sanitization.
- The app is local-only, but sanitization prevents accidental self-XSS from pasted content.

## Accessibility

- Preview region has `aria-live="polite"` so screen readers announce changes without interrupting typing.
- `NoteCard` follows the existing dialog pattern with Escape-to-close and visible close button.
- History note cell uses a button role so it is keyboard operable.

## Out of Scope

- Editing sessions from the popup card.
- Full WYSIWYG editor; inputs remain plain markdown text.
- Migration of existing note content into titles.
