export class GameOverScreen {
  draw(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    score: number,
    highScore: number,
    victory: boolean
  ): void {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;
    const cy = canvasH / 2;

    if (victory) {
      // Victory
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', cx, cy - 80);

      // Draw stars
      for (let i = 0; i < 5; i++) {
        this.drawStar(ctx, cx - 80 + i * 40, cy - 30, 12, '#ffd700');
      }
    } else {
      // Game Over
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 56px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME', cx, cy - 80);
      ctx.fillText('OVER', cx, cy - 20);
    }

    // Scores
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, cx, cy + 50);

    ctx.fillStyle = '#ffdd00';
    ctx.fillText(`Best: ${highScore}`, cx, cy + 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(victory ? 'Press SPACE to return to menu' : 'Press SPACE to restart', cx, cy + 120);
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
