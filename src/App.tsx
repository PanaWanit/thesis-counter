import { useEffect, useState } from 'react';
import type { Semester } from './types';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import { AppIcon } from './components/Icons';
import {
  applyThemePreference,
  normalizeThemePreference,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './lib/theme';

function App() {
  const [selected, setSelected] = useState<Semester | null>(null);
  const [createRequest, setCreateRequest] = useState(0);
  const [editRequest, setEditRequest] = useState(0);
  const [theme, setTheme] = useState<ThemeId>(() =>
    normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY))
  );

  useEffect(() => {
    applyThemePreference(theme, document.documentElement, window.localStorage);
  }, [theme]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to workspace</a>
      <Sidebar
        selected={selected}
        onSelect={setSelected}
        createRequest={createRequest}
        editRequest={editRequest}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main id="main-content" className="workspace-main" tabIndex={-1}>
        {selected ? (
          <Tabs
            semester={selected}
            onEditSemester={() => setEditRequest((value) => value + 1)}
          />
        ) : (
          <div className="workspace">
            <section className="empty-state" aria-labelledby="empty-semester-title">
              <span className="empty-icon"><AppIcon name="book" size={28} /></span>
              <p className="eyebrow">Research Studio</p>
              <h1 id="empty-semester-title">Create your first semester</h1>
              <p>
                Set your dates and credits to calculate a weekly research target.
                One credit equals three required hours each week.
              </p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => setCreateRequest((value) => value + 1)}
              >
                <AppIcon name="plus" />
                Create semester
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
