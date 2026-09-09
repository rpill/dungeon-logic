import { CampaignService } from '../campaign/CampaignService';
import {
  getCampaignContinueEntry,
  getCampaignLevelState,
  shouldShowCampaignOnboarding,
} from '../campaign/CampaignProgress';
import {
  campaignManifest,
  validateCampaignManifest,
} from '../content/campaign/manifest';
import { promotedCampaignLevels } from '../content/campaign/levels';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV2 } from '../profile/types';
import { CellState, type LevelDefinition } from '../puzzle/types';
import { PuzzleState } from '../puzzle/PuzzleState';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { solveLevel } from '../puzzle/solver/PuzzleSolver';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { HumanSolveStatus } from '../puzzle/human-solver/types';
import { analyzeDifficulty } from '../puzzle/difficulty/DifficultyAnalyzer';
import { DifficultyBand } from '../puzzle/difficulty/types';
import { analyzeLevelQuality } from '../puzzle/quality/LevelQualityAnalyzer';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fixtureLevel(id: string): LevelDefinition {
  return {
    id,
    width: 2,
    height: 2,
    rowClues: [0, 0],
    columnClues: [0, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: ['..', '..'],
  };
}

function createSyntheticManifest(count: number): readonly CampaignLevelEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const slot = index + 1;
    const id = `campaign-${String(slot).padStart(3, '0')}`;
    return {
      slot,
      id,
      level: fixtureLevel(id),
      chapterId: 'graveyard',
      onboarding: slot === 1
        ? ['row-column-clues', 'monster-dead-end']
        : slot === 2
          ? ['treasure-room-rule']
          : [],
    } satisfies CampaignLevelEntry;
  });
}

const selectorManifest = createSyntheticManifest(14);
const freshProgress = {
  completedLevelIds: [],
  lastPlayedLevelId: null,
} as const;
assert(getCampaignLevelState(selectorManifest[0], freshProgress, selectorManifest) === 'current', 'Fresh progression marks 001 current.');
assert(getCampaignLevelState(selectorManifest[1], freshProgress, selectorManifest) === 'locked', 'Fresh progression locks 002.');
assert(shouldShowCampaignOnboarding(selectorManifest[0], freshProgress), 'Slot 1 onboarding shows before completion.');

const afterOne = {
  completedLevelIds: ['campaign-001'],
  lastPlayedLevelId: 'campaign-001',
} as const;
assert(getCampaignLevelState(selectorManifest[0], afterOne, selectorManifest) === 'completed', 'Completed level is replayable/completed.');
assert(getCampaignLevelState(selectorManifest[1], afterOne, selectorManifest) === 'current', 'Completing 001 advances strict onboarding to 002.');
assert(!shouldShowCampaignOnboarding(selectorManifest[0], afterOne), 'Replay hides completed onboarding.');
assert(shouldShowCampaignOnboarding(selectorManifest[1], afterOne), 'Treasure Room onboarding appears on slot 2.');
assert(getCampaignContinueEntry(afterOne, selectorManifest)?.id === 'campaign-002', 'Continue chooses the next unsolved onboarding level.');

let duplicateRejected = false;
try {
  validateCampaignManifest([selectorManifest[0], { ...selectorManifest[1], slot: 1 }]);
} catch {
  duplicateRejected = true;
}
assert(duplicateRejected, 'Duplicate campaign slots are rejected.');

function puzzleFromCanonicalSolution(level: LevelDefinition): PuzzleState {
  const puzzle = new PuzzleState(level);
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (puzzle.isFixedCell(x, y)) continue;
      puzzle.setCellState(
        x,
        y,
        level.solution[y][x] === '#' ? CellState.Wall : CellState.Floor,
      );
    }
  }
  return puzzle;
}

function runReleaseContentChecks(): void {
  assert(campaignManifest.length === 30, 'Release manifest contains exactly 30 promoted levels.');
  assert(
    campaignManifest.every((entry, index) => entry.id === `campaign-${String(index + 1).padStart(3, '0')}`),
    'Release ids are contiguous campaign-001 through campaign-030.',
  );
  assert(
    campaignManifest.slice(0, 6).every((entry) => entry.chapterId === 'graveyard')
      && campaignManifest.slice(6, 13).every((entry) => entry.chapterId === 'desert-ruins')
      && campaignManifest.slice(13, 22).every((entry) => entry.chapterId === 'sewers')
      && campaignManifest.slice(22, 30).every((entry) => entry.chapterId === 'crypt'),
    'Release manifest follows the four technical visual chapter ranges.',
  );
  assert(
    campaignManifest[0].onboarding.join(',') === 'row-column-clues,monster-dead-end',
    'Slot 1 owns row/column and monster-dead-end onboarding.',
  );
  assert(
    campaignManifest[1].onboarding.join(',') === 'treasure-room-rule',
    'Slot 2 owns Treasure Room onboarding.',
  );
  assert(
    campaignManifest.slice(2).every((entry) => entry.onboarding.length === 0),
    'Slots 3-30 introduce no additional legacy onboarding cards.',
  );

  for (const source of promotedCampaignLevels) {
    const level = source.level;
    const validation = validatePuzzle(puzzleFromCanonicalSolution(level));
    assert(validation.isSolved, `${level.id} canonical solution passes LevelValidator.`);

    const solve = solveLevel(level);
    assert(solve.solutionCount === 1, `${level.id} remains uniquely solvable.`);

    const human = analyzeHumanSolvability(level);
    assert(
      human.status === HumanSolveStatus.SolvedDirect
        || human.status === HumanSolveStatus.SolvedWithContradiction,
      `${level.id} remains human-solvable.`,
    );

    const difficulty = analyzeDifficulty(level, human);
    assert(
      difficulty.band !== DifficultyBand.Unrated && difficulty.score !== null,
      `${level.id} remains difficulty-rated.`,
    );

    const quality = analyzeLevelQuality(level);
    assert(quality.passes, `${level.id} passes LevelQualityAnalyzer.`);
    assert(quality.warnings.length === 0, `${level.id} has no geometry warnings.`);
    assert(level.blockers.length === 0, `${level.id} contains no Blockers.`);
    assert(level.doors.length === 0, `${level.id} contains no Directional Doors.`);
  }
}

runReleaseContentChecks();

class FakeProfileStorage implements PlayerProfileStorage {
  value: PlayerProfileV2 | null = null;
  failSave = false;
  saveCalls = 0;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV2): Promise<void> {
    this.saveCalls += 1;
    if (this.failSave) throw new Error('save failed');
    this.value = profile;
  }
}

async function assertRejects(action: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  assert(rejected, message);
}

async function createService(
  manifest: readonly CampaignLevelEntry[],
  storage = new FakeProfileStorage(),
): Promise<{ service: CampaignService; profile: PlayerProfileService; storage: FakeProfileStorage }> {
  const profile = await PlayerProfileService.create(manifest, storage, { saveDelayMs: 60_000 });
  profile.update((current) => ({
    ...current,
    tutorial: {
      ...current.tutorial,
      completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004', 'tutorial-005'],
      completed: true,
    },
  }));
  return {
    service: CampaignService.create(manifest, profile),
    profile,
    storage,
  };
}

async function runServiceChecks(): Promise<void> {
  const harness = await createService(selectorManifest);
  const { service, profile } = harness;

  assert(service.getPlayableLevels().map((entry) => entry.id).join(',') === 'campaign-001', 'Fresh service exposes only 001.');
  await assertRejects(
    () => service.startLevel('campaign-002'),
    'Locked onboarding level cannot be started.',
  );

  await service.startLevel('campaign-001');
  assert(service.getProgress().lastPlayedLevelId === 'campaign-001', 'Starting playable level updates profile last-played state in memory.');

  for (let slot = 1; slot <= 5; slot += 1) {
    const id = `campaign-${String(slot).padStart(3, '0')}`;
    await service.completeLevel(id);
  }
  assert(
    service.getPlayableLevels().filter((entry) => !service.getProgress().completedLevelIds.includes(entry.id)).map((entry) => entry.id).join(',')
      === 'campaign-006,campaign-007',
    'After onboarding, both promoted I-frontier levels are available.',
  );

  const thresholdResult = await service.completeLevel('campaign-006');
  assert(thresholdResult.unlockedManuscript?.id === 'manuscript-ii', 'Six solved in Manuscript I unlock Manuscript II exactly once.');
  assert(service.canPlayLevel('campaign-009'), '09 is playable without completing 08 once Manuscript II is unlocked.');

  await service.startLevel('campaign-009');
  const nineResult = await service.completeLevel('campaign-009', {
    bestTimeMs: 12_000,
    minHintsUsed: 0,
    solveCount: 1,
    solvedWithoutHints: true,
  });
  assert(
    nineResult.recommendedNextLevel?.id === 'campaign-008',
    'Completing 09 recommends another unsolved playable level from the same manuscript instead of requiring 08 first.',
  );
  assert(
    service.getProgress().completedLevelIds.filter((id) => id === 'campaign-009').length === 1,
    '09 is recorded once.',
  );

  await service.completeLevel('campaign-009', {
    bestTimeMs: 10_000,
    minHintsUsed: 1,
    solveCount: 1,
    solvedWithoutHints: false,
  });
  assert(
    service.getProgress().completedLevelIds.filter((id) => id === 'campaign-009').length === 1,
    'Replay completion never duplicates completed ids.',
  );
  const result = profile.getProfile().campaign.levelResults['campaign-009'];
  assert(result?.bestTimeMs === 10_000, 'Replay metadata keeps the best time.');
  assert(result?.minHintsUsed === 0, 'Replay metadata keeps the minimum hint count.');
  assert(result?.solveCount === 2, 'Replay metadata increments solve count.');
  assert(result?.solvedWithoutHints, 'No-hint achievement is sticky across replays.');

  const failingStorage = new FakeProfileStorage();
  failingStorage.failSave = true;
  const failingHarness = await createService(selectorManifest, failingStorage);
  const failure = await failingHarness.service.completeLevel('campaign-001');
  assert(!failure.persisted, 'Completion reports persisted=false when profile flush fails.');
  assert(
    failingHarness.service.getProgress().completedLevelIds.join(',') === 'campaign-001',
    'Flush failure keeps completion in memory for later retry.',
  );
}

runServiceChecks().then(
  () => console.info('[Dungeon Logic] Campaign sanity: profile-backed nonlinear progression checks passed'),
  (error) => {
    console.error(error);
    (globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1;
  },
);
