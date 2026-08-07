# Thesis Research Counter

Personal desktop app for tracking thesis research hours by semester.

## Features

- Track work sessions per semester.
- Set registered credits per semester; weekly target auto-calculated as `credits × 3` hours.
- In-app start/stop timer plus manual session entry.
- View weekly progress, semester totals, and category breakdowns.
- Export sessions to CSV.
- Week starts on Monday.

## Tech Stack

- [Tauri v2](https://tauri.app/) — Rust backend, native desktop wrapper
- React + TypeScript frontend
- [tauri-plugin-sql](https://v2.tauri.app/plugin/sql/) — SQLite database
- Vite build tool

## Development

```bash
# Install dependencies
npm install

# Run dev app
npm run tauri:dev

# Type-check
npx tsc --noEmit

# Build release bundle (creates .dmg on macOS)
npm run tauri:build
```

## Project Layout

```
src/                  # React frontend
  App.tsx
  db.ts               # SQLite access helpers
  types.ts            # Shared TypeScript types
  lib/                # date, csv helpers
  components/         # UI components
src-tauri/            # Rust backend
  src/main.rs         # Migrations and app bootstrap
  Cargo.toml
  tauri.conf.json
docs/superpowers/     # Design spec and implementation plan
```

## Data Storage

SQLite database lives in the Tauri app data directory, typically:

```
~/Library/Application Support/com.yourname.thesis-counter/
```

## License

Personal use only.
