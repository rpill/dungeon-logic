import { DAILY_PRODUCTION_ENTRIES as DAILY_RELEASE_ENTRIES } from './DailyProductionCatalog';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { CellState } from '../puzzle/types';

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
  assert(fresh.schemaVersion === 1, 'Fresh profile must use the single pre-release schema v1.');
  assert(Object.keys(fresh.daily.drafts).length === 0, 'Fresh Daily profile starts with no per-date drafts.');

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

  console.info('[Dungeon Logic] Daily drafts sanity: independent per-date persistence passed');
}

void main();
