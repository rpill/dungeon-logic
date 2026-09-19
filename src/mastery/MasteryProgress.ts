import type { PlayerProfile } from '../profile/types';

export type MasteryRankId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'MASTER';

export const MASTERY_RANK_IDS: readonly MasteryRankId[] = Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'MASTER']);

export type MasteryMetricId = 'campaign' | 'daily-completed' | 'endless-completed';

export interface MasteryMetrics {
  readonly campaignCompleted: number;
  readonly dailyCompleted: number;
  readonly endlessCompleted: number;
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

/**
 * Pre-release Mastery progression uses only irreversible completion totals.
 * Streaks remain independent retention/challenge metrics and never gate rank.
 */
const RANK_DEFINITIONS = Object.freeze([
  { id: 'I', requirements: Object.freeze([]) },
  { id: 'II', requirements: Object.freeze([
    { metric: 'campaign', target: 5 },
  ]) },
  { id: 'III', requirements: Object.freeze([
    { metric: 'campaign', target: 10 },
    { metric: 'daily-completed', target: 1 },
    { metric: 'endless-completed', target: 5 },
  ]) },
  { id: 'IV', requirements: Object.freeze([
    { metric: 'campaign', target: 18 },
    { metric: 'daily-completed', target: 3 },
    { metric: 'endless-completed', target: 15 },
  ]) },
  { id: 'V', requirements: Object.freeze([
    { metric: 'campaign', target: 26 },
    { metric: 'daily-completed', target: 5 },
    { metric: 'endless-completed', target: 35 },
  ]) },
  { id: 'VI', requirements: Object.freeze([
    { metric: 'campaign', target: 36 },
    { metric: 'daily-completed', target: 8 },
    { metric: 'endless-completed', target: 75 },
  ]) },
  { id: 'VII', requirements: Object.freeze([
    { metric: 'campaign', target: 46 },
    { metric: 'daily-completed', target: 11 },
    { metric: 'endless-completed', target: 150 },
  ]) },
  { id: 'VIII', requirements: Object.freeze([
    { metric: 'campaign', target: 56 },
    { metric: 'daily-completed', target: 15 },
    { metric: 'endless-completed', target: 300 },
  ]) },
  { id: 'MASTER', requirements: Object.freeze([
    { metric: 'campaign', target: 64 },
    { metric: 'daily-completed', target: 20 },
    { metric: 'endless-completed', target: 500 },
  ]) },
] as const satisfies readonly MasteryRankDefinition[]);

function metricValue(metrics: MasteryMetrics, metric: MasteryMetricId): number {
  switch (metric) {
    case 'campaign': return Math.max(0, Math.floor(metrics.campaignCompleted));
    case 'daily-completed': return Math.max(0, Math.floor(metrics.dailyCompleted));
    case 'endless-completed': return Math.max(0, Math.floor(metrics.endlessCompleted));
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

  // Ranks are sequential. Players cannot skip early ranks by accumulating
  // later-mode volume before satisfying every requirement in between.
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

export function getMasteryMetrics(profile: PlayerProfile): MasteryMetrics {
  return {
    campaignCompleted: profile.campaign.completedLevelIds.length,
    dailyCompleted: profile.daily.totalSolved,
    endlessCompleted: profile.endless.completed,
  };
}

export function getMasterySnapshot(profile: PlayerProfile): MasterySnapshot {
  return deriveMastery(getMasteryMetrics(profile));
}
