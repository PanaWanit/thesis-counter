import { useState } from 'react';
import type { Semester } from '../types';
import TimerTab from './TimerTab';
import SessionsTab from './SessionsTab';
import StatsTab from './StatsTab';
import CategoryManager from './CategoryManager';
import { AppIcon, type IconName } from './Icons';

type TabKey = 'timer' | 'sessions' | 'stats' | 'categories';

interface Props {
  semester: Semester;
  onEditSemester: () => void;
}

const navigation: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'timer', label: 'Focus', icon: 'clock' },
  { key: 'sessions', label: 'Sessions', icon: 'sessions' },
  { key: 'stats', label: 'Insights', icon: 'insights' },
  { key: 'categories', label: 'Categories', icon: 'categories' },
];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function Tabs({ semester, onEditSemester }: Props) {
  const [active, setActive] = useState<TabKey>('timer');

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="page-heading-row">
          <div className="page-heading">
            <p className="eyebrow">Current semester</p>
            <h1>{semester.name}</h1>
            <p className="page-subtitle">
              <span><AppIcon name="calendar" size={15} /> {formatDate(semester.start_date)} – {formatDate(semester.end_date)}</span>
              <span><AppIcon name="book" size={15} /> {semester.credits} credits · {semester.credits * 3}h/week</span>
            </p>
          </div>
          <div className="semester-header-actions">
            <span className="badge"><span className="status-dot" /> Active semester</span>
            <button
              id="edit-semester-button"
              className="button button-secondary"
              type="button"
              onClick={onEditSemester}
            >
              <AppIcon name="edit" size={17} />
              Edit semester
            </button>
          </div>
        </div>

        <nav className="tab-nav" aria-label="Workspace sections">
          {navigation.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${active === item.key ? 'active' : ''}`}
              type="button"
              aria-pressed={active === item.key}
              onClick={() => setActive(item.key)}
            >
              <AppIcon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="view" key={active}>
        {active === 'timer' && <TimerTab semester={semester} />}
        {active === 'sessions' && <SessionsTab semester={semester} />}
        {active === 'stats' && <StatsTab semester={semester} />}
        {active === 'categories' && <CategoryManager />}
      </div>
    </div>
  );
}
