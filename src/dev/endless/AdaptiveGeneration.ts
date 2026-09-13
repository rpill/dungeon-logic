import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  join,
} from 'node:path';

import type {
  EndlessManifestScanPlanEntry,
} from '../../content/endless/CatalogFormat';
import {
  buildCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  buildEndlessBandDiversitySnapshot,
  buildEndlessReservoirTargets,
  chooseNextAdaptiveLane,
  countReservoirBands,
  createEmptyEndlessBandCounts,
  reservoirTargetsSatisfied,
  type EndlessBandCounts,
  type EndlessBandDiversitySnapshot,
} from './AdaptiveScanPolicy';
import {
  readReservoirChunks,
  readReservoirCoverage,
  writeReservoirChunk,
} from './ReservoirStore';
import {
  scanEndlessLane,
} from './ReservoirScanner';
import {
  buildEndlessScanPlan,
} from './ScanPlan';
import type {
  EndlessReservoirEntry,
  EndlessScanLane,
} from './types';

const ADAPTIVE_STATE_FILE =
  'adaptive-generation-state.json';

export interface AdaptiveEndlessGenerationOptions {
  readonly rootDir: string;
  readonly masterSeed: number;
  readonly targetCount: number;
  readonly reservePercent: number;
  readonly warmupAttemptsPerLane: number;
  readonly maxAttemptsPerLane: number;
  readonly chunkAttempts: number;
  readonly resume: boolean;
  readonly stopAfterChunks?: number;
  readonly onProgress?: (
    progress: AdaptiveEndlessGenerationProgress,
  ) => void;
}

export interface AdaptiveEndlessGenerationState {
  readonly version: 1;
  readonly mode: 'adaptive';
  readonly masterSeed: number;
  readonly targetCount: number;
  readonly reservePercent: number;
  readonly warmupAttemptsPerLane: number;
  readonly maxAttemptsPerLane: number;
  readonly chunkAttempts: number;
  readonly nextAttemptByLane: Readonly<Record<string, number>>;
  // Added compatibly to v1 state. Older in-progress scans may omit these and
  // resume with a fresh streak counter.
  readonly lastLaneId?: string | null;
  readonly consecutiveLaneChunks?: number;
}

export interface AdaptiveEndlessGenerationProgress {
  readonly laneId: string;
  readonly laneAttempts: number;
  readonly totalAttempts: number;
  readonly reservoirCount: number;
  readonly counts: Readonly<EndlessBandCounts>;
  readonly targets: Readonly<EndlessBandCounts>;
  readonly chunksWritten: number;
  readonly hardDiversity: EndlessBandDiversitySnapshot;
  readonly expertDiversity: EndlessBandDiversitySnapshot;
}

export interface AdaptiveEndlessGenerationReport {
  readonly completed: boolean;
  readonly exhausted: boolean;
  readonly chunksWritten: number;
  readonly attemptsProcessed: number;
  readonly totalAttempts: number;
  readonly reservoirCount: number;
  readonly demand: Readonly<EndlessBandCounts>;
  readonly targets: Readonly<EndlessBandCounts>;
  readonly counts: Readonly<EndlessBandCounts>;
  readonly attemptsByLane: Readonly<Record<string, number>>;
  readonly entries: readonly EndlessReservoirEntry[];
}

export function runAdaptiveEndlessGeneration(
  options: AdaptiveEndlessGenerationOptions,
): AdaptiveEndlessGenerationReport {
  validateOptions(options);

  if (
    !options.resume &&
    directoryHasContent(options.rootDir)
  ) {
    throw new Error(
      `Endless adaptive generation root ${options.rootDir} is not empty. Remove it or use --resume.`,
    );
  }

  mkdirSync(options.rootDir, {
    recursive: true,
  });

  const plan = buildEndlessScanPlan(
    options.masterSeed,
    options.maxAttemptsPerLane,
  );
  const crossPool = buildCrossPoolFingerprints();
  const existing = readReservoirChunks(
    options.rootDir,
  );
  const seenCandidateIds = new Set<string>();
  const seenStructuralFingerprints = new Set<string>();
  validateExistingReservoir(
    existing,
    crossPool,
    seenCandidateIds,
    seenStructuralFingerprints,
  );

  let state = resolveInitialState(
    options,
    plan,
  );
  state = reconcileStateWithCoverage(
    options.rootDir,
    plan,
    state,
  );

  const attemptsByLane: Record<string, number> = {
    ...state.nextAttemptByLane,
  };
  const acceptedByLane =
    createAcceptedByLane(plan, existing);
  const counts = countReservoirBands(existing);
  const targetPlan = buildEndlessReservoirTargets(
    options.targetCount,
    options.reservePercent,
  );

  let chunksWritten = 0;
  let attemptsProcessed = 0;

  while (
    !reservoirTargetsSatisfied(
      counts,
      targetPlan.targets,
    )
  ) {
    if (
      options.stopAfterChunks !== undefined &&
      chunksWritten >= options.stopAfterChunks
    ) {
      return buildReport(
        options.rootDir,
        false,
        false,
        chunksWritten,
        attemptsProcessed,
        targetPlan.demand,
        targetPlan.targets,
        attemptsByLane,
      );
    }

    const lane = chooseNextAdaptiveLane({
      lanes: plan,
      attemptsByLane,
      acceptedByLane,
      counts,
      targets: targetPlan.targets,
      warmupAttemptsPerLane:
        options.warmupAttemptsPerLane,
      maxAttemptsPerLane:
        options.maxAttemptsPerLane,
      recentLaneId: state.lastLaneId ?? null,
      consecutiveLaneChunks:
        state.consecutiveLaneChunks ?? 0,
    });

    if (lane === null) {
      return buildReport(
        options.rootDir,
        false,
        true,
        chunksWritten,
        attemptsProcessed,
        targetPlan.demand,
        targetPlan.targets,
        attemptsByLane,
      );
    }

    const startAttempt =
      attemptsByLane[lane.id] ?? 0;
    const attemptCount = nextChunkAttemptCount(
      options,
      startAttempt,
    );
    if (attemptCount <= 0) {
      throw new Error(
        `Adaptive Endless scheduler selected exhausted lane ${lane.id}.`,
      );
    }

    const chunkLane: EndlessScanLane = {
      ...lane,
      startAttempt,
      attemptCount,
    };
    const result = scanEndlessLane({
      masterSeed: options.masterSeed,
      lane: chunkLane,
      crossPool,
      seenCandidateIds,
      seenStructuralFingerprints,
    });

    const persistedEntries = trimAcceptedToTargets(
      result.accepted,
      counts,
      targetPlan.targets,
      seenCandidateIds,
      seenStructuralFingerprints,
    );

    writeReservoirChunk({
      rootDir: options.rootDir,
      laneIndex: lane.index,
      startAttempt,
      endAttemptExclusive:
        startAttempt + attemptCount,
      entries: persistedEntries,
    });

    attemptsByLane[lane.id] =
      startAttempt + attemptCount;
    attemptsProcessed += attemptCount;
    chunksWritten += 1;

    for (const entry of persistedEntries) {
      counts[entry.difficultyBand] += 1;
      acceptedByLane[lane.id][
        entry.difficultyBand
      ] += 1;
    }

    const consecutiveLaneChunks =
      state.lastLaneId === lane.id
        ? (state.consecutiveLaneChunks ?? 0) + 1
        : 1;
    state = {
      ...state,
      nextAttemptByLane: {
        ...attemptsByLane,
      },
      lastLaneId: lane.id,
      consecutiveLaneChunks,
    };
    writeAdaptiveGenerationState(
      options.rootDir,
      state,
    );

    options.onProgress?.({
      laneId: lane.id,
      laneAttempts: attemptsByLane[lane.id] ?? 0,
      totalAttempts: sumAttemptCounts(attemptsByLane),
      reservoirCount: sumBandCounts(counts),
      counts: { ...counts },
      targets: { ...targetPlan.targets },
      chunksWritten,
      hardDiversity:
        buildEndlessBandDiversitySnapshot(
          plan,
          acceptedByLane,
          'hard',
        ),
      expertDiversity:
        buildEndlessBandDiversitySnapshot(
          plan,
          acceptedByLane,
          'expert',
        ),
    });
  }

  return buildReport(
    options.rootDir,
    true,
    false,
    chunksWritten,
    attemptsProcessed,
    targetPlan.demand,
    targetPlan.targets,
    attemptsByLane,
  );
}

function trimAcceptedToTargets(
  accepted: readonly EndlessReservoirEntry[],
  counts: Readonly<EndlessBandCounts>,
  targets: Readonly<EndlessBandCounts>,
  seenCandidateIds: Set<string>,
  seenStructuralFingerprints: Set<string>,
): readonly EndlessReservoirEntry[] {
  const acceptedThisChunk =
    createEmptyEndlessBandCounts();
  const persisted: EndlessReservoirEntry[] = [];

  for (const entry of accepted) {
    const band = entry.difficultyBand;
    const remaining =
      targets[band] -
      counts[band] -
      acceptedThisChunk[band];

    if (remaining > 0) {
      persisted.push(entry);
      acceptedThisChunk[band] += 1;
      continue;
    }

    // scanEndlessLane marks accepted entries as seen. Entries discarded
    // because their band reservoir is already full must not influence the
    // rest of the scan, otherwise an interrupted/resumed run could diverge
    // from an uninterrupted run.
    seenCandidateIds.delete(entry.candidateId);
    seenStructuralFingerprints.delete(
      entry.structuralFingerprint,
    );
  }

  return persisted;
}

export function readAdaptiveGenerationState(
  rootDir: string,
): AdaptiveEndlessGenerationState | null {
  const filePath = join(
    rootDir,
    ADAPTIVE_STATE_FILE,
  );
  if (!existsSync(filePath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(
      readFileSync(filePath, 'utf8'),
    );
  } catch (error: unknown) {
    throw new Error(
      `Malformed Endless adaptive generation state: ${String(error)}`,
    );
  }

  validateState(parsed);
  return parsed;
}

export function buildAdaptiveSourceScanPlan(
  state: AdaptiveEndlessGenerationState,
): readonly EndlessManifestScanPlanEntry[] {
  const lanes = buildEndlessScanPlan(
    state.masterSeed,
    state.maxAttemptsPerLane,
  );

  return lanes
    .map((lane) => ({
      laneId: lane.id,
      archetype: lane.archetype,
      size: lane.size,
      startAttempt: 0,
      attemptCount:
        state.nextAttemptByLane[lane.id] ?? 0,
    }))
    .filter((entry) => entry.attemptCount > 0);
}

function resolveInitialState(
  options: AdaptiveEndlessGenerationOptions,
  plan: readonly EndlessScanLane[],
): AdaptiveEndlessGenerationState {
  const existing = readAdaptiveGenerationState(
    options.rootDir,
  );

  if (options.resume) {
    if (existing === null) {
      throw new Error(
        'Cannot resume adaptive Endless generation without adaptive-generation-state.json.',
      );
    }
    validateResumeOptions(options, existing);
    for (const lane of plan) {
      if (
        existing.nextAttemptByLane[lane.id] ===
        undefined
      ) {
        throw new Error(
          `Adaptive Endless generation state is missing lane ${lane.id}.`,
        );
      }
    }

    const extended: AdaptiveEndlessGenerationState = {
      ...existing,
      targetCount: options.targetCount,
      reservePercent: options.reservePercent,
      maxAttemptsPerLane:
        options.maxAttemptsPerLane,
    };
    writeAdaptiveGenerationState(
      options.rootDir,
      extended,
    );
    return extended;
  }

  if (existing !== null) {
    throw new Error(
      'Adaptive Endless generation state already exists; use --resume.',
    );
  }

  const state: AdaptiveEndlessGenerationState = {
    version: 1,
    mode: 'adaptive',
    masterSeed: options.masterSeed >>> 0,
    targetCount: options.targetCount,
    reservePercent: options.reservePercent,
    warmupAttemptsPerLane:
      options.warmupAttemptsPerLane,
    maxAttemptsPerLane:
      options.maxAttemptsPerLane,
    chunkAttempts: options.chunkAttempts,
    nextAttemptByLane: Object.fromEntries(
      plan.map((lane) => [lane.id, 0]),
    ),
    lastLaneId: null,
    consecutiveLaneChunks: 0,
  };
  writeAdaptiveGenerationState(
    options.rootDir,
    state,
  );
  return state;
}

function reconcileStateWithCoverage(
  rootDir: string,
  plan: readonly EndlessScanLane[],
  state: AdaptiveEndlessGenerationState,
): AdaptiveEndlessGenerationState {
  const coverage = readReservoirCoverage(rootDir);
  const nextAttemptByLane = {
    ...state.nextAttemptByLane,
  };
  let changed = false;

  for (const lane of plan) {
    const coveredUntil =
      coverage.get(lane.index) ?? 0;
    const stateNext =
      nextAttemptByLane[lane.id];
    if (stateNext === undefined) {
      throw new Error(
        `Adaptive Endless generation state is missing lane ${lane.id}.`,
      );
    }
    if (
      coveredUntil >
      state.maxAttemptsPerLane
    ) {
      throw new Error(
        `Adaptive Endless reservoir coverage for ${lane.id} exceeds maxAttemptsPerLane.`,
      );
    }
    if (stateNext > coveredUntil) {
      throw new Error(
        `Adaptive Endless generation state for ${lane.id} is ahead of persisted reservoir coverage (${stateNext} > ${coveredUntil}).`,
      );
    }
    if (coveredUntil > stateNext) {
      nextAttemptByLane[lane.id] =
        coveredUntil;
      changed = true;
    }
  }

  for (const laneIndex of coverage.keys()) {
    if (plan[laneIndex] === undefined) {
      throw new Error(
        `Adaptive Endless reservoir contains unknown lane index ${laneIndex}.`,
      );
    }
  }

  if (!changed) return state;

  const reconciled: AdaptiveEndlessGenerationState = {
    ...state,
    nextAttemptByLane,
  };
  writeAdaptiveGenerationState(
    rootDir,
    reconciled,
  );
  return reconciled;
}

function createAcceptedByLane(
  plan: readonly EndlessScanLane[],
  entries: readonly EndlessReservoirEntry[],
): Record<string, EndlessBandCounts> {
  const result = Object.fromEntries(
    plan.map((lane) => [
      lane.id,
      createEmptyEndlessBandCounts(),
    ]),
  ) as Record<string, EndlessBandCounts>;

  for (const entry of entries) {
    const counts = result[entry.laneId];
    if (counts === undefined) {
      throw new Error(
        `Adaptive Endless reservoir contains unknown lane ${entry.laneId}.`,
      );
    }
    counts[entry.difficultyBand] += 1;
  }
  return result;
}

function validateExistingReservoir(
  entries: readonly EndlessReservoirEntry[],
  crossPool: ReturnType<
    typeof buildCrossPoolFingerprints
  >,
  seenCandidateIds: Set<string>,
  seenStructuralFingerprints: Set<string>,
): void {
  for (const entry of entries) {
    if (seenCandidateIds.has(entry.candidateId)) {
      throw new Error(
        `Duplicate candidate ID in resumed adaptive Endless reservoir: ${entry.candidateId}.`,
      );
    }
    if (
      seenStructuralFingerprints.has(
        entry.structuralFingerprint,
      )
    ) {
      throw new Error(
        `Duplicate structural fingerprint in resumed adaptive Endless reservoir: ${entry.candidateId}.`,
      );
    }
    if (
      crossPool.campaign.has(
        entry.structuralFingerprint,
      ) ||
      crossPool.daily.has(
        entry.structuralFingerprint,
      )
    ) {
      throw new Error(
        `Cross-pool collision in resumed adaptive Endless reservoir: ${entry.candidateId}.`,
      );
    }
    seenCandidateIds.add(entry.candidateId);
    seenStructuralFingerprints.add(
      entry.structuralFingerprint,
    );
  }
}

function nextChunkAttemptCount(
  options: AdaptiveEndlessGenerationOptions,
  startAttempt: number,
): number {
  const maxRemaining =
    options.maxAttemptsPerLane - startAttempt;
  const warmupRemaining = Math.max(
    0,
    options.warmupAttemptsPerLane -
      startAttempt,
  );
  const phaseRemaining =
    warmupRemaining > 0
      ? warmupRemaining
      : maxRemaining;

  return Math.min(
    options.chunkAttempts,
    maxRemaining,
    phaseRemaining,
  );
}

function buildReport(
  rootDir: string,
  completed: boolean,
  exhausted: boolean,
  chunksWritten: number,
  attemptsProcessed: number,
  demand: Readonly<EndlessBandCounts>,
  targets: Readonly<EndlessBandCounts>,
  attemptsByLane: Readonly<Record<string, number>>,
): AdaptiveEndlessGenerationReport {
  const entries = readReservoirChunks(rootDir);
  const counts = countReservoirBands(entries);
  const stableAttempts = Object.fromEntries(
    Object.entries(attemptsByLane)
      .sort(([left], [right]) =>
        left.localeCompare(right),
      ),
  );

  return {
    completed,
    exhausted,
    chunksWritten,
    attemptsProcessed,
    totalAttempts: Object.values(
      stableAttempts,
    ).reduce(
      (sum, value) => sum + value,
      0,
    ),
    reservoirCount: entries.length,
    demand: { ...demand },
    targets: { ...targets },
    counts,
    attemptsByLane: stableAttempts,
    entries,
  };
}

function writeAdaptiveGenerationState(
  rootDir: string,
  state: AdaptiveEndlessGenerationState,
): string {
  validateState(state);
  const filePath = join(
    rootDir,
    ADAPTIVE_STATE_FILE,
  );
  const stable: AdaptiveEndlessGenerationState = {
    ...state,
    masterSeed: state.masterSeed >>> 0,
    nextAttemptByLane: Object.fromEntries(
      Object.entries(state.nextAttemptByLane)
        .sort(([left], [right]) =>
          left.localeCompare(right),
        ),
    ),
    lastLaneId: state.lastLaneId ?? null,
    consecutiveLaneChunks:
      state.consecutiveLaneChunks ?? 0,
  };
  writeAtomicReplace(
    filePath,
    `${JSON.stringify(stable, null, 2)}\n`,
  );
  return filePath;
}

function validateResumeOptions(
  options: AdaptiveEndlessGenerationOptions,
  state: AdaptiveEndlessGenerationState,
): void {
  if (
    state.masterSeed !==
    (options.masterSeed >>> 0)
  ) {
    throw new Error(
      'Adaptive Endless resume master seed does not match state.',
    );
  }
  if (
    state.chunkAttempts !==
    options.chunkAttempts
  ) {
    throw new Error(
      `Adaptive Endless resume must keep chunkAttempts=${state.chunkAttempts}.`,
    );
  }
  if (
    state.warmupAttemptsPerLane !==
    options.warmupAttemptsPerLane
  ) {
    throw new Error(
      `Adaptive Endless resume must keep warmupAttemptsPerLane=${state.warmupAttemptsPerLane}.`,
    );
  }
  if (options.targetCount < state.targetCount) {
    throw new Error(
      `Adaptive Endless resume cannot reduce targetCount from ${state.targetCount} to ${options.targetCount}.`,
    );
  }
  if (
    options.reservePercent <
    state.reservePercent
  ) {
    throw new Error(
      `Adaptive Endless resume cannot reduce reservePercent from ${state.reservePercent} to ${options.reservePercent}.`,
    );
  }
  if (
    options.maxAttemptsPerLane <
    state.maxAttemptsPerLane
  ) {
    throw new Error(
      `Adaptive Endless resume cannot reduce maxAttemptsPerLane from ${state.maxAttemptsPerLane} to ${options.maxAttemptsPerLane}.`,
    );
  }
}

function validateState(
  value: unknown,
): asserts value is AdaptiveEndlessGenerationState {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    throw new Error(
      'Adaptive Endless generation state must be an object.',
    );
  }
  const state = value as Partial<
    AdaptiveEndlessGenerationState
  >;
  if (
    state.version !== 1 ||
    state.mode !== 'adaptive' ||
    !isUint32(state.masterSeed) ||
    !isNonNegativeInteger(state.targetCount) ||
    !isNonNegativeInteger(state.reservePercent) ||
    !isNonNegativeInteger(
      state.warmupAttemptsPerLane,
    ) ||
    !isNonNegativeInteger(
      state.maxAttemptsPerLane,
    ) ||
    state.warmupAttemptsPerLane >
      state.maxAttemptsPerLane ||
    !Number.isInteger(state.chunkAttempts) ||
    (state.chunkAttempts ?? 0) <= 0 ||
    typeof state.nextAttemptByLane !==
      'object' ||
    state.nextAttemptByLane === null
  ) {
    throw new Error(
      'Invalid adaptive Endless generation state schema.',
    );
  }

  const consecutiveLaneChunks =
    state.consecutiveLaneChunks ?? 0;
  if (
    !isNonNegativeInteger(consecutiveLaneChunks) ||
    (
      state.lastLaneId !== undefined &&
      state.lastLaneId !== null &&
      (
        typeof state.lastLaneId !== 'string' ||
        state.lastLaneId.length === 0
      )
    ) ||
    (
      consecutiveLaneChunks > 0 &&
      (
        state.lastLaneId === undefined ||
        state.lastLaneId === null
      )
    )
  ) {
    throw new Error(
      'Invalid adaptive Endless lane streak state.',
    );
  }

  for (const [laneId, nextAttempt] of Object.entries(
    state.nextAttemptByLane,
  )) {
    if (
      laneId.length === 0 ||
      !isNonNegativeInteger(nextAttempt) ||
      nextAttempt >
        state.maxAttemptsPerLane
    ) {
      throw new Error(
        `Invalid adaptive Endless next attempt for lane ${laneId}.`,
      );
    }
  }
}

function sumAttemptCounts(
  attemptsByLane: Readonly<Record<string, number>>,
): number {
  return Object.values(attemptsByLane).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function sumBandCounts(
  counts: Readonly<EndlessBandCounts>,
): number {
  return (
    counts.easy +
    counts.medium +
    counts.hard +
    counts.expert
  );
}

function validateOptions(
  options: AdaptiveEndlessGenerationOptions,
): void {
  if (!isUint32(options.masterSeed)) {
    throw new RangeError(
      'Adaptive Endless masterSeed must be a uint32 integer.',
    );
  }
  if (
    !Number.isInteger(options.targetCount) ||
    options.targetCount <= 0 ||
    !isNonNegativeInteger(
      options.reservePercent,
    ) ||
    !isNonNegativeInteger(
      options.warmupAttemptsPerLane,
    ) ||
    !Number.isInteger(
      options.maxAttemptsPerLane,
    ) ||
    options.maxAttemptsPerLane <= 0 ||
    options.warmupAttemptsPerLane >
      options.maxAttemptsPerLane ||
    !Number.isInteger(options.chunkAttempts) ||
    options.chunkAttempts <= 0
  ) {
    throw new RangeError(
      'Invalid adaptive Endless generation options.',
    );
  }
  if (
    options.stopAfterChunks !== undefined &&
    !isNonNegativeInteger(
      options.stopAfterChunks,
    )
  ) {
    throw new RangeError(
      'Adaptive Endless stopAfterChunks must be a non-negative integer.',
    );
  }
}

function isUint32(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 0xffff_ffff
  );
}

function isNonNegativeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function directoryHasContent(
  rootDir: string,
): boolean {
  return (
    existsSync(rootDir) &&
    readdirSync(rootDir).length > 0
  );
}

function writeAtomicReplace(
  filePath: string,
  body: string,
): void {
  mkdirSync(dirname(filePath), {
    recursive: true,
  });
  const tempPath =
    `${filePath}.tmp-${process.pid}`;
  writeFileSync(tempPath, body, 'utf8');
  renameSync(tempPath, filePath);
}
