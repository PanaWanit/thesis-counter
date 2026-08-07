import { useCallback, useEffect, useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { listSemesters, createSemester, deleteSemester } from '../db';
import SemesterForm from './SemesterForm';

interface Props {
  selected: Semester | null;
  onSelect: (s: Semester | null) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listSemesters();
      setSemesters(data);
      if (data.length > 0 && !selected) {
        onSelect(data[0]);
      }
    } catch (err) {
      console.error('Failed to refresh semesters:', err);
    }
  }, [selected, onSelect]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async (input: SemesterInput) => {
    try {
      await createSemester(input);
      setShowForm(false);
      await refresh();
    } catch (err) {
      console.error('Failed to create semester:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSemester(id);
      if (selected?.id === id) {
        const remaining = semesters.filter((s) => s.id !== id);
        onSelect(remaining.length > 0 ? remaining[0] : null);
      }
      await refresh();
    } catch (err) {
      console.error('Failed to delete semester:', err);
    }
  };

  return (
    <aside style={{ width: 220, borderRight: '1px solid #ccc', padding: 12 }}>
      <h2>Semesters</h2>
      <button onClick={() => setShowForm(true)}>+ Add</button>
      {showForm && <SemesterForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {semesters.map((s) => (
          <li key={s.id} style={{ background: selected?.id === s.id ? '#eee' : 'transparent' }}>
            <button onClick={() => onSelect(s)} style={{ textAlign: 'left' }}>
              {s.name} ({s.credits} cr)
            </button>
            <button onClick={() => handleDelete(s.id)}>×</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
