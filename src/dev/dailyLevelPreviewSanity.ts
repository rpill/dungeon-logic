import { DAILY_PRODUCTION_ENTRIES as DAILY_RELEASE_ENTRIES } from './DailyProductionCatalog';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { SerializedPuzzleState } from '../profile/types';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';
import { createDailyLevelPreview } from '../runtime/DailyLevelPreview';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const entry = DAILY_RELEASE_ENTRIES[0];
const freshDaily = createFreshPlayerProfile([]).daily;
const unstarted = createDailyLevelPreview(entry, freshDaily);
assert(unstarted.status === 'unstarted', 'Unopened Daily must hide its map behind a question mark.');
assert(unstarted.walls.length === 0, 'Unopened Daily preview must not leak solution walls.');

const cells: CellStateValue[][] = entry.level.solution.map((row) => [...row].map(() => CellState.Unknown));
for (const monster of entry.level.monsters) cells[monster.y][monster.x] = CellState.Floor;
for (const chest of entry.level.chests) cells[chest.y][chest.x] = CellState.Floor;
for (const blocker of entry.level.blockers) cells[blocker.y][blocker.x] = CellState.Floor;
for (const door of entry.level.doors) cells[door.position.y][door.position.x] = CellState.Floor;
let editableWall: { x: number; y: number } | null = null;
for (let y = 0; y < entry.level.height && editableWall === null; y += 1) {
  for (let x = 0; x < entry.level.width; x += 1) {
    if (cells[y][x] === CellState.Unknown) {
      editableWall = { x, y };
      break;
    }
  }
}
assert(editableWall !== null, 'Fixture needs an editable Daily cell.');
cells[editableWall.y][editableWall.x] = CellState.Wall;
const draft: SerializedPuzzleState = {
  mode: 'daily',
  puzzleId: entry.id,
  cells,
  activePlayMs: 1234,
  hintsUsed: 0,
  startedAtMs: 1000,
};
const started = createDailyLevelPreview(entry, {
  ...freshDaily,
  drafts: { [entry.dateKey]: draft },
});
assert(started.status === 'started', 'Saved Daily draft must render as started.');
assert(started.showIncompleteOverlay, 'Started Daily must use the incomplete whitish overlay.');
assert(
  started.walls.some((wall) => wall.x === editableWall!.x && wall.y === editableWall!.y),
  'Started Daily preview must show the player wall saved in its draft.',
);

const completed = createDailyLevelPreview(entry, {
  ...freshDaily,
  drafts: { [entry.dateKey]: draft },
  solvedDates: [entry.dateKey],
  totalSolved: 1,
  results: {
    [entry.dateKey]: { bestTimeMs: 1000, minHintsUsed: 0, solvedWithoutHints: true },
  },
});
assert(completed.status === 'completed', 'Solved Daily must render as completed even if a stale draft exists.');
assert(!completed.showIncompleteOverlay, 'Solved Daily preview must use full color.');
const solutionWallCount = entry.level.solution.reduce(
  (sum, row) => sum + [...row].filter((cell) => cell === '#').length,
  0,
);
assert(completed.walls.length === solutionWallCount, 'Solved Daily preview must show every correct solution wall.');

const corrupt = createDailyLevelPreview(entry, {
  ...freshDaily,
  drafts: {
    [entry.dateKey]: { ...draft, puzzleId: 'daily-999' },
  },
});
assert(corrupt.status === 'unstarted', 'Incompatible Daily draft must not reveal the map.');

console.info('[Dungeon Logic] Daily level preview sanity: unstarted + draft + completed states passed');
