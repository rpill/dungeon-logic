import { createOnboardingFlow } from '../onboarding/OnboardingFlow';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tutorialIds = [
  'tutorial-001',
  'tutorial-002',
  'tutorial-003',
  'tutorial-004',
  'tutorial-005',
] as const;

for (const id of tutorialIds) {
  for (const language of ['ru', 'en'] as const) {
    const flow = createOnboardingFlow(id, language);
    assert(
      flow.every((step) => step.target === 'board-cells'),
      `${id} ${language}: tutorial copy must always be attached to an actionable board step.`,
    );
  }
}

console.info('[Dungeon Logic] Onboarding message sanity: all five tutorials advance from board actions only');
