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
assert(level1.length === 2, 'Level 001 has two action-driven onboarding steps with no Continue-only step.');

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

const level2 = createOnboardingFlow('campaign-002');
assert(level2.length === 1, 'Level 002 has one actionable chest-room step with no Continue-only explanation.');
const roomStep = level2[0];
assert(
  roomStep?.target === 'board-cells'
  && roomStep.expectedState === CellState.Floor
  && roomStep.cells.length === 1
  && roomStep.cells[0]?.x === 5
  && roomStep.cells[0]?.y === 2,
  'Level 002 teaches the room rule through the concrete floor consequence at (5,2).',
);

assert(createOnboardingFlow('campaign-003').length === 0, 'Level 003 has no blocking tutorial flow.');
const level4 = createOnboardingFlow('campaign-004');
assert(
  level4.length === 1
  && level4[0]?.target === 'message'
  && level4[0].autoAdvanceMs > 0,
  'Level 004 combined-rules note auto-advances without requiring Continue.',
);
assert(createOnboardingFlow('campaign-005').length === 0, 'Level 005 has no blocking onboarding flow.');
assert(createOnboardingFlow('campaign-999').length === 0, 'Unknown levels have no contextual onboarding.');

assert(shouldShowContextualOnboarding('campaign-001', []) === true, 'Fresh level 001 shows onboarding.');
assert(shouldShowContextualOnboarding('campaign-001', ['campaign-001']) === false, 'Completed level replay skips onboarding.');
assert(shouldShowContextualOnboarding('campaign-004', ['campaign-001', 'campaign-002', 'campaign-003']) === true, 'First incomplete level 004 play shows its message.');
assert(shouldShowContextualOnboarding('campaign-005', []) === false, 'Level 005 never shows a blocking onboarding flow.');

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
const launchFourth = createCampaignGameSceneData(campaignManifest[3], {
  completedLevelIds: ['campaign-001', 'campaign-002', 'campaign-003'],
  lastPlayedLevelId: 'campaign-004',
});
assert(launchFourth.contextualOnboarding === true, 'First incomplete campaign-004 launch enables the combined-rules message.');

console.info('[Dungeon Logic] Onboarding sanity: action-driven 001/002 + auto message 004 passed');
