import {
  calculateLevelSelectLayout,
  calculatePuzzleChromeLayout,
  getInitialViewportSize,
} from '../runtime/ResponsiveLayout';
import { getMetaScrollMaxY } from '../runtime/MetaScroll';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const initial = getInitialViewportSize(390, 844);
assert(initial.width === 390 && initial.height === 844, 'Game boots at the real viewport size.');

const phone = calculateLevelSelectLayout(390, 844, 64);
assert(phone.viewportClass === 'narrow', '390px viewport uses narrow Level Select layout.');
assert(phone.columns === 4, 'Narrow portrait Level Select uses four compact columns.');
assert(phone.cards.length === 64, 'All 64 release level cards are positioned.');
assert(phone.headerBottom > phone.continueY + phone.continueHeight / 2, 'Scrollable cards start below the fixed Level Select header.');
for (const card of phone.cards) {
  assert(card.x - card.width / 2 >= 16, 'Card stays inside the left mobile safe margin.');
  assert(card.x + card.width / 2 <= 390 - 16, 'Card stays inside the right mobile safe margin.');
  assert(card.numberY > card.y + card.height / 2, 'Level number sits below the preview square.');
}
const phoneScrollMax = getMetaScrollMaxY(844, phone.contentBottom);
assert(phoneScrollMax > 0, 'Sixty-four phone cards require vertical scrolling.');
const phoneLast = phone.cards.at(-1)!;
assert(phoneLast.y + phoneLast.height / 2 - phoneScrollMax <= 844 - 16, 'Maximum phone scroll exposes the final card.');

const desktop = calculateLevelSelectLayout(1280, 720, 64);
assert(desktop.viewportClass === 'wide', '1280px viewport uses wide Level Select layout.');
assert(desktop.columns === 8, 'Wide Level Select uses eight columns.');
assert(desktop.cards.length === 64, 'Wide Level Select positions all 64 release cards.');
assert(getMetaScrollMaxY(720, desktop.contentBottom) === 0, 'The 8x8 desktop grid with numbers below previews fits without vertical scrolling at 1280x720.');
assert(desktop.cards.every((card) => card.numberY > card.y + card.height / 2), 'Desktop level numbers sit below every preview square.');

const chrome = calculatePuzzleChromeLayout(390, 844);
assert(chrome.modalWidth <= 358, 'Puzzle modal fits inside a 390px phone with 16px margins.');
assert(chrome.titleFontSize <= 30, 'Puzzle title is compact on narrow screens.');

const landscapePhone = calculateLevelSelectLayout(844, 390, 64);
assert(landscapePhone.viewportClass === 'compact', '844px landscape phone uses compact Level Select layout.');
assert(landscapePhone.columns === 8, 'Landscape phone keeps eight levels per row.');
assert(getMetaScrollMaxY(390, landscapePhone.contentBottom) > 0, 'Landscape phone may scroll vertically for the 8x8 grid.');

console.info('[Dungeon Logic] Responsive shell sanity: 64-level 8x8 desktop/landscape grid + 4-column portrait fallback passed');
