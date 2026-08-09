# Thesis Counter Interface System

## Direction and Feel

Thesis Counter should feel like a focused research notebook: warm, calm, precise, and encouraging without becoming playful or decorative. It serves one graduate student who needs to start focused work quickly, understand weekly progress, and adjust semester settings without losing context.

Domain cues include research notebooks, annotated papers, semester arcs, weekly cadence, credit requirements, evidence, milestones, and focused work blocks.

The physical color world is warm paper, cream cards, charcoal pencil, teal book cloth, green leaves, coral highlighter, and amber notes. Purple is not a structural UI color. User-selected category colors may include any hue, but they remain confined to data marks, swatches, and labels.

The signature element is the **Research Trail**: a deep-teal progress surface combining weekly hours, required hours, semester dates, and time remaining. It should remain visually distinct from generic metric-card grids.

Reject these defaults:

- Equal dashboard cards; lead with the current task or Research Trail instead.
- One accent color for actions, navigation, progress, and status; assign color by meaning.
- Bright white SaaS canvas; use layered warm-paper surfaces.

## Color Tokens

Use the semantic tokens in `src/styles.css` as the source of truth.

| Role | Token | Value |
| --- | --- | --- |
| Canvas | `--research-paper` | `#f4f1eb` |
| Primary ink | `--annotation-ink` | `#232824` |
| Strong canvas | `--canvas-strong` | `#e9e4da` |
| Surface | `--surface` | `#fbfaf6` |
| Raised surface | `--surface-raised` | `#fffdf8` |
| Inset control | `--surface-inset` | `#eeeae1` |
| Secondary text | `--ink-secondary` | `#4f5953` |
| Tertiary text | `--ink-tertiary` | `#66716a` |
| Teal accent | `--momentum-teal` | `#176b67` |
| Strong teal | `--accent-strong` | `#105450` |
| Soft teal | `--accent-soft` | `#dceee9` |
| Active green | `--active-leaf` | `#23683a` |
| Soft active green | `--status-soft` | `#e0f1e5` |
| Coral action | `--highlighter-coral` | `#ca3851` |
| Strong coral | `--coral-strong` | `#ad2f45` |
| Warning | `--amber` | `#9b580b` |
| Danger | `--danger` | `#b4233a` |
| Focus | `--focus` | `#177a73` |

Color rules:

- Coral marks the single primary action in a view.
- Teal marks navigation, information, progress, and the Research Trail.
- Green marks active or positive status, including the active-semester dot.
- Amber marks time-sensitive or manual metadata.
- Red marks destructive actions and errors.
- Use a neutral charcoal scrim derived from annotation ink at about 52% opacity; never tint overlays purple.
- Keep most of each screen neutral. Accent color should remain scarce and meaningful.

## Depth and Surfaces

Use subtle layered shadows. Cards should feel placed on paper, not floating dramatically.

- Canvas and sidebar share the same background; a low-opacity divider separates them.
- Cards use `--surface` plus `--shadow-card`.
- Important work surfaces may use `--surface-raised`.
- Inputs use the darker `--surface-inset` to read as receptive controls.
- Dialogs use `--surface-raised` plus `--shadow-dialog`.
- Borders use neutral ink alpha: `--line` for standard separation and `--line-strong` for controls or emphasis.
- Do not mix heavy borders, glass blur, gradients, or dramatic shadows into this system.

Radius scale:

- Controls: `10px`.
- Cards: `16px`.
- Large panels and dialogs: `20px`.
- Pills and progress tracks: fully rounded.

## Spacing and Density

Use a 4px base grid.

- Micro spacing: `4–8px`.
- Control and component spacing: `12–16px`.
- Card and section gaps: `20–24px`.
- Major workspace spacing: `28–32px`.
- Standard control height: at least `44px`.
- Standard panel padding: `22–24px`.
- Timer card and dialog padding: `26px` at desktop widths.
- Sidebar width: `248px`; navigation supports content rather than competing with it.

Related controls should stay compact. Content groups should have visibly more space between them than inside them.

## Typography and Hierarchy

Primary stack: `Avenir Next`, `SF Pro Display`, `Segoe UI`, then `sans-serif`. Numeric timers and dense values use `SFMono-Regular`, `Menlo`, `Consolas`, then `monospace`.

Use weight and color before adding more sizes:

- Eyebrow and metadata: `10–12px`, weight `700–800`, tertiary ink, tracking where uppercase.
- Supporting labels: `12–13px`, weight `600–750`, secondary or tertiary ink.
- Body and controls: `14–16px`, weight based on importance.
- Panel title: `18px`.
- Section title: `22px`.
- Page title: `24–30px`, weight `750`, tight tracking.
- Research Trail value: `40px`, weight `750`, tabular numbers.
- Timer: `42–66px`, weight `650`, tabular numbers, tight tracking.

Every screen has one focal point:

- Focus: timer and Start/Stop action.
- Sessions: session-entry form, then history.
- Insights: Research Trail and recorded-hours total.
- Categories: creation form when empty; category list when populated.
- Semester management: dialog title and Save action; destructive controls stay separate.

## Reusable Component Patterns

### Buttons

- Base: minimum `44px` height, `10px 16px` padding, `10px` radius, `14px/750`, `8px` icon gap.
- Primary: coral background, white text, strong-coral hover.
- Accent: teal background, white text, strong-teal hover.
- Secondary: raised surface, inset border, secondary ink; soft-teal hover.
- Danger: danger background and white text.
- Icon-only: `44×44px`, `11px` radius, mandatory accessible label and title.
- Pressed feedback: `scale(0.97)` over `120ms`.

### Fields

- Persistent `12px/750` label.
- Control: minimum `44px`, `10px 12px` padding, inset surface, `10px` radius.
- Focus: teal border plus a 3px soft-teal ring.
- Helper or field error: `11px`, line-height `1.45`.
- Operation errors remain separate inline alerts.

### Navigation

- Navigation rail sits on `--canvas-strong` with `5px` inset padding and `14px` radius.
- Navigation buttons are at least `44px`, `9px 14px` padding, and `10px` radius.
- Active navigation uses a raised surface, strong-teal text, and a quiet shadow.

### Panels and Research Trail

- General panel: `22px` padding, `16px` radius, subtle layered shadow.
- Research Trail: `24px` padding, deep-teal surface, white text, mint progress value, and restrained teal shadow.
- Timer card: `26px` padding and raised surface. Running state uses coral emphasis without changing layout.
- Dynamic values always use tabular numbers.

### Dialogs

- Maximum standard width: `500px`; destructive confirmation width: `420px`.
- Desktop padding: `26px`; radius: `20px`.
- Dialogs must trap focus, close on Escape when idle, support scrim dismissal for non-destructive forms, and return focus to their opener.
- Submission disables duplicate actions and shows `Saving…` or equivalent progress text.

### Status

- Pills have at least `24px` height and `3px 9px` padding.
- Active semester uses active green text and dot on a soft-green background.
- Status meaning must include text; never rely on color alone.

## Motion

- Standard transitions: `150–220ms` with `cubic-bezier(0.23, 1, 0.32, 1)`.
- View entrance may use opacity plus a `6px` upward settle over `240ms`.
- Dialog entrance may use opacity plus `translateY(8px) scale(0.97)` over `220ms`.
- Do not animate layout properties.
- `prefers-reduced-motion` removes transforms and entrances while preserving visible state changes.

## Responsive Rules

- At `840px` and below, convert the sidebar into a full-width top region.
- At `600px` and below, stack heading groups, forms, and dialog grids; navigation becomes a 2-column grid.
- Preserve 44px hit targets and prevent horizontal scrolling at `375px`.
- Desktop Tauri layout remains primary; narrow layouts provide resilience rather than a separate mobile product.

## Accessibility Guardrails

- Normal text meets WCAG AA `4.5:1`; large text and UI graphics meet `3:1`.
- Every control has visible focus styling.
- Icon-only actions require accessible labels and tooltips/titles.
- Alerts use `role="alert"`; status feedback uses polite live regions when non-urgent.
- Color never carries active, error, category, or destructive meaning alone.
- Native semantic controls remain the first choice. Add no UI dependency unless the existing native pattern cannot meet the behavior contract.

## Reference Note

No external image or UI reference shaped this system. It was derived from the approved Research Studio direction and the implemented local interface.
