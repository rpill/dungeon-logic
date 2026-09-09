import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerProfileV2 } from '../profile/types';
import {
  getHomeDailyAction,
  getHomeCampaignAction,
  getManuscriptViewModels,
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
    chapterId: 'graveyard',
    onboarding: [],
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
): PlayerProfileV2 {
  return {
    schemaVersion: 2,
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
      activePuzzle: null,
    },
    daily: {
      activePuzzle: null,
      currentStreak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      totalSolved: 0,
      solvedDates: [],
      results: {},
    },
    settings: {
      musicEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      language: 'ru',
    },
    hints: { freeRemaining: 3, totalUsed: 0 },
    ads: { campaignCompletionsSinceOpportunity: 0, lastInterstitialAtMs: null },
    totals: { activePlayMs: 0 },
  };
}

const manifest = Array.from({ length: 30 }, (_, index) => entry(index + 1));

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
assert(!shouldShowDailyEntry(fresh), 'Daily stays hidden before onboarding level 005 is complete.');

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
assert(getHomeDailyAction(fresh, availableDaily).kind === 'hidden', 'Daily Home action stays hidden before campaign-005.');
assert(shouldShowSettingsEntry(fresh), 'Settings is visible on a fresh profile before campaign-005.');

const mid = profile(['campaign-001', 'campaign-002'], 'campaign-003');
const continued = getHomeCampaignAction(fakeCampaign(3), mid);
assert(continued.kind === 'continue' && continued.levelId === 'campaign-003', 'Started campaign exposes Continue to current playable level.');

const afterFive = profile(['campaign-001', 'campaign-002', 'campaign-003', 'campaign-004', 'campaign-005']);
assert(shouldShowDailyEntry(afterFive), 'Completing campaign-005 unlocks Daily visibility.');
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
const choose = getHomeCampaignAction(fakeCampaign(30), complete);
assert(choose.kind === 'choose-level', 'Fully completed promoted campaign switches Home action to level choice.');

const lockedViews = getManuscriptViewModels(manifest, fresh);
assert(lockedViews.length === 6, 'Archive exposes four real manuscripts plus two sealed teasers.');
const manuscriptI = lockedViews[0];
const manuscriptII = lockedViews[1];
assert(manuscriptI.kind === 'real' && manuscriptI.unlocked, 'Manuscript I starts unlocked.');
assert(manuscriptII.kind === 'real' && !manuscriptII.unlocked, 'Manuscript II starts locked.');
assert(
  manuscriptII.kind === 'real' && manuscriptII.requirementText === 'Завершите 6 задач рукописи I',
  'Locked real manuscript exposes the explicit unlock requirement.',
);

for (const sealed of lockedViews.slice(4)) {
  assert(sealed.kind === 'sealed', 'V and VI are sealed metadata, not real campaign manuscripts.');
  assert(!sealed.interactive, 'Sealed manuscript is non-interactive.');
  assert(sealed.progress === null, 'Sealed manuscript has no progress count.');
}

const unlockedIIProfile = profile([
  'campaign-001',
  'campaign-002',
  'campaign-003',
  'campaign-004',
  'campaign-005',
  'campaign-006',
]);
const unlockedViews = getManuscriptViewModels(manifest, unlockedIIProfile);
assert(unlockedViews[1].kind === 'real' && unlockedViews[1].unlocked, 'Six solved in I unlock Manuscript II.');

const partialManifest = manifest.slice(0, 5);
const partialViews = getManuscriptViewModels(partialManifest, afterFive);
assert(
  partialViews[0].kind === 'real' && partialViews[0].promotedLevelIds.length === 5,
  'Archive view model contains only actually promoted level ids.',
);
assert(
  partialViews[1].kind === 'real' && partialViews[1].promotedLevelIds.length === 0,
  'Missing future snapshots never become fake cards.',
);

console.info('[Dungeon Logic] Meta navigation sanity: Home actions + manuscript archive view models passed');
