function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Format a local calendar date as YYYY-MM-DD for HTML date inputs.
export function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Convert local year/month/day/hour/minute/second into a UTC Date and return its ISO string.
function localToUtcIso(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): string {
  return new Date(Date.UTC(year, month, day, hour, minute, second, ms)).toISOString();
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

// Return ISO 8601 strings for local Monday 00:00:00 and local Sunday 23:59:59.999,
// expressed as UTC instants so they compare correctly with session timestamps.
export function mondayWeekBounds(date: Date): { start: string; end: string } {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: localToUtcIso(monday.getFullYear(), monday.getMonth(), monday.getDate()),
    end: localToUtcIso(
      sunday.getFullYear(),
      sunday.getMonth(),
      sunday.getDate(),
      sunday.getHours(),
      sunday.getMinutes(),
      sunday.getSeconds(),
      sunday.getMilliseconds()
    ),
  };
}
