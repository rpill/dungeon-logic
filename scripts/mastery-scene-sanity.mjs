import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scenePath = resolve(root, 'src/scenes/MasteryScene.ts');
const main = readFileSync(resolve(root, 'src/main.ts'), 'utf8');
assert(existsSync(scenePath), 'MasteryScene must exist.');
assert(main.includes('MasteryScene'), 'MasteryScene must be registered in main.ts.');
const scene = existsSync(scenePath) ? readFileSync(scenePath, 'utf8') : '';
assert(scene.includes('createMetaPageHeader'), 'MasteryScene must use the shared MetaPageHeader.');
assert(scene.includes('createMasterySeal'), 'MasteryScene must render the labyrinth seal.');
assert(scene.includes("case 'campaign':") && scene.includes("case 'daily-best-streak':") && scene.includes("case 'endless-best-clean-streak':"), 'MasteryScene must render all three requirement types.');
assert(scene.includes('MASTERY_RANK_IDS'), 'MasteryScene must render the full rank path.');
assert(scene.includes('const sealX = left + width * 0.19;') && scene.includes('const textX = left + width * 0.37;'), 'Narrow Mastery hero must keep the seal left and rank copy right, matching the approved concept.');
assert(scene.includes('? copy.mastery.maxRank'), 'Maximum Mastery rank must show MAXIMUM RANK instead of TO THE NEXT RANK.');
assert(scene.includes("fontSize: narrow ? (rank === 'MASTER' ? '6px' : '7px')"), 'Narrow rank track must keep the rank titles visible under the seals.');
assert(scene.includes('masteryOpen'), 'MasteryScene must emit mastery_open analytics once.');
assert(!/\bXP\b|experience points|очки опыта/i.test(scene), 'MasteryScene must not contain XP language.');
assert(!/statistics|статистик/i.test(scene), 'MasteryScene must not become a statistics dashboard.');
console.info('[Dungeon Logic] Mastery scene sanity: PASS');
