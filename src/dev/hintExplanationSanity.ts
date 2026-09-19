import { CellState } from '../puzzle/types';
import { HumanDeductionTier, HumanRule } from '../puzzle/human-solver/types';
import type { PuzzleHint } from '../gameplay/HintService';
import { formatHintExplanation } from '../i18n/HintCopy';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function deduction(
  rule: HumanRule,
  state: PuzzleHint['state'],
  lineKind?: 'row' | 'column',
): PuzzleHint {
  return {
    x: 1,
    y: 1,
    state,
    reason: {
      kind: 'deduction',
      tier: rule === HumanRule.Contradiction
        ? HumanDeductionTier.Contradiction
        : HumanDeductionTier.Direct,
      rule,
      explanation: 'diagnostic-only',
      ...(lineKind === undefined ? {} : { lineKind }),
    },
  };
}

const ruUnlockingFloor = formatHintExplanation('ru', deduction(HumanRule.LineComplete, CellState.Floor, 'row'));
assert(ruUnlockingFloor.includes('строке'), 'RU useful row FLOOR names the row instead of an abstract line.');
assert(!ruUnlockingFloor.includes('линии'), 'RU row FLOOR never says generic line.');
assert(ruUnlockingFloor.includes('следующ'), 'RU useful LineComplete FLOOR explains that the mark opens the next logical move.');

const ruRow = formatHintExplanation('ru', deduction(HumanRule.LineFill, CellState.Wall, 'row'));
assert(ruRow.includes('строке'), 'RU row-fill hint explicitly names the row.');
assert(!ruRow.includes('линии'), 'RU row-fill hint never says generic line.');
assert(ruRow.includes('стен'), 'RU row-fill hint explains why a WALL is forced by the clue.');
assert(!ruRow.includes('line-fill'), 'RU hint never exposes solver rule ids.');

const ruColumn = formatHintExplanation('ru', deduction(HumanRule.LineFill, CellState.Wall, 'column'));
assert(ruColumn.includes('столбце'), 'RU column-fill hint explicitly names the column.');
assert(!ruColumn.includes('линии'), 'RU column-fill hint never says generic line.');

const ruConnectivity = formatHintExplanation('ru', deduction(HumanRule.Connectivity, CellState.Floor));
assert(ruConnectivity.includes('раздел'), 'RU connectivity hint explains that a wall would split the open area.');
assert(ruConnectivity.includes('проход'), 'RU connectivity FLOOR is described as a meaningful passage, not helper bookkeeping.');

const ruTwoByTwo = formatHintExplanation('ru', deduction(HumanRule.Open2x2, CellState.Wall));
assert(ruTwoByTwo.includes('2×2'), 'RU 2x2 hint names the visible rule.');

const ruMonsterFloor = formatHintExplanation('ru', deduction(HumanRule.MonsterDeadEnd, CellState.Floor));
assert(ruMonsterFloor.includes('монстр'), 'RU monster hint names the monster rule.');
assert(ruMonsterFloor.includes('проход'), 'RU monster FLOOR explains the unique passage.');

const ruContradictionWall = formatHintExplanation('ru', deduction(HumanRule.Contradiction, CellState.Wall));
const ruContradictionFloor = formatHintExplanation('ru', deduction(HumanRule.Contradiction, CellState.Floor));
assert(ruContradictionWall.includes('ПОЛ') && ruContradictionWall.includes('противореч'), 'RU contradiction WALL explains the rejected FLOOR assumption.');
assert(ruContradictionFloor.includes('СТЕН') && ruContradictionFloor.includes('противореч'), 'RU contradiction FLOOR explains the rejected WALL assumption.');

const wrongWall: PuzzleHint = {
  x: 0,
  y: 0,
  state: CellState.Floor,
  reason: { kind: 'correction', currentState: CellState.Wall },
};
const wrongFloor: PuzzleHint = {
  x: 0,
  y: 0,
  state: CellState.Wall,
  reason: { kind: 'correction', currentState: CellState.Floor },
};
assert(formatHintExplanation('ru', wrongWall).includes('неверн'), 'RU correction explains an existing wrong WALL before a new deduction.');
assert(formatHintExplanation('ru', wrongFloor).includes('неверн'), 'RU correction explains an existing wrong FLOOR before a new deduction.');

const enUnlockingFloor = formatHintExplanation('en', deduction(HumanRule.LineComplete, CellState.Floor, 'row'));
assert(enUnlockingFloor.toLowerCase().includes('row'), 'EN useful row FLOOR explicitly names the row.');
assert(enUnlockingFloor.toLowerCase().includes('next'), 'EN useful LineComplete FLOOR explains that the mark opens the next logical move.');

const enRow = formatHintExplanation('en', deduction(HumanRule.LineFill, CellState.Wall, 'row'));
const enColumn = formatHintExplanation('en', deduction(HumanRule.LineFill, CellState.Wall, 'column'));
const enConnectivity = formatHintExplanation('en', deduction(HumanRule.Connectivity, CellState.Floor));
assert(enRow.toLowerCase().includes('row'), 'EN row-fill hint explicitly names the row.');
assert(enColumn.toLowerCase().includes('column'), 'EN column-fill hint explicitly names the column.');
assert(enRow.toLowerCase().includes('wall'), 'EN line-fill hint explains the forced WALL.');
assert(enConnectivity.toLowerCase().includes('passage'), 'EN connectivity hint explains the required passage.');

for (const rule of Object.values(HumanRule)) {
  const axis = rule === HumanRule.LineComplete || rule === HumanRule.LineFill ? 'row' : undefined;
  const wall = formatHintExplanation('ru', deduction(rule, CellState.Wall, axis)).trim();
  const floor = formatHintExplanation('ru', deduction(rule, CellState.Floor, axis)).trim();
  assert(wall.length > 0 && floor.length > 0, `RU hint copy exists for ${rule} in both target states.`);
}

console.info('[Dungeon Logic] Hint explanation sanity: localized logical reasons passed');
