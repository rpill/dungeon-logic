import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const boardViewSource = readFileSync(new URL('../src/board/BoardView.ts', import.meta.url), 'utf8');
const cellViewSource = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');

assert(boardViewSource.includes('setTutorialGuideClue('), 'Tutorial must guide the relevant row/column clue.');
assert(boardViewSource.includes('guideCluePulseTween'), 'Guided clue must pulse.');
assert(boardViewSource.includes("? '#f0d28a'"), 'Guided clue must use tutorial gold.');
assert(gameSceneSource.includes('board?.setTutorialGuideClue(step.guideClue ?? null);'), 'Active onboarding step must drive clue guidance.');

assert(cellViewSource.includes('guidanceWallGhost'), 'Tutorial WALL cells must keep the original shared ghost preview.');
assert(cellViewSource.includes('guidanceFloorGhost'), 'Tutorial FLOOR cells must keep the original shared floor-mark preview.');
assert(cellViewSource.includes('const guidanceState = this.tutorialTargetState ?? this.hintState;'), 'Tutorial and hint targets must keep the same original ghost renderer.');
assert(cellViewSource.includes('this.state !== guidanceState'), 'Guidance ghost must disappear once the expected state is placed.');
assert(cellViewSource.includes('guidancePulseTween'), 'Original board guidance must keep pulsing.');
assert(cellViewSource.includes('setTint(0xd54a42)'), 'Original FLOOR guidance must keep the gameplay floor-mark tint.');
assert(!cellViewSource.includes('tutorialHighlight'), 'Do not replace board guidance with a new tutorial-only highlight layer.');
assert(!cellViewSource.includes('tutorialWallGhost'), 'Do not replace the original wall ghost with a tutorial-only variant.');
assert(!cellViewSource.includes('tutorialFloorBadge'), 'Do not replace the original floor mark with a tutorial-only badge.');

assert(gameSceneSource.includes('guided: boolean;'), 'Toolbar guidance state must stay separate from selected state.');
assert(gameSceneSource.includes('guidancePulseTween: Phaser.Tweens.Tween | null;'), 'Guided mobile tool buttons must own a pulse tween.');
assert(gameSceneSource.includes('showTouchToolButtons\n          && onboardingOpen\n          && !buttonState.active'), 'Only the touch WALL/FLOOR selector should receive tutorial guidance.');
assert(gameSceneSource.includes('syncToolbarGuidancePulse(visual);'), 'Toolbar sync must start/stop the mobile guidance pulse.');
assert(gameSceneSource.includes('lineStyle(3, 0xf0bd63'), 'Guided tool must keep a gold outline distinct from selected blue fill.');
assert(gameSceneSource.includes('buttonState.active ? 0x40577f : 0x18233a'), 'Selected tool must retain the blue active fill.');

console.info('[Dungeon Logic] Tutorial guidance visual sanity passed');
