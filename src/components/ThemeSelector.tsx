import { THEME_OPTIONS, isThemeId, type ThemeId } from '../lib/theme';

interface Props {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export default function ThemeSelector({ value, onChange }: Props) {
  return (
    <div className="theme-control">
      <label className="theme-label" htmlFor="theme-select">Appearance</label>
      <select
        id="theme-select"
        className="control theme-select"
        value={value}
        onChange={(event) => {
          if (isThemeId(event.currentTarget.value)) {
            onChange(event.currentTarget.value);
          }
        }}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
