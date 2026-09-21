import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { calculateMasteryDesktopLayout } = await import(pathToFileURL(resolve(root, 'src/runtime/MasteryDesktopLayout.ts')).href);
for (const availableHeight of [528, 583, 646, 756, 936]) {
  const layout = calculateMasteryDesktopLayout(availableHeight);
  assert(layout.rowGap > layout.rowHeight, `Mastery rows must remain separated at availableHeight=${availableHeight}.`);
  assert(layout.rowHeight >= 48, `Mastery row height must remain readable at availableHeight=${availableHeight}.`);
}
console.info('[Dungeon Logic] Mastery row spacing sanity: PASS');
