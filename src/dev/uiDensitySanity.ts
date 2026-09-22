import { resolveUiDensity } from '../ui/UiDensity.ts';
const cases = [[1920,1080,'comfortable'],[1920,800,'compact'],[1920,650,'compact'],[390,844,'mobile'],[430,932,'mobile']] as const;
for (const [width,height,expected] of cases) {
  const actual = resolveUiDensity(width,height);
  if (actual !== expected) throw new Error(`${width}x${height}: expected ${expected}, got ${actual}`);
}
console.info('[Dungeon Logic] UI density behavior sanity: PASS');
