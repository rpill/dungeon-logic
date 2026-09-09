import {
  DAILY_LEADERBOARD_NAME,
  decodeDailyLeaderboardScore,
  encodeDailyLeaderboardScore,
  getDailyLeaderboardName,
} from '../daily/DailyLeaderboard';
import { createLocalPlatformServices } from '../platform/local';
import { createYandexPlatformServices } from '../platform/yandex';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(DAILY_LEADERBOARD_NAME === 'daily', 'Daily must use exactly one permanent technical leaderboard.');
assert(getDailyLeaderboardName('daily-001') === 'daily', 'First Daily must map to the permanent leaderboard.');
assert(getDailyLeaderboardName('daily-060') === 'daily', 'Last v1 Daily must map to the same permanent leaderboard.');
assert(getDailyLeaderboardName('daily-1000') === 'daily', 'Future four-digit Daily ids must keep using the same permanent leaderboard.');
const fastToday = encodeDailyLeaderboardScore('2026-09-09', 60_000);
const slowToday = encodeDailyLeaderboardScore('2026-09-09', 120_000);
const fastYesterday = encodeDailyLeaderboardScore('2026-09-08', 30_000);
assert(fastToday > slowToday, 'Faster times on the same Daily date must rank higher.');
assert(slowToday > fastYesterday, 'Every current-day score must rank above every older-day score.');
const decodedToday = decodeDailyLeaderboardScore(slowToday);
assert(decodedToday?.dateKey === '2026-09-09' && decodedToday.timeMs === 120_000, 'Encoded Daily score must decode back to its date and completion time.');
assert(decodeDailyLeaderboardScore(-1) === null, 'Negative leaderboard scores must be rejected by the decoder.');
let invalidNameRejected = false;
try {
  getDailyLeaderboardName('campaign-001');
} catch {
  invalidNameRejected = true;
}
assert(invalidNameRejected, 'Non-Daily ids must not silently map to a leaderboard.');

async function runLocalChecks(): Promise<void> {
  const local = createLocalPlatformServices(null);
  assert(await local.leaderboards.isAuthorized() === false, 'Local platform cannot fabricate Yandex authorization.');
  assert(await local.leaderboards.requestAuthorization() === false, 'Local platform cannot open Yandex authorization.');
  assert(await local.leaderboards.submitScore('daily', 42_000) === 'unavailable', 'Local leaderboard submission is unavailable.');
  assert(await local.leaderboards.getPlayerEntry('daily') === null, 'Local player ranking is unavailable.');
  assert(await local.leaderboards.getEntries('daily') === null, 'Local leaderboard entries are unavailable.');
}

async function runYandexChecks(): Promise<void> {
  let authorized = false;
  let authCalls = 0;
  let submitted: { name: string; score: number; extraData?: string } | null = null;
  const availableMethods: string[] = [];
  const player = {
    async getData() { return {}; },
    async setData() {},
    isAuthorized() { return authorized; },
  };
  const entry = (rank: number, score: number, id: string, name: string) => ({
    rank,
    score,
    player: {
      publicName: name,
      uniqueID: id,
      getAvatarSrc() { return `https://example.test/${id}.png`; },
    },
  });
  const sdk = {
    async getPlayer() { return player; },
    async isAvailableMethod(method: string) {
      availableMethods.push(method);
      return true;
    },
    auth: {
      async openAuthDialog() {
        authCalls += 1;
        authorized = true;
      },
    },
    leaderboards: {
      async setScore(name: string, score: number, extraData?: string) {
        submitted = { name, score, extraData };
      },
      async getPlayerEntry() {
        return entry(4, 42_000, 'me', 'Current');
      },
      async getEntries() {
        return {
          entries: [
            entry(0, 31_000, 'a', 'Alpha'),
            entry(1, 35_000, 'b', 'Beta'),
            entry(4, 42_000, 'me', 'Current'),
          ],
          userRank: 4,
        };
      },
    },
  };
  const services = await createYandexPlatformServices({
    YaGames: { async init() { return sdk; } },
  });
  assert(services !== null, 'Yandex platform must initialize for leaderboard sanity.');

  assert(await services.leaderboards.isAuthorized() === false, 'Leaderboard participation starts unauthorized when player is not signed in.');
  assert(await services.leaderboards.submitScore('daily', 42_000) === 'unauthorized', 'Score submission must not trigger authorization implicitly.');
  assert(authCalls === 0, 'Leaderboard submit must never open auth without an explicit player action.');

  assert(await services.leaderboards.requestAuthorization() === true, 'Explicit authorization action must refresh the authorized player.');
  assert(Number(authCalls) === 1, 'Explicit authorization action must open Yandex auth exactly once.');
  assert(await services.leaderboards.submitScore('daily', 42_000, '2026-09-09') === 'submitted', 'Authorized fixed Daily score must submit.');
  assert((submitted as { name: string; score: number } | null)?.name === 'daily' && (submitted as { name: string; score: number } | null)?.score === 42_000, 'Yandex submission must preserve leaderboard name and millisecond score.');

  const me = await services.leaderboards.getPlayerEntry('daily');
  assert(me?.place === 5 && me.score === 42_000, 'Yandex zero-based rank must normalize to a human one-based place.');
  assert(me.isCurrentPlayer, 'Player entry must be marked as the current player.');

  const table = await services.leaderboards.getEntries('daily', {
    quantityTop: 10,
    includeUser: true,
    quantityAround: 2,
  });
  assert(table !== null && table.entries.length === 3, 'Leaderboard table must normalize Yandex entries.');
  assert(table.currentPlayer?.place === 5, 'Leaderboard table must expose the current player position.');
  assert(table.entries[0]?.place === 1 && table.entries[0]?.publicName === 'Alpha', 'Top entry must preserve rank and public name.');
  assert(availableMethods.includes('leaderboards.setScore'), 'Yandex setScore availability must be checked before submit.');
  assert(availableMethods.includes('leaderboards.getPlayerEntry'), 'Yandex getPlayerEntry availability must be checked before ranking lookup.');
  assert(availableMethods.includes('leaderboards.getEntries'), 'Yandex getEntries availability must be checked before table lookup.');
}

async function main(): Promise<void> {
  await runLocalChecks();
  await runYandexChecks();
  console.info('[Dungeon Logic] Daily leaderboard sanity: single score codec + explicit auth + Yandex score/table adapter passed');
}

void main().catch((error) => { throw error; });
