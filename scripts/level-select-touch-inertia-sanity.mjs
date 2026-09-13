import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const scroll = readFileSync(new URL('../src/runtime/MetaScroll.ts', import.meta.url), 'utf8');

assert(scroll.includes('META_SCROLL_INERTIA_FRICTION'), 'Shared meta scroll must define touch inertia friction.');
assert(scroll.includes('getMetaScrollVelocity'), 'Shared meta scroll must derive swipe velocity from touch samples.');
assert(scroll.includes('stepMetaScrollInertia'), 'Shared meta scroll must expose frame-rate-independent inertia stepping.');
assert(scene.includes('scrollVelocityY'), 'Level Select must retain touch scroll velocity after pointer release.');
assert(scene.includes('lastScrollSampleY'), 'Level Select must sample touch movement for kinetic velocity.');
assert(scene.includes('lastScrollSampleAtMs'), 'Level Select must time touch samples for kinetic velocity.');
assert(scene.includes('stepMetaScrollInertia('), 'Level Select update must apply kinetic scrolling after pointer release.');
assert(scene.includes('this.scrollVelocityY = 0'), 'New touch/drag interactions must be able to cancel inertia immediately.');

console.info('[Dungeon Logic] Level Select touch inertia sanity: direct drag + kinetic release passed');
