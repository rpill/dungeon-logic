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
assert(scene.includes('const sealX = left + width * 0.22;') && scene.includes('const textX = left + width * 0.43;'), 'Narrow Mastery hero must keep the enlarged seal left and rank copy right.');
assert(scene.includes('? copy.mastery.maxRank'), 'Maximum Mastery rank must show MAXIMUM RANK instead of TO THE NEXT RANK.');
assert(!scene.includes("textureVariant: 'small'"), 'Rank track must not reveal mastery emblem artwork.');
assert(scene.includes('UI_ICON_KEYS.lock'), 'Future mastery ranks must use lock icons.');
assert(scene.includes('const isPast = index < currentIndex;'), 'Rank track must distinguish completed ranks from the current rank.');
assert(scene.includes('const isFuture = index > currentIndex;'), 'Rank track must distinguish future locked ranks.');
assert(scene.includes("const isMaster = rank === 'MASTER';"), 'Rank track must handle MASTER node size separately.');
assert(scene.includes('const futureRadius = isMaster ? nodeRadius + (narrow ? 4 : 5) : nodeRadius + (narrow ? 2 : 3);'), 'MASTER future lock node must be larger.');
assert(scene.includes('const pastRadius = isMaster ? nodeRadius + (narrow ? 4 : 5) : nodeRadius;'), 'Completed MASTER node must stay larger after unlock.');
assert(scene.includes('masteryOpen'), 'MasteryScene must emit mastery_open analytics once.');
assert(!/\bXP\b|experience points|очки опыта/i.test(scene), 'MasteryScene must not contain XP language.');
assert(!/statistics|статистик/i.test(scene), 'MasteryScene must not become a statistics dashboard.');
console.info('[Dungeon Logic] Mastery scene sanity: PASS');

assert(scene.includes('currentRadius - (narrow ? 1.15 : 1.45)'), 'Current rank node inner dark circle must sit tightly inside the gold ring without a gap.');

assert(!scene.includes('glow.fillCircle(x, lineY, currentRadius * 1.65);'), 'Current rank node must not render a translucent outer glow bubble.');
