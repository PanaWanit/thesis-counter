import { useState } from 'react';
import type { Semester } from './types';
import Sidebar from './components/Sidebar';
import CategoryManager from './components/CategoryManager';

function App() {
  const [selected, setSelected] = useState<Semester | null>(null);
  const [tab, setTab] = useState<'sessions' | 'categories'>('sessions');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar selected={selected} onSelect={setSelected} />
      <main style={{ flex: 1, padding: 16 }}>
        {selected ? (
          <>
            <h1>{selected.name}</h1>
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setTab('sessions')}>Sessions</button>
              <button onClick={() => setTab('categories')}>Categories</button>
            </div>
            {tab === 'categories' ? <CategoryManager /> : <p>Sessions placeholder</p>}
          </>
        ) : (
          <p>Select or create a semester.</p>
        )}
      </main>
    </div>
  );
}

export default App;
