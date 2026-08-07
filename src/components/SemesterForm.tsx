import { useState } from 'react';
import type { Semester, SemesterInput } from '../types';
import { formatDateInput } from '../lib/date';

interface Props {
  semester?: Semester | null;
  onSave: (input: SemesterInput) => void;
  onCancel: () => void;
}

export default function SemesterForm({ semester, onSave, onCancel }: Props) {
  const [name, setName] = useState(semester?.name ?? '');
  const [startDate, setStartDate] = useState(semester?.start_date ?? formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(semester?.end_date ?? formatDateInput(new Date()));
  const [credits, setCredits] = useState(semester?.credits ?? 6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, start_date: startDate, end_date: endDate, credits: Number(credits) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      <input type="number" min={1} value={credits} onChange={(e) => setCredits(Number(e.target.value))} required />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
