import type { DailyEntry } from '../content/daily/types';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import { CellState, type GridPosition } from '../puzzle/types';
import type { DailyProfileState, SerializedPuzzleState } from '../profile/types';

export type DailyLevelPreviewStatus = 'unstarted' | 'started' | 'completed';

export interface DailyLevelPreview {
  readonly status: DailyLevelPreviewStatus;
  readonly revealMap: boolean;
  readonly showIncompleteOverlay: boolean;
  readonly walls: readonly GridPosition[];
}

function solutionWalls(entry: DailyEntry): GridPosition[] {
  const walls: GridPosition[] = [];
  for (let y = 0; y < entry.level.height; y += 1) {
    const row = entry.level.solution[y] ?? '';
    for (let x = 0; x < entry.level.width; x += 1) {
      if (row[x] === '#') walls.push({ x, y });
    }
  }
  return walls;
}

function savedWalls(entry: DailyEntry, draft: SerializedPuzzleState): GridPosition[] {
  const walls: GridPosition[] = [];
  for (let y = 0; y < entry.level.height; y += 1) {
    for (let x = 0; x < entry.level.width; x += 1) {
      if (draft.cells[y]?.[x] === CellState.Wall) walls.push({ x, y });
    }
  }
  return walls;
}

export function createDailyLevelPreview(
  entry: DailyEntry,
  daily: DailyProfileState,
): DailyLevelPreview {
  if (daily.results[entry.dateKey] !== undefined || daily.solvedDates.includes(entry.dateKey)) {
    return {
      status: 'completed',
      revealMap: true,
      showIncompleteOverlay: false,
      walls: solutionWalls(entry),
    };
  }

  const draft = daily.drafts[entry.dateKey];
  if (
    draft !== undefined
    && isCompatiblePuzzleSnapshot(entry.level, 'daily', entry.id, draft)
  ) {
    return {
      status: 'started',
      revealMap: true,
      showIncompleteOverlay: true,
      walls: savedWalls(entry, draft),
    };
  }

  return {
    status: 'unstarted',
    revealMap: false,
    showIncompleteOverlay: true,
    walls: [],
  };
}
