import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const expectedAssets = [
  'public/assets/floor/tile_floor_01.png',
  'public/assets/floor/tile_floor_02.png',
  'public/assets/floor/tile_floor_03.png',
  'public/assets/floor/tile_floor_04.png',
  'public/assets/wall/tile_wall_01.png',
  'public/assets/wall/tile_wall_02.png',
  'public/assets/wall/tile_wall_03.png',
  'public/assets/wall/tile_wall_04.png',
  'public/assets/mark.png',
];
for (const rel of expectedAssets) {
  assert(fs.existsSync(path.join(root, rel)), `Missing board asset: ${rel}`);
}

const boot = read('src/scenes/BootScene.ts');
assert(boot.includes("preloadBoardThemeAssets"), 'BootScene must import the board asset preloader.');
assert(boot.includes('preloadBoardThemeAssets(this);'), 'BootScene must preload board assets.');

const assets = read('src/view/BoardThemeAssets.ts');
for (let i = 1; i <= 4; i += 1) {
  const suffix = String(i).padStart(2, '0');
  assert(assets.includes(`assets/floor/tile_floor_${suffix}.png`), `Floor ${suffix} must be preloaded.`);
  assert(assets.includes(`assets/wall/tile_wall_${suffix}.png`), `Wall ${suffix} must be preloaded.`);
}
assert(assets.includes("'assets/mark.png'"), 'Floor mark asset must be preloaded.');
assert(assets.includes('resolveFloorTextureKey'), 'Floor variants must have a coordinate-stable resolver.');
assert(assets.includes('resolveWallTextureKey'), 'Wall variants must have a coordinate-stable resolver.');

const board = read('src/board/BoardView.ts');
assert(board.includes('resolveFloorTextureKey'), 'BoardView must choose a floor texture per cell.');
assert(board.includes('resolveWallTextureKey'), 'BoardView must choose a wall texture per cell.');
assert(board.includes('new BoardFrameView'), 'Clue backing and border are provided by the modular frame.');
assert(board.includes('this.createClues()'), 'Clue numbers must remain independent runtime text.');
assert(board.includes('CLUE_FONT_RATIO = 0.5'), 'Clue labels must use the larger 0.5 cell-size font ratio.');
assert(board.includes('CLUE_GAP_RATIO = BOARD_FRAME.clueCenter'), 'Clue labels must align with the frame plaques.');

const cell = read('src/board/CellView.ts');
assert(cell.includes('Phaser.GameObjects.Image'), 'CellView must render board tiles as images.');
assert(cell.includes('BOARD_FLOOR_MARK_KEY'), 'CellView must use the floor-mark image asset.');
assert(cell.includes('.setInteractive({ useHandCursor: true })'), 'Floor image remains the pointer target.');
assert(!cell.includes(".setText('◆')"), 'Normal floor state must no longer render the text diamond.');

console.info('[Dungeon Logic] Game board assets sanity: floor/wall/mark wiring + framed runtime clues passed');
