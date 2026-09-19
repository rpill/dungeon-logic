import { chooseHint } from '../gameplay/HintService';
import { campaignManifest } from '../content/campaign/manifest';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { HumanRule } from '../puzzle/human-solver/types';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

let totalHints = 0;
let floorHints = 0;
let correctionHints = 0;
let advancedHints = 0;
let unlockingLineCompleteFloors = 0;

for (const entry of campaignManifest) {
  const puzzle = new PuzzleState(entry.level);
  const maxHints = entry.level.width * entry.level.height * 3;

  const mutableFloor = (() => {
    for (let y = 0; y < entry.level.height; y += 1) {
      for (let x = 0; x < entry.level.width; x += 1) {
        if (puzzle.isFixedCell(x, y)) continue;
        if (entry.level.solution[y]?.[x] === '.') return { x, y };
      }
    }
    return null;
  })();
  if (mutableFloor !== null) {
    const corrupted = new PuzzleState(entry.level);
    corrupted.setCellState(mutableFloor.x, mutableFloor.y, CellState.Wall);
    const correction = chooseHint(corrupted);
    assert(
      correction?.x === mutableFloor.x
        && correction.y === mutableFloor.y
        && correction.state === CellState.Floor
        && correction.reason.kind === 'correction',
      `${entry.id}: a single wrong WALL must be corrected before any deduction.`,
    );
  }

  const mutableWall = (() => {
    for (let y = 0; y < entry.level.height; y += 1) {
      for (let x = 0; x < entry.level.width; x += 1) {
        if (puzzle.isFixedCell(x, y)) continue;
        if (entry.level.solution[y]?.[x] === '#') return { x, y };
      }
    }
    return null;
  })();
  if (mutableWall !== null) {
    const corrupted = new PuzzleState(entry.level);
    corrupted.setCellState(mutableWall.x, mutableWall.y, CellState.Floor);
    const correction = chooseHint(corrupted);
    assert(
      correction?.x === mutableWall.x
        && correction.y === mutableWall.y
        && correction.state === CellState.Wall
        && correction.reason.kind === 'correction',
      `${entry.id}: a single wrong FLOOR mark must be corrected before any deduction.`,
    );
  }
  let delivered = 0;

  while (!validatePuzzle(puzzle).isSolved) {
    const hint = chooseHint(puzzle);
    assert(hint !== null, `${entry.id}: logical hint engine got stuck before the puzzle was solved.`);

    const solutionSymbol = entry.level.solution[hint.y]?.[hint.x];
    const expected = solutionSymbol === '#' ? CellState.Wall : CellState.Floor;
    assert(hint.state === expected, `${entry.id}: hint at (${hint.x},${hint.y}) disagrees with verified solution.`);
    if (
      hint.state === CellState.Floor
      && hint.reason.kind === 'deduction'
      && hint.reason.rule === HumanRule.LineComplete
    ) {
      const afterPrerequisite = new PuzzleState(entry.level);
      for (let y = 0; y < entry.level.height; y += 1) {
        for (let x = 0; x < entry.level.width; x += 1) {
          if (puzzle.isFixedCell(x, y)) continue;
          const current = puzzle.getCellState(x, y);
          if (current !== CellState.Unknown) {
            afterPrerequisite.setCellState(x, y, current);
          }
        }
      }
      afterPrerequisite.setCellState(hint.x, hint.y, hint.state);
      const unlocked = chooseHint(afterPrerequisite);
      assert(
        unlocked !== null
          && !(unlocked.reason.kind === 'deduction'
            && unlocked.reason.rule === HumanRule.LineComplete),
        `${entry.id}: a LineComplete FLOOR hint is allowed only when it immediately unlocks a non-LineComplete logical move.`,
      );
      unlockingLineCompleteFloors += 1;
    }

    const before = puzzle.getCellState(hint.x, hint.y);
    assert(before !== hint.state, `${entry.id}: hint must change the visible player state.`);
    puzzle.setCellState(hint.x, hint.y, hint.state);

    delivered += 1;
    totalHints += 1;
    if (hint.state === CellState.Floor) floorHints += 1;
    if (hint.reason.kind === 'correction') correctionHints += 1;
    if (hint.reason.kind === 'deduction' && hint.reason.tier === 'contradiction') advancedHints += 1;
    assert(delivered <= maxHints, `${entry.id}: hint solving exceeded ${maxHints} steps.`);
  }
}

assert(correctionHints === 0, 'Clean campaign solve should never require correction hints.');
assert(unlockingLineCompleteFloors > 0, 'Campaign corpus must exercise at least one useful LineComplete FLOOR prerequisite.');
assert(advancedHints > 0, 'Campaign corpus must exercise at least one advanced/contradiction hint.');
console.info(
  `[Dungeon Logic] Logical hint corpus sanity: ${campaignManifest.length} campaign levels solved by hints, ${totalHints} hints (${floorHints} FLOOR, ${unlockingLineCompleteFloors} unlocking LineComplete FLOOR, ${advancedHints} advanced)`,
);
