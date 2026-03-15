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

export class Level {
  private tileMap: TileMap;
  private data: LevelData;
  enemies: Enemy[] = [];
  coins: Coin[] = [];
  powerUps: PowerUp[] = [];
  fireballs: Fireball[] = [];
  particles: Particle[] = [];
  platforms: Platform[] = [];
  private flagTouched = false;

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
  const C = TILE_COIN;
  const TL = TILE_PIPE_TL;
  const TR = TILE_PIPE_TR;
  const BL = TILE_PIPE_BL;
  const BR = TILE_PIPE_BR;
  void TILE_PLATFORM; // platform tiles placed directly via set()
  const FB = TILE_FLAG_BASE;
  const FT = TILE_FLAG_TOP;

  const tiles: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(E));

  function set(row: number, col: number, val: number) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) tiles[row][col] = val;
  }
  function row(r: number, c1: number, c2: number, val: number) {
    for (let c = c1; c <= c2; c++) set(r, c, val);
  }

  // Ground floor (row 14 = last row)
  row(14, 0, 119, G);
  row(13, 0, 119, G);

  // Start platform area
  row(14, 0, 14, G);

  // First steps / elevated platform
  row(10, 16, 19, B);
  set(10, 18, Q);

  // Question blocks row
  set(8, 22, Q);
  set(8, 24, Q);
  set(8, 26, Q);
  // Hidden coin row above
  set(5, 23, C);
  set(5, 25, C);

  // Bricks
  row(10, 28, 33, B);
  set(10, 30, Q);
  set(10, 32, Q);

  // Pipe 1 (short, 2 high)
  set(12, 38, TL); set(12, 39, TR);
  set(13, 38, BL); set(13, 39, BR);

  // Pipe 2 (taller, 3 high)
  set(11, 45, TL); set(11, 46, TR);
  set(12, 45, BL); set(12, 46, BR);
  set(13, 45, BL); set(13, 46, BR);

  // Question blocks
  set(8, 50, Q);
  set(8, 52, Q);
  set(8, 54, Q);
  set(8, 56, Q);
  // Coin row between blocks
  set(6, 51, C);
  set(6, 53, C);
  set(6, 55, C);

  // Brick ceiling platform
  row(7, 58, 65, B);
  set(7, 60, Q);
  set(7, 62, Q);

  // Gap area (no ground tiles from col 67-70) -- leave empty

  // Elevated section
  row(10, 68, 80, G);  // elevated ground
  set(8, 70, Q);
  set(8, 72, Q);
  set(8, 74, B);
  row(6, 72, 76, B);
  set(6, 74, Q);

  // Pipe 3 on elevated section
  set(8, 78, TL); set(8, 79, TR);
  set(9, 78, BL); set(9, 79, BR);

  // Drop back to main ground
  row(14, 81, 119, G);
  row(13, 81, 119, G);

  // More coins floating
  row(9, 83, 87, C);

  // Brick platforms
  row(10, 84, 90, B);
  set(10, 86, Q);
  set(10, 88, Q);

  // Another pipe
  set(12, 95, TL); set(12, 96, TR);
  set(13, 95, BL); set(13, 96, BR);

  // Pre-flag bricks
  row(10, 100, 106, B);
  set(10, 102, Q);
  set(10, 104, Q);

  // Flag pole area (cols 108-111)
  for (let r = 4; r <= 14; r++) {
    set(r, 109, FB);
  }
  set(3, 109, FT);

  // Ground to end
  row(14, 110, 119, G);
  row(13, 110, 119, G);

  const enemies: EnemyDef[] = [
    { type: 'goomba', x: 20 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba', x: 35 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba', x: 42 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',  x: 55 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba', x: 60 * TILE_SIZE, y: 8 * TILE_SIZE },
    { type: 'goomba', x: 72 * TILE_SIZE, y: 8 * TILE_SIZE },
    { type: 'goomba', x: 85 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'goomba', x: 92 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'koopa',  x: 98 * TILE_SIZE, y: 12 * TILE_SIZE },
    { type: 'flyingKoopa', x: 75 * TILE_SIZE, y: 6 * TILE_SIZE },
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

  function set(row: number, col: number, val: number) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) tiles[row][col] = val;
  }
  function row(r: number, c1: number, c2: number, val: number) {
    for (let c = c1; c <= c2; c++) set(r, c, val);
  }

  // Ceiling
  row(0, 0, 99, S);
  row(1, 0, 99, S);

  // Floor
  row(13, 0, 99, G);
  row(14, 0, 99, G);

  // Left entrance area
  row(3, 0, 5, S);
  row(3, 8, 14, S);
  row(3, 18, 25, S);

  // Mid height blocks
  row(6, 4, 10, B);
  set(6, 7, Q);
  row(6, 15, 20, B);
  set(6, 17, Q);
  set(6, 19, Q);

  // Coins scattered
  row(9, 22, 28, C);
  set(8, 25, C);
  set(7, 24, C);
  set(7, 26, C);

  // Underground pillars
  row(4, 30, 30, S);
  row(5, 30, 30, S);
  row(6, 30, 30, S);
  row(7, 30, 30, S);
  row(8, 30, 30, S);
  row(9, 30, 30, S);
  row(10, 30, 30, S);
  row(11, 30, 30, S);

  // Passage gap at row 12
  row(4, 35, 35, S);
  row(5, 35, 35, S);
  row(6, 35, 35, S);
  row(7, 35, 35, S);
  row(8, 35, 35, S);
  row(9, 35, 35, S);
  row(10, 35, 35, S);
  row(11, 35, 35, S);
  row(12, 35, 35, S);

  // Question blocks section
  set(9, 37, Q);
  set(9, 39, Q);
  set(9, 41, Q);
  set(7, 38, Q);
  set(7, 40, Q);

  // Pipe obstacles
  set(11, 45, TL); set(11, 46, TR);
  set(12, 45, BL); set(12, 46, BR);

  set(10, 50, TL); set(10, 51, TR);
  set(11, 50, BL); set(11, 51, BR);
  set(12, 50, BL); set(12, 51, BR);

  // More brick platforms
  row(8, 54, 60, B);
  set(8, 56, Q);
  set(8, 58, Q);
  row(5, 58, 65, S);

  // Coins
  row(10, 62, 68, C);

  // Brick maze
  row(8, 65, 70, B);
  row(5, 68, 75, B);
  set(5, 70, Q);
  set(5, 72, Q);
  set(5, 74, Q);

  // More pillars
  for (let r = 4; r <= 11; r++) {
    set(r, 72, S);
    set(r, 78, S);
  }

  // Open area near flag
  set(9, 80, Q);
  set(9, 82, Q);
  set(9, 84, Q);
  row(9, 86, 90, C);

  // Flag pole
  for (let r = 4; r <= 14; r++) {
    set(r, 92, FB);
  }
  set(3, 92, FT);

  // Ground to end
  row(14, 92, 99, G);
  row(13, 92, 99, G);

  const enemies: EnemyDef[] = [
    { type: 'goomba', x: 6 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 12 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'koopa',  x: 22 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 32 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 36 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 42 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'koopa',  x: 48 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 55 * TILE_SIZE, y: 7 * TILE_SIZE },
    { type: 'goomba', x: 63 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 68 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'koopa',  x: 75 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'goomba', x: 82 * TILE_SIZE, y: 11 * TILE_SIZE },
    { type: 'flyingKoopa', x: 58 * TILE_SIZE, y: 5 * TILE_SIZE },
  ];

  const movingPlatforms: MovingPlatformDef[] = [
    { x: 38 * TILE_SIZE, y: 9 * TILE_SIZE, width: 64, moveX: 1, moveY: 0, rangeX: 80, rangeY: 0 },
    { x: 60 * TILE_SIZE, y: 7 * TILE_SIZE, width: 64, moveX: 0, moveY: 1, rangeX: 0, rangeY: 64 },
    { x: 78 * TILE_SIZE, y: 8 * TILE_SIZE, width: 96, moveX: 1, moveY: 0, rangeX: 96, rangeY: 0 },
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
