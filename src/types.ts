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
