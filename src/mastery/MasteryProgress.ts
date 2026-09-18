import type { PlayerProfileV6 } from '../profile/types';

export type MasteryRankId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'MASTER';

export const MASTERY_RANK_IDS: readonly MasteryRankId[] = Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'MASTER']);

export type MasteryMetricId = 'campaign' | 'daily-best-streak' | 'endless-best-clean-streak';

export interface MasteryMetrics {
  readonly campaignCompleted: number;
  readonly dailyBestStreak: number;
  readonly endlessBestCleanStreak: number;
}

export interface MasteryRequirementProgress {
  readonly metric: MasteryMetricId;
  readonly current: number;
  readonly target: number;
  readonly complete: boolean;
}

export interface MasterySnapshot {
  readonly currentRank: MasteryRankId;
  readonly nextRank: MasteryRankId | null;
  readonly conditions: readonly MasteryRequirementProgress[];
  readonly remainingConditions: number;
}

interface MasteryRequirementDefinition {
  readonly metric: MasteryMetricId;
  readonly target: number;
}

interface MasteryRankDefinition {
  readonly id: MasteryRankId;
  readonly requirements: readonly MasteryRequirementDefinition[];
}

const RANK_DEFINITIONS: readonly MasteryRankDefinition[] = Object.freeze([
  { id: 'I', requirements: Object.freeze([]) },
  { id: 'II', requirements: Object.freeze([{ metric: 'campaign', target: 8 }]) },
  { id: 'III', requirements: Object.freeze([
    { metric: 'campaign', target: 24 },
    { metric: 'endless-best-clean-streak', target: 3 },
  ]) },
  { id: 'IV', requirements: Object.freeze([
    { metric: 'campaign', target: 40 },
    { metric: 'daily-best-streak', target: 3 },
    { metric: 'endless-best-clean-streak', target: 5 },
  ]) },
  { id: 'V', requirements: Object.freeze([
    { metric: 'campaign', target: 64 },
    { metric: 'daily-best-streak', target: 5 },
    { metric: 'endless-best-clean-streak', target: 10 },
  ]) },
  { id: 'VI', requirements: Object.freeze([
    { metric: 'daily-best-streak', target: 10 },
    { metric: 'endless-best-clean-streak', target: 15 },
  ]) },
  { id: 'VII', requirements: Object.freeze([
    { metric: 'daily-best-streak', target: 15 },
    { metric: 'endless-best-clean-streak', target: 25 },
  ]) },
  { id: 'VIII', requirements: Object.freeze([
    { metric: 'daily-best-streak', target: 20 },
    { metric: 'endless-best-clean-streak', target: 35 },
  ]) },
  { id: 'MASTER', requirements: Object.freeze([
    { metric: 'daily-best-streak', target: 30 },
    { metric: 'endless-best-clean-streak', target: 50 },
  ]) },
]);

function metricValue(metrics: MasteryMetrics, metric: MasteryMetricId): number {
  switch (metric) {
    case 'campaign': return Math.max(0, Math.floor(metrics.campaignCompleted));
    case 'daily-best-streak': return Math.max(0, Math.floor(metrics.dailyBestStreak));
    case 'endless-best-clean-streak': return Math.max(0, Math.floor(metrics.endlessBestCleanStreak));
  }
}

function satisfiesDefinition(metrics: MasteryMetrics, definition: MasteryRankDefinition): boolean {
  return definition.requirements.every((requirement) => metricValue(metrics, requirement.metric) >= requirement.target);
}

export function getMasteryRankIndex(rank: MasteryRankId): number {
  return RANK_DEFINITIONS.findIndex((definition) => definition.id === rank);
}

export function deriveMastery(metrics: MasteryMetrics): MasterySnapshot {
  let currentIndex = 0;

  // Ranks are sequential. A player cannot skip the campaign-gated early ranks
  // merely by accumulating large Daily/Endless records first.
  for (let index = 1; index < RANK_DEFINITIONS.length; index += 1) {
    if (!satisfiesDefinition(metrics, RANK_DEFINITIONS[index]!)) break;
    currentIndex = index;
  }

  const current = RANK_DEFINITIONS[currentIndex]!;
  const next = RANK_DEFINITIONS[currentIndex + 1] ?? null;
  if (next === null) {
    return {
      currentRank: current.id,
      nextRank: null,
      conditions: Object.freeze([]),
      remainingConditions: 0,
    };
  }

  const conditions = Object.freeze(next.requirements.map((requirement): MasteryRequirementProgress => {
    const currentValue = metricValue(metrics, requirement.metric);
    return Object.freeze({
      metric: requirement.metric,
      current: currentValue,
      target: requirement.target,
      complete: currentValue >= requirement.target,
    });
  }));

  return {
    currentRank: current.id,
    nextRank: next.id,
    conditions,
    remainingConditions: conditions.reduce((count, condition) => count + (condition.complete ? 0 : 1), 0),
  };
}

export function getMasteryMetrics(profile: PlayerProfileV6): MasteryMetrics {
  return {
    campaignCompleted: profile.campaign.completedLevelIds.length,
    dailyBestStreak: profile.daily.bestStreak,
    endlessBestCleanStreak: profile.endless.bestCleanStreak,
  };
}

export function getMasterySnapshot(profile: PlayerProfileV6): MasterySnapshot {
  return deriveMastery(getMasteryMetrics(profile));
}
