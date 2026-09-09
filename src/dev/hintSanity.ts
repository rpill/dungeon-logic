import { chooseHint } from '../gameplay/HintService';
import { level as campaign003 } from '../content/campaign/levels/campaign003';
import { PuzzleState } from '../puzzle/PuzzleState';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV4 } from '../profile/types';
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


const campaign003Puzzle = new PuzzleState(campaign003);
for (let x = 1; x < campaign003.width; x += 1) {
  campaign003Puzzle.setCellState(x, 0, CellState.Wall);
}
campaign003Puzzle.setCellState(0, 1, CellState.Floor);
const campaign003FloorHint = chooseHint(campaign003Puzzle);
assert(
  campaign003FloorHint?.x === 1
    && campaign003FloorHint.y === 1
    && campaign003FloorHint.state === CellState.Floor,
  'Campaign 003 disputed cell (1,1) is correctly revealed as Floor, not Wall.',
);
campaign003Puzzle.setCellState(1, 1, CellState.Wall);
const campaign003WrongWallHint = chooseHint(campaign003Puzzle);
assert(
  campaign003WrongWallHint?.x === 1
    && campaign003WrongWallHint.y === 1
    && campaign003WrongWallHint.state === CellState.Floor,
  'Putting a wrong Wall in the hinted Campaign 003 cell keeps the same target but still requires Floor.',
);


class MemoryProfileStorage implements PlayerProfileStorage {
  saved: PlayerProfileV4 | null = null;
  async load(): Promise<unknown | null> { return this.saved; }
  async save(profile: PlayerProfileV4): Promise<void> { this.saved = profile; }
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
