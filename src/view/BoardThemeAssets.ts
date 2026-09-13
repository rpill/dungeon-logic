import type Phaser from 'phaser';

const BOARD_FLOOR_ASSETS = [
  { key: 'board-floor-01', path: 'assets/floor/tile_floor_01.png' },
  { key: 'board-floor-02', path: 'assets/floor/tile_floor_02.png' },
  { key: 'board-floor-03', path: 'assets/floor/tile_floor_03.png' },
  { key: 'board-floor-04', path: 'assets/floor/tile_floor_04.png' },
] as const;

const BOARD_WALL_ASSETS = [
  { key: 'board-wall-01', path: 'assets/wall/tile_wall_01.png' },
  { key: 'board-wall-02', path: 'assets/wall/tile_wall_02.png' },
  { key: 'board-wall-03', path: 'assets/wall/tile_wall_03.png' },
  { key: 'board-wall-04', path: 'assets/wall/tile_wall_04.png' },
] as const;

export const BOARD_FLOOR_TEXTURE_KEYS = BOARD_FLOOR_ASSETS.map(({ key }) => key);
export const BOARD_WALL_TEXTURE_KEYS = BOARD_WALL_ASSETS.map(({ key }) => key);
export const BOARD_FLOOR_MARK_KEY = 'board-floor-mark';

export type BoardFloorTextureKey = typeof BOARD_FLOOR_ASSETS[number]['key'];
export type BoardWallTextureKey = typeof BOARD_WALL_ASSETS[number]['key'];

function coordinateHash(x: number, y: number, salt: number): number {
  return (
    Math.imul(x + 17 + salt, 73_856_093)
    ^ Math.imul(y + 23 + salt, 19_349_663)
  ) >>> 0;
}

export function resolveFloorTextureKey(x: number, y: number): BoardFloorTextureKey {
  return BOARD_FLOOR_TEXTURE_KEYS[coordinateHash(x, y, 0) % BOARD_FLOOR_TEXTURE_KEYS.length]!;
}

export function resolveWallTextureKey(x: number, y: number): BoardWallTextureKey {
  return BOARD_WALL_TEXTURE_KEYS[coordinateHash(x, y, 11) % BOARD_WALL_TEXTURE_KEYS.length]!;
}

export function preloadBoardThemeAssets(scene: Phaser.Scene): void {
  BOARD_FLOOR_ASSETS.forEach(({ key, path }) => scene.load.image(key, path));
  BOARD_WALL_ASSETS.forEach(({ key, path }) => scene.load.image(key, path));
  scene.load.image(BOARD_FLOOR_MARK_KEY, 'assets/mark.png');
}
