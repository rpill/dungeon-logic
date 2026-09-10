export type ViewportClass = 'wide' | 'compact' | 'narrow';

export interface GameBoardLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

const WIDE_MIN_WIDTH = 1100;
const COMPACT_MIN_WIDTH = 700;
const DESKTOP_MAX_CELL_SIZE = 72;

interface LayoutReserves {
  readonly margin: number;
  readonly headerHeight: number;
  readonly toolbarHeight: number;
}

export function classifyViewport(width: number): ViewportClass {
  if (width >= WIDE_MIN_WIDTH) return 'wide';
  if (width >= COMPACT_MIN_WIDTH) return 'compact';
  return 'narrow';
}

function getLayoutReserves(viewportClass: ViewportClass): LayoutReserves {
  return viewportClass === 'narrow'
    ? {
        margin: 12,
        headerHeight: 72,
        toolbarHeight: 132,
      }
    : {
        margin: 24,
        headerHeight: 92,
        toolbarHeight: 96,
      };
}

export function calculateGameBoardLayout(
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
): GameBoardLayout {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive.');
  }
  if (boardColumns <= 0 || boardRows <= 0) {
    throw new RangeError('Board dimensions must be positive.');
  }

  const viewportClass = classifyViewport(viewportWidth);
  const { margin, headerHeight, toolbarHeight } = getLayoutReserves(viewportClass);

  const availableHeight = viewportHeight - headerHeight - toolbarHeight;
  if (availableHeight <= 0) {
    throw new RangeError('Viewport is too small for the puzzle header and toolbar reserves.');
  }

  // The gameplay board itself stays horizontally centered on every viewport.
  // Narrow screens still reserve enough width for the left clue gutter instead
  // of shifting the whole board to compensate for it.
  const widthCellDivisor = viewportClass === 'narrow'
    ? boardColumns + 1.2
    : boardColumns + 2;
  const maxCellFromWidth = Math.floor(
    (viewportWidth - 2 * margin) / widthCellDivisor,
  );

  // Vertically, the safe rectangle contains one clue row plus the gameplay
  // rows. Center that whole stack between the header and toolbar reserves.
  const maxCellFromHeight = Math.floor(
    availableHeight / (boardRows + 1),
  );

  const cellSize = Math.min(
    DESKTOP_MAX_CELL_SIZE,
    maxCellFromWidth,
    maxCellFromHeight,
  );

  if (cellSize < 1) {
    throw new RangeError('Viewport is too small for the game board.');
  }

  const boardWidth = boardColumns * cellSize;
  const boardHeight = boardRows * cellSize;

  const originX = (viewportWidth - boardWidth) / 2;

  const totalPuzzleHeight = (boardRows + 1) * cellSize;
  const safeTop = headerHeight;
  const totalTop = safeTop + (availableHeight - totalPuzzleHeight) / 2;
  const originY = totalTop + cellSize;

  return {
    cellSize,
    boardWidth,
    boardHeight,
    originX,
    originY,
  };
}
