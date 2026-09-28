import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const metaHeader = readFileSync(new URL('../src/runtime/MetaPageHeader.ts', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const daily = readFileSync(new URL('../src/scenes/DailyScene.ts', import.meta.url), 'utf8');
const levels = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const stats = readFileSync(new URL('../src/scenes/StatsScene.ts', import.meta.url), 'utf8');
const leaderboard = readFileSync(new URL('../src/scenes/LeaderboardScene.ts', import.meta.url), 'utf8');
const help = readFileSync(new URL('../src/scenes/HelpScene.ts', import.meta.url), 'utf8');

assert(metaHeader.includes("from './HeaderActionButton'"), 'Meta headers must use the shared header-action button renderer.');
assert(
  settings.includes("from '../runtime/MetaPageHeader'") && settings.includes('createMetaPageHeader'),
  'Settings Back must delegate to the shared MetaPageHeader/header-action renderer.',
);
assert(home.includes("from '../runtime/HeaderActionButton'"), 'Home Settings icon must use the shared header-action button renderer.');
assert(home.includes('getHeaderActionButtonMetrics'), 'Home Settings icon must use shared header action metrics.');
assert(game.includes("from '../runtime/HeaderActionButton'"), 'Game top actions must share the same header-action visual style.');
assert(game.includes('getHeaderActionButtonMetrics'), 'Game top actions must use shared header action metrics.');

assert(metaHeader.includes('iconSize: actionMetrics.iconSize,'), 'Meta Back button icon size must come from shared header metrics, not page density.');
assert(metaHeader.includes('fontSize: actionMetrics.fontSize,'), 'Meta Back button font size must come from shared header metrics, not page density.');
assert(metaHeader.includes('const buttonHeight = actionMetrics.height;'), 'Meta Back button height must not shrink on short viewports.');
assert(!metaHeader.includes('iconSize: metrics.backIconSize,'), 'Meta Back button must not use density-dependent backIconSize.');
assert(!metaHeader.includes('fontSize: metrics.backFontSize,'), 'Meta Back button must not use density-dependent backFontSize.');
assert(!game.includes('backText'), 'Game Back must be icon-only and must not keep the legacy text label.');
assert(game.includes('iconSize: initialActionMetrics.iconSize,'), 'Game Back/Menu icon size must come from shared header metrics.');

assert(metaHeader.includes('getHeaderActionPlacement'), 'Meta headers must use the shared header-action placement helper.');
assert(settings.includes('createMetaPageHeader(this, {'), 'Settings Back must use shared MetaPageHeader placement.');
assert(home.includes('getHeaderActionPlacement'), 'Home Settings must use the shared header-action placement helper.');
assert(game.includes('getHeaderActionPlacement'), 'Game Back/Menu must use the shared header-action placement helper.');
assert(!settings.includes('const headerInset = narrow ? 16 : 28;'), 'Settings must not keep a bespoke header inset formula.');
assert(!metaHeader.includes('const backInset = viewport.x + (metrics.narrow ? 16 : 28);'), 'Meta headers must not keep a bespoke Back inset formula.');
assert(metaHeader.includes('fitTitleBetweenBackAndRightEdge(title, metrics, viewport, backRight, buttonPlacement.y);'), 'Meta title fitting must compare against the actual shared Back anchor Y.');
assert(!game.includes('const backX = layout.actionInset + backWidth / 2;'), 'Game Back must not derive its anchor from puzzle title/chrome layout.');
assert(!game.includes('const menuX = this.scale.width - layout.actionInset - menuWidth / 2;'), 'Game Menu must not derive its anchor from puzzle title/chrome layout.');
assert(!game.includes('const menuText ='), 'Game top-right menu action must be icon-only.');
assert(game.includes('const menuWidth = buttonSize;'), 'Game menu action must be a square icon button.');
assert(!settings.includes('private createBackButton('), 'Settings must not keep a separate bespoke Back button implementation.');
assert(daily.includes('backLabel: copy.common.back,'), 'Daily must label its header action as Back.');
assert(levels.includes('backLabel: copy.common.back,'), 'Levels must label its header action as Back.');
assert(stats.includes('backLabel: this.copy.common.back,'), 'Stats must label its header action as Back.');
assert(leaderboard.includes('backLabel: copy.common.back,'), 'Leaderboard must label its header action as Back.');
assert(help.includes('backButton: true,'), 'Help must use the same shared square Back button.');

console.info('[Dungeon Logic] Header action consistency sanity: PASS');
