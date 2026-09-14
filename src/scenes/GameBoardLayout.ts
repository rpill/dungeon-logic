import { BOARD_FRAME } from '../view/BoardFrameMetrics.ts';

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

export function useInlineTouchToolbar(width: number, height: number): boolean {
  return width >= 600 && height < 520;
}

function getLayoutReserves(viewportClass: ViewportClass, touchControls: boolean): LayoutReserves {
  return viewportClass === 'narrow'
    ? {
        margin: 12,
        headerHeight: 104,
        toolbarHeight: touchControls ? 148 : 132,
      }
    : {
        margin: 24,
        headerHeight: 108,
        toolbarHeight: touchControls && viewportClass === 'compact' ? 156 : 96,
      };
}

export function calculateGameBoardLayout(
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
  touchControls = false,
  inlineTouchControls = touchControls && useInlineTouchToolbar(viewportWidth, viewportHeight),
): GameBoardLayout {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive.');
  }
  if (boardColumns <= 0 || boardRows <= 0) {
    throw new RangeError('Board dimensions must be positive.');
  }

  const viewportClass = classifyViewport(viewportWidth);
  const inlineTouch = touchControls && inlineTouchControls;
  const reserves = getLayoutReserves(viewportClass, touchControls && !inlineTouch);
  const { margin, headerHeight } = reserves;
  const toolbarHeight = inlineTouch ? 96 : reserves.toolbarHeight;

  const availableHeight = viewportHeight - headerHeight - toolbarHeight;
  if (availableHeight <= 0) {
    throw new RangeError('Viewport is too small for the puzzle header and toolbar reserves.');
  }

  // Fit and center the entire framed puzzle, including clues and all four rims.
  const widthCellDivisor = boardColumns + BOARD_FRAME.left + BOARD_FRAME.right;
  const maxCellFromWidth = Math.floor(
    (viewportWidth - 2 * margin) / widthCellDivisor,
  );

  const maxCellFromHeight = Math.floor(
    availableHeight / (boardRows + BOARD_FRAME.top + BOARD_FRAME.bottom),
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

  const frameWidth = (boardColumns + BOARD_FRAME.left + BOARD_FRAME.right) * cellSize;
  const originX = (viewportWidth - frameWidth) / 2 + BOARD_FRAME.left * cellSize;

  const totalPuzzleHeight = (boardRows + BOARD_FRAME.top + BOARD_FRAME.bottom) * cellSize;
  const safeTop = headerHeight;
  const totalTop = safeTop + (availableHeight - totalPuzzleHeight) / 2;
  const originY = totalTop + BOARD_FRAME.top * cellSize;

  return {
    cellSize,
    boardWidth,
    boardHeight,
    originX,
    originY,
  };
}
