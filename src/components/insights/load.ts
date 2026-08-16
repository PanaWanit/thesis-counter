import {
  boundsFromDayStrings,
  clampDay,
  formatDateInput,
  monthBounds,
  weekBounds,
} from '../../lib/date';
import type { DateBounds } from '../../lib/date';
import { dailyBuckets, weeklyBuckets, computeDelta } from '../../lib/insights';
import type { Bucket, Delta } from '../../lib/insights';
import {
  getAllSemesterTotals,
  getCategoryBreakdown,
  getDailyTotals,
  getRangeTotals,
  getSemesterStats,
} from '../../db';
import type {
  CategoryBreakdown,
  InsightsRange,
  RangeTotals,
  Semester,
  SemesterStats,
  SemesterTotal,
} from '../../types';

// "This week" and "this month" share a shape: a current span, the span before
// it, and per-day bars.
export interface PeriodData {
  range: 'week' | 'month';
  bounds: DateBounds;
  previousBounds: DateBounds;
  current: RangeTotals;
  previous: RangeTotals;
  delta: Delta;
  buckets: Bucket[];
  breakdown: CategoryBreakdown[];
  targetHours: number | null;
}

export interface SemesterData {
  range: 'semester';
  bounds: DateBounds;
  stats: SemesterStats;
  buckets: Bucket[]; // one bar per week, up to today
  breakdown: CategoryBreakdown[];
  targetHours: number;
}

export interface AllTimeData {
  range: 'all';
  semesters: SemesterTotal[];
  totalHours: number;
  totalSessions: number;
  breakdown: CategoryBreakdown[];
}

export type InsightsData = PeriodData | SemesterData | AllTimeData;

async function loadPeriod(
  semester: Semester,
  range: 'week' | 'month',
  now: Date
): Promise<PeriodData> {
  const bounds = range === 'week' ? weekBounds(now) : monthBounds(now);
  const previousBounds = range === 'week' ? weekBounds(now, -1) : monthBounds(now, -1);
  const [current, previous, daily, breakdown] = await Promise.all([
    getRangeTotals(semester.id, bounds),
    getRangeTotals(semester.id, previousBounds),
    getDailyTotals(semester.id, bounds),
    getCategoryBreakdown(semester.id, bounds),
  ]);
  return {
    range,
    bounds,
    previousBounds,
    current,
    previous,
    delta: computeDelta(current.total_minutes, previous.total_minutes),
    buckets: dailyBuckets(bounds, daily),
    breakdown,
    targetHours: range === 'week' ? semester.credits * 3 : null,
  };
}

async function loadSemester(semester: Semester, now: Date): Promise<SemesterData> {
  const bounds = boundsFromDayStrings(semester.start_date, semester.end_date);
  // Stop the weekly bars at today so an in-progress semester is not padded out
  // with empty future weeks.
  const chartBounds = boundsFromDayStrings(
    semester.start_date,
    clampDay(formatDateInput(now), semester.start_date, semester.end_date)
  );
  const [stats, daily, breakdown] = await Promise.all([
    getSemesterStats(semester),
    getDailyTotals(semester.id, chartBounds),
    getCategoryBreakdown(semester.id),
  ]);
  return {
    range: 'semester',
    bounds,
    stats,
    buckets: weeklyBuckets(chartBounds, daily),
    breakdown,
    targetHours: semester.credits * 3,
  };
}

async function loadAllTime(): Promise<AllTimeData> {
  const [semesters, breakdown] = await Promise.all([
    getAllSemesterTotals(),
    getCategoryBreakdown(null),
  ]);
  return {
    range: 'all',
    semesters,
    totalHours: semesters.reduce((sum, item) => sum + item.total_hours, 0),
    totalSessions: semesters.reduce((sum, item) => sum + item.session_count, 0),
    breakdown,
  };
}

export function loadInsights(
  semester: Semester,
  range: InsightsRange,
  now = new Date()
): Promise<InsightsData> {
  switch (range) {
    case 'week':
    case 'month':
      return loadPeriod(semester, range, now);
    case 'semester':
      return loadSemester(semester, now);
    case 'all':
      return loadAllTime();
  }
}
