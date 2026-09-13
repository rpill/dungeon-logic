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
assert(settings.includes("from '../runtime/HeaderActionButton'"), 'Settings Back must use the shared header-action button renderer.');
assert(settings.includes('getHeaderActionButtonMetrics'), 'Settings Back must use shared header action metrics.');
assert(home.includes("from '../runtime/HeaderActionButton'"), 'Home Settings icon must use the shared header-action button renderer.');
assert(home.includes('getHeaderActionButtonMetrics'), 'Home Settings icon must use shared header action metrics.');
assert(game.includes("from '../runtime/HeaderActionButton'"), 'Game top actions must share the same header-action visual style.');
assert(game.includes('getHeaderActionButtonMetrics'), 'Game top actions must use shared header action metrics.');
assert(!game.includes('const menuText ='), 'Game top-right menu action must be icon-only.');
assert(/const menuWidth = height;/.test(game), 'Game menu action must be a square icon button.');
assert(!settings.includes('private createBackButton('), 'Settings must not keep a separate bespoke Back button implementation.');
assert(daily.includes('backLabel: copy.common.back,'), 'Daily must label its header action as Back.');
assert(levels.includes('backLabel: copy.common.back,'), 'Levels must label its header action as Back.');
assert(stats.includes('backLabel: this.copy.common.back,'), 'Stats must label its header action as Back.');
assert(leaderboard.includes('backLabel: copy.common.back,'), 'Leaderboard must label its header action as Back.');
assert(help.includes('backButton: true,'), 'Help must use the same pill Back button.');

console.info('[Dungeon Logic] Header action consistency sanity: PASS');
