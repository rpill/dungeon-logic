import { chooseHint } from '../gameplay/HintService';
import { PuzzleState } from '../puzzle/PuzzleState';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV1 } from '../profile/types';
import { CellState, type LevelDefinition } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level: LevelDefinition = {
  id: 'hint-sanity',
  width: 3,
  height: 2,
  rowClues: [1, 1],
  columnClues: [1, 0, 1],
  monsters: [{ x: 0, y: 0 }],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '.#.',
    '..#',
  ],
};

const puzzle = new PuzzleState(level);
let hint = chooseHint(puzzle);
assert(hint !== null, 'Fresh puzzle must offer a hint.');
assert(hint.x === 1 && hint.y === 0, 'Fixed monster is skipped and row-major editable cell is selected.');
assert(hint.state === CellState.Wall, 'Hint state comes from immutable solution.');

puzzle.setCellState(1, 0, CellState.Wall);
hint = chooseHint(puzzle);
assert(hint !== null, 'Another unresolved cell must remain.');
assert(hint.x === 2 && hint.y === 0, 'Already-correct cells are skipped.');
assert(hint.state === CellState.Floor, 'Floor solution state is revealed correctly.');

for (let y = 0; y < level.height; y += 1) {
  for (let x = 0; x < level.width; x += 1) {
    if (puzzle.isFixedCell(x, y)) continue;
    puzzle.setCellState(x, y, level.solution[y][x] === '#' ? CellState.Wall : CellState.Floor);
  }
}
assert(chooseHint(puzzle) === null, 'Fully correct editable board has no hint target.');


class MemoryProfileStorage implements PlayerProfileStorage {
  saved: PlayerProfileV1 | null = null;
  async load(): Promise<unknown | null> { return this.saved; }
  async save(profile: PlayerProfileV1): Promise<void> { this.saved = profile; }
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

console.info('[Dungeon Logic] Hint sanity: deterministic reveal + three-free accounting passed');
