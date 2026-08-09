export const THEME_STORAGE_KEY = 'thesis-counter-theme';

export const THEME_OPTIONS = [
  { id: 'system', label: 'System (auto)' },
  { id: 'notebook', label: 'Research Notebook' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'nord', label: 'Nord' },
  { id: 'solarized', label: 'Solarized' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'one-dark', label: 'One Dark' },
  { id: 'github', label: 'GitHub' },
  { id: 'catppuccin', label: 'Catppuccin Mocha' },
  { id: 'tokyo-night', label: 'Tokyo Night' },
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];
export type ThemeOption = typeof THEME_OPTIONS[number];
export type ThemeRoot = { dataset: { theme?: string } };
export type ThemeStorage = { setItem: (key: string, value: string) => void };

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_OPTIONS.some((option) => option.id === value);
}

export function normalizeThemePreference(value: string | null | undefined): ThemeId {
  return isThemeId(value) ? value : 'system';
}

export function applyThemePreference(
  theme: ThemeId,
  root: ThemeRoot,
  storage: ThemeStorage,
): void {
  root.dataset.theme = theme;
  storage.setItem(THEME_STORAGE_KEY, theme);
}
