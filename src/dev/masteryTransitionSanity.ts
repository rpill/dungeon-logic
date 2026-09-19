import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfile } from '../profile/types';
import { compareMastery } from '../mastery/MasteryTransition';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function withMetrics(options: {
  campaign: number;
  dailyCompleted: number;
  endlessCompleted: number;
  dailyBest?: number;
  endlessBest?: number;
}): PlayerProfile {
  const profile = createFreshPlayerProfile();
  return {
    ...profile,
    campaign: {
      ...profile.campaign,
      completedLevelIds: Array.from({ length: options.campaign }, (_, index) => `campaign-${String(index + 1).padStart(3, '0')}`),
    },
    daily: {
      ...profile.daily,
      totalSolved: options.dailyCompleted,
      bestStreak: options.dailyBest ?? 0,
    },
    endless: {
      ...profile.endless,
      nextFreshIndex: options.endlessCompleted,
      completed: options.endlessCompleted,
      bestStreak: options.endlessBest ?? 0,
    },
  };
}

const campaignBefore = withMetrics({ campaign: 4, dailyCompleted: 0, endlessCompleted: 0 });
const campaignAfter = withMetrics({ campaign: 5, dailyCompleted: 0, endlessCompleted: 0 });
const campaignTransition = compareMastery(campaignBefore, campaignAfter, 'campaign');
assert(campaignTransition.rankAdvanced, 'Campaign 4→5 must advance Mastery.');
assert(campaignTransition.fromRank === 'I' && campaignTransition.toRank === 'II', 'Campaign 5 must advance I→II.');
assert(campaignTransition.progressedMetric?.metric === 'campaign', 'Campaign transition must report campaign metric.');
assert(campaignTransition.completedMetric, 'Campaign 5 must complete the rank-II requirement.');

const dailyBefore = withMetrics({ campaign: 10, dailyCompleted: 0, endlessCompleted: 5 });
const dailyAfter = withMetrics({ campaign: 10, dailyCompleted: 1, endlessCompleted: 5 });
const dailyTransition = compareMastery(dailyBefore, dailyAfter, 'daily');
assert(dailyTransition.rankAdvanced, 'First completed Daily at Campaign 10 / Endless 5 must advance Mastery.');
assert(dailyTransition.fromRank === 'II' && dailyTransition.toRank === 'III', 'Daily completion must advance II→III.');
assert(dailyTransition.progressedMetric?.metric === 'daily-completed', 'Daily transition must report completed-Daily metric.');
assert(dailyTransition.progressedMetric?.current === 1 && dailyTransition.progressedMetric.target === 1, 'Daily transition must expose 1 / 1 progress.');

const endlessBefore = withMetrics({ campaign: 18, dailyCompleted: 3, endlessCompleted: 14 });
const endlessAfter = withMetrics({ campaign: 18, dailyCompleted: 3, endlessCompleted: 15 });
const endlessTransition = compareMastery(endlessBefore, endlessAfter, 'endless');
assert(endlessTransition.rankAdvanced, 'Endless completed 14→15 at Campaign 18 / Daily 3 must advance Mastery.');
assert(endlessTransition.fromRank === 'III' && endlessTransition.toRank === 'IV', 'Endless completion must advance III→IV.');
assert(endlessTransition.progressedMetric?.metric === 'endless-completed', 'Endless transition must report completed-Endless metric.');

const streakOnlyBefore = withMetrics({ campaign: 18, dailyCompleted: 3, endlessCompleted: 15, dailyBest: 2, endlessBest: 4 });
const streakOnlyAfter = withMetrics({ campaign: 18, dailyCompleted: 3, endlessCompleted: 15, dailyBest: 99, endlessBest: 999 });
const streakOnlyTransition = compareMastery(streakOnlyBefore, streakOnlyAfter, 'endless');
assert(!streakOnlyTransition.rankAdvanced, 'Changing streak records alone must never advance Mastery.');
assert(streakOnlyTransition.progressedMetric === null, 'Streak-only changes must not count as Mastery progress.');

console.info('[Dungeon Logic] Mastery transition sanity: PASS');
