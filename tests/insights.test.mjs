import assert from 'node:assert/strict';
import test from 'node:test';
import { boundsFromDayStrings } from '../src/lib/date.ts';
import { bucketScale, computeDelta, dailyBuckets, weeklyBuckets } from '../src/lib/insights.ts';

const week = boundsFromDayStrings('2026-08-10', '2026-08-16');

test('daily buckets keep one entry per day and zero-fill the quiet ones', () => {
  const buckets = dailyBuckets(week, [
    { day: '2026-08-10', minutes: 90 },
    { day: '2026-08-14', minutes: 45 },
  ]);
  assert.equal(buckets.length, 7);
  assert.deepEqual(buckets[0], { key: '2026-08-10', endKey: '2026-08-10', minutes: 90 });
  assert.deepEqual(buckets[1], { key: '2026-08-11', endKey: '2026-08-11', minutes: 0 });
  assert.equal(buckets[4].minutes, 45);
});

test('daily buckets sum rows that repeat a day', () => {
  const buckets = dailyBuckets(boundsFromDayStrings('2026-08-10', '2026-08-10'), [
    { day: '2026-08-10', minutes: 30 },
    { day: '2026-08-10', minutes: 20 },
  ]);
  assert.equal(buckets[0].minutes, 50);
});

test('daily buckets ignore rows outside the span', () => {
  const buckets = dailyBuckets(week, [{ day: '2026-08-09', minutes: 600 }]);
  assert.equal(bucketScale(buckets), 0);
});

test('weekly buckets total each Monday week and label its real span', () => {
  const span = boundsFromDayStrings('2026-08-05', '2026-08-18');
  const buckets = weeklyBuckets(span, [
    { day: '2026-08-05', minutes: 60 }, // week of 3 Aug
    { day: '2026-08-09', minutes: 30 }, // week of 3 Aug
    { day: '2026-08-12', minutes: 120 }, // week of 10 Aug
    { day: '2026-08-17', minutes: 15 }, // week of 17 Aug
  ]);
  assert.deepEqual(buckets, [
    { key: '2026-08-03', endKey: '2026-08-09', minutes: 90 },
    { key: '2026-08-10', endKey: '2026-08-16', minutes: 120 },
    { key: '2026-08-17', endKey: '2026-08-23', minutes: 15 },
  ]);
});

test('bucketScale returns the busiest bucket, or zero when all are empty', () => {
  assert.equal(bucketScale(dailyBuckets(week, [{ day: '2026-08-12', minutes: 75 }])), 75);
  assert.equal(bucketScale([]), 0);
});

test('computeDelta reports the signed difference and its percentage', () => {
  assert.deepEqual(computeDelta(180, 120), { diff_minutes: 60, percent: 50 });
  assert.deepEqual(computeDelta(60, 120), { diff_minutes: -60, percent: -50 });
  assert.deepEqual(computeDelta(120, 120), { diff_minutes: 0, percent: 0 });
});

test('computeDelta has no percentage when the baseline is empty', () => {
  assert.deepEqual(computeDelta(120, 0), { diff_minutes: 120, percent: null });
  assert.deepEqual(computeDelta(0, 0), { diff_minutes: 0, percent: null });
});
