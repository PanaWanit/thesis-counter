# Theme Selection Design

## Goal

Add a persistent theme selector to Thesis Counter. The selector must include a
System/auto option that follows the operating system's light/dark preference,
plus a useful set of familiar programmer themes.

## Approved direction

The selector lives directly below the sidebar brand as a labeled native
`select`. This keeps the control discoverable without adding a settings modal
or a new navigation surface. It uses the existing semantic form-control
patterns and retains a minimum 44px hit target.

The theme options are:

- System (auto)
- Research Notebook
- Light
- Dark
- Dracula
- Nord
- Solarized
- Monokai
- One Dark
- GitHub
- Catppuccin Mocha
- Tokyo Night

## Visual direction

The person using this app is a graduate researcher moving between focused work
and progress review. Theme changes should make long research sessions more
comfortable while preserving the app's clear, precise notebook/workbench feel.

- Domain cues: research notebook, annotated papers, weekly cadence, semester
  arc, focus blocks, evidence, and milestones.
- Color world: paper, graphite ink, book-cloth teal, highlighter coral, leaves,
  amber notes, and familiar editor palettes.
- Signature: the existing Research Trail remains the dominant progress surface;
  theme changes recolor its semantic tokens rather than flattening its role.
- Rejected defaults: no custom dropdown implementation, no theme dependency,
  no database setting, and no separate color treatment for user category data.

## Behavior

1. On startup, read `thesis-counter-theme` from `localStorage`.
2. Accept only known theme IDs; invalid or missing values fall back to
   `system`.
3. Apply the selected ID to `document.documentElement.dataset.theme`.
4. Persist every user selection immediately.
5. `system` uses CSS `prefers-color-scheme` media queries, so OS light/dark
   changes apply without restarting the app.
6. Explicit themes do not react to OS changes.
7. Theme changes are visual only. SQLite data, session calculations, and
   user-selected category colors are unchanged.

## Architecture

- `src/lib/theme.ts` owns the theme ID union, ordered option metadata, storage
  key, and pure preference-normalization helpers.
- `src/components/ThemeSelector.tsx` renders the labeled native select and
  reports changes through a typed callback.
- `src/App.tsx` owns the selected theme state, applies the document attribute,
  and persists it.
- `src/styles.css` keeps the existing semantic token names and adds theme
  overrides using `data-theme` selectors. Shared component rules continue to
  consume semantic variables.
- Theme tokens cover canvas/surfaces, four text levels, accent/status/action
  colors, focus/error states, border contrast, shadows, and Research Trail
  foreground/progress colors. Hard-coded structural colors that prevent a
  theme from reading correctly are replaced with semantic tokens.

No new dependency or database migration is needed.

## Accessibility and states

- Use a real `<label>` and native `<select>`; no div-based menu.
- Preserve visible focus styling from the existing design system.
- The control has a clear label: `Appearance`.
- Option text carries the theme name; color is never the only indicator.
- Theme switching does not animate layout. Existing reduced-motion behavior
  remains respected.

## Testing and verification

- Add unit tests for known-theme acceptance, invalid-value fallback, and the
  ordered option list including System.
- Run the existing Node test suite and `npm run build`.
- Smoke-test selecting several light/dark themes, reload persistence, and
  System mode while changing the OS appearance setting when available.
- Confirm category swatches, forms, dialogs, focus rings, and Research Trail
  remain readable across representative light and dark themes.
