import { level as campaign001 } from '../content/campaign/levels/campaign001';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { CellState } from '../puzzle/types';
import { createCampaignLevelPreview, mergePreviewWallCells } from '../runtime/CampaignLevelPreview';
import type { SerializedPuzzleState } from '../profile/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}


const mergedWalls = mergePreviewWallCells([
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 3, y: 1 },
]);
assert(
  mergedWalls.some((wall) => wall.x === 0 && wall.y === 0 && wall.width === 2 && wall.height === 2),
  'Adjacent preview walls merge into one continuous rectangle when their row runs align.',
);
assert(
  mergedWalls.some((wall) => wall.x === 3 && wall.y === 1 && wall.width === 1 && wall.height === 1),
  'Separated preview walls remain separate shapes.',
);

const entry: CampaignLevelEntry = {
  slot: 1,
  id: campaign001.id,
  level: campaign001,
};

const empty = createCampaignLevelPreview(entry, {
  completedLevelIds: [],
  drafts: {},
});
assert(empty.status === 'unstarted', 'Never-started Campaign level renders as unstarted.');
assert(!empty.revealMap, 'Never-started Campaign level does not reveal map geometry.');
assert(empty.walls.length === 0, 'Never-started Campaign level has no rendered walls.');

const cells: CellState[][] = Array.from({ length: campaign001.height }, (_, y) => Array.from(
  { length: campaign001.width },
  (_, x) => campaign001.monsters.some((monster) => monster.x === x && monster.y === y)
    || campaign001.chests.some((chest) => chest.x === x && chest.y === y)
    || campaign001.blockers.some((blocker) => blocker.x === x && blocker.y === y)
      ? CellState.Floor
      : CellState.Unknown,
));
cells[0][0] = CellState.Wall;
cells[1][2] = CellState.Floor;
const draft: SerializedPuzzleState = {
  mode: 'campaign',
  puzzleId: campaign001.id,
  cells,
  activePlayMs: 10_000,
  hintsUsed: 0,
  startedAtMs: 100,
};
const started = createCampaignLevelPreview(entry, {
  completedLevelIds: [],
  drafts: { [campaign001.id]: draft },
});
assert(started.status === 'started', 'Saved Campaign draft renders as started.');
assert(started.revealMap, 'Started Campaign level reveals its fixed map geometry.');
assert(started.showIncompleteOverlay, 'Started incomplete Campaign level uses the pale incomplete overlay.');
assert(
  started.walls.some((wall) => wall.x === 0 && wall.y === 0),
  'Started Campaign preview renders walls left by the player.',
);
assert(
  !started.walls.some((wall) => wall.x === 2 && wall.y === 1),
  'Started Campaign preview does not render Floor helper annotations as walls.',
);

const completed = createCampaignLevelPreview(entry, {
  completedLevelIds: [campaign001.id],
  drafts: { [campaign001.id]: draft },
});
const expectedSolutionWalls = campaign001.solution.reduce(
  (count, row) => count + [...row].filter((symbol) => symbol === '#').length,
  0,
);
assert(completed.status === 'completed', 'Completed status overrides any saved replay draft.');
assert(completed.revealMap, 'Completed Campaign level reveals map geometry.');
assert(!completed.showIncompleteOverlay, 'Completed Campaign level renders at full color.');
assert(
  completed.walls.length === expectedSolutionWalls,
  'Completed Campaign preview always renders every canonical solution wall.',
);

const corrupt = createCampaignLevelPreview(entry, {
  completedLevelIds: [],
  drafts: {
    [campaign001.id]: {
      ...draft,
      cells: [[CellState.Unknown]],
    },
  },
});
assert(corrupt.status === 'unstarted', 'Incompatible saved draft cannot reveal a Campaign map.');

console.info('[Dungeon Logic] Campaign level preview sanity: unstarted/started/completed thumbnail semantics passed');
