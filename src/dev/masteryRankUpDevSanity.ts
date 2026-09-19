import type { CampaignLevelEntry } from '../content/campaign/types';
import { MASTERY_RANK_IDS, getMasterySnapshot } from '../mastery/MasteryProgress';
import { createFreshPlayerProfile, normalizePlayerProfile } from '../profile/PlayerProfile';
import { advanceMasteryRankForDev } from './MasteryRankUpDevProfile';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const campaign = Array.from({ length: 64 }, (_, index): CampaignLevelEntry => ({
  slot: index + 1,
  id: `campaign-${String(index + 1).padStart(3, '0')}`,
  level: {} as CampaignLevelEntry['level'],
}));

let profile = createFreshPlayerProfile(campaign, 'ru');
const visited = [getMasterySnapshot(profile).currentRank];

for (let step = 1; step < MASTERY_RANK_IDS.length; step += 1) {
  const result = advanceMasteryRankForDev(profile, campaign);
  assert(result !== null, `Rank ${visited.at(-1)} must have a dev promotion target.`);
  assert(result.fromRank === MASTERY_RANK_IDS[step - 1], `Promotion ${step} must start from the real current rank.`);
  assert(result.toRank === MASTERY_RANK_IDS[step], `Promotion ${step} must advance exactly one rank.`);
  profile = normalizePlayerProfile(result.profile, campaign, 'ru');
  const actual = getMasterySnapshot(profile).currentRank;
  assert(actual === result.toRank, `Dev promotion must persist the real completion totals for ${result.toRank}.`);
  visited.push(actual);
}

assert(visited.join(',') === MASTERY_RANK_IDS.join(','), 'Dev promotion must visit every mastery rank in order.');
assert(advanceMasteryRankForDev(profile, campaign) === null, 'MASTER must not have another dev promotion.');
assert(profile.mastery.rating >= 1000, 'Dev promotion must not reduce Master Rating.');
assert(profile.daily.totalSolved >= 20, 'MASTER dev promotion must supply 20 completed Daily puzzles.');
assert(profile.endless.completed >= 500, 'MASTER dev promotion must supply 500 completed Endless puzzles.');

const progressed = createFreshPlayerProfile(campaign, 'ru');
const withExistingProgress = {
  ...progressed,
  campaign: {
    ...progressed.campaign,
    completedLevelIds: campaign.slice(0, 12).map((entry) => entry.id),
  },
  daily: {
    ...progressed.daily,
    totalSolved: 7,
    bestStreak: 9,
  },
  endless: {
    ...progressed.endless,
    nextFreshIndex: 41,
    completed: 40,
    bestStreak: 12,
  },
  mastery: {
    rating: 1375,
  },
};
const promoted = advanceMasteryRankForDev(withExistingProgress, campaign);
assert(promoted !== null, 'Existing non-MASTER progress must still promote.');
assert(promoted.profile.campaign.completedLevelIds.length >= 12, 'Dev promotion must not remove campaign progress.');
assert(promoted.profile.daily.totalSolved >= 7, 'Dev promotion must not reduce completed Daily count.');
assert(promoted.profile.daily.bestStreak === 9, 'Dev promotion must leave Daily streak records untouched.');
assert(promoted.profile.endless.completed >= 40, 'Dev promotion must not reduce completed Endless count.');
assert(promoted.profile.endless.bestStreak === 12, 'Dev promotion must leave Endless streak records untouched.');
assert(promoted.profile.mastery.rating === 1375, 'Dev promotion must preserve Master Rating.');

console.info('[Dungeon Logic] Mastery rank-up dev sanity: PASS');
