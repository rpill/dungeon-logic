import { readFileSync } from 'node:fs';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
const boardViewSource = readFileSync(new URL('../board/BoardView.ts', import.meta.url), 'utf8');
const cellViewSource = readFileSync(new URL('../board/CellView.ts', import.meta.url), 'utf8');

assert(boardViewSource.includes('setTutorialCellTargets('), 'BoardView exposes tutorial target previews.');
assert(boardViewSource.includes('setTutorialGuideClue('), 'BoardView can guide the relevant row or column clue during onboarding.');
assert(boardViewSource.includes('guideCluePulseTween'), 'The active tutorial row/column clue visibly pulses.');
assert(boardViewSource.includes("? '#f0d28a'"), 'The guided clue uses the warm tutorial gold accent.');

assert(cellViewSource.includes('guidanceWallGhost'), 'Tutorial WALL cells keep the original shared ghost preview.');
assert(cellViewSource.includes('guidanceFloorGhost'), 'Tutorial FLOOR cells keep the original shared floor-mark preview.');
assert(cellViewSource.includes('const guidanceState = this.tutorialTargetState ?? this.hintState;'), 'Tutorial and hint targets keep the original shared guidance renderer.');
assert(cellViewSource.includes('this.state !== guidanceState'), 'A completed guidance target hides immediately per cell.');
assert(cellViewSource.includes('guidancePulseTween'), 'Original board guidance continues to pulse.');
assert(cellViewSource.includes('setTint(0xd54a42)'), 'Original FLOOR guidance keeps its gameplay floor-mark tint.');
assert(!cellViewSource.includes('tutorialHighlight'), 'Tutorial must not replace board guidance with a new highlight layer.');
assert(!cellViewSource.includes('tutorialWallGhost'), 'Tutorial must not replace the original wall ghost.');
assert(!cellViewSource.includes('tutorialFloorBadge'), 'Tutorial must not replace the original floor mark.');

assert(gameSceneSource.includes('guided: boolean;'), 'Toolbar visuals track guided state separately from active/selected state.');
assert(gameSceneSource.includes('guidancePulseTween: Phaser.Tweens.Tween | null;'), 'Guided touch tool buttons own a pulse tween.');
assert(gameSceneSource.includes('showTouchToolButtons\n          && onboardingOpen\n          && !buttonState.active'), 'Tutorial tool guidance is limited to touch WALL/FLOOR controls.');
assert(gameSceneSource.includes('syncToolbarGuidancePulse(visual);'), 'Toolbar sync starts and stops the guidance pulse.');
assert(gameSceneSource.includes('if (visual.guided && !visual.disabled)'), 'Guided tool selector uses a separate visual treatment.');
assert(gameSceneSource.includes('lineStyle(3, 0xf0bd63'), 'Guided tool selector uses a gold outline rather than a selected-looking fill.');
assert(gameSceneSource.includes("buttonState.active ? 0x40577f : 0x18233a"), 'Actual selected tool keeps the normal blue active fill.');
assert(gameSceneSource.includes('visual.guided = guided;'), 'Toolbar sync applies tutorial guidance independently from active state.');
assert(gameSceneSource.includes('board?.setTutorialCellTargets(step.cells, step.expectedState);'), 'GameScene maps each tutorial step to board guidance targets.');
assert(gameSceneSource.includes('board?.setTutorialGuideClue(step.guideClue ?? null);'), 'GameScene syncs clue pulsing with the active tutorial step.');

console.info('[Dungeon Logic] Tutorial HUD sanity: original board guidance + clue pulse + touch tool pulse passed');
