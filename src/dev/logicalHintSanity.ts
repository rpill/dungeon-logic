import { chooseHint } from '../gameplay/HintService';
import { level as campaign011 } from '../content/campaign/levels/campaign011';
import { analyzeHumanSolvability } from '../puzzle/human-solver/HumanSolver';
import { HumanRule } from '../puzzle/human-solver/types';
import { SearchCellState } from '../puzzle/solver/types';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type LevelDefinition } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const deductionLevel: LevelDefinition = {
  id: 'logical-hint-deduction',
  width: 3,
  height: 2,
  rowClues: [1, 0],
  columnClues: [0, 1, 0],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '.#.',
    '...',
  ],
};

const fresh = new PuzzleState(deductionLevel);
const unlockingFloor = chooseHint(fresh);
assert(unlockingFloor !== null, 'Fresh puzzle must have a logical hint.');
assert(
  unlockingFloor.x === 1
    && unlockingFloor.y === 1
    && unlockingFloor.state === CellState.Floor,
  'Hint must expose the visible FLOOR prerequisite at (1,1) instead of silently applying it before a WALL deduction.',
);
assert(unlockingFloor.reason.kind === 'deduction', 'Logical hint exposes a deduction reason for explanation UI.');
if (unlockingFloor.reason.kind === 'deduction') {
  assert(unlockingFloor.reason.rule === HumanRule.LineComplete, 'Unlocking FLOOR is honestly explained by the completed-line rule.');
  assert(unlockingFloor.reason.lineKind === 'row', 'Unlocking FLOOR carries the row axis used by its visible clue proof.');
}

fresh.setCellState(unlockingFloor.x, unlockingFloor.y, unlockingFloor.state);
const logicalWall = chooseHint(fresh);
assert(
  logicalWall?.x === 1
    && logicalWall.y === 0
    && logicalWall.state === CellState.Wall
    && logicalWall.reason.kind === 'deduction'
    && logicalWall.reason.rule === HumanRule.LineFill
    && logicalWall.reason.lineKind === 'column',
  'After the player marks the prerequisite FLOOR, the forced WALL may be shown with a visible line-fill proof.',
);

const wrongWall = new PuzzleState(deductionLevel);
wrongWall.setCellState(0, 0, CellState.Wall);
const wrongWallCorrection = chooseHint(wrongWall);
assert(
  wrongWallCorrection?.x === 0
    && wrongWallCorrection.y === 0
    && wrongWallCorrection.state === CellState.Floor,
  'A wrong player WALL must be corrected before suggesting a new move.',
);
assert(wrongWallCorrection?.reason.kind === 'correction', 'Wrong WALL correction is tagged separately from deduction hints.');

const wrongFloor = new PuzzleState(deductionLevel);
wrongFloor.setCellState(1, 0, CellState.Floor);
const wrongFloorCorrection = chooseHint(wrongFloor);
assert(
  wrongFloorCorrection?.x === 1
    && wrongFloorCorrection.y === 0
    && wrongFloorCorrection.state === CellState.Wall,
  'A wrong player FLOOR on a required WALL must be corrected before another move.',
);
assert(wrongFloorCorrection?.reason.kind === 'correction', 'Wrong FLOOR correction is tagged separately from deduction hints.');

const campaign011Analysis = analyzeHumanSolvability(campaign011);
const connectivityIndex = campaign011Analysis.steps.findIndex(
  (step) => step.rule === HumanRule.Connectivity
    && step.assignments.some((assignment) => assignment.value === SearchCellState.Open),
);
assert(connectivityIndex >= 0, 'Campaign 011 fixture contains a meaningful connectivity FLOOR deduction.');

const connectivityPuzzle = new PuzzleState(campaign011);
for (const step of campaign011Analysis.steps.slice(0, connectivityIndex)) {
  for (const assignment of step.assignments) {
    connectivityPuzzle.setCellState(
      assignment.position.x,
      assignment.position.y,
      assignment.value === SearchCellState.Wall ? CellState.Wall : CellState.Floor,
    );
  }
}
const meaningfulFloor = chooseHint(connectivityPuzzle);
assert(
  meaningfulFloor?.state === CellState.Floor
    && meaningfulFloor.reason.kind === 'deduction'
    && meaningfulFloor.reason.rule === HumanRule.Connectivity,
  'A FLOOR hint is allowed when connectivity makes that open cell a meaningful forced move.',
);

console.info('[Dungeon Logic] Logical hint sanity: useful deduction + wrong-state correction passed');
