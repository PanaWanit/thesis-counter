export const THEME_STORAGE_KEY = 'thesis-counter-theme';

// `base` is any CSS background value; `dots` are the accent and highlight colors
// drawn on top of it in the settings theme cards.
export const THEME_OPTIONS = [
  {
    id: 'system',
    label: 'System (auto)',
    swatch: { base: 'linear-gradient(135deg, #f6f8fa 0 50%, #181a1f 50% 100%)', dots: ['#0969da', '#e47680'] },
  },
  { id: 'notebook', label: 'Research Notebook', swatch: { base: '#f4f1eb', dots: ['#176b67', '#ca3851'] } },
  { id: 'light', label: 'Light', swatch: { base: '#f6f8fa', dots: ['#0969da', '#cf222e'] } },
  { id: 'dark', label: 'Dark', swatch: { base: '#181a1f', dots: ['#5b9cf6', '#e47680'] } },
  { id: 'dracula', label: 'Dracula', swatch: { base: '#282a36', dots: ['#bd93f9', '#ff79c6'] } },
  { id: 'nord', label: 'Nord', swatch: { base: '#2e3440', dots: ['#88c0d0', '#bf616a'] } },
  { id: 'solarized', label: 'Solarized', swatch: { base: '#fdf6e3', dots: ['#268bd2', '#dc322f'] } },
  { id: 'monokai', label: 'Monokai', swatch: { base: '#272822', dots: ['#66d9ef', '#f92672'] } },
  { id: 'one-dark', label: 'One Dark', swatch: { base: '#282c34', dots: ['#61afef', '#e06c75'] } },
  { id: 'github', label: 'GitHub', swatch: { base: '#f6f8fa', dots: ['#0969da', '#cf222e'] } },
  { id: 'catppuccin', label: 'Catppuccin Mocha', swatch: { base: '#1e1e2e', dots: ['#89b4fa', '#f38ba8'] } },
  { id: 'tokyo-night', label: 'Tokyo Night', swatch: { base: '#1a1b26', dots: ['#7aa2f7', '#f7768e'] } },
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
