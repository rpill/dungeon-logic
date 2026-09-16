import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { EndlessService } from '../endless/EndlessService';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileV5 } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryStorage implements PlayerProfileStorage {
  raw: unknown;

  constructor(raw: unknown = null) {
    this.raw = raw;
  }

  async load(): Promise<unknown | null> {
    return this.raw;
  }

  async save(profile: PlayerProfileV5): Promise<void> {
    this.raw = structuredClone(profile);
  }
}

function level(index: number): LevelDefinition {
  return {
    id: `endless-test-${index}`,
    width: 1,
    height: 1,
    rowClues: [0],
    columnClues: [0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: ['.'],
  };
}

function fakeCatalog(length: number): EndlessCatalog {
  return {
    length,
    get(index) {
      if (!Number.isInteger(index) || index < 0 || index >= length) throw new RangeError('bad index');
      return {
        seed: index + 1,
        archetype: 'monster-only',
        size: 6,
        difficultyScore: 10,
        difficultyBand: 'easy',
      };
    },
    createLevel(index) {
      if (!Number.isInteger(index) || index < 0 || index >= length) throw new RangeError('bad index');
      return level(index);
    },
  };
}

async function main(): Promise<void> {
  const fresh = createFreshPlayerProfile();
  assert(fresh.schemaVersion === 5, 'Fresh profile must use schema v5.');
  assert(fresh.endless.ordinal === 0, 'Fresh Endless must begin at ordinal 0.');
  assert(fresh.endless.completed === 0, 'Fresh Endless must have no completions.');
  assert(fresh.endless.activePuzzle === null, 'Fresh Endless must have no active draft.');

  const legacyV4 = {
    ...fresh,
    schemaVersion: 4,
  } as Record<string, unknown>;
  delete legacyV4.endless;
  const migrated = await PlayerProfileService.create([], new MemoryStorage(legacyV4), { saveDelayMs: 60_000 });
  assert(migrated.getProfile().schemaVersion === 5, 'Schema v4 must migrate to v5.');
  assert(migrated.getProfile().endless.ordinal === 0, 'Migrated v4 profile must start Endless at ordinal 0.');

  const storage = new MemoryStorage();
  const profile = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const endless = EndlessService.create(fakeCatalog(3), profile);
  const first = endless.beginCurrent();
  assert(first !== null && first.ordinal === 0 && first.attempt === 'new', 'First Endless launch must be ordinal 0/new.');

  const session = PuzzleSessionService.createEndless(first.level, profile, first.savedPuzzle, 1000);
  const firstSnapshot = session.saveNow();
  assert(profile.getProfile().endless.activePuzzle?.mode === 'endless', 'Endless session must persist under endless.activePuzzle.');

  const resumed = endless.beginCurrent();
  assert(resumed?.attempt === 'resume', 'Compatible Endless draft must resume.');
  const roundTrip = PuzzleSessionService.createEndless(resumed!.level, profile, resumed!.savedPuzzle, 2000);
  assert(roundTrip.snapshot().puzzleId === firstSnapshot.puzzleId, 'Endless draft must round-trip through PuzzleSessionService.');

  session.clearActivePuzzle();
  session.saveNow();
  assert(profile.getProfile().endless.activePuzzle === null, 'A sealed Endless session must not resurrect its cleared draft.');

  const firstCompletion = await endless.completeCurrent(0);
  assert(firstCompletion.persisted, 'Endless completion should persist with in-memory storage.');
  assert(firstCompletion.next?.ordinal === 1, 'Completing ordinal 0 must advance to ordinal 1.');
  assert(profile.getProfile().endless.ordinal === 1, 'Profile must advance Endless ordinal.');
  assert(profile.getProfile().endless.completed === 1, 'Profile must count the completed Endless puzzle.');
  assert(profile.getProfile().endless.activePuzzle === null, 'Completion must leave no stale Endless draft.');

  profile.update((current) => ({
    ...current,
    endless: { ordinal: 2, completed: 2, activePuzzle: null },
  }));
  const terminal = await endless.completeCurrent(2);
  assert(terminal.catalogComplete, 'Last catalog puzzle must produce terminal completion.');
  assert(terminal.next === null, 'Last catalog puzzle must not wrap to ordinal 0.');
  assert(profile.getProfile().endless.ordinal === 2, 'Terminal profile ordinal must remain on the last catalog entry.');
  assert(profile.getProfile().endless.completed === 3, 'Terminal completion must count the full catalog.');
  assert(endless.beginCurrent() === null, 'Completed catalog must not start again from the beginning.');

  console.info('[Dungeon Logic] Endless runtime sanity: schema + migration + draft roundtrip + sealing + progression + terminal passed');
}

void main();
