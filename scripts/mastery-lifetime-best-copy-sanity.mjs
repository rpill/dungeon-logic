import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const copy = readFileSync(resolve(root, 'src/i18n/UiCopy.ts'), 'utf8');
const scene = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');

assert(copy.includes("daily: 'Daily: решено'"), 'RU Daily Mastery label must describe completed puzzles.');
assert(copy.includes("endless: 'Испытание: решено'"), 'RU Challenge Mastery label must describe completed puzzles.');
assert(copy.includes('Daily: решите ${target}'), 'RU Daily requirement must use total solves.');
assert(copy.includes('Испытание: решите ${target}'), 'RU Challenge requirement must use total solves.');
assert(copy.includes("daily: 'Daily: solved'"), 'EN Daily Mastery label must describe completed puzzles.');
assert(copy.includes("endless: 'Challenge: solved'"), 'EN Challenge Mastery label must describe completed puzzles.');
assert(scene.includes('copy.mastery.daily') && scene.includes('copy.mastery.endless'), 'MasteryScene must use localized category labels.');
assert(scene.includes('`${condition.current} / ${condition.target}`'), 'MasteryScene must show live progress values separately from labels.');

console.info('[Dungeon Logic] Mastery lifetime-best requirement copy sanity: PASS');
