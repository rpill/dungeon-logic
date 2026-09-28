import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import { createLocalPlatformServices } from '../platform/local';
import { resolvePlatformServices } from '../platform/PlatformRegistry';
import { createYandexPlatformServices } from '../platform/yandex';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
  }
}

class FakeKeyValueStorage {
  readonly values = new Map<string, string>();
  throwOnRead = false;
  throwOnWrite = false;

  getItem(key: string): string | null {
    if (this.throwOnRead) throw new Error('read failed');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnWrite) throw new Error('write failed');
    this.values.set(key, value);
  }
}

async function runLocalChecks(): Promise<void> {
  const storage = new FakeKeyValueStorage();
  const services = createLocalPlatformServices(storage);
  const value = { version: 1, campaign: { completed: ['campaign-001'] } };

  await services.storage.save(value);
  assertDeepEqual(await services.storage.load(), value, 'Local platform storage round-trips the profile.');
  assert(await services.clock.now() === null, 'Local platform clock does not fabricate trusted time.');
  assert(await services.ads.showRewarded() === 'unavailable', 'Local rewarded ad is unavailable without throwing.');
  assert(services.environment.language === null, 'Local platform does not fabricate an SDK language.');
  await services.readiness.ready();
  await services.readiness.ready();
  await services.gameplay.start();
  await services.gameplay.start();
  await services.gameplay.stop();
  await services.gameplay.stop();
  assert(!services.lifecycle.isPaused(), 'Local lifecycle starts unpaused.');
  const unsubscribe = services.lifecycle.subscribe({ onPause() {}, onResume() {} });
  assert(typeof unsubscribe === 'function', 'Local lifecycle returns a no-op unsubscribe function.');
  unsubscribe();

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    storage.throwOnWrite = true;
    const memoryValue = { memory: true };
    await services.storage.save(memoryValue);
    storage.throwOnRead = true;
    assertDeepEqual(await services.storage.load(), memoryValue, 'Local storage falls back to in-memory profile data when browser storage throws.');
  } finally {
    console.warn = originalWarn;
  }
}

async function runYandexChecks(): Promise<void> {
  let initCalls = 0;
  let getPlayerCalls = 0;
  let lastGetDataKeys: readonly string[] | undefined;
  let lastSetData: unknown = null;
  let lastSetDataFlush: boolean | undefined;
  let cloudProfile: unknown = { cloud: 'profile' };
  let readyCalls = 0;
  let gameplayStartCalls = 0;
  let gameplayStopCalls = 0;
  const listeners = new Map<string, Set<() => void>>();

  const player = {
    isAuthorized() { return true; },
    getUniqueID() { return 'scope-user-1'; },
    async getData(keys?: readonly string[]) {
      lastGetDataKeys = keys;
      return { dungeonLogicProfile: cloudProfile };
    },
    async setData(data: Record<string, unknown>, flush?: boolean) {
      lastSetData = data;
      lastSetDataFlush = flush;
      cloudProfile = data.dungeonLogicProfile ?? null;
    },
  };

  const sdk = {
    async getPlayer() {
      getPlayerCalls += 1;
      return player;
    },
    serverTime() {
      return Date.UTC(2099, 0, 2, 3, 4, 5);
    },
    environment: {
      i18n: {
        lang: 'ru',
      },
    },
    features: {
      LoadingAPI: {
        ready() {
          readyCalls += 1;
        },
      },
      GameplayAPI: {
        start() {
          gameplayStartCalls += 1;
        },
        stop() {
          gameplayStopCalls += 1;
        },
      },
    },
    adv: {
      showRewardedVideo(options?: { callbacks?: { onOpen?: () => void; onRewarded?: () => void; onClose?: (wasShown: boolean) => void; onError?: (error: unknown) => void } }) {
        options?.callbacks?.onOpen?.();
        options?.callbacks?.onRewarded?.();
        options?.callbacks?.onClose?.(true);
      },
    },
    on(event: string, handler: () => void) {
      const bucket = listeners.get(event) ?? new Set<() => void>();
      bucket.add(handler);
      listeners.set(event, bucket);
    },
    off(event: string, handler: () => void) {
      listeners.get(event)?.delete(handler);
    },
  };

  const globals = {
    YaGames: {
      async init() {
        initCalls += 1;
        return sdk;
      },
    },
  };

  const services = await createYandexPlatformServices(globals);
  assert(services !== null, 'Yandex adapter resolves when YaGames.init is available.');
  assert(services.kind === 'yandex', 'Yandex adapter identifies its platform kind.');
  assert(services.environment.language === 'ru', 'Yandex adapter exposes environment.i18n.lang.');

  await services.readiness.ready();
  await services.readiness.ready();
  assert(readyCalls === 1, 'Yandex Game Ready is idempotent across repeated scene signals.');

  await services.gameplay.start();
  await services.gameplay.start();
  await services.gameplay.stop();
  await services.gameplay.stop();
  await services.gameplay.start();
  assert(gameplayStartCalls === 2, 'Yandex gameplay markup deduplicates repeated starts but allows a later resume.');
  assert(gameplayStopCalls === 1, 'Yandex gameplay markup deduplicates repeated stops.');

  assertDeepEqual(await services.storage.load(), { cloud: 'profile' }, 'Yandex storage loads the single cloud profile value.');
  assert(await services.storage.scope?.() === 'yandex-account-scope-user-1', 'Yandex storage scope binds cache data to the authorized unique player ID.');
  await services.storage.save({ cloud: 'updated' });
  assertDeepEqual(lastGetDataKeys, ['dungeonLogicProfile'], 'Yandex storage requests only the cloud profile key.');
  assertDeepEqual(lastSetData, { dungeonLogicProfile: { cloud: 'updated' } }, 'Yandex storage writes only the cloud profile key.');
  assert(lastSetDataFlush === true, 'Profile flush uses immediate Yandex transmission.');

  const compactFixture = createFreshPlayerProfile([]);
  await services.storage.save(compactFixture);
  const compactWritten = (lastSetData as { dungeonLogicProfile?: Record<string, unknown> } | null)?.dungeonLogicProfile;
  assert(compactWritten?.$dl === 1, 'Yandex storage compacts supported player profiles before setData.');
  assertDeepEqual(await services.storage.load(), compactFixture, 'Yandex storage decodes compact cloud profiles back to the public schema.');

  const trustedNow = await services.clock.now();
  assert(trustedNow?.toISOString() === '2099-01-02T03:04:05.000Z', 'Yandex clock converts serverTime to a trusted Date.');
  assert(await services.ads.showRewarded() === 'rewarded', 'Yandex rewarded callback maps to rewarded.');

  for (const callback of listeners.get('game_api_pause') ?? []) callback();
  assert(services.lifecycle.isPaused(), 'Yandex lifecycle retains startup pause before scene subscribers exist.');

  let pauses = 0;
  let resumes = 0;
  const unsubscribe = services.lifecycle.subscribe({
    onPause: () => { pauses += 1; },
    onResume: () => { resumes += 1; },
  });
  for (const callback of listeners.get('game_api_resume') ?? []) callback();
  assert(!services.lifecycle.isPaused(), 'Yandex lifecycle clears retained pause state on resume.');
  for (const callback of listeners.get('game_api_pause') ?? []) callback();
  for (const callback of listeners.get('game_api_resume') ?? []) callback();
  assert(pauses === 1 && resumes === 2, 'Yandex lifecycle forwards subsequent pause/resume events to subscribers.');
  unsubscribe();
  const pausesAfterUnsubscribe = pauses;
  const resumesAfterUnsubscribe = resumes;
  for (const callback of listeners.get('game_api_pause') ?? []) callback();
  assert(services.lifecycle.isPaused(), 'Lifecycle keeps tracking platform pause after scene subscriber unsubscribes.');
  for (const callback of listeners.get('game_api_resume') ?? []) callback();
  assert(!services.lifecycle.isPaused(), 'Lifecycle keeps tracking platform resume after scene subscriber unsubscribes.');
  assert(pauses === pausesAfterUnsubscribe && resumes === resumesAfterUnsubscribe, 'Lifecycle unsubscribe detaches only the scene subscriber.');

  assert(initCalls === 1, 'Yandex SDK initialization is cached for all operations.');
  assert(getPlayerCalls === 1, 'Yandex Player lookup is cached for all storage operations.');
}

async function runResolutionChecks(): Promise<void> {
  const local = createLocalPlatformServices(new FakeKeyValueStorage());
  const resolvedFallback = await resolvePlatformServices(
    async () => null,
    () => local,
  );
  assert(resolvedFallback.kind === 'local', 'Platform resolver falls back when Yandex is absent.');

  const resolvedAfterFailure = await resolvePlatformServices(
    async () => { throw new Error('init failed'); },
    () => local,
  );
  assert(resolvedAfterFailure.kind === 'local', 'Platform resolver falls back when Yandex initialization fails.');
}

async function runProfileFallbackChecks(): Promise<void> {
  let cloud: unknown | null = null;
  let promoted: unknown | null = null;
  const platformStorage = {
    async load() { return cloud; },
    async save(value: unknown) { cloud = value; promoted = value; },
  };
  const localProfile = createFreshPlayerProfile([]);
  const localFallbackStorage = {
    async load() { return localProfile; },
    async save() {},
  };

  const storage = new PlatformPlayerProfileStorage(platformStorage, localFallbackStorage);
  assertDeepEqual(await storage.load(), localProfile, 'Empty cloud storage falls back to the existing local player profile.');
  assertDeepEqual(promoted, localProfile, 'Existing local player profile is promoted into platform storage once.');

  cloud = null;
  promoted = null;
  const unsupportedLocalStorage = {
    async load() { return { ...localProfile, schemaVersion: 999 }; },
    async save() {},
  };
  const unsupportedStorage = new PlatformPlayerProfileStorage(platformStorage, unsupportedLocalStorage);
  await unsupportedStorage.load();
  assert(promoted === null, 'Unsupported development profiles are not promoted into cloud storage.');
}


async function runTechnicalErrorReportingChecks(): Promise<void> {
  const technicalErrors: string[] = [];
  const report: TechnicalErrorReporter = (code) => technicalErrors.push(code);
  const local = createLocalPlatformServices(new FakeKeyValueStorage());

  const resolvedAfterFailure = await resolvePlatformServices(
    async () => { throw new Error('init failed'); },
    () => local,
    report,
  );
  assert(resolvedAfterFailure.kind === 'local', 'Reporter-enabled resolver still falls back to local platform.');
  assert(
    technicalErrors.filter((code) => code === 'platform_init_failed').length === 1,
    'Platform resolver reports a thrown Yandex factory exactly once.',
  );

  const failingPlayer = {
    async getData() { return {}; },
    async setData() {},
    isAuthorized() { return true; },
  };
  const failingSdk = {
    async getPlayer() { return failingPlayer; },
    async isAvailableMethod() { return true; },
    features: {
      LoadingAPI: { async ready() { throw new Error('ready failed'); } },
      GameplayAPI: {
        async start() { throw new Error('gameplay start failed'); },
        async stop() { throw new Error('gameplay stop failed'); },
      },
    },
    adv: {
      showRewardedVideo() { throw new Error('rewarded failed'); },
    },
    leaderboards: {
      async setScore() { throw new Error('submit failed'); },
      async getPlayerEntry() { throw new Error('player entry failed'); },
      async getEntries() { throw new Error('entries failed'); },
    },
  };
  const failingGlobals = {
    YaGames: { async init() { return failingSdk; } },
  };
  const services = await createYandexPlatformServices(failingGlobals, report);
  assert(services !== null, 'Yandex services still construct when optional operations fail later.');

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await services.readiness.ready();
    await services.gameplay.start();
    await services.gameplay.stop();
    assert(await services.ads.showRewarded() === 'unavailable', 'Thrown rewarded SDK call stays unavailable.');
    assert(await services.leaderboards.submitScore('daily', 1) === 'unavailable', 'Thrown leaderboard submit stays unavailable.');
    assert(await services.leaderboards.getPlayerEntry('daily') === null, 'Thrown leaderboard player load stays null.');
    assert(await services.leaderboards.getEntries('daily') === null, 'Thrown leaderboard entries load stays null.');
  } finally {
    console.warn = originalWarn;
  }

  for (const code of [
    'readiness_failed',
    'gameplay_api_failed',
    'rewarded_request_failed',
    'leaderboard_submit_failed',
    'leaderboard_load_failed',
  ]) {
    assert(technicalErrors.includes(code), `Caught platform failure reports ${code}.`);
  }

  const absentErrors: string[] = [];
  const minimalServices = await createYandexPlatformServices({
    YaGames: {
      async init() {
        return { async getPlayer() { return failingPlayer; } };
      },
    },
  }, (code) => absentErrors.push(code));
  assert(minimalServices !== null, 'Minimal Yandex SDK still creates services.');
  await minimalServices.readiness.ready();
  await minimalServices.gameplay.start();
  await minimalServices.gameplay.stop();
  await minimalServices.ads.showRewarded();
  assert(absentErrors.length === 0, 'Missing optional Yandex methods are not reported as technical failures.');

  const callbackErrors: string[] = [];
  const callbackServices = await createYandexPlatformServices({
    YaGames: {
      async init() {
        return {
          async getPlayer() { return failingPlayer; },
          adv: {
            showRewardedVideo(options?: { callbacks?: { onError?: (error: unknown) => void } }) {
              options?.callbacks?.onError?.(new Error('rewarded callback failed'));
            },
          },
        };
      },
    },
  }, (code) => callbackErrors.push(code));
  assert(callbackServices !== null, 'Yandex callback-error fixture creates services.');
  assert(await callbackServices.ads.showRewarded() === 'unavailable', 'Rewarded onError callback stays unavailable.');
  assert(callbackErrors.includes('rewarded_request_failed'), 'Rewarded onError callback reports stable technical code.');

  const initErrors: string[] = [];
  const failedInit = await createYandexPlatformServices({
    YaGames: { async init() { throw new Error('sdk init failed'); } },
  }, (code) => initErrors.push(code));
  assert(failedInit === null, 'Failed Yandex init still returns null for local fallback.');
  assert(initErrors.join(',') === 'platform_init_failed', 'Failed Yandex SDK init reports platform_init_failed once.');
}

async function main(): Promise<void> {
  await runLocalChecks();
  await runYandexChecks();
  await runResolutionChecks();
  await runProfileFallbackChecks();
  await runTechnicalErrorReportingChecks();
  console.info('[Dungeon Logic] Platform sanity: readiness + i18n + gameplay/lifecycle + cloud fallback passed');
}

void main().catch((error) => {
  throw error;
});
