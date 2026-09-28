import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const { calculateMetaPageHeaderMetrics } = await import('../runtime/MetaPageHeaderLayout.ts');

for (const height of [430, 540, 610, 700, 844]) {
  const metrics = calculateMetaPageHeaderMetrics(390, height);
  const compactActionSize = metrics.density === 'ultra' || metrics.density === 'tight' ? 52 : 60;
  const mobileInset = 12;
  const buttonBottom = mobileInset + compactActionSize;
  const titleTop = metrics.titleY - metrics.titleFontSize / 2;
  assert.ok(
    titleTop >= buttonBottom + 4,
    `390x${height} meta header keeps title below the back button row (${titleTop} >= ${buttonBottom + 4}).`,
  );
  assert.ok(
    metrics.headerHeight >= metrics.titleY + metrics.titleFontSize / 2 + 8,
    `390x${height} meta header reserves space below the title.`,
  );
}

const masterySource = readFileSync(new URL('../scenes/MasteryScene.ts', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
assert.ok(
  masterySource.includes('depth: 20'),
  'Mastery back button must use the same foreground layer convention as other meta headers.',
);
assert.ok(
  (gameSource.match(/depth: 20/g) ?? []).length >= 2,
  'Gameplay Back and Menu controls must stay on the same foreground layer across resize cycles.',
);

console.info('[Dungeon Logic] Mobile meta header geometry/layer sanity passed');
