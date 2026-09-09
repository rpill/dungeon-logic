import { campaignManifest } from '../content/campaign/manifest';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { createOnboardingFlow } from '../onboarding/OnboardingFlow';
import { PuzzleState } from '../puzzle/PuzzleState';
import { validatePuzzle } from '../puzzle/LevelValidator';
import { CellState } from '../puzzle/types';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV2 } from '../profile/types';
import { PuzzleSessionService } from '../gameplay/PuzzleSessionService';
import { TutorialService } from '../tutorial/TutorialService';
import { createLevelSelectItems, createTutorialGameSceneData } from '../runtime/GameLaunch';
import { CampaignService } from '../campaign/CampaignService';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const expectedIds = ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004'] as const;
  assert(TUTORIAL_MANIFEST.length === 4, 'Tutorial manifest contains exactly four levels.');
  assert(
    TUTORIAL_MANIFEST.map((entry) => entry.id).join(',') === expectedIds.join(','),
    'Tutorial IDs are stable and ordered.',
  );
  assert(campaignManifest.length === 30, 'Dedicated Tutorial does not change the 30-level Campaign manifest.');
  assert(campaignManifest[0]?.id === 'campaign-001' && campaignManifest.at(-1)?.id === 'campaign-030', 'Campaign IDs remain campaign-001 through campaign-030.');
  
  for (const entry of TUTORIAL_MANIFEST) {
    const steps = createOnboardingFlow(entry.id, 'ru');
    const boardSteps = steps.filter((step) => step.target === 'board-cells');
    assert(boardSteps.length > 0, `${entry.id} has guided board actions.`);
    assert(
      boardSteps.every((step) => step.target === 'board-cells' && (
        step.expectedState === CellState.Wall || step.expectedState === CellState.Floor
      )),
      `${entry.id} uses only explicit WALL/FLOOR tutorial actions.`,
    );
  
    const guidedWalls = new Set<string>();
    for (const step of boardSteps) {
      if (step.expectedState !== CellState.Wall) continue;
      for (const cell of step.cells) guidedWalls.add(`${cell.x}:${cell.y}`);
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
  
    const puzzle = new PuzzleState(entry.level);
    for (const key of solutionWalls) {
      const [x, y] = key.split(':').map(Number);
      puzzle.setCellState(x, y, CellState.Wall);
    }
    assert(
      validatePuzzle(puzzle).isSolved,
      `${entry.id} solves with walls only while all other editable cells remain Unknown.`,
    );


    if (entry.id === 'tutorial-003' || entry.id === 'tutorial-004') {
      const guidedPuzzle = new PuzzleState(entry.level);
      for (let stepIndex = 0; stepIndex < boardSteps.length; stepIndex += 1) {
        const step = boardSteps[stepIndex];
        for (const { x, y } of step.cells) guidedPuzzle.setCellState(x, y, step.expectedState);
        const guidedSolved = validatePuzzle(guidedPuzzle).isSolved;
        if (stepIndex < boardSteps.length - 1) {
          assert(!guidedSolved, `${entry.id} does not solve before its final guided action, so late Floor teaching cannot be skipped.`);
        } else {
          assert(guidedSolved, `${entry.id} solves exactly on its final guided action.`);
        }
      }
    }
  }
  
  const campaignFlow = createOnboardingFlow('campaign-001', 'ru');
  assert(campaignFlow.length === 0, 'Campaign Level 1 no longer owns contextual onboarding.');

  const tutorialLaunch = createTutorialGameSceneData(TUTORIAL_MANIFEST[0]);
  assert(tutorialLaunch.context.mode === 'tutorial', 'Tutorial launch uses first-class tutorial context.');
  assert(tutorialLaunch.contextualOnboarding, 'Tutorial launch enables guided onboarding.');
  assert(tutorialLaunch.onboarding.length === 0, 'Tutorial launch does not reuse legacy Campaign onboarding IDs.');
  
  
    class MemoryStorage implements PlayerProfileStorage {
      raw: unknown = null;
      async load(): Promise<unknown | null> { return this.raw; }
      async save(profile: PlayerProfileV2): Promise<void> { this.raw = profile; }
    }
  
    const storage = new MemoryStorage();
    const profileService = await PlayerProfileService.create(campaignManifest, storage, { saveDelayMs: 0 });
    const tutorial = TutorialService.create(TUTORIAL_MANIFEST, profileService);
    const campaign = CampaignService.create(campaignManifest, profileService);
    assert(!tutorial.canEnterCampaign(), 'Fresh profile cannot enter Campaign before Tutorial completion.');
    assert(!campaign.canPlayLevel('campaign-001'), 'Fresh profile cannot bypass Tutorial by starting Campaign directly.');
    const lockedCampaignItems = createLevelSelectItems(campaign.getLevels(), campaign.getProgress(), false);
    assert(lockedCampaignItems.every((item) => item.state === 'locked' && !item.playable), 'Level Select locks every Campaign card until Tutorial is complete.');
    assert(tutorial.getContinueLevel()?.id === 'tutorial-001', 'Fresh Tutorial starts at tutorial-001.');
  
    const first = await tutorial.startLevel('tutorial-001');
    const session = PuzzleSessionService.createTutorial(first.level, profileService, undefined, 100);
    session.getPuzzle().setCellState(1, 1, CellState.Wall);
    session.saveNow();
    assert(profileService.getProfile().tutorial.activePuzzle?.mode === 'tutorial', 'Tutorial session persists under tutorial.activePuzzle.');
    assert(profileService.getProfile().campaign.activePuzzle === null, 'Tutorial session never writes Campaign active state.');
    session.clearActivePuzzle();
    assert(profileService.getProfile().tutorial.activePuzzle === null, 'Tutorial active puzzle clears independently.');
  
    for (const id of expectedIds) {
      await tutorial.completeLevel(id);
    }
    assert(tutorial.canEnterCampaign(), 'Completing Tutorial 4 permanently unlocks Campaign.');
  assert(campaign.canPlayLevel('campaign-001'), 'Campaign Level 1 becomes playable after Tutorial completion.');
    assert(profileService.getProfile().tutorial.completed, 'Tutorial completion is persisted in the profile.');
    assert(profileService.getProfile().campaign.completedLevelIds.length === 0, 'Tutorial completion does not write Campaign results.');
  
    await tutorial.startLevel('tutorial-001');
    const replayFirstResult = await tutorial.completeLevel('tutorial-001');
    assert(replayFirstResult.recommendedNextLevel?.id === 'tutorial-002', 'Tutorial replay can continue through all four tutorial levels in order.');
    assert(tutorial.canEnterCampaign(), 'Tutorial replay never relocks Campaign.');
    assert(profileService.getProfile().campaign.completedLevelIds.length === 0, 'Tutorial replay still does not mutate Campaign completion.');
  
    console.info('[Dungeon Logic] Tutorial sanity: dedicated manifest + guided deductions + wall-only solve condition + progress service passed');
  }
  
  void main();
