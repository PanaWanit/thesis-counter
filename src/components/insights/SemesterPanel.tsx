import type { SemesterData } from './load';
import type { Bar } from './BarChart';
import BarChart from './BarChart';
import { formatHours, formatShortDate, formatSpan } from './format';

interface Props {
  data: SemesterData;
}

export default function SemesterPanel({ data }: Props) {
  const bars: Bar[] = data.buckets.map((bucket, index) => ({
    key: bucket.key,
    label: index % 2 === 0 ? `W${index + 1}` : '',
    title: `Week ${index + 1} (${formatShortDate(bucket.key)} – ${formatShortDate(bucket.endKey)}): ${formatHours(bucket.minutes)}`,
    minutes: bucket.minutes,
  }));

  const best = data.buckets.reduce(
    (top, bucket) => (bucket.minutes > top.minutes ? bucket : top),
    { key: '', endKey: '', minutes: 0 }
  );
  const weeksLogged = data.buckets.filter((bucket) => bucket.minutes > 0).length;
  const average = data.stats.average_hours_per_week;
  const progress = Math.max(0, Math.min(100, (average / data.targetHours) * 100));

  return (
    <>
      <article className="trail-card" aria-labelledby="insights-semester-title">
        <div>
          <p className="eyebrow">Semester body of work</p>
          <h3 id="insights-semester-title">Recorded research</h3>
          <div className="trail-hero">
            <span className="trail-value">{data.stats.total_hours.toFixed(1)}h</span>
            <span className="trail-label">across {data.stats.session_count} sessions</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-label">
              <span>Average week vs {data.targetHours}h target</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <progress value={progress} max={100} aria-label={`${progress.toFixed(0)} percent of the weekly target on average`} />
          </div>
        </div>
        <div className="trail-meta">
          <div className="trail-meta-item">
            <span className="trail-meta-value">{formatSpan(data.bounds)}</span>
            <span className="trail-meta-label">Semester arc</span>
          </div>
          <div className="trail-meta-item">
            <span className="trail-meta-value">{data.stats.days_remaining} days</span>
            <span className="trail-meta-label">Remaining</span>
          </div>
        </div>
      </article>

      <article className="panel semester-total" aria-labelledby="insights-shape-title">
        <div>
          <p className="eyebrow">Weekly shape</p>
          <h3 id="insights-shape-title">Best week</h3>
          <div className="total-value">{(best.minutes / 60).toFixed(1)}<span>hours</span></div>
          {best.key !== '' && <p className="panel-note">{formatShortDate(best.key)} – {formatShortDate(best.endKey)}</p>}
        </div>
        <div className="metric-strip">
          <div className="metric-item">
            <span className="metric-value">{weeksLogged}</span>
            <span className="metric-label">Weeks with research</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{average.toFixed(1)}h</span>
            <span className="metric-label">Average per week</span>
          </div>
        </div>
      </article>

      <article className="panel chart-panel" aria-labelledby="insights-semester-chart-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Rhythm</p>
            <h3 id="insights-semester-chart-title">Hours per week</h3>
          </div>
          <span className="panel-note">{formatSpan(data.bounds)}</span>
        </div>
        <BarChart
          bars={bars}
          ariaLabel={`Hours per week, ${formatSpan(data.bounds)}`}
          markLast
        />
      </article>
    </>
  );
}
