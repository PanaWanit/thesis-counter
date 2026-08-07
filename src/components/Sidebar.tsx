import { useEffect, useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { listSemesters, createSemester, deleteSemester } from '../db';
import SemesterForm from './SemesterForm';

interface Props {
  selected: Semester | null;
  onSelect: (s: Semester) => void;
}

export default function Sidebar({ selected, onSelect }: Props) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    const data = await listSemesters();
    setSemesters(data);
    if (data.length > 0 && !selected) {
      onSelect(data[0]);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async (input: SemesterInput) => {
    await createSemester(input);
    setShowForm(false);
    await refresh();
  };

  const handleDelete = async (id: number) => {
    await deleteSemester(id);
    await refresh();
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
