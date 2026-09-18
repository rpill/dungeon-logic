import { normalizePlayerProfile } from '../profile/PlayerProfile';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const v5 = normalizePlayerProfile({
  schemaVersion: 5,
  campaign: { completedLevelIds: [], lastPlayedLevelId: null, levelResults: {}, drafts: {} },
  daily: { drafts: {}, currentStreak: 0, bestStreak: 0, lastSolvedDate: null, totalSolved: 0, solvedDates: [], results: {} },
  endless: { ordinal: 12, completed: 12, activePuzzle: null },
  settings: { musicEnabled: true, soundEnabled: true, language: 'ru' },
  hints: { freeRemaining: 3, totalUsed: 0, rechargeAnchorMs: null },
  ads: { campaignCompletionsSinceOpportunity: 0, lastInterstitialAtMs: null },
  totals: { activePlayMs: 0 },
}, []);

assert(v5.schemaVersion === 6, 'Profile must migrate to v6.');
assert(v5.endless.currentCleanStreak === 0, 'v5 migration must start current clean streak at zero.');
assert(v5.endless.bestCleanStreak === 0, 'v5 migration must start best clean streak at zero.');

const v6 = normalizePlayerProfile({
  ...v5,
  schemaVersion: 6,
  endless: {
    ...v5.endless,
    currentCleanStreak: -3,
    bestCleanStreak: -7,
  },
}, []);

assert(v6.schemaVersion === 6, 'v6 profile must stay v6.');
assert(v6.endless.currentCleanStreak === 0, 'Negative current clean streak must normalize to zero.');
assert(v6.endless.bestCleanStreak === 0, 'Negative best clean streak must normalize to zero.');

const preserved = normalizePlayerProfile({
  ...v5,
  schemaVersion: 6,
  endless: {
    ...v5.endless,
    currentCleanStreak: 4,
    bestCleanStreak: 11,
  },
}, []);
assert(preserved.endless.currentCleanStreak === 4, 'Valid current clean streak must persist.');
assert(preserved.endless.bestCleanStreak === 11, 'Valid best clean streak must persist.');

console.info('[Dungeon Logic] Mastery profile migration sanity: PASS');
