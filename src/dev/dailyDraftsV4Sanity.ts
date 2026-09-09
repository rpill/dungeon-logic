import { DAILY_RELEASE_ENTRIES } from '../content/daily/manifest';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { createFreshPlayerProfile, normalizePlayerProfile } from '../profile/PlayerProfile';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryStorage implements PlayerProfileStorage {
  value: unknown = null;
  async load(): Promise<unknown | null> { return this.value; }
  async save(profile: unknown): Promise<void> { this.value = profile; }
}

async function main(): Promise<void> {
  const fresh = createFreshPlayerProfile([]);
  assert(fresh.schemaVersion === 4, 'Fresh profile must use schema v4.');
  assert(Object.keys(fresh.daily.drafts).length === 0, 'Fresh Daily profile starts with no per-date drafts.');

  const legacyCells: CellStateValue[][] = DAILY_RELEASE_ENTRIES[0].level.solution.map((row) => [...row].map(() => CellState.Unknown));
  const legacySnapshot = {
    mode: 'daily' as const,
    puzzleId: 'daily-001',
    cells: legacyCells,
    activePlayMs: 321,
    hintsUsed: 1,
    startedAtMs: Date.parse('2026-09-09T12:00:00.000Z'),
  };
  for (const monster of DAILY_RELEASE_ENTRIES[0].level.monsters) legacySnapshot.cells[monster.y][monster.x] = CellState.Floor;
  for (const chest of DAILY_RELEASE_ENTRIES[0].level.chests) legacySnapshot.cells[chest.y][chest.x] = CellState.Floor;
  for (const blocker of DAILY_RELEASE_ENTRIES[0].level.blockers) legacySnapshot.cells[blocker.y][blocker.x] = CellState.Floor;
  for (const door of DAILY_RELEASE_ENTRIES[0].level.doors) legacySnapshot.cells[door.position.y][door.position.x] = CellState.Floor;

  const legacySeed = fresh as unknown as Record<string, unknown>;
  const normalized = normalizePlayerProfile({
    ...legacySeed,
    schemaVersion: 3,
    daily: {
      ...(fresh.daily as unknown as Record<string, unknown>),
      drafts: undefined,
      activePuzzle: legacySnapshot,
    },
  }, []);
  assert(normalized.schemaVersion === 4, 'Schema v3 profile must migrate to schema v4.');
  assert(
    normalized.daily.drafts['2026-09-09']?.puzzleId === 'daily-001',
    'Legacy Daily activePuzzle must migrate to the matching UTC-date draft.',
  );

  const storage = new MemoryStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const firstEntry = DAILY_RELEASE_ENTRIES[0];
  const secondEntry = DAILY_RELEASE_ENTRIES[1];
  const first = PuzzleSessionService.createDaily(
    firstEntry.level,
    profileService,
    firstEntry.dateKey,
    undefined,
    1000,
  );
  first.getPuzzle().setCellState(0, 0, CellState.Wall);
  first.saveNow();
  const second = PuzzleSessionService.createDaily(
    secondEntry.level,
    profileService,
    secondEntry.dateKey,
    undefined,
    2000,
  );
  second.getPuzzle().setCellState(0, 0, CellState.Wall);
  second.saveNow();

  assert(
    profileService.getProfile().daily.drafts[firstEntry.dateKey]?.puzzleId === firstEntry.id,
    'Saving a Daily stores its draft under its UTC date.',
  );
  assert(
    profileService.getProfile().daily.drafts[secondEntry.dateKey]?.puzzleId === secondEntry.id,
    'A second Daily gets an independent per-date draft.',
  );
  second.clearActivePuzzle();
  assert(
    profileService.getProfile().daily.drafts[secondEntry.dateKey] === undefined,
    'Clearing one Daily removes only that date draft.',
  );
  assert(
    profileService.getProfile().daily.drafts[firstEntry.dateKey]?.puzzleId === firstEntry.id,
    'Clearing one Daily preserves drafts for other dates.',
  );
  await profileService.flush();

  console.info('[Dungeon Logic] Daily drafts v4 sanity: migration + independent per-date persistence passed');
}

void main();
