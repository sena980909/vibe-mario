import { Camera } from './Camera';

export const TILE_SIZE = 32;

// Tile types
export const TILE_EMPTY = 0;
export const TILE_GROUND = 1;
export const TILE_BRICK = 2;
export const TILE_QUESTION = 3;
export const TILE_COIN = 4;
export const TILE_PIPE_TL = 5;
export const TILE_PIPE_TR = 6;
export const TILE_PIPE_BL = 7;
export const TILE_PIPE_BR = 8;
export const TILE_PLATFORM = 9;
export const TILE_FLAG_BASE = 10;
export const TILE_FLAG_TOP = 11;
export const TILE_QUESTION_USED = 12;
export const TILE_BRICK_BROKEN = 13;
export const TILE_SOLID_BLUE = 14; // Underground solid block

export function isSolid(tile: number): boolean {
  return [
    TILE_GROUND, TILE_BRICK, TILE_QUESTION, TILE_QUESTION_USED,
    TILE_PIPE_TL, TILE_PIPE_TR, TILE_PIPE_BL, TILE_PIPE_BR,
    TILE_SOLID_BLUE
  ].includes(tile);
}

export function isOneWay(tile: number): boolean {
  return tile === TILE_PLATFORM;
}

export function isBreakable(tile: number): boolean {
  return tile === TILE_BRICK;
}

export function isQuestion(tile: number): boolean {
  return tile === TILE_QUESTION;
}

export class TileMap {
  private tiles: number[][];
  readonly rows: number;
  readonly cols: number;
  private questionBounce: Map<string, number> = new Map();
  private isUnderground: boolean;

  constructor(tiles: number[][], isUnderground = false) {
    this.tiles = tiles;
    this.rows = tiles.length;
    this.cols = tiles[0]?.length ?? 0;
    this.isUnderground = isUnderground;
  }

  getTile(row: number, col: number): number {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return TILE_GROUND; // treat out-of-bounds as solid
    }
    return this.tiles[row][col];
  }

  setTile(row: number, col: number, type: number): void {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.tiles[row][col] = type;
    }
  }

  getWidthPx(): number { return this.cols * TILE_SIZE; }
  getHeightPx(): number { return this.rows * TILE_SIZE; }

  tileToWorldX(col: number): number { return col * TILE_SIZE; }
  tileToWorldY(row: number): number { return row * TILE_SIZE; }

  worldToTileCol(x: number): number { return Math.floor(x / TILE_SIZE); }
  worldToTileRow(y: number): number { return Math.floor(y / TILE_SIZE); }

  bounceQuestion(row: number, col: number): void {
    const key = `${row},${col}`;
    this.questionBounce.set(key, 0.3); // 0.3s animation
  }

  getQuestionBounce(row: number, col: number): number {
    return this.questionBounce.get(`${row},${col}`) ?? 0;
  }

  updateBounces(dt: number): void {
    this.questionBounce.forEach((v, k) => {
      const nv = v - dt;
      if (nv <= 0) this.questionBounce.delete(k);
      else this.questionBounce.set(k, nv);
    });
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / TILE_SIZE) + 1);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = this.tiles[row][col];
        if (tile === TILE_EMPTY) continue;

        const wx = col * TILE_SIZE;
        const wy = row * TILE_SIZE;

        // Question block bounce offset
        let bounceY = 0;
        if (tile === TILE_QUESTION || tile === TILE_QUESTION_USED) {
          const b = this.getQuestionBounce(row, col);
          if (b > 0) {
            bounceY = -Math.sin((b / 0.3) * Math.PI) * 8;
          }
        }

        this.drawTile(ctx, tile, wx, wy + bounceY, this.isUnderground);
      }
    }
  }

  private drawTile(ctx: CanvasRenderingContext2D, tile: number, x: number, y: number, underground: boolean): void {
    const s = TILE_SIZE;

    switch (tile) {
      case TILE_GROUND: {
        if (underground) {
          // Underground: dark blue/grey bricks
          ctx.fillStyle = '#4455aa';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#2233aa';
          ctx.fillRect(x, y, s, 4);
          ctx.strokeStyle = '#2233aa';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        } else {
          // Grassland: dark green top, brown body
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#228B22';
          ctx.fillRect(x, y, s, 6);
          // Texture lines
          ctx.strokeStyle = '#5C2E00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y + 12);
          ctx.lineTo(x + s, y + 12);
          ctx.moveTo(x, y + 22);
          ctx.lineTo(x + s, y + 22);
          ctx.stroke();
        }
        break;
      }
      case TILE_BRICK: {
        const brickColor = underground ? '#886644' : '#c87941';
        const mortarColor = underground ? '#553322' : '#8B4513';
        ctx.fillStyle = brickColor;
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = mortarColor;
        // Horizontal mortar
        ctx.fillRect(x, y + s / 2 - 1, s, 2);
        ctx.fillRect(x, y, s, 1);
        ctx.fillRect(x, y + s - 1, s, 1);
        // Vertical mortar - offset per row
        const offset = Math.floor(y / s) % 2 === 0 ? s / 2 : 0;
        ctx.fillRect(x + offset, y, 2, s / 2);
        ctx.fillRect(x + (offset + s / 2) % s, y + s / 2, 2, s / 2);
        break;
      }
      case TILE_QUESTION: {
        // Yellow with ? and sparkle border
        ctx.fillStyle = '#f0a000';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#f8d800';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#c87000';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y + s - 2, s, 2);
        ctx.fillRect(x, y, 2, s);
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillStyle = '#000';
        ctx.font = `bold ${s - 8}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + s / 2, y + s / 2 + 1);
        break;
      }
      case TILE_QUESTION_USED: {
        ctx.fillStyle = '#888';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y + s - 2, s, 2);
        ctx.fillRect(x, y, 2, s);
        ctx.fillRect(x + s - 2, y, 2, s);
        break;
      }
      case TILE_COIN: {
        // Floating coin tile
        ctx.fillStyle = 'rgba(255,200,0,0.85)';
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s / 2, s / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s / 2, s / 2 - 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TILE_PIPE_TL: {
        ctx.fillStyle = '#008800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#00bb00';
        ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
        ctx.fillStyle = '#006600';
        ctx.fillRect(x + s - 4, y, 4, s);
        break;
      }
      case TILE_PIPE_TR: {
        ctx.fillStyle = '#008800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#00bb00';
        ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
        ctx.fillStyle = '#006600';
        ctx.fillRect(x, y, 4, s);
        break;
      }
      case TILE_PIPE_BL: {
        ctx.fillStyle = '#008800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#006600';
        ctx.fillRect(x + s - 4, y, 4, s);
        break;
      }
      case TILE_PIPE_BR: {
        ctx.fillStyle = '#008800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#006600';
        ctx.fillRect(x, y, 4, s);
        break;
      }
      case TILE_PLATFORM: {
        const pColor = underground ? '#8888ff' : '#c87941';
        ctx.fillStyle = pColor;
        ctx.fillRect(x, y, s, 8);
        ctx.fillStyle = underground ? '#6666cc' : '#8B4513';
        ctx.fillRect(x, y + 8, s, 4);
        break;
      }
      case TILE_FLAG_BASE: {
        ctx.fillStyle = '#888';
        ctx.fillRect(x + s / 2 - 2, y, 4, s);
        ctx.fillStyle = '#666';
        ctx.fillRect(x + 2, y + s - 6, s - 4, 6);
        break;
      }
      case TILE_FLAG_TOP: {
        ctx.fillStyle = '#888';
        ctx.fillRect(x + s / 2 - 2, y, 4, s);
        // Flag
        ctx.fillStyle = '#00cc00';
        ctx.beginPath();
        ctx.moveTo(x + s / 2 + 2, y + 4);
        ctx.lineTo(x + s - 4, y + s / 2);
        ctx.lineTo(x + s / 2 + 2, y + s - 4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case TILE_SOLID_BLUE: {
        ctx.fillStyle = '#3355bb';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#4466cc';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y + s - 2, s, 2);
        ctx.fillRect(x, y, 2, s);
        ctx.fillRect(x + s - 2, y, 2, s);
        break;
      }
    }
  }
}
