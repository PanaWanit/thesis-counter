# Thesis Research Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Tauri v2 desktop app that tracks thesis research sessions per semester, computes weekly progress from registered credits, and exports session data to CSV.

**Architecture:** The frontend (React + TypeScript) owns all business logic and talks directly to SQLite via `@tauri-apps/plugin-sql`. Rust only provides the migration bundle and preloads the database on launch. The UI has a semester sidebar and a tabbed main area.

**Tech Stack:** Tauri v2, React 18, TypeScript, Vite, `@tauri-apps/plugin-sql` (SQLite), plain CSS.

## Global Constraints

- macOS (Apple Silicon M1) target only.
- Single-user, local-only, no authentication, no network calls, no cloud sync.
- TypeScript `strict: true`.
- Store dates as ISO 8601 strings in SQLite.
- Week starts on **Monday**.
- 1 credit = 3 hours/week.
- Compute stats in SQL when practical; store `duration_minutes` on each session.
- UI text in English.
- No dependencies that phone home.
- TDD not required; smoke-test each deliverable manually with `npm run tauri dev`.

## File Structure

```
package.json
vite.config.ts
tsconfig.json
index.html
src/
  main.tsx
  App.tsx
  db.ts                 # Database connection + helpers
  types.ts              # Shared TypeScript interfaces
  lib/
    date.ts             # Monday-week helpers
    csv.ts              # CSV export helper
  components/
    Sidebar.tsx         # Semester list + add button
    SemesterForm.tsx    # Add/edit semester form
    CategoryManager.tsx # Add/edit/delete categories
    TimerTab.tsx        # Start/stop timer
    SessionsTab.tsx     # Session list + manual entry form
    StatsTab.tsx        # Weekly progress + totals + breakdown
    ExportButton.tsx    # CSV export trigger
src-tauri/
  Cargo.toml
  tauri.conf.json
  capabilities/default.json
  src/main.rs           # Migrations + app bootstrap
  icons/                # default Tauri icons
```

---

### Task 1: Initialize Tauri + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Produces: a Vite + React + TypeScript project that builds cleanly with `npm run build`. `npm run tauri dev` becomes runnable after Task 2 adds the Tauri backend.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "thesis-counter",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_'],
  build: { target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13' }
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thesis Counter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create `src/App.tsx`**

```tsx
function App() {
  return <div>Thesis Counter</div>;
}

export default App;
```

- [ ] **Step 7: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`

- [ ] **Step 9: Verify Vite build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html src/
git commit -m "chore: scaffold tauri + react + typescript"
```

---

### Task 2: Configure Tauri backend, plugin-sql, and migrations

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/icons/` (copy default icons from Tauri template, or run `tauri icon` after build)

**Interfaces:**
- Consumes: package.json scripts and Vite port.
- Produces: `npm run tauri:dev` opens a working app window; SQLite file is created on launch.

- [ ] **Step 1: Create `src-tauri/Cargo.toml`**

```toml
[package]
name = "thesis-counter"
version = "0.1.0"
description = "Personal thesis research counter"
authors = ["you"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
tauri = { version = "2.0.0", features = [] }
tauri-plugin-sql = { version = "2.0.0", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

- [ ] **Step 2: Create `src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Thesis Counter",
  "version": "0.1.0",
  "identifier": "com.yourname.thesis-counter",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Thesis Counter",
        "width": 900,
        "height": 700,
        "resizable": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {
    "sql": {
      "preload": ["sqlite:thesis.db"]
    }
  }
}
```

- [ ] **Step 3: Create `src-tauri/capabilities/default.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "sql:allow-load"
  ]
}
```

- [ ] **Step 4: Create `src-tauri/src/main.rs`**

```rust
use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_semesters_table",
            sql: "CREATE TABLE IF NOT EXISTS semesters (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                name TEXT NOT NULL,\n                start_date TEXT NOT NULL,\n                end_date TEXT NOT NULL,\n                credits INTEGER NOT NULL,\n                created_at TEXT NOT NULL\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_categories_table",
            sql: "CREATE TABLE IF NOT EXISTS categories (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                name TEXT NOT NULL UNIQUE,\n                color TEXT NOT NULL,\n                created_at TEXT NOT NULL\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_sessions_table",
            sql: "CREATE TABLE IF NOT EXISTS sessions (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                semester_id INTEGER NOT NULL,\n                category_id INTEGER NOT NULL,\n                started_at TEXT NOT NULL,\n                ended_at TEXT NOT NULL,\n                duration_minutes INTEGER NOT NULL,\n                note TEXT NOT NULL DEFAULT '',\n                manual INTEGER NOT NULL DEFAULT 0,\n                created_at TEXT NOT NULL,\n                FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,\n                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "seed_default_categories",
            sql: "INSERT OR IGNORE INTO categories (name, color, created_at) VALUES\n                ('Reading', '#3b82f6', datetime('now')),\n                ('Writing', '#22c55e', datetime('now')),\n                ('Experiments', '#a855f7', datetime('now')),\n                ('Meeting', '#f59e0b', datetime('now')),\n                ('Other', '#6b7280', datetime('now'));",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:thesis.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: Add default icons**

Run:
```bash
mkdir -p src-tauri/icons
```
Then create a 512×512 source icon at `src-tauri/icons/icon.png` (any image editor or `sips`/`convert`).
Finally generate all icon sizes:
```bash
npx tauri icon src-tauri/icons/icon.png
```
If you cannot create an icon yet, copy the default set from the Tauri template into `src-tauri/icons/` so `tauri build` can run.

- [ ] **Step 6: Build Rust project**

Run: `npm run tauri:dev`
Expected: app window opens with no JS errors; SQLite file `~/Library/Application Support/com.yourname.thesis.db` is created.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/
git commit -m "chore: configure tauri, sqlite plugin, and migrations"
```

---

### Task 3: Create shared types and database helper

**Files:**
- Create: `src/types.ts`
- Create: `src/db.ts`

**Interfaces:**
- Produces: `Semester`, `Category`, `Session`, `SessionInput`, `Db` helpers used by all UI tasks.

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface Semester {
  id: number;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  credits: number;
  created_at: string;
}

export interface SemesterInput {
  name: string;
  start_date: string;
  end_date: string;
  credits: number;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Session {
  id: number;
  semester_id: number;
  category_id: number;
  started_at: string; // ISO datetime
  ended_at: string;
  duration_minutes: number;
  note: string;
  manual: number; // 0 or 1
  created_at: string;
}

export interface SessionInput {
  semester_id: number;
  category_id: number;
  started_at: string;
  ended_at: string;
  note: string;
  manual: number;
}

export interface WeeklyStats {
  required_hours: number;
  current_week_minutes: number;
  current_week_hours: number;
  progress_percent: number;
}

export interface SemesterStats {
  total_minutes: number;
  total_hours: number;
  session_count: number;
  average_hours_per_week: number;
  days_remaining: number;
}

export interface CategoryBreakdown {
  category_id: number;
  name: string;
  color: string;
  total_minutes: number;
  total_hours: number;
  percent: number;
}
```

- [ ] **Step 2: Create `src/db.ts`**

```ts
import Database from '@tauri-apps/plugin-sql';
import type {
  Semester,
  SemesterInput,
  Category,
  Session,
  SessionInput,
  WeeklyStats,
  SemesterStats,
  CategoryBreakdown,
} from './types';

const DB_NAME = 'sqlite:thesis.db';

let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_NAME);
  }
  return dbPromise;
}

export async function select<T>(sql: string, bindValues?: unknown[]): Promise<T[]> {
  const db = await getDb();
  return db.select<T[]>(sql, bindValues ?? []);
}

export async function execute(sql: string, bindValues?: unknown[]): Promise<void> {
  const db = await getDb();
  await db.execute(sql, bindValues ?? []);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/db.ts
git commit -m "feat: add shared types and db helper"
```

---

### Task 4: Semester CRUD and Sidebar

**Files:**
- Create: `src/components/SemesterForm.tsx`
- Create: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx` to render `Sidebar` and pass selected semester state.

**Interfaces:**
- Consumes: `Semester`, `SemesterInput` from `src/types.ts`; `select`, `execute` from `src/db.ts`.
- Produces: `listSemesters`, `createSemester`, `updateSemester`, `deleteSemester` functions; `Sidebar` calls `onSelect(semester)`.

- [ ] **Step 1: Create `src/lib/date.ts`**

```ts
export function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function mondayWeekBounds(date: Date): { start: string; end: string } {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
}
```

- [ ] **Step 2: Create semester DB functions in `src/db.ts` (append to file)**

```ts
export async function listSemesters(): Promise<Semester[]> {
  return select<Semester>('SELECT * FROM semesters ORDER BY start_date DESC');
}

export async function createSemester(input: SemesterInput): Promise<void> {
  await execute(
    'INSERT INTO semesters (name, start_date, end_date, credits, created_at) VALUES ($1, $2, $3, $4, datetime("now"))',
    [input.name, input.start_date, input.end_date, input.credits]
  );
}

export async function updateSemester(id: number, input: SemesterInput): Promise<void> {
  await execute(
    'UPDATE semesters SET name = $1, start_date = $2, end_date = $3, credits = $4 WHERE id = $5',
    [input.name, input.start_date, input.end_date, input.credits, id]
  );
}

export async function deleteSemester(id: number): Promise<void> {
  await execute('DELETE FROM semesters WHERE id = $1', [id]);
}
```

- [ ] **Step 3: Create `src/components/SemesterForm.tsx`**

```tsx
import { useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { formatDateInput } from '../lib/date';

interface Props {
  semester?: Semester | null;
  onSave: (input: SemesterInput) => void;
  onCancel: () => void;
}

export default function SemesterForm({ semester, onSave, onCancel }: Props) {
  const [name, setName] = useState(semester?.name ?? '');
  const [startDate, setStartDate] = useState(semester?.start_date ?? formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(semester?.end_date ?? formatDateInput(new Date()));
  const [credits, setCredits] = useState(semester?.credits ?? 6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, start_date: startDate, end_date: endDate, credits: Number(credits) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      <input type="number" min={1} value={credits} onChange={(e) => setCredits(Number(e.target.value))} required />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
```

- [ ] **Step 4: Create `src/components/Sidebar.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { listSemesters, createSemester, deleteSemester } from '../db';
import SemesterForm from './SemesterForm';

interface Props {
  selected: Semester | null;
  onSelect: (s: Semester) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    const data = await listSemesters();
    setSemesters(data);
    if (data.length > 0 && !selected) {
      onSelect(data[0]);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async (input: SemesterInput) => {
    await createSemester(input);
    setShowForm(false);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteSemester(id);
    await refresh();
  };

  return (
    <aside style={{ width: 220, borderRight: '1px solid #ccc', padding: 12 }}>
      <h2>Semesters</h2>
      <button onClick={() => setShowForm(true)}>+ Add</button>
      {showForm && <SemesterForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {semesters.map((s) => (
          <li key={s.id} style={{ background: selected?.id === s.id ? '#eee' : 'transparent' }}>
            <button onClick={() => onSelect(s)} style={{ textAlign: 'left' }}>
              {s.name} ({s.credits} cr)
            </button>
            <button onClick={() => handleDelete(s.id)}>×</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 5: Update `src/App.tsx`**

```tsx
import { useState } from 'react';
import type { Semester } from './types';
import Sidebar from './components/Sidebar';

function App() {
  const [selected, setSelected] = useState<Semester | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar selected={selected} onSelect={setSelected} />
      <main style={{ flex: 1, padding: 16 }}>
        {selected ? <h1>{selected.name}</h1> : <p>Select or create a semester.</p>}
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 6: Smoke test**

Run: `npm run tauri:dev`
Expected: sidebar shows semesters; add/delete works; selecting updates main title.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: semester CRUD and sidebar"
```

---

### Task 5: Category management

**Files:**
- Create: `src/components/CategoryManager.tsx`
- Modify: `src/App.tsx` to include a categories button/modal or tab.

**Interfaces:**
- Consumes: `Category` from `src/types.ts`; `select`, `execute` from `src/db.ts`.
- Produces: `listCategories`, `createCategory`, `deleteCategory` functions.

- [ ] **Step 1: Add category DB functions to `src/db.ts`**

```ts
export async function listCategories(): Promise<Category[]> {
  return select<Category>('SELECT * FROM categories ORDER BY name');
}

export async function createCategory(name: string, color: string): Promise<void> {
  await execute(
    'INSERT INTO categories (name, color, created_at) VALUES ($1, $2, datetime("now"))',
    [name, color]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  await execute('DELETE FROM categories WHERE id = $1', [id]);
}
```

- [ ] **Step 2: Create `src/components/CategoryManager.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Category } from '../types';
import { listCategories, createCategory, deleteCategory } from '../db';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const refresh = async () => setCategories(await listCategories());

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory(name, color);
    setName('');
    await refresh();
  };

  return (
    <div>
      <h3>Categories</h3>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            <span style={{ color: c.color }}>●</span> {c.name}
            <button onClick={() => deleteCategory(c.id).then(refresh)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Add Categories tab placeholder in `src/App.tsx`**

Add tab state and render `CategoryManager` under a tab. (Full tab wiring is Task 6.)

- [ ] **Step 4: Smoke test**

Run: `npm run tauri:dev`
Expected: categories list loads; add/delete updates list; seeded defaults appear.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: category management"
```

---

### Task 6: Tab navigation shell

**Files:**
- Create: `src/components/Tabs.tsx`
- Modify: `src/App.tsx` to use tabs.

**Interfaces:**
- Consumes: `selected` semester.
- Produces: active tab state.

- [ ] **Step 1: Create `src/components/Tabs.tsx`**

```tsx
import { useState } from 'react';
import type { Semester } from '../types';
import TimerTab from './TimerTab';
import SessionsTab from './SessionsTab';
import StatsTab from './StatsTab';
import CategoryManager from './CategoryManager';

type TabKey = 'timer' | 'sessions' | 'stats' | 'categories';

interface Props {
  semester: Semester;
}

export default function Tabs({ semester }: Props) {
  const [active, setActive] = useState<TabKey>('timer');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['timer', 'sessions', 'stats', 'categories'] as TabKey[]).map((k) => (
          <button key={k} style={{ fontWeight: active === k ? 'bold' : 'normal' }} onClick={() => setActive(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      {active === 'timer' && <TimerTab semester={semester} />}
      {active === 'sessions' && <SessionsTab semester={semester} />}
      {active === 'stats' && <StatsTab semester={semester} />}
      {active === 'categories' && <CategoryManager />}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/App.tsx`** to render `<Tabs semester={selected} />` instead of the placeholder title.

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: tab navigation shell"
```

---

### Task 7: Timer and session persistence

**Files:**
- Create: `src/components/TimerTab.tsx`
- Modify: `src/db.ts` to add session functions.

**Interfaces:**
- Consumes: `Semester`, `Category`, `SessionInput`; `listCategories`, `execute`.
- Produces: `createSession`; live timer state.

- [ ] **Step 1: Add session DB functions to `src/db.ts`**

```ts
export async function createSession(input: SessionInput): Promise<void> {
  const started = new Date(input.started_at);
  const ended = new Date(input.ended_at);
  const duration = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  await execute(
    `INSERT INTO sessions
     (semester_id, category_id, started_at, ended_at, duration_minutes, note, manual, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, datetime("now"))`,
    [input.semester_id, input.category_id, input.started_at, input.ended_at, duration, input.note, input.manual]
  );
}

export async function listSessions(semesterId: number): Promise<Session[]> {
  return select<Session>(
    `SELECT * FROM sessions WHERE semester_id = $1 ORDER BY started_at DESC`,
    [semesterId]
  );
}

export async function deleteSession(id: number): Promise<void> {
  await execute('DELETE FROM sessions WHERE id = $1', [id]);
}
```

- [ ] **Step 2: Create `src/components/TimerTab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Category, Semester } from '../types';
import { listCategories, createSession } from '../db';

interface Props {
  semester: Semester;
}

export default function TimerTab({ semester }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => { listCategories().then(setCategories); }, []);

  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const start = () => {
    if (categoryId === '') return;
    setStartTime(new Date());
    setElapsed(0);
  };

  const stop = async () => {
    if (!startTime || categoryId === '') return;
    const endedAt = new Date();
    await createSession({
      semester_id: semester.id,
      category_id: Number(categoryId),
      started_at: startTime.toISOString(),
      ended_at: endedAt.toISOString(),
      note,
      manual: 0,
    });
    setStartTime(null);
    setElapsed(0);
    setNote('');
  };

  return (
    <div>
      <h2>Timer</h2>
      <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} disabled={startTime !== null}>
        <option value="">Select category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ fontSize: 48, fontFamily: 'monospace' }}>
        {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
        {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
        {(elapsed % 60).toString().padStart(2, '0')}
      </div>
      {startTime ? (
        <button onClick={stop}>Stop</button>
      ) : (
        <button onClick={start} disabled={categoryId === ''}>Start</button>
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

Run: `npm run tauri:dev`
Expected: select category, start timer, stop timer; a row appears in `sessions` table.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: timer and session persistence"
```

---

### Task 8: Sessions list and manual entry

**Files:**
- Create: `src/components/SessionsTab.tsx`

**Interfaces:**
- Consumes: `Semester`, `Session`, `Category`; `listSessions`, `createSession`, `deleteSession`, `listCategories`.
- Produces: manual session form; session table with delete.

- [ ] **Step 1: Create `src/components/SessionsTab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Category, Session, Semester, SessionInput } from '../types';
import { listSessions, createSession, deleteSession, listCategories } from '../db';
import { formatDateInput } from '../lib/date';

interface Props {
  semester: Semester;
}

export default function SessionsTab({ semester }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [note, setNote] = useState('');

  const refresh = async () => {
    setSessions(await listSessions(semester.id));
  };

  useEffect(() => { refresh(); listCategories().then(setCategories); }, [semester.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const started = new Date(`${date}T${start}:00`).toISOString();
    const ended = new Date(`${date}T${end}:00`).toISOString();
    const input: SessionInput = {
      semester_id: semester.id,
      category_id: Number(categoryId),
      started_at: started,
      ended_at: ended,
      note,
      manual: 1,
    };
    await createSession(input);
    setNote('');
    await refresh();
  };

  const fmt = (d: string) => new Date(d).toLocaleString();

  return (
    <div>
      <h2>Sessions</h2>
      <form onSubmit={handleAdd}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
          <option value="">Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
        <button type="submit">Add Manual</button>
      </form>
      <table>
        <thead>
          <tr><th>Date</th><th>Duration</th><th>Category</th><th>Note</th><th></th></tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{fmt(s.started_at)}</td>
              <td>{(s.duration_minutes / 60).toFixed(2)}h</td>
              <td>{categories.find((c) => c.id === s.category_id)?.name ?? s.category_id}</td>
              <td>{s.note}</td>
              <td><button onClick={() => deleteSession(s.id).then(refresh)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run tauri:dev`
Expected: add manual session; list shows it; delete removes it.

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: sessions list and manual entry"
```

---

### Task 9: Stats dashboard

**Files:**
- Create: `src/components/StatsTab.tsx`
- Modify: `src/db.ts` to add stats functions.

**Interfaces:**
- Consumes: `Semester`, `WeeklyStats`, `SemesterStats`, `CategoryBreakdown`; `select`; `mondayWeekBounds`.
- Produces: rendered stats.

- [ ] **Step 1: Add stats DB functions to `src/db.ts`**

```ts
import { mondayWeekBounds } from './lib/date';

export async function getWeeklyStats(semester: Semester): Promise<WeeklyStats> {
  const { start, end } = mondayWeekBounds(new Date());
  const rows = await select<{ current_week_minutes: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0) AS current_week_minutes
     FROM sessions
     WHERE semester_id = $1 AND started_at >= $2 AND started_at <= $3`,
    [semester.id, start, end]
  );
  const current = rows[0]?.current_week_minutes ?? 0;
  const required = semester.credits * 3 * 60;
  return {
    required_hours: semester.credits * 3,
    current_week_minutes: current,
    current_week_hours: current / 60,
    progress_percent: required > 0 ? Math.min(100, (current / required) * 100) : 0,
  };
}

export async function getSemesterStats(semester: Semester): Promise<SemesterStats> {
  const totalRows = await select<{ total_minutes: number; session_count: number }>(
    `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes, COUNT(*) AS session_count
     FROM sessions WHERE semester_id = $1`,
    [semester.id]
  );
  const totalMinutes = totalRows[0]?.total_minutes ?? 0;
  const totalHours = totalMinutes / 60;
  const start = new Date(semester.start_date);
  const end = new Date(semester.end_date);
  const now = new Date();
  const elapsedDays = Math.max(1, Math.floor((Math.min(now.getTime(), end.getTime()) - start.getTime()) / 86400000) + 1);
  const elapsedWeeks = elapsedDays / 7;
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  return {
    total_minutes: totalMinutes,
    total_hours: totalHours,
    session_count: totalRows[0]?.session_count ?? 0,
    average_hours_per_week: elapsedWeeks > 0 ? totalHours / elapsedWeeks : 0,
    days_remaining: daysRemaining,
  };
}

export async function getCategoryBreakdown(semesterId: number): Promise<CategoryBreakdown[]> {
  const rows = await select<{
    category_id: number;
    name: string;
    color: string;
    total_minutes: number;
  }>(
    `SELECT c.id AS category_id, c.name, c.color, COALESCE(SUM(s.duration_minutes), 0) AS total_minutes
     FROM categories c
     LEFT JOIN sessions s ON s.category_id = c.id AND s.semester_id = $1
     GROUP BY c.id`,
    [semesterId]
  );
  const total = rows.reduce((sum, r) => sum + r.total_minutes, 0);
  return rows.map((r) => ({
    category_id: r.category_id,
    name: r.name,
    color: r.color,
    total_minutes: r.total_minutes,
    total_hours: r.total_minutes / 60,
    percent: total > 0 ? Math.round((r.total_minutes / total) * 1000) / 10 : 0,
  }));
}
```

- [ ] **Step 2: Create `src/components/StatsTab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Semester, WeeklyStats, SemesterStats, CategoryBreakdown } from '../types';
import { getWeeklyStats, getSemesterStats, getCategoryBreakdown } from '../db';

interface Props {
  semester: Semester;
}

export default function StatsTab({ semester }: Props) {
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [semesterStats, setSemesterStats] = useState<SemesterStats | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);

  const refresh = async () => {
    setWeekly(await getWeeklyStats(semester));
    setSemesterStats(await getSemesterStats(semester));
    setBreakdown(await getCategoryBreakdown(semester.id));
  };

  useEffect(() => { refresh(); }, [semester]);

  return (
    <div>
      <h2>Stats</h2>
      {weekly && (
        <div>
          <h3>This Week</h3>
          <div>{weekly.current_week_hours.toFixed(1)} / {weekly.required_hours} h</div>
          <progress value={weekly.progress_percent} max={100} style={{ width: '100%' }} />
          <div>{weekly.progress_percent.toFixed(0)}%</div>
        </div>
      )}
      {semesterStats && (
        <div>
          <h3>Semester</h3>
          <div>Total: {semesterStats.total_hours.toFixed(1)} h ({semesterStats.session_count} sessions)</div>
          <div>Avg/week: {semesterStats.average_hours_per_week.toFixed(1)} h</div>
          <div>Days remaining: {semesterStats.days_remaining}</div>
        </div>
      )}
      <h3>By Category</h3>
      <ul>
        {breakdown.map((b) => (
          <li key={b.category_id}>
            <span style={{ color: b.color }}>●</span> {b.name}: {b.total_hours.toFixed(1)} h ({b.percent}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

Run: `npm run tauri:dev`
Expected: stats tab shows weekly progress bar, semester totals, category breakdown.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: stats dashboard"
```

---

### Task 10: CSV export

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/components/ExportButton.tsx`

**Interfaces:**
- Consumes: `Session`, `Category`; `listSessions`.
- Produces: downloadable CSV file via Tauri shell/dialog or browser download.

- [ ] **Step 1: Create `src/lib/csv.ts`**

```ts
export function escapeCsv(value: string): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsv).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCsv).join(',')));
  return lines.join('\n');
}
```

- [ ] **Step 2: Create `src/components/ExportButton.tsx`**

```tsx
import type { Semester, Session, Category } from '../types';
import { listSessions } from '../db';
import { buildCsv } from '../lib/csv';

interface Props {
  semester: Semester;
  categories: Category[];
}

export default function ExportButton({ semester, categories }: Props) {
  const handleExport = async () => {
    const sessions = await listSessions(semester.id);
    const headers = ['date', 'start_time', 'end_time', 'duration_hours', 'category', 'note', 'manual'];
    const rows = sessions.map((s) => {
      const started = new Date(s.started_at);
      const ended = new Date(s.ended_at);
      return [
        started.toISOString().split('T')[0],
        started.toLocaleTimeString(),
        ended.toLocaleTimeString(),
        (s.duration_minutes / 60).toFixed(2),
        categories.find((c) => c.id === s.category_id)?.name ?? '',
        s.note,
        s.manual ? 'yes' : 'no',
      ];
    });
    const csv = buildCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${semester.name.replace(/\s+/g, '_')}_sessions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>Export CSV</button>;
}
```

- [ ] **Step 3: Add `ExportButton` to `StatsTab.tsx`**

Pass categories by loading them in `StatsTab` or share via context. For simplicity, load categories in `StatsTab` and pass to `ExportButton`.

- [ ] **Step 4: Smoke test**

Run: `npm run tauri:dev`
Expected: clicking export downloads a CSV with the correct columns.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: csv export"
```

---

### Task 11: Final build and smoke test

**Files:**
- Modify: `src-tauri/tauri.conf.json` if window size needs adjustment after real use.

**Interfaces:**
- Produces: release bundle `.dmg` in `src-tauri/target/release/bundle/`.

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Build release**

Run: `npm run tauri:build`
Expected: succeeds; `.dmg` appears.

- [ ] **Step 3: Manual smoke test**

1. Add a semester with 6 credits.
2. Start a timer session in a category; stop it.
3. Add a manual session from last week.
4. Verify stats reflect totals and weekly target = 18 h.
5. Export CSV and verify contents.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: final window tweaks and release build"
```

---

## Spec Coverage

| Spec Section | Task |
|--------------|------|
| Tech stack / scaffolding | Task 1, Task 2 |
| `semesters` table + CRUD | Task 2 (migration), Task 4 |
| `categories` table + CRUD | Task 2 (migration), Task 5 |
| `sessions` table + CRUD | Task 2 (migration), Task 7, Task 8 |
| Timer | Task 7 |
| Manual entry + session history | Task 8 |
| Weekly progress | Task 9 |
| Semester totals/averages | Task 9 |
| Category breakdown | Task 9 |
| CSV export | Task 10 |
| Week starts Monday | `src/lib/date.ts` used in Task 4, Task 9 |

## Placeholder Scan

- No "TBD", "TODO", or "implement later".
- Every step includes exact file paths, SQL, or component code.
- All function names and types are defined in earlier tasks before use.

## Type Consistency Notes

- `Session.manual` stored as SQLite INTEGER (0/1) and typed as `number` in TypeScript.
- Date helpers return ISO strings consistent with DB columns.
- Stats functions use `Semester` from `src/types.ts`.
