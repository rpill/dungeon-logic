import {
  calculateLevelSelectLayout,
  calculateMobilePagedLevelSelectLayout,
  calculatePuzzleChromeLayout,
  getInitialViewportSize,
} from '../runtime/ResponsiveLayout';
import { getMetaScrollMaxY } from '../runtime/MetaScroll';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const initial = getInitialViewportSize(390, 844);
assert(initial.width === 390 && initial.height === 844, 'Game boots at the real viewport size.');

const phone = calculateMobilePagedLevelSelectLayout(390, 844, 8);
assert(phone.viewportClass === 'narrow', '390px viewport uses narrow Level Select layout.');
assert(phone.columns === 3, 'Narrow portrait mobile page uses a compact 3/3/2 grid.');
assert(phone.cards.length === 8, 'Mobile Level Select renders only one 8-level page.');
assert(phone.headerBottom > phone.continueY + phone.continueHeight / 2, 'Paged cards start below the Level Select header.');
for (const card of phone.cards) {
  assert(card.x - card.width / 2 >= 12, 'Card stays inside the left mobile safe margin.');
  assert(card.x + card.width / 2 <= 390 - 12, 'Card stays inside the right mobile safe margin.');
  assert(card.numberY > card.y + card.height / 2, 'Level number sits below the preview square.');
}
assert(getMetaScrollMaxY(844, phone.contentBottom) === 0, 'Portrait mobile page fits without vertical scrolling.');
assert(phone.cards[0].y === phone.cards[2].y, 'First mobile row contains three level cards.');
assert(phone.cards[3].y === phone.cards[5].y, 'Second mobile row contains three level cards.');
assert(phone.cards[6].y === phone.cards[7].y, 'Third mobile row contains the remaining two level cards.');
assert(
  Math.abs((phone.cards[6].x + phone.cards[7].x) / 2 - 390 / 2) < 0.001,
  'Final two-card mobile row stays centered.',
);

const browserChromePhone = calculateMobilePagedLevelSelectLayout(412, 612, 8);
const browserChromeLast = browserChromePhone.cards.at(-1)!;
assert(
  browserChromeLast.numberY + browserChromePhone.cardTitleFontSize / 2 <= 612 - 72,
  'Short mobile viewport keeps the final 3/3/2 row clear of pager and browser chrome.',
);

const desktop = calculateLevelSelectLayout(1280, 720, 64);
assert(desktop.viewportClass === 'wide', '1280px viewport uses wide Level Select layout.');
assert(desktop.columns === 8, 'Wide Level Select uses eight columns.');
assert(desktop.cards.length === 64, 'Wide Level Select positions all 64 release cards.');
const desktopHorizontalGap = desktop.cards[1].x - desktop.cards[0].x - desktop.cards[0].width;
assert(desktopHorizontalGap >= 16, 'Wide Level Select leaves generous horizontal air between cards.');
const desktopFirstBlockBottom = desktop.cards[7].numberY + desktop.cardTitleFontSize / 2;
const desktopSecondBlockTop = desktop.cards[8].y - desktop.cards[8].height / 2;
assert(desktopSecondBlockTop - desktopFirstBlockBottom >= 24, 'Wide Level Select reserves a real vertical block gap around the divider.');
assert(getMetaScrollMaxY(720, desktop.contentBottom) > 0, 'A 720p desktop may scroll so spacing is never compressed to force the whole 8x8 grid onscreen.');
const desktopLast = desktop.cards.at(-1)!;
const desktopScrollMax = getMetaScrollMaxY(720, desktop.contentBottom);
assert(desktopLast.y + desktopLast.height / 2 - desktopScrollMax <= 720 - 16, 'Maximum desktop scroll exposes the final level card.');
assert(desktop.cards.every((card) => card.numberY > card.y + card.height / 2), 'Desktop level numbers sit below every preview square.');

const chrome = calculatePuzzleChromeLayout(390, 844);
assert(chrome.modalWidth <= 358, 'Puzzle modal fits inside a 390px phone with 16px margins.');
assert(chrome.titleFontSize <= 30, 'Puzzle title is compact on narrow screens.');

const landscapePhone = calculateMobilePagedLevelSelectLayout(844, 390, 8);
assert(landscapePhone.viewportClass === 'compact', '844px landscape phone keeps compact viewport classification.');
assert(landscapePhone.columns === 8, 'Landscape mobile page shows one 8-level row.');
assert(landscapePhone.cards.length === 8, 'Landscape mobile page renders only eight levels.');
assert(getMetaScrollMaxY(390, landscapePhone.contentBottom) === 0, 'Landscape mobile page fits without vertical scrolling.');

console.info('[Dungeon Logic] Responsive shell sanity: paged mobile Levels + unchanged 8x8 desktop grid passed');
