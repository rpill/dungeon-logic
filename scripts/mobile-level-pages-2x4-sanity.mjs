import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const layout = readFileSync(new URL('../src/runtime/ResponsiveLayout.ts', import.meta.url), 'utf8');
const levels = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');

assert(layout.includes('const columns = portrait ? 2 : Math.min(8, Math.max(1, itemCount));'), 'Portrait mobile Levels must use two columns for a 2x4 page.');
assert(layout.includes('const portraitRows = 4;'), 'Portrait mobile Levels must reserve four rows for a full 8-level page.');
assert(levels.includes('resolveMobileLevelPageIndex'), 'Mobile Levels must resolve the current/unlocked page automatically.');
assert(levels.includes('rowUnlock.nextRowStartSlot'), 'Row unlock must route mobile Levels to the newly opened 8-level page.');
assert(levels.includes('playMobileRowUnlockTransition'), 'Mobile Levels must animate the newly opened page after completing a campaign row.');
assert(levels.includes('this.playMobileRowUnlockTransition('), 'Mobile paging path must actually invoke the unlock animation.');
assert(!levels.includes("const deferCurrentHighlight = !mobilePaged\n        && rowUnlock !== null"), 'Mobile row unlock must defer the gold current highlight until the unlock wave completes.');

console.info('[Dungeon Logic] Mobile 2x4 Levels page sanity: PASS');
