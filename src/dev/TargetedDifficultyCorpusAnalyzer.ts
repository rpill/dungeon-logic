import {
  DifficultyBand,
  DifficultyTarget,
} from '../puzzle/difficulty/types';

import type {
  TargetedDifficultyTarget,
} from '../puzzle/generator/DifficultyTargetPolicy';

import {
  ALL_GENERATOR_ARCHETYPES,
  type GeneratorArchetype,
  type GeneratorRunReport,
} from '../puzzle/generator/types';

export interface TargetedDifficultyCorpusArchetypeContribution {
  archetype: GeneratorArchetype;
  accepted: number;
  exact: number;
  fallback: number;
}

export interface TargetedDifficultyCorpusSeedResult {
  seed: number;
  target: TargetedDifficultyTarget;
  completed: boolean;
  accepted: number;
  poolExact: number;
  poolFallback: number;
  shortlistSlots: number;
  shortlistExact: number;
  shortlistFallback: number;
  backfillUsed: boolean;
  backfillCount: number;
  missingSlots: number;
  unrated: number;
  archetypes:
    readonly TargetedDifficultyCorpusArchetypeContribution[];
}

export interface TargetedDifficultyCorpusTargetSummary {
  target: TargetedDifficultyTarget;
  seedCount: number;
  completedSeeds: number;
  totalAccepted: number;
  poolExact: number;
  poolFallback: number;
  poolExactRate: number;
  shortlistSlots: number;
  shortlistExact: number;
  shortlistFallback: number;
  shortlistExactRate: number;
  backfillSeeds: number;
  unrated: number;
  archetypes:
    readonly TargetedDifficultyCorpusArchetypeContribution[];
}

export interface TargetedDifficultyCorpusReport {
  schemaVersion: 1;
  mode: 'targeted';
  seeds: readonly number[];
  targets:
    readonly TargetedDifficultyTarget[];
  summaries:
    readonly TargetedDifficultyCorpusTargetSummary[];
  seedResults:
    readonly TargetedDifficultyCorpusSeedResult[];
}

const TARGET_ORDER:
  readonly TargetedDifficultyTarget[] = [
    DifficultyTarget.Easy,
    DifficultyTarget.Medium,
    DifficultyTarget.Hard,
    DifficultyTarget.Expert,
  ];

export function summarizeTargetedDifficultyCorpus(
  reports:
    readonly GeneratorRunReport[],
): TargetedDifficultyCorpusReport {
  if (reports.length === 0) {
    throw new Error(
      'Targeted difficulty corpus requires at least one generator report.',
    );
  }

  const seedOrder: number[] = [];
  const seenSeeds =
    new Set<number>();

  const targetsPresent =
    new Set<TargetedDifficultyTarget>();

  const seedResults:
    TargetedDifficultyCorpusSeedResult[] = [];

  for (const report of reports) {
    const target =
      report.difficultyTarget;

    if (!isTargetedTarget(target)) {
      throw new Error(
        `Targeted corpus cannot summarize legacy difficulty target: ${target}.`,
      );
    }

    const poolTargeting =
      report.pool.targeting;

    const shortlistTargeting =
      report.shortlistTargeting;

    if (
      poolTargeting === undefined ||
      shortlistTargeting === undefined
    ) {
      throw new Error(
        `Targeted corpus report for seed ${report.masterSeed}/${target} is missing targeted diagnostics.`,
      );
    }

    if (
      poolTargeting.difficultyTarget !==
        target ||
      shortlistTargeting
        .difficultyTarget !== target
    ) {
      throw new Error(
        `Targeted corpus diagnostics mismatch for seed ${report.masterSeed}/${target}.`,
      );
    }

    if (!seenSeeds.has(report.masterSeed)) {
      seenSeeds.add(report.masterSeed);
      seedOrder.push(report.masterSeed);
    }

    targetsPresent.add(target);

    const archetypes =
      ALL_GENERATOR_ARCHETYPES.map(
        (archetype) => {
          const accepted =
            report.pool.accepted.filter(
              (entry) =>
                entry.candidate
                  .archetype ===
                archetype,
            );

          const exact =
            accepted.filter(
              (entry) =>
                entry.difficulty.band ===
                target,
            ).length;

          return {
            archetype,
            accepted:
              accepted.length,
            exact,
            fallback:
              accepted.length - exact,
          };
        },
      );

    seedResults.push({
      seed: report.masterSeed,
      target,
      completed:
        report.pool.completed,
      accepted:
        report.pool.accepted.length,
      poolExact:
        poolTargeting.exactCount,
      poolFallback:
        poolTargeting.fallbackCount,
      shortlistSlots:
        report.shortlist.length,
      shortlistExact:
        shortlistTargeting.exactCount,
      shortlistFallback:
        shortlistTargeting
          .fallbackCount,
      backfillUsed:
        poolTargeting.backfillUsed,
      backfillCount:
        poolTargeting.backfillCount,
      missingSlots:
        poolTargeting.missingSlots,
      unrated:
        report.pool.accepted.filter(
          (entry) =>
            entry.difficulty.band ===
            DifficultyBand.Unrated,
        ).length,
      archetypes,
    });
  }

  const targetIndex =
    new Map(
      TARGET_ORDER.map(
        (target, index) => [
          target,
          index,
        ] as const,
      ),
    );

  const seedIndex =
    new Map(
      seedOrder.map(
        (seed, index) => [
          seed,
          index,
        ] as const,
      ),
    );

  seedResults.sort(
    (left, right) => {
      const targetDelta =
        (targetIndex.get(left.target) ?? 0) -
        (targetIndex.get(right.target) ?? 0);

      if (targetDelta !== 0) {
        return targetDelta;
      }

      return (
        (seedIndex.get(left.seed) ?? 0) -
        (seedIndex.get(right.seed) ?? 0)
      );
    },
  );

  const targets =
    TARGET_ORDER.filter(
      (target) =>
        targetsPresent.has(target),
    );

  const summaries =
    targets.map(
      (target) =>
        summarizeTarget(
          target,
          seedResults.filter(
            (entry) =>
              entry.target === target,
          ),
        ),
    );

  return {
    schemaVersion: 1,
    mode: 'targeted',
    seeds: seedOrder,
    targets,
    summaries,
    seedResults,
  };
}

function summarizeTarget(
  target: TargetedDifficultyTarget,
  entries:
    readonly TargetedDifficultyCorpusSeedResult[],
): TargetedDifficultyCorpusTargetSummary {
  const archetypes =
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype) => {
        let accepted = 0;
        let exact = 0;
        let fallback = 0;

        for (const entry of entries) {
          const contribution =
            entry.archetypes.find(
              (candidate) =>
                candidate.archetype ===
                archetype,
            );

          if (contribution === undefined) {
            throw new Error(
              `Missing targeted corpus archetype contribution for ${target}/${archetype}.`,
            );
          }

          accepted +=
            contribution.accepted;
          exact +=
            contribution.exact;
          fallback +=
            contribution.fallback;
        }

        return {
          archetype,
          accepted,
          exact,
          fallback,
        };
      },
    );

  const totalAccepted =
    sum(
      entries,
      (entry) => entry.accepted,
    );

  const poolExact =
    sum(
      entries,
      (entry) => entry.poolExact,
    );

  const poolFallback =
    sum(
      entries,
      (entry) => entry.poolFallback,
    );

  const shortlistSlots =
    sum(
      entries,
      (entry) =>
        entry.shortlistSlots,
    );

  const shortlistExact =
    sum(
      entries,
      (entry) =>
        entry.shortlistExact,
    );

  const shortlistFallback =
    sum(
      entries,
      (entry) =>
        entry.shortlistFallback,
    );

  return {
    target,
    seedCount: entries.length,
    completedSeeds:
      entries.filter(
        (entry) =>
          entry.completed,
      ).length,
    totalAccepted,
    poolExact,
    poolFallback,
    poolExactRate:
      totalAccepted === 0
        ? 0
        : roundMetric(
            poolExact /
            totalAccepted,
          ),
    shortlistSlots,
    shortlistExact,
    shortlistFallback,
    shortlistExactRate:
      shortlistSlots === 0
        ? 0
        : roundMetric(
            shortlistExact /
            shortlistSlots,
          ),
    backfillSeeds:
      entries.filter(
        (entry) =>
          entry.backfillUsed,
      ).length,
    unrated:
      sum(
        entries,
        (entry) => entry.unrated,
      ),
    archetypes,
  };
}

function isTargetedTarget(
  target:
    GeneratorRunReport[
      'difficultyTarget'
    ],
): target is TargetedDifficultyTarget {
  return (
    target === DifficultyTarget.Easy ||
    target === DifficultyTarget.Medium ||
    target === DifficultyTarget.Hard ||
    target === DifficultyTarget.Expert
  );
}

function sum<T>(
  values: readonly T[],
  select: (value: T) => number,
): number {
  return values.reduce(
    (total, value) =>
      total + select(value),
    0,
  );
}

function roundMetric(
  value: number,
): number {
  return (
    Math.round(
      value * 1_000_000,
    ) /
    1_000_000
  );
}
