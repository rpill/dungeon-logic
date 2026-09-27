import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const scene = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/runtime/ResponsiveLayout.ts', import.meta.url), 'utf8');
const preview = readFileSync(new URL('../src/runtime/CampaignLevelPreview.ts', import.meta.url), 'utf8');
assert(scene.includes('copy.home.continue'), 'Levels retains the localized Continue action.');
assert(scene.includes('createSlateSurface('), 'Level tiles use the milestone slate surface.');
assert(scene.includes('createCampaignLevelPreview(') && scene.includes('drawLevelThumbnail('), 'Preview content remains runtime rendering.');
assert(preview.includes('CellState.Wall') && !preview.includes('walls.push({ x, y });\n      if (draft.cells[y]?.[x] === CellState.Floor)'), 'Draft preview uses walls and does not add FLOOR.');
assert(scene.includes('drawLevelSectionDividers(') && scene.includes('createScrollIndicator('), 'Desktop rows and scrolling remain.');
assert(scene.includes('this.createMobileLevelPager(') && scene.includes('this.setupMobileLevelPaging('), 'Phone paging remains.');
assert(scene.includes('this.playRowUnlockTransition(') && scene.includes('this.playMobileRowUnlockTransition('), 'Row unlock presentation remains.');
assert(scene.includes('SCROLLBAR_THUMB_FILL') && scene.includes('gridRight + 24'), 'Scrollbar stays within the real grid layout.');
assert(layout.includes('maxCardSize') && layout.includes('calculateMobilePagedLevelSelectLayout'), 'Desktop and phone use responsive tile sizing.');
console.info('[Dungeon Logic] Level Select visual and behavior sanity: PASS');
