import {
  DifficultyBand,
} from '../../puzzle/difficulty/types';
import {
  TARGETED_ARCHETYPE_QUOTAS,
  TARGETED_POOL_SIZE,
} from '../../puzzle/generator/DifficultyTargetPolicy';
import type {
  GeneratorArchetype,
  GeneratorBoardSize,
} from '../../puzzle/generator/types';
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

export interface ChooseNextAdaptiveLaneOptions {
  readonly lanes: readonly EndlessScanLane[];
  readonly attemptsByLane: Readonly<Record<string, number>>;
  readonly acceptedByLane: Readonly<
    Record<string, Readonly<EndlessBandCounts>>
  >;
  readonly counts: Readonly<EndlessBandCounts>;
  readonly targets: Readonly<EndlessBandCounts>;
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

// Once a band has enough accepted candidates to make composition meaningful,
// steer toward a target archetype mix without ever turning diversity into a
// hard gate. Archetype balance is the primary signal; board size is only a
// soft secondary nudge because difficult candidates naturally skew toward 8x8.
const DIVERSITY_PRESSURE_START_COUNT = 250;
const MAX_CONSECUTIVE_LANE_CHUNKS = 3;
const MIN_ROTATION_UTILITY_RATIO = 0.60;

const ARCHETYPE_SHARE_FLOOR = 0.03;
const ARCHETYPE_SHARE_MAX_BOOST = 16;
const ARCHETYPE_SHARE_POWER = 4;
const SIZE_SHARE_FLOOR = 0.65;
const SIZE_SHARE_MAX_BOOST = 1.50;
const SIZE_SHARE_POWER = 1.5;

type ArchetypeSharePlan = Readonly<
  Record<GeneratorArchetype, number>
>;

type SizeSharePlan = Readonly<
  Record<GeneratorBoardSize, number>
>;

const ARCHETYPE_TARGET_SHARES: Readonly<
  Record<RatedDifficultyBand, ArchetypeSharePlan>
> = {
  easy: {
    'monster-only': 0.36,
    'mixed-one-room': 0.32,
    'mixed-two-rooms': 0.20,
    'chest-two-rooms': 0.08,
    'chest-one-room': 0.04,
  },
  medium: {
    'monster-only': 0.20,
    'mixed-one-room': 0.20,
    'mixed-two-rooms': 0.32,
    'chest-two-rooms': 0.16,
    'chest-one-room': 0.12,
  },
  hard: {
    // Hard is still mostly open monster labyrinths, but mixed layouts must
    // form a substantial minority. Pure chest layouts are deliberately rare
    // here because the probe showed a very low Hard yield for those lanes.
    'monster-only': 0.50,
    'mixed-one-room': 0.34,
    'mixed-two-rooms': 0.14,
    'chest-one-room': 0.01,
    'chest-two-rooms': 0.01,
  },
  expert: {
    // Expert has several productive 8x8 sources, so preserve a much broader
    // archetype mix without forcing effectively impossible 6x6 Experts.
    'monster-only': 0.45,
    'chest-one-room': 0.30,
    'mixed-one-room': 0.20,
    'chest-two-rooms': 0.03,
    'mixed-two-rooms': 0.02,
  },
};

const SIZE_TARGET_SHARES: Readonly<
  Record<RatedDifficultyBand, SizeSharePlan>
> = {
  easy: { 6: 0.45, 7: 0.35, 8: 0.20 },
  medium: { 6: 0.20, 7: 0.40, 8: 0.40 },
  hard: { 6: 0.05, 7: 0.30, 8: 0.65 },
  expert: { 6: 0.00, 7: 0.15, 8: 0.85 },
};

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

  if (
    reservoirTargetsSatisfied(
      options.counts,
      options.targets,
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

  const diversityContext = buildDiversityContext(
    lanes,
    options.acceptedByLane,
  );

  let bestLane: EndlessScanLane | null = null;
  let bestUtility = Number.NEGATIVE_INFINITY;
  let bestAlternativeLane: EndlessScanLane | null = null;
  let bestAlternativeUtility = Number.NEGATIVE_INFINITY;

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
      options.targets,
      diversityContext,
    );

    if (lane.id !== options.recentLaneId) {
      if (
        utility > bestAlternativeUtility ||
        (
          utility === bestAlternativeUtility &&
          bestAlternativeLane !== null &&
          lane.index < bestAlternativeLane.index
        )
      ) {
        bestAlternativeLane = lane;
        bestAlternativeUtility = utility;
      }
    }

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

  if (bestLane !== null && bestUtility > 0) {
    return applyLaneRotation(
      bestLane,
      bestUtility,
      bestAlternativeLane,
      bestAlternativeUtility,
      options,
    );
  }

  // Diversity is a content-quality preference, never a hard generation gate.
  // If weighted utility ever collapses to zero, fall back to raw
  // yield/deficit utility so the reservoir can still finish.
  bestLane = null;
  bestUtility = Number.NEGATIVE_INFINITY;
  bestAlternativeLane = null;
  bestAlternativeUtility = Number.NEGATIVE_INFINITY;
  for (const lane of lanes) {
    const attempts = options.attemptsByLane[lane.id] ?? 0;
    if (attempts >= options.maxAttemptsPerLane) continue;
    const accepted =
      options.acceptedByLane[lane.id] ??
      createEmptyEndlessBandCounts();
    const utility = calculateLaneUtility(
      lane,
      attempts,
      accepted,
      options.counts,
      options.targets,
      diversityContext,
      false,
    );
    if (lane.id !== options.recentLaneId) {
      if (
        utility > bestAlternativeUtility ||
        (
          utility === bestAlternativeUtility &&
          bestAlternativeLane !== null &&
          lane.index < bestAlternativeLane.index
        )
      ) {
        bestAlternativeLane = lane;
        bestAlternativeUtility = utility;
      }
    }
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

  if (bestLane === null) return null;
  return applyLaneRotation(
    bestLane,
    bestUtility,
    bestAlternativeLane,
    bestAlternativeUtility,
    options,
  );
}

function applyLaneRotation(
  bestLane: EndlessScanLane,
  bestUtility: number,
  alternativeLane: EndlessScanLane | null,
  alternativeUtility: number,
  options: ChooseNextAdaptiveLaneOptions,
): EndlessScanLane {
  const consecutive =
    options.consecutiveLaneChunks ?? 0;
  if (
    options.recentLaneId === null ||
    options.recentLaneId === undefined ||
    bestLane.id !== options.recentLaneId ||
    consecutive < MAX_CONSECUTIVE_LANE_CHUNKS ||
    alternativeLane === null ||
    alternativeUtility <= 0
  ) {
    return bestLane;
  }

  if (
    bestUtility <= 0 ||
    alternativeUtility >=
      bestUtility * MIN_ROTATION_UTILITY_RATIO
  ) {
    return alternativeLane;
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
  targets: Readonly<EndlessBandCounts>,
  diversityContext: EndlessDiversityContext,
  applyDiversity = true,
): number {
  let utility = 0;

  for (const band of RATED_BANDS) {
    const yieldRate = smoothedYield(
      lane,
      band,
      attempts,
      accepted[band],
    );
    const target = targets[band];
    const deficit = Math.max(
      0,
      target - counts[band],
    );

    if (deficit > 0) {
      const normalizedDeficit =
        target === 0 ? 0 : deficit / target;
      const archetypeAccepted =
        diversityContext.acceptedByArchetype[
          lane.archetype
        ]?.[band] ?? 0;
      const sizeAccepted =
        diversityContext.acceptedBySize[
          String(lane.size)
        ]?.[band] ?? 0;
      const diversityFactor = applyDiversity
        ? calculateLaneDiversityFactor(
            band,
            counts[band],
            lane.archetype,
            lane.size,
            archetypeAccepted,
            sizeAccepted,
          )
        : 1;
      utility +=
        normalizedDeficit *
        yieldRate *
        diversityFactor;
    }
  }

  return roundMetric(utility);
}

function calculateLaneDiversityFactor(
  band: RatedDifficultyBand,
  totalAcceptedInBand: number,
  archetype: GeneratorArchetype,
  size: GeneratorBoardSize,
  archetypeAcceptedInBand: number,
  sizeAcceptedInBand: number,
): number {
  if (
    totalAcceptedInBand <
    DIVERSITY_PRESSURE_START_COUNT
  ) {
    return 1;
  }

  if (totalAcceptedInBand === 0) {
    return 1;
  }

  const archetypeTarget =
    ARCHETYPE_TARGET_SHARES[band][archetype];
  const sizeTarget = SIZE_TARGET_SHARES[band][size];
  const archetypeFactor = targetShareFactor(
    archetypeAcceptedInBand / totalAcceptedInBand,
    archetypeTarget,
    ARCHETYPE_SHARE_FLOOR,
    ARCHETYPE_SHARE_MAX_BOOST,
    ARCHETYPE_SHARE_POWER,
  );
  const sizeFactor = targetShareFactor(
    sizeAcceptedInBand / totalAcceptedInBand,
    sizeTarget,
    SIZE_SHARE_FLOOR,
    SIZE_SHARE_MAX_BOOST,
    SIZE_SHARE_POWER,
  );

  return archetypeFactor * sizeFactor;
}

function targetShareFactor(
  actualShare: number,
  targetShare: number,
  floor: number,
  maxBoost: number,
  power: number,
): number {
  if (targetShare <= 0) {
    return actualShare <= 0 ? 1 : floor;
  }

  // Compare the desired share with the observed share directly. Raising the
  // ratio to a power gives badly under-represented archetypes enough pressure
  // to beat a much higher raw-yield lane, while the maxBoost prevents rare
  // lanes from becoming an unbounded time sink. A small pseudo-share keeps a
  // brand-new archetype finite and deterministic.
  const pseudoShare = Math.max(
    actualShare,
    targetShare * 0.05,
  );
  const ratio = targetShare / pseudoShare;
  const weighted = Math.pow(ratio, power);
  return Math.max(
    floor,
    Math.min(maxBoost, weighted),
  );
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

  for (const band of RATED_BANDS) {
    validateNonNegativeInteger(
      options.counts[band],
      `Endless ${band} reservoir count`,
    );
    validateNonNegativeInteger(
      options.targets[band],
      `Endless ${band} reservoir target`,
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
