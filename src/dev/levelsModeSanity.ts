import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const home = source('src/scenes/HomeScene.ts');
const levelSelect = source('src/scenes/LevelSelectScene.ts');
const game = source('src/scenes/GameScene.ts');
const main = source('src/main.ts');
const thumbnailRenderer = source('src/view/LevelThumbnailRenderer.ts');

assert(!home.includes('ARCHIVE_SCENE_KEY'), 'Home campaign navigation no longer routes through ArchiveScene.');
assert(home.includes('LEVELS_SCENE_KEY'), 'Home campaign navigation routes through LevelSelectScene.');
assert(home.includes('copy.home.levelsProgress(completed, campaign.getLevels().length)'), 'Home progress derives total from the actual Levels catalog.');
assert(!home.includes('getManuscriptForSlot'), 'Home level context no longer mentions manuscripts.');

assert(levelSelect.includes('copy.common.levels'), 'LevelSelectScene title uses localized LEVELS copy.');
assert(levelSelect.includes('copy.common.backHome'), 'Levels scene exposes a fixed back-to-main-menu action.');
assert(levelSelect.includes(".on('pointerdown', () => {"), 'Levels back action activates on the first pointer press.');
assert(levelSelect.includes('this.scene.start(HOME_SCENE_KEY)'), 'Levels back action returns directly to HomeScene.');
assert(!levelSelect.includes(".on('pointerup', (pointer: Phaser.Input.Pointer) => {\n        if (!this.pointerGate.canActivate(pointer.id)) return;\n        this.scene.start(HOME_SCENE_KEY);"), 'Levels back action does not wait for pointer-gate ownership.');
assert(!levelSelect.includes("'Dungeon Logic'"), 'LevelSelectScene no longer uses the product title as the level-browser heading.');
assert(levelSelect.includes('createCampaignLevelPreview(item.entry, profile.campaign)'), 'Level cards derive truthful preview state from persisted Campaign drafts.');
assert(levelSelect.includes('this.drawLevelPreview('), 'LevelSelectScene renders schematic level thumbnails.');
assert(levelSelect.includes('drawLevelThumbnail'), 'LevelSelectScene delegates schematic rendering to the shared thumbnail renderer.');
assert(thumbnailRenderer.includes('mergePreviewWallCells(walls)'), 'Shared level preview renders adjacent walls as continuous merged shapes.');
assert(!thumbnailRenderer.includes('for (let x = 0; x <= level.width; x += 1)'), 'Shared level preview does not draw an interior vertical grid.');
assert(!thumbnailRenderer.includes('for (let y = 0; y <= level.height; y += 1)'), 'Shared level preview does not draw an interior horizontal grid.');
assert(!thumbnailRenderer.includes('cellSize * 0.84'), 'Shared level preview walls do not use per-cell gaps that can disappear at thumbnail scale.');
assert(levelSelect.includes("preview.status === 'unstarted'"), 'Never-started level cards render a question-mark preview instead of revealing the map.');
assert(levelSelect.includes('cardLayout.numberY'), 'Level numbers are positioned below the preview square.');
assert(!levelSelect.includes('copy.levelSelect.state[item.state]'), 'Compact level cards do not render full state text.');

assert(!game.includes('unlockedManuscript'), 'Campaign completion UI no longer renders manuscript unlock messages.');
assert(!game.includes('ARCHIVE_SCENE_KEY'), 'Campaign completion/back routes no longer target the campaign ArchiveScene.');
assert(game.includes('LEVELS_SCENE_KEY'), 'Campaign completion/back routes target the Levels scene.');
assert(!game.includes('startChapterOne'), 'Tutorial completion no longer mentions Chapter I.');

assert(!main.includes("import { ArchiveScene }"), 'ArchiveScene is no longer registered as the campaign browser.');
assert(!main.includes('    ArchiveScene,'), 'Phaser scene list no longer contains ArchiveScene.');

console.info('[Dungeon Logic] Levels mode sanity: flat campaign navigation + naming passed');
