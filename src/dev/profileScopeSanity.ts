import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerStorage } from '../platform/services';
import { LocalPlayerProfileStorage, type ProfileKeyValueStorage } from '../profile/LocalPlayerProfileStorage';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PlayerProfileService } from '../profile/PlayerProfileService';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryKv implements ProfileKeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const manifest: readonly CampaignLevelEntry[] = [1, 2].map((slot) => ({
  slot,
  id: `campaign-${String(slot).padStart(3, '0')}`,
  level: {
    id: `campaign-${String(slot).padStart(3, '0')}`,
    width: 1,
    height: 1,
    rowClues: [0],
    columnClues: [0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: ['.'],
  },
}));

function completed(id: string) {
  const profile = createFreshPlayerProfile(manifest);
  return {
    ...profile,
    campaign: {
      ...profile.campaign,
      completedLevelIds: [id],
      levelResults: {
        [id]: { bestTimeMs: 0, minHintsUsed: 0, solveCount: 1, solvedWithoutHints: true },
      },
    },
  };
}

async function createService(platform: PlayerStorage, fallback: LocalPlayerProfileStorage): Promise<PlayerProfileService> {
  return PlayerProfileService.create(
    manifest,
    new PlatformPlayerProfileStorage(platform, fallback),
    { saveDelayMs: 60_000 },
  );
}

async function main(): Promise<void> {
  const kv = new MemoryKv();
  const fallback = new LocalPlayerProfileStorage(kv);
  await fallback.saveForScope(completed('campaign-001'), 'yandex-guest-G');

  let accountCloud: unknown = completed('campaign-002');
  const accountStorage: PlayerStorage = {
    scope: async () => 'yandex-account-A',
    async load() { return accountCloud; },
    async save(value) { accountCloud = value; },
  };
  const merged = await createService(accountStorage, fallback);
  assert(
    merged.getProfile().campaign.completedLevelIds.join(',') === 'campaign-001,campaign-002',
    'A guest-scoped cache merges into the authorized account profile on startup.',
  );
  await merged.flush();
  const cachedAfterMerge = await fallback.loadScoped();
  assert(cachedAfterMerge.scope === 'yandex-account-A', 'Successful account save rebinds the local cache to that account scope.');

  let accountBCloud: unknown = null;
  const accountBStorage: PlayerStorage = {
    scope: async () => 'yandex-account-B',
    async load() { return accountBCloud; },
    async save(value) { accountBCloud = value; },
  };
  const accountB = await createService(accountBStorage, fallback);
  assert(
    accountB.getProfile().campaign.completedLevelIds.length === 0,
    'Switching from account A to account B never merges account A cached progress into B.',
  );

  const sameScopeKv = new MemoryKv();
  const sameScopeFallback = new LocalPlayerProfileStorage(sameScopeKv);
  await sameScopeFallback.saveForScope(completed('campaign-002'), 'yandex-account-C');
  let staleCloud: unknown = completed('campaign-001');
  const sameScopeStorage: PlayerStorage = {
    scope: async () => 'yandex-account-C',
    async load() { return staleCloud; },
    async save(value) { staleCloud = value; },
  };
  const recovered = await createService(sameScopeStorage, sameScopeFallback);
  assert(
    recovered.getProfile().campaign.completedLevelIds.join(',') === 'campaign-001,campaign-002',
    'A same-account fallback cache safely recovers progress missing from stale cloud data.',
  );

  const unresolvedKv = new MemoryKv();
  const unresolvedFallback = new LocalPlayerProfileStorage(unresolvedKv);
  await unresolvedFallback.saveForScope(completed('campaign-001'), 'yandex-account-A');
  let unresolvedCloud: unknown = completed('campaign-002');
  const unresolvedScopeStorage: PlayerStorage = {
    async scope() { throw new Error('temporary unique-id failure'); },
    async load() { return unresolvedCloud; },
    async save(value) { unresolvedCloud = value; },
  };
  const originalWarn = console.warn;
  console.warn = () => {};
  let unresolved: PlayerProfileService;
  try {
    unresolved = await createService(unresolvedScopeStorage, unresolvedFallback);
    unresolved.recordRewardedHintUsed();
    await unresolved.flush();
  } finally {
    console.warn = originalWarn;
  }
  const cacheAfterUnresolvedScopeSave = await unresolvedFallback.loadScoped();
  assert(
    cacheAfterUnresolvedScopeSave.scope === 'yandex-account-A'
      && (cacheAfterUnresolvedScopeSave.profile as ReturnType<typeof completed>).campaign.completedLevelIds.join(',') === 'campaign-001',
    'A transient account-scope failure must never relabel or overwrite another account cache.',
  );

  const unknownFailureKv = new MemoryKv();
  const unknownFailureFallback = new LocalPlayerProfileStorage(unknownFailureKv);
  await unknownFailureFallback.saveForScope(completed('campaign-001'), 'yandex-account-A');
  const unknownFailureStorage: PlayerStorage = {
    async scope() { throw new Error('identity unavailable'); },
    async load() { throw new Error('cloud unavailable'); },
    async save() {},
  };
  const originalWarn2 = console.warn;
  console.warn = () => {};
  let unknownFailure: PlayerProfileService;
  try {
    unknownFailure = await createService(unknownFailureStorage, unknownFailureFallback);
  } finally {
    console.warn = originalWarn2;
  }
  assert(
    unknownFailure.getProfile().campaign.completedLevelIds.length === 0,
    'When account identity and cloud read are both unavailable, an unknown-account cache must never be loaded.',
  );

  console.info('[Dungeon Logic] Profile scope sanity passed');
}

void main();
