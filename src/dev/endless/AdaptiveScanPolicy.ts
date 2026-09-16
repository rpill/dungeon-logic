import {
  DifficultyBand,
} from '../../puzzle/difficulty/types';
import {
  TARGETED_ARCHETYPE_QUOTAS,
  TARGETED_POOL_SIZE,
} from '../../puzzle/generator/DifficultyTargetPolicy';
import {
  getEndlessProgressionTarget,
} from '../../content/endless/ProgressionPolicy';
import type {
  RatedDifficultyBand,
} from '../../content/endless/CatalogFormat';
import type {
  EndlessScanLane,
} from './types';

export type EndlessBandCounts = Record<
  RatedDifficultyBand,
  number
>;

export interface EndlessReservoirTargetPlan {
  readonly targetCount: number;
  readonly reservePercent: number;
  readonly demand: Readonly<EndlessBandCounts>;
  readonly targets: Readonly<EndlessBandCounts>;
  readonly totalTarget: number;
}

export interface EndlessCoverageBucket {
  readonly allowedBands: readonly RatedDifficultyBand[];
  readonly count: number;
}

export interface EndlessCoveragePlan {
  readonly targetCount: number;
  readonly reservePercent: number;
  readonly buckets: readonly EndlessCoverageBucket[];
  readonly totalTarget: number;
}

export interface ChooseNextAdaptiveLaneOptions {
  readonly lanes: readonly EndlessScanLane[];
  readonly attemptsByLane: Readonly<Record<string, number>>;
  readonly acceptedByLane: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >;
  readonly counts: Readonly<EndlessBandCounts>;
  readonly coveragePlan?: EndlessCoveragePlan;
  readonly targets?: Readonly<EndlessBandCounts>;
  readonly warmupAttemptsPerLane: number;
  readonly maxAttemptsPerLane: number;
  readonly recentLaneId?: string | null;
  readonly consecutiveLaneChunks?: number;
}

const RATED_BANDS: readonly RatedDifficultyBand[] = [
  DifficultyBand.Easy,
  DifficultyBand.Medium,
  DifficultyBand.Hard,
  DifficultyBand.Expert,
];

const PRIOR_ATTEMPTS = 100;
const PRIOR_SUCCESS_SCALE = 2;

// Reservoir composition is diagnostic only. The generator scheduler is
// intentionally yield-driven: diversity is enforced later by Selector.ts,
// where it can improve the final sequence without turning rare generation
// lanes into a time sink.

interface EndlessDiversityContext {
  readonly acceptedByArchetype: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >;
  readonly acceptedBySize: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >;
}

export interface EndlessBandDiversitySnapshot {
  readonly byLane: Readonly<Record<string, number>>;
  readonly byArchetype: Readonly<Record<string, number>>;
  readonly bySize: Readonly<Record<string, number>>;
}

export function createEmptyEndlessBandCounts(): EndlessBandCounts {
  return {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  };
}

export function buildEndlessReservoirTargets(
  targetCount: number,
  reservePercent: number,
): EndlessReservoirTargetPlan {
  validateNonNegativeInteger(targetCount, 'Endless targetCount');
  validateNonNegativeInteger(
    reservePercent,
    'Endless reservePercent',
  );

  const demand = createEmptyEndlessBandCounts();

  for (
    let ordinal = 1;
    ordinal <= targetCount;
    ordinal += 1
  ) {
    const target = getEndlessProgressionTarget(ordinal);
    demand[bandForScore(target.targetScore)] += 1;
  }

  const targets = createEmptyEndlessBandCounts();
  for (const band of RATED_BANDS) {
    targets[band] = Math.ceil(
      demand[band] *
        (100 + reservePercent) /
        100,
    );
  }

  return {
    targetCount,
    reservePercent,
    demand,
    targets,
    totalTarget: sumBandCounts(targets),
  };
}

export function buildEndlessCoveragePlan(
  targetCount: number,
  reservePercent: number,
): EndlessCoveragePlan {
  validateNonNegativeInteger(targetCount, 'Endless targetCount');
  validateNonNegativeInteger(
    reservePercent,
    'Endless reservePercent',
  );

  const bucketMap = new Map<
    string,
    {
      allowedBands: readonly RatedDifficultyBand[];
      count: number;
    }
  >();

  for (
    let ordinal = 1;
    ordinal <= targetCount;
    ordinal += 1
  ) {
    const allowedBands =
      getEndlessProgressionTarget(ordinal).allowedBands;
    const key = coverageBucketKey(allowedBands);
    const existing = bucketMap.get(key);
    if (existing === undefined) {
      bucketMap.set(key, {
        allowedBands: [...allowedBands],
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  }

  const scale = (100 + reservePercent) / 100;
  const buckets = [...bucketMap.values()]
    .map((bucket) => ({
      allowedBands: bucket.allowedBands,
      count: Math.ceil(bucket.count * scale),
    }))
    .sort(compareCoverageBuckets);

  return {
    targetCount,
    reservePercent,
    buckets,
    totalTarget: buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0,
    ),
  };
}

export function calculateEndlessReservoirCoverage(
  counts: Readonly<EndlessBandCounts>,
  plan: EndlessCoveragePlan,
): number {
  validateCoveragePlan(plan);
  for (const band of RATED_BANDS) {
    validateNonNegativeInteger(
      counts[band],
      `Endless ${band} reservoir count`,
    );
  }

  const bandCount = RATED_BANDS.length;
  const bucketCount = plan.buckets.length;
  const source = 0;
  const firstBandNode = 1;
  const firstBucketNode = firstBandNode + bandCount;
  const sink = firstBucketNode + bucketCount;
  const nodeCount = sink + 1;
  const capacity = Array.from(
    { length: nodeCount },
    () => Array<number>(nodeCount).fill(0),
  );

  for (let index = 0; index < bandCount; index += 1) {
    const band = RATED_BANDS[index];
    capacity[source][firstBandNode + index] = counts[band];
  }

  for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
    const bucket = plan.buckets[bucketIndex];
    const bucketNode = firstBucketNode + bucketIndex;
    capacity[bucketNode][sink] = bucket.count;
    for (let bandIndex = 0; bandIndex < bandCount; bandIndex += 1) {
      const band = RATED_BANDS[bandIndex];
      if (bucket.allowedBands.includes(band)) {
        capacity[firstBandNode + bandIndex][bucketNode] =
          plan.totalTarget;
      }
    }
  }

  const residual = capacity.map((row) => [...row]);
  let flow = 0;

  while (true) {
    const parent = Array<number>(nodeCount).fill(-1);
    parent[source] = source;
    const queue = [source];

    for (
      let cursor = 0;
      cursor < queue.length && parent[sink] === -1;
      cursor += 1
    ) {
      const node = queue[cursor];
      for (let next = 0; next < nodeCount; next += 1) {
        if (
          parent[next] === -1 &&
          residual[node][next] > 0
        ) {
          parent[next] = node;
          queue.push(next);
          if (next === sink) break;
        }
      }
    }

    if (parent[sink] === -1) break;

    let augment = Number.POSITIVE_INFINITY;
    for (
      let node = sink;
      node !== source;
      node = parent[node]
    ) {
      const previous = parent[node];
      augment = Math.min(augment, residual[previous][node]);
    }

    for (
      let node = sink;
      node !== source;
      node = parent[node]
    ) {
      const previous = parent[node];
      residual[previous][node] -= augment;
      residual[node][previous] += augment;
    }
    flow += augment;
  }

  return flow;
}

export function reservoirCoverageSatisfied(
  counts: Readonly<EndlessBandCounts>,
  plan: EndlessCoveragePlan,
): boolean {
  return (
    calculateEndlessReservoirCoverage(counts, plan) >=
    plan.totalTarget
  );
}

export function bandForScore(
  score: number,
): RatedDifficultyBand {
  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100
  ) {
    throw new RangeError(
      'Endless difficulty score must be an integer from 0 to 100.',
    );
  }

  if (score <= 24) return DifficultyBand.Easy;
  if (score <= 49) return DifficultyBand.Medium;
  if (score <= 74) return DifficultyBand.Hard;
  return DifficultyBand.Expert;
}

export function countReservoirBands(
  entries: readonly {
    difficultyBand: RatedDifficultyBand;
  }[],
): EndlessBandCounts {
  const counts = createEmptyEndlessBandCounts();
  for (const entry of entries) {
    counts[entry.difficultyBand] += 1;
  }
  return counts;
}

export function reservoirTargetsSatisfied(
  counts: Readonly<EndlessBandCounts>,
  targets: Readonly<EndlessBandCounts>,
): boolean {
  return RATED_BANDS.every(
    (band) => counts[band] >= targets[band],
  );
}

export function chooseNextAdaptiveLane(
  options: ChooseNextAdaptiveLaneOptions,
): EndlessScanLane | null {
  validateAdaptiveLaneOptions(options);
  const coveragePlan = resolveCoveragePlan(options);

  if (
    reservoirCoverageSatisfied(
      options.counts,
      coveragePlan,
    )
  ) {
    return null;
  }

  const lanes = [...options.lanes].sort(
    (left, right) => left.index - right.index,
  );

  for (const lane of lanes) {
    const attempts =
      options.attemptsByLane[lane.id] ?? 0;
    const warmupTarget = Math.min(
      options.warmupAttemptsPerLane,
      options.maxAttemptsPerLane,
    );
    if (attempts < warmupTarget) {
      return lane;
    }
  }

  let bestLane: EndlessScanLane | null = null;
  let bestUtility = Number.NEGATIVE_INFINITY;

  for (const lane of lanes) {
    const attempts =
      options.attemptsByLane[lane.id] ?? 0;
    if (attempts >= options.maxAttemptsPerLane) {
      continue;
    }

    const accepted =
      options.acceptedByLane[lane.id] ??
      createEmptyEndlessBandCounts();
    const utility = calculateLaneUtility(
      lane,
      attempts,
      accepted,
      options.counts,
      coveragePlan,
    );

    if (
      utility > bestUtility ||
      (
        utility === bestUtility &&
        bestLane !== null &&
        lane.index < bestLane.index
      )
    ) {
      bestLane = lane;
      bestUtility = utility;
    }
  }

  return bestLane;
}

export function formatEndlessBandCounts(
  counts: Readonly<EndlessBandCounts>,
): string {
  return JSON.stringify({
    easy: counts.easy,
    medium: counts.medium,
    hard: counts.hard,
    expert: counts.expert,
  });
}

function calculateLaneUtility(
  lane: EndlessScanLane,
  attempts: number,
  accepted: Readonly<EndlessBandCounts>,
  counts: Readonly<EndlessBandCounts>,
  coveragePlan: EndlessCoveragePlan,
): number {
  let utility = 0;
  const currentCoverage =
    calculateEndlessReservoirCoverage(
      counts,
      coveragePlan,
    );

  for (const band of RATED_BANDS) {
    const nextCounts = {
      ...counts,
      [band]: counts[band] + 1,
    };
    const marginalCoverage =
      calculateEndlessReservoirCoverage(
        nextCounts,
        coveragePlan,
      ) - currentCoverage;
    if (marginalCoverage <= 0) continue;

    utility +=
      marginalCoverage *
      smoothedYield(
        lane,
        band,
        attempts,
        accepted[band],
      );
  }

  return roundMetric(utility);
}

function buildDiversityContext(
  lanes: readonly EndlessScanLane[],
  acceptedByLane: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >,
): EndlessDiversityContext {
  const acceptedByArchetype: Record<
    string,
    EndlessBandCounts
  > = {};
  const acceptedBySize: Record<
    string,
    EndlessBandCounts
  > = {};

  for (const lane of lanes) {
    const accepted =
      acceptedByLane[lane.id] ??
      createEmptyEndlessBandCounts();
    const archetypeCounts =
      acceptedByArchetype[lane.archetype] ??
      createEmptyEndlessBandCounts();
    const sizeKey = String(lane.size);
    const sizeCounts =
      acceptedBySize[sizeKey] ??
      createEmptyEndlessBandCounts();

    for (const band of RATED_BANDS) {
      archetypeCounts[band] += accepted[band];
      sizeCounts[band] += accepted[band];
    }

    acceptedByArchetype[lane.archetype] =
      archetypeCounts;
    acceptedBySize[sizeKey] = sizeCounts;
  }

  return {
    acceptedByArchetype,
    acceptedBySize,
  };
}

export function buildEndlessBandDiversitySnapshot(
  lanes: readonly EndlessScanLane[],
  acceptedByLane: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >,
  band: RatedDifficultyBand,
): EndlessBandDiversitySnapshot {
  const context = buildDiversityContext(
    lanes,
    acceptedByLane,
  );
  const byLane: Record<string, number> = {};

  for (const lane of lanes) {
    const count =
      acceptedByLane[lane.id]?.[band] ?? 0;
    if (count > 0) byLane[lane.id] = count;
  }

  const byArchetype: Record<string, number> = {};
  for (const [key, counts] of Object.entries(
    context.acceptedByArchetype,
  )) {
    const count = counts[band];
    if (count > 0) byArchetype[key] = count;
  }

  const bySize: Record<string, number> = {};
  for (const [key, counts] of Object.entries(
    context.acceptedBySize,
  )) {
    const count = counts[band];
    if (count > 0) bySize[key] = count;
  }

  return {
    byLane,
    byArchetype,
    bySize,
  };
}

function smoothedYield(
  lane: EndlessScanLane,
  band: RatedDifficultyBand,
  attempts: number,
  accepted: number,
): number {
  const quotaShare =
    TARGETED_ARCHETYPE_QUOTAS[band][lane.archetype] /
    TARGETED_POOL_SIZE;
  const priorSuccesses =
    quotaShare * PRIOR_SUCCESS_SCALE;

  return (
    accepted + priorSuccesses
  ) / (
    attempts + PRIOR_ATTEMPTS
  );
}

function validateAdaptiveLaneOptions(
  options: ChooseNextAdaptiveLaneOptions,
): void {
  validateNonNegativeInteger(
    options.warmupAttemptsPerLane,
    'Endless warmupAttemptsPerLane',
  );
  validateNonNegativeInteger(
    options.maxAttemptsPerLane,
    'Endless maxAttemptsPerLane',
  );
  const consecutiveLaneChunks =
    options.consecutiveLaneChunks ?? 0;
  validateNonNegativeInteger(
    consecutiveLaneChunks,
    'Endless consecutiveLaneChunks',
  );
  if (
    consecutiveLaneChunks > 0 &&
    (
      options.recentLaneId === null ||
      options.recentLaneId === undefined ||
      options.recentLaneId.length === 0
    )
  ) {
    throw new RangeError(
      'Endless consecutiveLaneChunks requires recentLaneId.',
    );
  }

  if (
    options.warmupAttemptsPerLane >
    options.maxAttemptsPerLane
  ) {
    throw new RangeError(
      'Endless warmupAttemptsPerLane cannot exceed maxAttemptsPerLane.',
    );
  }

  if (
    options.coveragePlan === undefined &&
    options.targets === undefined
  ) {
    throw new RangeError(
      'Adaptive Endless lane selection requires coveragePlan or targets.',
    );
  }
  if (options.coveragePlan !== undefined) {
    validateCoveragePlan(options.coveragePlan);
  }
  if (options.targets !== undefined) {
    for (const band of RATED_BANDS) {
      validateNonNegativeInteger(
        options.targets[band],
        `Endless ${band} reservoir target`,
      );
    }
  }
  for (const band of RATED_BANDS) {
    validateNonNegativeInteger(
      options.counts[band],
      `Endless ${band} reservoir count`,
    );
  }

  for (const lane of options.lanes) {
    const attempts =
      options.attemptsByLane[lane.id] ?? 0;
    validateNonNegativeInteger(
      attempts,
      `Endless attempts for ${lane.id}`,
    );
    if (attempts > options.maxAttemptsPerLane) {
      throw new RangeError(
        `Endless attempts for ${lane.id} exceed maxAttemptsPerLane.`,
      );
    }

    const accepted = options.acceptedByLane[lane.id];
    if (accepted === undefined) continue;
    for (const band of RATED_BANDS) {
      validateNonNegativeInteger(
        accepted[band],
        `Endless ${band} accepted count for ${lane.id}`,
      );
    }
  }
}

function resolveCoveragePlan(
  options: ChooseNextAdaptiveLaneOptions,
): EndlessCoveragePlan {
  if (options.coveragePlan !== undefined) {
    return options.coveragePlan;
  }

  const targets = options.targets;
  if (targets === undefined) {
    throw new RangeError(
      'Adaptive Endless lane selection requires coveragePlan or targets.',
    );
  }

  const buckets = RATED_BANDS
    .filter((band) => targets[band] > 0)
    .map((band) => ({
      allowedBands: [band] as readonly RatedDifficultyBand[],
      count: targets[band],
    }));
  const totalTarget = sumBandCounts(targets);
  return {
    targetCount: totalTarget,
    reservePercent: 0,
    buckets,
    totalTarget,
  };
}

function coverageBucketKey(
  bands: readonly RatedDifficultyBand[],
): string {
  return bands.join('|');
}

function compareCoverageBuckets(
  left: EndlessCoverageBucket,
  right: EndlessCoverageBucket,
): number {
  const order = new Map<string, number>([
    ['easy', 0],
    ['easy|medium', 1],
    ['medium|hard', 2],
    ['hard', 3],
    ['hard|expert', 4],
    ['expert', 5],
  ]);
  return (
    (order.get(coverageBucketKey(left.allowedBands)) ?? 100) -
      (order.get(coverageBucketKey(right.allowedBands)) ?? 100) ||
    coverageBucketKey(left.allowedBands).localeCompare(
      coverageBucketKey(right.allowedBands),
    )
  );
}

function validateCoveragePlan(
  plan: EndlessCoveragePlan,
): void {
  validateNonNegativeInteger(
    plan.targetCount,
    'Endless coverage targetCount',
  );
  validateNonNegativeInteger(
    plan.reservePercent,
    'Endless coverage reservePercent',
  );
  validateNonNegativeInteger(
    plan.totalTarget,
    'Endless coverage totalTarget',
  );

  let total = 0;
  for (const bucket of plan.buckets) {
    validateNonNegativeInteger(
      bucket.count,
      'Endless coverage bucket count',
    );
    if (bucket.allowedBands.length === 0) {
      throw new RangeError(
        'Endless coverage bucket must allow at least one band.',
      );
    }
    for (const band of bucket.allowedBands) {
      if (!RATED_BANDS.includes(band)) {
        throw new RangeError(
          `Endless coverage bucket contains unsupported band ${band}.`,
        );
      }
    }
    total += bucket.count;
  }

  if (total !== plan.totalTarget) {
    throw new RangeError(
      'Endless coverage totalTarget must equal the sum of bucket counts.',
    );
  }
}

function validateNonNegativeInteger(
  value: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${label} must be a non-negative integer.`,
    );
  }
}

function sumBandCounts(
  counts: Readonly<EndlessBandCounts>,
): number {
  return RATED_BANDS.reduce(
    (sum, band) => sum + counts[band],
    0,
  );
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000_000) /
    1_000_000_000;
}
