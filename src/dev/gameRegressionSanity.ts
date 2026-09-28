import { readFileSync } from 'node:fs';

import { level as campaign003 } from '../content/campaign/levels/campaign003';
import { resolveCampaignPlayState } from '../runtime/CampaignPlayState';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gameSceneSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
const settingsSceneSource = readFileSync(new URL('../scenes/SettingsScene.ts', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../main.ts', import.meta.url), 'utf8');

const review = resolveCampaignPlayState(campaign003, {
  completedLevelIds: [campaign003.id],
  levelResults: {
    [campaign003.id]: {
      bestTimeMs: 33_000,
      minHintsUsed: 0,
      solveCount: 1,
      solvedWithoutHints: true,
    },
  },
  drafts: {},
});
assert(review.mode === 'completed-review' && !('displayTimeMs' in review), 'Completed campaign launch resolves to locked untimed review.');
assert(
  gameSceneSource.includes('const qaCompletionVisual = import.meta.env.DEV')
    && gameSceneSource.includes('let solved = completedReview || qaCompletionVisual;'),
  'Completed review starts solved/locked; the visual QA completion fixture is DEV-only.',
);
assert(gameSceneSource.includes('const initialTimerMs = runTimerEnabled'), 'GameScene only initializes a run timer in timed modes.');
assert(gameSceneSource.includes("board.setInputEnabled(false);\n      updateTimerText();\n      refreshStatusText();"), 'Completed review disables board input while untimed Campaign keeps its timer hidden.');
assert(gameSceneSource.includes("const freshSession = PuzzleSessionService.createCampaign("), 'Completed Reset creates a new campaign puzzle session.');
assert(gameSceneSource.includes("this.scene.restart(launchData);"), 'Fresh completed-level replay restarts GameScene without restoring a visible Campaign timer.');
assert(gameSceneSource.includes("if (currentHint !== null) {\n        refreshStatusText();\n        return;"), 'Unresolved current hint cannot consume/reveal the same hint again.');
assert(
  gameSceneSource.includes('const menuHit = menuAction.hit;')
    && gameSceneSource.includes('const menuAction = createHeaderActionButton(this, {'),
  'GameScene exposes one compact top-level Menu action.',
);
assert(gameSceneSource.includes('const openGameMenu'), 'GameScene opens a modal menu instead of separate Help/Settings chrome actions.');
assert(gameSceneSource.includes("openSceneOverlayFromMenu(SETTINGS_SCENE_KEY)"), 'Game menu opens Settings through the existing paused-scene overlay flow.');
assert(gameSceneSource.includes("openSceneOverlayFromMenu(HELP_SCENE_KEY)"), 'Game menu opens Rules through the existing paused-scene overlay flow.');
assert(gameSceneSource.includes('copy.game.exitHome'), 'Game menu exposes a direct exit to Home.');
assert(gameSceneSource.includes('leaveGameTo(HOME_SCENE_KEY)'), 'Game menu direct Home exit preserves the existing save-and-flush leave flow.');
assert(!gameSceneSource.includes('helpText'), 'Game top chrome no longer keeps a separate Rules text action.');
assert(!gameSceneSource.includes('settingsText'), 'Game top chrome no longer keeps a separate Settings icon action.');
assert(!gameSceneSource.includes("'⚙'"), 'Game top chrome no longer relies on a mismatched Unicode gear glyph.');
assert(gameSceneSource.includes("copy.game.levelTitle(campaignEntry.slot)"), 'Campaign GameScene title identifies the current level number.');
assert(settingsSceneSource.includes("this.scene.restart({ returnSceneKey: this.returnSceneKey });"), 'Settings preserves GameScene return target across its own restart.');
assert(settingsSceneSource.includes("this.scene.resume('GameScene');"), 'Settings Back returns directly to the paused GameScene.');
const gameSceneIndex = mainSource.indexOf('    GameScene,');
const settingsSceneIndex = mainSource.indexOf('    SettingsScene,');
assert(
  gameSceneIndex >= 0 && settingsSceneIndex > gameSceneIndex,
  'SettingsScene is registered after GameScene so in-game Settings renders above the paused board.',
);
assert(!gameSceneSource.includes('onboardingFocusGuides'), 'Tutorial focusCells do not render a secondary overlay on the board.');
assert(!gameSceneSource.includes('for (const { x, y } of step.focusCells ?? [])'), 'Tutorial focusCells are contextual metadata only and are not painted over cells.');
assert(!gameSceneSource.includes("target === 'message'"), 'Tutorial runtime has no standalone message-step branch.');
assert(gameSceneSource.includes('isOnboardingStepSatisfied(step, (x, y) => puzzle.getCellState(x, y))\n      ) {\n        advanceOnboarding();'), 'Completing the current guided board action advances tutorial copy immediately.');
assert(
  gameSceneSource.includes('calculateCompletionPanelLayout(')
    && gameSceneSource.includes('statusText.setVisible(false);')
    && gameSceneSource.includes('renderCompletionInfoPills(layout);'),
  'Completion state is rendered by the dedicated completion-panel layout instead of gameplay toolbar status text.',
);
const dailySceneSource = readFileSync(new URL('../scenes/DailyScene.ts', import.meta.url), 'utf8');
assert(dailySceneSource.includes('todayCardTop'), 'Daily hub lays out the Today card from an explicit top edge so the СЕГОДНЯ label cannot sit on its border.');

assert(gameSceneSource.includes("const rankedDaily = dailyContext?.ranked === true;"), 'GameScene distinguishes the one ranked Daily attempt from non-ranked play.');
assert(gameSceneSource.includes('PuzzleSessionService.createDaily('), 'Ranked Daily gameplay resumes from the persisted Daily puzzle session.');
assert(gameSceneSource.includes('RANKED_DAILY_HINT_UNLOCK_MS'), 'GameScene owns an explicit five-minute ranked-Daily hint unlock threshold.');
assert(!gameSceneSource.includes('if (rankedDaily) return;'), 'Ranked Daily no longer hard-blocks hints forever.');
assert(gameSceneSource.includes('rankedDailyHintUnlocked'), 'Ranked Daily computes whether the five-minute hint gate is open.');
assert(gameSceneSource.includes('dailyHintOutsideRating'), 'Ranked Daily confirmation warns that using a hint removes leaderboard eligibility.');
assert(gameSceneSource.includes('const rankedDailyDisplayAnchorMs = rankedDaily ? Date.now() : 0;'), 'Ranked Daily display time is anchored independently of ordinary active-time pauses.');
const performPlayableResetStart = gameSceneSource.indexOf('const performPlayableReset = (): boolean =>');
const showResetDialogStart = gameSceneSource.indexOf('const showResetDialog = (): void =>', performPlayableResetStart);
assert(performPlayableResetStart >= 0 && showResetDialogStart > performPlayableResetStart, 'GameScene playable reset helper can be isolated for Daily regression coverage.');
const performPlayableResetSource = gameSceneSource.slice(performPlayableResetStart, showResetDialogStart);
assert(performPlayableResetSource.includes('board?.reset()'), 'Daily Reset clears board marks through the existing puzzle session.');

const resetRequestStart = gameSceneSource.indexOf('const requestReset = (): void =>');
const puzzleChangedStart = gameSceneSource.indexOf('const handlePuzzleChanged = (): void =>', resetRequestStart);
assert(resetRequestStart >= 0 && puzzleChangedStart > resetRequestStart, 'GameScene reset request flow can be isolated for Daily regression coverage.');
const resetRequestSource = gameSceneSource.slice(resetRequestStart, puzzleChangedStart);
assert(resetRequestSource.includes('performPlayableReset();'), 'Daily Reset delegates to the existing playable puzzle session reset helper.');
assert(!resetRequestSource.includes('beginDaily('), 'Daily Reset does not start a new attempt or reset its ranked start timestamp.');
assert(gameSceneSource.includes("launchData.context.mode === 'tutorial'"), 'GameScene recognizes first-class Tutorial launch context.');
assert(gameSceneSource.includes('PuzzleSessionService.createTutorial('), 'Tutorial gameplay persists through a dedicated tutorial puzzle session.');
assert(gameSceneSource.includes('createOnboardingFlow(launchData.context.tutorialLevelId, language)'), 'Tutorial runtime loads tutorial-only guided flow.');
assert(gameSceneSource.includes('finishTutorialLevel('), 'Solved Tutorial dispatches through TutorialService instead of Campaign completion.');
assert(
  gameSceneSource.includes('const showTutorialCompletionState =')
    && gameSceneSource.includes('const nextLevel = result.recommendedNextLevel;')
    && gameSceneSource.includes("label: nextLevel !== null ? copy.game.next : (language === 'ru' ? 'ГОТОВО' : 'DONE')")
    && gameSceneSource.includes(": (() => this.scene.start(HOME_SCENE_KEY))"),
  'Tutorial 5 exposes the terminal Tutorial completion state when there is no recommended next lesson.',
);
const puzzleChangedIndex = gameSceneSource.indexOf('const handlePuzzleChanged = (): void =>');
const editCommittedIndex = gameSceneSource.indexOf('const handleEditCommitted = (): void =>');
assert(puzzleChangedIndex >= 0 && editCommittedIndex > puzzleChangedIndex, 'Validator solve callback is defined before onboarding edit-commit advancement.');

console.info('[Dungeon Logic] Game regression sanity: completed review/replay + settings/title + onboarding overlay wiring passed');
