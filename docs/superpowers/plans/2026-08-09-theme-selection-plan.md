# Theme Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent sidebar theme selector with common programmer themes and a System option that follows OS light/dark changes.

**Architecture:** Keep theme IDs and preference normalization in a small pure TypeScript module. `App` owns the selected ID and applies it to the document root plus local storage; `Sidebar` renders a native `ThemeSelector`. CSS semantic variables remain the source of truth, with `data-theme` overrides for each palette and a media-query override for System dark mode.

**Tech Stack:** React 18, strict TypeScript, native HTML select, CSS custom properties, browser `localStorage`, Node built-in test runner.

## Global Constraints

- Use no new dependency, database migration, network call, or cloud sync.
- Store the preference under `thesis-counter-theme` in `localStorage`.
- Unknown or missing stored values resolve to `system`.
- System mode follows `prefers-color-scheme`; explicit themes ignore OS changes.
- Keep user-selected category colors unchanged.
- UI copy stays English; controls keep a minimum 44px hit target.
- Production code follows the existing strict TypeScript and semantic-token CSS patterns.

---

## File map

- Create `src/lib/theme.ts`: theme IDs, ordered option metadata, storage key,
  validation, normalization, and the small document/storage application helper.
- Create `tests/theme.test.mjs`: unit tests for theme IDs, fallback behavior,
  option order, and persistence/application behavior.
- Create `src/components/ThemeSelector.tsx`: labeled native select.
- Modify `src/App.tsx`: initialize theme state, apply/persist changes, and pass
  theme props to the sidebar.
- Modify `src/components/Sidebar.tsx`: accept theme props and render the
  selector below the brand.
- Modify `src/styles.css`: add semantic theme tokens, replace hard-coded
  structural colors, define palette overrides, and style the control.

## Theme contract

The stable IDs and display order are:

```ts
[
  'system', 'notebook', 'light', 'dark', 'dracula', 'nord',
  'solarized', 'monokai', 'one-dark', 'github', 'catppuccin', 'tokyo-night',
]
```

`ThemeOption` has `{ id: ThemeId; label: string }`. The first option is labeled
`System (auto)`; the remaining labels are `Research Notebook`, `Light`,
`Dark`, `Dracula`, `Nord`, `Solarized`, `Monokai`, `One Dark`, `GitHub`,
`Catppuccin Mocha`, and `Tokyo Night`.

## Task 1: Theme preference module and tests

**Files:**

- Create: `src/lib/theme.ts`
- Test: `tests/theme.test.mjs`

**Interfaces:**

- Produces `THEME_STORAGE_KEY`, `THEME_OPTIONS`, `ThemeId`, `isThemeId`,
  `normalizeThemePreference`, and `applyThemePreference` for later tasks.
- `normalizeThemePreference(value: string | null | undefined): ThemeId`
  returns a known ID or `system`.
- `applyThemePreference(theme: ThemeId, root: ThemeRoot, storage: ThemeStorage): void`
  sets `root.dataset.theme` and writes the same ID to the storage key.

- [ ] **Step 1: Write the failing tests.**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  applyThemePreference,
  isThemeId,
  normalizeThemePreference,
} from '../src/lib/theme.ts';

test('lists System first and keeps programmer themes in stable order', () => {
  assert.deepEqual(THEME_OPTIONS.map(({ id }) => id), [
    'system', 'notebook', 'light', 'dark', 'dracula', 'nord',
    'solarized', 'monokai', 'one-dark', 'github', 'catppuccin', 'tokyo-night',
  ]);
  assert.equal(THEME_OPTIONS[0].label, 'System (auto)');
});

test('accepts only known theme IDs', () => {
  assert.equal(isThemeId('dracula'), true);
  assert.equal(isThemeId('not-a-theme'), false);
  assert.equal(isThemeId(null), false);
});

test('falls back to System for missing or invalid preferences', () => {
  assert.equal(normalizeThemePreference(undefined), 'system');
  assert.equal(normalizeThemePreference(null), 'system');
  assert.equal(normalizeThemePreference('not-a-theme'), 'system');
  assert.equal(normalizeThemePreference('tokyo-night'), 'tokyo-night');
});

test('applies and persists a selected theme', () => {
  const root = { dataset: {} };
  const writes = [];
  const storage = { setItem: (key, value) => writes.push([key, value]) };

  applyThemePreference('nord', root, storage);

  assert.equal(root.dataset.theme, 'nord');
  assert.deepEqual(writes, [[THEME_STORAGE_KEY, 'nord']]);
});
```

- [ ] **Step 2: Run the test file and verify the expected failure.**

Run: `node --test tests/theme.test.mjs`

Expected: FAIL because `src/lib/theme.ts` does not exist yet. A module-loading
failure is expected at this red stage; do not change the test to make it pass.

- [ ] **Step 3: Implement the minimal theme module.**

```ts
export const THEME_STORAGE_KEY = 'thesis-counter-theme';

export const THEME_OPTIONS = [
  { id: 'system', label: 'System (auto)' },
  { id: 'notebook', label: 'Research Notebook' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'nord', label: 'Nord' },
  { id: 'solarized', label: 'Solarized' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'one-dark', label: 'One Dark' },
  { id: 'github', label: 'GitHub' },
  { id: 'catppuccin', label: 'Catppuccin Mocha' },
  { id: 'tokyo-night', label: 'Tokyo Night' },
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];
export type ThemeOption = typeof THEME_OPTIONS[number];
export type ThemeRoot = { dataset: { theme?: string } };
export type ThemeStorage = { setItem: (key: string, value: string) => void };

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_OPTIONS.some((option) => option.id === value);
}

export function normalizeThemePreference(value: string | null | undefined): ThemeId {
  return isThemeId(value) ? value : 'system';
}

export function applyThemePreference(
  theme: ThemeId,
  root: ThemeRoot,
  storage: ThemeStorage,
): void {
  root.dataset.theme = theme;
  storage.setItem(THEME_STORAGE_KEY, theme);
}
```

- [ ] **Step 4: Run the focused tests and verify they pass.**

Run: `node --test tests/theme.test.mjs`

Expected: 4 passing tests and no failures.

- [ ] **Step 5: Commit the tested module.**

```bash
git add tests/theme.test.mjs src/lib/theme.ts
git commit -m "feat(theme): add theme preference helpers"
```

## Task 2: Sidebar selector and application state

**Files:**

- Create: `src/components/ThemeSelector.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**

- `ThemeSelector` consumes `{ value: ThemeId; onChange: (theme: ThemeId) => void }`.
- `Sidebar` consumes `theme: ThemeId` and `onThemeChange: (theme: ThemeId) => void`.
- `App` initializes with `normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY))` and applies changes through `applyThemePreference`.

- [ ] **Step 1: Add the selector using the tested theme contract.**

```tsx
import { THEME_OPTIONS, isThemeId, type ThemeId } from '../lib/theme';

interface Props {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export default function ThemeSelector({ value, onChange }: Props) {
  return (
    <div className="theme-control">
      <label className="theme-label" htmlFor="theme-select">Appearance</label>
      <select
        id="theme-select"
        className="control theme-select"
        value={value}
        onChange={(event) => {
          if (isThemeId(event.currentTarget.value)) onChange(event.currentTarget.value);
        }}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Wire App state and sidebar props.**

In `App.tsx`, import `useEffect`, `ThemeSelector` only through `Sidebar`, and
the theme helpers. Add:

```tsx
const [theme, setTheme] = useState<ThemeId>(() =>
  normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY))
);

useEffect(() => {
  applyThemePreference(theme, document.documentElement, window.localStorage);
}, [theme]);
```

Pass `theme={theme}` and `onThemeChange={setTheme}` to `Sidebar`. In
`Sidebar.tsx`, add those required props, import `ThemeSelector`, and render
`<ThemeSelector value={theme} onChange={onThemeChange} />` immediately after
the `.brand` block and before the semester section.

- [ ] **Step 3: Run the build to verify the typed wiring.**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully. If the build reports a
prop mismatch, fix the interface/call-site types rather than weakening them.

- [ ] **Step 4: Commit the selector wiring.**

```bash
git add src/App.tsx src/components/Sidebar.tsx src/components/ThemeSelector.tsx
git commit -m "feat(theme): add sidebar theme selector"
```

## Task 3: Semantic CSS tokens and programmer palettes

**Files:**

- Modify: `src/styles.css`

**Interfaces:**

- Every existing component continues consuming names such as `--canvas`,
  `--surface`, `--ink`, `--accent`, `--focus`, and `--danger`.
- Theme selectors override semantic variables only; component selectors do not
  branch on individual theme IDs.

- [ ] **Step 1: Add derived semantic tokens to the root block.**

Add these variables beside the existing palette tokens, deriving shadows from
RGB primitives so each theme can update them without repeating every shadow:

```css
--ink-rgb: 35, 40, 36;
--accent-rgb: 23, 107, 103;
--coral-rgb: 202, 56, 81;
--focus-rgb: 23, 122, 115;
--on-accent: #fff;
--on-coral: #fff;
--on-danger: #fff;
--trail-progress: #8be1d5;
--trail-track: rgba(255, 255, 255, 0.2);
--trail-divider: rgba(255, 255, 255, 0.18);
--skeleton-highlight: rgba(255, 255, 255, 0.58);
--scrim: rgba(var(--ink-rgb), 0.52);
--category-outline: rgba(var(--ink-rgb), 0.1);
--shadow-card-soft: 0 5px 16px rgba(var(--ink-rgb), 0.06);
--shadow-hover: 0 7px 18px rgba(var(--ink-rgb), 0.12);
--shadow-card: 0 0 0 1px rgba(var(--ink-rgb), 0.05), 0 1px 2px rgba(var(--ink-rgb), 0.06), 0 10px 28px rgba(var(--ink-rgb), 0.07);
--shadow-dialog: 0 0 0 1px rgba(var(--ink-rgb), 0.08), 0 24px 70px rgba(var(--ink-rgb), 0.2);
```

- [ ] **Step 2: Replace hard-coded structural colors with variables.**

Update the existing root `color`/`background`, brand/button/trail foregrounds,
accent/coral/trail shadows, focus ring, category outline, dialog scrim,
progress colors, trail divider, and skeleton highlight to use the semantic
variables above. Keep category colors supplied by `--category-color` intact.

- [ ] **Step 3: Add explicit theme overrides.**

Add `:root[data-theme="..."]` blocks after the root token block. Every block
sets the core surface/text/accent/action/status/warning/danger/focus variables;
soft colors stay readable against that theme's surfaces. Use these palette
anchors:

| ID | Canvas / surface | Ink | Accent | Action | Status |
| --- | --- | --- | --- | --- | --- |
| `notebook` | `#f4f1eb` / `#fbfaf6` | `#232824` | `#176b67` | `#ca3851` | `#23683a` |
| `light` | `#f6f8fa` / `#ffffff` | `#1f2328` | `#0969da` | `#cf222e` | `#1a7f37` |
| `dark` | `#181a1f` / `#22252b` | `#e9edf2` | `#5b9cf6` | `#e47680` | `#5dcc8d` |
| `dracula` | `#282a36` / `#343746` | `#f8f8f2` | `#bd93f9` | `#ff79c6` | `#50fa7b` |
| `nord` | `#2e3440` / `#3b4252` | `#eceff4` | `#88c0d0` | `#bf616a` | `#a3be8c` |
| `solarized` | `#fdf6e3` / `#eee8d5` | `#586e75` | `#268bd2` | `#dc322f` | `#859900` |
| `monokai` | `#272822` / `#3e3d32` | `#f8f8f2` | `#66d9ef` | `#f92672` | `#a6e22e` |
| `one-dark` | `#282c34` / `#21252b` | `#abb2bf` | `#61afef` | `#e06c75` | `#98c379` |
| `github` | `#ffffff` / `#f6f8fa` | `#1f2328` | `#0969da` | `#cf222e` | `#1a7f37` |
| `catppuccin` | `#1e1e2e` / `#313244` | `#cdd6f4` | `#89b4fa` | `#f38ba8` | `#a6e3a1` |
| `tokyo-night` | `#1a1b26` / `#24283b` | `#c0caf5` | `#7aa2f7` | `#f7768e` | `#9ece6a` |

For each theme, set `--canvas-strong` to a visibly distinct nearby surface,
`--surface-raised` to a raised card color, `--surface-inset` to a darker or
warmer control color, and `--ink-secondary`, `--ink-tertiary`, `--ink-muted`
to progressively weaker text. Set `--accent-strong`, `--accent-soft`,
`--status-soft`, `--coral-strong`, `--coral-soft`, `--amber`, `--amber-soft`,
`--danger`, `--danger-soft`, `--focus`, `--line`, and `--line-strong` to
contrasting semantic variants of the listed anchors. Dark themes use lighter
low-opacity borders and restrained shadows; light themes use darker borders
and the existing layered shadow strategy.

Keep `:root[data-theme="system"]` on the current notebook light values and add
this dark-mode override using the same dark palette as the generic `dark`
theme:

```css
@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] {
    color-scheme: dark;
    --canvas: #181a1f;
    --canvas-strong: #2a2e36;
    --surface: #22252b;
    --surface-raised: #2d3138;
    --surface-inset: #15171b;
    --ink: #e9edf2;
    --ink-secondary: #b4bdc9;
    --ink-tertiary: #8993a0;
    --ink-muted: #737d89;
    --accent: #5b9cf6;
    --accent-strong: #86b7ff;
    --accent-soft: #263a5c;
    --coral: #e47680;
    --coral-strong: #f1989f;
    --coral-soft: #4a2930;
    --status: #5dcc8d;
    --status-soft: #263d32;
    --amber: #e6b15c;
    --amber-soft: #453824;
    --danger: #f0808a;
    --danger-soft: #4a2930;
    --focus: #78adff;
  }
}
```

Set `color-scheme: light` on the base and on light themes; set `color-scheme:
dark` on dark themes. Keep the notebook theme selectable even though System
uses the same light palette by default.

- [ ] **Step 4: Style the sidebar control.**

Add a compact 4px-grid control block matching the existing sidebar rhythm:

```css
.theme-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 8px 20px;
}

.theme-label {
  color: var(--ink-tertiary);
  font-size: 11px;
  font-weight: 750;
}

.theme-select {
  min-height: 44px;
}
```

- [ ] **Step 5: Run the build after CSS changes.**

Run: `npm run build`

Expected: TypeScript and Vite complete with no errors.

- [ ] **Step 6: Commit the semantic theme system.**

```bash
git add src/styles.css
git commit -m "style(theme): add programmer palettes"
```

## Task 4: Full verification and manual smoke test

**Files:**

- Verify: `tests/theme.test.mjs`
- Verify: `src/lib/theme.ts`, `src/components/ThemeSelector.tsx`,
  `src/App.tsx`, `src/components/Sidebar.tsx`, `src/styles.css`

- [ ] **Step 1: Run all automated tests.**

Run: `npm test`

Expected: every existing semester test and all theme tests pass.

- [ ] **Step 2: Run the production build.**

Run: `npm run build`

Expected: `tsc` and `vite build` exit 0 and produce the normal `dist` output.

- [ ] **Step 3: Smoke-test the selector in the running app.**

Run: `npm run tauri dev`

Check these exact behaviors:

1. Sidebar shows `Appearance` below the brand and the select has a 44px hit
   area.
2. Selecting Dracula, Nord, Tokyo Night, Light, and Research Notebook changes
   the canvas, surfaces, text, buttons, focus ring, dialog, and Research Trail.
3. Reloading preserves the last explicit selection.
4. Selecting `System (auto)` persists `system`; changing OS appearance updates
   the app palette without restarting when the host supports it.
5. Category swatches keep their stored colors, and semester/session behavior is
   unchanged.
6. Keyboard focus reaches the select, its label remains visible, and the
   selected theme is communicated by option text rather than color alone.

## Self-review checklist

- Spec coverage: selector placement, 12 options, System media behavior,
  persistence, semantic-token scope, accessibility, no dependency, tests, and
  smoke checks all map to Tasks 1–4.
- Plan completeness: every task names files, signatures, commands, and
  expected output; no unfilled implementation step is required.
- Type consistency: `ThemeId` comes from `THEME_OPTIONS`; the same type flows
  through `ThemeSelector`, `Sidebar`, `App`, and `applyThemePreference`.
- Scope: no SQLite or session code changes; category colors remain data-owned.
