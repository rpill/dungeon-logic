import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type LevelDefinition } from '../puzzle/types';
import type { CampaignLevelResult, SerializedPuzzleState } from '../profile/types';

export interface CampaignPlayProfileState {
  readonly completedLevelIds: readonly string[];
  readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
  readonly activePuzzle: SerializedPuzzleState | null;
}

export type CampaignPlayState =
  | {
    readonly mode: 'active';
    readonly displayTimeMs: number;
    readonly savedPuzzle: SerializedPuzzleState | undefined;
  }
  | {
    readonly mode: 'completed-review';
    readonly displayTimeMs: number;
    readonly savedPuzzle: undefined;
  };

function snapshotPuzzle(level: LevelDefinition, saved: SerializedPuzzleState): PuzzleState {
  const puzzle = new PuzzleState(level);
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (!puzzle.isFixedCell(x, y)) {
        puzzle.setCellState(x, y, saved.cells[y][x]);
      }
    }
  }
  return puzzle;
}

export function resolveCampaignPlayState(
  level: LevelDefinition,
  campaign: CampaignPlayProfileState,
): CampaignPlayState {
  const saved = campaign.activePuzzle ?? undefined;
  const compatible = isCompatiblePuzzleSnapshot(level, 'campaign', level.id, saved);
  const completed = campaign.completedLevelIds.includes(level.id);

  if (compatible) {
    const restored = snapshotPuzzle(level, saved);
    if (!completed || !validatePuzzle(restored).isSolved) {
      return {
        mode: 'active',
        displayTimeMs: saved.activePlayMs,
        savedPuzzle: saved,
      };
    }
  }

  if (completed) {
    return {
      mode: 'completed-review',
      displayTimeMs: campaign.levelResults[level.id]?.bestTimeMs ?? 0,
      savedPuzzle: undefined,
    };
  }

  return {
    mode: 'active',
    displayTimeMs: 0,
    savedPuzzle: undefined,
  };
}

export function createCompletedReviewPuzzle(level: LevelDefinition): PuzzleState {
  const puzzle = new PuzzleState(level);
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (puzzle.isFixedCell(x, y)) continue;
      const symbol = level.solution[y]?.[x];
      if (symbol === '#') {
        puzzle.setCellState(x, y, CellState.Wall);
      } else if (symbol === '.') {
        puzzle.setCellState(x, y, CellState.Floor);
      } else {
        throw new Error(`Unsupported solution symbol at (${x}, ${y}): ${String(symbol)}.`);
      }
    }
  }
  return puzzle;
}
