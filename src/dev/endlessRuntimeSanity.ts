import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { ENDLESS_RETRY_INTERVAL, EndlessService } from '../endless/EndlessService';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfile } from '../profile/types';
import type { LevelDefinition } from '../puzzle/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryStorage implements PlayerProfileStorage {
  raw: unknown;
  constructor(raw: unknown = null) { this.raw = raw; }
  async load(): Promise<unknown | null> { return this.raw; }
  async save(profile: PlayerProfile): Promise<void> { this.raw = structuredClone(profile); }
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
  const bands = ['easy', 'medium', 'hard', 'expert'] as const;
  return {
    length,
    get(index) {
      if (!Number.isInteger(index) || index < 0 || index >= length) throw new RangeError('bad index');
      return {
        seed: index + 1,
        archetype: 'monster-only',
        size: 6,
        difficultyScore: 10 + index,
        difficultyBand: bands[index % bands.length]!,
      };
    },
    createLevel(index) {
      if (!Number.isInteger(index) || index < 0 || index >= length) throw new RangeError('bad index');
      return level(index);
    },
  };
}

async function main(): Promise<void> {
  const storage = new MemoryStorage();
  const profile = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const endless = EndlessService.create(fakeCatalog(15), profile);

  const first = endless.beginCurrent();
  assert(first.catalogIndex === 0 && first.kind === 'fresh' && first.ranked, 'Ranked Endless must start at catalog index 0.');
  const session = PuzzleSessionService.createEndless(first.level, profile, first.savedPuzzle, 1000);
  session.saveNow();
  const resumed = endless.beginCurrent();
  assert(resumed.catalogIndex === 0 && resumed.attempt === 'resume', 'Reload must resume the exact active catalog entry and draft.');
  session.clearActivePuzzle();

  const firstResult = await endless.completeCurrent(0, 3);
  assert(firstResult.ratingAward === 2, 'Hints must not reduce Easy Master Rating reward.');
  assert(profile.getProfile().mastery.rating === 1002, 'Easy solve must add +2 to hidden Master Rating.');
  assert(profile.getProfile().endless.currentCleanStreak === 0, 'Hint-assisted solve still resets clean streak independently of rating.');

  let launch = endless.beginCurrent();
  assert(launch.catalogIndex === 1 && launch.kind === 'fresh', 'Fresh progression must use the next packed catalog index.');
  await endless.skipCurrent(1);
  assert(profile.getProfile().endless.skipped.join(',') === '1', 'Skip must queue the unsolved catalog index.');
  assert(profile.getProfile().mastery.rating === 1002, 'Skip must award +0 rating.');
  assert(profile.getProfile().endless.currentCleanStreak === 0, 'Ranked Skip must reset current clean streak.');

  for (let solved = 0; solved < ENDLESS_RETRY_INTERVAL; solved += 1) {
    launch = endless.beginCurrent();
    assert(launch.kind === 'fresh', `Skipped retry must wait for ${ENDLESS_RETRY_INTERVAL} fresh solves.`);
    assert(launch.catalogIndex === 2 + solved, 'Fresh ranked catalog indices must never repeat or jump.');
    await endless.completeCurrent(launch.catalogIndex, 0);
  }

  launch = endless.beginCurrent();
  assert(launch.kind === 'retry' && launch.catalogIndex === 1, 'Oldest skipped puzzle must return after 10 fresh solves.');
  await endless.skipCurrent(1);
  assert(profile.getProfile().endless.skipped.join(',') === '1', 'Re-skipping a retry must rotate it without duplicating the queue.');

  launch = endless.beginCurrent();
  assert(launch.kind === 'fresh' && launch.catalogIndex === 12, 'Re-skipping must resume unseen catalog progression when fresh entries remain.');
  await endless.completeCurrent(12, 0);
  await endless.completeCurrent(endless.beginCurrent().catalogIndex, 0);
  await endless.completeCurrent(endless.beginCurrent().catalogIndex, 0);

  launch = endless.beginCurrent();
  assert(launch.kind === 'retry' && launch.catalogIndex === 1, 'After fresh catalog exhaustion, pending skips must be forced immediately.');
  const finalRanked = await endless.completeCurrent(1, 0);
  assert(finalRanked.catalogComplete, 'Catalog completes only after the final skipped puzzle is actually solved.');
  assert(finalRanked.completed === 15, 'Every one of the 15 unique catalog entries must be solved exactly once.');

  const free = endless.beginCurrent();
  assert(free.kind === 'freeplay' && !free.ranked && free.catalogIndex === 0, 'Full catalog completion must unlock Free Play from catalog index 0.');
  const ratingBeforeFree = profile.getProfile().mastery.rating;
  const bestBeforeFree = profile.getProfile().endless.bestCleanStreak;
  const freeResult = await endless.completeCurrent(0, 0);
  assert(freeResult.ratingAward === 0 && profile.getProfile().mastery.rating === ratingBeforeFree, 'Free Play must never award Master Rating.');
  assert(profile.getProfile().endless.bestCleanStreak === bestBeforeFree, 'Free Play must not farm ranked clean-streak records.');
  assert(endless.beginCurrent().catalogIndex === 1, 'Free Play must cycle through catalog entries after completion.');
  const freeSkip = endless.beginCurrent();
  const ratingBeforeFreeSkip = profile.getProfile().mastery.rating;
  const bestBeforeFreeSkip = profile.getProfile().endless.bestCleanStreak;
  await endless.skipCurrent(freeSkip.catalogIndex);
  assert(profile.getProfile().mastery.rating === ratingBeforeFreeSkip, 'Free Play Skip must never change Master Rating.');
  assert(profile.getProfile().endless.bestCleanStreak === bestBeforeFreeSkip, 'Free Play Skip must never change ranked clean-streak records.');
  assert(endless.beginCurrent().catalogIndex === 2, 'Free Play Skip must advance to the next catalog entry.');
  await profile.flush();

  const queueStorage = new MemoryStorage();
  const queueProfile = await PlayerProfileService.create([], queueStorage, { saveDelayMs: 60_000 });
  const queueEndless = EndlessService.create(fakeCatalog(25), queueProfile);
  await queueEndless.skipCurrent(queueEndless.beginCurrent().catalogIndex);
  for (let solved = 0; solved < 5; solved += 1) {
    const fresh = queueEndless.beginCurrent();
    assert(fresh.kind === 'fresh' && fresh.catalogIndex === 1 + solved, 'First skipped puzzle must wait while fresh solves accumulate.');
    await queueEndless.completeCurrent(fresh.catalogIndex, 0);
  }
  const secondSkip = queueEndless.beginCurrent();
  assert(secondSkip.kind === 'fresh' && secondSkip.catalogIndex === 6, 'Second skipped puzzle must still be a fresh unseen catalog entry.');
  await queueEndless.skipCurrent(secondSkip.catalogIndex);
  assert(queueProfile.getProfile().endless.skipped.join(',') === '0,6', 'Multiple ranked skips must preserve FIFO order without duplicates.');
  for (let solved = 0; solved < 5; solved += 1) {
    const fresh = queueEndless.beginCurrent();
    assert(fresh.kind === 'fresh' && fresh.catalogIndex === 7 + solved, 'A later fresh Skip must not reset the ten-solved cadence for the oldest skipped puzzle.');
    await queueEndless.completeCurrent(fresh.catalogIndex, 0);
  }
  const retry = queueEndless.beginCurrent();
  assert(retry.kind === 'retry' && retry.catalogIndex === 0, 'Oldest of multiple skipped puzzles must return after ten total fresh solves, even if another fresh puzzle was skipped meanwhile.');
  const retrySession = PuzzleSessionService.createEndless(retry.level, queueProfile, retry.savedPuzzle, 2000);
  retrySession.saveNow();
  const resumedRetry = queueEndless.beginCurrent();
  assert(resumedRetry.kind === 'retry' && resumedRetry.catalogIndex === 0 && resumedRetry.attempt === 'resume', 'Reload while a retry is active must resume the same skipped puzzle and draft.');
  retrySession.clearActivePuzzle();
  await queueEndless.completeCurrent(0, 0);
  assert(queueProfile.getProfile().endless.skipped.join(',') === '6', 'Solving a retry must remove only that skipped index.');
  const afterRetry = queueEndless.beginCurrent();
  assert(afterRetry.kind === 'fresh' && afterRetry.catalogIndex === 12, 'Solving a retry must reset cadence and resume unseen catalog progression.');
  await queueProfile.flush();

  console.info('[Dungeon Logic] Endless runtime sanity: unique ranked catalog + skip retry + Free Play passed');
}

void main();
