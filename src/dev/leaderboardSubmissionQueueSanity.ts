import { createYandexPlatformServices } from '../platform/yandex';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const starts: Array<{ name: string; at: number }> = [];
  const player = {
    async getData() { return {}; },
    async setData() {},
    isAuthorized() { return true; },
  };
  const sdk = {
    async getPlayer() { return player; },
    async isAvailableMethod() { return true; },
    leaderboards: {
      async setScore(name: string) { starts.push({ name, at: Date.now() }); },
      async getPlayerEntry() { throw { code: 'LEADERBOARD_PLAYER_NOT_PRESENT' }; },
      async getEntries() { return { entries: [] }; },
    },
  };
  const services = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(services !== null, 'Yandex platform must initialize for submission queue check.');

  const [daily, mastery] = await Promise.all([
    services.leaderboards.submitScore('daily', 42_000),
    services.leaderboards.submitScore('masterrating', 7777),
  ]);
  assert(daily === 'submitted' && mastery === 'submitted', 'Queued submissions must both complete successfully.');
  assert(starts.length === 2, 'Both leaderboard writes must reach Yandex.');
  const delta = starts[1].at - starts[0].at;
  assert(delta >= 1000, `Yandex setScore calls must start at least 1000 ms apart; observed ${delta} ms.`);
  assert(starts.map((entry) => entry.name).join(',') === 'daily,masterrating', 'Submission queue must preserve FIFO order across different leaderboards.');

  console.info('[Dungeon Logic] Leaderboard submission queue sanity: serialized Yandex setScore rate limit passed');
}

void main().catch((error) => { throw error; });
