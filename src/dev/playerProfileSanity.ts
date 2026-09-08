import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  createFreshPlayerProfile,
  migrateLegacyCampaignProgress,
  normalizePlayerProfile,
} from '../profile/PlayerProfile';
import { LocalPlayerProfileStorage, PLAYER_PROFILE_STORAGE_KEY } from '../profile/LocalPlayerProfileStorage';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV1 } from '../profile/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function entry(slot: number): CampaignLevelEntry {
  const id = `campaign-${String(slot).padStart(3, '0')}`;
  return {
    slot,
    id,
    chapterId: 'graveyard',
    onboarding: [],
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

async function main(): Promise<void> {
  const manifest = [entry(1), entry(2), entry(3), entry(4), entry(5), entry(6), entry(7)];

  const fresh = normalizePlayerProfile({ nonsense: true }, manifest);
  assert(fresh.schemaVersion === 1, 'Invalid profile input falls back to schema v1.');
  assert(fresh.hints.freeRemaining === 3, 'Fresh profile grants exactly 3 free hints.');
  assert(fresh.hints.totalUsed === 0, 'Fresh profile starts with zero used hints.');
  assert(fresh.daily.currentStreak === 0 && fresh.daily.bestStreak === 0, 'Fresh profile starts with empty Daily streaks.');
  assert(fresh.ads.campaignCompletionsSinceOpportunity === 0, 'Fresh profile starts with zero ad opportunity completions.');
  assert(fresh.totals.activePlayMs === 0, 'Fresh profile starts with zero active play time.');
  assert(fresh.settings.musicEnabled && fresh.settings.soundEnabled && fresh.settings.vibrationEnabled, 'Fresh settings enable music, sound, and vibration.');
  assert(fresh.settings.language === 'ru', 'Fresh profile language defaults to ru.');

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
  assert(migrated.hints.freeRemaining === 3, 'Legacy migration still receives fresh v1 meta defaults.');

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
    saves: PlayerProfileV1[] = [];

    async load(): Promise<unknown | null> { return this.raw; }
    async loadLegacyCampaignProgress(): Promise<unknown | null> { return this.legacy; }
    async save(profile: PlayerProfileV1): Promise<void> {
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

  const replacement = createFreshPlayerProfile(manifest);
  service.replaceProfileForPlatformMerge({
    ...replacement,
    hints: { freeRemaining: 1, totalUsed: 9 },
  });
  assert(service.getProfile().hints.totalUsed === 9, 'Platform merge replacement updates memory immediately.');
  await service.flush();
  assert(counting.saves.at(-1)?.hints.totalUsed === 9, 'Platform merge replacement becomes persistable state.');

  assert(kv.getItem(PLAYER_PROFILE_STORAGE_KEY) === null, 'Direct local storage object does not invent a new profile before service migration persists it.');

  console.info('[Dungeon Logic] Player profile sanity: defaults + normalization + legacy migration + coalesced persistence passed');
}

void main();
