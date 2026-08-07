# Thesis Research Counter — Design Spec

## Purpose
Personal desktop app for tracking thesis research hours per semester, based on registered credits. Shows useful progress stats and keeps a record of what was done.

## Platform
- macOS (Apple Silicon M1)
- Single-user, local-only, no authentication

## Tech Stack
- **Framework:** Tauri v2 (Rust + WebKit)
- **Frontend:** React + TypeScript
- **Storage:** SQLite via `tauri-plugin-sql`
- **DB location:** `~/Library/Application Support/thesis-stats/data.sqlite`

## Data Model

### `semesters`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoincrement |
| name | TEXT | e.g. "Semester 1/2026" |
| start_date | TEXT (ISO date) | inclusive |
| end_date | TEXT (ISO date) | inclusive |
| credits | INTEGER | registered credits |
| created_at | TEXT (ISO datetime) | |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoincrement |
| name | TEXT | e.g. "Reading", "Writing", "Experiments" |
| color | TEXT | hex color for charts |
| created_at | TEXT (ISO datetime) | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoincrement |
| semester_id | INTEGER FK | required |
| category_id | INTEGER FK | required |
| started_at | TEXT (ISO datetime) | session start |
| ended_at | TEXT (ISO datetime) | session end |
| duration_minutes | INTEGER | computed, stored for aggregation |
| note | TEXT | what was done |
| manual | BOOLEAN | true if added manually |
| created_at | TEXT (ISO datetime) | |

## Core Rules
- 1 credit = 3 hours per week.
- Required weekly hours for a semester = `credits × 3`.
- Week starts on **Monday** and ends on Sunday.
- A session belongs to exactly one semester and one category.
- `duration_minutes` is computed from `started_at` and `ended_at` and stored for fast stats.

## Features

### Semester Management
- Add/edit/delete semesters.
- Fields: name, start date, end date, credits.
- Select a semester to focus the rest of the UI.

### Category Management
- Add/edit/delete categories with name and color.
- Default categories: Reading, Writing, Experiments, Meeting, Other.

### Timer
- Start/stop a work session.
- Pick category before starting.
- Live elapsed timer display.
- Optional note after stopping.

### Manual Entry
- Add a session manually: date, start/end times, category, note.
- Edit/delete existing sessions.

### Session History
- List all sessions for the selected semester.
- Show date, duration, category, note.

### Stats Dashboard
- **Weekly progress:** current week hours / required weekly hours, with progress bar.
- **Semester totals:** total hours, total sessions, average hours per week.
- **Category breakdown:** hours and percentage per category.
- **Date range:** show semester start/end and days remaining.

### Export
- Export sessions for selected semester to CSV.
- Columns: date, start time, end time, duration (hours), category, note, manual.

## UI Layout
- **Sidebar:** semester list + button to add semester.
- **Main area tabs:** Timer | Sessions | Stats
- Week starts Monday everywhere.

## Non-Goals
- Multi-user support
- Cloud sync
- Authentication
- Idle detection / notifications
- Charts beyond simple progress bars and text stats

## Future Possibilities
- Weekly streaks
- Notifications when target reached
- Recharts-based visual charts
- JSON backup/restore

## Open Questions
None remaining after clarifying session.
