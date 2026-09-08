import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(getMetaScrollMaxY(480, 760) === 304, 'Content taller than viewport exposes bottom padding in max scroll.');
assert(getMetaScrollMaxY(720, 640) === 0, 'Content shorter than viewport does not scroll.');
assert(clampMetaScrollY(-20, 300) === 0, 'Scroll clamps at top.');
assert(clampMetaScrollY(500, 300) === 300, 'Scroll clamps at bottom.');
assert(clampMetaScrollY(140, 300) === 140, 'Scroll preserves in-range values.');
assert(!isMetaScrollDrag(100, 106), 'Small pointer jitter remains a tap.');
assert(isMetaScrollDrag(100, 112), 'Pointer movement above threshold becomes a scroll drag.');

console.info('[Dungeon Logic] Meta scroll sanity: bounds + tap/drag threshold passed');
