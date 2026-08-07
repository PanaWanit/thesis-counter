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
