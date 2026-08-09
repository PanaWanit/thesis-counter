export interface SemesterFieldErrors {
  dates?: string;
  credits?: string;
}

export function parseSemesterCredits(value: string): number | null {
  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;

  const credits = Number(normalized);
  return Number.isSafeInteger(credits) ? credits : null;
}

export function requiredWeeklyHours(value: string): number | null {
  const credits = parseSemesterCredits(value);
  return credits === null ? null : credits * 3;
}

export function validateSemesterDraft(
  startDate: string,
  endDate: string,
  credits: string
): SemesterFieldErrors {
  const errors: SemesterFieldErrors = {};

  if (endDate < startDate) {
    errors.dates = 'End date must be on or after the start date.';
  }

  if (parseSemesterCredits(credits) === null) {
    errors.credits = 'Credits must be a whole number of at least 1.';
  }

  return errors;
}
