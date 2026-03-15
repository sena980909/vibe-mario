import {
  TileMap, TILE_SIZE, TILE_EMPTY, TILE_GROUND, TILE_BRICK, TILE_QUESTION,
  TILE_COIN, TILE_PIPE_TL, TILE_PIPE_TR, TILE_PIPE_BL, TILE_PIPE_BR,
  TILE_PLATFORM, TILE_FLAG_BASE, TILE_FLAG_TOP, TILE_QUESTION_USED,
  TILE_SOLID_BLUE, isSolid, isOneWay, isBreakable, isQuestion
} from './TileMap';
import { Camera } from './Camera';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Coin } from '../entities/Coin';
import { PowerUp } from '../entities/PowerUp';
import { Fireball } from '../entities/Fireball';
import { Particle } from '../entities/Particle';
import { Platform } from '../entities/Platform';
import { Star } from '../entities/Star';
import { rectOverlap } from '../types';
import { eventBus } from '../engine/EventBus';

export interface LevelData {
  name: string;
  tiles: number[][];
  spawnX: number;
  spawnY: number;
  enemies: EnemyDef[];
  movingPlatforms: MovingPlatformDef[];
  isUnderground: boolean;
  bgColor: string;
}

export interface EnemyDef {
  type: 'goomba' | 'koopa' | 'flyingKoopa';
  x: number;
  y: number;
}

export interface MovingPlatformDef {
  x: number;
  y: number;
  width: number;
  moveX: number;
  moveY: number;
  rangeX: number;
  rangeY: number;
}

export interface WarpZone {
  srcCol: number;
  srcRow: number;
  destLevel: number;
  destX: number;
  destY: number;
}

export class Level {
  private tileMap: TileMap;
  private data: LevelData;
  enemies: Enemy[] = [];
  coins: Coin[] = [];
  powerUps: PowerUp[] = [];
  fireballs: Fireball[] = [];
  particles: Particle[] = [];
  platforms: Platform[] = [];
  stars: Star[] = [];
  private flagTouched = false;
  private warpZones: WarpZone[] = [];
  private warpCooldown = 0;

  constructor(num: number) {
    this.data = num === 2 ? createLevel2() : createLevel1();
    this.tileMap = new TileMap(this.data.tiles, this.data.isUnderground);

    // Spawn enemies
    for (const ed of this.data.enemies) {
      this.enemies.push(new Enemy(ed.type, ed.x, ed.y));
    }

    // Spawn moving platforms
    for (const pd of this.data.movingPlatforms) {
      this.platforms.push(new Platform(pd.x, pd.y, pd.width, pd.moveX, pd.moveY, pd.rangeX, pd.rangeY));
    }

    // Extract tile coins into coin entities
    for (let row = 0; row < this.tileMap.rows; row++) {
      for (let col = 0; col < this.tileMap.cols; col++) {
        if (this.tileMap.getTile(row, col) === TILE_COIN) {
          this.coins.push(new Coin(col * TILE_SIZE + 8, row * TILE_SIZE + 4));
          this.tileMap.setTile(row, col, TILE_EMPTY);
        }
      }
    }

    // Setup level-specific stars and warp zones
    if (num === 2) {
      this.setupLevel2Extras();
    } else {
      this.setupLevel1Extras();
    }
  }

  private setupLevel1Extras(): void {
    // 3 hidden stars
    this.stars.push(new Star(7 * TILE_SIZE,  9 * TILE_SIZE));   // above initial Q blocks
    this.stars.push(new Star(53 * TILE_SIZE, 6 * TILE_SIZE));   // above pipe area, reachable from row-7 bricks
    this.stars.push(new Star(99 * TILE_SIZE, 9 * TILE_SIZE));   // above pre-flag brick row

    // Warp zone: pipe at col 22-23 (srcRow=12, top of 2-tall pipe) → level 2 entrance
    this.warpZones.push({
      srcCol: 22,
      srcRow: 12,
      destLevel: 2,
      destX: 2 * TILE_SIZE,
      destY: 11 * TILE_SIZE,
    });
  }

  private setupLevel2Extras(): void {
    // 3 hidden stars
    this.stars.push(new Star(5 * TILE_SIZE,  3 * TILE_SIZE));   // near ceiling at start
    this.stars.push(new Star(40 * TILE_SIZE, 7 * TILE_SIZE));   // between brick platforms
    this.stars.push(new Star(80 * TILE_SIZE, 7 * TILE_SIZE));   // near flag area above bricks

    // Warp zone: pipe at col 44-45 (srcRow=12) → level 1 mid-point
    this.warpZones.push({
      srcCol: 44,
      srcRow: 12,
      destLevel: 1,
      destX: 50 * TILE_SIZE,
      destY: 11 * TILE_SIZE,
    });
  }

  getSpawnPoint(): { x: number; y: number } {
    return { x: this.data.spawnX, y: this.data.spawnY };
  }

  getWidthPx(): number { return this.tileMap.getWidthPx(); }
  getHeightPx(): number { return this.tileMap.getHeightPx(); }
  isUnderground(): boolean { return this.data.isUnderground; }
  getBgColor(): string { return this.data.bgColor; }

  update(dt: number, player: Player, _camera: Camera): void {
    this.tileMap.updateBounces(dt);

    if (this.warpCooldown > 0) this.warpCooldown -= dt;

    // Update platforms
    for (const p of this.platforms) {
      p.update(dt);
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.tileMap, this.platforms);
      if (e.dead && e.deathTimer <= 0) {
        this.enemies.splice(i, 1);
      }
    }

    // Update coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.update(dt);
      if (c.collected) {
        this.coins.splice(i, 1);
      }
    }

    // Update power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.update(dt, this.tileMap);
      if (pu.collected) {
        this.powerUps.splice(i, 1);
      }
    }

    // Update fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.update(dt, this.tileMap);
      if (fb.dead) {
        this.fireballs.splice(i, 1);
        continue;
      }
      // Fireball vs enemies
      for (const e of this.enemies) {
        if (!e.dead && rectOverlap(fb, e)) {
          e.kill(this);
          fb.dead = true;
          break;
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) {
        this.particles.splice(i, 1);
      }
    }

    // Update stars + check collision
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.update(dt);
      if (!star.collected) {
        const bounds = star.getBounds();
        if (rectOverlap(player, bounds)) {
          star.collected = true;
          eventBus.emit('collectStar', i);
          eventBus.emit('playSound', 'star');
          eventBus.emit('addScore', 1000);
          this.spawnStarParticles(star.x + star.width / 2, star.y + star.height / 2);
        }
      }
    }

    // Player vs coins
    for (const c of this.coins) {
      if (!c.collected && rectOverlap(player, c)) {
        c.collect(this);
      }
    }

    // Player vs power-ups
    for (const pu of this.powerUps) {
      if (!pu.collected && rectOverlap(player, pu)) {
        pu.collect(player, this);
      }
    }

    // Player vs enemies
    if (!player.isInvincible()) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (!rectOverlap(player, e)) continue;

        // Check if player is stomping (falling onto enemy)
        const playerBottom = player.y + player.height;
        const enemyTop = e.y;
        const prevPlayerBottom = playerBottom - player.vy * dt;

        if (prevPlayerBottom <= enemyTop + 8 && player.vy > 0) {
          // Stomp!
          e.stomp(this);
          player.bounce();
          this.spawnStompParticles(e.x + e.width / 2, e.y + e.height / 2);
          eventBus.emit('stompEnemy');
        } else if (!e.isShell) {
          // Player gets hurt
          player.hurt();
        }
      }
    }

    // Player vs tiles (handled in player update, but also check special tiles)
    this.checkPlayerTileInteraction(player);

    // Check warp zones
    if (this.warpCooldown <= 0) {
      this.checkWarpZones(player);
    }

    // Check flag
    if (!this.flagTouched) {
      const flagCol = this.getFlagCol();
      if (flagCol > 0) {
        const flagX = flagCol * TILE_SIZE;
        if (player.x + player.width > flagX && player.x < flagX + TILE_SIZE * 2) {
          this.flagTouched = true;
          eventBus.emit('playerWon');
        }
      }
    }
  }

  private checkWarpZones(player: Player): void {
    if (!player.isPressingDown) return;
    if (!player.onGround) return;

    const playerCol = this.tileMap.worldToTileCol(player.x + player.width / 2);
    const playerRow = this.tileMap.worldToTileRow(player.y + player.height);

    for (const warp of this.warpZones) {
      // Check if player stands on top of pipe (pipe top row = srcRow, player bottom = srcRow)
      if (playerRow === warp.srcRow && (playerCol === warp.srcCol || playerCol === warp.srcCol + 1)) {
        this.warpCooldown = 2;
        eventBus.emit('warpPlayer', { destLevel: warp.destLevel, destX: warp.destX, destY: warp.destY });
        return;
      }
    }
  }

  private getFlagCol(): number {
    for (let row = 0; row < this.tileMap.rows; row++) {
      for (let col = 0; col < this.tileMap.cols; col++) {
        if (this.tileMap.getTile(row, col) === TILE_FLAG_TOP) return col;
      }
    }
    return -1;
  }

  private checkPlayerTileInteraction(player: Player): void {
    // Check tile above player head (for block hits)
    const headX = player.x + player.width / 2;
    const headY = player.y - 2;
    const col = this.tileMap.worldToTileCol(headX);
    const row = this.tileMap.worldToTileRow(headY);
    const tile = this.tileMap.getTile(row, col);

    if (player.vy < 0) {
      if (isQuestion(tile)) {
        this.hitQuestionBlock(row, col, player);
      } else if (isBreakable(tile)) {
        this.hitBrickBlock(row, col, player);
      }
    }
  }

  hitQuestionBlock(row: number, col: number, player: Player): void {
    const tile = this.tileMap.getTile(row, col);
    if (tile !== TILE_QUESTION) return;

    this.tileMap.setTile(row, col, TILE_QUESTION_USED);
    this.tileMap.bounceQuestion(row, col);
    eventBus.emit('addScore', 50);
    eventBus.emit('playSound', 'coin');

    // Spawn coin or mushroom
    const wx = col * TILE_SIZE + 8;
    const wy = row * TILE_SIZE - 16;

    if (player.powerLevel === 0) {
      // Spawn mushroom
      this.powerUps.push(new PowerUp('mushroom', wx, wy));
    } else {
      // Spawn coin pop
      const c = new Coin(wx, wy);
      c.startPop();
      this.coins.push(c);
    }
  }

  hitBrickBlock(row: number, col: number, player: Player): void {
    const tile = this.tileMap.getTile(row, col);
    if (tile !== TILE_BRICK) return;

    if (player.powerLevel > 0) {
      // Break it
      this.tileMap.setTile(row, col, TILE_EMPTY);
      this.spawnBrickParticles(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
      eventBus.emit('addScore', 50);
      eventBus.emit('playSound', 'blockBreak');
    } else {
      // Just bounce
      this.tileMap.bounceQuestion(row, col);
      eventBus.emit('playSound', 'stomp');
    }
  }

  spawnStompParticles(cx: number, cy: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      this.particles.push(new Particle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, '#8B4513', 0.5));
    }
  }

  spawnBrickParticles(cx: number, cy: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 120 + Math.random() * 80;
      this.particles.push(new Particle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 100, '#c87941', 0.7, true));
    }
  }

  spawnCoinParticles(cx: number, cy: number): void {
    for (let i = 0; i < 4; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = -80 - Math.random() * 60;
      this.particles.push(new Particle(cx, cy, vx, vy, '#ffd700', 0.6));
    }
  }

  spawnStarParticles(cx: number, cy: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 100 + Math.random() * 80;
      this.particles.push(new Particle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 50, '#ffd700', 0.8));
    }
  }

  addFireball(fb: Fireball): void {
    this.fireballs.push(fb);
  }

  getTileMap(): TileMap {
    return this.tileMap;
  }

  resolveTileCollisions(
    x: number, y: number, w: number, h: number,
    vx: number, vy: number,
    dt: number
  ): { x: number; y: number; vx: number; vy: number; onGround: boolean; hitHead: boolean } {
    let nx = x, ny = y, nvx = vx, nvy = vy;
    let onGround = false;
    let hitHead = false;

    // Resolve X axis
    nx = x + vx * dt;

    // Check horizontal corners (mid-height to avoid floor/ceiling catching corners)
    const xCorners: [number, number][] = [
      [nx, y + 2],
      [nx + w - 1, y + 2],
      [nx, y + h - 3],
      [nx + w - 1, y + h - 3]
    ];

    for (const [cx, cy] of xCorners) {
      const col = this.tileMap.worldToTileCol(cx);
      const row = this.tileMap.worldToTileRow(cy);
      const tile = this.tileMap.getTile(row, col);
      if (isSolid(tile)) {
        if (vx > 0) {
          nx = col * TILE_SIZE - w;
        } else if (vx < 0) {
          nx = (col + 1) * TILE_SIZE;
        }
        nvx = 0;
        break;
      }
    }

    // Resolve Y axis
    ny = y + vy * dt;

    // Check vertical corners
    const yTopCorners: [number, number][] = [
      [nx + 2, ny],
      [nx + w - 3, ny]
    ];
    const yBotCorners: [number, number][] = [
      [nx + 2, ny + h],
      [nx + w - 3, ny + h]
    ];

    // Check top (head)
    if (nvy < 0) {
      for (const [cx, cy] of yTopCorners) {
        const col = this.tileMap.worldToTileCol(cx);
        const row = this.tileMap.worldToTileRow(cy);
        const tile = this.tileMap.getTile(row, col);
        if (isSolid(tile)) {
          ny = (row + 1) * TILE_SIZE;
          nvy = 0;
          hitHead = true;
          break;
        }
      }
    }

    // Check bottom (ground)
    if (nvy >= 0) {
      for (const [cx, cy] of yBotCorners) {
        const col = this.tileMap.worldToTileCol(cx);
        const row = this.tileMap.worldToTileRow(cy);
        const tile = this.tileMap.getTile(row, col);
        if (isSolid(tile)) {
          ny = row * TILE_SIZE - h;
          nvy = 0;
          onGround = true;
          break;
        }
        // One-way platform: only land from above
        if (isOneWay(tile) && vy >= 0) {
          const prevBottom = y + h;
          if (prevBottom <= row * TILE_SIZE + 4) {
            ny = row * TILE_SIZE - h;
            nvy = 0;
            onGround = true;
            break;
          }
        }
      }
    }

    // Check moving platforms
    if (nvy >= 0) {
      for (const platform of this.platforms) {
        const prevBottom = y + h;
        const newBottom = ny + h;
        if (
          nx + w > platform.x &&
          nx < platform.x + platform.width &&
          newBottom >= platform.y &&
          prevBottom <= platform.y + 8
        ) {
          ny = platform.y - h;
          nvy = 0;
          onGround = true;
          // Carry on platform
          nx += platform.vx * dt;
          break;
        }
      }
    }

    return { x: nx, y: ny, vx: nvx, vy: nvy, onGround, hitHead };
  }

  drawBackground(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, cameraX = 0): void {
    if (this.data.isUnderground) {
      ctx.fillStyle = '#111133';
      ctx.fillRect(0, 0, canvasW, canvasH);
    } else {
      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
      grad.addColorStop(0, '#5c94fc');
      grad.addColorStop(1, '#9ec0ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Clouds with parallax (0.3x camera speed)
      const cloudPositions = [100, 300, 550, 850, 1150, 1450, 1750, 2100, 2500, 2900, 3300];
      for (const wx of cloudPositions) {
        // Parallax: cloud screen X = worldX - cameraX * 0.3
        const sx = wx - cameraX * 0.3;
        if (sx > -120 && sx < canvasW + 120) {
          this.drawCloud(ctx, sx, 55);
        }
      }
    }
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 28, 0, Math.PI * 2);
    ctx.arc(x + 55, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 20, y, 95, 20);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    this.tileMap.draw(ctx, camera);

    for (const p of this.platforms) {
      p.draw(ctx);
    }
    for (const c of this.coins) {
      c.draw(ctx);
    }
    for (const pu of this.powerUps) {
      pu.draw(ctx);
    }
    for (const e of this.enemies) {
      e.draw(ctx);
    }
    for (const fb of this.fireballs) {
      fb.draw(ctx);
    }
    for (const p of this.particles) {
      p.draw(ctx);
    }
    // Draw uncollected stars
    for (const star of this.stars) {
      if (!star.collected) {
        star.draw(ctx);
      }
    }
  }
}

// ==================== LEVEL 1 DATA ====================
function createLevel1(): LevelData {
  const COLS = 120;
  const ROWS = 15;
  const E = TILE_EMPTY;
  const G = TILE_GROUND;
  const B = TILE_BRICK;
  const Q = TILE_QUESTION;
  const TL = TILE_PIPE_TL;
  const TR = TILE_PIPE_TR;
  const BL = TILE_PIPE_BL;
  const BR = TILE_PIPE_BR;
  void TILE_PLATFORM; // suppress unused-import warning
  const FB = TILE_FLAG_BASE;
  const FT = TILE_FLAG_TOP;

  const tiles: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(E));

  function set(r: number, c: number, val: number) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) tiles[r][c] = val;
  }
  function row(r: number, c1: number, c2: number, val: number) {
    for (let c = c1; c <= c2; c++) set(r, c, val);
  }

  // ── Ground (rows 13 & 14, full width) ────────────────────────────────────
  row(13, 0, 119, G);
  row(14, 0, 119, G);

  // ── AREA 1 (cols 0-20) – Tutorial start ──────────────────────────────────
  set(10, 6, Q);
  // Brick row at row 10: cols 10,11, Q at 12, bricks 13,14
  set(10, 10, B);
  set(10, 11, B);
  set(10, 12, Q);
  set(10, 13, B);
  set(10, 14, B);

  // ── AREA 2 (cols 20-45) – Pipe + enemies ─────────────────────────────────
  // Pipe 2-tall: warp pipe (cols 22-23)
  set(12, 22, TL); set(12, 23, TR);
  set(13, 22, BL); set(13, 23, BR);

  // Q blocks at row 10: cols 25, 27, 29
  set(10, 25, Q);
  set(10, 27, Q);
  set(10, 29, Q);

  // Brick row at row 10: cols 31-36 with Q at 34
  set(10, 31, B);
  set(10, 32, B);
  set(10, 33, B);
  set(10, 34, Q);
  set(10, 35, B);
  set(10, 36, B);

  // ── AREA 3 (cols 45-65) – Pipe 3-tall + elevated bricks ──────────────────
  // Pipe 3-tall (cols 48-49)
  set(11, 48, TL); set(11, 49, TR);
  set(12, 48, BL); set(12, 49, BR);
  set(13, 48, BL); set(13, 49, BR);

  // Brick row at row 10: cols 52-59 with Q at 53 and 56
  row(10, 52, 59, B);
  set(10, 53, Q);
  set(10, 56, Q);

  // Second brick row at row 7: cols 57-61 (higher platform)
  row(7, 57, 61, B);
  set(7, 59, Q); // high-reward Q

  // ── AREA 4 (cols 65-85) – Staircase platforms (bricks) ───────────────────
  // Ascending stairs
  row(12, 66, 68, B);   // 1 tile high
  row(11, 69, 71, B);   // 2 tiles high
  row(10, 72, 74, B);   // 3 tiles high
  set(10, 73, Q);       // Q at top of stairs

  // Descending stairs
  row(11, 75, 77, B);
  row(12, 78, 80, B);

  // ── AREA 5 (cols 85-110) – Pre-flag ──────────────────────────────────────
  // Pipe 2-tall (cols 87-88)
  set(12, 87, TL); set(12, 88, TR);
  set(13, 87, BL); set(13, 88, BR);

  // Q blocks at row 10
  set(10, 91, Q);
  set(10, 93, Q);
  set(10, 95, Q);

  // Brick row at row 10: cols 97-102 with Q at 99
  row(10, 97, 102, B);
  set(10, 99, Q);

  // ── Flag pole (col 108) ───────────────────────────────────────────────────
  for (let r = 4; r <= 14; r++) {
    set(r, 108, FB);
  }
  set(3, 108, FT);

  // ── Enemies ───────────────────────────────────────────────────────────────
  const enemies: EnemyDef[] = [
    // Area 1
    { type: 'goomba',      x:  8 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 2
    { type: 'goomba',      x: 21 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 26 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 28 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 3
    { type: 'goomba',      x: 50 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 54 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 58 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',       x: 61 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 4
    { type: 'goomba',      x: 67 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 73 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',       x: 76 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 79 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 5
    { type: 'goomba',      x: 90 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 94 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 100 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',       x: 103 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'flyingKoopa', x:  78 * TILE_SIZE, y:  5 * TILE_SIZE },
  ];

  return {
    name: 'World 1-1',
    tiles,
    spawnX: 2 * TILE_SIZE,
    spawnY: 11 * TILE_SIZE,
    enemies,
    movingPlatforms: [],
    isUnderground: false,
    bgColor: '#5c94fc',
  };
}

// ==================== LEVEL 2 DATA ====================
function createLevel2(): LevelData {
  const COLS = 100;
  const ROWS = 15;
  const E = TILE_EMPTY;
  const G = TILE_GROUND;
  const B = TILE_BRICK;
  const Q = TILE_QUESTION;
  const C = TILE_COIN;
  const S = TILE_SOLID_BLUE;
  const TL = TILE_PIPE_TL;
  const TR = TILE_PIPE_TR;
  const BL = TILE_PIPE_BL;
  const BR = TILE_PIPE_BR;
  const FB = TILE_FLAG_BASE;
  const FT = TILE_FLAG_TOP;

  const tiles: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(E));

  function set(r: number, c: number, val: number) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) tiles[r][c] = val;
  }
  function row(r: number, c1: number, c2: number, val: number) {
    for (let c = c1; c <= c2; c++) set(r, c, val);
  }

  // ── Ceiling (rows 0-1) ────────────────────────────────────────────────────
  row(0, 0, 99, S);
  row(1, 0, 99, S);

  // ── Floor (rows 13-14) ────────────────────────────────────────────────────
  row(13, 0, 99, G);
  row(14, 0, 99, G);

  // ── AREA 1 (cols 0-25) – Entrance ────────────────────────────────────────
  // Ceiling hangs (leave ≥6 tiles gap for player to walk through)
  row(2, 0, 6, S);
  row(2, 10, 18, S);

  // Brick platform at row 8 with Q blocks
  row(8, 3, 8, B);
  set(8, 5, Q);
  set(8, 7, Q);

  // Coins at floor level (row 10)
  for (let c = 3; c <= 8; c++) set(10, c, C);

  // ── AREA 2 (cols 25-50) – Maze section ───────────────────────────────────
  // Partial ceiling hang
  row(2, 28, 35, S);

  // Brick platform at row 8
  row(8, 30, 38, B);
  set(8, 32, Q);
  set(8, 35, Q);

  // Wall at col 42 with 3-tile gap (rows 10-12 open, 96px > Super Mario 32px)
  for (let r = 2; r <= 9; r++) set(r, 42, S);

  // Pipe 2-tall – warp pipe (cols 44-45, row 12 = top)
  set(12, 44, TL); set(12, 45, TR);
  set(13, 44, BL); set(13, 45, BR);

  // Coins at row 10
  row(10, 33, 40, C);

  // ── AREA 3 (cols 50-75) – Vertical section ───────────────────────────────
  // Wall at col 55 with 3-tile gap (rows 10-12 open)
  for (let r = 2; r <= 9; r++) set(r, 55, S);

  // Brick platforms at varying heights
  row(8, 52, 58, B);
  set(8, 54, Q);

  // High ceiling extension
  row(6, 60, 66, S);

  row(9, 62, 68, B);
  set(9, 64, Q);
  set(9, 66, Q);

  // Coins along floor-level area
  row(11, 52, 60, C);

  // ── AREA 4 (cols 75-92) – Pre-flag ───────────────────────────────────────
  row(8, 77, 84, B);
  set(8, 79, Q);
  set(8, 81, Q);
  set(8, 83, Q);

  // Coins at row 11
  row(11, 77, 88, C);

  // ── Flag pole (col 92) ────────────────────────────────────────────────────
  // Ceiling at rows 0-1 stays; flag starts at row 3 (FT) / rows 3-14 (FB)
  for (let r = 3; r <= 14; r++) {
    set(r, 92, FB);
  }
  set(2, 92, FT);

  // ── Enemies ───────────────────────────────────────────────────────────────
  const enemies: EnemyDef[] = [
    // Area 1
    { type: 'goomba',      x:  6 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 14 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 2
    { type: 'goomba',      x: 31 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 37 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 46 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',       x: 42 * TILE_SIZE, y: 12 * TILE_SIZE },
    // Area 3
    { type: 'goomba',      x: 54 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 60 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba',      x: 67 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'flyingKoopa', x: 65 * TILE_SIZE, y:  5 * TILE_SIZE },
    // Area 4
    { type: 'koopa',       x: 78 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',       x: 83 * TILE_SIZE, y: 12 * TILE_SIZE },
  ];

  const movingPlatforms: MovingPlatformDef[] = [
    { x: 35 * TILE_SIZE, y: 9 * TILE_SIZE, width: 64, moveX: 1, moveY: 0, rangeX: 80, rangeY: 0 },
    { x: 58 * TILE_SIZE, y: 7 * TILE_SIZE, width: 64, moveX: 0, moveY: 1, rangeX: 0, rangeY: 64 },
  ];

  return {
    name: 'World 1-2',
    tiles,
    spawnX: 2 * TILE_SIZE,
    spawnY: 11 * TILE_SIZE,
    enemies,
    movingPlatforms,
    isUnderground: true,
    bgColor: '#111133',
  };
}
