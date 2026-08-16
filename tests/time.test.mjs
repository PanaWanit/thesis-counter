import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMinutes,
  diffMinutes,
  formatDuration,
  formatTimeRange,
  parseTimeInput,
  validateManualEntry,
} from '../src/lib/time.ts';

test('parseTimeInput reads progressive digit input', () => {
  assert.equal(parseTimeInput('9', '00:00'), '09:00');
  assert.equal(parseTimeInput('09', '00:00'), '09:00');
  assert.equal(parseTimeInput('93', '00:00'), '09:30');
  assert.equal(parseTimeInput('930', '00:00'), '09:30');
  assert.equal(parseTimeInput('1345', '00:00'), '13:45');
  assert.equal(parseTimeInput('13:45', '00:00'), '13:45');
  assert.equal(parseTimeInput('0907', '00:00'), '09:07');
});

test('parseTimeInput falls back on input it cannot resolve', () => {
  assert.equal(parseTimeInput('', '08:15'), '08:15');
  assert.equal(parseTimeInput('abc', '08:15'), '08:15');
  assert.equal(parseTimeInput('999', '08:15'), '08:15');
  assert.equal(parseTimeInput('2575', '08:15'), '08:15');
  assert.equal(parseTimeInput('123456', '08:15'), '08:15');
});

test('addMinutes wraps around midnight in both directions', () => {
  assert.equal(addMinutes('09:00', 90), '10:30');
  assert.equal(addMinutes('23:50', 20), '00:10');
  assert.equal(addMinutes('00:05', -10), '23:55');
  assert.equal(addMinutes('09:00', 0), '09:00');
});

test('diffMinutes returns signed minutes without wrapping', () => {
  assert.equal(diffMinutes('09:00', '10:30'), 90);
  assert.equal(diffMinutes('09:00', '09:00'), 0);
  assert.equal(diffMinutes('10:00', '09:15'), -45);
});

test('formatDuration renders hours and minutes', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(45), '45m');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(185), '3h 5m');
});

test('formatTimeRange joins the range with its duration', () => {
  assert.equal(formatTimeRange('09:00', '10:30'), '09:00 - 10:30 · 1h 30m');
});

test('validateManualEntry rejects non-positive spans only', () => {
  assert.equal(validateManualEntry('end', '09:00', '10:00', 60), null);
  assert.equal(
    validateManualEntry('end', '10:00', '09:00', 60),
    'End time must be later than start time.'
  );
  assert.equal(
    validateManualEntry('end', '09:00', '09:00', 60),
    'End time must be later than start time.'
  );
  assert.equal(validateManualEntry('duration', '09:00', '10:00', 30), null);
  assert.equal(
    validateManualEntry('duration', '09:00', '10:00', 0),
    'Duration must be longer than zero minutes.'
  );
});

test('validateManualEntry rejects a duration that would cross midnight', () => {
  assert.equal(validateManualEntry('duration', '23:00', '10:00', 60), null);
  assert.equal(
    validateManualEntry('duration', '23:00', '10:00', 61),
    'Session must end on the same day. Shorten the duration.'
  );
  assert.equal(
    validateManualEntry('duration', '09:00', '10:00', 20 * 60),
    'Session must end on the same day. Shorten the duration.'
  );
  assert.equal(validateManualEntry('duration', '09:00', '10:00', 60), null);
  assert.equal(
    validateManualEntry('duration', '09:00', '10:00', 0),
    'Duration must be longer than zero minutes.'
  );
});
