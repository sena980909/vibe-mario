export interface TileConfig {
  id: number;
  // 0=empty, 1=ground, 2=brick, 3=question, 4=used,
  // 5=pipe-tl, 6=pipe-tr, 7=pipe-bl, 8=pipe-br,
  // 9=flag-pole, 10=platform(one-way), 11=coin-tile(converted to entity)
}

export interface EntityConfig {
  type: 'goomba' | 'koopa' | 'flying-koopa' | 'coin' | 'mushroom' | 'fireflower' | 'star';
  tileX: number;
  tileY: number;
}

export interface MovingPlatformConfig {
  tileX: number;
  tileY: number;
  widthTiles: number;
  axis: 'x' | 'y';
  rangeTiles: number;
  speed: number;
}

export interface WarpConfig {
  srcTileX: number;
  srcTileY: number;
  destLevel: number;
  destTileX: number;
  destTileY: number;
}

export interface LevelData {
  id: number;
  name: string;
  widthTiles: number;
  heightTiles: number;
  tileSize: 32;
  background: 'sky' | 'underground';
  playerStartTileX: number;
  playerStartTileY: number;
  flagTileX: number;
  tiles: number[][];
  entities: EntityConfig[];
  movingPlatforms: MovingPlatformConfig[];
  warps: WarpConfig[];
  timeLimit: number;
}
