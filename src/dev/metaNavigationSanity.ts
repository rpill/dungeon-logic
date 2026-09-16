import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerProfileV5 } from '../profile/types';
import {
  getHomeDailyAction,
  getHomeCampaignAction,
  LEVELS_SCENE_KEY,
  shouldAutoStartTutorial,
  shouldShowDailyEntry,
  shouldShowSettingsEntry,
  type MetaCampaignPort,
} from '../runtime/MetaSelectors';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function entry(slot: number): CampaignLevelEntry {
  const id = `campaign-${String(slot).padStart(3, '0')}`;
  return {
    slot,
    id,
    level: {
      id,
      width: 1,
      height: 1,
      rowClues: [0],
      columnClues: [0],
      monsters: [],
      chests: [],
      blockers: [],
      doors: [],
      solution: ['.'],
    } as any,
  };
}

function profile(
  completed: readonly string[],
  lastPlayedLevelId: string | null = null,
  tutorialCompleted = true,
): PlayerProfileV5 {
  return {
    schemaVersion: 5,
    tutorial: {
      completedLevelIds: tutorialCompleted
        ? ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004', 'tutorial-005']
        : [],
      completed: tutorialCompleted,
      activePuzzle: null,
    },
    campaign: {
      completedLevelIds: [...completed],
      lastPlayedLevelId,
      levelResults: {},
      drafts: {},
    },
    daily: {
      drafts: {},
      currentStreak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      totalSolved: 0,
      solvedDates: [],
      results: {},
    },
    endless: { ordinal: 0, completed: 0, activePuzzle: null },
  settings: {
      musicEnabled: true,
      soundEnabled: true,
      language: 'ru',
    },
    hints: { freeRemaining: 3, totalUsed: 0 },
    ads: { campaignCompletionsSinceOpportunity: 0, lastInterstitialAtMs: null },
    totals: { activePlayMs: 0 },
  };
}

const manifest = Array.from({ length: 64 }, (_, index) => entry(index + 1));

function fakeCampaign(continueSlot: number | null): MetaCampaignPort {
  return {
    getLevels: () => manifest,
    getContinueLevel: () => continueSlot === null ? null : manifest[continueSlot - 1],
  };
}

const fresh = profile([], null, false);
const tutorial = getHomeCampaignAction(fakeCampaign(null), fresh);
assert(tutorial.kind === 'tutorial', 'Fresh profile must enter Tutorial before Campaign.');

const tutorialCompleteFresh = profile([]);
const start = getHomeCampaignAction(fakeCampaign(1), tutorialCompleteFresh);
assert(start.kind === 'start' && start.levelId === 'campaign-001', 'Tutorial-complete fresh campaign starts campaign-001.');
assert(shouldAutoStartTutorial(fresh), 'Truly fresh profile auto-starts Tutorial before Home.');
assert(shouldShowDailyEntry(fresh), 'Daily is visible from the first Home visit.');

const availableDaily = {
  dateKey: '2099-01-01',
  entry: {
    id: 'daily-fixture-2099-01-01',
    dateKey: '2099-01-01',
    level: manifest[0].level,
  },
  currentStreak: 2,
  bestStreak: 4,
  totalSolved: 9,
  solved: false,
  result: null,
} as const;
assert(getHomeDailyAction(fresh, availableDaily).kind === 'locked', 'Daily stays visible but locked before campaign-005.');
const tutorialStarted = profile([], null, false);
(tutorialStarted.tutorial as { activePuzzle: any }).activePuzzle = {
  mode: 'tutorial',
  puzzleId: 'tutorial-001',
  cells: [['unknown']],
  activePlayMs: 0,
  hintsUsed: 0,
  startedAtMs: 1,
};
assert(!shouldAutoStartTutorial(tutorialStarted), 'Existing Tutorial session returns to Home instead of force-launching again.');

assert(shouldShowSettingsEntry(fresh), 'Settings is visible on a fresh profile before campaign-005.');

const mid = profile(['campaign-001', 'campaign-002'], 'campaign-003');
const continued = getHomeCampaignAction(fakeCampaign(3), mid);
assert(continued.kind === 'continue' && continued.levelId === 'campaign-003', 'Started campaign exposes Continue to current playable level.');

const afterFive = profile(['campaign-001', 'campaign-002', 'campaign-003', 'campaign-004', 'campaign-005']);
assert(shouldShowDailyEntry(afterFive), 'Daily remains visible after campaign-005.');
assert(getHomeDailyAction(afterFive, null).kind === 'unavailable', 'Unlocked Daily exposes unavailable state without trusted date.');
const newDaily = getHomeDailyAction(afterFive, availableDaily);
assert(newDaily.kind === 'new' && newDaily.entry.id === availableDaily.entry.id, 'Unsolved Daily exposes a playable New action.');
const solvedDaily = getHomeDailyAction(afterFive, {
  ...availableDaily,
  solved: true,
  result: {
    bestTimeMs: 65_000,
    minHintsUsed: 0,
    solvedWithoutHints: true,
  },
});
assert(
  solvedDaily.kind === 'solved' && solvedDaily.result.bestTimeMs === 65_000,
  'Solved Daily remains playable for replay and carries its best result.',
);

const complete = profile(manifest.map((candidate) => candidate.id));
const choose = getHomeCampaignAction(fakeCampaign(64), complete);
assert(choose.kind === 'choose-level', 'Fully completed promoted campaign switches Home action to level choice.');

assert(LEVELS_SCENE_KEY === 'LevelSelectScene', 'Main campaign browser route is the Levels scene.');

console.info('[Dungeon Logic] Meta navigation sanity: Home actions + flat Levels navigation passed');
