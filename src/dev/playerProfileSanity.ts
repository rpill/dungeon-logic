import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  createFreshPlayerProfile,
  migrateLegacyCampaignProgress,
  normalizePlayerProfile,
} from '../profile/PlayerProfile';
import { LocalPlayerProfileStorage, PLAYER_PROFILE_STORAGE_KEY } from '../profile/LocalPlayerProfileStorage';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV4 } from '../profile/types';

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
  const platformStorage = {
    async load(): Promise<unknown | null> { throw new Error('platform load failed'); },
    async save(): Promise<void> { throw new Error('platform save failed'); },
  };
  const localMigrationStorage: PlayerProfileStorage = {
    async load() { return fallbackProfile; },
    async save() {},
    async loadLegacyCampaignProgress() { return null; },
  };
  const storage = new PlatformPlayerProfileStorage(platformStorage, localMigrationStorage, report);

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const loaded = await storage.load();
    assert(loaded !== null, 'Profile storage preserves local fallback when platform load/promotion fail.');
  } finally {
    console.warn = originalWarn;
  }
  assert(codes.includes('profile_load_failed'), 'Platform profile load failure is reported.');
  assert(codes.includes('profile_save_failed'), 'Platform profile promotion save failure is reported.');

  class RejectingStorage implements PlayerProfileStorage {
    async load(): Promise<unknown | null> { throw new Error('load failed'); }
    async loadLegacyCampaignProgress(): Promise<unknown | null> { throw new Error('legacy load failed'); }
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

  class MigrationSaveRejectingStorage implements PlayerProfileStorage {
    async load(): Promise<unknown | null> { return null; }
    async loadLegacyCampaignProgress(): Promise<unknown | null> {
      return { schemaVersion: 1, completedLevelIds: ['campaign-001'], lastPlayedLevelId: 'campaign-001' };
    }
    async save(): Promise<void> { throw new Error('migration save failed'); }
  }
  const migrationCodes: string[] = [];
  console.warn = () => {};
  try {
    const migrationService = await PlayerProfileService.create(manifest, new MigrationSaveRejectingStorage(), {
      saveDelayMs: 60_000,
      reportTechnicalError: (code) => migrationCodes.push(code),
    });
    await migrationService.flush().catch(() => {});
  } finally {
    console.warn = originalWarn;
  }
  assert(migrationCodes.includes('profile_save_failed'), 'Immediate migrated-profile save failure is reported.');
}

async function main(): Promise<void> {
  const manifest = [entry(1), entry(2), entry(3), entry(4), entry(5), entry(6), entry(7)];

  const fresh = normalizePlayerProfile({ nonsense: true }, manifest);
  assert(fresh.schemaVersion === 4, 'Invalid profile input falls back to schema v4.');
  assert(Object.keys(fresh.campaign.drafts).length === 0, 'Fresh Campaign starts with no saved level drafts.');
  assert(!fresh.tutorial.completed, 'Fresh profile requires Tutorial before Campaign.');
  assert(fresh.tutorial.completedLevelIds.length === 0, 'Fresh Tutorial progress starts empty.');
  assert(fresh.tutorial.activePuzzle === null, 'Fresh Tutorial has no active puzzle.');
  assert(fresh.hints.freeRemaining === 3, 'Fresh profile grants exactly 3 free hints.');
  assert(fresh.hints.totalUsed === 0, 'Fresh profile starts with zero used hints.');
  assert(Object.keys(fresh.daily.drafts).length === 0, 'Fresh profile has no saved Daily drafts.');
  assert(fresh.daily.currentStreak === 0 && fresh.daily.bestStreak === 0, 'Fresh profile starts with empty Daily streaks.');
  assert(fresh.ads.campaignCompletionsSinceOpportunity === 0, 'Fresh profile starts with zero ad opportunity completions.');
  assert(fresh.totals.activePlayMs === 0, 'Fresh profile starts with zero active play time.');
  assert(fresh.settings.musicEnabled && fresh.settings.soundEnabled, 'Fresh settings enable music and sound.');
  assert(!('vibrationEnabled' in fresh.settings), 'Fresh settings no longer persist vibration.');
  assert(fresh.settings.language === 'ru', 'Fresh profile language defaults to ru.');


  const legacyCompletedTutorial = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    tutorial: {
      completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004'],
      completed: true,
      activePuzzle: null,
    },
  }, manifest);
  assert(
    legacyCompletedTutorial.tutorial.completedLevelIds.join(',')
      === 'tutorial-001,tutorial-002,tutorial-003,tutorial-004,tutorial-005',
    'A profile already marked Tutorial-complete under the four-level version migrates as all five levels complete.',
  );
  assert(legacyCompletedTutorial.tutorial.completed, 'Legacy four-level Tutorial completion remains permanently complete.');

  const legacyPartialTutorial = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    tutorial: {
      completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004'],
      completed: false,
      activePuzzle: null,
    },
  }, manifest);
  assert(
    legacyPartialTutorial.tutorial.completedLevelIds.join(',')
      === 'tutorial-001,tutorial-002,tutorial-003,tutorial-004',
    'A partial four-level Tutorial profile preserves only genuinely completed levels.',
  );
  assert(!legacyPartialTutorial.tutorial.completed, 'A partial old Tutorial profile still has Tutorial 5 to complete.');

  const normalized = normalizePlayerProfile({
    ...createFreshPlayerProfile(manifest),
    campaign: {
      completedLevelIds: ['campaign-002', 'unknown', 'campaign-002', 'campaign-001'],
      lastPlayedLevelId: 'unknown',
      levelResults: {
        'campaign-002': { bestTimeMs: 1200, minHintsUsed: 1, solveCount: 2, solvedWithoutHints: false },
        unknown: { bestTimeMs: 1, minHintsUsed: 0, solveCount: 1, solvedWithoutHints: true },
      },
      activePuzzle: null,
    },
  }, manifest);
  assert(
    normalized.campaign.completedLevelIds.join(',') === 'campaign-001,campaign-002',
    'Completed IDs are deduplicated, unknown IDs are dropped, and manifest order is preserved.',
  );
  assert(normalized.campaign.lastPlayedLevelId === null, 'Unknown last-played IDs are discarded.');
  assert(Object.keys(normalized.campaign.levelResults).join(',') === 'campaign-002', 'Unknown level result entries are discarded.');


  const v2Snapshot = {
    mode: 'campaign' as const,
    puzzleId: 'campaign-003',
    cells: [['unknown']],
    activePlayMs: 321,
    hintsUsed: 1,
    startedAtMs: 123,
  };
  const migratedV2 = normalizePlayerProfile({
    schemaVersion: 2,
    tutorial: createFreshPlayerProfile(manifest).tutorial,
    campaign: {
      completedLevelIds: ['campaign-001'],
      lastPlayedLevelId: 'campaign-003',
      levelResults: {},
      activePuzzle: v2Snapshot,
    },
    daily: createFreshPlayerProfile(manifest).daily,
    settings: createFreshPlayerProfile(manifest).settings,
    hints: createFreshPlayerProfile(manifest).hints,
    ads: createFreshPlayerProfile(manifest).ads,
    totals: createFreshPlayerProfile(manifest).totals,
  }, manifest);
  assert(migratedV2.schemaVersion === 4, 'Schema v2 profile migrates to current schema v4.');
  assert(
    migratedV2.campaign.drafts['campaign-003']?.activePlayMs === 321,
    'Schema v2 active Campaign puzzle migrates into the matching per-level draft.',
  );

  const migrated = migrateLegacyCampaignProgress({
    schemaVersion: 1,
    highestUnlockedSlot: 4,
    completedLevelIds: ['campaign-001', 'campaign-002', 'unknown'],
    lastPlayedLevelId: 'campaign-003',
  }, manifest);
  assert(
    migrated.campaign.completedLevelIds.join(',') === 'campaign-001,campaign-002',
    'Legacy completed IDs migrate into the unified profile.',
  );
  assert(migrated.campaign.lastPlayedLevelId === 'campaign-003', 'Legacy last-played level migrates when it is known.');
  assert(migrated.hints.freeRemaining === 3, 'Legacy migration still receives fresh meta defaults.');
  assert(migrated.tutorial.completed, 'Legacy campaign progress migrates as Tutorial-complete.');

  const untouchedV1 = normalizePlayerProfile({
    schemaVersion: 1,
    campaign: { completedLevelIds: [], lastPlayedLevelId: null, levelResults: {}, activePuzzle: null },
    daily: createFreshPlayerProfile(manifest).daily,
    settings: createFreshPlayerProfile(manifest).settings,
    hints: createFreshPlayerProfile(manifest).hints,
    ads: createFreshPlayerProfile(manifest).ads,
    totals: createFreshPlayerProfile(manifest).totals,
  }, manifest);
  assert(!untouchedV1.tutorial.completed, 'Untouched v1 profile remains subject to Tutorial gate.');

  const lastPlayedV1 = normalizePlayerProfile({
    ...untouchedV1,
    schemaVersion: 1,
    tutorial: undefined,
    campaign: { ...untouchedV1.campaign, lastPlayedLevelId: 'campaign-001' },
  }, manifest);
  assert(lastPlayedV1.tutorial.completed, 'Legacy non-null campaign lastPlayedLevelId marks Tutorial complete.');

  const activeCampaignV1 = normalizePlayerProfile({
    ...untouchedV1,
    schemaVersion: 1,
    tutorial: undefined,
    campaign: {
      ...untouchedV1.campaign,
      activePuzzle: {
        mode: 'campaign',
        puzzleId: 'campaign-001',
        cells: [['unknown']],
        activePlayMs: 0,
        hintsUsed: 0,
        startedAtMs: 0,
      },
    },
  }, manifest);
  assert(activeCampaignV1.tutorial.completed, 'Legacy active Campaign puzzle marks Tutorial complete.');
  assert(activeCampaignV1.campaign.drafts['campaign-001']?.puzzleId === 'campaign-001', 'Legacy v1 active Campaign puzzle migrates into a per-level draft.');

  class MemoryKeyValueStorage {
    readonly values = new Map<string, string>();
    getItem(key: string): string | null { return this.values.get(key) ?? null; }
    setItem(key: string, value: string): void { this.values.set(key, value); }
  }

  const kv = new MemoryKeyValueStorage();
  kv.setItem('dungeon-logic:campaign-progress:v1', JSON.stringify({
    schemaVersion: 1,
    highestUnlockedSlot: 3,
    completedLevelIds: ['campaign-001', 'campaign-002'],
    lastPlayedLevelId: 'campaign-003',
  }));
  const localStorage = new LocalPlayerProfileStorage(kv);
  assert(await localStorage.load() === null, 'New profile key is initially absent.');
  const legacyRaw = await localStorage.loadLegacyCampaignProgress();
  assert(legacyRaw !== null, 'Legacy campaign progress can be read for one-time migration.');

  class CountingStorage implements PlayerProfileStorage {
    raw: unknown = null;
    legacy: unknown = null;
    saves: PlayerProfileV4[] = [];

    async load(): Promise<unknown | null> { return this.raw; }
    async loadLegacyCampaignProgress(): Promise<unknown | null> { return this.legacy; }
    async save(profile: PlayerProfileV4): Promise<void> {
      this.raw = profile;
      this.saves.push(profile);
    }
  }

  const migrationStorage = new CountingStorage();
  migrationStorage.legacy = legacyRaw;
  const migratedService = await PlayerProfileService.create(manifest, migrationStorage, { saveDelayMs: 5 });
  assert(migratedService.getProfile().campaign.lastPlayedLevelId === 'campaign-003', 'Service migrates legacy progress when no unified profile exists.');
  assert(migrationStorage.saves.length === 1, 'One-time legacy migration persists the new profile immediately.');

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

  assert(kv.getItem(PLAYER_PROFILE_STORAGE_KEY) === null, 'Direct local storage object does not invent a new profile before service migration persists it.');

  await runTechnicalErrorReportingChecks(manifest);

  console.info('[Dungeon Logic] Player profile sanity: defaults + normalization + legacy migration + coalesced persistence passed');
}

void main();
