import fs from 'node:fs';

const home = fs.readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const mastery = fs.readFileSync(new URL('../src/runtime/MasteryStrip.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  home.includes("options.icon === 'levels' ? 66 : 58"),
  'Mobile Levels and Daily icons must use calibrated per-asset sizes instead of one 42px box.',
);
assert(
  home.includes("largeIllustratedIcon ? (narrow ? 0.23 : 0.18)"),
  'Larger mobile tall-card icons must sit higher to preserve label spacing.',
);
assert(
  home.includes('const iconSize = narrow ? 68 : 64;'),
  'Mobile Endless icon must compensate for transparent padding in the source asset.',
);
assert(
  mastery.includes("Math.min(cardHeight * (narrow ? 0.98 : 0.84), narrow ? 72 : 86)"),
  'Mobile Mastery seal must scale closer to the strip height.',
);

console.log('[Dungeon Logic] Home mobile icon size sanity: PASS');
