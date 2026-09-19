import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { EndlessService } from '../endless/EndlessService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfile } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryStorage implements PlayerProfileStorage {
  private raw: unknown;
  constructor(raw: unknown = null) { this.raw = raw; }
  async load(): Promise<unknown | null> { return this.raw; }
  async save(profile: PlayerProfile): Promise<void> { this.raw = structuredClone(profile); }
}

const level: LevelDefinition = {
  id: 'endless-clean-test',
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

const catalog: EndlessCatalog = {
  length: 1,
  get() {
    return { seed: 1, archetype: 'monster-only', size: 6, difficultyScore: 1, difficultyBand: 'easy' };
  },
  createLevel() { return level; },
};

async function main(): Promise<void> {
  const storage = new MemoryStorage(createFreshPlayerProfile());
  const profile = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const endless = EndlessService.create(catalog, profile);

  const first = await endless.completeCurrent(0, 0);
  assert(first.currentCleanStreak === 1 && first.bestCleanStreak === 1, 'First clean solve must start clean streak 1 / best 1.');

  const second = await endless.completeCurrent(1, 0);
  assert(second.currentCleanStreak === 2 && second.bestCleanStreak === 2, 'Second clean solve must advance clean streak 2 / best 2.');

  const assisted = await endless.completeCurrent(2, 1);
  assert(assisted.currentCleanStreak === 0 && assisted.bestCleanStreak === 2, 'Hint-assisted solve must reset current streak without lowering best.');

  const fourth = await endless.completeCurrent(3, 0);
  assert(fourth.currentCleanStreak === 1 && fourth.bestCleanStreak === 2, 'Clean solve after reset must restart current streak while preserving best.');

  console.info('[Dungeon Logic] Endless clean streak sanity: PASS');
}

void main();
