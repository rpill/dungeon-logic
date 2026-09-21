import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const layoutPath = resolve(root, 'src/runtime/MasteryDesktopLayout.ts');
assert(existsSync(layoutPath), 'MasteryDesktopLayout.ts must exist.');

const [{ calculateMasteryDesktopLayout }, { calculateMetaPageHeaderMetrics }] = await Promise.all([
  import(pathToFileURL(layoutPath).href),
  import(pathToFileURL(resolve(root, 'src/runtime/MetaPageHeaderLayout.ts')).href),
]);

for (const viewportHeight of [650, 705, 768, 900, 1080]) {
  const header = calculateMetaPageHeaderMetrics(1920, viewportHeight);
  const top = header.headerHeight + 18;
  const availableHeight = viewportHeight - top - 8;
  const layout = calculateMasteryDesktopLayout(availableHeight);
  assert(layout.totalHeight <= availableHeight + 0.01, `Mastery layout must fit ${viewportHeight}px desktop height.`);
  assert(layout.rowGap > layout.rowHeight, `Mastery rows must stay separated at ${viewportHeight}px.`);
  assert(layout.rowHeight >= 48, `Mastery rows must remain readable at ${viewportHeight}px.`);
  assert(layout.panelHeight >= 240, `Mastery panel must remain usable at ${viewportHeight}px.`);
}

const large = calculateMasteryDesktopLayout(936);
assert(Math.abs(large.topSectionHeight - 236) < 0.01, 'Large desktop must preserve the original top section size.');
assert(Math.abs(large.panelHeight - 408) < 0.01, 'Large desktop must preserve the original panel height.');
assert(Math.abs(large.pathHeight - 126) < 0.01, 'Large desktop must preserve the original rank-track footprint.');

const scene = readFileSync(resolve(root, 'src/scenes/MasteryScene.ts'), 'utf8');
assert(!scene.includes('shortDesktop'), 'MasteryScene must not use a hardcoded shortDesktop breakpoint anymore.');
assert(!scene.includes('compactDesktop'), 'MasteryScene must not keep a second compactDesktop branch alongside the adaptive calculator.');
assert(scene.includes('calculateMasteryDesktopLayout'), 'MasteryScene must use the height-driven desktop layout calculator.');

console.info('[Dungeon Logic] Mastery desktop adaptive layout sanity: PASS');
