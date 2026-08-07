import type { Semester, Category } from '../types';
import { listSessions } from '../db';
import { buildCsv } from '../lib/csv';

interface Props {
  semester: Semester;
  categories: Category[];
}

export default function ExportButton({ semester, categories }: Props) {
  const handleExport = async () => {
    const sessions = await listSessions(semester.id);
    const headers = ['date', 'start_time', 'end_time', 'duration_hours', 'category', 'note', 'manual'];
    const rows = sessions.map((s) => {
      const started = new Date(s.started_at);
      const ended = new Date(s.ended_at);
      return [
        started.toISOString().split('T')[0],
        started.toLocaleTimeString(),
        ended.toLocaleTimeString(),
        (s.duration_minutes / 60).toFixed(2),
        categories.find((c) => c.id === s.category_id)?.name ?? '',
        s.note,
        s.manual ? 'yes' : 'no',
      ];
    });
    const csv = buildCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${semester.name.replace(/\s+/g, '_')}_sessions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>Export CSV</button>;
}
