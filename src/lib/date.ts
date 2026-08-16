function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Format a local calendar date as YYYY-MM-DD. This is the single place a Date
// becomes a calendar-date string; src/lib/calendar.ts delegates to it.
export function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parse a YYYY-MM-DD calendar date into a Date at local midnight.
export function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

// An inclusive span of calendar days, carried both as local day strings (for
// labelling and bucketing) and as ISO instants (for comparing against the UTC
// timestamps stored in sessions.started_at).
export interface DateBounds {
  start: string; // ISO instant of local startDay 00:00:00.000
  end: string; // ISO instant of local endDay 23:59:59.999
  startDay: string; // YYYY-MM-DD
  endDay: string; // YYYY-MM-DD
}

export function boundsFromDays(startDay: Date, endDay: Date): DateBounds {
  const start = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), 0, 0, 0, 0);
  const end = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDay: formatDateInput(start),
    endDay: formatDateInput(end),
  };
}

// Return the Monday of the local week for `date`, at local midnight.
export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Monday-to-Sunday bounds for the week containing `date`. A negative
// `offsetWeeks` walks backwards: -1 is the previous week.
export function weekBounds(date: Date, offsetWeeks = 0): DateBounds {
  const monday = getMonday(date);
  monday.setDate(monday.getDate() + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return boundsFromDays(monday, sunday);
}

// First-to-last-day bounds for the calendar month containing `date`.
// Day 0 of the following month is the last day of the wanted month.
export function monthBounds(date: Date, offsetMonths = 0): DateBounds {
  const first = new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + offsetMonths + 1, 0);
  return boundsFromDays(first, last);
}

export function boundsFromDayStrings(startDay: string, endDay: string): DateBounds {
  return boundsFromDays(parseDay(startDay), parseDay(endDay));
}

// Pull a YYYY-MM-DD day inside [minDay, maxDay]. Day strings in that format
// compare lexicographically, so plain string comparison is enough.
export function clampDay(day: string, minDay: string, maxDay: string): string {
  if (day < minDay) return minDay;
  if (day > maxDay) return maxDay;
  return day;
}

// The calendar-day half of DateBounds, for callers that only need the span.
export interface DaySpan {
  startDay: string;
  endDay: string;
}

// Every calendar day in the span, as YYYY-MM-DD strings.
export function eachDay(span: DaySpan): string[] {
  const days: string[] = [];
  const cursor = parseDay(span.startDay);
  const last = parseDay(span.endDay);
  while (cursor <= last) {
    days.push(formatDateInput(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// Every Monday-to-Sunday week overlapping the span. The first and last weeks
// are not trimmed to the span, so a partial week keeps its real calendar dates.
export function eachWeek(span: DaySpan): DaySpan[] {
  const weeks: DaySpan[] = [];
  const cursor = getMonday(parseDay(span.startDay));
  const last = parseDay(span.endDay);
  while (cursor <= last) {
    const sunday = new Date(cursor);
    sunday.setDate(cursor.getDate() + 6);
    weeks.push({ startDay: formatDateInput(cursor), endDay: formatDateInput(sunday) });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}
