import type { CSSProperties } from 'react';
import type { PeriodData } from './load';
import type { Bar } from './BarChart';
import BarChart from './BarChart';
import {
  formatHours,
  formatMonth,
  formatShortDate,
  formatSignedHours,
  formatSignedPercent,
  formatSpan,
  formatWeekday,
  formatWeekdayInitial,
} from './format';

interface Props {
  data: PeriodData;
}

const COPY = {
  week: { current: 'This week', previous: 'Last week', chart: 'Hours per day' },
  month: { current: 'This month', previous: 'Last month', chart: 'Hours per day' },
} as const;

// Month charts have up to 31 columns, so only every fifth day and the last day
// get a tick label. Week charts label every day.
function buildBars(data: PeriodData): Bar[] {
  return data.buckets.map((bucket, index) => {
    const isLast = index === data.buckets.length - 1;
    const label =
      data.range === 'week'
        ? formatWeekdayInitial(bucket.key)
        : index % 5 === 0 || isLast
          ? String(Number(bucket.key.slice(8, 10)))
          : '';
    const title =
      data.range === 'week'
        ? `${formatWeekday(bucket.key)} ${formatShortDate(bucket.key)}: ${formatHours(bucket.minutes)}`
        : `${formatShortDate(bucket.key)}: ${formatHours(bucket.minutes)}`;
    return { key: bucket.key, label, title, minutes: bucket.minutes };
  });
}

export default function PeriodPanel({ data }: Props) {
  const copy = COPY[data.range];
  const bars = buildBars(data);
  const target = data.targetHours;
  const progress = target && target > 0
    ? Math.max(0, Math.min(100, (data.current.total_hours / target) * 100))
    : null;
  const peak = Math.max(data.current.total_minutes, data.previous.total_minutes);
  const compareRow = (minutes: number) =>
    ({ '--bar-size': `${peak > 0 ? (minutes / peak) * 100 : 0}%` }) as CSSProperties;
  const trend = data.delta.diff_minutes > 0 ? 'up' : data.delta.diff_minutes < 0 ? 'down' : 'flat';

  return (
    <>
      <article className="trail-card" aria-labelledby="insights-period-title">
        <div>
          <p className="eyebrow">{data.range === 'week' ? 'Research trail' : formatMonth(data.bounds.startDay)}</p>
          <h3 id="insights-period-title">{copy.current}</h3>
          <div className="trail-hero">
            <span className="trail-value">{data.current.total_hours.toFixed(1)}h</span>
            <span className="trail-label">
              {target !== null ? `of ${target} required hours` : `across ${data.current.active_days} active days`}
            </span>
          </div>
          {progress !== null && (
            <div className="progress-wrap">
              <div className="progress-label">
                <span>Week progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <progress value={progress} max={100} aria-label={`${progress.toFixed(0)} percent of weekly target`} />
            </div>
          )}
        </div>
        <div className="trail-meta">
          <div className="trail-meta-item">
            <span className="trail-meta-value">{formatSpan(data.bounds)}</span>
            <span className="trail-meta-label">Span</span>
          </div>
          <div className="trail-meta-item">
            <span className="trail-meta-value">{data.current.session_count}</span>
            <span className="trail-meta-label">Sessions</span>
          </div>
        </div>
      </article>

      <article className="panel compare-panel" aria-labelledby="insights-compare-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Momentum</p>
            <h3 id="insights-compare-title">vs {copy.previous.toLowerCase()}</h3>
          </div>
        </div>
        <div className="delta-hero" data-trend={trend}>
          <span className="delta-value">{formatSignedHours(data.delta.diff_minutes)}</span>
          <span className="delta-percent">{formatSignedPercent(data.delta.percent)}</span>
        </div>
        <div className="compare-list">
          <div className="compare-row">
            <span className="compare-label">{copy.current}</span>
            <div className="breakdown-track" aria-hidden="true">
              <div className="breakdown-bar" style={compareRow(data.current.total_minutes)} />
            </div>
            <span className="breakdown-value">{formatHours(data.current.total_minutes)}</span>
          </div>
          <div className="compare-row" data-muted="true">
            <span className="compare-label">{copy.previous}</span>
            <div className="breakdown-track" aria-hidden="true">
              <div className="breakdown-bar" style={compareRow(data.previous.total_minutes)} />
            </div>
            <span className="breakdown-value">{formatHours(data.previous.total_minutes)}</span>
          </div>
        </div>
        <p className="compare-caption">{formatSpan(data.previousBounds)}</p>
      </article>

      <article className="panel chart-panel" aria-labelledby="insights-chart-title">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Rhythm</p>
            <h3 id="insights-chart-title">{copy.chart}</h3>
          </div>
          <span className="panel-note">{formatSpan(data.bounds)}</span>
        </div>
        <BarChart bars={bars} ariaLabel={`${copy.chart}, ${formatSpan(data.bounds)}`} />
      </article>
    </>
  );
}
