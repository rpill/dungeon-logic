import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync('src/scenes/StatsScene.ts', 'utf8');
const layout = readFileSync('src/runtime/StatsLayout.ts', 'utf8');

assert(scene.includes("import { DAILY_SCENE_KEY } from './DailyScene';"), 'Statistics must route the Daily card through the Daily scene key.');
assert(scene.includes("action: () => this.scene.start(DAILY_SCENE_KEY)"), 'Daily summary card must expose a click action.');
assert(scene.includes("hoverOverlay"), 'Clickable Daily card must use a hover overlay.');
assert(scene.includes("setInteractive({ useHandCursor: true })"), 'Clickable Daily card must expose pointer affordance.');
assert(layout.includes("viewportClass === 'narrow' ? 358 : 430"), 'Desktop summary cards must be much narrower than the old banner layout.');
assert(layout.includes("? (compactVertical ? 14 : 18)"), 'Narrow Statistics cards must have explicit breathing room between them.');
assert(layout.includes(": (compactVertical ? 20 : 26);"), 'Desktop Statistics cards must have explicit breathing room between them.');
assert(layout.includes("? (compactVertical ? 138 : 146)"), 'Narrow cards must keep comfortable vertical padding.');
assert(layout.includes(": (compactVertical ? 150 : 170);"), 'Desktop cards must be taller to restore internal top/bottom breathing room.');

console.info('[Dungeon Logic] Stats Daily-card interaction + compact geometry sanity: PASS');
