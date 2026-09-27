import { readFileSync } from 'node:fs';
import { calculateDailyHubLayout } from '../src/runtime/DailyHubLayout.ts';

const scene = readFileSync(new URL('../src/scenes/DailyScene.ts', import.meta.url), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }

assert(scene.includes('createSlateSurface(this, centerX, todayCardCenterY, width, todayHeight)'), 'Daily status uses the shared scalable slate surface.');
assert(!scene.includes('createHomeHubModeCard'), 'Daily must not reuse the old glossy Home card.');
assert(scene.includes('createTodayActionButton({') && scene.includes('accentFrame: solved'), 'Play and Leaderboard remain separate actions with solved hierarchy.');
assert(scene.includes('createQuietInset(this'), 'Loading uses placeholders in the same page composition.');
for (const [w, h] of [[1920, 1080], [1366, 768], [390, 844], [412, 915]]) {
  const layout = calculateDailyHubLayout(w, h, 6);
  assert(layout.todayCardTop > layout.headerHeight, `${w}x${h}: summary stays below header.`);
  assert(layout.gridTopY > layout.monthHeaderY, `${w}x${h}: calendar follows month controls.`);
  assert(layout.contentBottom <= h, `${w}x${h}: six-row calendar fits the viewport.`);
}
console.info('[Dungeon Logic] Daily top panel sanity: matte summary, separate actions, stable loading, responsive calendar passed');
