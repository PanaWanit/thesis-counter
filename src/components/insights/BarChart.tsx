import type { CSSProperties } from 'react';

export interface Bar {
  key: string;
  label: string; // axis label; empty string leaves the tick blank
  title: string; // full description, used for the tooltip and screen readers
  minutes: number;
}

interface Props {
  bars: Bar[];
  ariaLabel: string;
  /** Highlight the last bar, which is the in-progress day or week. */
  markLast?: boolean;
}

export default function BarChart({ bars, ariaLabel, markLast = false }: Props) {
  const peak = bars.reduce((max, bar) => Math.max(max, bar.minutes), 0);

  return (
    <div className="bar-chart">
      <div className="bar-chart-plot" role="img" aria-label={ariaLabel}>
        {bars.map((bar, index) => {
          const size = peak > 0 ? (bar.minutes / peak) * 100 : 0;
          const style = { '--bar-size': `${size}%` } as CSSProperties;
          return (
            <div className="bar-column" key={bar.key} title={bar.title}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={style}
                  data-empty={bar.minutes === 0}
                  data-current={markLast && index === bars.length - 1}
                />
              </div>
              <span className="bar-label">{bar.label}</span>
            </div>
          );
        })}
      </div>
      <ul className="sr-only">
        {bars.map((bar) => (
          <li key={bar.key}>{bar.title}</li>
        ))}
      </ul>
    </div>
  );
}
