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
  assert(await services.ads.showInterstitial() === 'unavailable', 'Local interstitial is unavailable without throwing.');
  assert(await services.ads.showRewarded() === 'unavailable', 'Local rewarded ad is unavailable without throwing.');
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
  const listeners = new Map<string, Set<() => void>>();

  const player = {
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
    adv: {
      showFullscreenAdv(options?: { callbacks?: { onOpen?: () => void; onClose?: (wasShown: boolean) => void; onError?: (error: unknown) => void } }) {
        options?.callbacks?.onOpen?.();
        options?.callbacks?.onClose?.(true);
      },
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

  assertDeepEqual(await services.storage.load(), { cloud: 'profile' }, 'Yandex storage loads the single cloud profile value.');
  await services.storage.save({ cloud: 'updated' });
  assertDeepEqual(lastGetDataKeys, ['dungeonLogicProfile'], 'Yandex storage requests only the cloud profile key.');
  assertDeepEqual(lastSetData, { dungeonLogicProfile: { cloud: 'updated' } }, 'Yandex storage writes only the cloud profile key.');
  assert(lastSetDataFlush === true, 'Profile flush uses immediate Yandex transmission.');

  const trustedNow = await services.clock.now();
  assert(trustedNow?.toISOString() === '2099-01-02T03:04:05.000Z', 'Yandex clock converts serverTime to a trusted Date.');
  assert(await services.ads.showInterstitial() === 'shown', 'Yandex fullscreen callback maps to shown.');
  assert(await services.ads.showRewarded() === 'rewarded', 'Yandex rewarded callback maps to rewarded.');

  let pauses = 0;
  let resumes = 0;
  const unsubscribe = services.lifecycle.subscribe({
    onPause: () => { pauses += 1; },
    onResume: () => { resumes += 1; },
  });
  for (const callback of listeners.get('game_api_pause') ?? []) callback();
  for (const callback of listeners.get('game_api_resume') ?? []) callback();
  assert(pauses === 1 && resumes === 1, 'Yandex lifecycle forwards pause/resume events.');
  unsubscribe();
  assert((listeners.get('game_api_pause')?.size ?? 0) === 0, 'Lifecycle unsubscribe removes pause listener.');
  assert((listeners.get('game_api_resume')?.size ?? 0) === 0, 'Lifecycle unsubscribe removes resume listener.');

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

async function runProfileMigrationChecks(): Promise<void> {
  let cloud: unknown | null = null;
  let promoted: unknown | null = null;
  const platformStorage = {
    async load() { return cloud; },
    async save(value: unknown) { cloud = value; promoted = value; },
  };
  const localProfile = { version: 1, campaign: { completedLevelIds: ['campaign-001'] } };
  const localMigrationStorage = {
    async load() { return localProfile; },
    async save() {},
    async loadLegacyCampaignProgress() { return { completedLevelIds: ['campaign-001'] }; },
  };

  const storage = new PlatformPlayerProfileStorage(platformStorage, localMigrationStorage);
  assertDeepEqual(await storage.load(), localProfile, 'Empty cloud storage falls back to the existing local player profile.');
  assertDeepEqual(promoted, localProfile, 'Existing local player profile is promoted into platform storage once.');
  assertDeepEqual(await storage.loadLegacyCampaignProgress(), { completedLevelIds: ['campaign-001'] }, 'Legacy campaign migration remains available.');
}

async function main(): Promise<void> {
  await runLocalChecks();
  await runYandexChecks();
  await runResolutionChecks();
  await runProfileMigrationChecks();
  console.info('[Dungeon Logic] Platform sanity: local fallback + cached Yandex SDK + cloud profile migration passed');
}

void main().catch((error) => {
  throw error;
});
