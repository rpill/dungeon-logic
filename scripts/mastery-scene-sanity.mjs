import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scenePath = resolve(root, 'src/scenes/MasteryScene.ts');
const main = readFileSync(resolve(root, 'src/main.ts'), 'utf8');
assert(existsSync(scenePath), 'MasteryScene must exist.');
assert(existsSync(resolve(root, 'public/assets/ui/mastery_requirements_panel.webp')), 'Generated mastery requirements panel asset must exist.');
assert(existsSync(resolve(root, 'public/assets/ui/mastery_requirement_row_panel.webp')), 'Generated mastery requirement row panel asset must exist.');
assert(main.includes('MasteryScene'), 'MasteryScene must be registered in main.ts.');
const scene = existsSync(scenePath) ? readFileSync(scenePath, 'utf8') : '';
assert(scene.includes('createMetaPageHeader'), 'MasteryScene must use the shared MetaPageHeader.');
assert(scene.includes('createMasterySeal'), 'MasteryScene must render the labyrinth seal.');
assert(scene.includes('createMasteryRequirementPanel'), 'MasteryScene must use the dedicated generated requirements panel asset.');
assert(scene.includes('createMasteryRequirementRowPanel'), 'MasteryScene must use the generated overlapping requirement row panel asset.');
assert(scene.includes('const rowGap = rowHeight - (narrow ? 20 : 24);'), 'Requirement rows must overlap slightly into the row above.');
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

assert(scene.includes('const rowHeight = narrow ? 86 : 102;'), 'Requirement rows must be roughly 1.5x taller again.');

assert(scene.includes('const valueX = barRight;'), 'Requirement counter must align with the right edge of the progress bar.');

assert(scene.includes('marker.strokeCircle(statusX, statusY, narrow ? 15 : 18);'), 'Requirement status circle must be larger.');

assert(scene.includes('this.add.image(iconX, y, iconKey)'), 'Requirement icon must be vertically centered in the row.');

assert(scene.includes('const iconSize = narrow ? 28 : 36;'), 'Requirement icon must remain about 1.5x larger.');

assert(scene.includes('topY + height * (narrow ? 0.155 : 0.145)'), 'Requirements panel title must sit lower inside the main panel.');

assert(scene.includes('const rowTop = topY + height * (narrow ? 0.405 : 0.385);'), 'Requirement rows must start lower inside the main panel.');

assert(scene.includes('width * 0.84'), 'Requirement row panels must be narrower.');

assert(scene.includes("fontSize: narrow ? '14px' : '22px'"), 'Requirement row text must be slightly smaller.');

assert(scene.includes('const statusX = right - (narrow ? 32 : 42);'), 'Requirement status circle must be pulled left from the edge.');

assert(scene.includes('const barY = y + rowHeight * (narrow ? 0.07 : 0.08);'), 'Requirement progress bar must sit closer to the text.');


assert(scene.includes('strokeRoundedRect(left, trackTop, width, height, radius);'), 'Mastery progress track must keep a subtle outline.');


assert(scene.includes('this.textures.createCanvas'), 'Mastery progress fill must use a canvas texture instead of Phaser Graphics gradient masking.');
assert(scene.includes('ctx.createLinearGradient(0, 0, textureWidth, 0)'), 'Mastery progress gradient must span the full track width.');
assert(scene.includes("gradient.addColorStop(0, '#f0c75e')"), 'Mastery progress gradient must start yellow.');
assert(scene.includes("gradient.addColorStop(1, '#69df8c')"), 'Mastery progress gradient must end green only at the full track end.');
assert(scene.includes('const visibleWidth = Math.max(textureHeight, textureWidth * ratio);'), 'Mastery progress paint width must follow the real completion ratio.');
assert(!scene.includes('createGeometryMask'), 'Mastery progress must not use the broken geometry-mask gradient path.');
assert(!scene.includes('fillGradientStyle('), 'Mastery progress must not use Graphics fillGradientStyle because it produced full-width striping artifacts.');
