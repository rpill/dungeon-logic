import { CampaignService } from '../campaign/CampaignService';
import { getPlayableCampaignIds } from '../campaign/CampaignUnlocks';
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
import type { PlayerProfileV4 } from '../profile/types';
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
    } satisfies CampaignLevelEntry;
  });
}

const selectorManifest = createSyntheticManifest(14);
const rowGateManifest = createSyntheticManifest(24);
const firstRowAlmostComplete = Array.from({ length: 7 }, (_, index) =>
  `campaign-${String(index + 1).padStart(3, '0')}`
);
const playableBeforeRowClear = getPlayableCampaignIds(rowGateManifest, firstRowAlmostComplete);
assert(playableBeforeRowClear.includes('campaign-008'), 'Last unfinished level in the current row remains playable.');
assert(!playableBeforeRowClear.includes('campaign-009'), 'Next row stays locked until every level in the current row is complete.');
const firstRowComplete = [...firstRowAlmostComplete, 'campaign-008'];
const playableAfterRowClear = getPlayableCampaignIds(rowGateManifest, firstRowComplete);
assert(
  ['campaign-009', 'campaign-010', 'campaign-011'].every((id) => playableAfterRowClear.includes(id)),
  'Clearing all eight levels unlocks the three-level frontier in the next row.',
);
assert(!playableAfterRowClear.includes('campaign-012'), 'Next-row unlock still respects the three-level frontier.');
const legacyFutureCompletion = getPlayableCampaignIds(
  rowGateManifest,
  [...firstRowAlmostComplete, 'campaign-009'],
);
assert(legacyFutureCompletion.includes('campaign-009'), 'A previously completed later-row level remains replayable after the row gate migration.');
assert(!legacyFutureCompletion.includes('campaign-010'), 'Legacy later-row completion does not bypass the unfinished current-row gate.');
const freshProgress = {
  completedLevelIds: [],
  lastPlayedLevelId: null,
} as const;
assert(getCampaignLevelState(selectorManifest[0], freshProgress, selectorManifest) === 'current', 'Fresh progression marks 001 current.');
assert(getCampaignLevelState(selectorManifest[1], freshProgress, selectorManifest) === 'unlocked', 'Fresh progression exposes 002 in the first three.');
assert(getCampaignLevelState(selectorManifest[2], freshProgress, selectorManifest) === 'unlocked', 'Fresh progression exposes 003 in the first three.');
assert(getCampaignLevelState(selectorManifest[3], freshProgress, selectorManifest) === 'locked', 'Fresh progression locks 004 beyond the three-level frontier.');
assert(!shouldShowCampaignOnboarding(selectorManifest[0], freshProgress), 'Campaign contextual onboarding is disabled because Tutorial v2 owns rules teaching.');

const afterTwo = {
  completedLevelIds: ['campaign-002'],
  lastPlayedLevelId: 'campaign-002',
} as const;
assert(getCampaignLevelState(selectorManifest[1], afterTwo, selectorManifest) === 'completed', 'Completed level is replayable/completed.');
assert(getCampaignLevelState(selectorManifest[0], afterTwo, selectorManifest) === 'current', 'Continue frontier chooses the first unsolved level when last played is completed.');
assert(getCampaignLevelState(selectorManifest[2], afterTwo, selectorManifest) === 'unlocked', '003 remains in the frontier after solving 002.');
assert(getCampaignLevelState(selectorManifest[3], afterTwo, selectorManifest) === 'unlocked', 'Solving 002 advances the frontier to include 004.');
assert(getCampaignContinueEntry(afterTwo, selectorManifest)?.id === 'campaign-001', 'Continue chooses the first unsolved playable level after completed last-played entry.');

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
  assert(campaignManifest.length === 64, 'Release manifest contains exactly 64 promoted levels.');
  assert(
    campaignManifest.every((entry, index) => entry.id === `campaign-${String(index + 1).padStart(3, '0')}`),
    'Release ids are contiguous campaign-001 through campaign-064.',
  );
  assert(
    campaignManifest.every((entry) => !('chapterId' in entry) && !('onboarding' in entry)),
    'Flat campaign manifest carries no chapter/manuscript/onboarding presentation metadata.',
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
  value: PlayerProfileV4 | null = null;
  failSave = false;
  saveCalls = 0;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV4): Promise<void> {
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

  assert(
    service.getPlayableLevels().filter((entry) => !service.getProgress().completedLevelIds.includes(entry.id)).map((entry) => entry.id).join(',')
      === 'campaign-001,campaign-002,campaign-003',
    'Fresh service exposes 001/002/003.',
  );
  await assertRejects(
    () => service.startLevel('campaign-004'),
    '004 stays locked outside the first three unsolved frontier.',
  );

  await service.startLevel('campaign-002');
  assert(service.getProgress().lastPlayedLevelId === 'campaign-002', 'Starting any playable frontier level updates last-played state.');
  profile.update((current) => ({
    ...current,
    campaign: {
      ...current.campaign,
      drafts: {
        ...current.campaign.drafts,
        'campaign-002': {
          mode: 'campaign',
          puzzleId: 'campaign-002',
          cells: [['unknown']],
          activePlayMs: 500,
          hintsUsed: 0,
          startedAtMs: 100,
        },
      },
    },
  }));
  assert(service.getContinueLevel()?.id === 'campaign-002', 'Continue prioritizes the last-played incomplete level when it has a saved draft.');
  const twoResult = await service.completeLevel('campaign-002');
  assert(profile.getProfile().campaign.drafts['campaign-002'] === undefined, 'Completing a Campaign level removes its saved draft.');
  assert(twoResult.recommendedNextLevel?.id === 'campaign-003', 'Completing 002 recommends the nearest available unsolved level ahead.');
  assert(
    service.getPlayableLevels().filter((entry) => !service.getProgress().completedLevelIds.includes(entry.id)).map((entry) => entry.id).join(',')
      === 'campaign-001,campaign-003,campaign-004',
    'Completing 002 advances the rolling frontier to 001/003/004.',
  );
  assert(service.canPlayLevel('campaign-004'), '004 becomes playable immediately after any frontier completion.');

  await service.startLevel('campaign-004');
  const fourResult = await service.completeLevel('campaign-004', {
    bestTimeMs: 12_000,
    minHintsUsed: 0,
    solveCount: 1,
    solvedWithoutHints: true,
  });
  assert(fourResult.recommendedNextLevel?.id === 'campaign-005', 'Recommendation prefers an available unsolved level ahead of the completed level.');
  assert(service.getProgress().completedLevelIds.filter((id) => id === 'campaign-004').length === 1, '004 is recorded once.');

  await service.completeLevel('campaign-004', {
    bestTimeMs: 10_000,
    minHintsUsed: 1,
    solveCount: 1,
    solvedWithoutHints: false,
  });
  assert(service.getProgress().completedLevelIds.filter((id) => id === 'campaign-004').length === 1, 'Replay completion never duplicates completed ids.');
  const result = profile.getProfile().campaign.levelResults['campaign-004'];
  assert(result?.bestTimeMs === 10_000, 'Replay metadata keeps the best time.');
  assert(result?.minHintsUsed === 0, 'Replay metadata keeps the minimum hint count.');
  assert(result?.solveCount === 2, 'Replay metadata increments solve count.');
  assert(result?.solvedWithoutHints, 'No-hint achievement is sticky across replays.');

  const skippedHarness = await createService(selectorManifest);
  await skippedHarness.service.completeLevel('campaign-001');
  await skippedHarness.service.completeLevel('campaign-002');
  await skippedHarness.service.completeLevel('campaign-003');
  const fiveAfterSkippingFour = await skippedHarness.service.completeLevel('campaign-005');
  assert(
    fiveAfterSkippingFour.recommendedNextLevel?.id === 'campaign-006',
    'After skipping 004 and completing 005, Next advances to available 006 instead of jumping backward to 004.',
  );
  assert(
    (fiveAfterSkippingFour as typeof fiveAfterSkippingFour & { rowUnlock?: unknown }).rowUnlock == null,
    'Ordinary completion inside a row does not request the row-unlock transition.',
  );

  await skippedHarness.service.completeLevel('campaign-006');
  await skippedHarness.service.completeLevel('campaign-007');
  const eightAfterSkippingFour = await skippedHarness.service.completeLevel('campaign-008');
  assert(
    eightAfterSkippingFour.recommendedNextLevel?.id === 'campaign-004',
    'Finishing the available levels in a row sends Next back to the skipped unfinished level before opening the next row.',
  );
  assert(
    !skippedHarness.service.canPlayLevel('campaign-009'),
    '009 stays locked while any level in 001-008 is unfinished.',
  );
  const fourAfterRowCleanup = await skippedHarness.service.completeLevel('campaign-004');
  assert(
    fourAfterRowCleanup.recommendedNextLevel?.id === 'campaign-009',
    'Completing the final skipped level in a row advances Next into the newly unlocked row.',
  );
  assert(
    skippedHarness.service.canPlayLevel('campaign-009'),
    '009 becomes playable immediately after all of 001-008 are complete.',
  );
  const rowUnlock = (fourAfterRowCleanup as typeof fourAfterRowCleanup & {
    rowUnlock?: { readonly completedRowStartSlot: number; readonly nextRowStartSlot: number } | null;
  }).rowUnlock;
  assert(rowUnlock?.completedRowStartSlot === 1, 'Closing the last gap reports the completed row start slot.');
  assert(rowUnlock?.nextRowStartSlot === 9, 'Closing the last gap reports the newly activated next row.');

  const replayAfterRowUnlock = await skippedHarness.service.completeLevel('campaign-004');
  assert(
    (replayAfterRowUnlock as typeof replayAfterRowUnlock & { rowUnlock?: unknown }).rowUnlock == null,
    'Replaying a completed level never replays the row-unlock transition.',
  );

  const failingStorage = new FakeProfileStorage();
  failingStorage.failSave = true;
  const failingHarness = await createService(selectorManifest, failingStorage);
  const failure = await failingHarness.service.completeLevel('campaign-001');
  assert(!failure.persisted, 'Completion reports persisted=false when profile flush fails.');
  assert(failingHarness.service.getProgress().completedLevelIds.join(',') === 'campaign-001', 'Flush failure keeps completion in memory for later retry.');
}

runServiceChecks().then(
  () => console.info('[Dungeon Logic] Campaign sanity: profile-backed nonlinear progression checks passed'),
  (error) => {
    console.error(error);
    (globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1;
  },
);
