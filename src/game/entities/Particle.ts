export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  dead: boolean = false;
  active: boolean = true;
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

  reset(...args: unknown[]): void {
    const [x, y, vx, vy, color, life, hasGravity, size] = args as [
      number, number, number, number, string, number, boolean?, number?
    ];
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
    this.active = true;
    this.hasGravity = hasGravity ?? false;
    this.size = size ?? 4;
  }

  update(dt: number): void {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      this.active = false;
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
