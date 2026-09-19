import type { PlayerProfile } from '../profile/types';
import {
  getMasteryMetrics,
  getMasterySnapshot,
  type MasteryMetricId,
  type MasteryRankId,
  type MasteryRequirementProgress,
} from './MasteryProgress';

export type MasteryProgressSource = 'campaign' | 'daily' | 'endless';

export interface MasteryTransition {
  readonly fromRank: MasteryRankId;
  readonly toRank: MasteryRankId;
  readonly rankAdvanced: boolean;
  readonly progressedMetric: MasteryRequirementProgress | null;
  readonly completedMetric: boolean;
}

const SOURCE_METRIC: Readonly<Record<MasteryProgressSource, MasteryMetricId>> = {
  campaign: 'campaign',
  daily: 'daily-best-streak',
  endless: 'endless-best-clean-streak',
};

function readMetric(profile: PlayerProfile, metric: MasteryMetricId): number {
  const metrics = getMasteryMetrics(profile);
  switch (metric) {
    case 'campaign': return metrics.campaignCompleted;
    case 'daily-best-streak': return metrics.dailyBestStreak;
    case 'endless-best-clean-streak': return metrics.endlessBestCleanStreak;
  }
}

export function compareMastery(
  before: PlayerProfile,
  after: PlayerProfile,
  source: MasteryProgressSource,
): MasteryTransition {
  const beforeSnapshot = getMasterySnapshot(before);
  const afterSnapshot = getMasterySnapshot(after);
  const metric = SOURCE_METRIC[source];
  const requirement = beforeSnapshot.conditions.find((condition) => condition.metric === metric) ?? null;
  const beforeValue = readMetric(before, metric);
  const afterValue = readMetric(after, metric);

  const progressedMetric = requirement !== null && afterValue > beforeValue
    ? {
      ...requirement,
      current: afterValue,
      complete: afterValue >= requirement.target,
    }
    : null;

  return {
    fromRank: beforeSnapshot.currentRank,
    toRank: afterSnapshot.currentRank,
    rankAdvanced: beforeSnapshot.currentRank !== afterSnapshot.currentRank,
    progressedMetric,
    completedMetric: progressedMetric?.complete ?? false,
  };
}
