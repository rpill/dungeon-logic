import {
  DifficultyBand,
  DifficultyTarget,
  type DifficultyBand as DifficultyBandType,
} from '../puzzle/difficulty/types';

import {
  selectShortlist,
} from '../puzzle/generator/CandidateRanker';

import type {
  TargetedDifficultyTarget,
} from '../puzzle/generator/DifficultyTargetPolicy';

import {
  ALL_GENERATOR_ARCHETYPES,
  type GeneratorArchetype,
  type GeneratorPoolReport,
} from '../puzzle/generator/types';

export interface DifficultyCorpusCliOptions {
  seeds: readonly number[];
  difficulty:
    | 'legacy-any'
    | TargetedDifficultyTarget
    | 'all';
}

export interface DifficultyCorpusBandCounts {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  unrated: number;
}

export type DifficultyCorpusRatedBand =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert';

export type DifficultyCoverageClassification =
  | 'stable-full'
  | 'partial'
  | 'none';

export interface DifficultyBandCoverage {
  totalAvailable: number;
  minAvailable: number;
  maxAvailable: number;
  seedsWithAny: number;
  seedsWithAtLeastTargetSlots: number;
  classification:
    DifficultyCoverageClassification;
}

export interface DifficultyArchetypeAggregate {
  archetype: GeneratorArchetype;
  accepted: number;
  bandCounts:
    DifficultyCorpusBandCounts;
  coverage:
    Readonly<
      Record<
        DifficultyCorpusRatedBand,
        DifficultyBandCoverage
      >
    >;
}

export interface DifficultyTargetArchetypeAggregate {
  archetype: GeneratorArchetype;
  totalSlots: number;
  exactSlots: number;
  fallbackSlots: number;
}

export interface DifficultyTargetAggregate {
  target: DifficultyCorpusRatedBand;
  totalSlots: number;
  exactSlots: number;
  fallbackSlots: number;
  exactRate: number;
  bandCounts:
    DifficultyCorpusBandCounts;
  archetypes:
    readonly DifficultyTargetArchetypeAggregate[];
}

export interface DifficultyCorpusSeedArchetype {
  archetype: GeneratorArchetype;
  accepted: number;
  bandCounts:
    DifficultyCorpusBandCounts;
}

export interface DifficultyCorpusSeedTarget {
  target: DifficultyCorpusRatedBand;
  totalSlots: number;
  exactSlots: number;
  fallbackSlots: number;
  bandCounts:
    DifficultyCorpusBandCounts;
}

export interface DifficultyCorpusSeedResult {
  seed: number;
  completed: boolean;
  accepted: number;
  bandCounts:
    DifficultyCorpusBandCounts;
  archetypes:
    readonly DifficultyCorpusSeedArchetype[];
  targets:
    readonly DifficultyCorpusSeedTarget[];
}

export interface DifficultyCorpusReport {
  schemaVersion: 1;
  seeds: readonly number[];
  config: {
    acceptedPerArchetype: number;
    shortlistPerArchetype: number;
    maxAttemptsPerArchetype: number;
  };
  summary: {
    seedCount: number;
    completedSeeds: number;
    totalAccepted: number;
    bandCounts:
      DifficultyCorpusBandCounts;
  };
  archetypes:
    readonly DifficultyArchetypeAggregate[];
  targets:
    readonly DifficultyTargetAggregate[];
  seedResults:
    readonly DifficultyCorpusSeedResult[];
}

export interface DifficultyCorpusOutputPaths {
  jsonPath: string;
  markdownPath: string;
}

const TARGET_BANDS:
  readonly DifficultyCorpusRatedBand[] = [
    DifficultyBand.Easy,
    DifficultyBand.Medium,
    DifficultyBand.Hard,
    DifficultyBand.Expert,
  ];

export function parseDifficultyCorpusArgs(
  args: readonly string[],
): DifficultyCorpusCliOptions {
  if (
    args.length !== 2 &&
    args.length !== 4
  ) {
    throw new Error(
      'Usage: npm run analyze:difficulty-corpus -- --seeds <uint32,uint32,...> [--difficulty easy|medium|hard|expert|all]',
    );
  }

  if (args[0] !== '--seeds') {
    throw new Error(
      'Usage: npm run analyze:difficulty-corpus -- --seeds <uint32,uint32,...> [--difficulty easy|medium|hard|expert|all]',
    );
  }

  const raw = args[1];

  if (raw.length === 0) {
    throw new Error(
      'Difficulty corpus requires at least one seed.',
    );
  }

  const parts = raw.split(',');
  const seeds: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    const value = part.trim();

    if (!/^[0-9]+$/.test(value)) {
      throw new Error(
        `Invalid corpus seed: ${part}`,
      );
    }

    const seed = Number(value);

    if (
      !Number.isSafeInteger(seed) ||
      seed < 0 ||
      seed > 0xffff_ffff
    ) {
      throw new RangeError(
        `Corpus seed must be a uint32: ${value}`,
      );
    }

    if (seen.has(seed)) {
      throw new Error(
        `Duplicate corpus seed: ${seed}`,
      );
    }

    seen.add(seed);
    seeds.push(seed);
  }

  if (seeds.length === 0) {
    throw new Error(
      'Difficulty corpus requires at least one seed.',
    );
  }

  if (args.length === 2) {
    return {
      seeds,
      difficulty: 'legacy-any',
    };
  }

  if (args[2] !== '--difficulty') {
    throw new Error(
      'Usage: npm run analyze:difficulty-corpus -- --seeds <uint32,uint32,...> [--difficulty easy|medium|hard|expert|all]',
    );
  }

  const difficulty =
    args[3];

  if (difficulty === 'all') {
    return {
      seeds,
      difficulty: 'all',
    };
  }

  if (
    difficulty ===
      DifficultyTarget.Easy ||
    difficulty ===
      DifficultyTarget.Medium ||
    difficulty ===
      DifficultyTarget.Hard ||
    difficulty ===
      DifficultyTarget.Expert
  ) {
    return {
      seeds,
      difficulty,
    };
  }

  throw new Error(
    'Corpus difficulty must be one of: easy, medium, hard, expert, all.',
  );
}

export function summarizeDifficultyCorpus(
  pools:
    readonly GeneratorPoolReport[],
  shortlistPerArchetype: number,
): DifficultyCorpusReport {
  if (pools.length === 0) {
    throw new Error(
      'Difficulty corpus requires at least one pool.',
    );
  }

  if (
    !Number.isInteger(
      shortlistPerArchetype,
    ) ||
    shortlistPerArchetype <= 0
  ) {
    throw new RangeError(
      'shortlistPerArchetype must be a positive integer.',
    );
  }

  const seeds =
    pools.map(
      (pool) =>
        pool.masterSeed,
    );

  validateSeeds(seeds);

  const summaryBandCounts =
    createEmptyBandCounts();

  const archetypeBandCounts =
    new Map<
      GeneratorArchetype,
      DifficultyCorpusBandCounts
    >();

  const availability =
    new Map<
      GeneratorArchetype,
      Record<
        DifficultyCorpusRatedBand,
        number[]
      >
    >();

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    archetypeBandCounts.set(
      archetype,
      createEmptyBandCounts(),
    );

    availability.set(
      archetype,
      {
        easy: [],
        medium: [],
        hard: [],
        expert: [],
      },
    );
  }

  const targetAggregates =
    new Map<
      DifficultyCorpusRatedBand,
      MutableTargetAggregate
    >();

  for (const target of TARGET_BANDS) {
    targetAggregates.set(
      target,
      createMutableTargetAggregate(
        target,
      ),
    );
  }

  const seedResults:
    DifficultyCorpusSeedResult[] = [];

  let totalAccepted = 0;
  let completedSeeds = 0;

  for (const pool of pools) {
    if (pool.completed) {
      completedSeeds += 1;
    }

    totalAccepted +=
      pool.accepted.length;

    const seedBandCounts =
      createEmptyBandCounts();

    for (
      const accepted
      of pool.accepted
    ) {
      incrementBand(
        seedBandCounts,
        accepted.difficulty.band,
      );

      incrementBand(
        summaryBandCounts,
        accepted.difficulty.band,
      );
    }

    const seedArchetypes:
      DifficultyCorpusSeedArchetype[] = [];

    for (
      const archetype
      of ALL_GENERATOR_ARCHETYPES
    ) {
      const poolArchetype =
        pool.archetypes.find(
          (entry) =>
            entry.stats.archetype ===
            archetype,
        );

      const accepted =
        poolArchetype?.accepted ?? [];

      const counts =
        createEmptyBandCounts();

      for (
        const candidate
        of accepted
      ) {
        incrementBand(
          counts,
          candidate.difficulty.band,
        );

        const aggregate =
          archetypeBandCounts.get(
            archetype,
          );

        if (aggregate === undefined) {
          throw new Error(
            `Missing archetype aggregate for ${archetype}.`,
          );
        }

        incrementBand(
          aggregate,
          candidate.difficulty.band,
        );
      }

      const archetypeAvailability =
        availability.get(archetype);

      if (
        archetypeAvailability ===
        undefined
      ) {
        throw new Error(
          `Missing availability aggregate for ${archetype}.`,
        );
      }

      for (const band of TARGET_BANDS) {
        archetypeAvailability[
          band
        ].push(counts[band]);
      }

      seedArchetypes.push({
        archetype,
        accepted: accepted.length,
        bandCounts: counts,
      });
    }

    const seedTargets:
      DifficultyCorpusSeedTarget[] = [];

    for (const target of TARGET_BANDS) {
      const shortlist =
        selectShortlist(
          pool,
          shortlistPerArchetype,
          targetToDifficultyTarget(
            target,
          ),
        );

      const bandCounts =
        createEmptyBandCounts();

      let exactSlots = 0;

      for (
        const ranked
        of shortlist
      ) {
        const band =
          ranked.accepted
            .difficulty.band;

        incrementBand(
          bandCounts,
          band,
        );

        if (band === target) {
          exactSlots += 1;
        }
      }

      const targetResult:
        DifficultyCorpusSeedTarget = {
        target,
        totalSlots:
          shortlist.length,
        exactSlots,
        fallbackSlots:
          shortlist.length -
          exactSlots,
        bandCounts,
      };

      seedTargets.push(targetResult);

      const aggregate =
        targetAggregates.get(target);

      if (aggregate === undefined) {
        throw new Error(
          `Missing target aggregate for ${target}.`,
        );
      }

      aggregate.totalSlots +=
        targetResult.totalSlots;
      aggregate.exactSlots +=
        targetResult.exactSlots;
      aggregate.fallbackSlots +=
        targetResult.fallbackSlots;
      addBandCounts(
        aggregate.bandCounts,
        targetResult.bandCounts,
      );

      for (
        const archetype
        of ALL_GENERATOR_ARCHETYPES
      ) {
        const selected =
          shortlist.filter(
            (ranked) =>
              ranked.accepted
                .candidate.archetype ===
              archetype,
          );

        const targetArchetype =
          aggregate.archetypes.find(
            (entry) =>
              entry.archetype ===
              archetype,
          );

        if (
          targetArchetype === undefined
        ) {
          throw new Error(
            `Missing target archetype aggregate for ${archetype}.`,
          );
        }

        const exact =
          selected.filter(
            (ranked) =>
              ranked.accepted
                .difficulty.band ===
              target,
          ).length;

        targetArchetype.totalSlots +=
          selected.length;
        targetArchetype.exactSlots +=
          exact;
        targetArchetype.fallbackSlots +=
          selected.length - exact;
      }
    }

    seedResults.push({
      seed: pool.masterSeed,
      completed: pool.completed,
      accepted: pool.accepted.length,
      bandCounts: seedBandCounts,
      archetypes: seedArchetypes,
      targets: seedTargets,
    });
  }

  const archetypes:
    DifficultyArchetypeAggregate[] =
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype) => {
        const counts =
          archetypeBandCounts.get(
            archetype,
          );

        const archetypeAvailability =
          availability.get(archetype);

        if (
          counts === undefined ||
          archetypeAvailability ===
            undefined
        ) {
          throw new Error(
            `Missing aggregate for ${archetype}.`,
          );
        }

        return {
          archetype,
          accepted:
            sumBandCounts(counts),
          bandCounts: counts,
          coverage: {
            easy:
              summarizeCoverage(
                archetypeAvailability.easy,
                shortlistPerArchetype,
              ),
            medium:
              summarizeCoverage(
                archetypeAvailability.medium,
                shortlistPerArchetype,
              ),
            hard:
              summarizeCoverage(
                archetypeAvailability.hard,
                shortlistPerArchetype,
              ),
            expert:
              summarizeCoverage(
                archetypeAvailability.expert,
                shortlistPerArchetype,
              ),
          },
        };
      },
    );

  const targets:
    DifficultyTargetAggregate[] =
    TARGET_BANDS.map(
      (target) => {
        const aggregate =
          targetAggregates.get(target);

        if (aggregate === undefined) {
          throw new Error(
            `Missing target aggregate for ${target}.`,
          );
        }

        return {
          target,
          totalSlots:
            aggregate.totalSlots,
          exactSlots:
            aggregate.exactSlots,
          fallbackSlots:
            aggregate.fallbackSlots,
          exactRate:
            aggregate.totalSlots === 0
              ? 0
              : roundMetric(
                  aggregate.exactSlots /
                    aggregate.totalSlots,
                ),
          bandCounts:
            aggregate.bandCounts,
          archetypes:
            aggregate.archetypes.map(
              (entry) => ({
                ...entry,
              }),
            ),
        };
      },
    );

  const firstConfig = pools[0].config;

  return {
    schemaVersion: 1,
    seeds,
    config: {
      acceptedPerArchetype:
        firstConfig
          .acceptedPerArchetype,
      shortlistPerArchetype,
      maxAttemptsPerArchetype:
        firstConfig
          .maxAttemptsPerArchetype,
    },
    summary: {
      seedCount: pools.length,
      completedSeeds,
      totalAccepted,
      bandCounts:
        summaryBandCounts,
    },
    archetypes,
    targets,
    seedResults,
  };
}

interface MutableTargetArchetypeAggregate {
  archetype: GeneratorArchetype;
  totalSlots: number;
  exactSlots: number;
  fallbackSlots: number;
}

interface MutableTargetAggregate {
  target: DifficultyCorpusRatedBand;
  totalSlots: number;
  exactSlots: number;
  fallbackSlots: number;
  bandCounts:
    DifficultyCorpusBandCounts;
  archetypes:
    MutableTargetArchetypeAggregate[];
}

function createMutableTargetAggregate(
  target: DifficultyCorpusRatedBand,
): MutableTargetAggregate {
  return {
    target,
    totalSlots: 0,
    exactSlots: 0,
    fallbackSlots: 0,
    bandCounts:
      createEmptyBandCounts(),
    archetypes:
      ALL_GENERATOR_ARCHETYPES.map(
        (archetype) => ({
          archetype,
          totalSlots: 0,
          exactSlots: 0,
          fallbackSlots: 0,
        }),
      ),
  };
}

function summarizeCoverage(
  values: readonly number[],
  targetSlots: number,
): DifficultyBandCoverage {
  if (values.length === 0) {
    return {
      totalAvailable: 0,
      minAvailable: 0,
      maxAvailable: 0,
      seedsWithAny: 0,
      seedsWithAtLeastTargetSlots: 0,
      classification: 'none',
    };
  }

  const totalAvailable =
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  const minAvailable =
    Math.min(...values);

  const maxAvailable =
    Math.max(...values);

  const seedsWithAny =
    values.filter(
      (value) => value > 0,
    ).length;

  const seedsWithAtLeastTargetSlots =
    values.filter(
      (value) =>
        value >= targetSlots,
    ).length;

  const classification:
    DifficultyCoverageClassification =
    maxAvailable === 0
      ? 'none'
      : minAvailable >=
          targetSlots
        ? 'stable-full'
        : 'partial';

  return {
    totalAvailable,
    minAvailable,
    maxAvailable,
    seedsWithAny,
    seedsWithAtLeastTargetSlots,
    classification,
  };
}

function createEmptyBandCounts():
  DifficultyCorpusBandCounts {
  return {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    unrated: 0,
  };
}

function incrementBand(
  counts:
    DifficultyCorpusBandCounts,
  band: DifficultyBandType,
): void {
  counts[band] += 1;
}

function addBandCounts(
  target:
    DifficultyCorpusBandCounts,
  source:
    DifficultyCorpusBandCounts,
): void {
  target.easy += source.easy;
  target.medium += source.medium;
  target.hard += source.hard;
  target.expert += source.expert;
  target.unrated += source.unrated;
}

function sumBandCounts(
  counts:
    DifficultyCorpusBandCounts,
): number {
  return (
    counts.easy +
    counts.medium +
    counts.hard +
    counts.expert +
    counts.unrated
  );
}

function targetToDifficultyTarget(
  target: DifficultyCorpusRatedBand,
):
  | typeof DifficultyTarget.Easy
  | typeof DifficultyTarget.Medium
  | typeof DifficultyTarget.Hard
  | typeof DifficultyTarget.Expert {
  return target;
}

function validateSeeds(
  seeds: readonly number[],
): void {
  if (seeds.length === 0) {
    throw new Error(
      'Difficulty corpus requires at least one seed.',
    );
  }

  const seen = new Set<number>();

  for (const seed of seeds) {
    if (
      !Number.isSafeInteger(seed) ||
      seed < 0 ||
      seed > 0xffff_ffff
    ) {
      throw new RangeError(
        `Corpus seed must be a uint32: ${seed}`,
      );
    }

    if (seen.has(seed)) {
      throw new Error(
        `Duplicate corpus seed: ${seed}`,
      );
    }

    seen.add(seed);
  }
}

function roundMetric(
  value: number,
): number {
  return (
    Math.round(value * 1_000_000) /
    1_000_000
  );
}

export function formatDifficultyCorpusMarkdown(
  report: DifficultyCorpusReport,
): string {
  const lines: string[] = [
    '# Dungeon Logic Difficulty Corpus',
    '',
    `Seeds: ${report.seeds.join(', ')}`,
    `Seed count: ${report.summary.seedCount}`,
    `Completed seeds: ${report.summary.completedSeeds}`,
    `Accepted candidates: ${report.summary.totalAccepted}`,
    `Accepted per archetype target: ${report.config.acceptedPerArchetype}`,
    `Shortlist slots per archetype: ${report.config.shortlistPerArchetype}`,
    '',
    '## Accepted difficulty distribution',
    '',
    '| Band | Count | Share |',
    '| --- | ---: | ---: |',
  ];

  for (
    const band
    of [
      DifficultyBand.Easy,
      DifficultyBand.Medium,
      DifficultyBand.Hard,
      DifficultyBand.Expert,
      DifficultyBand.Unrated,
    ] as const
  ) {
    const count =
      report.summary.bandCounts[
        band
      ];

    lines.push(
      `| ${band} | ${count} | ${formatPercent(count, report.summary.totalAccepted)} |`,
    );
  }

  lines.push(
    '',
    '## Archetype coverage',
    '',
  );

  for (
    const archetype
    of report.archetypes
  ) {
    lines.push(
      `### ${archetype.archetype}`,
      '',
      `Accepted: ${archetype.accepted}`,
      '',
      '| Band | Total | Min/seed | Max/seed | Seeds any | Seeds full | Classification |',
      '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
    );

    for (const band of TARGET_BANDS) {
      const coverage =
        archetype.coverage[band];

      lines.push(
        `| ${band} | ${coverage.totalAvailable} | ${coverage.minAvailable} | ${coverage.maxAvailable} | ${coverage.seedsWithAny}/${report.summary.seedCount} | ${coverage.seedsWithAtLeastTargetSlots}/${report.summary.seedCount} | ${coverage.classification} |`,
      );
    }

    lines.push('');
  }

  const stable =
    collectCoverageLabels(
      report,
      'stable-full',
    );

  const none =
    collectCoverageLabels(
      report,
      'none',
    );

  const partial =
    collectCoverageLabels(
      report,
      'partial',
    );

  lines.push(
    '### Coverage classification',
    '',
    `- stable-full: ${stable.length === 0 ? 'none' : stable.join(', ')}`,
    `- partial: ${partial.length === 0 ? 'none' : partial.join(', ')}`,
    `- none: ${none.length === 0 ? 'none' : none.join(', ')}`,
    '',
    '## Target shortlist performance',
    '',
    '| Target | Slots | Exact | Fallback | Exact rate |',
    '| --- | ---: | ---: | ---: | ---: |',
  );

  for (const target of report.targets) {
    lines.push(
      `| ${target.target} | ${target.totalSlots} | ${target.exactSlots} | ${target.fallbackSlots} | ${formatRate(target.exactRate)} |`,
    );
  }

  lines.push('');

  for (const target of report.targets) {
    lines.push(
      `### Target: ${target.target}`,
      '',
      '| Archetype | Slots | Exact | Fallback |',
      '| --- | ---: | ---: | ---: |',
    );

    for (
      const archetype
      of target.archetypes
    ) {
      lines.push(
        `| ${archetype.archetype} | ${archetype.totalSlots} | ${archetype.exactSlots} | ${archetype.fallbackSlots} |`,
      );
    }

    lines.push('');
  }

  lines.push(
    '## Per-seed summary',
    '',
  );

  for (
    const seed
    of report.seedResults
  ) {
    lines.push(
      `### Seed ${seed.seed}`,
      '',
      `- completed: ${seed.completed}`,
      `- accepted: ${seed.accepted}`,
      `- bands: easy=${seed.bandCounts.easy} medium=${seed.bandCounts.medium} hard=${seed.bandCounts.hard} expert=${seed.bandCounts.expert} unrated=${seed.bandCounts.unrated}`,
    );

    for (const target of seed.targets) {
      lines.push(
        `- target ${target.target}: exact=${target.exactSlots}/${target.totalSlots} fallback=${target.fallbackSlots}`,
      );
    }

    lines.push('');
  }

  return lines.join('\n');
}

function collectCoverageLabels(
  report: DifficultyCorpusReport,
  classification:
    DifficultyCoverageClassification,
): string[] {
  const result: string[] = [];

  for (
    const archetype
    of report.archetypes
  ) {
    for (const band of TARGET_BANDS) {
      if (
        archetype.coverage[band]
          .classification ===
        classification
      ) {
        result.push(
          `${archetype.archetype}/${band}`,
        );
      }
    }
  }

  return result;
}

function formatPercent(
  count: number,
  total: number,
): string {
  if (total === 0) {
    return '0.0%';
  }

  return (
    `${(
      count /
      total *
      100
    ).toFixed(1)}%`
  );
}

function formatRate(
  rate: number,
): string {
  return `${(rate * 100).toFixed(1)}%`;
}

