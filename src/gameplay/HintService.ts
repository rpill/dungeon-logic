import type { RewardedResult } from '../platform/services';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { PuzzleState } from '../puzzle/PuzzleState';
import {
  HumanDeductionTier,
  HumanRule,
  type HumanAssignment,
  type HumanLineKind,
} from '../puzzle/human-solver/types';
import { findFirstDirectDeduction } from '../puzzle/human-solver/DirectDeductionEngine';
import { findNextAdvancedHumanInference } from '../puzzle/human-solver/HumanSolver';
import { SearchState } from '../puzzle/solver/SearchState';
import { SearchCellState } from '../puzzle/solver/types';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';

export type PuzzleHintReason =
  | {
      readonly kind: 'correction';
      readonly currentState: typeof CellState.Wall | typeof CellState.Floor;
    }
  | {
      readonly kind: 'deduction';
      readonly tier: HumanDeductionTier;
      readonly rule: HumanRule;
      readonly lineKind?: HumanLineKind;
      /** Diagnostic English proof text; UI copy can localize from `rule`. */
      readonly explanation: string;
    };

export interface PuzzleHint {
  readonly x: number;
  readonly y: number;
  readonly state: typeof CellState.Wall | typeof CellState.Floor;
  readonly reason: PuzzleHintReason;
}

function solutionStateAt(puzzle: PuzzleState, x: number, y: number): PuzzleHint['state'] {
  const symbol = puzzle.level.solution[y]?.[x];
  if (symbol === '#') return CellState.Wall;
  if (symbol === '.') return CellState.Floor;
  throw new Error(`Unsupported solution symbol at (${x}, ${y}): ${String(symbol)}.`);
}

function findIncorrectPlayerMark(puzzle: PuzzleState): PuzzleHint | null {
  let wrongFloor: PuzzleHint | null = null;

  for (let y = 0; y < puzzle.level.height; y += 1) {
    for (let x = 0; x < puzzle.level.width; x += 1) {
      if (puzzle.isFixedCell(x, y)) continue;

      const currentState = puzzle.getCellState(x, y);
      if (currentState === CellState.Unknown) continue;

      const correctState = solutionStateAt(puzzle, x, y);
      if (currentState === correctState) continue;

      const correction: PuzzleHint = {
        x,
        y,
        state: correctState,
        reason: {
          kind: 'correction',
          currentState,
        },
      };

      // A wrong WALL changes clue counts and topology, so repair it before
      // a merely incorrect FLOOR helper mark. This keeps deductions based on
      // the player's visible board trustworthy.
      if (currentState === CellState.Wall) return correction;
      wrongFloor ??= correction;
    }
  }

  return wrongFloor;
}

function createSearchStateFromPlayer(puzzle: PuzzleState): SearchState | null {
  const state = new SearchState(puzzle.level);

  for (let y = 0; y < puzzle.level.height; y += 1) {
    for (let x = 0; x < puzzle.level.width; x += 1) {
      if (puzzle.isFixedCell(x, y)) continue;

      const currentState: CellStateValue = puzzle.getCellState(x, y);
      if (currentState === CellState.Unknown) continue;

      const searchState = currentState === CellState.Wall
        ? SearchCellState.Wall
        : SearchCellState.Open;

      if (!state.assign(x, y, searchState)) return null;
    }
  }

  return state;
}

function assignmentState(assignment: HumanAssignment): PuzzleHint['state'] {
  return assignment.value === SearchCellState.Wall
    ? CellState.Wall
    : CellState.Floor;
}

function assignmentToHint(
  puzzle: PuzzleState,
  assignment: HumanAssignment,
  reason: PuzzleHintReason,
): PuzzleHint | null {
  const { x, y } = assignment.position;
  const state = assignmentState(assignment);

  if (puzzle.getCellState(x, y) !== CellState.Unknown) return null;
  if (solutionStateAt(puzzle, x, y) !== state) return null;

  return { x, y, state, reason };
}

function chooseAssignmentHint(
  puzzle: PuzzleState,
  assignments: readonly HumanAssignment[],
  reason: PuzzleHintReason,
): PuzzleHint | null {
  // A wall advances the actual puzzle. FLOOR is a helper mark, so only use
  // it when the deduction itself is meaningful and has no WALL to show.
  for (const assignment of assignments) {
    if (assignment.value !== SearchCellState.Wall) continue;
    const hint = assignmentToHint(puzzle, assignment, reason);
    if (hint !== null) return hint;
  }

  for (const assignment of assignments) {
    if (assignment.value !== SearchCellState.Open) continue;
    const hint = assignmentToHint(puzzle, assignment, reason);
    if (hint !== null) return hint;
  }

  return null;
}

interface UnlockingFloorCandidate {
  readonly assignment: HumanAssignment;
  readonly explanation: string;
  readonly lineKind: HumanLineKind;
}

function collectVisibleLineCompleteFloors(state: SearchState): readonly UnlockingFloorCandidate[] {
  const result: UnlockingFloorCandidate[] = [];
  const seen = new Set<string>();

  const append = (
    lineKind: HumanLineKind,
    label: string,
    target: number,
    wallsPlaced: number,
    positions: readonly { readonly x: number; readonly y: number }[],
  ): void => {
    if (wallsPlaced !== target || positions.length === 0) return;

    for (const position of positions) {
      const key = `${position.x}:${position.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        lineKind,
        assignment: {
          position: { x: position.x, y: position.y },
          value: SearchCellState.Open,
        },
        explanation:
          `${label} already has all ${target} required walls, so this cell is OPEN. Marking it now exposes the next visible deduction.`,
      });
    }
  };

  for (let y = 0; y < state.level.height; y += 1) {
    const status = state.getRowStatus(y);
    append('row', `Row ${y + 1}`, status.target, status.wallsPlaced, status.unassigned);
  }

  for (let x = 0; x < state.level.width; x += 1) {
    const status = state.getColumnStatus(x);
    append('column', `Column ${x + 1}`, status.target, status.wallsPlaced, status.unassigned);
  }

  return result;
}

function findUnlockingLineCompleteFloor(
  puzzle: PuzzleState,
  state: SearchState,
): PuzzleHint | null {
  let floorUnlock: UnlockingFloorCandidate | null = null;

  for (const candidate of collectVisibleLineCompleteFloors(state)) {
    const checkpoint = state.checkpoint();
    const applied = state.assign(
      candidate.assignment.position.x,
      candidate.assignment.position.y,
      SearchCellState.Open,
    );

    if (!applied) {
      state.rollback(checkpoint);
      continue;
    }

    const unlocked = findFirstDirectDeduction(state, { skipLineComplete: true });
    let downstreamHint: PuzzleHint | null = null;

    if (unlocked.ok && unlocked.step !== null) {
      downstreamHint = chooseAssignmentHint(
        puzzle,
        unlocked.step.assignments,
        {
          kind: 'deduction',
          tier: HumanDeductionTier.Direct,
          rule: unlocked.step.rule,
          lineKind: unlocked.step.lineKind,
          explanation: unlocked.step.explanation,
        },
      );
    }

    state.rollback(checkpoint);

    if (downstreamHint === null) continue;

    // Prefer a FLOOR that immediately exposes a WALL. A FLOOR that only
    // exposes another helper FLOOR is still useful, but is a weaker hint.
    if (downstreamHint.state === CellState.Wall) {
      return assignmentToHint(
        puzzle,
        candidate.assignment,
        {
          kind: 'deduction',
          tier: HumanDeductionTier.Direct,
          rule: HumanRule.LineComplete,
          lineKind: candidate.lineKind,
          explanation: candidate.explanation,
        },
      );
    }

    floorUnlock ??= candidate;
  }

  if (floorUnlock === null) return null;

  return assignmentToHint(
    puzzle,
    floorUnlock.assignment,
    {
      kind: 'deduction',
      tier: HumanDeductionTier.Direct,
      rule: HumanRule.LineComplete,
      lineKind: floorUnlock.lineKind,
      explanation: floorUnlock.explanation,
    },
  );
}

function findLogicalHint(puzzle: PuzzleState): PuzzleHint | null {
  const state = createSearchStateFromPlayer(puzzle);
  if (state === null) return null;

  // A hint explanation must be true on the board the player can actually see.
  // Ignore optional LineComplete FLOOR bookkeeping while searching for a
  // directly visible useful move; never apply those FLOOR cells silently.
  const direct = findFirstDirectDeduction(state, { skipLineComplete: true });
  if (!direct.ok) return null;

  if (direct.step !== null) {
    const reason: PuzzleHintReason = {
      kind: 'deduction',
      tier: HumanDeductionTier.Direct,
      rule: direct.step.rule,
      lineKind: direct.step.lineKind,
      explanation: direct.step.explanation,
    };
    const hint = chooseAssignmentHint(puzzle, direct.step.assignments, reason);
    if (hint !== null) return hint;
  }

  // FLOOR remains optional unless marking one specific completed-line cell
  // immediately unlocks another useful direct deduction. In that case it is
  // a real prerequisite, so show it instead of pretending the downstream
  // deduction is already visible.
  const unlockingFloor = findUnlockingLineCompleteFloor(puzzle, state);
  if (unlockingFloor !== null) return unlockingFloor;

  // Advanced inference is evaluated from the unmodified visible state. It may
  // reason through consequences internally, but its conclusion is a proof from
  // the board the player actually has, not from silently committed base state.
  const advanced = findNextAdvancedHumanInference(state);
  if (advanced.kind !== 'move') return null;

  return chooseAssignmentHint(
    puzzle,
    advanced.move.assignments,
    {
      kind: 'deduction',
      tier: advanced.move.tier,
      rule: advanced.move.rule,
      explanation: advanced.move.explanation,
    },
  );
}

export function chooseHint(puzzle: PuzzleState): PuzzleHint | null {
  if (validatePuzzle(puzzle).isSolved) return null;

  const correction = findIncorrectPlayerMark(puzzle);
  if (correction !== null) return correction;

  return findLogicalHint(puzzle);
}

export type HintRequestResult = 'delivered' | 'cancelled' | 'unavailable' | 'none';

export interface HintRequestOptions {
  readonly puzzle: PuzzleState;
  readonly consumeFreeHint: () => boolean;
  readonly requestRewarded: (() => Promise<RewardedResult>) | null;
  readonly recordRewardedHintUsed: () => void;
  readonly deliverHint: (hint: PuzzleHint, source: 'free' | 'rewarded') => void;
}

export async function requestHint(
  options: HintRequestOptions,
): Promise<HintRequestResult> {
  const hint = chooseHint(options.puzzle);
  if (hint === null) return 'none';

  if (options.consumeFreeHint()) {
    options.deliverHint(hint, 'free');
    return 'delivered';
  }

  if (options.requestRewarded === null) return 'unavailable';

  const rewardedResult = await options.requestRewarded();
  if (rewardedResult === 'closed') return 'cancelled';
  if (rewardedResult !== 'rewarded') return 'unavailable';

  options.deliverHint(hint, 'rewarded');
  options.recordRewardedHintUsed();
  return 'delivered';
}
