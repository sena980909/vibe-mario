import { TileMap, TILE_SIZE, isSolid } from '../world/TileMap';

export class Fireball {
  x: number;
  y: number;
  width: number = 8;
  height: number = 8;
  vx: number;
  vy: number = -100;
  dead: boolean = false;
  active: boolean = true;
  private animTimer: number = 0;

  constructor(x: number, y: number, vx: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
  }

  reset(...args: unknown[]): void {
    const [x, y, vx] = args as [number, number, number];
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = -100;
    this.dead = false;
    this.active = true;
    this.animTimer = 0;
  }

  update(dt: number, tileMap: TileMap): void {
    if (this.dead) return;

    this.animTimer += dt;
    this.vy += 800 * dt;
    if (this.vy > 400) this.vy = 400;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const col = tileMap.worldToTileCol(this.x + this.width / 2);
    const rowBot = tileMap.worldToTileRow(this.y + this.height);
    const rowTop = tileMap.worldToTileRow(this.y);
    const colL = tileMap.worldToTileCol(this.x);
    const colR = tileMap.worldToTileCol(this.x + this.width);
    const rowMid = tileMap.worldToTileRow(this.y + this.height / 2);

    // Bounce off floor
    if (this.vy > 0 && isSolid(tileMap.getTile(rowBot, col))) {
      this.y = rowBot * TILE_SIZE - this.height;
      this.vy = -200;
    }

    // Kill if hits wall
    if (isSolid(tileMap.getTile(rowMid, colL)) || isSolid(tileMap.getTile(rowMid, colR))) {
      this.dead = true;
      this.active = false;
    }

    // Kill if hits ceiling
    if (isSolid(tileMap.getTile(rowTop, col))) {
      this.dead = true;
      this.active = false;
    }

    // Off screen bounds
    if (this.x < -100 || this.x > tileMap.getWidthPx() + 100) {
      this.dead = true;
      this.active = false;
    }
    if (this.y > tileMap.getHeightPx() + 50) {
      this.dead = true;
      this.active = false;
    }
    void this.animTimer;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return;

    const cx = Math.round(this.x + this.width / 2);
    const cy = Math.round(this.y + this.height / 2);
    const r = 5;

    // Outer glow
    ctx.fillStyle = 'rgba(255,200,0,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer flame
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner flame
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
