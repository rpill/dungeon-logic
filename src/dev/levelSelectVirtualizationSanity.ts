import { existsSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const helperUrl = new URL('../runtime/LevelSelectVirtualization.ts', import.meta.url);
assert(existsSync(helperUrl), 'Level Select virtualization helper must exist.');

const virtualization = await import('../runtime/LevelSelectVirtualization.ts');
const { getLevelCardRowStride, getVirtualizedLevelCardIndices, getLevelCardVirtualWindowKey } = virtualization;

const cards = Array.from({ length: 32 }, (_, index) => {
  const row = Math.floor(index / 4);
  return {
    y: 50 + row * 100,
    height: 60,
  };
});

assert(getLevelCardRowStride(cards) === 100, 'Virtualizer must derive the real row stride from card positions.');

assert(getLevelCardVirtualWindowKey(0, 100) === 0, 'Virtual window key must start at the first row.');
assert(getLevelCardVirtualWindowKey(99, 100) === 0, 'Virtual window key must stay stable while scrolling inside one row.');
assert(getLevelCardVirtualWindowKey(100, 100) === 1, 'Virtual window key must change only when scroll crosses a row stride.');


const initial = getVirtualizedLevelCardIndices(cards, {
  scrollY: 0,
  viewportTop: 0,
  viewportBottom: 300,
  bufferRows: 1,
});
assert(initial.includes(0), 'Initial virtualization window must include the first visible row.');
assert(initial.includes(12), 'Initial virtualization window must include one buffered row below the viewport.');
assert(!initial.includes(20), 'Initial virtualization window must not create far-off rows.');
assert(initial.length < cards.length, 'Virtualization must not create every level card on entry.');

const scrolled = getVirtualizedLevelCardIndices(cards, {
  scrollY: 300,
  viewportTop: 0,
  viewportBottom: 300,
  bufferRows: 1,
});
assert(!scrolled.includes(0), 'Rows far above the scroll window must be released.');
assert(scrolled.includes(20), 'Rows entering the buffered scroll window must be created.');

const pinned = getVirtualizedLevelCardIndices(cards, {
  scrollY: 0,
  viewportTop: 0,
  viewportBottom: 300,
  bufferRows: 1,
  pinnedIndices: [31],
});
assert(pinned.includes(31), 'Pinned row-unlock cards must stay rendered outside the normal window.');

console.info('[Dungeon Logic] Level Select virtualization sanity: buffered rows + pinned transition cards passed');

const { readFileSync } = await import('node:fs');
const sceneSource = readFileSync(new URL('../scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
assert(sceneSource.includes('createLevelCardVirtualizer('), 'Level Select scene must use a lazy card virtualizer.');
assert(sceneSource.includes('bufferRows: 2'), 'Level Select virtualizer must keep two buffered rows around the viewport.');
assert(sceneSource.includes('visual.setVirtualVisible(wanted.has(index))'), 'Off-window cards must be hidden instead of staying rendered.');
assert(sceneSource.includes('onScrollYChanged?.(camera.scrollY)'), 'Card virtualization must stay synchronized with touch/wheel scrolling.');
assert(sceneSource.includes('startPrewarm()'), 'Level Select must start background card prewarming after initial viewport creation.');
assert(sceneSource.includes('requestIdleCallback'), 'Card prewarming must use browser idle time when available.');
assert(sceneSource.includes('if (!prewarmStarted)'), 'Initial visible cards may render synchronously before background prewarming starts.');
assert(sceneSource.includes('enqueuePriority(wanted)'), 'Missing visible cards must be prioritized without synchronous creation in the scroll path.');
assert(sceneSource.includes('visual.setVirtualVisible(currentWanted.has(index))'), 'Background-prewarmed off-window cards must stay hidden.');
assert(!sceneSource.includes('items.forEach((item, index) => {'), 'Level Select must not eagerly create all campaign cards during scene entry.');
