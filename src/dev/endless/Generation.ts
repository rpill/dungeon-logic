import {
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';

import {
  buildCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  readGenerationState,
  readReservoirChunks,
  readReservoirCoverage,
  writeGenerationState,
  writeReservoirChunk,
  type EndlessGenerationState,
} from './ReservoirStore';
import {
  scanEndlessLane,
} from './ReservoirScanner';
import {
  buildEndlessScanPlan,
} from './ScanPlan';
import type {
  EndlessReservoirEntry,
} from './types';

export interface EndlessGenerationOptions {
  readonly rootDir: string;
  readonly masterSeed: number;
  readonly attemptsPerLane: number;
  readonly chunkAttempts: number;
  readonly resume: boolean;
  readonly stopAfterChunks?: number;
}

export interface EndlessGenerationReport {
  readonly completed: boolean;
  readonly chunksWritten: number;
  readonly attemptsProcessed: number;
  readonly reservoirCount: number;
  readonly entries: readonly EndlessReservoirEntry[];
}

export function runEndlessGeneration(
  options: EndlessGenerationOptions,
): EndlessGenerationReport {
  validateOptions(options);

  if (
    !options.resume &&
    directoryHasContent(options.rootDir)
  ) {
    throw new Error(
      `Endless generation root ${options.rootDir} is not empty. Remove it or use --resume.`,
    );
  }

  mkdirSync(options.rootDir, {
    recursive: true,
  });

  const plan = buildEndlessScanPlan(
    options.masterSeed,
    options.attemptsPerLane,
  );
  const crossPool = buildCrossPoolFingerprints();
  const existing = readReservoirChunks(
    options.rootDir,
  );
  const seenCandidateIds = new Set<string>();
  const seenStructuralFingerprints = new Set<string>();

  for (const entry of existing) {
    if (seenCandidateIds.has(entry.candidateId)) {
      throw new Error(
        `Duplicate candidate ID in resumed Endless reservoir: ${entry.candidateId}.`,
      );
    }
    if (
      seenStructuralFingerprints.has(
        entry.structuralFingerprint,
      )
    ) {
      throw new Error(
        `Duplicate structural fingerprint in resumed Endless reservoir: ${entry.candidateId}.`,
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
        `Cross-pool collision in resumed Endless reservoir: ${entry.candidateId}.`,
      );
    }
    seenCandidateIds.add(entry.candidateId);
    seenStructuralFingerprints.add(
      entry.structuralFingerprint,
    );
  }

  let state = resolveInitialState(
    options,
    plan.map((lane) => lane.id),
  );
  if (options.resume) {
    state = reconcileStateWithReservoirCoverage(
      options,
      plan,
      state,
    );
  }
  let chunksWritten = 0;
  let attemptsProcessed = 0;

  for (const lane of plan) {
    let nextAttempt =
      state.nextAttemptByLane[lane.id] ?? 0;

    while (
      nextAttempt < options.attemptsPerLane
    ) {
      if (
        options.stopAfterChunks !== undefined &&
        chunksWritten >= options.stopAfterChunks
      ) {
        return buildReport(
          options.rootDir,
          false,
          chunksWritten,
          attemptsProcessed,
        );
      }

      const attemptCount = Math.min(
        options.chunkAttempts,
        options.attemptsPerLane - nextAttempt,
      );
      const chunkLane = {
        ...lane,
        startAttempt: nextAttempt,
        attemptCount,
      };
      const result = scanEndlessLane({
        masterSeed: options.masterSeed,
        lane: chunkLane,
        crossPool,
        seenCandidateIds,
        seenStructuralFingerprints,
      });

      writeReservoirChunk({
        rootDir: options.rootDir,
        laneIndex: lane.index,
        startAttempt: nextAttempt,
        endAttemptExclusive:
          nextAttempt + attemptCount,
        entries: result.accepted,
      });

      nextAttempt += attemptCount;
      attemptsProcessed += attemptCount;
      chunksWritten += 1;
      state = {
        ...state,
        nextAttemptByLane: {
          ...state.nextAttemptByLane,
          [lane.id]: nextAttempt,
        },
      };
      writeGenerationState(
        options.rootDir,
        state,
      );
    }
  }

  return buildReport(
    options.rootDir,
    true,
    chunksWritten,
    attemptsProcessed,
  );
}

function resolveInitialState(
  options: EndlessGenerationOptions,
  laneIds: readonly string[],
): EndlessGenerationState {
  const existing = readGenerationState(
    options.rootDir,
  );

  if (options.resume) {
    if (existing === null) {
      throw new Error(
        'Cannot resume Endless generation without generation-state.json.',
      );
    }
    if (
      existing.masterSeed !==
        (options.masterSeed >>> 0)
    ) {
      throw new Error(
        'Endless resume master seed does not match generation-state.json.',
      );
    }
    if (
      options.attemptsPerLane <
      existing.attemptsPerLane
    ) {
      throw new Error(
        `Endless resume cannot reduce attemptsPerLane from ${existing.attemptsPerLane} to ${options.attemptsPerLane}.`,
      );
    }
    for (const laneId of laneIds) {
      if (
        existing.nextAttemptByLane[laneId] ===
        undefined
      ) {
        throw new Error(
          `Endless generation state is missing lane ${laneId}.`,
        );
      }
    }
    if (
      options.attemptsPerLane >
      existing.attemptsPerLane
    ) {
      const extended: EndlessGenerationState = {
        ...existing,
        attemptsPerLane:
          options.attemptsPerLane,
      };
      writeGenerationState(
        options.rootDir,
        extended,
      );
      return extended;
    }
    return existing;
  }

  const state: EndlessGenerationState = {
    version: 1,
    masterSeed: options.masterSeed >>> 0,
    attemptsPerLane: options.attemptsPerLane,
    nextAttemptByLane: Object.fromEntries(
      laneIds.map((laneId) => [laneId, 0]),
    ),
  };
  writeGenerationState(
    options.rootDir,
    state,
  );
  return state;
}

function reconcileStateWithReservoirCoverage(
  options: EndlessGenerationOptions,
  plan: readonly ReturnType<typeof buildEndlessScanPlan>[number][],
  state: EndlessGenerationState,
): EndlessGenerationState {
  const coverage = readReservoirCoverage(
    options.rootDir,
  );
  const nextAttemptByLane = {
    ...state.nextAttemptByLane,
  };
  let changed = false;

  for (const [laneIndex, coveredUntil] of coverage) {
    const lane = plan[laneIndex];
    if (lane === undefined) {
      throw new Error(
        `Endless reservoir contains unknown lane index ${laneIndex}.`,
      );
    }
    if (coveredUntil > options.attemptsPerLane) {
      throw new Error(
        `Endless reservoir coverage for ${lane.id} exceeds attemptsPerLane (${coveredUntil} > ${options.attemptsPerLane}).`,
      );
    }
    const stateNext = nextAttemptByLane[lane.id];
    if (stateNext === undefined) {
      throw new Error(
        `Endless generation state is missing lane ${lane.id}.`,
      );
    }
    if (stateNext > coveredUntil) {
      throw new Error(
        `Endless generation state for ${lane.id} is ahead of persisted reservoir coverage (${stateNext} > ${coveredUntil}).`,
      );
    }
    if (coveredUntil > stateNext) {
      nextAttemptByLane[lane.id] = coveredUntil;
      changed = true;
    }
  }

  if (!changed) return state;
  const reconciled: EndlessGenerationState = {
    ...state,
    nextAttemptByLane,
  };
  writeGenerationState(
    options.rootDir,
    reconciled,
  );
  return reconciled;
}

function buildReport(
  rootDir: string,
  completed: boolean,
  chunksWritten: number,
  attemptsProcessed: number,
): EndlessGenerationReport {
  const entries = readReservoirChunks(rootDir);
  return {
    completed,
    chunksWritten,
    attemptsProcessed,
    reservoirCount: entries.length,
    entries,
  };
}

function validateOptions(
  options: EndlessGenerationOptions,
): void {
  if (!Number.isInteger(options.masterSeed)) {
    throw new TypeError(
      'Endless master seed must be an integer.',
    );
  }
  if (
    !Number.isInteger(options.attemptsPerLane) ||
    options.attemptsPerLane < 0 ||
    !Number.isInteger(options.chunkAttempts) ||
    options.chunkAttempts <= 0
  ) {
    throw new RangeError(
      'Endless generation attempts must be valid non-negative integers and chunkAttempts must be positive.',
    );
  }
  if (
    options.stopAfterChunks !== undefined &&
    (!Number.isInteger(options.stopAfterChunks) ||
      options.stopAfterChunks < 0)
  ) {
    throw new RangeError(
      'Endless stopAfterChunks must be a non-negative integer.',
    );
  }
}

function directoryHasContent(
  rootDir: string,
): boolean {
  return (
    existsSync(rootDir) &&
    readdirSync(rootDir).length > 0
  );
}
