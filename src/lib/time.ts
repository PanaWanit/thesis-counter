function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

// Convert 'HH:MM' into minutes since midnight. Returns null when malformed.
function toMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

// Interpret free typing as a time: '9' -> 09:00, '93' -> 09:30, '930' -> 09:30,
// '1345' -> 13:45. Anything unresolvable returns `fallback`.
export function parseTimeInput(raw: string, fallback: string): string {
  const digits = raw.replace(/\D/g, '');
  let hour: number;
  let minute: number;

  if (digits.length === 1) {
    hour = Number(digits);
    minute = 0;
  } else if (digits.length === 2) {
    const asHour = Number(digits);
    if (asHour <= 23) {
      hour = asHour;
      minute = 0;
    } else {
      hour = Number(digits[0]);
      minute = Number(digits[1]) * 10;
    }
  } else if (digits.length === 3) {
    hour = Number(digits[0]);
    minute = Number(digits.slice(1));
  } else if (digits.length === 4) {
    hour = Number(digits.slice(0, 2));
    minute = Number(digits.slice(2));
  } else {
    return fallback;
  }

  if (hour > 23 || minute > 59) return fallback;
  return `${pad(hour)}:${pad(minute)}`;
}

// Shift 'HH:MM' by whole minutes, wrapping at midnight in both directions.
export function addMinutes(time: string, minutes: number): string {
  const base = toMinutes(time);
  if (base === null) return time;
  return fromMinutes(base + minutes);
}

// Signed minutes from `start` to `end`. Does not wrap across midnight.
export function diffMinutes(start: string, end: string): number {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null) return 0;
  return to - from;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end} · ${formatDuration(diffMinutes(start, end))}`;
}

// Validation for the manual session form. Returns an error message, or null when valid.
export function validateManualEntry(
  mode: 'end' | 'duration',
  start: string,
  end: string,
  minutes: number
): string | null {
  if (mode === 'duration') {
    return minutes > 0 ? null : 'Duration must be longer than zero minutes.';
  }
  return diffMinutes(start, end) > 0 ? null : 'End time must be later than start time.';
}
