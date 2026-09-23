import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const header = readFileSync('src/runtime/HeaderActionButton.ts', 'utf8');
const meta = readFileSync('src/runtime/MetaPageHeader.ts', 'utf8');
const settings = readFileSync('src/scenes/SettingsScene.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');

assert(
  header.includes('export function getHeaderBackButtonPresentation'),
  'Shared header helpers must expose mobile/desktop Back presentation.',
);
assert(
  header.includes('width: metrics.iconButtonSize'),
  'Back must use the same square width as an icon/menu button on every viewport.',
);
assert(
  header.includes('label: undefined'),
  'Back must stay icon-only on both mobile and desktop.',
);
assert(
  meta.includes('getHeaderBackButtonPresentation'),
  'Meta-page Back buttons must use shared mobile icon-only presentation.',
);
assert(
  settings.includes('getHeaderBackButtonPresentation'),
  'Settings Back button must use shared mobile icon-only presentation.',
);
assert(
  game.includes('getHeaderBackButtonPresentation'),
  'Gameplay Back button must use shared mobile icon-only presentation.',
);
assert(
  !game.includes('backText'),
  'Gameplay Back must not retain a text object now that the control is always square.',
);
assert(
  game.includes('.setPosition(backX, backPlacement.y)'),
  'Gameplay Back icon must be centered in the shared square button.',
);

console.info('[Dungeon Logic] Mobile header Back icon-only sanity: PASS');
