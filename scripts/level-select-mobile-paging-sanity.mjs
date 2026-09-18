import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/runtime/ResponsiveLayout.ts', import.meta.url), 'utf8');

assert(scene.includes('const MOBILE_LEVELS_PER_PAGE = CAMPAIGN_ROW_SIZE;'), 'Mobile Levels must page by campaign rows of 8.');
assert(scene.includes('mobilePageIndex?: number'), 'LevelSelectScene data must accept a mobile page index.');
assert(scene.includes('const mobilePaged = shouldUseMobileLevelPaging(availableViewport.width);'), 'Level Select must route mobile/touch viewports to paging.');
assert(scene.includes("window.matchMedia('(pointer: coarse)').matches"), 'Landscape phones must be detected by coarse pointer, not only width.');
assert(scene.includes('navigator.maxTouchPoints > 0'), 'Touch-capable mobile landscape must use the paged Levels UI.');
assert(scene.includes('visibleItems = mobilePaged'), 'Mobile Levels must render only the current page.');
assert(scene.includes('this.createMobileLevelPager('), 'Mobile Levels must render pager controls.');
assert(scene.includes('this.setupMobileLevelPaging('), 'Mobile Levels must support horizontal swipe paging.');
assert(scene.includes('if (mobilePaged)'), 'Mobile Levels must branch away from vertical scroll.');
assert(scene.includes('this.setupMetaScroll(layout, initialScrollY);'), 'Desktop Levels must retain the existing scroll implementation.');
assert(layout.includes('calculateMobilePagedLevelSelectLayout'), 'Responsive layout must expose a dedicated mobile paged layout.');
assert(layout.includes('const columns = portrait ? 4 : Math.min(8, Math.max(1, itemCount));'), 'Portrait mobile pages must use a 4-column grid.');
assert(layout.includes('const rows = Math.ceil(itemCount / columns);'), 'Mobile page layout must fit only the visible page rows.');

console.info('[Dungeon Logic] Mobile level paging sanity: PASS');
