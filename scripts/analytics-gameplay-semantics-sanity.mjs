import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync('src/scenes/GameScene.ts', 'utf8');
assert(source.includes('const telemetryTimer = new ActiveTimer(0)'), 'GameScene owns a hidden active telemetry timer independent of the visible run timer.');
assert(source.includes('const getAnalyticsElapsedMs ='), 'GameScene exposes analytics elapsed time independently from displayed time.');
assert(source.includes('puzzleAnalytics?.reset(getAnalyticsElapsedMs(), editsBeforeReset)'), 'Untimed resets report active telemetry time instead of a fake zero.');
assert(source.includes('elapsedMs: getAnalyticsElapsedMs()'), 'Puzzle completion analytics use active telemetry time.');
assert(source.includes('firstClear: result.ranked'), 'Endless Free Play is not reported as a first clear.');
assert(!source.includes('firstClear: true,'), 'No Endless completion path hardcodes first_clear=true.');

console.info('[Dungeon Logic] Analytics gameplay semantics source sanity passed');
