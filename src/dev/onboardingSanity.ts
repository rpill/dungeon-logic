import { CellState } from '../puzzle/types';
import { createOnboardingFlow, shouldShowContextualOnboarding } from '../onboarding/OnboardingFlow';
import { campaignManifest } from '../content/campaign/manifest';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level1 = createOnboardingFlow('campaign-001');
assert(level1.length === 5, 'Level 001 has five contextual onboarding steps.');
assert(level1[0]?.target === 'clue', 'Level 001 starts by explaining a clue.');
assert(level1[1]?.target === 'tool-wall', 'Level 001 then asks for the Wall tool.');
assert(
  level1[2]?.target === 'board-cell'
  && level1[2].x === 0
  && level1[2].y === 0
  && level1[2].expectedState === CellState.Wall,
  'Level 001 asks the player to place a wall at (0,0).',
);
assert(level1[3]?.target === 'tool-floor', 'Level 001 then introduces Floor.');
assert(
  level1[4]?.target === 'board-cell'
  && level1[4].x === 1
  && level1[4].y === 5
  && level1[4].expectedState === CellState.Floor,
  'Level 001 asks the player to mark (1,5) as floor.',
);

const level2 = createOnboardingFlow('campaign-002');
assert(level2.length === 2, 'Level 002 has two contextual chest steps.');
assert(
  level2[0]?.target === 'board-cell'
  && level2[0].x === 6
  && level2[0].y === 2
  && level2[0].expectedState === undefined,
  'Level 002 first highlights the fixed chest at (6,2).',
);
assert(
  level2[1]?.target === 'board-cell'
  && level2[1].x === 5
  && level2[1].y === 2
  && level2[1].expectedState === CellState.Floor,
  'Level 002 then asks for the interior floor consequence at (5,2).',
);

assert(createOnboardingFlow('campaign-003').length === 0, 'Level 003 has no blocking tutorial flow.');
const level4 = createOnboardingFlow('campaign-004');
assert(level4.length === 1 && level4[0]?.target === 'message', 'Level 004 has one short combined-rules message.');
assert(createOnboardingFlow('campaign-005').length === 0, 'Level 005 has no blocking tutorial flow.');
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

console.info('[Dungeon Logic] Onboarding sanity: exact 001/002/004 contextual flow + replay gating passed');
