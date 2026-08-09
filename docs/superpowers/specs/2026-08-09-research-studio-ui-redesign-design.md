# Research Studio UI Redesign — Design Spec

## Goal

Transform the plain white Thesis Research Counter into a colorful, modern
desktop workspace while preserving its local-only data model and current
tracking workflows.

## Product Intent

- **Human:** One graduate student moving between reading, writing,
  experiments, and meetings during a semester.
- **Primary task:** Start a research session quickly, then understand whether
  the current week and semester are on track.
- **Feeling:** Energetic enough to invite daily use, calm enough for focused
  academic work, and visually specific to thesis progress rather than a
  generic business dashboard.

## Design Direction: Research Studio

### Domain Exploration

- **Domain concepts:** research notebook, semester arc, weekly cadence,
  annotated time blocks, credits, categories, milestones, and evidence of
  progress.
- **Color world:** indigo annotation ink, coral highlighter, teal progress,
  amber sticky tabs, lavender paper, graphite text, and soft cloud surfaces.
- **Signature:** a “Research Trail” that connects weekly target, current
  progress, semester dates, and days remaining in one compact visual band.
- **Rejected defaults:**
  - Generic equal metric cards become an asymmetric, task-led composition.
  - Plain top tabs become a labeled navigation rail with consistent SVG
    icons and a strong active state.
  - A generic percentage bar becomes the Research Trail plus visible numeric
    values.

### Visual System

- **Canvas:** tinted lavender-cloud background, never pure white.
- **Primary accent:** indigo for navigation, focus, and selected state.
- **Action accent:** coral for the single primary action on each view.
- **Progress color:** teal for positive progress and completed states.
- **Supporting color:** amber for time-sensitive metadata or warnings.
- **Category colors:** user-selected category colors remain visible only in
  data marks, swatches, and labels; they do not become structural UI colors.
- **Text:** graphite primary, slate secondary, muted violet-gray metadata.
- **Depth:** subtle layered shadows with low-opacity tinted rings. Avoid glass
  blur, heavy borders, and dramatic shadows.
- **Radius scale:** 10px controls, 16px cards, 20px large panels or dialogs.
- **Spacing:** 4px base grid; 8px micro, 12–16px component, 24px section, and
  32px major spacing.
- **Typography:** local system stack only—`Avenir Next`, `SF Pro Display`,
  `Segoe UI`, then `sans-serif`. Timer and dense numeric values use
  `SFMono-Regular`, `Menlo`, then `monospace`. No remote font request.
- **Type hierarchy:** 12px metadata, 14px labels, 16px body, 20px section
  titles, 28px page title, and a 56–64px timer. Weight and color provide
  secondary hierarchy.
- **Motion:** 150–220ms transform/opacity/color transitions, button press at
  `scale(0.97)`, and one short content entrance per view. Reduced-motion
  removes transforms and entrances.

## App Structure

The app remains one React/Tauri window with the same SQLite queries and
component data ownership. Presentation is reorganized into:

1. A 248px desktop sidebar containing identity, semester selection, and the
   add-semester action.
2. A main workspace header showing the selected semester, its dates and
   credits, plus primary navigation.
3. A scrollable content region whose layout changes per destination.

At widths below 840px, the sidebar collapses into a compact top semester
switcher and navigation wraps without horizontal scrolling. The Tauri desktop
window remains the primary target; narrow layouts are a resilience feature,
not a separate mobile product.

## Navigation

The existing destinations remain:

- Focus (renamed from Timer in visible copy only)
- Sessions
- Insights (renamed from Stats in visible copy only)
- Categories

Each destination uses a consistent inline SVG icon plus text. Navigation uses
native buttons with `aria-pressed` and a visible focus ring. Changing semester
does not reset the active destination.

## Screen Designs

### Empty App

When no semester exists, the content area shows a focused onboarding panel:
“Create your first semester,” a short explanation of the credit-to-hours rule,
and one primary create action. It must not show a blank paragraph.

### Focus

The timer is the screen focal point.

- Large timer card with category selector, elapsed time, optional note, and
  one Start or Stop action.
- Category must be selected before Start; the disabled state remains obvious.
- Running state changes the card border/status label and makes Stop the sole
  primary action without moving surrounding layout.
- A compact Research Trail sits beside or below the timer when progress data
  is available. The redesign may add read-only stats queries to this view, but
  timer start/stop and saved-session behavior remain unchanged.
- Save failures appear in an inline alert region with a recovery message;
  console logging may remain for diagnostics.

### Sessions

- A compact “Log session” panel groups date, start, end, category, and note
  under persistent labels.
- The submit action reads “Add session.”
- History uses a responsive table on wide windows and stacked rows on narrow
  windows.
- Duration uses tabular numbers. Category is shown with a colored dot and
  text, never color alone.
- Delete uses a labeled icon button and requires confirmation before removal.
- Empty history explains how to create the first session.
- Invalid or failed submissions show an inline message near the form.

### Insights

- Research Trail leads the view with current weekly hours, required hours,
  percentage, semester dates, and days remaining.
- Semester summary presents total hours as the hero value; sessions and
  average weekly hours are supporting inline metrics rather than equal cards.
- Category breakdown uses horizontal proportional bars with visible names,
  hours, and percentages. It remains readable without color.
- CSV export is a secondary action in the header.
- Empty statistics state gives a clear route back to Focus or Sessions.

### Categories

- Creation form uses labeled name and color controls with one Add category
  action.
- Existing categories appear as compact swatch rows/cards with name and
  actions.
- Deletion requires confirmation. Database constraint failures display an
  inline explanation that used categories cannot be deleted.

### Semester Management

- Add semester opens a modal dialog rather than expanding inside the sidebar.
- All fields have persistent labels and helper copy for credits: “1 credit = 3
  required hours per week.”
- Save and Cancel are clear escape routes. Escape closes the dialog when no
  submission is running.
- Delete is spatially separated from selection and requires confirmation.
- The existing data contract remains name, start date, end date, and credits.

## Shared Components and Tokens

Implementation should introduce a small local UI layer rather than new
dependencies:

- `Icon` components built from inline SVG with consistent 1.75–2px strokes.
- `Button` styles for primary, secondary, quiet, and destructive actions.
- `Field` structure for label, control, helper text, and error.
- `ProgressBar` with numeric label and accessible value attributes.
- `EmptyState` for semester, session, insight, and category emptiness.
- Semantic CSS custom properties for canvas, surfaces, text hierarchy,
  accents, borders, controls, focus, radii, shadows, spacing, and motion.

Native HTML remains the first choice for buttons, inputs, selects, tables,
progress semantics, and dialogs. No new component or icon package is required.

## Accessibility and Interaction

- Normal text meets WCAG AA 4.5:1 contrast; large text and UI graphics meet
  3:1.
- All actionable controls have at least a 44×44px hit area.
- Every icon-only action has an accessible label and visible tooltip/title.
- Keyboard order follows visual order, and all controls show a 2–3px focus
  ring.
- Color never carries category, success, warning, or destructive meaning
  alone.
- Async actions disable duplicate submission and expose progress text.
- Alerts use `role="alert"`; non-urgent success/status feedback uses
  `aria-live="polite"`.
- `prefers-reduced-motion: reduce` removes movement while retaining state
  visibility.
- The layout must not create horizontal scrolling at 375px or at the normal
  Tauri window size.

## Data Flow and Scope

- Existing database schema, migrations, and SQL functions remain unchanged
  unless a read-only query is needed to place existing stats in the Focus
  view.
- Existing session, category, semester, and CSV behaviors remain local-only.
- Dates remain ISO 8601 in SQLite, duration remains stored in minutes, and the
  week continues to start Monday.
- No authentication, network calls, cloud sync, telemetry, remote fonts, or
  dependencies that phone home.
- This redesign does not add notifications, streaks, advanced charts, or new
  tracking rules.

## Error, Loading, and Empty States

- Initial data loads show shaped skeleton blocks if they exceed a perceptible
  delay; layout space remains reserved.
- Query errors produce a concise inline panel with Retry when the operation is
  safe to repeat.
- Form errors stay next to the relevant form or field and explain recovery.
- Destructive failures leave the item visible and explain why deletion failed.
- Every list/data view has a useful empty message plus the action that resolves
  it.

## Verification

- Run the TypeScript/Vite production build.
- Smoke-test semester create/select/delete, category create/delete failure,
  timer start/stop, manual session creation/deletion, stats display, and CSV
  export.
- Visually inspect Focus, Sessions, Insights, Categories, empty state, running
  timer, and semester dialog at normal desktop width and 375px.
- Verify keyboard navigation, focus visibility, form labels, disabled states,
  destructive confirmations, reduced motion, and no horizontal overflow.
- Confirm no remote requests or new network-capable dependencies were added.
