import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dailySource = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const levelsSource = readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
const rendererSource = readFileSync('src/view/LevelThumbnailRenderer.ts', 'utf8');

assert(dailySource.includes('createDailyLevelPreview'), 'Daily calendar cells derive truthful preview state from Daily drafts/results.');
assert(dailySource.includes('drawLevelThumbnail'), 'Daily calendar uses the shared level-thumbnail renderer.');
assert(levelsSource.includes('drawLevelThumbnail'), 'Campaign level cards use the same shared thumbnail renderer.');
assert(rendererSource.includes('mergePreviewWallCells'), 'Shared thumbnail renderer merges adjacent wall cells into solid shapes.');
assert(!rendererSource.includes('fillCircle('), 'Shared thumbnail renderer must not rely on subpixel circles for monster markers.');
assert(rendererSource.includes('Math.min(cellWidth, cellHeight)'), 'Shared thumbnail renderer sizes markers from the smaller cell dimension for square stability.');
assert(!rendererSource.includes('for (let x = 0; x <= level.width'), 'Shared thumbnail renderer must not draw an internal cell grid.');
assert(dailySource.includes('numberY'), 'Daily calendar places the day number below the thumbnail rather than over the map.');

console.info('[Dungeon Logic] Daily preview UI sanity: shared gridless thumbnails + day labels passed');
