import type { CampaignLevelEntry } from '../content/campaign/types';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { decodeCloudPlayerProfile } from '../profile/CloudProfileCodec';
import { mergePlayerProfiles } from '../profile/PlayerProfileMerge';
import { isProfileAuthorizationReady, requestAuthorizationWithProfileMerge } from '../profile/ProfileAuthorization';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { createYandexPlatformServices, YANDEX_PROFILE_DATA_KEY } from '../platform/yandex';
import type { PlayerProfile } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function profile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return { ...createFreshPlayerProfile([]), ...overrides };
}

function scopedFallback(initial: PlayerProfile): PlayerProfileStorage & {
  read(): PlayerProfile;
} {
  let value = structuredClone(initial);
  let scope = 'browser-local';
  return {
    async load() { return value; },
    async loadScoped() { return { scope, profile: value }; },
    async save(next) { value = structuredClone(next); },
    async saveForScope(next, nextScope) { scope = nextScope; value = structuredClone(next); },
    read() { return value; },
  };
}

function readCloud(data: Record<string, unknown>): PlayerProfile {
  return decodeCloudPlayerProfile(data[YANDEX_PROFILE_DATA_KEY]) as PlayerProfile;
}

function runMergeChecks(): void {
  const mergeManifest = [{ id: 'campaign-001' }] as unknown as readonly CampaignLevelEntry[];
  const cloud = profile({
    mastery: { rating: 7777 },
    campaign: {
      ...createFreshPlayerProfile([]).campaign,
      completedLevelIds: ['campaign-001'],
      levelResults: {
        'campaign-001': { bestTimeMs: 42_000, minHintsUsed: 1, solveCount: 1, solvedWithoutHints: false },
      },
    },
    daily: {
      ...createFreshPlayerProfile([]).daily,
      currentStreak: 4,
      bestStreak: 5,
      lastSolvedDate: '2026-09-01',
      totalSolved: 1,
      solvedDates: ['2026-09-01'],
      results: {
        '2026-09-01': { bestTimeMs: 90_000, minHintsUsed: 0, solvedWithoutHints: true },
      },
    },
    totals: { activePlayMs: 20_000 },
  });
  const guest = profile({
    mastery: { rating: 1111 },
    campaign: {
      ...createFreshPlayerProfile([]).campaign,
      completedLevelIds: ['campaign-001'],
      levelResults: {
        'campaign-001': { bestTimeMs: 0, minHintsUsed: 0, solveCount: 2, solvedWithoutHints: true },
      },
    },
    daily: {
      ...createFreshPlayerProfile([]).daily,
      currentStreak: 1,
      bestStreak: 2,
      lastSolvedDate: '2026-09-02',
      totalSolved: 1,
      solvedDates: ['2026-09-02'],
      results: {
        '2026-09-02': { bestTimeMs: 80_000, minHintsUsed: 1, solvedWithoutHints: false },
      },
    },
    settings: { musicEnabled: true, soundEnabled: false, language: 'ru' },
    totals: { activePlayMs: 12_000 },
  });

  const merged = mergePlayerProfiles(cloud, guest, mergeManifest);
  assert(merged.mastery.rating === 7777, 'Cloud Master Rating must not be downgraded by guest progress.');
  assert(merged.campaign.levelResults['campaign-001']?.bestTimeMs === 42_000, 'Untimed Campaign zero sentinel must not erase a legacy best time during account merge.');
  assert(merged.daily.solvedDates.join(',') === '2026-09-01,2026-09-02', 'Daily completion history from both profiles must survive merge.');
  assert(merged.daily.bestStreak === 5, 'Best Daily streak must preserve the stronger profile.');
  assert(merged.daily.lastSolvedDate === '2026-09-02' && merged.daily.currentStreak === 1, 'Current Daily streak must follow the most recent solved date.');
  assert(merged.totals.activePlayMs === 20_000, 'Cumulative counters must merge idempotently without double-counting the same history.');
  assert(!merged.settings.soundEnabled, 'Current-device settings must remain active after account merge.');

  const mergedAgain = mergePlayerProfiles(merged, guest, mergeManifest);
  assert(JSON.stringify(mergedAgain) === JSON.stringify(merged), 'Repeating the same guest -> account merge must be idempotent.');
}

async function runSuccessfulAuthorizationMerge(): Promise<void> {
  const guestProfile = profile({
    mastery: { rating: 1111 },
    daily: {
      ...createFreshPlayerProfile([]).daily,
      lastSolvedDate: '2026-09-02',
      totalSolved: 1,
      solvedDates: ['2026-09-02'],
      results: {
        '2026-09-02': { bestTimeMs: 80_000, minHintsUsed: 0, solvedWithoutHints: true },
      },
    },
  });
  const cloudProfile = profile({
    mastery: { rating: 7777 },
    daily: {
      ...createFreshPlayerProfile([]).daily,
      lastSolvedDate: '2026-09-01',
      totalSolved: 1,
      solvedDates: ['2026-09-01'],
      results: {
        '2026-09-01': { bestTimeMs: 90_000, minHintsUsed: 0, solvedWithoutHints: true },
      },
    },
  });
  let authorized = false;
  const guestData: Record<string, unknown> = {};
  const accountData: Record<string, unknown> = { [YANDEX_PROFILE_DATA_KEY]: cloudProfile };

  const makePlayer = (data: Record<string, unknown>, auth: boolean) => ({
    async getData(keys?: readonly string[]) {
      if (keys === undefined) return { ...data };
      return Object.fromEntries(keys.filter((key) => key in data).map((key) => [key, data[key]]));
    },
    async setData(next: Record<string, unknown>) { Object.assign(data, next); },
    isAuthorized() { return auth; },
    getUniqueID() { return auth ? 'account-A' : 'guest-G'; },
  });
  const sdk = {
    async getPlayer() { return authorized ? makePlayer(accountData, true) : makePlayer(guestData, false); },
    auth: { async openAuthDialog() { authorized = true; } },
  };
  const platform = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(platform !== null, 'Yandex platform must initialize.');

  const fallback = scopedFallback(guestProfile);
  const storage = new PlatformPlayerProfileStorage(platform.storage, fallback);
  const service = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  assert(service.getProfile().mastery.rating === 1111, 'Guest profile must be active before sign-in.');

  const ok = await requestAuthorizationWithProfileMerge(service, platform.leaderboards);
  assert(ok, 'Authorization with profile merge must succeed.');
  assert(service.getProfile().mastery.rating === 7777, 'In-memory profile must adopt stronger cloud progress immediately after sign-in.');
  assert(service.getProfile().daily.solvedDates.join(',') === '2026-09-01,2026-09-02', 'In-memory profile must include both cloud and guest Daily history.');
  const saved = readCloud(accountData);
  assert(saved.mastery.rating === 7777, 'Merged save must never downgrade existing cloud Master Rating.');
  assert(saved.daily.solvedDates.join(',') === '2026-09-01,2026-09-02', 'Merged cloud save must retain guest Daily history.');

  service.update((current) => ({ ...current, totals: { activePlayMs: current.totals.activePlayMs + 1 } }));
  await service.flush();
  assert(readCloud(accountData).mastery.rating === 7777, 'The first post-login save must keep merged cloud progress instead of restoring the guest snapshot.');
}

async function runFailedCloudLoadSafety(): Promise<void> {
  const guestProfile = profile({ mastery: { rating: 1111 } });
  const cloudProfile = profile({ mastery: { rating: 7777 } });
  let authorized = false;
  let accountSetDataCalls = 0;
  let accountReadsFail = true;
  const guestData: Record<string, unknown> = {};
  const accountData: Record<string, unknown> = { [YANDEX_PROFILE_DATA_KEY]: cloudProfile };

  const guestPlayer = {
    async getData(keys?: readonly string[]) {
      if (keys === undefined) return { ...guestData };
      return Object.fromEntries(keys.filter((key) => key in guestData).map((key) => [key, guestData[key]]));
    },
    async setData(next: Record<string, unknown>) { Object.assign(guestData, next); },
    isAuthorized() { return false; },
    getUniqueID() { return 'guest-G'; },
  };
  const accountPlayer = {
    async getData(keys?: readonly string[]) {
      if (accountReadsFail) throw new Error('temporary cloud read failure');
      if (keys === undefined) return { ...accountData };
      return Object.fromEntries(keys.filter((key) => key in accountData).map((key) => [key, accountData[key]]));
    },
    async setData(next: Record<string, unknown>) { accountSetDataCalls += 1; Object.assign(accountData, next); },
    isAuthorized() { return true; },
    getUniqueID() { return 'account-A'; },
  };
  const sdk = {
    async getPlayer() { return authorized ? accountPlayer : guestPlayer; },
    auth: { async openAuthDialog() { authorized = true; } },
  };
  const platform = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(platform !== null, 'Yandex platform must initialize for failed-load safety check.');

  const fallback = scopedFallback(guestProfile);
  const service = await PlayerProfileService.create([], new PlatformPlayerProfileStorage(platform.storage, fallback), { saveDelayMs: 60_000 });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const ok = await requestAuthorizationWithProfileMerge(service, platform.leaderboards);
    assert(!ok, 'Authorization flow must not report a safe completed transition when the account profile cannot be read.');
    service.update((current) => ({ ...current, totals: { activePlayMs: current.totals.activePlayMs + 5 } }));
    await service.flush();
  } finally {
    console.warn = originalWarn;
  }
  assert(accountSetDataCalls === 0, 'Unknown cloud state must block platform writes so guest data cannot overwrite an unread account profile.');
  assert(readCloud(accountData).mastery.rating === 7777, 'Unread cloud profile must remain untouched after a failed transition.');
  assert(fallback.read().totals.activePlayMs === 5, 'Progress made while cloud writes are blocked must still persist to the local fallback.');
  assert(!(await isProfileAuthorizationReady(service, platform.leaderboards)), 'A Yandex-authorized player with a pending profile merge must not be treated as account-ready.');

  accountReadsFail = false;
  const retryOk = await requestAuthorizationWithProfileMerge(service, platform.leaderboards);
  assert(retryOk, 'A pending account merge must be retryable after the temporary cloud read failure clears.');
  assert(await isProfileAuthorizationReady(service, platform.leaderboards), 'Account state must become ready only after the pending profile merge completes.');
  assert(service.getProfile().mastery.rating === 7777, 'Retrying the merge must preserve the stronger cloud profile.');
  assert(readCloud(accountData).totals.activePlayMs === 5, 'Progress saved locally during the blocked transition must merge into the account on retry.');
}

async function runAuthRefreshFailureSafety(): Promise<void> {
  const guestProfile = profile({ mastery: { rating: 1111 } });
  const cloudProfile = profile({ mastery: { rating: 7777 } });
  let authorized = false;
  let failFirstAccountAcquire = true;
  let accountSetDataCalls = 0;
  const guestData: Record<string, unknown> = {};
  const accountData: Record<string, unknown> = { [YANDEX_PROFILE_DATA_KEY]: cloudProfile };

  const guestPlayer = {
    async getData(keys?: readonly string[]) {
      if (keys === undefined) return { ...guestData };
      return Object.fromEntries(keys.filter((key) => key in guestData).map((key) => [key, guestData[key]]));
    },
    async setData(next: Record<string, unknown>) { Object.assign(guestData, next); },
    isAuthorized() { return false; },
    getUniqueID() { return 'guest-G'; },
  };
  const accountPlayer = {
    async getData(keys?: readonly string[]) {
      if (keys === undefined) return { ...accountData };
      return Object.fromEntries(keys.filter((key) => key in accountData).map((key) => [key, accountData[key]]));
    },
    async setData(next: Record<string, unknown>) { accountSetDataCalls += 1; Object.assign(accountData, next); },
    isAuthorized() { return true; },
    getUniqueID() { return 'account-A'; },
  };
  const sdk = {
    async getPlayer() {
      if (!authorized) return guestPlayer;
      if (failFirstAccountAcquire) {
        failFirstAccountAcquire = false;
        throw new Error('temporary post-auth getPlayer failure');
      }
      return accountPlayer;
    },
    auth: { async openAuthDialog() { authorized = true; } },
  };
  const platform = await createYandexPlatformServices({ YaGames: { async init() { return sdk; } } });
  assert(platform !== null, 'Yandex platform must initialize for post-auth refresh failure safety check.');

  const fallback = scopedFallback(guestProfile);
  const service = await PlayerProfileService.create([], new PlatformPlayerProfileStorage(platform.storage, fallback), { saveDelayMs: 60_000 });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const ok = await requestAuthorizationWithProfileMerge(service, platform.leaderboards);
    assert(!ok, 'A transient post-auth getPlayer failure must not be reported as a completed safe transition.');
    assert(service.hasPendingPlatformAccountTransition(), 'An inconclusive post-auth refresh must keep primary writes guarded.');
    service.update((current) => ({ ...current, totals: { activePlayMs: current.totals.activePlayMs + 9 } }));
    await service.flush();
  } finally {
    console.warn = originalWarn;
  }

  assert(accountSetDataCalls === 0, 'A failed post-auth player refresh must never unblock a guest snapshot write into the account.');
  assert(readCloud(accountData).mastery.rating === 7777, 'Cloud progress must survive an inconclusive authorization refresh.');
  assert(fallback.read().totals.activePlayMs === 9, 'Progress during an inconclusive authorization refresh must remain durable in local fallback.');

  const retryOk = await requestAuthorizationWithProfileMerge(service, platform.leaderboards);
  assert(retryOk, 'The guarded transition must finish once getPlayer recovers.');
  assert(readCloud(accountData).mastery.rating === 7777, 'Recovered merge must retain cloud Master Rating.');
  assert(readCloud(accountData).totals.activePlayMs === 9, 'Recovered merge must include progress recorded during the guarded interval.');
}

async function main(): Promise<void> {
  runMergeChecks();
  await runSuccessfulAuthorizationMerge();
  await runFailedCloudLoadSafety();
  await runAuthRefreshFailureSafety();
  console.info('[Dungeon Logic] Platform account migration sanity: guarded auth + idempotent profile merge passed');
}

void main().catch((error) => { throw error; });
