import { TileMap, TILE_SIZE, isSolid } from '../world/TileMap';
import { Platform } from './Platform';
import { Level } from '../world/Level';

export type EnemyType = 'goomba' | 'koopa' | 'flyingKoopa';

export class Enemy {
  x: number;
  y: number;
  width: number = 28;
  height: number = 28;
  vx: number;
  vy: number = 0;
  type: EnemyType;
  dead: boolean = false;
  deathTimer: number = 0;
  isShell: boolean = false;
  private shellTimer: number = 0;
  private walkFrame: number = 0;
  private walkFrameTimer: number = 0;
  private onGround: boolean = false;
  private startX: number;
  private flyY: number;

  constructor(type: EnemyType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.flyY = y;
    this.vx = type === 'flyingKoopa' ? 60 : -60;
    if (type === 'koopa') {
      this.height = 32;
    }
    if (type === 'flyingKoopa') {
      this.width = 28;
      this.height = 32;
    }
  }

  stomp(level: Level): void {
    if (this.type === 'koopa' && !this.isShell) {
      // Turn into shell
      this.isShell = true;
      this.vx = 0;
      this.shellTimer = 5; // stay as shell for 5 seconds
      this.height = 20;
      this.y += 12;
    } else {
      this.kill(level);
    }
  }

  kill(level: Level): void {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0.5;
    this.vy = -200;
    level.spawnStompParticles(this.x + this.width / 2, this.y + this.height / 2);
  }

  kickShell(): void {
    if (this.isShell) {
      this.vx = this.vx === 0 ? 300 : 0;
    }
  }

  update(dt: number, tileMap: TileMap, platforms: Platform[]): void {
    if (this.dead) {
      this.deathTimer -= dt;
      this.vy += 980 * dt;
      this.y += this.vy * dt;
      return;
    }

    if (this.isShell) {
      this.shellTimer -= dt;
      if (this.shellTimer <= 0) {
        // Revive
        this.isShell = false;
        this.vx = -60;
        this.height = 32;
        this.y -= 12;
      }
    }

    // Walk frame
    this.walkFrameTimer += dt;
    if (this.walkFrameTimer > 0.15) {
      this.walkFrameTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 2;
    }

    if (this.type === 'flyingKoopa') {
      this.updateFlyingKoopa(dt, tileMap);
      return;
    }

    // Apply gravity
    this.vy += 980 * dt;
    if (this.vy > 600) this.vy = 600;

    // Move X
    this.x += this.vx * dt;

    // Check horizontal tile collisions
    const tileCheck = (cx: number, cy: number) => {
      const col = tileMap.worldToTileCol(cx);
      const row = tileMap.worldToTileRow(cy);
      return isSolid(tileMap.getTile(row, col));
    };

    if (this.vx > 0) {
      if (tileCheck(this.x + this.width, this.y + this.height / 2) ||
          tileCheck(this.x + this.width, this.y + this.height - 4)) {
        const col = tileMap.worldToTileCol(this.x + this.width);
        this.x = col * TILE_SIZE - this.width;
        this.vx = -Math.abs(this.vx);
      }
    } else {
      if (tileCheck(this.x, this.y + this.height / 2) ||
          tileCheck(this.x, this.y + this.height - 4)) {
        const col = tileMap.worldToTileCol(this.x);
        this.x = (col + 1) * TILE_SIZE;
        this.vx = Math.abs(this.vx);
      }
    }

    // Move Y
    this.y += this.vy * dt;

    // Ground check
    this.onGround = false;
    const botLeft = tileMap.worldToTileRow(this.y + this.height + 1);
    const colLeft = tileMap.worldToTileCol(this.x + 2);
    const colRight = tileMap.worldToTileCol(this.x + this.width - 3);
    if (isSolid(tileMap.getTile(botLeft, colLeft)) || isSolid(tileMap.getTile(botLeft, colRight))) {
      const row = botLeft;
      this.y = row * TILE_SIZE - this.height;
      this.vy = 0;
      this.onGround = true;
    }

    // Check platform collision
    for (const platform of platforms) {
      if (
        this.x + this.width > platform.x &&
        this.x < platform.x + platform.width &&
        this.y + this.height >= platform.y &&
        this.y + this.height <= platform.y + 12 &&
        this.vy >= 0
      ) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
        this.x += platform.vx * dt;
      }
    }

    // Turn at edges (don't walk off)
    if (this.onGround && !this.isShell) {
      const aheadCol = tileMap.worldToTileCol(this.x + (this.vx > 0 ? this.width + 2 : -2));
      const belowRow = tileMap.worldToTileRow(this.y + this.height + 2);
      if (!isSolid(tileMap.getTile(belowRow, aheadCol))) {
        this.vx = -this.vx;
      }
    }
  }

  private updateFlyingKoopa(dt: number, _tileMap: TileMap): void {
    // Patrol horizontally, bob up and down
    this.x += this.vx * dt;
    this.y = this.flyY + Math.sin(Date.now() / 500) * 20;

    // Turn if moved too far
    if (Math.abs(this.x - this.startX) > 128) {
      this.vx = -this.vx;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead && this.deathTimer <= 0) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (this.dead) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.deathTimer / 0.5);
    }

    switch (this.type) {
      case 'goomba': this.drawGoomba(ctx, x, y); break;
      case 'koopa': this.drawKoopa(ctx, x, y, false); break;
      case 'flyingKoopa': this.drawKoopa(ctx, x, y, true); break;
    }

    if (this.dead) {
      ctx.restore();
    }
  }

  private drawGoomba(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = this.width;
    const h = this.height;

    if (this.dead) {
      // Squished
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.fillStyle = '#5C2E00';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h - 4, w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Body (brown mushroom shape)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Feet / bottom
    ctx.fillStyle = '#5C2E00';
    const footOffset = this.walkFrame === 0 ? 0 : 3;
    ctx.fillRect(x + 2, y + h - 8, 9, 8);
    ctx.fillRect(x + w - 11, y + h - 8 + footOffset, 9, 8 - footOffset);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 4, y + 6, 7, 6);
    ctx.fillRect(x + w - 11, y + 6, 7, 6);

    // Angry eyebrows
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 4, y + 5, 7, 2);
    ctx.fillRect(x + w - 11, y + 5, 7, 2);

    // Pupils
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + 8, 3, 3);
    ctx.fillRect(x + w - 8, y + 8, 3, 3);

    // Teeth
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6, y + 19, 4, 3);
    ctx.fillRect(x + 14, y + 19, 4, 3);
  }

  private drawKoopa(ctx: CanvasRenderingContext2D, x: number, y: number, flying: boolean): void {
    const w = this.width;
    const h = this.height;
    const shellColor = flying ? '#00aaff' : '#00aa00';
    const shellDark = flying ? '#0088cc' : '#007700';

    if (this.isShell) {
      // Draw shell
      ctx.fillStyle = shellColor;
      ctx.fillRect(x + 2, y, w - 4, h);
      ctx.fillStyle = shellDark;
      // Shell pattern
      ctx.fillRect(x + 6, y + 3, w - 12, 3);
      ctx.fillRect(x + 3, y + 8, 5, 5);
      ctx.fillRect(x + w - 8, y + 8, 5, 5);
      return;
    }

    // Shell/body
    ctx.fillStyle = shellColor;
    ctx.fillRect(x + 2, y + 6, w - 4, h - 12);

    // Shell highlight
    ctx.fillStyle = shellDark;
    ctx.fillRect(x + 4, y + 8, 6, 6);
    ctx.fillRect(x + w - 10, y + 8, 6, 6);

    // Head
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(x + 4, y, w - 8, 10);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w - 12, y + 2, 5, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w - 10, y + 3, 3, 3);

    // Feet
    ctx.fillStyle = '#888800';
    const footOff = this.walkFrame === 0 ? 0 : 3;
    ctx.fillRect(x + 1, y + h - 8, 8, 8);
    ctx.fillRect(x + w - 9, y + h - 8 + footOff, 8, 8 - footOff);

    // Wings for flying koopa
    if (flying) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 8);
      ctx.lineTo(x + 4, y + 14);
      ctx.lineTo(x - 2, y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w + 8, y + 8);
      ctx.lineTo(x + w - 4, y + 14);
      ctx.lineTo(x + w + 2, y + 20);
      ctx.closePath();
      ctx.fill();
    }
  }
}
