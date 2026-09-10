import fs from 'node:fs';

const project = new URL('../', import.meta.url);
const game = fs.readFileSync(new URL('src/scenes/GameScene.ts', project), 'utf8');
const home = fs.readFileSync(new URL('src/scenes/HomeScene.ts', project), 'utf8');
const menuRenderer = fs.readFileSync(new URL('src/runtime/HomeMenuButton.ts', project), 'utf8');
const puzzleUi = fs.readFileSync(new URL('src/runtime/PuzzleUiState.ts', project), 'utf8');
const uiCopy = fs.readFileSync(new URL('src/i18n/UiCopy.ts', project), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!home.includes('createHomeUtilityButton('), 'Home utility actions must stop using custom Graphics/border buttons.');
assert(home.includes("icon: 'info'"), 'How to Play must use the shared menu-button renderer with the info icon.');
assert(home.includes('compact: true'), 'Home utility actions must use the compact shared menu-button variant.');
assert(!uiCopy.includes("howToPlay: 'ⓘ КАК ИГРАТЬ'") && !uiCopy.includes("howToPlay: 'ⓘ HOW TO PLAY'"), 'How to Play copy must not duplicate the info icon already rendered as SVG.');
assert(menuRenderer.includes("| 'info' | 'back'"), 'Shared menu renderer must support info/back icons for overlays and utility actions.');
assert(menuRenderer.includes('readonly compact?: boolean'), 'Shared menu renderer must support a compact asset-backed variant.');

const menuStart = game.indexOf('const renderGameMenu = (): void =>');
const menuEnd = game.indexOf('const openGameMenu = (): void =>', menuStart);
assert(menuStart >= 0 && menuEnd > menuStart, 'Game menu source must be isolatable.');
const menuSource = game.slice(menuStart, menuEnd);
assert(menuSource.includes('createHomeMenuButton(this, {'), 'Game menu must reuse the same NineSlice menu-button renderer as Home.');
assert(!menuSource.includes('strokeRoundedRect'), 'Game menu must not draw its own bordered panel.');
assert(!menuSource.includes('buttonBackground.fillRoundedRect'), 'Game menu must not invent a second solid-button visual system.');

assert(game.includes('0xc96568'), 'Reset action must use the softer muted coral fill.');
assert(!game.includes('0xff4f57'), 'GameScene must no longer use the harsh bright red reset fill.');
assert(game.includes("wall: 'board-wall-01'"), 'Wall tool selector must show a real wall tile icon.');
assert(game.includes("floor: 'board-floor-mark'"), 'Floor tool selector must show the coral diamond marker icon.');
assert(game.includes("const isToolSelector = buttonState.id === 'wall' || buttonState.id === 'floor';"), 'Wall/Floor must have their own selector visual treatment.');
assert(puzzleUi.includes('const gapY = 22;'), 'Touch tool selectors must sit higher above the action-button row.');

assert(game.includes("const hideHintButton = showTouchToolButtons && currentHint !== null && buttonState.id === 'hint';"), 'An active delivered hint must hide the touch Hint button.');
assert(game.includes('visual.background.setVisible(!hideHintButton);'), 'Hidden touch Hint state must hide its button surface.');
const editStart = game.indexOf('const handleEditCommitted = (): void =>');
const boardStart = game.indexOf('board = new BoardView(', editStart);
const editSource = game.slice(editStart, boardStart);
assert(editSource.includes('currentHint = null;') && editSource.includes('syncToolbar();'), 'Completing the hinted cell must restore the Hint button immediately.');

console.info('[Dungeon Logic] Navigation UI rework sanity: PASS');
