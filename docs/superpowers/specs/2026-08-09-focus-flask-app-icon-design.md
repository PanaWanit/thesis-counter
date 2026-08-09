# Focus Flask App Icon — Design Spec

## Goal

Create a distinctive, legible app icon for Thesis Counter that connects the
Research Studio identity with the product’s core action: tracking focused
research time.

## Concept

The icon is a “Focus Flask”: a laboratory flask combined with a minimal clock
and progress cue.

- The flask communicates research and experimentation.
- The timer hand communicates tracked time.
- Teal liquid rising along a simple arc communicates accumulated progress.
- The mark uses no letters or words.

## Composition

- Square 1024×1024 master canvas.
- Centered macOS-style rounded-square tile with generous transparent corners.
- Main flask occupies roughly 58% of the tile width and 62% of its height.
- Flask silhouette is immediately recognizable: short neck, strong shoulders,
  broad vessel, and stable base.
- A single coral timer hand and hub sit inside the upper body of the flask.
- Teal liquid fills the lower third of the flask and terminates in one clean
  upward progress curve.
- Optical center sits slightly above geometric center so the vessel feels
  balanced in the Dock.
- All important geometry stays inside an 18% safe margin.

## Visual Style

- Flat, vector-like construction with a strong silhouette.
- Subtle macOS depth only: one soft tile shadow and restrained inner highlight.
- No photorealism, glass refraction, tiny bubbles, texture, decorative sparkles,
  thin hairlines, or complex gradients.
- Rounded joins and confident shapes match the friendly Research Studio UI.
- The icon must remain recognizable in monochrome silhouette.

## Palette

- Tile: Research Studio indigo `#4F46E5`, with a slightly deeper edge tone only
  if required for depth.
- Flask: warm ivory `#FFF9F2`, not pure white.
- Timer: highlighter coral `#CA3851`.
- Progress liquid: momentum teal `#0F8074`, with a lighter teal highlight
  permitted for separation.
- Exterior: transparent.

The flask, timer, and liquid must each remain distinguishable without relying
on subtle tonal differences.

## Small-Size Requirements

- At 16px, the icon must still read as one flask on an indigo tile.
- The timer simplifies to a coral hub plus one hand; no clock numerals or tick
  marks.
- The liquid uses one solid teal mass; no small bubbles.
- Minimum rendered stroke or gap at the 1024px master is 28px so it survives
  downscaling.
- The 32px and 64px PNGs must have clean antialiased edges and no chroma fringe.

## Production Workflow

1. Generate a 1024×1024 vector-like source on a perfectly flat chroma-key
   background.
2. Remove the chroma key locally to create a transparent PNG master.
3. Inspect the master at full size and at 16px, 32px, 64px, 128px, and 512px.
4. Save the master as `assets/app-icon-master.png`.
5. Use the Tauri icon generator to replace the platform icon set under
   `src-tauri/icons/`.
6. Build the macOS app and DMG to verify the generated ICNS and bundled icon.

## Acceptance Criteria

- Original Focus Flask mark with no third-party logo resemblance.
- No text, watermark, extra symbols, or background scene.
- Transparent corners and no green/magenta chroma fringe.
- Strong flask silhouette at 16px.
- Research Studio indigo, coral, teal, and ivory remain consistent with the UI.
- All Tauri-required desktop icon files regenerate successfully.
- Production frontend and Tauri macOS bundle build successfully.
