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
    'INSERT INTO categories (name, color, created_at) VALUES ($1, $2, datetime("now"))',
    [name, color]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  await execute('DELETE FROM categories WHERE id = $1', [id]);
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
