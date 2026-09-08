import type { CampaignLevelEntry } from '../content/campaign/types';
import type { PlayerProfileV1 } from '../profile/types';
import {
  getHomeCampaignAction,
  getManuscriptViewModels,
  shouldShowDailyEntry,
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

function profile(completed: readonly string[], lastPlayedLevelId: string | null = null): PlayerProfileV1 {
  return {
    schemaVersion: 1,
    campaign: {
      completedLevelIds: [...completed],
      lastPlayedLevelId,
      levelResults: {},
      activePuzzle: null,
    },
    daily: {
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

const fresh = profile([]);
const start = getHomeCampaignAction(fakeCampaign(1), fresh);
assert(start.kind === 'start' && start.levelId === 'campaign-001', 'Fresh profile starts campaign-001.');
assert(!shouldShowDailyEntry(fresh), 'Daily stays hidden before onboarding level 005 is complete.');

const mid = profile(['campaign-001', 'campaign-002'], 'campaign-003');
const continued = getHomeCampaignAction(fakeCampaign(3), mid);
assert(continued.kind === 'continue' && continued.levelId === 'campaign-003', 'Started campaign exposes Continue to current playable level.');

const afterFive = profile(['campaign-001', 'campaign-002', 'campaign-003', 'campaign-004', 'campaign-005']);
assert(shouldShowDailyEntry(afterFive), 'Completing campaign-005 unlocks Daily visibility.');

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
