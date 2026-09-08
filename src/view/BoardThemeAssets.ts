import type Phaser from 'phaser';

export const ORYX_TERRAIN_KEY = 'oryx-terrain';
export const ORYX_HEROES_SIMPLE_KEY = 'oryx-heroes-simple';
export const ORYX_ITEMS_KEY = 'oryx-items';

const GRAVEYARD_ASSET_ROOT = '/assets/board/graveyard';

export function preloadBoardThemeAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(ORYX_TERRAIN_KEY, '/assets/oryx/uf_terrain.png', {
    frameWidth: 48,
    frameHeight: 48,
  });
  scene.load.spritesheet(ORYX_HEROES_SIMPLE_KEY, '/assets/oryx/uf_heroes_simple.png', {
    frameWidth: 48,
    frameHeight: 48,
  });
  scene.load.spritesheet(ORYX_ITEMS_KEY, '/assets/oryx/uf_items.png', {
    frameWidth: 48,
    frameHeight: 48,
  });

  const graveyardSquare64 = (key: string, file: string): void => {
    scene.load.spritesheet(key, `${GRAVEYARD_ASSET_ROOT}/${file}`, {
      frameWidth: 64,
      frameHeight: 64,
    });
  };

  graveyardSquare64('graveyard-floor', 'floor.png');
  graveyardSquare64('graveyard-wall-a', 'wall-a.png');
  graveyardSquare64('graveyard-wall-b', 'wall-b.png');
  graveyardSquare64('graveyard-wall-c', 'wall-c.png');
  graveyardSquare64('graveyard-clue-tile', 'clue-tile.png');
  graveyardSquare64('graveyard-clue-corner', 'clue-corner.png');

  scene.load.spritesheet('graveyard-floor-mark', `${GRAVEYARD_ASSET_ROOT}/floor-mark.png`, {
    frameWidth: 64,
    frameHeight: 64,
  });
}
