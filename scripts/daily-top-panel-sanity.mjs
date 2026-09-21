import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scene = readFileSync(resolve(root, 'src/scenes/DailyScene.ts'), 'utf8');
const layout = readFileSync(resolve(root, 'src/runtime/DailyHubLayout.ts'), 'utf8');
assert(scene.includes("createHomeHubModeCard(this, {"), 'Daily top plaque must use a real card asset.');
assert(!scene.includes('copy.dailyHub.todayTitle'), 'Daily screen must not render the TODAY heading above the plaque.');
assert(!scene.includes('copy.dailyHub.archiveTitle'), 'Daily screen must not render the CALENDAR heading above the grid.');
assert(scene.includes("const leftTextInset = density === 'ultra' ? 0 : narrow ? 0 : density === 'tight' ? 10 : 14;"), 'Daily top plaque must offset text away from the left bolt/border.');
assert(layout.includes('todayCardTop: 132,') && layout.includes('todayHeight: 126,'), 'Desktop daily plaque must be larger and higher.');
assert(layout.includes('monthHeaderY: 296,') && layout.includes('gridTopY: 346,'), 'Calendar block must move upward after removing the extra heading.');
console.info('[Dungeon Logic] Daily top panel sanity: PASS');
