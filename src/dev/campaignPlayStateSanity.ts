import { level as campaign003 } from '../content/campaign/levels/campaign003';
import {
  createCompletedReviewPuzzle,
  resolveCampaignPlayState,
} from '../runtime/CampaignPlayState';
import { CellState } from '../puzzle/types';
import type { SerializedPuzzleState } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const completedIds = [campaign003.id];
const levelResult = {
  bestTimeMs: 42_000,
  minHintsUsed: 1,
  solveCount: 1,
  solvedWithoutHints: false,
};

const noActive = resolveCampaignPlayState(campaign003, {
  completedLevelIds: completedIds,
  levelResults: { [campaign003.id]: levelResult },
  drafts: {},
});
assert(noActive.mode === 'completed-review', 'Completed level without an active replay opens in review mode.');
assert(noActive.displayTimeMs === 42_000, 'Completed review displays the stored best time.');

const freshReplay: SerializedPuzzleState = {
  mode: 'campaign',
  puzzleId: campaign003.id,
  cells: Array.from({ length: campaign003.height }, (_, y) => Array.from(
    { length: campaign003.width },
    (_, x) => campaign003.monsters.some((monster) => monster.x === x && monster.y === y)
      ? CellState.Floor
      : CellState.Unknown,
  )),
  activePlayMs: 0,
  hintsUsed: 0,
  startedAtMs: 1234,
};
const replay = resolveCampaignPlayState(campaign003, {
  completedLevelIds: completedIds,
  levelResults: { [campaign003.id]: levelResult },
  drafts: { [campaign003.id]: freshReplay },
});
assert(replay.mode === 'active', 'Completed level with a fresh unsolved active snapshot resumes replay mode.');
assert(replay.displayTimeMs === 0, 'Fresh replay begins at 00:00 rather than the old best time.');
assert(replay.savedPuzzle === freshReplay, 'Replay reuses the matching active snapshot.');

const staleSolved: SerializedPuzzleState = {
  ...freshReplay,
  activePlayMs: 42_000,
  cells: campaign003.solution.map((row, y) => [...row].map((symbol, x) => (
    campaign003.monsters.some((monster) => monster.x === x && monster.y === y)
      ? CellState.Floor
      : symbol === '#'
        ? CellState.Wall
        : CellState.Floor
  ))),
};
const stale = resolveCampaignPlayState(campaign003, {
  completedLevelIds: completedIds,
  levelResults: { [campaign003.id]: levelResult },
  drafts: { [campaign003.id]: staleSolved },
});
assert(stale.mode === 'completed-review', 'Solved stale active snapshot cannot revive a completed timer.');
assert(stale.savedPuzzle === undefined, 'Completed review discards the stale solved active snapshot.');

const reviewPuzzle = createCompletedReviewPuzzle(campaign003);
for (let y = 0; y < campaign003.height; y += 1) {
  for (let x = 0; x < campaign003.width; x += 1) {
    const expected = campaign003.solution[y][x] === '#' ? CellState.Wall : CellState.Floor;
    assert(reviewPuzzle.getCellState(x, y) === expected, 'Completed review reconstructs the canonical solved board.');
  }
}

console.info('[Dungeon Logic] Campaign play-state sanity: completed review + fresh replay timer semantics passed');
