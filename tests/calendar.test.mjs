import assert from 'node:assert/strict';
import test from 'node:test';
import {
  endOfWeek,
  formatDateLabel,
  inRange,
  isSameDay,
  monthGrid,
  parseDateString,
  shiftDate,
  shiftMonth,
  startOfWeek,
  toDateString,
} from '../src/lib/calendar.ts';

test('toDateString and parseDateString round-trip', () => {
  assert.equal(toDateString(2026, 7, 16), '2026-08-16');
  assert.deepEqual(parseDateString('2026-08-16'), { year: 2026, month: 7, day: 16 });
});

test('monthGrid always returns 42 Monday-first cells', () => {
  const grid = monthGrid(2026, 7);
  assert.equal(grid.length, 42);
  assert.equal(grid[0].date, '2026-07-27');
  assert.equal(grid[0].inMonth, false);
  assert.equal(grid[5].date, '2026-08-01');
  assert.equal(grid[5].inMonth, true);
});

test('monthGrid handles a leap February', () => {
  const grid = monthGrid(2024, 1);
  const february = grid.filter((cell) => cell.inMonth);
  assert.equal(february.length, 29);
  assert.equal(february[28].date, '2024-02-29');
});

test('monthGrid handles a month starting on Monday', () => {
  const grid = monthGrid(2026, 5);
  assert.equal(grid[0].date, '2026-06-01');
  assert.equal(grid[0].inMonth, true);
});

test('monthGrid handles a month starting on Sunday', () => {
  const grid = monthGrid(2026, 2);
  assert.equal(grid[0].date, '2026-02-23');
  assert.equal(grid[6].date, '2026-03-01');
  assert.equal(grid[6].inMonth, true);
});

test('shiftDate crosses month and year boundaries', () => {
  assert.equal(shiftDate('2026-08-31', 1), '2026-09-01');
  assert.equal(shiftDate('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDate('2026-08-16', 7), '2026-08-23');
});

test('shiftMonth clamps onto shorter months', () => {
  assert.equal(shiftMonth('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftMonth('2026-03-15', -1), '2026-02-15');
  assert.equal(shiftMonth('2026-12-15', 1), '2027-01-15');
});

test('startOfWeek and endOfWeek use Monday weeks', () => {
  assert.equal(startOfWeek('2026-08-16'), '2026-08-10');
  assert.equal(endOfWeek('2026-08-16'), '2026-08-16');
  assert.equal(startOfWeek('2026-08-10'), '2026-08-10');
});

test('inRange includes both endpoints', () => {
  assert.equal(inRange('2026-08-16', '2026-08-16', '2026-08-20'), true);
  assert.equal(inRange('2026-08-20', '2026-08-16', '2026-08-20'), true);
  assert.equal(inRange('2026-08-21', '2026-08-16', '2026-08-20'), false);
  assert.equal(inRange('2026-08-15', '2026-08-16', '2026-08-20'), false);
});

test('isSameDay compares calendar strings', () => {
  assert.equal(isSameDay('2026-08-16', '2026-08-16'), true);
  assert.equal(isSameDay('2026-08-16', '2026-08-17'), false);
});

test('formatDateLabel renders a readable local label', () => {
  assert.equal(formatDateLabel('2026-08-16'), 'Sun 16 Aug 2026');
});
