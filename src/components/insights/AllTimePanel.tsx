import type { CSSProperties } from 'react';
import type { AllTimeData } from './load';
import { AppIcon } from '../Icons';
import { formatShortDate } from './format';

interface Props {
  data: AllTimeData;
  currentSemesterId: number;
}

export default function AllTimePanel({ data, currentSemesterId }: Props) {
  const peak = data.semesters.reduce((max, item) => Math.max(max, item.total_minutes), 0);
  const best = data.semesters.reduce(
    (top, item) => (item.total_minutes > (top?.total_minutes ?? -1) ? item : top),
    data.semesters[0] ?? null
  );
  const averagePerSemester = data.semesters.length > 0 ? data.totalHours / data.semesters.length : 0;

  return (
    <>
      <article className="trail-card" aria-labelledby="insights-alltime-title">
        <div>
          <p className="eyebrow">Every semester</p>
          <h3 id="insights-alltime-title">Lifetime research</h3>
          <div className="trail-hero">
            <span className="trail-value">{data.totalHours.toFixed(1)}h</span>
            <span className="trail-label">across {data.semesters.length} semesters</span>
          </div>
        </div>
        <div className="trail-meta">
          <div className="trail-meta-item">
            <span className="trail-meta-value">{data.totalSessions}</span>
            <span className="trail-meta-label">Sessions logged</span>
          </div>
          <div className="trail-meta-item">
            <span className="trail-meta-value">{averagePerSemester.toFixed(1)}h</span>
            <span className="trail-meta-label">Average per semester</span>
          </div>
        </div>
      </article>

      <article className="panel semester-total" aria-labelledby="insights-best-semester-title">
        <div>
          <p className="eyebrow">Personal best</p>
          <h3 id="insights-best-semester-title">Busiest semester</h3>
          <div className="total-value">{((best?.total_minutes ?? 0) / 60).toFixed(1)}<span>hours</span></div>
          {best && <p className="panel-note">{best.name}</p>}
        </div>
        <div className="metric-strip">
          <div className="metric-item">
            <span className="metric-value">{best?.session_count ?? 0}</span>
            <span className="metric-label">Sessions that semester</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{best ? formatShortDate(best.start_date) : '—'}</span>
            <span className="metric-label">Started</span>
          </div>
        </div>
      </article>

      <article className="panel chart-panel" aria-labelledby="insights-semesters-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Comparison</p>
            <h3 id="insights-semesters-title">Hours per semester</h3>
          </div>
          <AppIcon name="insights" size={21} />
        </div>

        {data.semesters.length === 0 ? (
          <div className="empty-state compact">
            <span className="empty-icon"><AppIcon name="clock" size={25} /></span>
            <h3>No semesters yet</h3>
            <p>Create a semester to start comparing your research output over time.</p>
          </div>
        ) : (
          <div className="breakdown-list">
            {data.semesters.map((item) => {
              const style = {
                '--bar-size': `${peak > 0 ? Math.max((item.total_minutes / peak) * 100, 1.5) : 0}%`,
              } as CSSProperties;
              const isCurrent = item.semester_id === currentSemesterId;
              return (
                <div className="breakdown-row" key={item.semester_id} data-current={isCurrent}>
                  <span className="category-label">
                    <span className="semester-name">{item.name}</span>
                    {isCurrent && <span className="current-tag">Current</span>}
                  </span>
                  <div className="breakdown-track" aria-hidden="true">
                    <div className="breakdown-bar" style={style} data-muted={!isCurrent} />
                  </div>
                  <span className="breakdown-value">{item.total_hours.toFixed(1)}h · {item.session_count}</span>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </>
  );
}
