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
assert(game.includes('createMaterialButtonSurface(this, {'), 'Game toolbar must use the shared textured material-button family.');
assert(game.includes("undo: 'ui-icon-undo'"), 'Undo button must use prepared undo icon.');
assert(game.includes("reset: 'ui-icon-reset'"), 'Reset button must use prepared reset icon.');
assert(game.includes("hint: 'ui-icon-hint'"), 'Hint button must use prepared hint icon.');
assert(game.includes("id === 'reset' ? 'danger' : id === 'hint' ? 'primary' : 'secondary'"), 'Reset must use danger, Hint primary, and other gameplay actions secondary assets.');
assert(!game.includes('0xff4f57'), 'Game reset action must not use the harsh bright-red fill.');

assert(puzzleUi.includes("const preferredWidth = viewportClass === 'wide' ? 220 : 176"), 'Desktop gameplay action buttons must use the narrower high-button proportions.');
assert(puzzleUi.includes('const buttonHeight = 72;'), 'Desktop gameplay action buttons must use the unified 72px height.');
assert(puzzleUi.includes('const gapY = 22;'), 'Touch tool selectors must sit above the lower action row.');
assert(game.includes("wall: 'board-wall-01'"), 'Wall selector must use a real wall-tile icon.');
assert(game.includes("floor: 'board-floor-mark'"), 'Floor selector must use the coral diamond icon.');
assert(game.includes('createHomeMenuButton(this, {'), 'Game menu must reuse shared menu buttons.');
assert(game.includes('active: boolean;'), 'Toolbar visuals must track whether WALL/FLOOR is the active tool.');
assert(game.includes("visual.hovered || visual.active"), 'WALL/FLOOR must use the same material surface state system, with active tool shown as raised/hovered.');
assert(!game.includes('drawMaterialButtonBackground('), 'Gameplay toolbar must not keep the old flat Graphics button renderer.');

assert(settings.includes("createSceneBackground(this, 'meta')"), 'Settings must use the meta dungeon background.');
assert(settings.includes('createControlsPanel('), 'Settings must group Music, Sound, and Language in one controls panel.');
assert(settings.includes('createToggle('), 'Music and Sound must render switch-style controls.');
for (const key of ['ui-icon-music', 'ui-icon-sound', 'ui-icon-language', 'ui-icon-levels', 'ui-icon-question']) {
  assert(settings.includes(key), `Settings must use ${key}.`);
}
assert(!settings.includes('vibration'), 'Settings UI must not render vibration controls.');
assert(settings.includes('copy.settings.rules'), 'Settings must expose one Rules entry.');
assert(settings.includes('launchTutorial'), 'Settings must expose Tutorial replay.');

assert(uiIcons.includes("levels: 'ui-icon-levels'"), 'Common UI icons must register the levels/book icon for Tutorial replay.');
assert(uiIcons.includes("assets/ui/icons/levels.svg"), 'Common UI icons must preload levels.svg.');
assert(!uiIcons.includes("vibration: 'ui-icon-vibration'"), 'Common UI preload must no longer register vibration.');

console.info('[Dungeon Logic] Game controls + redesigned Settings visual sanity: PASS');
