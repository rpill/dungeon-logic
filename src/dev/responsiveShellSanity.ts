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

const phone = calculateLevelSelectLayout(390, 844, 30);
assert(phone.viewportClass === 'narrow', '390px viewport uses narrow Level Select layout.');
assert(phone.columns === 2, 'Narrow Level Select uses two columns.');
assert(phone.cards.length === 30, 'All 30 release level cards are positioned.');
assert(phone.headerBottom > phone.continueY + phone.continueHeight / 2, 'Scrollable cards start below the fixed Level Select header.');
for (const card of phone.cards) {
  assert(card.x - card.width / 2 >= 16, 'Card stays inside the left mobile safe margin.');
  assert(card.x + card.width / 2 <= 390 - 16, 'Card stays inside the right mobile safe margin.');
}
const phoneScrollMax = getMetaScrollMaxY(844, phone.contentBottom);
assert(phoneScrollMax > 0, 'Thirty phone cards require vertical scrolling.');
const phoneLast = phone.cards.at(-1)!;
assert(phoneLast.y + phoneLast.height / 2 - phoneScrollMax <= 844 - 16, 'Maximum phone scroll exposes the final card.');

const desktop = calculateLevelSelectLayout(1280, 720, 30);
assert(desktop.viewportClass === 'wide', '1280px viewport uses wide Level Select layout.');
assert(desktop.columns === 5, 'Wide Level Select keeps five columns.');
assert(desktop.cards.length === 30, 'Wide Level Select positions all 30 release cards.');
assert(getMetaScrollMaxY(720, desktop.contentBottom) > 0, 'Six desktop card rows scroll instead of overflowing the viewport.');

const chrome = calculatePuzzleChromeLayout(390, 844);
assert(chrome.modalWidth <= 358, 'Puzzle modal fits inside a 390px phone with 16px margins.');
assert(chrome.titleFontSize <= 30, 'Puzzle title is compact on narrow screens.');

console.info('[Dungeon Logic] Responsive shell sanity: viewport-sized canvas + scrollable 30-level selection geometry passed');
