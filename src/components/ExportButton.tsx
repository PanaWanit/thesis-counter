import { useState } from 'react';
import type { Semester, Category } from '../types';
import { listSessions } from '../db';
import { buildCsv } from '../lib/csv';
import { AppIcon } from './Icons';

interface Props {
  semester: Semester;
  categories: Category[];
}

export default function ExportButton({ semester, categories }: Props) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const sessions = await listSessions(semester.id);
      const headers = ['date', 'start_time', 'end_time', 'duration_hours', 'category', 'note', 'manual'];
      const rows = sessions.map((session) => {
        const started = new Date(session.started_at);
        const ended = new Date(session.ended_at);
        return [
          started.toISOString().split('T')[0],
          started.toLocaleTimeString(),
          ended.toLocaleTimeString(),
          (session.duration_minutes / 60).toFixed(2),
          categories.find((category) => category.id === session.category_id)?.name ?? '',
          session.note,
          session.manual ? 'yes' : 'no',
        ];
      });
      const csv = buildCsv(headers, rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${semester.name.replace(/\s+/g, '_')}_sessions.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error('Failed to export CSV:', exportError);
      setError('CSV export failed. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-control">
      <button className="button button-secondary" type="button" disabled={exporting} onClick={handleExport}>
        <AppIcon name="download" size={18} />
        {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
      {error && <span className="export-error" role="alert">{error}</span>}
    </div>
  );
}
