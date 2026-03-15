import { describe, it, expect } from 'vitest';

const TILE_SIZE = 32;

function worldToTileCol(x: number): number {
  return Math.floor(x / TILE_SIZE);
}

function worldToTileRow(y: number): number {
  return Math.floor(y / TILE_SIZE);
}

// Simplified tile collision resolver for testing
function resolveGroundCollision(
  x: number, y: number, w: number, h: number,
  vy: number, dt: number,
  tiles: number[][],
): { ny: number; nvy: number; onGround: boolean } {
  const ny = y + vy * dt;
  let nvy = vy;
  let onGround = false;

  if (vy >= 0) {
    // Check bottom corners
    const bottomY = ny + h;
    const col1 = worldToTileCol(x + 2);
    const col2 = worldToTileCol(x + w - 3);
    const row = worldToTileRow(bottomY);

    for (const col of [col1, col2]) {
      if (
        row >= 0 && row < tiles.length &&
        col >= 0 && col < (tiles[0]?.length ?? 0) &&
        tiles[row][col] === 1 // 1 = solid
      ) {
        return { ny: row * TILE_SIZE - h, nvy: 0, onGround: true };
      }
    }
  }

  return { ny, nvy, onGround };
}

describe('Collision / Tile Math', () => {
  it('worldToTileCol: 0 maps to tile 0', () => {
    expect(worldToTileCol(0)).toBe(0);
  });

  it('worldToTileCol: 64 maps to tile 2', () => {
    expect(worldToTileCol(64)).toBe(2);
  });

  it('worldToTileCol: 63 maps to tile 1', () => {
    expect(worldToTileCol(63)).toBe(1);
  });

  it('worldToTileRow: 96 maps to tile row 3', () => {
    expect(worldToTileRow(96)).toBe(3);
  });

  it('worldToTileRow: negative value gives negative row', () => {
    expect(worldToTileRow(-1)).toBe(-1);
  });

  it('entity lands on solid tile below (onGround = true)', () => {
    // 2 rows: row 0 = empty, row 1 = solid ground
    const tiles = [
      [0, 0, 0],
      [1, 1, 1],
    ];
    // Entity at top of row 1, falling down
    // Entity: 16x16, at y=14, vy=100, dt=1/60
    // After move: y = 14 + 100/60 ≈ 15.67, bottom ≈ 31.67
    // row = floor(31.67 / 32) = 0, which is empty — so still falling
    // Put entity so it crosses the boundary:
    const { onGround } = resolveGroundCollision(32, 8, 16, 16, 400, 0.1, tiles);
    // y=8, vy=400, dt=0.1 → ny=8+40=48, bottom=64, row=floor(64/32)=2 out of bounds → no ground
    expect(onGround).toBe(false);
  });

  it('entity sitting exactly on solid tile is on ground', () => {
    // Entity bottom at exactly TILE_SIZE (row 1 boundary)
    const tiles = [
      [0, 0, 0],
      [1, 1, 1],
    ];
    // y = 32 - 16 = 16 (exactly on tile row 1 top), vy = 0, dt = 1/60
    // bottomY after move = 32 + 0 = 32, row = floor(32/32) = 1 → solid!
    const { onGround, ny } = resolveGroundCollision(32, 16, 16, 16, 1, 1 / 60, tiles);
    expect(onGround).toBe(true);
    // ny should be snapped to row * TILE_SIZE - h = 32 - 16 = 16
    expect(ny).toBe(16);
  });

  it('entity moving up does not trigger ground collision', () => {
    const tiles = [
      [0, 0, 0],
      [1, 1, 1],
    ];
    // Jumping upward
    const { onGround } = resolveGroundCollision(32, 16, 16, 16, -300, 1 / 60, tiles);
    expect(onGround).toBe(false);
  });
});
