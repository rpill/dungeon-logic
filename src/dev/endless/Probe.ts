import {
  ALL_GENERATOR_ARCHETYPES,
  type GeneratorArchetype,
} from '../../puzzle/generator/types';
import {
  buildEndlessReservoirTargets,
  createEmptyEndlessBandCounts,
  type EndlessBandCounts,
} from './AdaptiveScanPolicy';
import {
  buildCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  createRejectionCounts,
  scanEndlessLane,
} from './ReservoirScanner';
import {
  buildEndlessScanPlan,
} from './ScanPlan';
import type {
  EndlessRejectionReason,
} from './types';

export interface EndlessProbeOptions {
  readonly masterSeed: number;
  readonly attemptsPerLane: number;
  readonly target: number;
  readonly reservePercent?: number;
}

export interface EndlessProbeLaneReport {
  readonly laneId: string;
  readonly archetype: GeneratorArchetype;
  readonly size: 6 | 7 | 8;
  readonly attempts: number;
  readonly accepted: number;
  readonly acceptanceRate: number;
  readonly countsByBand: Readonly<EndlessBandCounts>;
}

export interface EndlessProbeReport {
  readonly masterSeed: number;
  readonly attemptsPerLane: number;
  readonly laneCount: number;
  readonly attempts: number;
  readonly accepted: number;
  readonly elapsedMs: number;
  readonly attemptsPerSecond: number;
  readonly acceptedPerSecond: number;
  readonly acceptanceRate: number;
  readonly rejectionCounts: Readonly<Record<EndlessRejectionReason, number>>;
  readonly countsByArchetype: Readonly<Record<GeneratorArchetype, number>>;
  readonly countsBySize: Readonly<Record<'6' | '7' | '8', number>>;
  readonly countsByBand: Readonly<Record<'easy' | 'medium' | 'hard' | 'expert', number>>;
  readonly progressionDemand: Readonly<EndlessBandCounts>;
  readonly reservoirTargets: Readonly<EndlessBandCounts>;
  readonly reservePercent: number;
  readonly reservoirTargetCount: number;
  readonly lanes: readonly EndlessProbeLaneReport[];
  readonly scoreBuckets: Readonly<Record<string, number>>;
  readonly structuralDuplicateRate: number;
  readonly campaignCollisionCount: number;
  readonly dailyCollisionCount: number;
  readonly estimatedAttemptsForTarget: number | null;
  readonly estimatedSecondsForTarget: number | null;
  readonly difficultyBottleneckAttemptFloor: number | null;
  readonly difficultyBottleneckSecondsFloor: number | null;
}

export function runEndlessProbe(
  options: EndlessProbeOptions,
): EndlessProbeReport {
  validateProbeOptions(options);

  const crossPool = buildCrossPoolFingerprints();
  const seenCandidateIds = new Set<string>();
  const seenStructuralFingerprints = new Set<string>();
  const rejectionCounts = createRejectionCounts();
  const countsByArchetype = createArchetypeCounts();
  const countsBySize = {
    '6': 0,
    '7': 0,
    '8': 0,
  } satisfies Record<'6' | '7' | '8', number>;
  const countsByBand = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  } satisfies Record<'easy' | 'medium' | 'hard' | 'expert', number>;
  const scoreBuckets = createScoreBuckets();
  const reservePercent =
    options.reservePercent ?? 15;
  const targetPlan = buildEndlessReservoirTargets(
    options.target,
    reservePercent,
  );
  const laneReports: EndlessProbeLaneReport[] = [];

  const plan = buildEndlessScanPlan(
    options.masterSeed,
    options.attemptsPerLane,
  );

  const started = performance.now();
  let attempts = 0;
  let accepted = 0;

  for (const lane of plan) {
    const result = scanEndlessLane({
      masterSeed: options.masterSeed,
      lane,
      crossPool,
      seenCandidateIds,
      seenStructuralFingerprints,
    });

    attempts += result.attempts;
    accepted += result.accepted.length;
    addRejectionCounts(
      rejectionCounts,
      result.rejectionCounts,
    );

    const laneCounts = createEmptyEndlessBandCounts();
    for (const entry of result.accepted) {
      countsByArchetype[entry.archetype] += 1;
      countsBySize[String(entry.size) as '6' | '7' | '8'] += 1;
      countsByBand[entry.difficultyBand] += 1;
      laneCounts[entry.difficultyBand] += 1;
      scoreBuckets[scoreBucket(entry.difficultyScore)] += 1;
    }
    laneReports.push({
      laneId: lane.id,
      archetype: lane.archetype,
      size: lane.size,
      attempts: result.attempts,
      accepted: result.accepted.length,
      acceptanceRate:
        result.attempts === 0
          ? 0
          : result.accepted.length /
            result.attempts,
      countsByBand: laneCounts,
    });
  }

  const elapsedMs = Math.max(
    0.001,
    performance.now() - started,
  );
  const elapsedSeconds = elapsedMs / 1_000;
  const attemptsPerSecond = attempts / elapsedSeconds;
  const acceptedPerSecond = accepted / elapsedSeconds;
  const acceptanceRate = attempts === 0 ? 0 : accepted / attempts;

  const estimatedAttemptsForTarget =
    accepted === 0 || attempts === 0
      ? null
      : Math.ceil(
          targetPlan.totalTarget /
            acceptanceRate,
        );
  const estimatedSecondsForTarget =
    estimatedAttemptsForTarget === null ||
    attemptsPerSecond <= 0
      ? null
      : estimatedAttemptsForTarget / attemptsPerSecond;
  const difficultyBottleneckAttemptFloor =
    estimateDifficultyBottleneckAttemptFloor(
      laneReports,
      targetPlan.targets,
    );
  const difficultyBottleneckSecondsFloor =
    difficultyBottleneckAttemptFloor === null ||
    attemptsPerSecond <= 0
      ? null
      : difficultyBottleneckAttemptFloor /
        attemptsPerSecond;

  return {
    masterSeed: options.masterSeed >>> 0,
    attemptsPerLane: options.attemptsPerLane,
    laneCount: plan.length,
    attempts,
    accepted,
    elapsedMs,
    attemptsPerSecond,
    acceptedPerSecond,
    acceptanceRate,
    rejectionCounts,
    countsByArchetype,
    countsBySize,
    countsByBand,
    progressionDemand: targetPlan.demand,
    reservoirTargets: targetPlan.targets,
    reservePercent,
    reservoirTargetCount:
      targetPlan.totalTarget,
    lanes: laneReports,
    scoreBuckets,
    structuralDuplicateRate:
      attempts === 0
        ? 0
        : rejectionCounts['structural-duplicate'] / attempts,
    campaignCollisionCount:
      rejectionCounts['campaign-collision'],
    dailyCollisionCount:
      rejectionCounts['daily-collision'],
    estimatedAttemptsForTarget,
    estimatedSecondsForTarget,
    difficultyBottleneckAttemptFloor,
    difficultyBottleneckSecondsFloor,
  };
}

export function formatEndlessProbeReport(
  report: EndlessProbeReport,
): string {
  const estimatedAttempts =
    report.estimatedAttemptsForTarget === null
      ? 'insufficient sample'
      : report.estimatedAttemptsForTarget.toLocaleString('en-US');
  const estimatedTime =
    report.estimatedSecondsForTarget === null
      ? 'insufficient sample'
      : formatDuration(report.estimatedSecondsForTarget);
  const difficultyFloorAttempts =
    report.difficultyBottleneckAttemptFloor === null
      ? 'insufficient sample'
      : report.difficultyBottleneckAttemptFloor.toLocaleString('en-US');
  const difficultyFloorTime =
    report.difficultyBottleneckSecondsFloor === null
      ? 'insufficient sample'
      : formatDuration(
          report.difficultyBottleneckSecondsFloor,
        );

  return [
    'ENDLESS PROBE',
    `masterSeed=${report.masterSeed}`,
    `lanes=${report.laneCount} attemptsPerLane=${report.attemptsPerLane}`,
    `attempts=${report.attempts} accepted=${report.accepted} acceptance=${formatPercent(report.acceptanceRate)}`,
    `speed=${round(report.attemptsPerSecond)} attempts/s ${round(report.acceptedPerSecond)} accepted/s`,
    `naiveAnyBandAttemptsForReservoir=${estimatedAttempts}`,
    `naiveAnyBandWallClock=${estimatedTime}`,
    `difficultyBottleneckAttemptFloor=${difficultyFloorAttempts}`,
    `difficultyBottleneckWallClockFloor=${difficultyFloorTime}`,
    `progressionDemand=${JSON.stringify(report.progressionDemand)}`,
    `reservoirTargets(+${report.reservePercent}%)=${JSON.stringify(report.reservoirTargets)} total=${report.reservoirTargetCount}`,
    `campaignCollisions=${report.campaignCollisionCount} dailyCollisions=${report.dailyCollisionCount} structuralDuplicateRate=${formatPercent(report.structuralDuplicateRate)}`,
    `bands=${JSON.stringify(report.countsByBand)}`,
    `sizes=${JSON.stringify(report.countsBySize)}`,
    `archetypes=${JSON.stringify(report.countsByArchetype)}`,
    ...report.lanes.map(
      (lane) =>
        `lane=${lane.laneId} accepted=${lane.accepted}/${lane.attempts} (${formatPercent(lane.acceptanceRate)}) bands=${JSON.stringify(lane.countsByBand)}`,
    ),
    `scoreBuckets=${JSON.stringify(report.scoreBuckets)}`,
    `rejections=${JSON.stringify(report.rejectionCounts)}`,
  ].join('\n');
}

function estimateDifficultyBottleneckAttemptFloor(
  lanes: readonly EndlessProbeLaneReport[],
  targets: Readonly<EndlessBandCounts>,
): number | null {
  let floor = 0;

  for (
    const band of [
      'easy',
      'medium',
      'hard',
      'expert',
    ] as const
  ) {
    if (targets[band] === 0) continue;

    let bestRate = 0;
    for (const lane of lanes) {
      if (lane.attempts === 0) continue;
      bestRate = Math.max(
        bestRate,
        lane.countsByBand[band] /
          lane.attempts,
      );
    }

    if (bestRate <= 0) return null;
    floor = Math.max(
      floor,
      Math.ceil(targets[band] / bestRate),
    );
  }

  return floor;
}

function validateProbeOptions(
  options: EndlessProbeOptions,
): void {
  if (!Number.isInteger(options.masterSeed)) {
    throw new TypeError(
      'Endless master seed must be an integer.',
    );
  }
  if (
    !Number.isInteger(options.attemptsPerLane) ||
    options.attemptsPerLane < 0
  ) {
    throw new RangeError(
      'Endless attempts per lane must be a non-negative integer.',
    );
  }
  if (
    !Number.isInteger(options.target) ||
    options.target <= 0
  ) {
    throw new RangeError(
      'Endless target must be a positive integer.',
    );
  }
  if (
    options.reservePercent !== undefined &&
    (!Number.isInteger(options.reservePercent) ||
      options.reservePercent < 0)
  ) {
    throw new RangeError(
      'Endless reserve percent must be a non-negative integer.',
    );
  }
}

function createArchetypeCounts(): Record<GeneratorArchetype, number> {
  return Object.fromEntries(
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype) => [archetype, 0],
    ),
  ) as Record<GeneratorArchetype, number>;
}

function createScoreBuckets(): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (let start = 0; start <= 90; start += 10) {
    buckets[`${start}-${start + 9}`] = 0;
  }
  buckets['100'] = 0;
  return buckets;
}

function scoreBucket(score: number): string {
  if (score === 100) return '100';
  const start = Math.floor(score / 10) * 10;
  return `${start}-${start + 9}`;
}

function addRejectionCounts(
  target: Record<EndlessRejectionReason, number>,
  source: Readonly<Record<EndlessRejectionReason, number>>,
): void {
  for (
    const reason of Object.keys(source) as EndlessRejectionReason[]
  ) {
    target[reason] += source[reason];
  }
}

function formatPercent(value: number): string {
  return `${round(value * 100)}%`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${round(seconds)}s`;
  if (seconds < 3_600) return `${round(seconds / 60)}m`;
  return `${round(seconds / 3_600)}h`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
