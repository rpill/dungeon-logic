import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const strip = readFileSync(new URL('../src/runtime/MasteryStrip.ts', import.meta.url), 'utf8');
assert(home.includes('getMasterySnapshot(profile)'), 'Home derives Mastery from the current profile.');
assert(home.includes('createMasteryStrip(this,') && home.includes('MASTERY_SCENE_KEY'), 'Home keeps Mastery navigation.');
assert(strip.includes('createSlateSurface') && strip.includes('createMasterySeal'), 'Rank card uses the slate surface and actual emblem.');
assert(strip.includes('options.snapshot.conditions.reduce('), 'Progress bar derives from current requirement data.');
assert(strip.includes('options.snapshot.nextRank === null'), 'MASTER has a distinct terminal state.');
assert(strip.includes("background.on('pointerup'"), 'Rank card remains interactive.');
console.info('[Dungeon Logic] Home mastery strip sanity: PASS');
