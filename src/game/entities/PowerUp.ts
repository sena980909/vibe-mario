import { TileMap, TILE_SIZE, isSolid } from '../world/TileMap';
import { Player } from './Player';
import { Level } from '../world/Level';
import { eventBus } from '../engine/EventBus';

export type PowerUpType = 'mushroom' | 'fireFlower';

export class PowerUp {
  x: number;
  y: number;
  width: number = 24;
  height: number = 24;
  type: PowerUpType;
  collected: boolean = false;
  private vx: number = 60;
  private vy: number = 0;
  private animTimer: number = 0;
  private emerging: boolean = false;
  private emergeTimer: number = 0;

  constructor(type: PowerUpType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.emerging = true;
    this.emergeTimer = 0.5;
  }

  update(dt: number, tileMap: TileMap): void {
    if (this.collected) return;
    this.animTimer += dt;

    if (this.emerging) {
      this.emergeTimer -= dt;
      this.y -= 40 * dt;
      if (this.emergeTimer <= 0) {
        this.emerging = false;
      }
      return;
    }

    if (this.type === 'fireFlower') {
      // Fire flower just bobs in place
      return;
    }

    // Mushroom moves and falls
    this.vy += 600 * dt;
    if (this.vy > 400) this.vy = 400;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Horizontal collision
    const checkH = (cx: number, cy: number) => {
      const col = tileMap.worldToTileCol(cx);
      const row = tileMap.worldToTileRow(cy);
      return isSolid(tileMap.getTile(row, col));
    };

    if (this.vx > 0 && checkH(this.x + this.width, this.y + this.height / 2)) {
      const col = tileMap.worldToTileCol(this.x + this.width);
      this.x = col * TILE_SIZE - this.width;
      this.vx = -this.vx;
    } else if (this.vx < 0 && checkH(this.x - 1, this.y + this.height / 2)) {
      const col = tileMap.worldToTileCol(this.x - 1);
      this.x = (col + 1) * TILE_SIZE;
      this.vx = -this.vx;
    }

    // Vertical collision (ground)
    if (this.vy >= 0) {
      const botRow = tileMap.worldToTileRow(this.y + this.height);
      const colL = tileMap.worldToTileCol(this.x + 2);
      const colR = tileMap.worldToTileCol(this.x + this.width - 3);
      if (isSolid(tileMap.getTile(botRow, colL)) || isSolid(tileMap.getTile(botRow, colR))) {
        this.y = botRow * TILE_SIZE - this.height;
        this.vy = 0;
      }
    }
  }

  collect(player: Player, level: Level): void {
    if (this.collected) return;
    this.collected = true;
    player.powerUp(this.type);
    eventBus.emit('addScore', 1000);
    level.spawnCoinParticles(this.x + this.width / 2, this.y + this.height / 2);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (this.type === 'mushroom') {
      this.drawMushroom(ctx, x, y);
    } else {
      this.drawFireFlower(ctx, x, y);
    }
  }

  private drawMushroom(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const h = this.height;

    // Stem
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x + 4, y + h / 2, w - 8, h / 2);

    // Cap
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 2, w / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x, y + h / 2, w, 4);

    // White spots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 7, y + h / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 7, y + h / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 6, y + h / 2 + 2, 3, 3);
    ctx.fillRect(x + w - 9, y + h / 2 + 2, 3, 3);
  }

  private drawFireFlower(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const h = this.height;
    const bob = Math.sin(this.animTimer * 5) * 2;

    // Stem
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(x + w / 2 - 2, y + h / 2 + bob, 4, h / 2);

    // Petals
    const petalColors = ['#ff4400', '#ffaa00', '#ff0000', '#ff6600'];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.animTimer;
      const px = x + w / 2 + Math.cos(angle) * 7;
      const py = y + h / 3 + Math.sin(angle) * 7 + bob;
      ctx.fillStyle = petalColors[i];
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 3 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
