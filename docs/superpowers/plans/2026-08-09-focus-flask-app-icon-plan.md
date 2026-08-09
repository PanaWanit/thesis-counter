# Focus Flask App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate the approved Focus Flask master artwork, replace the Tauri
platform icon set, and verify the macOS application bundle.

**Architecture:** Use the built-in image generator for one 1024×1024
vector-like source on a flat chroma-key background. Remove the key locally,
validate alpha and small-size legibility, then use the Tauri CLI icon generator
as the deterministic source of all platform icon sizes.

**Tech Stack:** Built-in image generation, PNG/RGBA, Pillow-based chroma-key
helper, Tauri v2 icon generator, macOS app/DMG bundler.

## Global Constraints

- Use the approved Focus Flask concept and Research Studio palette.
- No text, watermark, remote logo, decorative scene, or extra symbol.
- Keep a strong flask silhouette at 16px.
- Save the final master inside the repository.
- Replace only generated icon assets under `src-tauri/icons/`.
- Do not add runtime dependencies or network calls to the application.

---

### Task 1: Generate and Extract the Master Icon

**Files:**
- Create: `assets/app-icon-master-keyed.png`
- Create: `assets/app-icon-master.png`

**Interfaces:**
- Produces a 1024×1024 transparent RGBA master consumed by Task 2.

- [x] **Step 1: Generate the keyed source**

Use the built-in image generator with this production prompt:

```text
Use case: logo-brand
Asset type: macOS and desktop application icon master
Primary request: original “Focus Flask” app icon combining a laboratory flask,
a minimal clock hand, and a rising progress fill
Scene/backdrop: perfectly flat solid #00FF00 chroma-key background, uniform to
every edge with no shadows, gradients, texture, reflections, floor, or lighting
variation
Subject: centered macOS-style rounded-square indigo tile; one warm-ivory flask
with a short neck, broad shoulders, stable vessel, coral timer hub plus one
hand, and a solid teal lower-third liquid fill ending in one clean upward curve
Style/medium: flat vector-like brand mark, friendly geometric shapes, subtle
macOS depth limited to one soft tile shadow and restrained inner highlight
Composition/framing: square 1:1, tile and flask optically centered, generous
padding, all important geometry within an 18 percent safe margin
Color palette: tile #4F46E5, flask #FFF9F2, timer #CA3851, liquid #0F8074
Constraints: strong silhouette readable at 16px; thick shapes and gaps; no
#00FF00 inside the icon; no cast shadow outside the tile; no text; no letters;
no numerals; no tick marks; no bubbles; no sparkles; no glass refraction; no
texture; no complex gradients; no watermark; no trademark resemblance
Avoid: photorealism, thin lines, tiny detail, background scene, multiple icons,
mockup presentation, device frame
```

- [x] **Step 2: Copy the source into the repository**

Copy the selected built-in output to `assets/app-icon-master-keyed.png` without
altering the generated pixels.

- [x] **Step 3: Remove the chroma key**

Run:

```bash
python /Users/pnawn/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py \
  --input assets/app-icon-master-keyed.png \
  --out assets/app-icon-master.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

- [x] **Step 4: Validate the master**

Confirm exactly 1024×1024 pixels, RGBA mode, transparent corners, non-empty
subject coverage, and no visible key-color fringe. Inspect the full-size icon.

---

### Task 2: Validate Small Sizes and Generate Tauri Icons

**Files:**
- Create: `assets/icon-previews/app-icon-16.png`
- Create: `assets/icon-previews/app-icon-32.png`
- Create: `assets/icon-previews/app-icon-64.png`
- Modify: `src-tauri/icons/*`
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**
- Consumes `assets/app-icon-master.png`.
- Produces Tauri desktop/mobile icons, including PNG, ICO, and ICNS formats.

- [x] **Step 1: Render small-size previews**

Use Pillow with Lanczos resampling to render 16px, 32px, and 64px preview PNGs
inside `assets/icon-previews/`.

- [x] **Step 2: Inspect small-size legibility**

Verify the 16px preview reads as one flask on an indigo tile, the coral hand is
still visible, the teal fill remains distinct, and no edge fringe appears.

- [x] **Step 3: Regenerate the Tauri icon set**

Run:

```bash
npm run tauri -- icon assets/app-icon-master.png
```

Expected: Tauri replaces the platform PNGs, `icon.ico`, and `icon.icns` under
`src-tauri/icons/` without changing application source code.

- [x] **Step 4: Inspect representative outputs**

Open `src-tauri/icons/32x32.png`, `src-tauri/icons/128x128.png`, and
`src-tauri/icons/icon.png`; compare silhouette, colors, transparency, and edge
quality with the master.

- [x] **Step 5: Configure the bundle icon sources**

Set `bundle.icon` in `src-tauri/tauri.conf.json` to the generated 32px, 128px,
256px, ICNS, and ICO files so each platform bundler receives its native icon.

---

### Task 3: Build and Verify the Application Bundle

**Files:**
- Verify: `src-tauri/target/release/bundle/macos/Thesis Counter.app`
- Verify: `src-tauri/target/release/bundle/dmg/Thesis Counter_0.1.0_aarch64.dmg`

**Interfaces:**
- Consumes the regenerated icon set through the explicit Tauri bundle icon
  configuration.

- [x] **Step 1: Run source checks**

Run `git diff --check` and confirm only icon assets, the icon master/previews,
and this plan changed.

- [x] **Step 2: Build the frontend**

Run: `npm run build`

Expected: strict TypeScript and Vite exit 0.

- [x] **Step 3: Build macOS app and DMG**

Run:

```bash
npm run tauri -- build -v --bundles app dmg
```

Expected: `.app` and `.dmg` bundles finish successfully with the new ICNS.

Confirm `Contents/Resources/icon.icns` exists in the macOS app and its
`Info.plist` declares `CFBundleIconFile`.

- [x] **Step 4: Commit the icon update**

Stage the plan, master, previews, and regenerated Tauri icon files. Commit with:

```bash
git commit -m "feat(icon): add Focus Flask app icon"
```
