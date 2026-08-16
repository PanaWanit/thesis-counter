import { eachDay, eachWeek } from './date.ts';
import type { DateBounds } from './date.ts';
import type { DailyTotal } from '../types.ts';

// One bar of a chart. `key` is the first calendar day of the bucket and
// `endKey` its last, so a weekly bucket can label its own span.
export interface Bucket {
  key: string;
  endKey: string;
  minutes: number;
}

export interface Delta {
  diff_minutes: number;
  percent: number | null; // null when there is no baseline to compare against
}

function minutesByDay(rows: DailyTotal[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.day, (map.get(row.day) ?? 0) + row.minutes);
  }
  return map;
}

// One bucket per calendar day in the span, including days with no sessions.
export function dailyBuckets(bounds: DateBounds, rows: DailyTotal[]): Bucket[] {
  const totals = minutesByDay(rows);
  return eachDay(bounds).map((day) => ({
    key: day,
    endKey: day,
    minutes: totals.get(day) ?? 0,
  }));
}

// One bucket per Monday-to-Sunday week overlapping the span. Days that fall
// outside the span contribute nothing, because `rows` only covers the span.
export function weeklyBuckets(bounds: DateBounds, rows: DailyTotal[]): Bucket[] {
  const totals = minutesByDay(rows);
  return eachWeek(bounds).map((week) => {
    const days = eachDay(week);
    const minutes = days.reduce((sum, day) => sum + (totals.get(day) ?? 0), 0);
    return { key: week.startDay, endKey: week.endDay, minutes };
  });
}

export function computeDelta(currentMinutes: number, previousMinutes: number): Delta {
  const diff = currentMinutes - previousMinutes;
  return {
    diff_minutes: diff,
    percent: previousMinutes > 0 ? (diff / previousMinutes) * 100 : null,
  };
}

// Bar heights are relative to the busiest bucket so a quiet week still reads
// as a shape rather than a row of slivers.
export function bucketScale(buckets: Bucket[]): number {
  return buckets.reduce((max, bucket) => Math.max(max, bucket.minutes), 0);
}
