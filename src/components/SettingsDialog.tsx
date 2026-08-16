import { THEME_OPTIONS, type ThemeId } from '../lib/theme';
import { AppIcon } from './Icons';

interface Props {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onClose: () => void;
}

export default function SettingsDialog({ theme, onThemeChange, onClose }: Props) {
  return (
    <div
      className="dialog-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="dialog-panel dialog-settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2 id="settings-dialog-title">Settings</h2>
          </div>
          <button
            className="icon-button icon-button-quiet"
            type="button"
            autoFocus
            aria-label="Close settings"
            onClick={onClose}
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <section className="settings-card">
          <div className="settings-card-header">
            <h3>Appearance</h3>
            <p>Theme applies to the whole app and is saved on this machine.</p>
          </div>
          <div className="theme-grid" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => {
              const active = option.id === theme;
              return (
                <button
                  key={option.id}
                  className={`theme-card ${active ? 'selected' : ''}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onThemeChange(option.id)}
                >
                  <span className="theme-swatch" style={{ background: option.swatch.base }}>
                    <span className="theme-dot" style={{ background: option.swatch.dots[0] }} />
                    <span className="theme-dot" style={{ background: option.swatch.dots[1] }} />
                  </span>
                  <span className="theme-card-label">{option.label}</span>
                  <span className="theme-card-check" aria-hidden="true">
                    {active && <AppIcon name="check" size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
