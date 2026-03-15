import { Level } from '../world/Level';
import { eventBus } from '../engine/EventBus';

export class Coin {
  x: number;
  y: number;
  width: number = 16;
  height: number = 16;
  collected: boolean = false;
  private animTimer: number = 0;
  private popping: boolean = false;
  private popVy: number = 0;
  private popTimer: number = 0;
  private bobOffset: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  startPop(): void {
    this.popping = true;
    this.popVy = -300;
    this.popTimer = 1.0;
  }

  update(dt: number): void {
    this.animTimer += dt;

    if (this.popping) {
      this.popTimer -= dt;
      this.popVy += 600 * dt;
      this.y += this.popVy * dt;
      if (this.popTimer <= 0) {
        eventBus.emit('collectCoin');
        this.collected = true;
      }
      return;
    }

    // Bob up and down
    this.y = this.y; // position is static; bobbing is visual only
  }

  collect(level: Level): void {
    if (this.collected) return;
    this.collected = true;
    eventBus.emit('collectCoin');
    level.spawnCoinParticles(this.x + this.width / 2, this.y + this.height / 2);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const bobs = Math.sin(this.animTimer * 4 + this.bobOffset) * 3;
    const cx = Math.round(this.x + this.width / 2);
    const cy = Math.round(this.y + this.height / 2 + bobs);
    const r = 8;

    // Coin outer
    ctx.fillStyle = '#f0a000';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Coin inner
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
