import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const foundationFiles = [
  'src/ui/UiTheme.ts',
  'src/ui/UiDensity.ts',
  'src/ui/UiText.ts',
  'src/ui/UiSceneHeader.ts',
  'src/ui/UiPanel.ts',
  'src/ui/UiInsetRow.ts',
  'src/ui/UiStatusBadge.ts',
  'src/ui/UiButton.ts',
  'src/ui/UiProgressBar.ts',
  'src/ui/UiModal.ts',
];
for (const file of foundationFiles) {
  assert(existsSync(resolve(root, file)), `UI foundation file must exist: ${file}`);
}

const home = read('src/scenes/HomeScene.ts');
assert(home.includes("from '../ui/UiTheme'"), 'Home must use the shared theme.');
assert(home.includes("from '../ui/UiDensity'"), 'Home must use shared density.');
assert(home.includes('createPrimaryActionButton'), 'Home must use the shared illustrated primary button.');
assert(home.includes('createMasteryStrip'), 'Home must use the shared mastery summary.');

const mastery = read('src/scenes/MasteryScene.ts');
assert(mastery.includes("from '../ui/UiSceneHeader'"), 'Mastery must use the shared scene header.');
assert(mastery.includes('createMasteryRequirementPanel'), 'Mastery must use the common monolithic shell.');
assert(mastery.includes('createMasteryRequirementRowPanel'), 'Mastery must use illustrated stone requirement rows.');
assert(mastery.includes("from '../ui/UiProgressBar'"), 'Mastery must use shared progress bars.');

const gameplayHeader = read('src/runtime/PuzzleHeaderUiAssets.ts');
assert(
  gameplayHeader.includes('createSlateSurface') && gameplayHeader.includes('createQuietInset'),
  'Gameplay header must use the shared slate surface and quiet status inset.',
);

const pilotFontFiles = [
  'src/scenes/HomeScene.ts',
  'src/scenes/MasteryScene.ts',
  'src/runtime/MasteryStrip.ts',
  'src/scenes/GameScene.ts',
];
const literalFontPattern = /fontSize\s*:\s*['"`](\d+(?:\.\d+)?)px['"`]/g;
for (const file of pilotFontFiles) {
  const source = read(file);
  for (const match of source.matchAll(literalFontPattern)) {
    const px = Number(match[1]);
    assert(px >= 10, `${file} contains a user-facing font literal below 10px: ${px}px`);
  }
}

console.info('[Dungeon Logic] UI pilot acceptance sanity: PASS');
