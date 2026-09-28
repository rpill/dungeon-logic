import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const helperPath = path.join(root, 'src/view/MonsterVisuals.ts');
assert(fs.existsSync(helperPath), 'Monster visual resolver module must exist.');

const visuals = await import(pathToFileURL(helperPath).href);
const { resolveMonsterSkin, getMonsterVisualVersion, MONSTER_VISUAL_POOLS } = visuals;

assert(Array.isArray(MONSTER_VISUAL_POOLS[1]), 'Monster visual pool v1 must exist.');
assert(MONSTER_VISUAL_POOLS[1].join(',') === 'monster_pink,ghost', 'Monster visual pool v1 must stay pink + ghost.');
assert(getMonsterVisualVersion('campaign-001') === 1, 'Existing levels must default to monster visual version 1.');

const first = resolveMonsterSkin('campaign-017', 3, 5);
for (let i = 0; i < 20; i += 1) {
  assert(resolveMonsterSkin('campaign-017', 3, 5) === first, 'Same level/cell must always resolve the same monster skin.');
}
assert(MONSTER_VISUAL_POOLS[1].includes(first), 'Resolved skin must come from the selected visual pool.');

const assets = [
  'public/assets/monsters/monster_pink_01.webp',
  'public/assets/monsters/monster_pink_02.webp',
  'public/assets/monsters/monster_pink_03.webp',
  'public/assets/monsters/monster_pink_04.webp',
  'public/assets/monsters/ghost_01.webp',
  'public/assets/monsters/ghost_02.webp',
  'public/assets/monsters/ghost_03.webp',
  'public/assets/monsters/ghost_04.webp',
  'public/assets/items/chest_01.webp',
  'public/assets/items/chest_02.webp',
];
for (const rel of assets) {
  assert(fs.existsSync(path.join(root, rel)), `Missing fixed-object asset: ${rel}`);
}

const cell = read('src/board/CellView.ts');
assert(cell.includes('fixedSprite'), 'CellView must render monster/chest sprites instead of text markers.');
assert(cell.includes('setSolvedVisualState'), 'CellView must support solved/reset visual state changes.');
assert(cell.includes('monsterFrameKeys'), 'Monster cells must use the animation frame keys.');
assert(cell.includes('CHEST_CLOSED_TEXTURE_KEY'), 'Chest must use the closed sprite before completion.');
assert(cell.includes('CHEST_OPEN_TEXTURE_KEY'), 'Chest must use the open sprite after completion.');

const board = read('src/board/BoardView.ts');
assert(board.includes('resolveMonsterSkin'), 'BoardView must assign monster skins deterministically from level id + coordinates.');
assert(board.includes('setSolvedVisualState'), 'BoardView must propagate solved/reset state to cells.');

const game = read('src/scenes/GameScene.ts');
assert(game.includes('board?.setSolvedVisualState(true);'), 'GameScene must start monster/chest completion visuals when puzzle is solved.');
assert(game.includes('board.setSolvedVisualState(completedReview);'), 'Completed review must immediately show looping monsters/open chest.');

const boot = read('src/scenes/BootScene.ts');
assert(boot.includes('preloadFixedObjectAssets'), 'BootScene must preload monster/chest assets.');
assert(boot.includes('preloadFixedObjectAssets(this);'), 'BootScene must invoke fixed-object preloading.');

console.info('[Dungeon Logic] Fixed-object visuals sanity: stable skins + solved/reset monster/chest visuals passed');
