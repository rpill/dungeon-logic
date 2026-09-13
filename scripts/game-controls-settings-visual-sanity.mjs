import fs from 'node:fs';

const game = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const boot = fs.readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const puzzleUi = fs.readFileSync(new URL('../src/runtime/PuzzleUiState.ts', import.meta.url), 'utf8');
const uiIcons = fs.readFileSync(new URL('../src/runtime/UiIcons.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(boot.includes('preloadCommonUiIcons'), 'BootScene must preload common gameplay/settings icons.');
assert(game.includes('fillRoundedRect'), 'Game toolbar must render solid rounded buttons.');
assert(game.includes("undo: 'ui-icon-undo'"), 'Undo button must use prepared undo icon.');
assert(game.includes("reset: 'ui-icon-reset'"), 'Reset button must use prepared reset icon.');
assert(game.includes("hint: 'ui-icon-hint'"), 'Hint button must use prepared hint icon.');
assert(game.includes('0xc96568'), 'Reset button must use the softer coral accent fill.');
assert(!game.includes('0xff4f57'), 'Game reset action must not use the harsh bright-red fill.');

assert(puzzleUi.includes("const buttonWidth = viewportClass === 'wide' ? 260 : 210"), 'Desktop gameplay action buttons must be substantially wider.');
assert(puzzleUi.includes("const buttonHeight = viewportClass === 'wide' ? 58 : 54"), 'Desktop gameplay action buttons must be taller.');
assert(puzzleUi.includes('const gapY = 22;'), 'Touch tool selectors must sit above the lower action row.');
assert(game.includes("wall: 'board-wall-01'"), 'Wall selector must use a real wall-tile icon.');
assert(game.includes("floor: 'board-floor-mark'"), 'Floor selector must use the coral diamond icon.');
assert(game.includes('createHomeMenuButton(this, {'), 'Game menu must reuse shared menu buttons.');

assert(settings.includes("createSceneBackground(this, 'meta')"), 'Settings must use the meta dungeon background.');
assert(settings.includes('createControlsPanel('), 'Settings must group Music, Sound, and Language in one controls panel.');
assert(settings.includes('createToggle('), 'Music and Sound must render switch-style controls.');
for (const key of ['ui-icon-music', 'ui-icon-sound', 'ui-icon-language', 'ui-icon-levels', 'ui-icon-question', 'ui-icon-reset']) {
  assert(settings.includes(key), `Settings must use ${key}.`);
}
assert(!settings.includes('vibration'), 'Settings UI must not render vibration controls.');
assert(settings.includes('copy.settings.rules'), 'Settings must expose one Rules entry.');
assert(settings.includes('launchTutorial'), 'Settings must expose Tutorial replay.');
assert(settings.includes('0xc96568'), 'Reset progress action must use the softer coral accent.');

assert(uiIcons.includes("levels: 'ui-icon-levels'"), 'Common UI icons must register the levels/book icon for Tutorial replay.');
assert(uiIcons.includes("assets/ui/icons/levels.svg"), 'Common UI icons must preload levels.svg.');
assert(!uiIcons.includes("vibration: 'ui-icon-vibration'"), 'Common UI preload must no longer register vibration.');

console.info('[Dungeon Logic] Game controls + redesigned Settings visual sanity: PASS');
