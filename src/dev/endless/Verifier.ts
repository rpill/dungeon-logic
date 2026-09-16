import {
  fork,
} from 'node:child_process';
import type {
  ChildProcess,
} from 'node:child_process';
import {
  fileURLToPath,
} from 'node:url';

import type {
  EndlessCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  readEndlessVerificationCheckpoint,
  removeEndlessVerificationCheckpoint,
  writeEndlessVerificationCheckpoint,
} from './PipelineArtifacts';
import {
  hashEndlessSelection,
} from './SelectionHash';
import {
  verifyEndlessSelectionEntry,
} from './VerifierEntry';
import type {
  EndlessSelectionRecord,
  EndlessVerificationCheckpoint,
  EndlessVerificationCheckpointChunk,
  EndlessVerificationFailure,
  EndlessVerificationReport,
} from './types';

const VERIFY_CHUNK_SIZE = 100;
const VERIFY_PROGRESS_STEP = 500;

interface GlobalVerificationSummary {
  readonly failuresByOrdinal: ReadonlyMap<number, readonly EndlessVerificationFailure[]>;
  readonly duplicateCount: number;
  readonly campaignCollisionCount: number;
  readonly dailyCollisionCount: number;
}

interface VerifyWorkerSuccess {
  readonly chunkIndex: number;
  readonly failures: readonly EndlessVerificationFailure[];
}

interface VerifyWorkerFailure {
  readonly chunkIndex: number;
  readonly error: string;
}

export interface EndlessParallelVerificationOptions {
  readonly rootDir: string;
  readonly jobs: number;
  readonly resume: boolean;
  readonly progress?: (line: string) => void;
}

export function verifyEndlessSelection(
  entries: readonly EndlessSelectionRecord[],
  crossPool: EndlessCrossPoolFingerprints,
): EndlessVerificationReport {
  const global = collectGlobalVerification(
    entries,
    crossPool,
  );
  const deepFailuresByOrdinal =
    new Map<number, readonly EndlessVerificationFailure[]>();

  for (const entry of entries) {
    deepFailuresByOrdinal.set(
      entry.ordinal,
      verifyEndlessSelectionEntry(entry),
    );
  }

  return buildVerificationReport(
    entries,
    global,
    deepFailuresByOrdinal,
  );
}

export async function verifyEndlessSelectionParallel(
  entries: readonly EndlessSelectionRecord[],
  crossPool: EndlessCrossPoolFingerprints,
  options: EndlessParallelVerificationOptions,
): Promise<EndlessVerificationReport> {
  if (
    !Number.isInteger(options.jobs) ||
    options.jobs < 1
  ) {
    throw new RangeError(
      'Endless verifier jobs must be an integer >= 1.',
    );
  }

  const selectionHash = hashEndlessSelection(entries);
  const global = collectGlobalVerification(
    entries,
    crossPool,
  );
  const chunks = buildVerificationChunks(entries);
  const completed = loadVerificationCheckpoint(
    options.rootDir,
    selectionHash,
    entries.length,
    chunks.length,
    options.resume,
  );

  writeCheckpoint(
    options.rootDir,
    selectionHash,
    entries.length,
    completed,
  );

  let processed = countCompletedEntries(
    completed,
    entries.length,
  );
  let nextProgress =
    Math.floor(processed / VERIFY_PROGRESS_STEP + 1) *
    VERIFY_PROGRESS_STEP;

  if (processed > 0) {
    options.progress?.(
      formatVerifyProgress(
        processed,
        entries.length,
        options.jobs,
        true,
      ),
    );
  }

  const pending = chunks
    .map((chunk, chunkIndex) => ({
      chunk,
      chunkIndex,
    }))
    .filter(({ chunkIndex }) =>
      !completed.has(chunkIndex),
    );

  if (pending.length > 0) {
    const workerCount = Math.min(
      options.jobs,
      pending.length,
    );
    const workers: ChildProcess[] = [];
    let queueIndex = 0;
    let remaining = pending.length;
    let settled = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const rejectOnce = (error: unknown): void => {
          if (settled) return;
          settled = true;
          reject(error);
        };

        const maybeResolve = (): void => {
          if (!settled && remaining === 0) {
            settled = true;
            resolve();
          }
        };

        const dispatch = (worker: ChildProcess): void => {
          const next = pending[queueIndex];
          if (next === undefined) {
            maybeResolve();
            return;
          }
          queueIndex += 1;
          if (!worker.connected) {
            rejectOnce(
              new Error(
                'Endless verifier child process disconnected before dispatch.',
              ),
            );
            return;
          }
          worker.send({
            chunkIndex: next.chunkIndex,
            entries: next.chunk,
          });
        };

        for (
          let workerIndex = 0;
          workerIndex < workerCount;
          workerIndex += 1
        ) {
          const worker = fork(
            fileURLToPath(
              new URL('./VerifierWorker.ts', import.meta.url),
            ),
            [],
            {
              execArgv: ['--import', 'tsx'],
              stdio: [
                'ignore',
                'inherit',
                'inherit',
                'ipc',
              ],
            },
          );
          workers.push(worker);

          worker.on(
            'message',
            (message: unknown) => {
              const typedMessage = message as
                | VerifyWorkerSuccess
                | VerifyWorkerFailure;
              if (settled) return;
              if ('error' in typedMessage) {
                rejectOnce(
                  new Error(
                    `Endless verifier child failed for chunk ${typedMessage.chunkIndex}: ${typedMessage.error}`,
                  ),
                );
                return;
              }

              const expected = chunks[typedMessage.chunkIndex];
              if (expected === undefined) {
                rejectOnce(
                  new Error(
                    `Endless verifier child returned unknown chunk ${typedMessage.chunkIndex}.`,
                  ),
                );
                return;
              }
              if (completed.has(typedMessage.chunkIndex)) {
                rejectOnce(
                  new Error(
                    `Endless verifier child returned duplicate chunk ${typedMessage.chunkIndex}.`,
                  ),
                );
                return;
              }

              completed.set(
                typedMessage.chunkIndex,
                typedMessage.failures,
              );
              remaining -= 1;
              processed += expected.length;

              writeCheckpoint(
                options.rootDir,
                selectionHash,
                entries.length,
                completed,
              );

              if (
                processed >= nextProgress ||
                processed === entries.length
              ) {
                options.progress?.(
                  formatVerifyProgress(
                    processed,
                    entries.length,
                    options.jobs,
                    false,
                  ),
                );
                while (nextProgress <= processed) {
                  nextProgress += VERIFY_PROGRESS_STEP;
                }
              }

              dispatch(worker);
              maybeResolve();
            },
          );
          worker.on('error', rejectOnce);
          worker.on('exit', (code, signal) => {
            if (!settled && remaining > 0) {
              rejectOnce(
                new Error(
                  `Endless verifier child exited before completion (code=${code ?? 'null'}, signal=${signal ?? 'none'}).`,
                ),
              );
            }
          });

          dispatch(worker);
        }
      });
    } finally {
      await Promise.all(
        workers.map(async (worker) => {
          try {
            if (worker.connected) {
              worker.disconnect();
            }
            if (worker.exitCode === null) {
              worker.kill();
            }
          } catch {
            // Best-effort cleanup after success/failure.
          }
        }),
      );
    }
  }

  const deepFailuresByOrdinal =
    new Map<number, EndlessVerificationFailure[]>();
  for (const [chunkIndex, failures] of completed) {
    if (chunks[chunkIndex] === undefined) continue;
    for (const failure of failures) {
      const list =
        deepFailuresByOrdinal.get(failure.ordinal) ?? [];
      list.push(failure);
      deepFailuresByOrdinal.set(
        failure.ordinal,
        list,
      );
    }
  }

  if (completed.size !== chunks.length) {
    throw new Error(
      `Endless verification checkpoint is incomplete (${completed.size}/${chunks.length} chunks).`,
    );
  }

  const report = buildVerificationReport(
    entries,
    global,
    deepFailuresByOrdinal,
  );
  removeEndlessVerificationCheckpoint(
    options.rootDir,
  );
  return report;
}

function collectGlobalVerification(
  entries: readonly EndlessSelectionRecord[],
  crossPool: EndlessCrossPoolFingerprints,
): GlobalVerificationSummary {
  const failuresByOrdinal =
    new Map<number, EndlessVerificationFailure[]>();
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  let duplicateCount = 0;
  let campaignCollisionCount = 0;
  let dailyCollisionCount = 0;

  const fail = (
    entry: EndlessSelectionRecord,
    reason: string,
  ): void => {
    const failures =
      failuresByOrdinal.get(entry.ordinal) ?? [];
    failures.push({
      ordinal: entry.ordinal,
      candidateId: entry.candidateId,
      reason,
    });
    failuresByOrdinal.set(
      entry.ordinal,
      failures,
    );
  };

  for (const entry of entries) {
    if (seenIds.has(entry.candidateId)) {
      duplicateCount += 1;
      fail(entry, 'duplicate-candidate-id');
    } else {
      seenIds.add(entry.candidateId);
    }

    if (
      seenFingerprints.has(
        entry.structuralFingerprint,
      )
    ) {
      duplicateCount += 1;
      fail(entry, 'duplicate-structural-fingerprint');
    } else {
      seenFingerprints.add(
        entry.structuralFingerprint,
      );
    }

    if (
      crossPool.campaign.has(
        entry.structuralFingerprint,
      )
    ) {
      campaignCollisionCount += 1;
      fail(entry, 'campaign-collision');
    }
    if (
      crossPool.daily.has(
        entry.structuralFingerprint,
      )
    ) {
      dailyCollisionCount += 1;
      fail(entry, 'daily-collision');
    }
  }

  return {
    failuresByOrdinal,
    duplicateCount,
    campaignCollisionCount,
    dailyCollisionCount,
  };
}

function buildVerificationReport(
  entries: readonly EndlessSelectionRecord[],
  global: GlobalVerificationSummary,
  deepFailuresByOrdinal: ReadonlyMap<
    number,
    readonly EndlessVerificationFailure[]
  >,
): EndlessVerificationReport {
  const failures: EndlessVerificationFailure[] = [];
  let verifiedCount = 0;

  for (const entry of entries) {
    const entryFailures = [
      ...(global.failuresByOrdinal.get(
        entry.ordinal,
      ) ?? []),
      ...(deepFailuresByOrdinal.get(
        entry.ordinal,
      ) ?? []),
    ];
    failures.push(...entryFailures);
    if (entryFailures.length === 0) {
      verifiedCount += 1;
    }
  }

  const rejectedVerificationCount =
    entries.length - verifiedCount;

  return {
    selectionHash: hashEndlessSelection(entries),
    ok:
      rejectedVerificationCount === 0 &&
      global.duplicateCount === 0 &&
      global.campaignCollisionCount === 0 &&
      global.dailyCollisionCount === 0,
    verifiedCount,
    rejectedVerificationCount,
    duplicateCount: global.duplicateCount,
    campaignCollisionCount:
      global.campaignCollisionCount,
    dailyCollisionCount:
      global.dailyCollisionCount,
    failures,
  };
}

function buildVerificationChunks(
  entries: readonly EndlessSelectionRecord[],
): readonly (readonly EndlessSelectionRecord[])[] {
  const chunks: EndlessSelectionRecord[][] = [];
  for (
    let start = 0;
    start < entries.length;
    start += VERIFY_CHUNK_SIZE
  ) {
    chunks.push(
      entries.slice(
        start,
        Math.min(
          start + VERIFY_CHUNK_SIZE,
          entries.length,
        ),
      ),
    );
  }
  return chunks;
}

function loadVerificationCheckpoint(
  rootDir: string,
  selectionHash: string,
  entryCount: number,
  chunkCount: number,
  resume: boolean,
): Map<number, readonly EndlessVerificationFailure[]> {
  if (!resume) {
    removeEndlessVerificationCheckpoint(rootDir);
    return new Map();
  }

  const checkpoint =
    readEndlessVerificationCheckpoint(rootDir);
  if (checkpoint === null) return new Map();

  if (
    checkpoint.selectionHash !== selectionHash ||
    checkpoint.entryCount !== entryCount ||
    checkpoint.chunkSize !== VERIFY_CHUNK_SIZE
  ) {
    throw new Error(
      'Endless verification checkpoint does not match the current selection. Run without --resume to start a fresh verification.',
    );
  }

  const completed =
    new Map<number, readonly EndlessVerificationFailure[]>();
  for (const chunk of checkpoint.completed) {
    if (
      chunk.chunkIndex < 0 ||
      chunk.chunkIndex >= chunkCount ||
      completed.has(chunk.chunkIndex)
    ) {
      throw new Error(
        `Invalid Endless verification checkpoint chunk ${chunk.chunkIndex}.`,
      );
    }
    completed.set(
      chunk.chunkIndex,
      chunk.failures,
    );
  }
  return completed;
}

function writeCheckpoint(
  rootDir: string,
  selectionHash: string,
  entryCount: number,
  completed: ReadonlyMap<
    number,
    readonly EndlessVerificationFailure[]
  >,
): void {
  const completedChunks: EndlessVerificationCheckpointChunk[] =
    [...completed.entries()]
      .sort(([left], [right]) => left - right)
      .map(([chunkIndex, failures]) => ({
        chunkIndex,
        failures,
      }));
  const checkpoint: EndlessVerificationCheckpoint = {
    version: 1,
    selectionHash,
    entryCount,
    chunkSize: VERIFY_CHUNK_SIZE,
    completed: completedChunks,
  };
  writeEndlessVerificationCheckpoint(
    rootDir,
    checkpoint,
  );
}

function countCompletedEntries(
  completed: ReadonlyMap<number, readonly EndlessVerificationFailure[]>,
  entryCount: number,
): number {
  let count = 0;
  const lastChunkIndex = Math.max(
    0,
    Math.ceil(entryCount / VERIFY_CHUNK_SIZE) - 1,
  );
  for (const chunkIndex of completed.keys()) {
    const start = chunkIndex * VERIFY_CHUNK_SIZE;
    if (chunkIndex === lastChunkIndex) {
      count += Math.max(0, entryCount - start);
    } else {
      count += VERIFY_CHUNK_SIZE;
    }
  }
  return Math.min(count, entryCount);
}

function formatVerifyProgress(
  processed: number,
  total: number,
  jobs: number,
  resumed: boolean,
): string {
  const percent = total === 0
    ? 100
    : Math.round((processed / total) * 1_000) / 10;
  return [
    'ENDLESS VERIFY PROGRESS',
    `processed=${processed}/${total} (${percent}%)`,
    `jobs=${jobs}`,
    resumed ? 'resumed=true' : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' ');
}
