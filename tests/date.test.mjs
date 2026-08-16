import assert from 'node:assert/strict';
import test from 'node:test';
import {
  boundsFromDayStrings,
  clampDay,
  eachDay,
  eachWeek,
  monthBounds,
  parseDay,
  weekBounds,
} from '../src/lib/date.ts';

// The bounds carry ISO instants, whose wall-clock text depends on the machine
// timezone. Assertions therefore check the instants by parsing them back into
// local time, which holds in every timezone.
function localParts(iso) {
  const d = new Date(iso);
  return { day: d.getDay(), date: d.getDate(), hours: d.getHours(), minutes: d.getMinutes() };
}

test('week bounds run Monday 00:00 to Sunday 23:59 local', () => {
  const bounds = weekBounds(new Date(2026, 7, 13)); // Thursday 13 Aug 2026
  assert.equal(bounds.startDay, '2026-08-10');
  assert.equal(bounds.endDay, '2026-08-16');
  assert.deepEqual(localParts(bounds.start), { day: 1, date: 10, hours: 0, minutes: 0 });
  assert.deepEqual(localParts(bounds.end), { day: 0, date: 16, hours: 23, minutes: 59 });
});

test('a Sunday belongs to the week that started six days earlier', () => {
  const bounds = weekBounds(new Date(2026, 7, 16)); // Sunday 16 Aug 2026
  assert.equal(bounds.startDay, '2026-08-10');
  assert.equal(bounds.endDay, '2026-08-16');
});

test('a negative week offset walks back one week at a time', () => {
  assert.equal(weekBounds(new Date(2026, 7, 13), -1).startDay, '2026-08-03');
  assert.equal(weekBounds(new Date(2026, 7, 13), -2).endDay, '2026-08-02');
});

test('week offsets cross a month and a year boundary', () => {
  assert.equal(weekBounds(new Date(2027, 0, 6), -1).startDay, '2026-12-28');
});

test('month bounds cover the first to the last calendar day', () => {
  const bounds = monthBounds(new Date(2026, 7, 16));
  assert.equal(bounds.startDay, '2026-08-01');
  assert.equal(bounds.endDay, '2026-08-31');
});

test('a negative month offset lands on the previous month with its own length', () => {
  assert.equal(monthBounds(new Date(2026, 2, 15), -1).endDay, '2026-02-28');
  assert.equal(monthBounds(new Date(2024, 2, 15), -1).endDay, '2024-02-29');
  assert.equal(monthBounds(new Date(2026, 0, 15), -1).startDay, '2025-12-01');
});

test('bounds from day strings keep local midnight and end of day', () => {
  const bounds = boundsFromDayStrings('2026-08-01', '2026-12-15');
  assert.deepEqual(localParts(bounds.start), { day: 6, date: 1, hours: 0, minutes: 0 });
  assert.deepEqual(localParts(bounds.end), { day: 2, date: 15, hours: 23, minutes: 59 });
});

test('bound instants match a plain local Date for the same wall clock', () => {
  const bounds = boundsFromDayStrings('2026-08-10', '2026-08-10');
  assert.equal(bounds.start, parseDay('2026-08-10').toISOString());
});

test('clampDay pulls a day inside the span and leaves inside days alone', () => {
  assert.equal(clampDay('2026-07-01', '2026-08-01', '2026-12-15'), '2026-08-01');
  assert.equal(clampDay('2027-01-01', '2026-08-01', '2026-12-15'), '2026-12-15');
  assert.equal(clampDay('2026-09-09', '2026-08-01', '2026-12-15'), '2026-09-09');
});

test('eachDay lists every day inclusive of both ends', () => {
  assert.deepEqual(eachDay({ startDay: '2026-08-30', endDay: '2026-09-02' }), [
    '2026-08-30',
    '2026-08-31',
    '2026-09-01',
    '2026-09-02',
  ]);
  assert.deepEqual(eachDay({ startDay: '2026-08-30', endDay: '2026-08-30' }), ['2026-08-30']);
  assert.equal(eachDay({ startDay: '2026-08-01', endDay: '2026-08-31' }).length, 31);
});

test('eachWeek covers the span with untrimmed Monday weeks', () => {
  assert.deepEqual(eachWeek({ startDay: '2026-08-05', endDay: '2026-08-18' }), [
    { startDay: '2026-08-03', endDay: '2026-08-09' },
    { startDay: '2026-08-10', endDay: '2026-08-16' },
    { startDay: '2026-08-17', endDay: '2026-08-23' },
  ]);
});

test('a single-day span still yields the week containing it', () => {
  assert.deepEqual(eachWeek({ startDay: '2026-08-16', endDay: '2026-08-16' }), [
    { startDay: '2026-08-10', endDay: '2026-08-16' },
  ]);
});
