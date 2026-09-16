import { campaignManifest } from '../content/campaign/manifest';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { createOnboardingFlow } from '../onboarding/OnboardingFlow';
import { PuzzleState } from '../puzzle/PuzzleState';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { CellState } from '../puzzle/types';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV5 } from '../profile/types';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { TutorialService } from '../tutorial/TutorialService';
import { createLevelSelectItems, createTutorialGameSceneData } from '../runtime/GameLaunch';
import { CampaignService } from '../campaign/CampaignService';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function solutionState(symbol: string): typeof CellState.Wall | typeof CellState.Floor {
  return symbol === '#' ? CellState.Wall : CellState.Floor;
}

async function main(): Promise<void> {
  const expectedIds = [
    'tutorial-001',
    'tutorial-002',
    'tutorial-003',
    'tutorial-004',
    'tutorial-005',
  ] as const;
  assert(TUTORIAL_MANIFEST.length === 5, 'Tutorial manifest contains exactly five levels.');
  assert(
    TUTORIAL_MANIFEST.map((entry) => entry.id).join(',') === expectedIds.join(','),
    'Tutorial IDs are stable and ordered from tutorial-001 through tutorial-005.',
  );
  assert(campaignManifest.length === 64, 'Dedicated Tutorial coexists with the 64-level Campaign manifest.');
  assert(
    campaignManifest[0]?.id === 'campaign-001' && campaignManifest.at(-1)?.id === 'campaign-064',
    'Campaign IDs remain stable from campaign-001 through campaign-064.',
  );

  for (const entry of TUTORIAL_MANIFEST) {
    const steps = createOnboardingFlow(entry.id, 'ru');
    assert(steps.length > 0, `${entry.id} has guided board actions.`);
    assert(steps.every((step) => step.target === 'board-cells'), `${entry.id} has no standalone message steps.`);

    const guidedWalls = new Set<string>();
    for (const step of steps) {
      for (const { x, y } of step.cells) {
        const symbol = entry.level.solution[y]?.[x];
        assert(symbol === '.' || symbol === '#', `${entry.id} guided cell ${x}:${y} is an editable solution cell.`);
        assert(
          step.expectedState === solutionState(symbol),
          `${entry.id} guided ${step.expectedState} at ${x}:${y} matches the hidden solution.`,
        );
        if (step.expectedState === CellState.Wall) guidedWalls.add(`${x}:${y}`);
      }
    }

    const solutionWalls = new Set<string>();
    for (let y = 0; y < entry.level.height; y += 1) {
      for (let x = 0; x < entry.level.width; x += 1) {
        if (entry.level.solution[y]?.[x] === '#') solutionWalls.add(`${x}:${y}`);
      }
    }
    assert(
      [...solutionWalls].every((key) => guidedWalls.has(key))
        && [...guidedWalls].every((key) => solutionWalls.has(key)),
      `${entry.id} guides every required wall and no false wall.`,
    );

    const wallsOnlyPuzzle = new PuzzleState(entry.level);
    for (const key of solutionWalls) {
      const [x, y] = key.split(':').map(Number);
      wallsOnlyPuzzle.setCellState(x, y, CellState.Wall);
    }
    assert(
      validatePuzzle(wallsOnlyPuzzle).isSolved,
      `${entry.id} solves with walls only while remaining editable cells can stay Unknown.`,
    );

    const guidedPuzzle = new PuzzleState(entry.level);
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
      const step = steps[stepIndex];
      for (const { x, y } of step.cells) guidedPuzzle.setCellState(x, y, step.expectedState);
      const solved = validatePuzzle(guidedPuzzle).isSolved;
      if (stepIndex < steps.length - 1) {
        assert(!solved, `${entry.id} cannot solve before its final guided action.`);
      } else {
        assert(solved, `${entry.id} solves exactly on its final guided action.`);
      }
    }
  }

  assert(createOnboardingFlow('campaign-001', 'ru').length === 0, 'Campaign Level 1 owns no tutorial flow.');

  const tutorialLaunch = createTutorialGameSceneData(TUTORIAL_MANIFEST[0]);
  assert(tutorialLaunch.context.mode === 'tutorial', 'Tutorial launch uses first-class tutorial context.');
  assert(tutorialLaunch.contextualOnboarding, 'Tutorial launch enables guided onboarding.');
  assert(tutorialLaunch.onboarding.length === 0, 'Tutorial launch does not reuse Campaign onboarding IDs.');

  class MemoryStorage implements PlayerProfileStorage {
    raw: unknown = null;
    async load(): Promise<unknown | null> { return this.raw; }
    async save(profile: PlayerProfileV5): Promise<void> { this.raw = profile; }
  }

  const storage = new MemoryStorage();
  const profileService = await PlayerProfileService.create(campaignManifest, storage, { saveDelayMs: 0 });
  const tutorial = TutorialService.create(TUTORIAL_MANIFEST, profileService);
  const campaign = CampaignService.create(campaignManifest, profileService);
  assert(!tutorial.canEnterCampaign(), 'Fresh profile cannot enter Campaign before Tutorial completion.');
  assert(!campaign.canPlayLevel('campaign-001'), 'Fresh profile cannot bypass Tutorial by starting Campaign directly.');
  const lockedCampaignItems = createLevelSelectItems(campaign.getLevels(), campaign.getProgress(), false);
  assert(lockedCampaignItems.every((item) => item.state === 'locked' && !item.playable), 'Campaign cards stay locked until Tutorial 5 is complete.');
  assert(tutorial.getContinueLevel()?.id === 'tutorial-001', 'Fresh Tutorial starts at tutorial-001.');

  const first = await tutorial.startLevel('tutorial-001');
  const session = PuzzleSessionService.createTutorial(first.level, profileService, undefined, 100);
  session.getPuzzle().setCellState(1, 1, CellState.Wall);
  session.saveNow();
  assert(profileService.getProfile().tutorial.activePuzzle?.mode === 'tutorial', 'Tutorial session persists under tutorial.activePuzzle.');
  assert(Object.keys(profileService.getProfile().campaign.drafts).length === 0, 'Tutorial session never writes Campaign draft state.');

  await tutorial.completeLevel('tutorial-001');
  session.saveNow();
  assert(
    tutorial.getContinueLevel()?.id === 'tutorial-002',
    'A stale activePuzzle for a completed Tutorial level is ignored and resume advances to the first incomplete lesson.',
  );
  session.clearActivePuzzle();

  for (const id of expectedIds.slice(0, 4)) await tutorial.completeLevel(id);
  assert(!tutorial.canEnterCampaign(), 'Completing Tutorial 4 alone does not unlock Campaign on a fresh profile.');
  assert(tutorial.getContinueLevel()?.id === 'tutorial-005', 'Tutorial 5 unlocks after Tutorial 4.');
  await tutorial.completeLevel('tutorial-005');
  assert(tutorial.canEnterCampaign(), 'Completing Tutorial 5 permanently unlocks Campaign.');
  assert(campaign.canPlayLevel('campaign-001'), 'Campaign Level 1 becomes playable after Tutorial 5.');
  assert(profileService.getProfile().tutorial.completed, 'Five-level Tutorial completion is persisted.');
  assert(profileService.getProfile().campaign.completedLevelIds.length === 0, 'Tutorial completion does not write Campaign results.');

  await tutorial.startLevel('tutorial-001');
  const replayFirstResult = await tutorial.completeLevel('tutorial-001');
  assert(replayFirstResult.recommendedNextLevel?.id === 'tutorial-002', 'Tutorial replay continues through the five tutorial levels in order.');
  assert(tutorial.canEnterCampaign(), 'Tutorial replay never relocks Campaign.');

  console.info('[Dungeon Logic] Tutorial sanity: five pedagogical fixtures + action flow + wall-only completion + progression passed');
}

void main();
