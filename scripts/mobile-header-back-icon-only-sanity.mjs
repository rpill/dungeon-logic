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
  header.includes('width: narrow ? metrics.iconButtonSize : metrics.pillWidth'),
  'Mobile Back must use the same square width as an icon/menu button.',
);
assert(
  header.includes('label: narrow ? undefined : label'),
  'Mobile Back must hide its text label while desktop keeps it.',
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
  /backText[\s\S]*?\.setVisible\(backPresentation\.label !== undefined\)/.test(game),
  'Gameplay Back text must be hidden on mobile.',
);
assert(
  game.includes('backIcon.setPosition(backX, contentY);'),
  'Gameplay Back icon must be centered in the square mobile button.',
);

console.info('[Dungeon Logic] Mobile header Back icon-only sanity: PASS');
