import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import type { PlayerProfile } from '../profile/types';
import { compareMastery } from '../mastery/MasteryTransition';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function withMetrics(options: {
  campaign: number;
  dailyBest: number;
  endlessBest: number;
  endlessCurrent?: number;
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
      bestStreak: options.dailyBest,
    },
    endless: {
      ...profile.endless,
      currentCleanStreak: options.endlessCurrent ?? options.endlessBest,
      bestCleanStreak: options.endlessBest,
    },
  };
}

const campaignBefore = withMetrics({ campaign: 7, dailyBest: 0, endlessBest: 0 });
const campaignAfter = withMetrics({ campaign: 8, dailyBest: 0, endlessBest: 0 });
const campaignTransition = compareMastery(campaignBefore, campaignAfter, 'campaign');
assert(campaignTransition.rankAdvanced, 'Campaign 7→8 must advance Mastery.');
assert(campaignTransition.fromRank === 'I' && campaignTransition.toRank === 'II', 'Campaign 8 must advance I→II.');
assert(campaignTransition.progressedMetric?.metric === 'campaign', 'Campaign transition must report campaign metric.');
assert(campaignTransition.completedMetric, 'Campaign 8 must complete the rank-II requirement.');

const endlessBefore = withMetrics({ campaign: 24, dailyBest: 0, endlessBest: 2 });
const endlessAfter = withMetrics({ campaign: 24, dailyBest: 0, endlessBest: 3 });
const endlessTransition = compareMastery(endlessBefore, endlessAfter, 'endless');
assert(endlessTransition.rankAdvanced, 'Endless best clean 2→3 at Campaign 24 must advance Mastery.');
assert(endlessTransition.fromRank === 'II' && endlessTransition.toRank === 'III', 'Endless milestone must advance II→III.');
assert(endlessTransition.progressedMetric?.current === 3 && endlessTransition.progressedMetric.target === 3, 'Endless transition must expose 3 / 3 progress.');

const dailyBestBefore = withMetrics({ campaign: 40, dailyBest: 3, endlessBest: 5 });
const dailyCurrentDropped = {
  ...dailyBestBefore,
  daily: { ...dailyBestBefore.daily, currentStreak: 0, bestStreak: 3 },
};
const dailyTransition = compareMastery(dailyBestBefore, dailyCurrentDropped, 'daily');
assert(!dailyTransition.rankAdvanced, 'Dropping current Daily streak must not lower or advance rank.');
assert(dailyTransition.fromRank === dailyTransition.toRank, 'Daily current streak reset must keep rank stable.');
assert(dailyTransition.progressedMetric === null, 'Unchanged Daily best streak must not count as Mastery progress.');

const assistedBefore = withMetrics({ campaign: 64, dailyBest: 5, endlessBest: 10, endlessCurrent: 6 });
const assistedAfter = withMetrics({ campaign: 64, dailyBest: 5, endlessBest: 10, endlessCurrent: 0 });
const assistedTransition = compareMastery(assistedBefore, assistedAfter, 'endless');
assert(!assistedTransition.rankAdvanced, 'Assisted Endless solve must not lower achieved rank.');
assert(assistedTransition.fromRank === 'V' && assistedTransition.toRank === 'V', 'Best clean streak must keep rank V after current streak reset.');
assert(assistedTransition.progressedMetric === null, 'Resetting only current clean streak must not count as Mastery progress.');

console.info('[Dungeon Logic] Mastery transition sanity: PASS');
