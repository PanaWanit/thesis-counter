import { useState } from 'react';
import type { Semester } from './types';
import Sidebar from './components/Sidebar';

function App() {
  const [selected, setSelected] = useState<Semester | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar selected={selected} onSelect={setSelected} />
      <main style={{ flex: 1, padding: 16 }}>
        {selected ? <h1>{selected.name}</h1> : <p>Select or create a semester.</p>}
      </main>
    </div>
  );
}

export default App;
