import { useEffect, useState } from 'react';
import type { Category } from '../types';
import { listCategories, createCategory, deleteCategory } from '../db';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const refresh = async () => setCategories(await listCategories());

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory(name, color);
    setName('');
    await refresh();
  };

  return (
    <div>
      <h3>Categories</h3>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            <span style={{ color: c.color }}>●</span> {c.name}
            <button onClick={() => deleteCategory(c.id).then(refresh)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
