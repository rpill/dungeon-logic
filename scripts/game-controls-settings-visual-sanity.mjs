import fs from 'node:fs';

const game = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const boot = fs.readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const puzzleUi = fs.readFileSync(new URL('../src/runtime/PuzzleUiState.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(boot.includes('preloadCommonUiIcons'), 'BootScene must preload common gameplay/settings icons.');
assert(game.includes('fillRoundedRect'), 'Game toolbar must render solid rounded buttons.');
assert(game.includes("undo: 'ui-icon-undo'"), 'Undo button must use prepared undo icon.');
assert(game.includes("reset: 'ui-icon-reset'"), 'Reset button must use prepared reset icon.');
assert(game.includes("hint: 'ui-icon-hint'"), 'Hint button must use prepared hint icon.');
assert(game.includes('0xff4f57'), 'Reset button must use the coral/red accent fill.');
assert(puzzleUi.includes("const buttonWidth = viewportClass === 'wide' ? 168 : 148"), 'Desktop action buttons must be widened to match the visual concept.');

assert(settings.includes("createSceneBackground(this, 'meta')"), 'Settings must use the meta dungeon background.');
assert(settings.includes('fillRoundedRect'), 'Settings rows must be rounded solid panels.');
for (const key of ['ui-icon-music', 'ui-icon-sound', 'ui-icon-vibration', 'ui-icon-language', 'ui-icon-hint', 'ui-icon-reset']) {
  assert(settings.includes(key), `Settings must use ${key}.`);
}
assert(settings.includes('0xff4f57'), 'Reset progress row must use the coral/red accent fill.');

assert(!game.includes('visual.disabled ? 0.58 : 1'), 'Disabled gameplay buttons must stay opaque.');
assert(game.includes("return copy.game.levelTitle(campaignEntry.slot);"), 'Campaign title must show only the current level number.');
assert(game.includes("'ui-icon-menu'"), 'GameScene must use the prepared menu icon.');
assert(game.includes(".setTint(0xf4ead7)"), 'Top navigation icons must use the bright cream tint.');
const uiIcons = fs.readFileSync(new URL('../src/runtime/UiIcons.ts', import.meta.url), 'utf8');
assert(uiIcons.includes("menu: 'ui-icon-menu'"), 'Common UI icons must register the menu icon.');
assert(uiIcons.includes("/assets/ui/icons/menu.svg"), 'Common UI icons must preload menu.svg.');

console.info('[Dungeon Logic] Game controls + Settings visual sanity: PASS');
