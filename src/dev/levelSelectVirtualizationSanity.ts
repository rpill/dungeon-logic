import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sceneSource = readFileSync(new URL('../scenes/LevelSelectScene.ts', import.meta.url), 'utf8');

assert(!sceneSource.includes('LevelSelectVirtualization'), 'Level Select must not import virtualization helpers.');
assert(!sceneSource.includes('createLevelCardVirtualizer'), 'Level Select must not use lazy card virtualization.');
assert(!sceneSource.includes('requestIdleCallback'), 'Level Select must not prewarm cards in browser idle callbacks.');
assert(!sceneSource.includes('startPrewarm'), 'Level Select must not start a background card-prewarm queue.');
assert(
  sceneSource.includes('items.forEach((item, index) => {'),
  'Level Select must eagerly construct the full campaign card grid.',
);
assert(
  sceneSource.includes('this.setupMetaScroll(layout, initialScrollY);'),
  'Scrolling must operate on the already-rendered card grid without card-loading callbacks.',
);
assert(sceneSource.includes('drawLevelThumbnail('), 'Existing level preview rendering must remain intact.');

console.info('[Dungeon Logic] Level Select eager rendering sanity: no lazy loading, previews intact');
