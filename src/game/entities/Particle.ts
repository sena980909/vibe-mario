export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  dead: boolean = false;
  private hasGravity: boolean;
  private size: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number, hasGravity = false, size = 4) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.hasGravity = hasGravity;
    this.size = size;
  }

  update(dt: number): void {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    if (this.hasGravity) {
      this.vy += 600 * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const s = this.size;
    ctx.fillRect(Math.round(this.x - s / 2), Math.round(this.y - s / 2), s, s);
    ctx.globalAlpha = 1;
  }
}
