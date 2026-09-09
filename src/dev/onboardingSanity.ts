import { campaignManifest } from '../content/campaign/manifest';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import {
  createOnboardingFlow,
  isOnboardingStepSatisfied,
  shouldShowContextualOnboarding,
} from '../onboarding/OnboardingFlow';
import { CellState } from '../puzzle/types';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const entry of campaignManifest) {
  assert(
    createOnboardingFlow(entry.id, 'ru').length === 0,
    `${entry.id} must not own runtime onboarding after Tutorial was split from Campaign.`,
  );
  assert(
    !shouldShowContextualOnboarding(entry.id, []),
    `${entry.id} must never resolve as contextual onboarding.`,
  );
}

for (const entry of TUTORIAL_MANIFEST) {
  for (const language of ['ru', 'en'] as const) {
    const flow = createOnboardingFlow(entry.id, language);
    assert(flow.length >= 2, `${entry.id} ${language} has a real guided flow.`);
    assert(
      flow.every((step) => step.target === 'board-cells'),
      `${entry.id} ${language} tutorial contains no standalone text step that waits for a panel click.`,
    );

    const boardSteps = flow.filter((step) => step.target === 'board-cells');
    assert(boardSteps.length > 0, `${entry.id} ${language} contains guided board actions.`);
    assert(
      boardSteps.every((step) => step.expectedState === CellState.Wall || step.expectedState === CellState.Floor),
      `${entry.id} ${language} guides only explicit WALL/FLOOR deductions.`,
    );

    for (const step of flow) {
      assert(
        !('autoAdvanceMs' in step),
        `${entry.id} ${language} has no auto-dismiss tutorial messages.`,
      );
      for (const { x, y } of step.cells) {
        const canonical = entry.level.solution[y]?.[x];
        const expectedCanonical = step.expectedState === CellState.Wall ? '#' : '.';
        assert(
          canonical === expectedCanonical,
          `${entry.id} guided target (${x},${y}) must match canonical ${step.expectedState}.`,
        );
      }
    }
  }

  assert(
    shouldShowContextualOnboarding(entry.id, []),
    `${entry.id} can resolve as tutorial onboarding before completion.`,
  );
  assert(
    !shouldShowContextualOnboarding(entry.id, [entry.id]),
    `${entry.id} compatibility helper suppresses a completed tutorial id.`,
  );
}


const tutorial1Flow = createOnboardingFlow('tutorial-001', 'ru');
const tutorial1BoardSteps = tutorial1Flow.filter((step) => step.target === 'board-cells');
assert(tutorial1BoardSteps[0]?.expectedState === CellState.Floor, 'Tutorial 1 starts by marking clue-0 cells as Floor.');
assert(
  tutorial1BoardSteps[0]?.guideClue?.axis === 'row' && tutorial1BoardSteps[0]?.guideClue?.index === 0,
  'Tutorial 1 first action points at an actual zero clue before teaching walls.',
);
const firstTutorial1Wall = tutorial1BoardSteps.findIndex((step) => step.expectedState === CellState.Wall);
assert(firstTutorial1Wall > 0, 'Tutorial 1 teaches at least one Floor deduction before the first Wall action.');
assert(
  tutorial1BoardSteps.slice(0, firstTutorial1Wall).every((step) => step.expectedState === CellState.Floor),
  'Tutorial 1 completes its zero-clue Floor pass before wall placement starts.',
);

const tutorial2BoardSteps = createOnboardingFlow('tutorial-002', 'ru')
  .filter((step) => step.target === 'board-cells');
const firstMonsterWallStep = tutorial2BoardSteps.findIndex((step) => (
  step.expectedState === CellState.Wall
  && step.cells.some(({ x, y }) => x === 0 && y === 1)
));
assert(firstMonsterWallStep >= 0, 'Tutorial 2 teaches the walls that create the first Monster dead end.');
const firstMonsterExitStep = tutorial2BoardSteps[firstMonsterWallStep + 1];
assert(
  firstMonsterExitStep?.expectedState === CellState.Floor
  && firstMonsterExitStep.cells.some(({ x, y }) => x === 1 && y === 0),
  "Tutorial 2 immediately marks the Monster's only remaining exit as Floor.",
);

for (const entry of TUTORIAL_MANIFEST) {
  for (const language of ['ru', 'en'] as const) {
    const flow = createOnboardingFlow(entry.id, language);
    for (const step of flow) {
      assert(step.message.length <= 120, `${entry.id} ${language} tutorial copy stays micro-sized (<=120 chars).`);
    }
  }
}

const firstTutorial = TUTORIAL_MANIFEST[0];
const firstBoardStep = createOnboardingFlow(firstTutorial.id, 'ru')
  .find((step) => step.target === 'board-cells');
assert(firstBoardStep?.target === 'board-cells', 'Tutorial 1 exposes a guided board action.');
assert(
  !isOnboardingStepSatisfied(firstBoardStep, () => CellState.Unknown),
  'A tutorial board step does not advance before its target state is placed.',
);
assert(
  isOnboardingStepSatisfied(
    firstBoardStep,
    (x, y) => firstBoardStep.cells.some((cell) => cell.x === x && cell.y === y)
      ? firstBoardStep.expectedState
      : CellState.Unknown,
  ),
  'A tutorial board step advances when all target cells match the requested state.',
);


const tutorial3BoardSteps = createOnboardingFlow('tutorial-003', 'ru')
  .filter((step) => step.target === 'board-cells');
assert(
  tutorial3BoardSteps[0]?.expectedState === CellState.Floor
    && tutorial3BoardSteps[0]?.guideClue?.axis === 'row'
    && tutorial3BoardSteps[0]?.guideClue?.index === 4,
  'Tutorial 3 starts from the zero row and asks the player to mark Floor before teaching 2x2.',
);
assert(
  tutorial3BoardSteps[1]?.expectedState === CellState.Floor
    && tutorial3BoardSteps[1]?.guideClue?.axis === 'column'
    && tutorial3BoardSteps[1]?.guideClue?.index === 0,
  'Tutorial 3 follows with the zero column Floor deduction.',
);
const tutorial3TwoByTwoIndex = tutorial3BoardSteps.findIndex((step) => (
  step.expectedState === CellState.Wall
  && step.cells.some(({ x, y }) => x === 1 && y === 1)
));
assert(tutorial3TwoByTwoIndex > 1, 'Tutorial 3 reaches the first 2x2 wall only after Floor setup.');
const tutorial3FloorsBefore2x2 = new Set(
  tutorial3BoardSteps
    .slice(0, tutorial3TwoByTwoIndex)
    .filter((step) => step.expectedState === CellState.Floor)
    .flatMap((step) => step.cells.map(({ x, y }) => `${x}:${y}`)),
);
for (const key of ['0:0', '1:0', '0:1']) {
  assert(tutorial3FloorsBefore2x2.has(key), `Tutorial 3 marks ${key} as Floor before using it to explain the first 2x2.`);
}
for (const key of ['1:2', '2:2', '2:3', '3:0', '4:2']) {
  assert(
    tutorial3BoardSteps.some((step) => step.expectedState === CellState.Floor && step.cells.some(({ x, y }) => `${x}:${y}` === key)),
    `Tutorial 3 explicitly asks the player to mark forced Floor at ${key}.`,
  );
}
const tutorial3LastBoardStep = tutorial3BoardSteps.at(-1);
assert(
  tutorial3LastBoardStep !== undefined
    && tutorial3LastBoardStep.expectedState === CellState.Wall
    && tutorial3LastBoardStep.cells.some(({ x, y }) => x === 4 && y === 0),
  'Tutorial 3 keeps one final wall until after the late Floor deductions so solve does not skip them.',
);

const tutorial4BoardSteps = createOnboardingFlow('tutorial-004', 'ru')
  .filter((step) => step.target === 'board-cells');
assert(
  tutorial4BoardSteps[0]?.expectedState === CellState.Floor
    && tutorial4BoardSteps[0]?.guideClue?.axis === 'row'
    && tutorial4BoardSteps[0]?.guideClue?.index === 5,
  'Tutorial 4 starts from its zero row and marks Floor.',
);
assert(
  tutorial4BoardSteps[1]?.expectedState === CellState.Floor
    && tutorial4BoardSteps[1]?.guideClue?.axis === 'column'
    && tutorial4BoardSteps[1]?.guideClue?.index === 0,
  'Tutorial 4 follows with its zero column and marks Floor.',
);
const treasureInterior = new Set(['1:0', '2:0', '2:1', '1:2', '2:2']);
assert(
  tutorial4BoardSteps.some((step) => (
    step.expectedState === CellState.Floor
    && [...treasureInterior].every((key) => step.cells.some(({ x, y }) => `${x}:${y}` === key))
  )),
  'Tutorial 4 makes the player mark the Treasure Room interior as Floor.',
);
const monsterExitIndex = tutorial4BoardSteps.findIndex((step) => (
  step.expectedState === CellState.Floor
  && step.cells.some(({ x, y }) => x === 5 && y === 1)
));
assert(monsterExitIndex >= 0, "Tutorial 4 explicitly marks the Monster's only exit as Floor.");
const wallsBeforeMonsterExit = new Set(
  tutorial4BoardSteps
    .slice(0, monsterExitIndex)
    .filter((step) => step.expectedState === CellState.Wall)
    .flatMap((step) => step.cells.map(({ x, y }) => `${x}:${y}`)),
);
for (const key of ['4:0', '4:2', '3:1']) {
  assert(wallsBeforeMonsterExit.has(key), `Tutorial 4 places Monster-side wall ${key} before asking for its Floor exit.`);
}
assert(
  tutorial4BoardSteps.slice(monsterExitIndex + 1).some((step) => (
    step.expectedState === CellState.Wall
    && step.cells.some(({ x, y }) => x === 1 && y === 4)
    && step.cells.some(({ x, y }) => x === 2 && y === 4)
  )),
  'Tutorial 4 keeps final walls after the Monster Floor exit so solve cannot skip the teaching step.',
);


const campaignLaunch = createCampaignGameSceneData(campaignManifest[0], {
  completedLevelIds: [],
  lastPlayedLevelId: null,
});
assert(campaignLaunch.onboarding.length === 0, 'Campaign launch contains no tutorial ids.');
assert(!campaignLaunch.contextualOnboarding, 'Campaign launch never enables contextual onboarding.');

console.info('[Dungeon Logic] Onboarding sanity: tutorial deductions + globally non-blocking text panels passed');
