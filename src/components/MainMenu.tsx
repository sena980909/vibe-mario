import React, { useEffect, useRef } from 'react';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const animate = (t: number) => {
      timeRef.current = t / 1000;
      drawMenu(ctx, canvas.width, canvas.height, timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  function drawMenu(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    // Sky background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#5c94fc');
    grad.addColorStop(1, '#9ec0ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, h - 60, w, 10);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, h - 50, w, 50);

    // Clouds
    drawCloud(ctx, 60 + Math.sin(t * 0.2) * 5, 80);
    drawCloud(ctx, 300 + Math.sin(t * 0.15 + 1) * 5, 50);
    drawCloud(ctx, 550 + Math.sin(t * 0.18 + 2) * 5, 70);

    // Animated Mario
    const mX = 80 + Math.sin(t) * 10;
    const mY = h - 50 - 64;
    drawMario(ctx, mX, mY, Math.sin(t * 3) > 0);

    // Blocks
    const blockColors = ['#f0a000', '#cc0000', '#f0a000', '#cc0000'];
    for (let i = 0; i < 4; i++) {
      const bx = w / 2 - 64 + i * 32;
      const by = h - 120 - Math.abs(Math.sin(t * 2 + i * 0.5)) * 8;
      ctx.fillStyle = blockColors[i];
      ctx.fillRect(bx, by, 28, 28);
      ctx.fillStyle = i % 2 === 0 ? '#c87000' : '#aa0000';
      ctx.fillRect(bx, by, 28, 3);
      ctx.fillRect(bx, by + 25, 28, 3);
      ctx.fillRect(bx, by, 3, 28);
      ctx.fillRect(bx + 25, by, 3, 28);
      if (i % 2 === 0) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', bx + 14, by + 20);
      }
    }

    // Title
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;

    // Red title letters
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cc0000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeText('SUPER MARIO', w / 2, 130);
    ctx.fillText('SUPER MARIO', w / 2, 130);

    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 3;
    ctx.strokeText('BROS', w / 2, 190);
    ctx.fillText('BROS', w / 2, 190);

    ctx.restore();

    // High score
    if (highScore > 0) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST: ${highScore}`, w / 2, 230);
    }

    // Blinking press start
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ENTER OR CLICK TO START', w / 2, h - 90);
    }

    // Controls hint
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px monospace';
    ctx.fillText('Arrow Keys / WASD: Move  |  Space / W: Jump  |  Z / X: Fire  |  ESC: Pause', w / 2, h - 16);
  }

  function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 28, 0, Math.PI * 2);
    ctx.arc(x + 55, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 20, y, 95, 20);
  }

  function drawMario(ctx: CanvasRenderingContext2D, x: number, y: number, legUp: boolean) {
    // Hat
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(x + 4, y, 24, 10);
    ctx.fillRect(x, y + 6, 32, 6);
    // Face
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x + 4, y + 12, 24, 14);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 20, y + 14, 4, 5);
    // Mustache
    ctx.fillStyle = '#4a2400';
    ctx.fillRect(x + 6, y + 20, 20, 4);
    // Body
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(x + 6, y + 26, 20, 8);
    // Overalls
    ctx.fillStyle = '#0000cc';
    ctx.fillRect(x + 2, y + 30, 28, 16);
    // Shoes
    ctx.fillStyle = '#4a2400';
    if (legUp) {
      ctx.fillRect(x + 4, y + 44, 12, 6);
      ctx.fillRect(x + 18, y + 40, 12, 6);
    } else {
      ctx.fillRect(x + 4, y + 40, 12, 6);
      ctx.fillRect(x + 18, y + 44, 12, 6);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') onStart();
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer', outline: 'none' }}
      onClick={onStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        width={800}
        height={480}
      />
    </div>
  );
};
