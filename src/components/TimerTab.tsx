import { useCallback, useEffect, useState } from 'react';
import type { Category, Semester, SemesterStats, WeeklyStats } from '../types';
import {
  createSession,
  getSemesterStats,
  getWeeklyStats,
  listCategories,
} from '../db';
import { AppIcon } from './Icons';

interface Props {
  semester: Semester;
}

function formatElapsed(elapsed: number) {
  const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
  });
}

export default function TimerTab({ semester }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [semesterStats, setSemesterStats] = useState<SemesterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [timerError, setTimerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await listCategories();
        setCategories(data);
        setCategoryId((current) => current ?? data[0]?.id ?? null);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setTimerError('Could not load categories. Open Categories and try again.');
      }
    };
    void loadCategories();
  }, []);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const [weeklyData, semesterData] = await Promise.all([
        getWeeklyStats(semester),
        getSemesterStats(semester),
      ]);
      setWeekly(weeklyData);
      setSemesterStats(semesterData);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setStatsError('Progress is unavailable right now.');
    } finally {
      setStatsLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (!startTime) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startTime]);

  const start = () => {
    if (categoryId === null) return;
    setTimerError('');
    setStartTime(new Date());
    setElapsed(0);
  };

  const stop = async () => {
    if (!startTime || categoryId === null) return;
    setSaving(true);
    setTimerError('');
    const endedAt = new Date();
    try {
      await createSession({
        semester_id: semester.id,
        category_id: categoryId,
        started_at: startTime.toISOString(),
        ended_at: endedAt.toISOString(),
        title: '',
        note: note.trim(),
        manual: 0,
      });
      setStartTime(null);
      setElapsed(0);
      setNote('');
      await refreshStats();
    } catch (error) {
      console.error('Failed to save session:', error);
      setTimerError('Session was not saved. Keep the timer open and try Stop again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.max(0, Math.min(100, weekly?.progress_percent ?? 0));

  return (
    <section aria-labelledby="focus-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Deep work</p>
          <h2 id="focus-title">Focus session</h2>
          <p className="supporting-copy">Choose a research category, then make the next block count.</p>
        </div>
        <span className={`status-pill ${startTime ? 'running' : ''}`}>
          <span className="status-dot" />
          {startTime ? 'Session running' : 'Ready to focus'}
        </span>
      </div>

      <div className="focus-grid">
        <article className={`timer-card ${startTime ? 'running' : ''}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live timer</p>
              <h3>{startTime ? 'Stay with the work' : 'What are you working on?'}</h3>
            </div>
            <AppIcon name="clock" size={22} aria-hidden="true" />
          </div>

          <time className="timer-time" dateTime={`PT${elapsed}S`}>{formatElapsed(elapsed)}</time>

          <div className="timer-form">
            <div className="field">
              <label htmlFor="timer-category">Research category</label>
              <select
                id="timer-category"
                className="control"
                value={categoryId ?? ''}
                onChange={(event) => setCategoryId(event.target.value === '' ? null : Number(event.target.value))}
                disabled={startTime !== null || categories.length === 0}
              >
                <option value="">{categories.length === 0 ? 'No categories available' : 'Select category'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="timer-actions">
              {startTime ? (
                <button className="button button-primary" type="button" disabled={saving} onClick={stop}>
                  <AppIcon name="stop" size={17} />
                  {saving ? 'Saving…' : 'Stop & save'}
                </button>
              ) : (
                <button className="button button-primary" type="button" disabled={categoryId === null} onClick={start}>
                  <AppIcon name="play" size={17} />
                  Start focus
                </button>
              )}
            </div>

            <div className="field timer-note">
              <label htmlFor="timer-note">Session note <span className="helper-text">(optional)</span></label>
              <textarea
                id="timer-note"
                className="control"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What will you move forward?"
              />
            </div>
          </div>

          {timerError && (
            <div className="alert" role="alert">
              <AppIcon name="close" size={16} />
              <span>{timerError}</span>
            </div>
          )}
        </article>

        {statsLoading ? (
          <aside className="panel loading-stack" aria-label="Loading research progress">
            <div className="skeleton" style={{ minHeight: 110 }} />
            <div className="skeleton" />
            <div className="skeleton" />
          </aside>
        ) : statsError || !weekly || !semesterStats ? (
          <aside className="panel">
            <div className="empty-state compact">
              <span className="empty-icon"><AppIcon name="insights" size={25} /></span>
              <h3>Progress unavailable</h3>
              <p>{statsError || 'Research progress could not be calculated.'}</p>
              <button className="button button-secondary" type="button" onClick={refreshStats}>Retry</button>
            </div>
          </aside>
        ) : (
          <aside className="trail-card" aria-labelledby="research-trail-title">
            <div>
              <p className="eyebrow">Research Trail</p>
              <h3 id="research-trail-title">This week’s momentum</h3>

              <div className="trail-hero">
                <span className="trail-value">{weekly.current_week_hours.toFixed(1)}h</span>
                <span className="trail-label">of {weekly.required_hours} required hours</span>
              </div>

              <div className="progress-wrap">
                <div className="progress-label">
                  <span>Weekly progress</span>
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
          </aside>
        )}
      </div>
    </section>
  );
}
