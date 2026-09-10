import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const boardViewSource = readFileSync(new URL('../src/board/BoardView.ts', import.meta.url), 'utf8');
const cellViewSource = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');
const responsiveLayoutSource = readFileSync(new URL('../src/runtime/ResponsiveLayout.ts', import.meta.url), 'utf8');

assert(boardViewSource.includes('setTutorialCellTargets('), 'BoardView exposes tutorial-target previews for guided onboarding.');
assert(cellViewSource.includes('guidanceWallGhost'), 'CellView renders semi-transparent wall ghosts for tutorial guidance.');
assert(cellViewSource.includes('guidanceFloorGhost'), 'CellView renders semi-transparent floor marks for tutorial guidance.');
assert(cellViewSource.includes('this.state !== guidanceState'), 'Each tutorial ghost disappears as soon as its cell reaches the expected state.');
assert(cellViewSource.includes('guidancePulseTween'), 'Tutorial target previews must own a pulsing tween.');
assert(cellViewSource.includes('scene.tweens.add'), 'Tutorial target previews pulse instead of staying static.');
assert(cellViewSource.includes('setTint(0xd54a42)'), 'Tutorial floor targets use the coral/red gameplay accent instead of the old blue tint.');
assert(!gameSceneSource.includes('onboardingGuides'), 'Tutorial must not draw rectangular clue guide overlays.');
assert(!gameSceneSource.includes('onboardingActionText'), 'Tutorial must not render obsolete secondary gold-cell instructions.');
assert(!gameSceneSource.includes('const onboardingActionBadge'), 'Tutorial copy must not render a second large badge inside the callout.');
assert(gameSceneSource.includes('narrowScreen ? 344 : 500'), 'Tutorial callout uses a compact capped width instead of a broad overlay strip.');
assert(gameSceneSource.includes('board?.setTutorialCellTargets(step.cells, step.expectedState);'), 'Onboarding relayout paints expected states directly on target cells.');
assert(gameSceneSource.includes('createCenteredTextMenuButton'), 'Completion actions reuse the menu button visual system.');
assert(responsiveLayoutSource.includes('titleFontSize: narrow ? 24 : 42'), 'Narrow gameplay chrome reduces title size for cleaner mobile headers.');

console.info('[Dungeon Logic] Tutorial HUD sanity: compact callout + individually pulsing ghost targets + themed completion buttons passed');
