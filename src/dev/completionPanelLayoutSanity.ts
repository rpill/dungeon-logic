import { calculateGameBoardLayout } from '../scenes/GameBoardLayout.ts';
import { calculateCompletionPanelLayout } from '../runtime/CompletionPanelLayout.ts';
import { BOARD_FRAME } from '../view/BoardFrameMetrics.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const desktop = calculateCompletionPanelLayout(1760, 640, 0, 3);
assert(desktop.mode === 'desktop', 'Landscape desktop uses the compact desktop completion panel.');
assert(desktop.panelWidth <= 620, 'Desktop completion panel never stretches across the whole viewport.');
assert(desktop.panelWidth >= 500, 'Desktop completion panel remains wide enough for three compact actions.');
assert(desktop.panelHeight <= 150, 'Desktop completion panel stays short at the 640px-height floor.');
assert(desktop.panelBottom <= 632, 'Desktop completion panel keeps a small bottom margin.');

const desktopBoard = calculateGameBoardLayout(
  1760,
  640 - desktop.boardBottomReserve,
  8,
  8,
  false,
  false,
);
const desktopBoardBottom = desktopBoard.originY
  + desktopBoard.boardHeight
  + desktopBoard.cellSize * BOARD_FRAME.bottom;
assert(
  desktopBoardBottom <= desktop.panelTop - 6,
  'At 640px desktop height, the solved board must stay above the completion panel.',
);

const phone = calculateCompletionPanelLayout(390, 844, 0, 3);
assert(phone.mode === 'phone', 'Portrait phone uses the stacked completion panel.');
assert(phone.panelWidth === 366, 'Portrait phone panel keeps 12px side margins.');
assert(phone.primaryAction !== null, 'Phone layout reserves a full-width primary action row.');
assert(phone.secondaryActions.length === 2, 'Phone layout places the two secondary actions on the row below.');
assert(phone.primaryAction!.width > phone.secondaryActions[0]!.width, 'Primary phone action is visually dominant.');


const phoneSecondaryOnly = calculateCompletionPanelLayout(390, 844, 0, 2, false);
assert(phoneSecondaryOnly.primaryAction === null, 'Phone modes without a primary action do not invent a dominant gold row.');
assert(phoneSecondaryOnly.secondaryActions.length === 2, 'Phone modes without a primary action keep both actions together.');

const shortPhone = calculateCompletionPanelLayout(390, 667, 0, 2);
const shortPhoneBoard = calculateGameBoardLayout(
  390,
  667 - shortPhone.boardBottomReserve,
  8,
  8,
  true,
  false,
);
const shortPhoneBoardBottom = shortPhoneBoard.originY
  + shortPhoneBoard.boardHeight
  + shortPhoneBoard.cellSize * BOARD_FRAME.bottom;
assert(
  shortPhoneBoardBottom <= shortPhone.panelTop - 6,
  'Short portrait phones keep the board clear of the victory panel.',
);

console.info('[Dungeon Logic] Completion panel layout sanity: compact desktop + portrait phone clearance passed');
