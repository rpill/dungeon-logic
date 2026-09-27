import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { createFreshPlayerProfile, normalizePlayerProfile } from '../profile/PlayerProfile';
import { LocalPlayerProfileStorage, PLAYER_PROFILE_STORAGE_KEY } from '../profile/LocalPlayerProfileStorage';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfile } from '../profile/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function entry(slot: number): CampaignLevelEntry {
  const id = `campaign-${String(slot).padStart(3, '0')}`;
  return {
    slot,
    id,
    level: {
      id,
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
  };
}

async function runTechnicalErrorReportingChecks(manifest: readonly CampaignLevelEntry[]): Promise<void> {
  const codes: string[] = [];
  const report: TechnicalErrorReporter = (code) => codes.push(code);
  const fallbackProfile = createFreshPlayerProfile(manifest);
  let platformSaveCalls = 0;
  const platformStorage = {
    async load(): Promise<unknown | null> { throw new Error('platform load failed'); },
    async save(): Promise<void> { platformSaveCalls += 1; throw new Error('platform save failed'); },
  };
  const localFallbackStorage: PlayerProfileStorage = {
    async load() { return fallbackProfile; },
    async save() {},
  };
  const storage = new PlatformPlayerProfileStorage(platformStorage, localFallbackStorage, report);

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const loaded = await storage.load();
    assert(loaded !== null, 'Profile storage preserves local fallback when the platform profile cannot be read.');
  } finally {
    console.warn = originalWarn;
  }
  assert(codes.includes('profile_load_failed'), 'Platform profile load failure is reported.');
  assert(platformSaveCalls === 0, 'Unknown cloud state must not trigger local-profile promotion into platform storage.');
  assert(!codes.includes('profile_save_failed'), 'Blocked promotion after a platform load failure must not fabricate a save failure.');

  class RejectingStorage implements PlayerProfileStorage {
    async load(): Promise<unknown | null> { throw new Error('load failed'); }
    async save(): Promise<void> { throw new Error('save failed'); }
  }

  const serviceCodes: string[] = [];
  const serviceReport: TechnicalErrorReporter = (code) => serviceCodes.push(code);
  console.warn = () => {};
  try {
    const service = await PlayerProfileService.create(manifest, new RejectingStorage(), {
      saveDelayMs: 5,
      reportTechnicalError: serviceReport,
    });
    service.update((profile) => ({
      ...profile,
      hints: { ...profile.hints, totalUsed: profile.hints.totalUsed + 1 },
    }));
    await new Promise((resolve) => setTimeout(resolve, 20));
  } finally {
    console.warn = originalWarn;
  }
  assert(serviceCodes.includes('profile_load_failed'), 'PlayerProfileService load failure is reported.');
  assert(serviceCodes.includes('profile_save_failed'), 'Delayed PlayerProfileService save failure is reported.');
}

async function main(): Promise<void> {
  const manifest = [entry(1), entry(2), entry(3), entry(4), entry(5), entry(6), entry(7)];

  const fresh = normalizePlayerProfile({ nonsense: true }, manifest);
  assert(fresh.schemaVersion === 1, 'Invalid profile input falls back to the single pre-release schema v1.');
  assert(Object.keys(fresh.campaign.drafts).length === 0, 'Fresh Campaign starts with no saved level drafts.');
  assert(!fresh.tutorial.completed, 'Fresh profile requires Tutorial before Campaign.');
  assert(fresh.tutorial.completedLevelIds.length === 0, 'Fresh Tutorial progress starts empty.');
  assert(fresh.tutorial.activePuzzle === null, 'Fresh Tutorial has no active puzzle.');
  assert(fresh.hints.freeRemaining === 3, 'Fresh profile grants exactly 3 free hints.');
  assert(fresh.hints.totalUsed === 0, 'Fresh profile starts with zero used hints.');
  assert(Object.keys(fresh.daily.drafts).length === 0, 'Fresh profile has no saved Daily drafts.');
  assert(fresh.daily.currentStreak === 0 && fresh.daily.bestStreak === 0, 'Fresh profile starts with empty Daily streaks.');
  assert(fresh.endless.nextFreshIndex === 0 && fresh.endless.completed === 0 && fresh.endless.skipped.length === 0 && fresh.endless.activePuzzle === null, 'Fresh profile starts with empty finite Endless progress.');
  assert(fresh.mastery.rating === 1000, 'Fresh profile starts with hidden Master Rating 1000.');
  assert(fresh.ads.campaignCompletionsSinceOpportunity === 0, 'Fresh profile starts with zero ad opportunity completions.');
  assert(fresh.totals.activePlayMs === 0, 'Fresh profile starts with zero active play time.');
  assert(fresh.settings.musicEnabled && fresh.settings.soundEnabled, 'Fresh settings enable music and sound.');
  assert(!('vibrationEnabled' in fresh.settings), 'Fresh settings no longer persist vibration.');
  assert(fresh.settings.language === 'ru', 'Fresh profile language defaults to ru.');

  const unsupportedOldProfile = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    schemaVersion: 999,
    campaign: {
      ...createFreshPlayerProfile(manifest).campaign,
      completedLevelIds: ['campaign-001'],
    },
  }, manifest);
  assert(
    unsupportedOldProfile.campaign.completedLevelIds.length === 0,
    'Unsupported development profile schemas reset instead of migrating.',
  );

  const obsoletePreUnifiedV1 = normalizePlayerProfile({
    schemaVersion: 1,
    campaign: { completedLevelIds: ['campaign-001'], lastPlayedLevelId: 'campaign-001' },
    settings: { musicEnabled: true, soundEnabled: true, language: 'ru' },
  }, manifest);
  assert(
    obsoletePreUnifiedV1.campaign.completedLevelIds.length === 0,
    'Obsolete pre-unified development saves are rejected even though they also used schemaVersion 1.',
  );

  const obsoleteEndlessOrdinal = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    endless: {
      ...createFreshPlayerProfile(manifest).endless,
      ordinal: 4321,
      nextFreshIndex: undefined,
    },
  }, manifest);
  assert(
    obsoleteEndlessOrdinal.endless.nextFreshIndex === 0,
    'Obsolete pre-release Endless ordinal is ignored instead of being migrated into ranked progress.',
  );

  const normalized = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    tutorial: {
      completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004'],
      completed: true,
      activePuzzle: null,
    },
    campaign: {
      completedLevelIds: ['campaign-002', 'unknown', 'campaign-002', 'campaign-001'],
      lastPlayedLevelId: 'unknown',
      levelResults: {
        'campaign-002': { bestTimeMs: 1200, minHintsUsed: 1, solveCount: 2, solvedWithoutHints: false },
        unknown: { bestTimeMs: 1, minHintsUsed: 0, solveCount: 1, solvedWithoutHints: true },
      },
      drafts: {
        'campaign-003': {
          mode: 'campaign',
          puzzleId: 'campaign-003',
          cells: [['unknown']],
          activePlayMs: 321,
          hintsUsed: 1,
          startedAtMs: 123,
        },
      },
    },
  }, manifest);
  assert(
    normalized.campaign.completedLevelIds.join(',') === 'campaign-001,campaign-002',
    'Completed IDs are deduplicated, unknown IDs are dropped, and manifest order is preserved.',
  );
  assert(normalized.campaign.lastPlayedLevelId === null, 'Unknown last-played IDs are discarded.');
  assert(Object.keys(normalized.campaign.levelResults).join(',') === 'campaign-002', 'Unknown level result entries are discarded.');
  assert(normalized.campaign.drafts['campaign-003']?.activePlayMs === 321, 'Current per-level Campaign drafts survive normalization.');
  assert(
    normalized.tutorial.completedLevelIds.join(',')
      === 'tutorial-001,tutorial-002,tutorial-003,tutorial-004,tutorial-005',
    'Completed Tutorial state is normalized to the complete current tutorial set.',
  );

  class MemoryKeyValueStorage {
    readonly values = new Map<string, string>();
    getItem(key: string): string | null { return this.values.get(key) ?? null; }
    setItem(key: string, value: string): void { this.values.set(key, value); }
  }

  const kv = new MemoryKeyValueStorage();
  const localStorage = new LocalPlayerProfileStorage(kv);
  assert(await localStorage.load() === null, 'Player profile storage starts empty when no unified profile exists.');
  await localStorage.save(normalized);
  const roundTrip = await localStorage.load() as PlayerProfile | null;
  assert(roundTrip?.schemaVersion === 1, 'Current profile round-trips through local storage.');

  class CountingStorage implements PlayerProfileStorage {
    raw: unknown = null;
    saves: PlayerProfile[] = [];

    async load(): Promise<unknown | null> { return this.raw; }
    async save(profile: PlayerProfile): Promise<void> {
      this.raw = profile;
      this.saves.push(profile);
    }
  }

  const counting = new CountingStorage();
  const service = await PlayerProfileService.create(manifest, counting, { saveDelayMs: 20 });
  service.update((profile) => ({
    ...profile,
    hints: { ...profile.hints, totalUsed: 1 },
  }));
  service.update((profile) => ({
    ...profile,
    hints: { ...profile.hints, totalUsed: 2 },
  }));
  assert(service.getProfile().hints.totalUsed === 2, 'Updates change in-memory profile immediately.');
  assert(counting.saves.length === 0, 'Rapid updates are not persisted immediately.');
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert(counting.saves.length === 1, 'Rapid updates coalesce into a single delayed persistence write.');
  assert(counting.saves[0].hints.totalUsed === 2, 'Coalesced write persists the latest profile revision.');

  service.update((profile) => ({
    ...profile,
    totals: { activePlayMs: 500 },
  }));
  await service.flush();
  assert(counting.saves.length === 2, 'flush() persists a dirty profile immediately.');
  assert(counting.saves[1].totals.activePlayMs === 500, 'flush() persists the latest state.');

  service.addActivePlayTime(250);
  service.addActivePlayTime(0);
  service.addActivePlayTime(Number.NaN);
  assert(service.getProfile().totals.activePlayMs === 750, 'Active play time adds only positive finite deltas.');

  const replacement = createFreshPlayerProfile(manifest);
  service.replaceProfileForPlatformMerge({
    ...replacement,
    hints: { freeRemaining: 1, totalUsed: 9 },
  });
  assert(service.getProfile().hints.totalUsed === 9, 'Platform merge replacement updates memory immediately.');
  await service.flush();
  assert(counting.saves.at(-1)?.hints.totalUsed === 9, 'Platform merge replacement becomes persistable state.');

  assert(kv.getItem(PLAYER_PROFILE_STORAGE_KEY) !== null, 'Saving the current profile writes only the unified profile key.');

  await runTechnicalErrorReportingChecks(manifest);

  console.info('[Dungeon Logic] Player profile sanity: single schema + normalization + persistence passed');
}

void main();
