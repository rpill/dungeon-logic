import {
  calculateLevelSelectLayout,
  calculatePuzzleChromeLayout,
  getInitialViewportSize,
} from '../runtime/ResponsiveLayout';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const initial = getInitialViewportSize(390, 844);
assert(initial.width === 390 && initial.height === 844, 'Game boots at the real viewport size.');

const phone = calculateLevelSelectLayout(390, 844, 5);
assert(phone.viewportClass === 'narrow', '390px viewport uses narrow Level Select layout.');
assert(phone.columns === 2, 'Narrow Level Select uses two columns.');
assert(phone.cards.length === 5, 'All five pilot level cards are positioned.');
for (const card of phone.cards) {
  assert(card.x - card.width / 2 >= 16, 'Card stays inside the left mobile safe margin.');
  assert(card.x + card.width / 2 <= 390 - 16, 'Card stays inside the right mobile safe margin.');
  assert(card.y + card.height / 2 <= 844 - 16, 'Card stays inside the mobile viewport height.');
}

const desktop = calculateLevelSelectLayout(1280, 720, 5);
assert(desktop.viewportClass === 'wide', '1280px viewport uses wide Level Select layout.');
assert(desktop.columns === 5, 'Wide Level Select keeps one row of five pilot cards.');

const chrome = calculatePuzzleChromeLayout(390, 844);
assert(chrome.modalWidth <= 358, 'Puzzle modal fits inside a 390px phone with 16px margins.');
assert(chrome.titleFontSize <= 30, 'Puzzle title is compact on narrow screens.');

console.info('[Dungeon Logic] Responsive shell sanity: viewport-sized canvas + mobile Level Select geometry passed');
