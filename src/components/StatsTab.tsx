import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Semester, WeeklyStats, SemesterStats, CategoryBreakdown, Category } from '../types';
import { getWeeklyStats, getSemesterStats, getCategoryBreakdown, listCategories } from '../db';
import ExportButton from './ExportButton';
import { AppIcon } from './Icons';

interface Props {
  semester: Semester;
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
  });
}

export default function StatsTab({ semester }: Props) {
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [semesterStats, setSemesterStats] = useState<SemesterStats | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [weeklyData, semesterData, breakdownData, categoryData] = await Promise.all([
        getWeeklyStats(semester),
        getSemesterStats(semester),
        getCategoryBreakdown(semester.id),
        listCategories(),
      ]);
      setWeekly(weeklyData);
      setSemesterStats(semesterData);
      setBreakdown(breakdownData);
      setCategories(categoryData);
    } catch (loadError) {
      console.error('Failed to load insights:', loadError);
      setError('Could not calculate research insights.');
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <section aria-label="Loading research insights">
        <div className="section-header">
          <div><p className="eyebrow">Performance</p><h2>Research insights</h2></div>
        </div>
        <div className="insights-grid">
          <div className="panel loading-stack"><div className="skeleton" style={{ minHeight: 220 }} /></div>
          <div className="panel loading-stack"><div className="skeleton" style={{ minHeight: 220 }} /></div>
          <div className="panel breakdown-panel loading-stack"><div className="skeleton" /><div className="skeleton" /></div>
        </div>
      </section>
    );
  }

  if (error || !weekly || !semesterStats) {
    return (
      <section aria-labelledby="insights-error-title">
        <div className="empty-state">
          <span className="empty-icon"><AppIcon name="insights" size={27} /></span>
          <h2 id="insights-error-title">Insights unavailable</h2>
          <p>{error || 'Research insights could not be calculated.'}</p>
          <button className="button button-accent" type="button" onClick={refresh}>Retry</button>
        </div>
      </section>
    );
  }

  const progress = Math.max(0, Math.min(100, weekly.progress_percent));
  const activeBreakdown = breakdown.filter((item) => item.total_minutes > 0);

  return (
    <section aria-labelledby="insights-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Performance</p>
          <h2 id="insights-title">Research insights</h2>
          <p className="supporting-copy">See weekly momentum and the shape of your semester.</p>
        </div>
        <ExportButton semester={semester} categories={categories} />
      </div>

      <div className="insights-grid">
        <article className="trail-card" aria-labelledby="insights-trail-title">
          <div>
            <p className="eyebrow">Research Trail</p>
            <h3 id="insights-trail-title">Weekly target</h3>
            <div className="trail-hero">
              <span className="trail-value">{weekly.current_week_hours.toFixed(1)}h</span>
              <span className="trail-label">of {weekly.required_hours} required hours</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-label">
                <span>Week progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <progress value={progress} max={100} aria-label={`${progress.toFixed(0)} percent of weekly target`} />
            </div>
          </div>
          <div className="trail-meta">
            <div className="trail-meta-item">
              <span className="trail-meta-value">{formatShortDate(semester.start_date)} – {formatShortDate(semester.end_date)}</span>
              <span className="trail-meta-label">Semester arc</span>
            </div>
            <div className="trail-meta-item">
              <span className="trail-meta-value">{semesterStats.days_remaining} days</span>
              <span className="trail-meta-label">Remaining</span>
            </div>
          </div>
        </article>

        <article className="panel semester-total" aria-labelledby="semester-total-title">
          <div>
            <p className="eyebrow">Semester body of work</p>
            <h3 id="semester-total-title">Recorded research</h3>
            <div className="total-value">{semesterStats.total_hours.toFixed(1)}<span>hours</span></div>
          </div>
          <div className="metric-strip">
            <div className="metric-item">
              <span className="metric-value">{semesterStats.session_count}</span>
              <span className="metric-label">Saved sessions</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{semesterStats.average_hours_per_week.toFixed(1)}h</span>
              <span className="metric-label">Average per week</span>
            </div>
          </div>
        </article>

        <article className="panel breakdown-panel" aria-labelledby="category-breakdown-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Allocation</p>
              <h3 id="category-breakdown-title">Time by category</h3>
            </div>
            <AppIcon name="categories" size={21} />
          </div>

          {semesterStats.session_count === 0 || activeBreakdown.length === 0 ? (
            <div className="empty-state compact">
              <span className="empty-icon"><AppIcon name="clock" size={25} /></span>
              <h3>No research time yet</h3>
              <p>Start a focus session or add a manual entry to reveal your category mix.</p>
            </div>
          ) : (
            <div className="breakdown-list">
              {activeBreakdown.map((item) => {
                const style = {
                  '--bar-size': `${Math.max(item.percent, 1.5)}%`,
                  '--category-color': item.color,
                } as CSSProperties;
                return (
                  <div className="breakdown-row" key={item.category_id}>
                    <span className="category-label">
                      <span className="category-dot" style={style} />
                      {item.name}
                    </span>
                    <div className="breakdown-track" aria-hidden="true">
                      <div className="breakdown-bar" style={style} />
                    </div>
                    <span className="breakdown-value">{item.total_hours.toFixed(1)}h · {item.percent.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
