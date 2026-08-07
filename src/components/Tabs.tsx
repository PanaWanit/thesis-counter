import { useState } from 'react';
import type { Semester } from '../types';
import TimerTab from './TimerTab';
import SessionsTab from './SessionsTab';
import StatsTab from './StatsTab';
import CategoryManager from './CategoryManager';

type TabKey = 'timer' | 'sessions' | 'stats' | 'categories';

interface Props {
  semester: Semester;
}

export default function Tabs({ semester }: Props) {
  const [active, setActive] = useState<TabKey>('timer');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['timer', 'sessions', 'stats', 'categories'] as TabKey[]).map((k) => (
          <button key={k} style={{ fontWeight: active === k ? 'bold' : 'normal' }} onClick={() => setActive(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      {active === 'timer' && <TimerTab semester={semester} />}
      {active === 'sessions' && <SessionsTab semester={semester} />}
      {active === 'stats' && <StatsTab semester={semester} />}
      {active === 'categories' && <CategoryManager />}
    </div>
  );
}
