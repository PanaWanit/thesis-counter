# Project Guide — Thesis Research Counter

## Project
Personal Tauri desktop app for tracking thesis research hours by semester.

## Tech Stack
- Tauri v2 (Rust backend)
- React + TypeScript frontend
- SQLite via `tauri-plugin-sql`
- Tailwind CSS (optional, keep simple)

## Build Commands
```bash
# Install frontend dependencies
npm install

# Run dev app
npm run tauri dev

# Build release bundle
npm run tauri build
```

## Conventions
- Keep code minimal; this is single-user, local-only.
- Use TypeScript strictly (`strict: true`).
- Store dates in ISO 8601 strings in SQLite.
- Compute stats in SQL when possible; store `duration_minutes` on each session.
- Week starts on Monday.
- UI text in English unless user asks otherwise.

## Database
- SQLite file lives in the Tauri app data directory.
- Migrations run automatically on app start.

## Testing
- TDD not required.
- Smoke-test critical paths manually after changes.

## Security
- No authentication, no network calls, no cloud sync.
- Do not add dependencies that phone home.

## Communication Style
- User prefers caveman/ultra-terse mode unless they say otherwise.
- Code comments and docs stay normal prose.
