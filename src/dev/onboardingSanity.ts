import { CellState } from '../puzzle/types';
import {
  createOnboardingFlow,
  isOnboardingStepSatisfied,
  shouldShowContextualOnboarding,
} from '../onboarding/OnboardingFlow';
import { campaignManifest } from '../content/campaign/manifest';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level1 = createOnboardingFlow('campaign-001');
assert(level1.length >= 5, 'Level 001 must continue beyond row-clue basics into monster rules and a handoff tip.');

const wallsStep = level1[0];
assert(wallsStep?.target === 'board-cells', 'Level 001 starts with an actionable multi-cell wall deduction.');
assert(wallsStep.expectedState === CellState.Wall, 'First 001 action requires walls.');
assert(wallsStep.cells.length === 5, 'First 001 action requires all five forced walls, not only one wall.');
assert(
  wallsStep.cells.map(({ x, y }) => `${x},${y}`).join('|') === '0,0|1,0|3,0|4,0|5,0',
  'First 001 action targets the five editable cells in the row clue 5.',
);
assert(
  wallsStep.guideClue?.axis === 'row' && wallsStep.guideClue.index === 0,
  'First 001 action keeps row clue 5 highlighted.',
);

const oneWall = new Map<string, string>([['0,0', CellState.Wall]]);
assert(
  isOnboardingStepSatisfied(
    wallsStep,
    (x, y) => (oneWall.get(`${x},${y}`) as typeof CellState.Wall | undefined) ?? CellState.Unknown,
  ) === false,
  'Putting only one of the five walls must not advance onboarding to the row clue 0.',
);

const allWalls = new Map<string, string>(wallsStep.cells.map(({ x, y }) => [`${x},${y}`, CellState.Wall]));
assert(
  isOnboardingStepSatisfied(
    wallsStep,
    (x, y) => (allWalls.get(`${x},${y}`) as typeof CellState.Wall | undefined) ?? CellState.Unknown,
  ) === true,
  'Onboarding advances only after all five forced walls are placed.',
);

const floorStep = level1[1];
assert(floorStep?.target === 'board-cells', 'Second 001 step is also action-driven.');
assert(floorStep.expectedState === CellState.Floor, 'Second 001 action requires floor marks.');
assert(floorStep.cells.length === 5, 'Row clue 0 tutorial asks for every editable floor cell in that row.');
assert(
  floorStep.guideClue?.axis === 'row' && floorStep.guideClue.index === 5,
  'Row clue 0 is not introduced until the five-wall step is complete.',
);

const bottomMonsterStep = level1.find((step) => (
  step.target === 'board-cells'
  && step.expectedState === CellState.Wall
  && step.cells.some(({ x, y }) => x === 0 && y === 4)
));
assert(bottomMonsterStep?.target === 'board-cells', 'Level 001 must teach the monster dead-end rule with a concrete action.');
assert(
  bottomMonsterStep.focusCells?.some(({ x, y }) => x === 0 && y === 5) === true,
  'Monster lesson highlights the bottom-left monster itself.',
);
assert(
  bottomMonsterStep.message.includes('ровно один') && bottomMonsterStep.message.includes('тупик'),
  'Monster lesson explicitly says a monster is a dead end with exactly one orthogonal floor neighbor.',
);

const columnFourStep = level1.find((step) => (
  step.target === 'board-cells'
  && step.guideClue?.axis === 'column'
  && step.guideClue.index === 0
));
assert(columnFourStep?.target === 'board-cells', 'Level 001 returns to a column clue after the first monster deduction.');
assert(
  columnFourStep.cells.map(({ x, y }) => `${x},${y}`).join('|') === '0,1|0,2',
  'Column clue 4 step asks only for the two still-unknown forced walls, not cells already solved earlier.',
);

const secondMonsterStep = level1.find((step) => (
  step.target === 'board-cells'
  && step.expectedState === CellState.Floor
  && step.cells.some(({ x, y }) => x === 1 && y === 3)
));
assert(secondMonsterStep?.target === 'board-cells', 'Level 001 reinforces the monster rule on a second monster.');
assert(
  secondMonsterStep.focusCells?.some(({ x, y }) => x === 0 && y === 3) === true,
  'Second monster lesson highlights the monster whose only exit is to the right.',
);

const level1Handoff = level1[level1.length - 1];
assert(level1Handoff?.target === 'message' && level1Handoff.allowInput === true, 'Level 001 ends with a non-blocking handoff tip.');
assert(level1Handoff.message.includes('любой тупик'), 'Level 001 handoff teaches the converse dead-end rule.');
assert(level1Handoff.message.includes('связ'), 'Level 001 handoff reminds the player that open cells must stay connected.');

const level2 = createOnboardingFlow('campaign-002');
assert(level2.length >= 4, 'Level 002 must teach room interior, one entrance, 2x2 exception, and handoff.');
const roomInterior = level2[0];
assert(roomInterior?.target === 'board-cells' && roomInterior.expectedState === CellState.Floor, 'Level 002 starts by constructing the 3x3 treasure room.');
assert(roomInterior.cells.length === 8, 'Treasure-room interior step targets all eight editable cells around the fixed chest.');
assert(roomInterior.focusCells?.some(({ x, y }) => x === 6 && y === 2) === true, 'Treasure-room step highlights the chest.');
assert(roomInterior.message.includes('3×3'), 'Treasure-room step explicitly states the room is 3x3.');

const roomBorder = level2.find((step) => step.target === 'board-cells' && step.expectedState === CellState.Wall && step.cells.length === 8);
assert(roomBorder?.target === 'board-cells', 'Level 002 concretely teaches that the room boundary is closed except for one entrance.');
const roomEntrance = level2.find((step) => step.target === 'board-cells' && step.expectedState === CellState.Floor && step.cells.some(({ x, y }) => x === 5 && y === 4));
assert(roomEntrance?.target === 'board-cells', 'Level 002 makes the player mark the single room entrance.');
const roomTip = level2[level2.length - 1];
assert(roomTip?.target === 'message' && roomTip.allowInput === true, 'Level 002 ends with a non-blocking room rule tip.');
assert(roomTip.message.includes('2×2') && roomTip.message.toLowerCase().includes('вне комнаты'), 'Level 002 teaches the open-2x2 prohibition and its treasure-room exception.');

const level3 = createOnboardingFlow('campaign-003');
assert(level3.length === 1 && level3[0]?.target === 'message' && level3[0].allowInput === true, 'Level 003 is an independent solve with only a non-blocking reminder.');
assert(level3[0].message.includes('связ'), 'Level 003 reminder teaches open-space connectivity.');
assert(level3[0].message.includes('2×2'), 'Level 003 reminder reinforces the no-open-2x2 rule.');

const level4 = createOnboardingFlow('campaign-004');
assert(level4.length >= 4, 'Level 004 must concretely teach interaction between clue, room, and monster rules.');
const zeroColumn = level4[0];
assert(zeroColumn?.target === 'board-cells' && zeroColumn.guideClue?.axis === 'column' && zeroColumn.guideClue.index === 3, 'Level 004 begins with the obvious zero-column deduction.');
const mixedMonster = level4.find((step) => step.target === 'board-cells' && step.focusCells?.some(({ x, y }) => x === 5 && y === 2));
assert(mixedMonster?.target === 'board-cells' && mixedMonster.expectedState === CellState.Floor, 'Level 004 uses the room border to force the monster exit.');
assert(mixedMonster.message.includes('комнат') && mixedMonster.message.includes('тупик'), 'Mixed tutorial explicitly explains how room and monster rules interact.');

const level5 = createOnboardingFlow('campaign-005');
assert(level5.length === 1 && level5[0]?.target === 'message' && level5[0].allowInput === true, 'Level 005 is a fully independent final onboarding puzzle with a non-blocking reminder.');
assert(level5[0].message.includes('ⓘ'), 'Level 005 points the player to the permanent rules reference instead of blocking them.');


for (const entry of campaignManifest.slice(0, 5)) {
  const flow = createOnboardingFlow(entry.id);
  for (const step of flow) {
    if (step.target !== 'board-cells') continue;
    for (const { x, y } of step.cells) {
      assert(!entry.level.monsters.some((cell) => cell.x === x && cell.y === y), `${entry.id} tutorial must not ask the player to edit a monster cell.`);
      assert(!entry.level.chests.some((cell) => cell.x === x && cell.y === y), `${entry.id} tutorial must not ask the player to edit a chest cell.`);
      const expected = entry.level.solution[y]?.[x] === '#' ? CellState.Wall : CellState.Floor;
      assert(step.expectedState === expected, `${entry.id} tutorial target (${x},${y}) must agree with the immutable promoted solution.`);
    }
  }
}

assert(createOnboardingFlow('campaign-999').length === 0, 'Unknown levels have no contextual onboarding.');
assert(shouldShowContextualOnboarding('campaign-001', []) === true, 'Fresh level 001 shows onboarding.');
assert(shouldShowContextualOnboarding('campaign-001', ['campaign-001']) === false, 'Completed level replay skips onboarding.');
assert(shouldShowContextualOnboarding('campaign-003', ['campaign-001', 'campaign-002']) === true, 'Fresh 003 shows its non-blocking reminder.');
assert(shouldShowContextualOnboarding('campaign-005', ['campaign-001', 'campaign-002', 'campaign-003', 'campaign-004']) === true, 'Fresh 005 shows its final non-blocking onboarding reminder.');

const launchFresh = createCampaignGameSceneData(campaignManifest[0], {
  completedLevelIds: [],
  lastPlayedLevelId: null,
});
assert(launchFresh.contextualOnboarding === true, 'Fresh campaign-001 launch enables contextual onboarding.');
const launchReplay = createCampaignGameSceneData(campaignManifest[0], {
  completedLevelIds: ['campaign-001'],
  lastPlayedLevelId: 'campaign-001',
});
assert(launchReplay.contextualOnboarding === false, 'Completed campaign-001 replay disables contextual onboarding.');

console.info('[Dungeon Logic] Onboarding sanity: complete 001-005 action-driven teaching flow passed');
