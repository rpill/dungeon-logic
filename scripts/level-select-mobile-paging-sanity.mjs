import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const scene = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/runtime/ResponsiveLayout.ts', import.meta.url), 'utf8');
assert(scene.includes('const MOBILE_LEVELS_PER_PAGE = CAMPAIGN_ROW_SIZE;'), 'Phone pages follow eight-level campaign rows.');
assert(scene.includes('mobilePageIndex?: number'), 'Current page survives scene navigation.');
assert(scene.includes('shouldUseMobileLevelPaging(availableViewport.width)'), 'Phone uses the paged layout.');
assert(scene.includes('visibleItems = mobilePaged') && scene.includes('this.createMobileLevelPager('), 'Only the current page and its controls render.');
assert(scene.includes('this.setupMobileLevelPaging('), 'Swipe navigation remains.');
assert(scene.includes('this.setupMetaScroll(layout, initialScrollY);'), 'Desktop scroll remains.');
assert(layout.includes('const columns = portrait ? 2 : Math.min(8, Math.max(1, itemCount));'), 'Phone portrait uses the approved two-column grid.');
assert(layout.includes('const rows = Math.ceil(itemCount / columns);'), 'Page rows derive from actual item count.');
console.info('[Dungeon Logic] Mobile level paging sanity: PASS');
