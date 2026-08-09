# Semester Editing and Color Refresh — Design Spec

## Goal

Let the user edit every semester field after creation, make credit changes immediately affect research targets and statistics, and replace the purple-heavy presentation with a warmer, clearer visual system.

## Root Cause

The database already exposes `updateSemester`, and `SemesterForm` already accepts an optional semester. The active UI never passes a semester into the form and always calls `createSemester`, so no edit path is reachable. The current palette also uses indigo for the app mark, add button, navigation, badges, focus rings, progress panels, empty states, and informational states. Repetition makes unrelated meanings look identical; the active-semester dot inherits the same purple color.

## Approved Interaction

The selected semester header gains a labeled **Edit semester** button beside the active status. This is more discoverable than a sidebar pencil and less hidden than an overflow menu. Delete remains in the sidebar so the common edit action and destructive action stay separated.

Selecting **Edit semester** opens the existing semester modal with the selected semester's name, start date, end date, and registered credits. Edit mode uses the title **Edit semester** and submit label **Save changes**. Create mode keeps **Create a semester** and **Create semester**.

After a successful update, the modal closes and the refreshed semester becomes the selected semester. The sidebar metadata, workspace header, weekly target, and semester statistics update from the new object without restarting the app. Cancel, Escape, and scrim dismissal leave stored values unchanged. Focus returns to the control that opened the modal.

## Credit UX

The credit field accepts temporary empty input while typing instead of forcing `1` on every keystroke. Submission requires a whole number of at least 1. A live helper summarizes the effect, for example, **6 credits = 18 required research hours per week**. Invalid credits or reversed dates produce field-specific guidance without closing the modal.

No shortcut presets, autosave, edit history, or unsaved-change warning are added. The modal is small, explicit, and reversible until Save.

## Visual Direction

The approved palette is warm neutral with teal/green status and coral actions:

- Canvas: warm paper rather than lavender.
- Surfaces: cream and near-white layers.
- Text: charcoal with neutral gray secondary text.
- Navigation and informational accent: deep teal.
- Active and positive status: green with a pale green background.
- Primary actions: coral, retained for the single main action.
- Warning and destructive states: amber and red.
- Focus ring: accessible teal.

Purple is removed from structural UI. Existing CSS tokens are renamed or remapped to semantic roles so navigation, progress, action, and status do not share one color by accident. The Research Trail becomes deep teal, active navigation uses teal, and the **Active semester** badge uses a green dot and pale green surface. Category colors remain user-controlled data marks.

The layout, spacing, typography, shadows, motion, and component radii remain stable. This limits visual churn while improving meaning and contrast.

## Component and Data Flow

- `App` coordinates edit requests between the workspace header and sidebar-owned semester data.
- `Tabs` renders the edit trigger and sends an edit request for the selected semester.
- `Sidebar` opens the shared form in create or edit mode, calls `createSemester` or `updateSemester`, reloads the semester list, and publishes the refreshed selected object through `onSelect`.
- `SemesterForm` derives mode-specific copy from its optional semester, validates inputs, and emits the same `SemesterInput` contract in both modes.
- Existing stats components continue receiving `semester` as a prop, so refreshed credits automatically recalculate required hours through existing queries.

The SQLite schema and migrations do not change. Dates remain ISO 8601 strings, credits remain stored on the semester row, and all work remains local-only.

## Loading and Error Behavior

Save is disabled while a create or update is running. A failed update keeps the modal open, preserves entered values, and shows **Could not update the semester. Check the fields and try again.** A failed list refresh does not claim success. Existing delete confirmation behavior remains unchanged.

The edit trigger has a visible label, a 44px minimum target, keyboard focus styling, and an icon that is not the only source of meaning. Modal labels, helper associations, alert semantics, Escape behavior, and focus trapping remain accessible.

## Verification

- Prove create mode still inserts and edit mode calls the update path.
- Edit name, dates, and credits; confirm sidebar and header refresh immediately.
- Confirm a credit change updates the weekly required-hours value and progress calculation.
- Confirm invalid credits and reversed dates cannot save.
- Confirm Cancel, Escape, and failed saves preserve stored data and focus behavior.
- Run the TypeScript/Vite production build.
- Smoke-test semester create, select, edit, and delete in the Tauri app.
- Inspect desktop and narrow layouts for clipping, keyboard focus, readable contrast, and removal of unintended purple UI.

## Out of Scope

No schema migration, cloud sync, authentication, semester duplication, archive state, credit history, notifications, remote fonts, analytics, or new third-party dependency is included.
