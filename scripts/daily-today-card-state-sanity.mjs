import { readFileSync } from 'node:fs';
import { calculateDailyHubLayout } from '../src/runtime/DailyHubLayout.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sceneSource = readFileSync(new URL('../src/scenes/DailyScene.ts', import.meta.url), 'utf8');
const copySource = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

const narrowMedium = calculateDailyHubLayout(360, 640, 6);
const narrowTight = calculateDailyHubLayout(320, 568, 6);

assert(narrowMedium.todayHeight >= 120, '360x640 Daily Today card must reserve enough height for status, rule text, and actions.');
assert(narrowTight.todayHeight >= 108, '320x568 Daily Today card must reserve enough height instead of compressing copy into the actions.');
assert(copySource.includes('todayAttemptRules'), 'Daily copy must explain the live attempt timing rule.');
assert(copySource.includes('todayReplayRules'), 'Daily copy must explain that a solved result is already fixed.');
assert(copySource.includes('replayToday'), 'Daily copy must provide an explicit replay label after a solved Daily.');
assert(sceneSource.includes('solved ? copy.dailyHub.replayToday : copy.dailyHub.playToday'), 'Solved Daily must relabel the play action as replay.');
assert(sceneSource.includes('accentFrame: solved'), 'Solved Daily must make the leaderboard the primary accented action.');
assert(sceneSource.includes('drawDailyUnavailableMarker'), 'Unavailable calendar dates must have an explicit non-interactive marker instead of looking accidentally blank.');

console.info('[Dungeon Logic] Daily Today card state sanity: responsive content, solved action hierarchy, and explicit empty-day state passed');
