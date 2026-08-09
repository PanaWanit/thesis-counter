import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSemesterFormPresentation,
  parseSemesterCredits,
  persistSemester,
  requiredWeeklyHours,
  shouldHandleSemesterEditRequest,
  validateSemesterDraft,
} from '../src/lib/semester.ts';

const semesterInput = {
  name: 'Semester 1/2026',
  start_date: '2026-08-01',
  end_date: '2026-12-15',
  credits: 6,
};

test('accepts positive whole-number credits and derives weekly hours', () => {
  assert.equal(parseSemesterCredits('6'), 6);
  assert.equal(requiredWeeklyHours('6'), 18);
});

test('rejects empty, zero, negative, decimal, and nonnumeric credits', () => {
  for (const value of ['', '0', '-1', '1.5', 'six']) {
    assert.equal(parseSemesterCredits(value), null);
  }
});

test('reports reversed semester dates and invalid credits', () => {
  assert.deepEqual(validateSemesterDraft('2026-08-10', '2026-08-09', '0'), {
    dates: 'End date must be on or after the start date.',
    credits: 'Credits must be a whole number of at least 1.',
  });
});

test('labels an existing semester as an edit', () => {
  assert.deepEqual(getSemesterFormPresentation(true), {
    eyebrow: 'Semester settings',
    title: 'Edit semester',
    submitLabel: 'Save changes',
  });
});

test('keeps creation copy for a new semester', () => {
  assert.deepEqual(getSemesterFormPresentation(false), {
    eyebrow: 'Semester setup',
    title: 'Create a semester',
    submitLabel: 'Create semester',
  });
});

test('creates when no existing semester id is supplied', async () => {
  const calls = [];

  await persistSemester(null, semesterInput, {
    create: async (input) => calls.push({ kind: 'create', input }),
    update: async (id, input) => calls.push({ kind: 'update', id, input }),
  });

  assert.deepEqual(calls, [{ kind: 'create', input: semesterInput }]);
});

test('updates the supplied semester id instead of creating', async () => {
  const calls = [];

  await persistSemester(42, semesterInput, {
    create: async (input) => calls.push({ kind: 'create', input }),
    update: async (id, input) => calls.push({ kind: 'update', id, input }),
  });

  assert.deepEqual(calls, [{ kind: 'update', id: 42, input: semesterInput }]);
});

test('handles each semester edit request only once', () => {
  assert.equal(shouldHandleSemesterEditRequest(1, 0, true), true);
  assert.equal(shouldHandleSemesterEditRequest(1, 1, true), false);
  assert.equal(shouldHandleSemesterEditRequest(1, 0, false), false);
});
