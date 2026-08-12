import Database from '@tauri-apps/plugin-sql';
import { mondayWeekBounds } from './lib/date';
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

export async function listSemesters(): Promise<Semester[]> {
  return select<Semester>('SELECT * FROM semesters ORDER BY start_date DESC');
}

export async function createSemester(input: SemesterInput): Promise<void> {
  await execute(
    'INSERT INTO semesters (name, start_date, end_date, credits, created_at) VALUES ($1, $2, $3, $4, $5)',
    [input.name, input.start_date, input.end_date, input.credits, new Date().toISOString()]
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

export async function listCategories(): Promise<Category[]> {
  return select<Category>('SELECT * FROM categories ORDER BY name');
}

export async function createCategory(name: string, color: string): Promise<void> {
  await execute(
    'INSERT INTO categories (name, color, created_at) VALUES ($1, $2, $3)',
    [name, color, new Date().toISOString()]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  await execute('DELETE FROM categories WHERE id = $1', [id]);
}

export async function createSession(input: SessionInput): Promise<void> {
  const started = new Date(input.started_at);
  const ended = new Date(input.ended_at);
  const duration = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  await execute(
    `INSERT INTO sessions
     (semester_id, category_id, started_at, ended_at, duration_minutes, title, note, manual, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, datetime("now"))`,
    [input.semester_id, input.category_id, input.started_at, input.ended_at, duration, input.title, input.note, input.manual]
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

export async function updateSessionNote(id: number, title: string, note: string): Promise<void> {
  await execute(
    'UPDATE sessions SET title = $1, note = $2 WHERE id = $3',
    [title, note, id]
  );
}

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

export type {
  Semester,
  SemesterInput,
  Category,
  Session,
  SessionInput,
  WeeklyStats,
  SemesterStats,
  CategoryBreakdown,
};
