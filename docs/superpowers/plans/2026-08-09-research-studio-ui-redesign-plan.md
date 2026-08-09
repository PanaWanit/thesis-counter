# Research Studio UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. This
> repository does not require TDD; steps use TypeScript production builds plus
> focused manual smoke checks.

**Goal:** Replace the plain inline-styled interface with the approved colorful
Research Studio design while preserving all local tracking behavior.

**Architecture:** Keep the existing React component/data boundaries and add a
small, dependency-free presentation layer: one global token stylesheet, shared
inline SVG icons, and semantic component class names. App, Sidebar, and Tabs
form the shell; each existing feature component owns its current database calls
and adds local loading, error, empty, and confirmation states.

**Tech Stack:** React 18, strict TypeScript, CSS custom properties/CSS Grid,
native HTML controls and dialog semantics, Tauri v2, SQLite via
`tauri-plugin-sql`.

## Global Constraints

- Keep the app single-user, local-only, and free of network calls.
- Do not add dependencies or remote fonts.
- Store dates as ISO 8601 strings and duration as minutes.
- Keep Monday as the first day of the week.
- Preserve existing database schema and query behavior.
- Use English UI copy.
- All interactive targets are at least 44×44px with visible keyboard focus.
- Respect `prefers-reduced-motion` and prevent horizontal overflow at 375px.

---

### Task 1: Shared Design System and Icon Set

**Files:**
- Create: `src/styles.css`
- Create: `src/components/Icons.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces semantic classes used by every component: `button`, `field`,
  `panel`, `page-header`, `empty-state`, `alert`, and layout variants.
- Produces `AppIcon` with `name`, `size`, and `title` props.

- [ ] **Step 1: Add semantic CSS tokens**

Define the Research Studio palette and scales at `:root`:

```css
:root {
  --canvas: #f2f1f8;
  --surface: #fbfaff;
  --surface-raised: #ffffff;
  --ink: #202033;
  --ink-secondary: #56566f;
  --ink-muted: #7b7b91;
  --indigo: #4f46e5;
  --coral: #ca3851;
  --teal: #0f8a7b;
  --amber: #a85d08;
  --danger: #b4233a;
  --focus: #655cf0;
  --radius-control: 10px;
  --radius-card: 16px;
  --radius-panel: 20px;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}
```

Add reset, typography, button/control states, panels, responsive helpers,
screen layouts, skeleton/empty/alert styles, reduced-motion handling, and the
840px/600px breakpoints. Use named transition properties only.

- [ ] **Step 2: Add dependency-free SVG icons**

Implement one `<svg>` wrapper with a discriminated icon-name union:

```tsx
export type IconName =
  | 'clock' | 'sessions' | 'insights' | 'categories' | 'plus'
  | 'trash' | 'download' | 'calendar' | 'book' | 'arrowRight'
  | 'close' | 'check' | 'flask' | 'play' | 'stop';

export function AppIcon({ name, size = 20, title }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {renderIconPaths(name)}
    </svg>
  );
}
```

Implement `renderIconPaths` as a switch that returns explicit `<path>`,
`<circle>`, `<rect>`, and `<polyline>` elements for every `IconName`; use a
consistent 1.8px rounded stroke and `currentColor`. The switch is exhaustive:

```tsx
function renderIconPaths(name: IconName) {
  switch (name) {
    case 'clock': return <><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>;
    case 'sessions': return <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"/></>;
    case 'insights': return <><path d="M5 19V9M12 19V5M19 19v-7"/><path d="M3 19h18"/></>;
    case 'categories': return <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>;
    case 'plus': return <path d="M12 5v14M5 12h14"/>;
    case 'play': return <path d="m9 7 8 5-8 5Z"/>;
    case 'trash': return <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></>;
    case 'download': return <><path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/></>;
    case 'calendar': return <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>;
    case 'book': return <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v17H7.5A3.5 3.5 0 0 0 4 22z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v17h4.5A3.5 3.5 0 0 1 20 22z"/></>;
    case 'arrowRight': return <><path d="M5 12h14M14 7l5 5-5 5"/></>;
    case 'close': return <path d="M6 6l12 12M18 6 6 18"/>;
    case 'check': return <path d="m5 12 4 4L19 6"/>;
    case 'flask': return <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/><path d="M8 14h8"/></>;
    case 'stop': return <rect x="7" y="7" width="10" height="10" rx="1.5"/>;
  }
}
```

- [ ] **Step 3: Load the stylesheet once**

Add `import './styles.css';` to `src/main.tsx`.

- [ ] **Step 4: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 2: App Shell and Semester Management

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/SemesterForm.tsx`

**Interfaces:**
- `Sidebar` continues consuming `selected` and `onSelect`.
- `Sidebar` produces semester selection plus modal create/delete flows.
- `SemesterForm` continues producing `SemesterInput` through `onSave`.

- [ ] **Step 1: Build the application shell**

Replace inline layout styles with `app-shell`, `workspace`, and `workspace-main`
classes. Add a skip link and `id="main-content"`.

- [ ] **Step 2: Redesign the sidebar**

Add app identity, semester count, selected semester metadata, compact semester
rows, a primary add button, loading/error/empty states, and accessible delete
buttons. Keep the existing automatic first-semester selection.

- [ ] **Step 3: Move semester creation into a modal**

Render a fixed scrim/dialog only while `showForm` is true:

```tsx
<div className="dialog-scrim" role="presentation">
  <section className="dialog-panel" role="dialog" aria-modal="true"
    aria-labelledby="semester-dialog-title">
    <SemesterForm onSave={handleSave} onCancel={closeForm} />
  </section>
</div>
```

Close on Escape, disable duplicate saves, and place delete confirmation in a
small confirmation panel rather than deleting immediately.

- [ ] **Step 4: Add persistent field labels**

Label semester name, dates, and credits; add “1 credit = 3 required hours per
week.” helper copy. Surface save errors with `role="alert"`.

- [ ] **Step 5: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 3: Workspace Header and Navigation

**Files:**
- Modify: `src/components/Tabs.tsx`

**Interfaces:**
- Continues consuming the selected `Semester`.
- Owns the active destination and renders the four existing feature
  components.

- [ ] **Step 1: Add semester context header**

Display semester name as the page title, date range and credits as supporting
metadata, and a small “Active semester” badge.

- [ ] **Step 2: Replace plain tabs with labeled icon navigation**

Map internal keys to visible labels and icons:

```tsx
const navigation = [
  { key: 'timer', label: 'Focus', icon: 'clock' },
  { key: 'sessions', label: 'Sessions', icon: 'sessions' },
  { key: 'stats', label: 'Insights', icon: 'insights' },
  { key: 'categories', label: 'Categories', icon: 'categories' },
] as const;
```

Use `aria-pressed`, icon plus label, and a stable active indicator. Preserve the
active key when the semester changes.

- [ ] **Step 3: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 4: Focus Timer and Research Trail

**Files:**
- Modify: `src/components/TimerTab.tsx`

**Interfaces:**
- Continues consuming `Semester` and creating sessions with `createSession`.
- Also consumes existing `getWeeklyStats` and `getSemesterStats` read queries.

- [ ] **Step 1: Load supporting progress data**

Fetch weekly and semester stats when `semester` changes. Keep timer setup
independent so a failed stats query does not prevent starting a session.

- [ ] **Step 2: Build the timer focal card**

Add a visible category label, status badge, tabular `HH:MM:SS`, note field, and
one large Start/Stop action. Keep the category disabled while running and keep
the card footprint stable across states.

- [ ] **Step 3: Add the Research Trail**

Show current hours, required hours, bounded percent, semester date range, and
days remaining. Use a semantic `progress` element plus visible text.

- [ ] **Step 4: Add recoverable errors**

Replace `window.alert` on save failure with an inline `role="alert"` panel.
Disable Stop while saving and use “Saving…” text.

- [ ] **Step 5: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 5: Sessions Workspace

**Files:**
- Modify: `src/components/SessionsTab.tsx`

**Interfaces:**
- Continues listing, creating, and deleting sessions for the selected semester.

- [ ] **Step 1: Add the labeled manual-entry panel**

Group date, start, end, category, and note with visible labels in a responsive
grid. Rename the submit action to “Add session” and disable it during save.

- [ ] **Step 2: Validate the time range**

Before creating a session, reject `end <= start` with an inline message:

```tsx
if (ended <= started) {
  setError('End time must be later than start time.');
  return;
}
```

- [ ] **Step 3: Redesign history**

Add a descriptive header/count, compact responsive table, category swatch plus
name, tabular duration, and a useful empty state.

- [ ] **Step 4: Confirm deletion**

Store the pending session id, show Cancel/Delete confirmation actions, and only
call `deleteSession` after explicit confirmation. Keep failed rows visible and
show the error inline.

- [ ] **Step 5: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 6: Insights, Export, and Categories

**Files:**
- Modify: `src/components/StatsTab.tsx`
- Modify: `src/components/ExportButton.tsx`
- Modify: `src/components/CategoryManager.tsx`

**Interfaces:**
- Existing stats queries and CSV builder remain unchanged.
- Category manager continues using the existing create/delete queries.

- [ ] **Step 1: Build the Insights hierarchy**

Lead with Research Trail; present total hours as the hero value; place session
count and average/week as supporting metrics; show category shares as labeled
horizontal bars with visible hours and percentages.

- [ ] **Step 2: Add insights loading/error/empty states**

Use reserved skeleton blocks while loading, Retry for query errors, and a
guidance panel when no sessions exist.

- [ ] **Step 3: Restyle CSV export as a secondary action**

Add the download icon and a temporary “Exporting…” disabled state around CSV
generation. Keep the generated columns and filename unchanged.

- [ ] **Step 4: Redesign Categories**

Add labeled name/color fields, category count, swatch rows, empty state, inline
constraint error, duplicate-submit protection, and explicit delete
confirmation.

- [ ] **Step 5: Verify compilation**

Run: `npm run build`

Expected: TypeScript and Vite exit 0.

---

### Task 7: Visual and Interaction Verification

**Files:**
- Modify as needed after inspection: `src/styles.css`, `src/App.tsx`, and
  `src/components/*.tsx`

**Interfaces:**
- No new interfaces; this task closes visual and interaction gaps.

- [ ] **Step 1: Run complete build**

Run: `npm run build`

Expected: `tsc` and Vite exit 0 with no errors.

- [ ] **Step 2: Run the app and inspect desktop layout**

Run: `npm run tauri dev`

Inspect the normal Tauri window for Focus, Sessions, Insights, Categories,
semester dialog, empty states, running timer, and confirmation prompts.

- [ ] **Step 3: Inspect narrow layout**

Resize to 375px width and verify no horizontal page overflow, readable table
cards, wrapped navigation, reachable actions, and unhidden dialog controls.

- [ ] **Step 4: Check accessibility states**

Tab through every control, verify visible focus, use Escape on the semester
dialog, confirm labels and disabled states, and enable reduced motion.

- [ ] **Step 5: Check local-only constraint**

Review `package.json`, stylesheet imports, and source references to confirm no
new dependencies, remote URLs, telemetry, or network requests.

- [ ] **Step 6: Review the final diff**

Run: `git diff --check` and `git diff --stat`

Expected: no whitespace errors; only the planned UI/docs files change.
