export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SaveData {
  stage: number;
  score: number;
  lives: number;
  highScore: number;
}

export interface TileCollisionResult {
  hit: boolean;
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
  tileType: number;
  tileRow: number;
  tileCol: number;
}

export function rectOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getOverlapRect(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  return { x, y, width, height };
}
