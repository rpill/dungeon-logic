import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const header = readFileSync('src/runtime/MetaPageHeader.ts', 'utf8');
const levels = readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
const daily = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const stats = readFileSync('src/scenes/StatsScene.ts', 'utf8');
const settings = readFileSync('src/scenes/SettingsScene.ts', 'utf8');
const help = readFileSync('src/scenes/HelpScene.ts', 'utf8');
const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');

assert(header.includes('readonly backButton?: boolean;'), 'Meta header must support a game-style back-button panel.');
assert(header.includes('readonly fixedBack?: boolean;'), 'Meta header must support fixing only the back action to the viewport.');
assert(header.includes('0x1d2b4b'), 'Meta home button must reuse the normal GameScene top-action fill.');
assert(header.includes('0x2a3d66'), 'Meta home button must reuse the GameScene hover fill.');
assert(header.includes('fillRoundedRect('), 'Meta home button must use a rounded filled panel.');
assert(header.includes('backButtonBackground.setScrollFactor(0)'), 'Fixed Home panel must ignore camera scroll.');
assert(header.includes('backIcon.setScrollFactor(0)'), 'Fixed Home icon must ignore camera scroll.');
assert(header.includes('backText.setScrollFactor(0)'), 'Fixed Home label must ignore camera scroll.');
assert(header.includes('backHit.setScrollFactor(0)'), 'Fixed Home hit area must ignore camera scroll.');

for (const [name, source] of [['levels', levels], ['daily', daily], ['stats', stats]]) {
  assert(source.includes('backButton: true'), `${name} must render Home as the game-style button.`);
  assert(source.includes('fixedBack: true'), `${name} must keep Home fixed during page scrolling.`);
}

assert(settings.includes("backButton: this.returnSceneKey !== 'GameScene'"), 'Settings must style only Home return as the panel button.');
assert(settings.includes("fixedBack: this.returnSceneKey !== 'GameScene'"), 'Settings must fix only Home return, not in-game Back.');
assert(!help.includes('backButton: true'), 'Help Back must keep its current plain treatment.');
assert(!leaderboard.includes('backButton: true'), 'Leaderboard Back must keep its current plain treatment.');

console.info('[Dungeon Logic] Meta Home button sanity: game-style panel + fixed viewport behavior passed');
