import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const levelSelect = readFileSync(new URL('../src/scenes/LevelSelectScene.ts', import.meta.url), 'utf8');
const daily = readFileSync(new URL('../src/scenes/DailyScene.ts', import.meta.url), 'utf8');
const help = readFileSync(new URL('../src/scenes/HelpScene.ts', import.meta.url), 'utf8');
const metaHeader = readFileSync(new URL('../src/runtime/MetaPageHeader.ts', import.meta.url), 'utf8');
const metaHeaderLayout = readFileSync(new URL('../src/runtime/MetaPageHeaderLayout.ts', import.meta.url), 'utf8');
const gameScene = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const puzzleUi = readFileSync(new URL('../src/runtime/PuzzleUiState.ts', import.meta.url), 'utf8');
const cellView = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');

assert(!levelSelect.includes('headerScrim'), 'Levels must not render a fixed header scrim.');
assert(!daily.includes("0x07111f,\n      0.96"), 'Daily must not render a fixed header scrim.');
assert(!help.includes("0x07111f,\n      0.96"), 'Help must not render a fixed header scrim.');
assert(!levelSelect.includes('fixed: true'), 'Levels header must scroll with the page.');
assert(!daily.includes('fixed: true'), 'Daily header must scroll with the page.');
assert(!help.includes('fixed: true'), 'Help header must scroll with the page.');
assert(!levelSelect.includes('pinHomeMenuButton'), 'Levels Continue button must scroll with the page.');
assert(!levelSelect.includes('if (pointer.y < this.headerBottom) return;'), 'Levels scrolling must be allowed from the whole page.');
assert(!daily.includes('if (pointer.y < this.headerBottom) return;'), 'Daily scrolling must be allowed from the whole page.');
assert(!help.includes('if (pointer.y < this.headerBottom) return;'), 'Help scrolling must be allowed from the whole page.');
assert(metaHeader.includes('fixed?: boolean'), 'Shared header may keep backwards-compatible fixed option for other callers.');
assert(metaHeaderLayout.includes('if (narrow) {'), 'Narrow meta headers must use a dedicated stacked back/title geometry.');
assert(metaHeaderLayout.includes('titleY: 64'), 'Tight narrow headers must keep the title clearly below Back.');

assert(puzzleUi.includes('hideHintButton = false'), 'Toolbar layout accepts a pending-hint visibility flag.');
assert(puzzleUi.includes("if (showToolButtons && viewportClass !== 'wide' && !useInlineTouchToolbar(viewportWidth, viewportHeight))"), 'Portrait touch viewports keep two rows; short landscape uses one row.');
assert(puzzleUi.includes("const actionIds: readonly PuzzleToolbarButtonId[] = hideHintButton\n      ? ['undo', 'reset']\n      : ['undo', 'reset', 'hint'];"), 'Touch toolbar removes Hint from layout while a hint is pending.');
assert(gameScene.includes('recalculateToolbarLayout'), 'GameScene recalculates toolbar layout when pending hint state changes.');
assert(gameScene.includes(".setColor('#f4ead7')"), 'Delivered hint copy uses the cream game palette instead of gold.');

assert(!cellView.includes('hintWallPreview'), 'Old yellow hint wall rectangle is removed.');
assert(!cellView.includes('hintFloorPreview'), 'Old yellow hint floor glyph is removed.');
assert(cellView.includes('const guidanceState = this.tutorialTargetState ?? this.hintState;'), 'Hints and tutorial targets share the same ghost renderer.');
assert(cellView.includes('this.guidancePulseTween'), 'Shared guidance targets pulse while unresolved.');

console.info('[Dungeon Logic] Mobile layout + hint regression sanity: PASS');
