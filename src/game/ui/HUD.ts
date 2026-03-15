export interface HUDData {
  score: number;
  highScore: number;
  coins: number;
  lives: number;
  timer: number;
  stage: number;
  powerLevel: number;
  canvasWidth: number;
  starsCollected?: number;
  totalStars?: number;
}

export class HUD {
  draw(ctx: CanvasRenderingContext2D, data: HUDData): void {
    const { score, coins, lives, timer, stage, canvasWidth, starsCollected = 0, totalStars = 3 } = data;

    // Background bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvasWidth, 36);

    ctx.font = 'bold 14px monospace';
    ctx.textBaseline = 'middle';

    // MARIO / Score (left)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('MARIO', 12, 12);
    ctx.fillStyle = '#ffdd00';
    ctx.fillText(score.toString().padStart(6, '0'), 12, 26);

    // Coins (center-left)
    const coinX = canvasWidth / 5;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(coinX, 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0a000';
    ctx.beginPath();
    ctx.arc(coinX, 18, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`x${coins.toString().padStart(2, '0')}`, coinX + 12, 18);

    // Stars display
    const starX = canvasWidth / 5 + 80;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`★ ${starsCollected}/${totalStars}`, starX, 18);

    // WORLD (center)
    const worldX = canvasWidth / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD', worldX, 12);
    ctx.fillStyle = '#ffdd00';
    ctx.fillText(`1-${stage}`, worldX, 26);

    // TIME (right)
    const timeX = canvasWidth - 100;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('TIME', timeX, 12);
    ctx.fillStyle = timer < 60 ? '#ff4444' : '#ffdd00';
    ctx.fillText(timer.toString().padStart(3, ' '), timeX, 26);

    // Lives (far right)
    const livesX = canvasWidth - 20;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`♥ x${lives}`, livesX, 18);
  }
}
