import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync('src/runtime/MetaPageHeader.ts'), 'Shared MetaPageHeader helper must exist.');
const helper = readFileSync('src/runtime/MetaPageHeader.ts', 'utf8');
const helperLayout = readFileSync('src/runtime/MetaPageHeaderLayout.ts', 'utf8');
const levels = readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
const daily = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const settings = readFileSync('src/scenes/SettingsScene.ts', 'utf8');
const stats = readFileSync('src/scenes/StatsScene.ts', 'utf8');
const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const help = readFileSync('src/scenes/HelpScene.ts', 'utf8');

for (const [name, source] of [
  ['Levels', levels],
  ['Daily', daily],
  ['Settings', settings],
  ['Statistics', stats],
  ['Leaderboard', leaderboard],
  ['How to Play', help],
]) {
  assert(source.includes('createMetaPageHeader'), `${name} must use the shared styled meta-page header.`);
}

assert(/narrow\s*\?\s*30/.test(helperLayout), 'Shared mobile meta header keeps a readable styled title size.');
assert(helper.includes('fitTitleBetweenBackAndRightEdge'), 'Shared header must fit long titles away from the Back control.');
assert(!levels.includes('headerScrim'), 'Levels must scroll as one page without a fixed header underlay.');
assert(help.includes("createSceneBackground(this, 'meta')"), 'How to Play must use the shared meta background.');
assert(!daily.includes('fixed: true'), 'Daily must scroll as one page without a fixed header.');
assert(levels.includes('sceneBackground.image.setScrollFactor(0)'), 'Levels background must stay fixed while the grid scrolls.');
assert(!levels.includes('.setScrollFactor(0).setDepth(1000)'), 'Levels must not pin a header scrim above scrolling content.');
assert(!daily.includes('.setScrollFactor(0).setDepth(1000)'), 'Daily must not pin a header scrim above scrolling content.');
assert(helperLayout.includes('if (narrow) {') && helperLayout.includes('titleY: 84'), 'Narrow meta headers stack Back above the title instead of overlapping it.');

console.info('[Dungeon Logic] Mobile meta layout sanity: shared styled header + whole-page scrolling passed');
