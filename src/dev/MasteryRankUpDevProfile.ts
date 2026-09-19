import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  MASTERY_RANK_IDS,
  getMasteryRankIndex,
  getMasterySnapshot,
  type MasteryRankId,
} from '../mastery/MasteryProgress';
import type { PlayerProfile } from '../profile/types';

interface DevMasteryTargets {
  readonly campaignCompleted: number;
  readonly dailyCompleted: number;
  readonly endlessCompleted: number;
}

const DEV_MASTERY_TARGETS: Readonly<Record<MasteryRankId, DevMasteryTargets>> = Object.freeze({
  I: { campaignCompleted: 0, dailyCompleted: 0, endlessCompleted: 0 },
  II: { campaignCompleted: 5, dailyCompleted: 0, endlessCompleted: 0 },
  III: { campaignCompleted: 10, dailyCompleted: 1, endlessCompleted: 5 },
  IV: { campaignCompleted: 18, dailyCompleted: 3, endlessCompleted: 15 },
  V: { campaignCompleted: 26, dailyCompleted: 5, endlessCompleted: 35 },
  VI: { campaignCompleted: 36, dailyCompleted: 8, endlessCompleted: 75 },
  VII: { campaignCompleted: 46, dailyCompleted: 11, endlessCompleted: 150 },
  VIII: { campaignCompleted: 56, dailyCompleted: 15, endlessCompleted: 300 },
  MASTER: { campaignCompleted: 64, dailyCompleted: 20, endlessCompleted: 500 },
});

export interface DevMasteryPromotion {
  readonly profile: PlayerProfile;
  readonly fromRank: MasteryRankId;
  readonly toRank: MasteryRankId;
}

export function advanceMasteryRankForDev(
  profile: PlayerProfile,
  campaignLevels: readonly CampaignLevelEntry[],
): DevMasteryPromotion | null {
  const before = getMasterySnapshot(profile);
  const currentIndex = getMasteryRankIndex(before.currentRank);
  const requestedRank = MASTERY_RANK_IDS[currentIndex + 1];
  if (requestedRank === undefined) return null;

  const targets = DEV_MASTERY_TARGETS[requestedRank];
  const orderedCampaign = campaignLevels.slice().sort((left, right) => left.slot - right.slot);
  if (targets.campaignCompleted > orderedCampaign.length) {
    throw new Error(
      `DEV mastery promotion to ${requestedRank} requires ${targets.campaignCompleted} campaign levels, but only ${orderedCampaign.length} exist.`,
    );
  }

  const completed = new Set(profile.campaign.completedLevelIds);
  for (const entry of orderedCampaign.slice(0, targets.campaignCompleted)) completed.add(entry.id);
  const completedLevelIds = orderedCampaign
    .filter((entry) => completed.has(entry.id))
    .map((entry) => entry.id);

  const endlessCompleted = Math.max(profile.endless.completed, targets.endlessCompleted);
  const promotedProfile: PlayerProfile = {
    ...profile,
    campaign: {
      ...profile.campaign,
      completedLevelIds,
    },
    daily: {
      ...profile.daily,
      totalSolved: Math.max(profile.daily.totalSolved, targets.dailyCompleted),
    },
    endless: {
      ...profile.endless,
      completed: endlessCompleted,
      nextFreshIndex: Math.max(profile.endless.nextFreshIndex, endlessCompleted),
    },
  };

  return {
    profile: promotedProfile,
    fromRank: before.currentRank,
    toRank: getMasterySnapshot(promotedProfile).currentRank,
  };
}
