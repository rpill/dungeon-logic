import type Phaser from 'phaser';

import type { MonsterSkinId } from './MonsterVisuals';

const MONSTER_ASSETS = {
  monster_pink: [
    { key: 'monster-pink-01', path: '/assets/monsters/monster_pink_01.png' },
    { key: 'monster-pink-02', path: '/assets/monsters/monster_pink_02.png' },
    { key: 'monster-pink-03', path: '/assets/monsters/monster_pink_03.png' },
    { key: 'monster-pink-04', path: '/assets/monsters/monster_pink_04.png' },
  ],
  ghost: [
    { key: 'monster-ghost-01', path: '/assets/monsters/ghost_01.png' },
    { key: 'monster-ghost-02', path: '/assets/monsters/ghost_02.png' },
    { key: 'monster-ghost-03', path: '/assets/monsters/ghost_03.png' },
    { key: 'monster-ghost-04', path: '/assets/monsters/ghost_04.png' },
  ],
  slime: [
    { key: 'monster-slime-01', path: '/assets/monsters/slime_01.png' },
    { key: 'monster-slime-02', path: '/assets/monsters/slime_02.png' },
    { key: 'monster-slime-03', path: '/assets/monsters/slime_03.png' },
    { key: 'monster-slime-04', path: '/assets/monsters/slime_04.png' },
  ],
} as const satisfies Record<MonsterSkinId, readonly { key: string; path: string }[]>;

export const CHEST_CLOSED_TEXTURE_KEY = 'board-chest-01';
export const CHEST_OPEN_TEXTURE_KEY = 'board-chest-02';

export function monsterFrameKeys(skin: MonsterSkinId): readonly string[] {
  return MONSTER_ASSETS[skin].map(({ key }) => key);
}

export function preloadFixedObjectAssets(scene: Phaser.Scene): void {
  for (const frames of Object.values(MONSTER_ASSETS)) {
    for (const { key, path } of frames) {
      scene.load.image(key, path);
    }
  }
  scene.load.image(CHEST_CLOSED_TEXTURE_KEY, '/assets/items/chest_01.png');
  scene.load.image(CHEST_OPEN_TEXTURE_KEY, '/assets/items/chest_02.png');
}
