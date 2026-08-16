import { formatDateInput, getMonday } from './date.ts';

export interface DayCell {
  date: string;
  day: number;
  inMonth: boolean;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// `month` is 0-indexed, matching the Date constructor, and out-of-range values
// roll over the same way (month 12 -> January of the next year).
export function toDateString(year: number, month: number, day: number): string {
  return formatDateInput(new Date(year, month, day));
}

export function parseDateString(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month: month - 1, day };
}

// Build a local Date at midnight. Never pass a raw 'YYYY-MM-DD' to `new Date`.
function toLocalDate(value: string): Date {
  const { year, month, day } = parseDateString(value);
  return new Date(year, month, day);
}

export function monthGrid(year: number, month: number): DayCell[] {
  const start = getMonday(new Date(year, month, 1));
  const cells: DayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    cells.push({
      date: toDateString(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
    });
  }

  return cells;
}

export function shiftDate(date: string, days: number): string {
  const d = toLocalDate(date);
  return toDateString(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

// Move by whole months, clamping the day onto shorter months (Jan 31 + 1 -> Feb 28).
export function shiftMonth(date: string, months: number): string {
  const { year, month, day } = parseDateString(date);
  const targetMonth = month + months;
  const lastDay = new Date(year, targetMonth + 1, 0).getDate();
  return toDateString(year, targetMonth, Math.min(day, lastDay));
}

export function startOfWeek(date: string): string {
  return formatDateInput(getMonday(toLocalDate(date)));
}

export function endOfWeek(date: string): string {
  return shiftDate(startOfWeek(date), 6);
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

// Inclusive on both ends. ISO date strings compare correctly as text.
export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function formatDateLabel(date: string): string {
  const d = toLocalDate(date);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
