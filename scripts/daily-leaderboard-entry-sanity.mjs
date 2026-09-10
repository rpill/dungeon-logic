import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const daily = readFileSync(resolve(process.cwd(), 'src/scenes/DailyScene.ts'), 'utf8');
const copy = readFileSync(resolve(process.cwd(), 'src/i18n/UiCopy.ts'), 'utf8');

const todayActionCalls = daily.match(/this\.createTodayActionButton\(/g) ?? [];
assert(todayActionCalls.length >= 2, 'Today card must render separate Play Today and Leaderboard actions.');
assert(!daily.includes('copy.dailyHub.archiveProgress('), 'Daily calendar must not show the ambiguous solved archive fraction.');
assert(!daily.includes("solved ? copy.dailyHub.leaderboard : copy.dailyHub.playToday"), 'Leaderboard must not replace Play Today after solving.');
assert(daily.includes("copy.dailyHub.playToday"), 'Today card must keep an explicit Play Today action.');
assert(daily.includes("copy.dailyHub.leaderboard"), 'Today card must expose an explicit Leaderboard action.');
assert(copy.includes("todayUnsolved: 'Первое прохождение без подсказок попадёт в таблицу лидеров.'"), 'Russian Today copy must name the leaderboard explicitly.');
assert(copy.includes("dailyHintOutsideRating: 'Подсказка поможет пройти Daily, но результат не попадёт в таблицу лидеров.'"), 'Russian hint copy must use leaderboard terminology.');

console.info('[Dungeon Logic] Daily leaderboard entry sanity: permanent leaderboard action + unambiguous copy passed');
