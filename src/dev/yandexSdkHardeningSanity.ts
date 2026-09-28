import { createYandexPlatformServices, YANDEX_PROFILE_DATA_KEY } from '../platform/yandex';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function runPlayerRetryCheck(): Promise<void> {
  let getPlayerCalls = 0;
  const player = {
    async getData() { return { [YANDEX_PROFILE_DATA_KEY]: { recovered: true } }; },
    async setData() {},
    isAuthorized() { return true; },
  };
  const sdk = {
    async getPlayer() {
      getPlayerCalls += 1;
      if (getPlayerCalls === 1) throw new Error('temporary getPlayer failure');
      return player;
    },
  };
  const services = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(services !== null, 'Yandex platform must initialize for retry check.');
  const [loaded, concurrentLoaded] = await Promise.all([
    services.storage.load(),
    services.storage.load(),
  ]) as Array<{ recovered?: boolean } | null>;
  assert(loaded?.recovered === true && concurrentLoaded?.recovered === true, 'A transient first getPlayer failure must be retried instead of being cached forever.');
  assert(getPlayerCalls === 2, 'Concurrent callers must share the single reacquire attempt after a transient getPlayer failure.');
}

async function runMissingEntryCheck(): Promise<void> {
  const reported: string[] = [];
  const player = {
    async getData() { return {}; },
    async setData() {},
    isAuthorized() { return true; },
  };
  const sdk = {
    async getPlayer() { return player; },
    async isAvailableMethod() { return true; },
    leaderboards: {
      async setScore() {},
      async getPlayerEntry() { throw { code: 'LEADERBOARD_PLAYER_NOT_PRESENT' }; },
      async getEntries() { return { entries: [], userRank: 0 }; },
    },
  };
  const services = await createYandexPlatformServices(
    { YaGames: { async init() { return sdk; } } },
    (code) => reported.push(code),
  );
  assert(services !== null, 'Yandex platform must initialize for missing-entry check.');

  const playerEntry = await services.leaderboards.getPlayerEntry('daily');
  assert(playerEntry === null, 'A player with no leaderboard record must normalize to null.');
  const table = await services.leaderboards.getEntries('daily', { includeUser: true, quantityTop: 10 });
  assert(table !== null && table.currentPlayer === null, 'Missing current-player record must not make the leaderboard table unavailable.');
  assert(!reported.includes('leaderboard_load_failed'), 'LEADERBOARD_PLAYER_NOT_PRESENT must not be reported as a technical SDK failure.');
}


async function runMissingUniqueIdSafetyCheck(): Promise<void> {
  const player = {
    async getData() { return {}; },
    async setData() {},
    isAuthorized() { return true; },
  };
  const sdk = { async getPlayer() { return player; } };
  const services = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(services !== null, 'Yandex platform must initialize for missing unique-ID safety check.');
  assert(await services.storage.scope?.() === '', 'Missing getUniqueID must leave account scope unresolved instead of collapsing users into one shared cache scope.');
}

async function runDuplicateProfileSaveCheck(): Promise<void> {
  let setDataCalls = 0;
  const player = {
    async getData() { return {}; },
    async setData() { setDataCalls += 1; },
    isAuthorized() { return true; },
    getUniqueID() { return 'duplicate-save-user'; },
  };
  const sdk = { async getPlayer() { return player; } };
  const services = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(services !== null, 'Yandex platform must initialize for duplicate-save check.');

  await services.storage.save({ same: 'profile' });
  await services.storage.save({ same: 'profile' });
  assert(setDataCalls === 1, 'Identical Yandex profile payloads must not call player.setData twice.');
}

async function runServerUnchangedDataCheck(): Promise<void> {
  const player = {
    async getData() { return {}; },
    async setData() { throw new Error('The data does not differ from the previous ones.'); },
    isAuthorized() { return true; },
    getUniqueID() { return 'unchanged-data-user'; },
  };
  const sdk = { async getPlayer() { return player; } };
  const services = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(services !== null, 'Yandex platform must initialize for unchanged-data check.');
  await services.storage.save({ same: 'server-profile' });
}

async function main(): Promise<void> {
  await runPlayerRetryCheck();
  await runMissingEntryCheck();
  await runMissingUniqueIdSafetyCheck();
  await runDuplicateProfileSaveCheck();
  await runServerUnchangedDataCheck();
  console.info('[Dungeon Logic] Yandex SDK hardening sanity: getPlayer retry + missing-entry + account-scope safety + duplicate-save suppression passed');
}

void main().catch((error) => { throw error; });
