import { useEffect, useState } from 'react';
import type { Category, Session, Semester, SessionInput } from '../types';
import { listSessions, createSession, deleteSession, listCategories } from '../db';
import { formatDateInput } from '../lib/date';

interface Props {
  semester: Semester;
}

export default function SessionsTab({ semester }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [note, setNote] = useState('');

  const refresh = async () => {
    setSessions(await listSessions(semester.id));
  };

  useEffect(() => { refresh(); listCategories().then(setCategories); }, [semester.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const started = new Date(`${date}T${start}:00`).toISOString();
    const ended = new Date(`${date}T${end}:00`).toISOString();
    const input: SessionInput = {
      semester_id: semester.id,
      category_id: Number(categoryId),
      started_at: started,
      ended_at: ended,
      note,
      manual: 1,
    };
    await createSession(input);
    setNote('');
    await refresh();
  };

  const fmt = (d: string) => new Date(d).toLocaleString();

  return (
    <div>
      <h2>Sessions</h2>
      <form onSubmit={handleAdd}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
          <option value="">Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
        <button type="submit">Add Manual</button>
      </form>
      <table>
        <thead>
          <tr><th>Date</th><th>Duration</th><th>Category</th><th>Note</th><th></th></tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{fmt(s.started_at)}</td>
              <td>{(s.duration_minutes / 60).toFixed(2)}h</td>
              <td>{categories.find((c) => c.id === s.category_id)?.name ?? s.category_id}</td>
              <td>{s.note}</td>
              <td><button onClick={() => deleteSession(s.id).then(refresh)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
