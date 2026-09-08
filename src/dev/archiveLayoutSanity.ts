import { calculateArchiveListLayout } from '../runtime/ArchiveListLayout';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const narrow = calculateArchiveListLayout(385, 'narrow', false);
assert(narrow.headerBottom < narrow.startY - narrow.cardHeight / 2, 'Narrow first card must start below fixed header.');
assert(narrow.width <= 385 - 28, 'Narrow manuscript cards respect side margins.');

const compact = calculateArchiveListLayout(915, 'compact', false);
assert(compact.headerBottom < compact.startY - compact.cardHeight / 2, 'Compact first card must not overlap Archive title/header.');

const wide = calculateArchiveListLayout(1280, 'wide', true);
assert(wide.headerBottom < wide.startY - wide.cardHeight / 2, 'Wide embedded list must begin below fixed Archive chrome.');
assert(wide.centerX === 179 && wide.width === 274, 'Wide side-panel geometry stays stable.');

console.info('[Dungeon Logic] Archive layout sanity: fixed header + non-overlapping list geometry passed');
