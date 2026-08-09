import type { SemesterInput } from '../types';

export interface SemesterFieldErrors {
  dates?: string;
  credits?: string;
}

interface SemesterPersistence {
  create: (input: SemesterInput) => Promise<void>;
  update: (id: number, input: SemesterInput) => Promise<void>;
}

export function shouldHandleSemesterEditRequest(
  request: number,
  handledRequest: number,
  hasSelectedSemester: boolean
): boolean {
  return hasSelectedSemester && request > 0 && request !== handledRequest;
}

export async function persistSemester(
  semesterId: number | null,
  input: SemesterInput,
  persistence: SemesterPersistence
): Promise<void> {
  if (semesterId === null) {
    await persistence.create(input);
    return;
  }

  await persistence.update(semesterId, input);
}

export interface SemesterFormPresentation {
  eyebrow: string;
  title: string;
  submitLabel: string;
}

export function getSemesterFormPresentation(isEditing: boolean): SemesterFormPresentation {
  return isEditing
    ? {
        eyebrow: 'Semester settings',
        title: 'Edit semester',
        submitLabel: 'Save changes',
      }
    : {
        eyebrow: 'Semester setup',
        title: 'Create a semester',
        submitLabel: 'Create semester',
      };
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
