import { PhaserGame } from './PhaserGame';
import './App.css';

function App() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
      }}
    >
      <PhaserGame />
    </div>
  );
}

export default App;
