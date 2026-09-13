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
assert(game.includes('0xc96568'), 'Reset button must use the softer coral accent fill.');
assert(!game.includes('0xff4f57'), 'Game reset action must not use the harsh bright-red fill.');

assert(puzzleUi.includes("const buttonWidth = viewportClass === 'wide' ? 260 : 210"), 'Desktop gameplay action buttons must be substantially wider.');
assert(puzzleUi.includes("const buttonHeight = viewportClass === 'wide' ? 58 : 54"), 'Desktop gameplay action buttons must be taller.');
assert(puzzleUi.includes('const gapY = 22;'), 'Touch tool selectors must sit above the lower action row.');
assert(game.includes("wall: 'board-wall-01'"), 'Wall selector must use a real wall-tile icon.');
assert(game.includes("floor: 'board-floor-mark'"), 'Floor selector must use the coral diamond icon.');
assert(puzzleUi.includes('hideHintButton = false') && puzzleUi.includes("? ['undo', 'reset']"), 'Delivered touch hints must remove the Hint button from the touch layout until resolved.');
assert(game.includes('const backHit = this.add.zone('), 'Back control must use one full-button hit area.');
assert(game.includes('const menuHit = this.add.zone('), 'Menu control must use one full-button hit area.');
assert(!game.includes("copy.game.exitDaily : copy.game.exitLevels"), 'Game menu must not duplicate contextual Back navigation.');
assert(game.includes('createHomeMenuButton(this, {'), 'Game menu must reuse the same asset-backed menu buttons as Home.');
const home = fs.readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
assert(!home.includes('createHomeUtilityButton'), 'Home utility controls must not use the old custom bordered renderer.');
assert(home.includes('compact: true'), 'Home utility controls must reuse compact shared menu assets.');
assert(home.includes("icon: 'info'"), 'How to Play utility button must use the info icon through the shared renderer.');
assert(home.includes("icon: 'play'"), 'Tutorial utility button must use the existing play icon.');
assert(!home.includes('const tutorialLink = this.add.text'), 'Tutorial must no longer be a tiny text-only corner link.');
assert(!home.includes('const helpLink = this.add.text'), 'How to Play must no longer be a tiny text-only corner link.');

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
assert(uiIcons.includes("assets/ui/icons/menu.svg"), 'Common UI icons must preload menu.svg.');

console.info('[Dungeon Logic] Game controls + Settings visual sanity: PASS');
