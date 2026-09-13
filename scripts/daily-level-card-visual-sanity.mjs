import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const layout = readFileSync('src/runtime/DailyHubLayout.ts', 'utf8');

assert(scene.includes("import { UI_ICON_KEYS } from '../runtime/UiIcons';"), 'Daily calendar must reuse shared UI icons.');
assert(scene.includes('UI_ICON_KEYS.check'), 'Solved Daily cards must use the shared check icon.');
assert(scene.includes('UI_ICON_KEYS.lock'), 'Future Daily cards must use the shared lock icon.');
assert(scene.includes('UI_ICON_KEYS.question'), 'Unstarted available Daily cards must use the shared question icon.');
assert(scene.includes('drawRoundedDailyCard('), 'Daily calendar cells must render as rounded cards.');
assert(scene.includes('drawDailyCurrentGlow('), 'Today card must use a dedicated soft gold glow.');
assert(scene.includes('CURRENT_GLOW_TEXTURE_SCALE'), 'Today glow must be rasterized above display resolution.');
assert(scene.includes('shadowBlur'), 'Today glow must use a true canvas blur.');
assert(scene.includes('drawDailyCompletedCheck('), 'Solved Daily cards must use the same corner check treatment as campaign levels.');
assert(scene.includes('drawDailyStateMarker('), 'Today must use the same small gold diamond marker language as campaign levels.');
assert(scene.includes('const hoverOverlay = this.drawRoundedDailyOverlay('), 'Daily hover feedback must use the same rounded overlay language.');
assert(scene.includes("if (day.state === 'future')"), 'Future entries must have an explicit locked-card branch.');
assert(scene.includes("if (day.state === 'unavailable')"), 'Unavailable calendar days must have an explicit empty-cell branch.');
assert(!scene.includes("this.add.text(x, cellY, '?',"), 'Daily cards must not use text question marks anymore.');
assert(layout.includes('columnGap: 10'), 'Regular Daily calendar needs wider horizontal spacing.');
assert(layout.includes('rowGap: 8'), 'Regular Daily calendar needs wider vertical spacing.');
assert(layout.includes('columnGap: 9'), 'Medium Daily calendar needs wider horizontal spacing.');
assert(layout.includes('rowGap: 6'), 'Medium Daily calendar needs wider vertical spacing.');

console.info('[Dungeon Logic] Daily card visual sanity: campaign-style states + spacing passed');
