export class Star {
  x: number;
  y: number;
  width = 20;
  height = 20;
  collected = false;
  private bobTimer = 0;
  private bobOffset = 0;
  private glowTimer = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    if (this.collected) return;
    this.bobTimer += dt;
    this.bobOffset = Math.sin(this.bobTimer * 3) * 4;
    this.glowTimer += dt * 2;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const cx = Math.round(this.x + this.width / 2);
    const cy = Math.round(this.y + this.height / 2 + this.bobOffset);
    const r = 10;

    ctx.save();

    // Outer glow pulse
    const glowAlpha = 0.3 + 0.2 * Math.sin(this.glowTimer);
    ctx.shadowColor = '#ffe060';
    ctx.shadowBlur = 12;

    // Draw glow circle
    const glowR = r + 4 + 2 * Math.sin(this.glowTimer);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grad.addColorStop(0, `rgba(255, 255, 100, ${glowAlpha + 0.2})`);
    grad.addColorStop(1, 'rgba(255, 220, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Draw 5-pointed star polygon
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const points = 5;
    const outerR = r;
    const innerR = r * 0.42;
    const rotation = -Math.PI / 2; // Point up

    for (let i = 0; i < points * 2; i++) {
      const angle = rotation + (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = rotation + (i * Math.PI) / points;
      const radius = (i % 2 === 0 ? outerR : innerR) * 0.55;
      const px = cx - 1 + Math.cos(angle) * radius;
      const py = cy - 1 + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y + this.bobOffset,
      width: this.width,
      height: this.height,
    };
  }
}
