interface GameBoardLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

type LayoutCalculator = (
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
) => GameBoardLayout;

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function getLayoutCalculator():
  Promise<LayoutCalculator | null> {
  const modulePath =
    '../scenes/GameBoardLayout';

  try {
    const layoutModule: unknown =
      await import(modulePath);

    if (
      typeof layoutModule !== 'object' ||
      layoutModule === null
    ) {
      return null;
    }

    const descriptor =
      Object.getOwnPropertyDescriptor(
        layoutModule,
        'calculateGameBoardLayout',
      );

    if (
      descriptor === undefined ||
      typeof descriptor.value !==
        'function'
    ) {
      return null;
    }

    return descriptor.value as
      LayoutCalculator;
  } catch {
    return null;
  }
}

function checkSafeVerticalLayout(
  layout: GameBoardLayout,
  viewportHeight: number,
  label: string,
): void {
  const columnClueCenterY =
    layout.originY - 32;

  const boardBottom =
    layout.originY +
    layout.boardHeight;

  assert(
    columnClueCenterY >= 100,
    `${label} column clues must stay below the title-safe zone.`,
  );

  assert(
    boardBottom <=
      viewportHeight - 72,
    `${label} board must stay above the status-safe zone.`,
  );
}

async function main(): Promise<void> {
  console.info(
    '[Dungeon Logic] Game board layout sanity',
  );

  const calculateGameBoardLayout =
    await getLayoutCalculator();

  assert(
    calculateGameBoardLayout !== null,
    'Adaptive game board layout calculator must exist.',
  );

  const viewportWidth = 1280;
  const viewportHeight = 720;

  const six =
    calculateGameBoardLayout(
      viewportWidth,
      viewportHeight,
      6,
      6,
    );

  const seven =
    calculateGameBoardLayout(
      viewportWidth,
      viewportHeight,
      7,
      7,
    );

  const eight =
    calculateGameBoardLayout(
      viewportWidth,
      viewportHeight,
      8,
      8,
    );

  assert(
    six.cellSize === 72,
    '6x6 must keep the existing 72px cell size.',
  );

  assert(
    seven.cellSize === 72,
    '7x7 must keep the existing 72px cell size.',
  );

  assert(
    eight.cellSize < 72,
    '8x8 must shrink below 72px to fit the UI safely.',
  );

  assert(
    eight.cellSize >= 56,
    '8x8 cells must remain comfortably playable.',
  );

  for (
    const [
      label,
      layout,
    ] of [
      ['6x6', six],
      ['7x7', seven],
      ['8x8', eight],
    ] as const
  ) {
    checkSafeVerticalLayout(
      layout,
      viewportHeight,
      label,
    );

    assert(
      layout.originX ===
        (
          viewportWidth -
          layout.boardWidth
        ) / 2,
      `${label} board must remain horizontally centered.`,
    );
  }

  console.info(
    '8/8 checks passed',
  );
}

void main();
