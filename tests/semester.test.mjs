import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseSemesterCredits,
  requiredWeeklyHours,
  validateSemesterDraft,
} from '../src/lib/semester.ts';

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
