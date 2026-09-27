import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const strip = readFileSync(new URL('../src/runtime/MasteryStrip.ts', import.meta.url), 'utf8');
assert(home.includes("from '../ui/UiTheme'") && home.includes("from '../ui/UiDensity'"), 'Home keeps shared text and density tokens.');
assert(home.includes('createPrimaryActionButton'), 'Continue keeps the shared gold action button.');
assert(home.includes('createSlateSurface'), 'Home navigation uses the milestone slate surface.');
assert(home.includes('createMasteryStrip'), 'Home retains its live mastery entry.');
assert(strip.includes('createSlateSurface') && strip.includes('createMasterySeal'), 'Mastery strip uses slate and the rank seal.');
assert(!home.includes('createHomeHubModeCard'), 'Legacy Home card skins are no longer rendered.');
console.info('[Dungeon Logic] Home UI migration sanity: PASS');
