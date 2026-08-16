import { parseDay } from '../../lib/date';
import type { DaySpan } from '../../lib/date';

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

export function formatShortDate(day: string): string {
  return parseDay(day).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

export function formatWeekdayInitial(day: string): string {
  return parseDay(day).toLocaleDateString('en', { weekday: 'narrow' });
}

export function formatWeekday(day: string): string {
  return parseDay(day).toLocaleDateString('en', { weekday: 'long' });
}

export function formatMonth(day: string): string {
  return parseDay(day).toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

export function formatSpan(span: DaySpan): string {
  if (span.startDay === span.endDay) return formatShortDate(span.startDay);
  return `${formatShortDate(span.startDay)} – ${formatShortDate(span.endDay)}`;
}

// "+3.2h more than last week" style copy, with the sign carried explicitly.
export function formatSignedHours(minutes: number): string {
  const sign = minutes > 0 ? '+' : minutes < 0 ? '−' : '';
  return `${sign}${(Math.abs(minutes) / 60).toFixed(1)}h`;
}

export function formatSignedPercent(percent: number | null): string {
  if (percent === null) return 'no baseline';
  const sign = percent > 0 ? '+' : percent < 0 ? '−' : '';
  return `${sign}${Math.abs(percent).toFixed(0)}%`;
}
