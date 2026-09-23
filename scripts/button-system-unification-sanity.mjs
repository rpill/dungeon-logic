import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const material = readFileSync('src/runtime/MaterialActionButton.ts', 'utf8');
const primary = readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');
const header = readFileSync('src/runtime/HeaderActionButton.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');
const rankUp = readFileSync('src/runtime/MasteryRankUpOverlay.ts', 'utf8');
const daily = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const help = readFileSync('src/scenes/HelpScene.ts', 'utf8');
const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const mastery = readFileSync('src/scenes/MasteryScene.ts', 'utf8');
const masterRatingLeaderboard = readFileSync('src/scenes/MasterRatingLeaderboardScene.ts', 'utf8');
const responsive = readFileSync('src/runtime/ResponsiveLayout.ts', 'utf8');
const completion = readFileSync('src/runtime/CompletionPanelLayout.ts', 'utf8');
const puzzleUi = readFileSync('src/runtime/PuzzleUiState.ts', 'utf8');

assert(
  /getMaterialButtonContentY\([^)]*\)[\s\S]*?return y;/.test(material),
  'Standard button content must be vertically centered on the visible button surface.',
);
assert(
  primary.includes('const contentY = options.y;'),
  'Primary button content must be vertically centered instead of keeping the old shadow compensation offset.',
);
assert(
  material.includes('surfaceHeight = options.surfaceHeight ?? options.height'),
  'Material buttons must use the requested height as their real visible height; compact mode must not secretly inflate only the artwork.',
);
assert(
  primary.includes('surfaceHeight = options.surfaceHeight ?? options.height'),
  'Primary buttons must use the requested height as their real visible height; compact mode must not secretly inflate only the artwork.',
);
assert(
  header.includes('width: metrics.iconButtonSize') && header.includes('label: undefined'),
  'Back navigation must use the same square icon-button family on desktop and mobile.',
);
assert(
  header.includes("? { pillWidth: 132, height: 60, iconButtonSize: 60")
    && header.includes(": { pillWidth: 160, height: 64, iconButtonSize: 64"),
  'Header square buttons must be enlarged to the new family proportions.',
);
assert(
  game.includes('createHeaderActionButton(this, {')
    && !game.includes('const topActionBackground = this.add.graphics();'),
  'Gameplay Back/Menu must use the shared square header button renderer instead of legacy hand-drawn pills.',
);
assert(!game.includes('backText'), 'Gameplay square Back action must not retain references to the removed legacy text label.');
assert(
  game.includes('createMaterialButtonSurface(this, {')
    && game.includes('layoutMaterialButtonSurface(')
    && game.includes('setMaterialButtonSurfaceState('),
  'Gameplay toolbar actions must use the same textured material-button surface as other standard buttons.',
);
assert(
  !game.includes('drawMaterialButtonBackground('),
  'Gameplay must not keep the old flat graphics renderer for standard toolbar/header buttons.',
);

assert(
  rankUp.includes('const buttonHeight = narrow ? 68 : 72;'),
  'Mastery rank-up CTA must use the same taller standard button proportions.',
);

assert(daily.includes("density === 'ultra' ? 60 : density === 'tight' ? 64 : narrow ? 68 : 72"), 'Daily standard actions must use the taller declared bounds.');
assert(help.includes('const ctaHeight = narrow ? 68 : 72;'), 'Help CTA must use the taller standard bounds.');
assert(leaderboard.includes('const buttonHeight = layout.compactHeight ? 64 : 72;'), 'Leaderboard auth action must use the taller standard bounds.');
assert(mastery.includes('height: narrow ? 68 : 72,'), 'Mastery standard action must use the taller bounds.');
assert(masterRatingLeaderboard.includes('height: 72,'), 'Master Rating leaderboard action must use the taller standard bounds.');
assert(
  responsive.includes('const continueHeight = viewport.height < 620 ? 64 : 72;')
    && responsive.includes('const continueHeight = shortViewport ? 64 : 72;')
    && responsive.includes('const continueHeight = viewport.height < 620 ? 64 : 68;'),
  'Level-select Continue actions must use taller responsive bounds.',
);
assert(
  completion.includes('const buttonHeight = short ? 52 : 56;')
    && completion.includes('const actionHeight = viewportHeight <= 640 ? 48 : 52;'),
  'Victory panel actions must be taller while remaining compact enough to leave the board visible.',
);
assert(
  puzzleUi.includes('const buttonHeight = 72;')
    && puzzleUi.includes('const actionButtonHeight = 68;')
    && puzzleUi.includes('const toolButtonHeight = 68;'),
  'Gameplay toolbar must use the taller standard button proportions.',
);


console.log('[Dungeon Logic] Button system unification sanity: PASS');
