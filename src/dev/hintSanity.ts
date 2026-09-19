import { chooseHint, requestHint } from '../gameplay/HintService';
import { HumanRule } from '../puzzle/human-solver/types';
import { PuzzleState } from '../puzzle/PuzzleState';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfile } from '../profile/types';
import { CellState, type LevelDefinition } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level: LevelDefinition = {
  id: 'hint-sanity',
  width: 3,
  height: 2,
  rowClues: [1, 0],
  columnClues: [0, 1, 0],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '.#.',
    '...',
  ],
};

const puzzle = new PuzzleState(level);
let hint = chooseHint(puzzle);
assert(hint !== null, 'Fresh puzzle must offer a logical hint.');
assert(
  hint.x === 1 && hint.y === 1 && hint.state === CellState.Floor,
  'Hint exposes a visible FLOOR prerequisite instead of silently using it for a downstream WALL.',
);
assert(
  hint.reason.kind === 'deduction' && hint.reason.rule === HumanRule.LineComplete,
  'Useful prerequisite FLOOR is honestly tagged as a completed-line deduction.',
);

puzzle.setCellState(hint.x, hint.y, hint.state);
hint = chooseHint(puzzle);
assert(
  hint?.x === 1
    && hint.y === 0
    && hint.state === CellState.Wall
    && hint.reason.kind === 'deduction'
    && hint.reason.rule === HumanRule.LineFill,
  'After the prerequisite FLOOR is visible, the forced WALL is explained by the line-fill rule.',
);

puzzle.setCellState(1, 0, CellState.Wall);
const followUp = chooseHint(puzzle);
assert(
  followUp === null
    || !(followUp.reason.kind === 'deduction' && followUp.reason.rule === HumanRule.LineComplete),
  'After the required wall is placed, unrelated optional LineComplete FLOOR bookkeeping is still suppressed.',
);

const wrongWallPuzzle = new PuzzleState(level);
wrongWallPuzzle.setCellState(0, 0, CellState.Wall);
hint = chooseHint(wrongWallPuzzle);
assert(
  hint?.x === 0 && hint.y === 0 && hint.state === CellState.Floor,
  'A wrong player WALL is corrected before any new deduction.',
);
assert(hint.reason.kind === 'correction', 'Wrong-state correction is tagged separately from deduction hints.');

const wrongFloorPuzzle = new PuzzleState(level);
wrongFloorPuzzle.setCellState(1, 0, CellState.Floor);
hint = chooseHint(wrongFloorPuzzle);
assert(
  hint?.x === 1 && hint.y === 0 && hint.state === CellState.Wall,
  'A wrong FLOOR mark on a required wall is corrected before any other move.',
);

for (let y = 0; y < level.height; y += 1) {
  for (let x = 0; x < level.width; x += 1) {
    if (puzzle.isFixedCell(x, y)) continue;
    puzzle.setCellState(x, y, level.solution[y][x] === '#' ? CellState.Wall : CellState.Floor);
  }
}
assert(chooseHint(puzzle) === null, 'Fully correct editable board has no hint target.');

const freeSources: Array<'free' | 'rewarded'> = [];
await requestHint({
  puzzle: new PuzzleState(level),
  consumeFreeHint: () => true,
  requestRewarded: null,
  recordRewardedHintUsed: () => {},
  deliverHint: (_hint, source) => { freeSources.push(source); },
});
assert(freeSources[0] === 'free', 'Free hint delivery identifies its source.');

const rewardedSources: Array<'free' | 'rewarded'> = [];
await requestHint({
  puzzle: new PuzzleState(level),
  consumeFreeHint: () => false,
  requestRewarded: async () => 'rewarded',
  recordRewardedHintUsed: () => {},
  deliverHint: (_hint, source) => { rewardedSources.push(source); },
});
assert(rewardedSources[0] === 'rewarded', 'Rewarded hint delivery identifies its source.');

let cancelledDelivery = false;
await requestHint({
  puzzle: new PuzzleState(level),
  consumeFreeHint: () => false,
  requestRewarded: async () => 'closed',
  recordRewardedHintUsed: () => {},
  deliverHint: () => { cancelledDelivery = true; },
});
assert(!cancelledDelivery, 'Closed rewarded ad delivers no hint.');

class MemoryProfileStorage implements PlayerProfileStorage {
  saved: PlayerProfile | null = null;
  async load(): Promise<unknown | null> { return this.saved; }
  async save(profile: PlayerProfile): Promise<void> { this.saved = profile; }
}

const storage = new MemoryProfileStorage();
const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 0 });
assert(profileService.getFreeHintsRemaining() === 3, 'Fresh profile starts with three free hints.');
assert(profileService.consumeFreeHint(), 'First free hint can be consumed.');
assert(profileService.consumeFreeHint(), 'Second free hint can be consumed.');
assert(profileService.consumeFreeHint(), 'Third free hint can be consumed.');
assert(!profileService.consumeFreeHint(), 'Fourth free hint is rejected.');
assert(profileService.getFreeHintsRemaining() === 0, 'Free hint counter reaches zero.');
assert(profileService.getProfile().hints.totalUsed === 3, 'Delivered free hints increment total usage exactly once each.');
await profileService.flush();

console.info('[Dungeon Logic] Hint sanity: logical deduction + correction + three-free accounting passed');
