import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { EndlessService } from '../endless/EndlessService';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfile } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
class MemoryStorage implements PlayerProfileStorage {
  private raw: unknown;
  constructor(raw: unknown = null) { this.raw = raw; }
  async load(): Promise<unknown | null> { return this.raw; }
  async save(profile: PlayerProfile): Promise<void> { this.raw = structuredClone(profile); }
}
function level(index: number): LevelDefinition {
  return { id: `endless-clean-${index}`, width: 1, height: 1, rowClues: [0], columnClues: [0], monsters: [], chests: [], blockers: [], doors: [], solution: ['.'] };
}
const catalog: EndlessCatalog = {
  length: 4,
  get(index) { return { seed: index + 1, archetype: 'monster-only', size: 6, difficultyScore: 1, difficultyBand: 'easy' }; },
  createLevel(index) { return level(index); },
};

async function main(): Promise<void> {
  const storage = new MemoryStorage(createFreshPlayerProfile());
  const profile = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const endless = EndlessService.create(catalog, profile);

  let launch = endless.beginCurrent();
  const first = await endless.completeCurrent(launch.catalogIndex, 0);
  assert(first.currentStreak === 1 && first.bestStreak === 1, 'First ranked solve must start streak 1 / best 1.');

  launch = endless.beginCurrent();
  const second = await endless.completeCurrent(launch.catalogIndex, 0);
  assert(second.currentStreak === 2 && second.bestStreak === 2, 'Second ranked solve must advance streak 2 / best 2.');

  launch = endless.beginCurrent();
  const assisted = await endless.completeCurrent(launch.catalogIndex, 1);
  assert(assisted.currentStreak === 3 && assisted.bestStreak === 3, 'Hint-assisted solve must continue the streak because hints are allowed.');

  launch = endless.beginCurrent();
  const fourth = await endless.completeCurrent(launch.catalogIndex, 0);
  assert(fourth.currentStreak === 4 && fourth.bestStreak === 4, 'Solve after a hinted solve must keep advancing the same streak.');
  await profile.flush();
  console.info('[Dungeon Logic] Endless streak sanity: PASS');
}
void main();
