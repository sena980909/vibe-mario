import { useState, useEffect, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { GameCanvas } from './components/GameCanvas';
import './App.css';

type AppState = 'menu' | 'loading' | 'playing';

function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [loadProgress, setLoadProgress] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    // Load high score from localStorage
    try {
      const raw = localStorage.getItem('marioSave');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.highScore) setHighScore(data.highScore);
      }
    } catch {
      // ignore
    }

    // Add keydown listener for Enter to start from menu
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter') && appState === 'menu') {
        handleStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleStart = useCallback(async () => {
    setAppState('loading');
    setLoadProgress(0);

    // Simulate brief loading (assets are all programmatic)
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise<void>(res => setTimeout(res, 80));
      setLoadProgress(i / steps);
    }

    setAppState('playing');
  }, []);

  return (
    <div className="game-container">
      {appState === 'menu' && (
        <MainMenu onStart={handleStart} highScore={highScore} />
      )}
      {appState === 'loading' && (
        <LoadingScreen progress={loadProgress} />
      )}
      {appState === 'playing' && (
        <GameCanvas />
      )}
    </div>
  );
}

export default App;
