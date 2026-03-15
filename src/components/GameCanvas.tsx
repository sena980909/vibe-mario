import React, { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/engine/GameEngine';

interface GameCanvasProps {
  onGameOver?: () => void;
  onVictory?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onVictory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const checkIntervalRef = useRef<number>(0);

  const initEngine = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy existing engine
    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    await engine.init();
    engine.start();

    // Poll for game over / victory
    checkIntervalRef.current = window.setInterval(() => {
      const state = engine.getState();
      if (state === 'gameover' && onGameOver) {
        // Don't trigger callback here - let the engine render the game over screen
      } else if (state === 'victory' && onVictory) {
        // Same
      }
    }, 500);
  }, [onGameOver, onVictory]);

  useEffect(() => {
    initEngine();
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [initEngine]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={480}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        cursor: 'none',
      }}
    />
  );
};
