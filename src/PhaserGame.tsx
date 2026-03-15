import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { PreloadScene } from './phaser/engine/PreloadScene';
import { MenuScene } from './phaser/engine/MenuScene';
import { MarioScene } from './phaser/engine/MarioScene';
import { UIScene } from './phaser/engine/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#5c94fc',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [PreloadScene, MenuScene, MarioScene, UIScene],
  pixelArt: true,
  roundPixels: true,
};

export const PhaserGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current && containerRef.current) {
      gameRef.current = new Phaser.Game({
        ...config,
        parent: containerRef.current,
      });
    }
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      style={{ width: '800px', height: '480px', margin: '0 auto' }}
    />
  );
};
