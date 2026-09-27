import type { CampaignLevelEntry } from '../content/campaign/types';
import { isCompatiblePuzzleSnapshot } from '../gameplay/PuzzleSessionState';
import { CellState, type GridPosition } from '../puzzle/types';
import type { SerializedPuzzleState } from '../profile/types';
export { mergePreviewWallCells } from './PreviewWallGeometry';

export type CampaignLevelPreviewStatus = 'unstarted' | 'started' | 'completed';

export interface CampaignLevelPreviewProfileState {
  readonly completedLevelIds: readonly string[];
  readonly drafts: Readonly<Record<string, SerializedPuzzleState>>;
}


export interface CampaignLevelPreview {
  readonly status: CampaignLevelPreviewStatus;
  readonly revealMap: boolean;
  readonly showIncompleteOverlay: boolean;
  readonly walls: readonly GridPosition[];
}

function solutionWalls(entry: CampaignLevelEntry): GridPosition[] {
  const walls: GridPosition[] = [];
  for (let y = 0; y < entry.level.height; y += 1) {
    const row = entry.level.solution[y] ?? '';
    for (let x = 0; x < entry.level.width; x += 1) {
      if (row[x] === '#') walls.push({ x, y });
    }
  }
  return walls;
}

function savedWalls(entry: CampaignLevelEntry, draft: SerializedPuzzleState): GridPosition[] {
  const walls: GridPosition[] = [];
  for (let y = 0; y < entry.level.height; y += 1) {
    for (let x = 0; x < entry.level.width; x += 1) {
      if (draft.cells[y]?.[x] === CellState.Wall) walls.push({ x, y });
    }
  }
  return walls;
}

export function createCampaignLevelPreview(
  entry: CampaignLevelEntry,
  campaign: CampaignLevelPreviewProfileState,
): CampaignLevelPreview {
  if (campaign.completedLevelIds.includes(entry.id)) {
    return {
      status: 'completed',
      revealMap: true,
      showIncompleteOverlay: false,
      walls: solutionWalls(entry),
    };
  }

  const draft = campaign.drafts[entry.id];
  if (
    draft !== undefined
    && isCompatiblePuzzleSnapshot(entry.level, 'campaign', entry.id, draft)
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
