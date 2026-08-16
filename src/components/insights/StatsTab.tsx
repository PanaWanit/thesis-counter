import { useCallback, useEffect, useRef, useState } from 'react';
import type { Category, InsightsRange, Semester } from '../../types';
import { listCategories } from '../../db';
import ExportButton from '../ExportButton';
import Segmented from '../Segmented';
import { AppIcon } from '../Icons';
import AllTimePanel from './AllTimePanel';
import CategoryPanel from './CategoryPanel';
import PeriodPanel from './PeriodPanel';
import SemesterPanel from './SemesterPanel';
import { loadInsights } from './load';
import type { InsightsData } from './load';

interface Props {
  semester: Semester;
}

const RANGE_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'semester', label: 'Semester' },
  { value: 'all', label: 'All time' },
];

const RANGES: InsightsRange[] = ['week', 'month', 'semester', 'all'];

const CATEGORY_CAPTION: Record<InsightsRange, string> = {
  week: 'This week',
  month: 'This month',
  semester: 'This semester',
  all: 'All semesters',
};

function isRange(value: string): value is InsightsRange {
  return (RANGES as string[]).includes(value);
}

function LoadingGrid() {
  return (
    <div className="insights-grid">
      <div className="panel loading-stack"><div className="skeleton" style={{ minHeight: 220 }} /></div>
      <div className="panel loading-stack"><div className="skeleton" style={{ minHeight: 220 }} /></div>
      <div className="panel chart-panel loading-stack"><div className="skeleton" style={{ minHeight: 150 }} /></div>
    </div>
  );
}

export default function StatsTab({ semester }: Props) {
  const [range, setRange] = useState<InsightsRange>('week');
  // Results are cached per range so flipping back to an already-loaded range is
  // instant. The cache lives for one mount and one semester.
  const [cache, setCache] = useState<Partial<Record<InsightsRange, InsightsData>>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestRef = useRef(0);

  useEffect(() => {
    setCache({});
  }, [semester.id]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((loadError) => console.error('Failed to load categories:', loadError));
  }, []);

  const load = useCallback(
    async (target: InsightsRange) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setLoading(true);
      setError('');
      try {
        const data = await loadInsights(semester, target);
        // A slower earlier request must not overwrite a newer range's result.
        if (requestRef.current !== requestId) return;
        setCache((previous) => ({ ...previous, [target]: data }));
      } catch (loadError) {
        console.error('Failed to load insights:', loadError);
        if (requestRef.current !== requestId) return;
        setError('Could not calculate research insights.');
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    },
    [semester]
  );

  useEffect(() => {
    if (cache[range]) {
      setLoading(false);
      setError('');
      return;
    }
    void load(range);
  }, [cache, range, load]);

  const data = cache[range];

  const retry = () => {
    void load(range);
  };

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

      <div className="insights-toolbar">
        <Segmented
          options={RANGE_OPTIONS}
          value={range}
          onChange={(next) => {
            if (isRange(next)) setRange(next);
          }}
          label="Insights time range"
        />
      </div>

      {error && !data ? (
        <div className="empty-state">
          <span className="empty-icon"><AppIcon name="insights" size={27} /></span>
          <h2>Insights unavailable</h2>
          <p>{error}</p>
          <button className="button button-accent" type="button" onClick={retry}>Retry</button>
        </div>
      ) : !data ? (
        <LoadingGrid />
      ) : (
        <div className="insights-grid" aria-busy={loading}>
          {(data.range === 'week' || data.range === 'month') && <PeriodPanel data={data} />}
          {data.range === 'semester' && <SemesterPanel data={data} />}
          {data.range === 'all' && <AllTimePanel data={data} currentSemesterId={semester.id} />}
          <CategoryPanel breakdown={data.breakdown} caption={CATEGORY_CAPTION[range]} />
        </div>
      )}
    </section>
  );
}
