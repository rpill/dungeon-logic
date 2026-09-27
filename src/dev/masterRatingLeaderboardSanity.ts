const { createFreshPlayerProfile } = await import(new URL('../profile/PlayerProfile.ts', import.meta.url).href) as typeof import('../profile/PlayerProfile');
const { syncMasterRatingLeaderboard, MASTER_RATING_LEADERBOARD_NAME } = await import(new URL('../mastery/MasterRatingLeaderboard.ts', import.meta.url).href) as typeof import('../mastery/MasterRatingLeaderboard');
import type { LeaderboardsPort } from '../platform/services';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

let submitted: { name: string; score: number; extra?: string } | null = null;
let authorized = true;
const leaderboards: LeaderboardsPort = {
  async isAuthorized() { return authorized; },
  async requestAuthorization() { authorized = true; return true; },
  async submitScore(name, score, extraData) { submitted = { name, score, extra: extraData }; return 'submitted'; },
  async getPlayerEntry() { return null; },
  async getEntries() { return null; },
};

const fresh = createFreshPlayerProfile();
assert(await syncMasterRatingLeaderboard(fresh, leaderboards) === 'locked', 'Rating leaderboard must stay locked before MASTER.');
assert(submitted === null, 'Non-MASTER profile must not submit hidden rating.');

const master = {
  ...fresh,
  campaign: { ...fresh.campaign, completedLevelIds: Array.from({ length: 64 }, (_, i) => `campaign-${String(i + 1).padStart(3, '0')}`) },
  daily: { ...fresh.daily, totalSolved: 20 },
  endless: { ...fresh.endless, completed: 500 },
  mastery: { rating: 4321 },
};
assert(await syncMasterRatingLeaderboard(master, leaderboards) === 'submitted', 'MASTER profile must submit rating.');
const masterSubmission = submitted as { name: string; score: number; extra?: string } | null;
assert(masterSubmission !== null && masterSubmission.name === MASTER_RATING_LEADERBOARD_NAME && masterSubmission.score === 4321, 'Master leaderboard must use technical name masterrating and exact rating score.');

authorized = false;
submitted = null;
assert(await syncMasterRatingLeaderboard(master, leaderboards) === 'unauthorized', 'Unauthorized MASTER must not trigger implicit sign-in.');
assert(submitted === null, 'Unauthorized sync must not submit score.');

console.info('[Dungeon Logic] Master Rating leaderboard sanity: MASTER gate + technical name + explicit auth passed');
