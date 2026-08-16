import type { CSSProperties } from 'react';
import type { CategoryBreakdown } from '../../types';
import { AppIcon } from '../Icons';

interface Props {
  breakdown: CategoryBreakdown[];
  caption: string; // which span the mix covers, e.g. "This week"
}

export default function CategoryPanel({ breakdown, caption }: Props) {
  const active = breakdown.filter((item) => item.total_minutes > 0);

  return (
    <article className="panel breakdown-panel" aria-labelledby="category-breakdown-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{caption}</p>
          <h3 id="category-breakdown-title">Time by category</h3>
        </div>
        <AppIcon name="categories" size={21} />
      </div>

      {active.length === 0 ? (
        <div className="empty-state compact">
          <span className="empty-icon"><AppIcon name="clock" size={25} /></span>
          <h3>No research time yet</h3>
          <p>Start a focus session or add a manual entry to reveal your category mix.</p>
        </div>
      ) : (
        <div className="breakdown-list">
          {active.map((item) => {
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
  );
}
