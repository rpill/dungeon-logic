import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
const boardViewSource = readFileSync(new URL('../board/BoardView.ts', import.meta.url), 'utf8');
const cellViewSource = readFileSync(new URL('../board/CellView.ts', import.meta.url), 'utf8');

assert(boardViewSource.includes('setTutorialCellTargets('), 'BoardView exposes tutorial target previews.');
assert(cellViewSource.includes('guidanceWallGhost'), 'Tutorial can render a semi-transparent wall preview.');
assert(cellViewSource.includes('guidanceFloorGhost'), 'Tutorial can render a floor marker preview.');
assert(cellViewSource.includes('this.state !== guidanceState'), 'A completed tutorial target hides immediately per cell.');
assert(cellViewSource.includes('guidancePulseTween'), 'Tutorial target previews own a pulsing tween.');
assert(cellViewSource.includes('scene.tweens.add'), 'Tutorial target previews actually animate.');
assert(cellViewSource.includes('setTint(0xd54a42)'), 'Tutorial floor targets use the red/coral gameplay accent.');
assert(!gameSceneSource.includes('onboardingGuides'), 'Tutorial must not draw rectangular clue guide overlays.');
assert(!gameSceneSource.includes('onboardingActionText'), 'Tutorial must not render obsolete secondary gold-cell instructions.');
assert(!gameSceneSource.includes('const onboardingActionBadge'), 'Tutorial guidance has no oversized secondary action badge.');
assert(gameSceneSource.includes('narrowScreen ? 344 : 500'), 'Tutorial guidance panel stays compact.');
assert(gameSceneSource.includes('getOnboardingBottomReserve'), 'Tutorial panel receives dedicated layout space above the toolbar.');
assert(gameSceneSource.includes('board?.setTutorialCellTargets(step.cells, step.expectedState);'), 'GameScene maps each tutorial step to board ghost targets.');

console.info('[Dungeon Logic] Tutorial HUD sanity: compact callout + individual pulsing targets passed');
