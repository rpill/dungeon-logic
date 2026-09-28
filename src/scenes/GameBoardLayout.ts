import { BOARD_FRAME } from '../view/BoardFrameMetrics.ts';
import { calculatePuzzleHeaderLayout } from '../runtime/PuzzleHeaderLayout.ts';
import { desktopCompletionPanelHeight } from '../runtime/CompletionPanelLayout.ts';

export type ViewportClass = 'wide' | 'compact' | 'narrow';

export interface GameBoardLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

export class GameBoardViewportTooSmallError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'GameBoardViewportTooSmallError';
  }
}

export function tryGameBoardLayoutForResize<T>(calculate: () => T): T | null {
  try {
    return calculate();
  } catch (error) {
    if (error instanceof GameBoardViewportTooSmallError) return null;
    throw error;
  }
}

const WIDE_MIN_WIDTH = 1100;
const COMPACT_MIN_WIDTH = 700;
const BASE_MAX_CELL_SIZE = 72;
const FIELD_VIEWPORT_WIDTH_RATIO = 0.42;
const FIELD_AVAILABLE_HEIGHT_RATIO = 0.92;
const WIDE_FIELD_MAX_SPAN = 760;

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
        // Two 68px rows, their 22px gap, 12px bottom inset and 12px board gap.
        toolbarHeight: touchControls ? 212 : 172,
      }
    : {
        margin: 24,
        headerHeight: 108,
        toolbarHeight: touchControls
          ? (viewportClass === 'compact' ? 188 : 106)
          : 96,
      };
}

export function calculateGameBoardLayout(
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
  touchControls = false,
  inlineTouchControls = touchControls && useInlineTouchToolbar(viewportWidth, viewportHeight),
  showStatusPanel = true,
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
  const { margin } = reserves;
  // Timed modes reserve the status/timer panel; untimed modes only need the title header.
  const headerHeight = showStatusPanel
    ? Math.max(
        reserves.headerHeight,
        calculatePuzzleHeaderLayout(viewportWidth, viewportHeight).bottom + 10,
      )
    : reserves.headerHeight;
  const phonePanelHeight = Math.round(Math.max(240, viewportWidth - 24) * 747 / 1100);
  const phoneClearanceReserve = Math.min(
    phonePanelHeight + 18,
    Math.max(reserves.toolbarHeight,
      2 * (phonePanelHeight + 14) + headerHeight + (viewportWidth - 24) - viewportHeight),
  );
  const toolbarHeight = inlineTouch ? 96 : viewportClass === 'wide'
    ? Math.max(reserves.toolbarHeight, desktopCompletionPanelHeight(viewportWidth) + 22)
    : viewportClass === 'narrow' && viewportHeight > viewportWidth
      ? Math.max(reserves.toolbarHeight, phoneClearanceReserve)
      : reserves.toolbarHeight;

  const availableHeight = viewportHeight - headerHeight - toolbarHeight;
  if (availableHeight <= 0) {
    throw new GameBoardViewportTooSmallError('Viewport is too small for the puzzle header and toolbar reserves.');
  }

  // Fit and center the entire framed puzzle, including clues and all four rims.
  const widthCellDivisor = boardColumns + BOARD_FRAME.left + BOARD_FRAME.right;
  const heightCellDivisor = boardRows + BOARD_FRAME.top + BOARD_FRAME.bottom;
  const maxCellFromWidth = Math.floor(
    (viewportWidth - 2 * margin) / widthCellDivisor,
  );

  const maxCellFromHeight = Math.floor(
    availableHeight / heightCellDivisor,
  );
  // On a spacious desktop, let smaller grids grow toward a shared framed-field
  // footprint. The width/height fit below still protects larger grids and short viewports.
  const fieldSpan = Math.min(
    viewportWidth * FIELD_VIEWPORT_WIDTH_RATIO,
    availableHeight * FIELD_AVAILABLE_HEIGHT_RATIO,
    WIDE_FIELD_MAX_SPAN,
  );
  const responsiveMaxCell = Math.max(
    BASE_MAX_CELL_SIZE,
    Math.floor(fieldSpan / Math.max(widthCellDivisor, heightCellDivisor)),
  );

  const cellSize = Math.min(
    responsiveMaxCell,
    maxCellFromWidth,
    maxCellFromHeight,
  );

  if (cellSize < 1) {
    throw new GameBoardViewportTooSmallError('Viewport is too small for the game board.');
  }

  const boardWidth = boardColumns * cellSize;
  const boardHeight = boardRows * cellSize;

  const frameWidth = (boardColumns + BOARD_FRAME.left + BOARD_FRAME.right) * cellSize;
  const originX = (viewportWidth - frameWidth) / 2 + BOARD_FRAME.left * cellSize;

  const totalPuzzleHeight = heightCellDivisor * cellSize;
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
