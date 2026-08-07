import { useEffect, useState } from 'react';
import type { Semester, WeeklyStats, SemesterStats, CategoryBreakdown } from '../types';
import { getWeeklyStats, getSemesterStats, getCategoryBreakdown } from '../db';

interface Props {
  semester: Semester;
}

export default function StatsTab({ semester }: Props) {
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [semesterStats, setSemesterStats] = useState<SemesterStats | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);

  const refresh = async () => {
    setWeekly(await getWeeklyStats(semester));
    setSemesterStats(await getSemesterStats(semester));
    setBreakdown(await getCategoryBreakdown(semester.id));
  };

  useEffect(() => { refresh(); }, [semester]);

  return (
    <div>
      <h2>Stats</h2>
      {weekly && (
        <div>
          <h3>This Week</h3>
          <div>{weekly.current_week_hours.toFixed(1)} / {weekly.required_hours} h</div>
          <progress value={weekly.progress_percent} max={100} style={{ width: '100%' }} />
          <div>{weekly.progress_percent.toFixed(0)}%</div>
        </div>
      )}
      {semesterStats && (
        <div>
          <h3>Semester</h3>
          <div>Total: {semesterStats.total_hours.toFixed(1)} h ({semesterStats.session_count} sessions)</div>
          <div>Avg/week: {semesterStats.average_hours_per_week.toFixed(1)} h</div>
          <div>Days remaining: {semesterStats.days_remaining}</div>
        </div>
      )}
      <h3>By Category</h3>
      <ul>
        {breakdown.map((b) => (
          <li key={b.category_id}>
            <span style={{ color: b.color }}>●</span> {b.name}: {b.total_hours.toFixed(1)} h ({b.percent}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
