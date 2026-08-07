import { useEffect, useState } from 'react';
import type { Category, Semester } from '../types';
import { listCategories, createSession } from '../db';

interface Props {
  semester: Semester;
}

export default function TimerTab({ semester }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => { listCategories().then(setCategories); }, []);

  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const start = () => {
    if (categoryId === null) return;
    setStartTime(new Date());
    setElapsed(0);
  };

  const stop = async () => {
    if (!startTime || categoryId === null) return;
    const endedAt = new Date();
    try {
      await createSession({
        semester_id: semester.id,
        category_id: categoryId,
        started_at: startTime.toISOString(),
        ended_at: endedAt.toISOString(),
        note,
        manual: 0,
      });
    } catch (err) {
      console.error(err);
      window.alert('Failed to save session.');
      return;
    }
    setStartTime(null);
    setElapsed(0);
    setNote('');
  };

  return (
    <div>
      <h2>Timer</h2>
      <select
        value={categoryId ?? ''}
        onChange={(e) => setCategoryId(e.target.value === '' ? null : Number(e.target.value))}
        disabled={startTime !== null}
      >
        <option value="">Select category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ fontSize: 48, fontFamily: 'monospace' }}>
        {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
        {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
        {(elapsed % 60).toString().padStart(2, '0')}
      </div>
      {startTime ? (
        <button onClick={stop}>Stop</button>
      ) : (
        <button onClick={start} disabled={categoryId === null}>Start</button>
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" />
    </div>
  );
}
