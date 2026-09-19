import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const copy = readFileSync(resolve(root, 'src/i18n/UiCopy.ts'), 'utf8');
const scene = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');

assert(copy.includes("daily: 'Daily: лучшая серия'"), 'RU narrow Daily Mastery label must describe the lifetime best streak.');
assert(copy.includes("endless: 'Испытание: лучшая серия'"), 'RU narrow Challenge Mastery label must describe the lifetime best streak.');
assert(copy.includes('Daily: лучшая серия — ${target} ${day}'), 'RU wide Daily Mastery label must describe the best streak target in days.');
assert(copy.includes('Испытание: лучшая серия — ${target}'), 'RU wide Challenge Mastery label must describe the best streak target.');
assert(copy.includes("daily: 'Daily: best streak'"), 'EN narrow Daily Mastery label must describe the lifetime best streak.');
assert(copy.includes("endless: 'Challenge: best streak'"), 'EN narrow Challenge Mastery label must describe the lifetime best streak.');
assert(copy.includes('Daily: best streak — ${target} ${target === 1 ? \'day\' : \'days\'}'), 'EN wide Daily Mastery label must describe the best streak target in days.');
assert(copy.includes('Challenge: best streak — ${target}'), 'EN wide Challenge Mastery label must describe the best streak target.');
assert(scene.includes('copy.mastery.dailyRequirement(condition.target)'), 'MasteryScene must use localized Daily best-streak requirement copy.');
assert(scene.includes('copy.mastery.endlessRequirement(condition.target)'), 'MasteryScene must use localized Challenge best-streak requirement copy.');
assert(!scene.includes('достигните серии') && !scene.includes('Испытание: чистая серия'), 'MasteryScene must not imply streak requirements reset after rank-up.');

console.info('[Dungeon Logic] Mastery lifetime-best requirement copy sanity: PASS');
