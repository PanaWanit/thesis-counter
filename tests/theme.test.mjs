import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  applyThemePreference,
  isThemeId,
  normalizeThemePreference,
} from '../src/lib/theme.ts';

test('lists System first and keeps programmer themes in stable order', () => {
  assert.deepEqual(THEME_OPTIONS.map(({ id }) => id), [
    'system', 'notebook', 'light', 'dark', 'dracula', 'nord',
    'solarized', 'monokai', 'one-dark', 'github', 'catppuccin', 'tokyo-night',
  ]);
  assert.equal(THEME_OPTIONS[0].label, 'System (auto)');
});

test('accepts only known theme IDs', () => {
  assert.equal(isThemeId('dracula'), true);
  assert.equal(isThemeId('not-a-theme'), false);
  assert.equal(isThemeId(null), false);
});

test('falls back to System for missing or invalid preferences', () => {
  assert.equal(normalizeThemePreference(undefined), 'system');
  assert.equal(normalizeThemePreference(null), 'system');
  assert.equal(normalizeThemePreference('not-a-theme'), 'system');
  assert.equal(normalizeThemePreference('tokyo-night'), 'tokyo-night');
});

test('applies and persists a selected theme', () => {
  const root = { dataset: {} };
  const writes = [];
  const storage = { setItem: (key, value) => writes.push([key, value]) };

  applyThemePreference('nord', root, storage);

  assert.equal(root.dataset.theme, 'nord');
  assert.deepEqual(writes, [[THEME_STORAGE_KEY, 'nord']]);
});
