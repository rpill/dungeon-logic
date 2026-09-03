export interface GameBoardLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

const DEFAULT_CELL_SIZE = 72;
const TITLE_SAFE_BOTTOM = 100;
const COLUMN_CLUE_OFFSET = 32;
const STATUS_SAFE_HEIGHT = 72;
const BOARD_VERTICAL_BIAS = 30;

export function calculateGameBoardLayout(
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
): GameBoardLayout {
  if (
    boardColumns <= 0 ||
    boardRows <= 0
  ) {
    throw new RangeError(
      'Board dimensions must be positive.',
    );
  }

  const topSafeBoardHeight =
    viewportHeight -
    2 *
      (
        TITLE_SAFE_BOTTOM -
        BOARD_VERTICAL_BIAS +
        COLUMN_CLUE_OFFSET
      );

  const bottomSafeBoardHeight =
    viewportHeight -
    2 *
      (
        STATUS_SAFE_HEIGHT +
        BOARD_VERTICAL_BIAS
      );

  const maxBoardHeight = Math.min(
    topSafeBoardHeight,
    bottomSafeBoardHeight,
  );

  const safeCellSize = Math.max(
    1,
    Math.floor(
      maxBoardHeight /
      boardRows,
    ),
  );

  const cellSize = Math.min(
    DEFAULT_CELL_SIZE,
    safeCellSize,
  );

  const boardWidth =
    boardColumns * cellSize;

  const boardHeight =
    boardRows * cellSize;

  const originX =
    (
      viewportWidth -
      boardWidth
    ) / 2;

  const originY =
    (
      viewportHeight -
      boardHeight
    ) / 2 +
    BOARD_VERTICAL_BIAS;

  const columnClueCenterY =
    originY -
    COLUMN_CLUE_OFFSET;

  const boardBottom =
    originY +
    boardHeight;

  if (
    columnClueCenterY <
      TITLE_SAFE_BOTTOM ||
    boardBottom >
      viewportHeight -
        STATUS_SAFE_HEIGHT
  ) {
    throw new RangeError(
      'Viewport is too small for the game board safe zones.',
    );
  }

  return {
    cellSize,
    boardWidth,
    boardHeight,
    originX,
    originY,
  };
}
