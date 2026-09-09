import { campaignManifest } from '../content/campaign/manifest';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { createOnboardingFlow } from '../onboarding/OnboardingFlow';
import { CellState } from '../puzzle/types';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function key(x: number, y: number): string {
  return `${x}:${y}`;
}

function stepContains(
  step: ReturnType<typeof createOnboardingFlow>[number] | undefined,
  state: typeof CellState.Wall | typeof CellState.Floor,
  x: number,
  y: number,
): boolean {
  return step?.expectedState === state && step.cells.some((cell) => cell.x === x && cell.y === y);
}

for (const entry of TUTORIAL_MANIFEST) {
  for (const language of ['ru', 'en'] as const) {
    const flow = createOnboardingFlow(entry.id, language);
    assert(flow.length > 0, `${entry.id} ${language}: tutorial has actionable steps.`);
    assert(flow.every((step) => step.target === 'board-cells'), `${entry.id} ${language}: every tutorial step is action-driven.`);
  }
}

const tutorial2 = createOnboardingFlow('tutorial-002', 'ru');
assert(
  tutorial2[0]?.expectedState === CellState.Wall
    && tutorial2[0].guideClue?.axis === 'column'
    && tutorial2[0].guideClue.index === 0
    && tutorial2[0].cells.map(({ x, y }) => key(x, y)).join(',') === '0:1,0:2,0:3,0:4'
    && tutorial2[0].message.includes('столбце должно быть 4 стены'),
  'Tutorial 2 explains its first four walls from column clue 4, not from the Monster rule.',
);
assert(
  stepContains(tutorial2[1], CellState.Floor, 1, 0)
    && tutorial2[1]?.message.includes('монстра'),
  'Tutorial 2 introduces the Monster rule on the first Monster-exit Floor deduction.',
);

const tutorial3 = createOnboardingFlow('tutorial-003', 'ru');
const connectivityIndex = tutorial3.findIndex((step) => stepContains(step, CellState.Floor, 1, 1));
assert(connectivityIndex >= 0, 'Tutorial 3 contains the connectivity bridge Floor step.');
const tutorial3BeforeConnectivity = tutorial3.slice(0, connectivityIndex);
assert(
  tutorial3BeforeConnectivity.some((step) => stepContains(step, CellState.Wall, 0, 3)),
  'Tutorial 3 blocks the left region below before teaching connectivity.',
);
assert(
  tutorial3BeforeConnectivity.some((step) => stepContains(step, CellState.Wall, 1, 2)),
  'Tutorial 3 blocks the left region on the right before teaching connectivity.',
);
assert(
  tutorial3BeforeConnectivity.some((step) => stepContains(step, CellState.Floor, 2, 1)),
  'Tutorial 3 establishes known Floor on the far side before teaching the bridge deduction.',
);
assert(
  tutorial3[connectivityIndex]?.message.includes('соединён') === true
    && tutorial3[connectivityIndex]?.message.includes('Диагональ') === true,
  'Tutorial 3 explains orthogonal connectivity exactly at the bridge deduction.',
);

const tutorial4 = createOnboardingFlow('tutorial-004', 'ru');
const twoByTwoIndex = tutorial4.findIndex((step) => stepContains(step, CellState.Wall, 3, 2));
assert(twoByTwoIndex >= 0, 'Tutorial 4 contains the no-open-2x2 Wall deduction.');
const tutorial4BeforeTwoByTwo = new Set(
  tutorial4
    .slice(0, twoByTwoIndex)
    .filter((step) => step.expectedState === CellState.Floor)
    .flatMap((step) => step.cells.map(({ x, y }) => key(x, y))),
);
for (const requiredFloor of ['4:2', '3:3', '4:3']) {
  assert(
    tutorial4BeforeTwoByTwo.has(requiredFloor),
    `Tutorial 4 marks ${requiredFloor} Floor before the 2x2 rule targets 3:2.`,
  );
}
assert(
  tutorial4[twoByTwoIndex]?.message.includes('2×2') === true,
  'Tutorial 4 names the 2x2 rule only when the visual three-Floor setup exists.',
);

const tutorial5 = createOnboardingFlow('tutorial-005', 'ru');
const roomFloorKeys = new Set(['1:0', '2:0', '0:1', '1:1', '2:1', '0:2', '1:2', '2:2']);
assert(
  tutorial5[0]?.expectedState === CellState.Floor
    && tutorial5[0].cells.length === 8
    && tutorial5[0].cells.every(({ x, y }) => roomFloorKeys.has(key(x, y))),
  'Tutorial 5 first makes the player mark all eight non-Chest cells of the 3x3 room as Floor.',
);
const entranceIndex = tutorial5.findIndex((step) => (
  step.message.includes('один вход') && stepContains(step, CellState.Wall, 3, 2)
));
assert(entranceIndex > 0, 'Tutorial 5 teaches the single entrance after the room interior is established.');
assert(
  tutorial5.slice(0, entranceIndex).some((step) => stepContains(step, CellState.Floor, 2, 3)),
  'Tutorial 5 visibly establishes the chosen room entrance as Floor before closing the remaining boundary.',
);

const campaignLaunch = createCampaignGameSceneData(campaignManifest[0], {
  completedLevelIds: [],
  lastPlayedLevelId: null,
});
assert(campaignLaunch.onboarding.length === 0, 'Campaign launch contains no tutorial ids.');
assert(!campaignLaunch.contextualOnboarding, 'Campaign launch never enables contextual onboarding.');

console.info('[Dungeon Logic] Onboarding sanity: tutorial v2 deductions are visible, action-driven, and pedagogically ordered');
