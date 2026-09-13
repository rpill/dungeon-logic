import {
  resolve,
} from 'node:path';
import {
  pathToFileURL,
} from 'node:url';

import {
  ENDLESS_TARGET_COUNT,
} from '../../content/endless/CatalogFormat';
import {
  buildCrossPoolFingerprints,
} from './CrossPoolFingerprints';
import {
  runEndlessGeneration,
} from './Generation';
import {
  buildAdaptiveSourceScanPlan,
  readAdaptiveGenerationState,
  runAdaptiveEndlessGeneration,
  type AdaptiveEndlessGenerationProgress,
} from './AdaptiveGeneration';
import {
  formatEndlessBandCounts,
  type EndlessBandDiversitySnapshot,
} from './AdaptiveScanPolicy';
import {
  packEndlessCatalog,
} from './Packer';
import {
  readEndlessSelection,
  readEndlessVerification,
  writeEndlessSelection,
  writeEndlessVerification,
} from './PipelineArtifacts';
import {
  formatEndlessProbeReport,
  runEndlessProbe,
} from './Probe';
import {
  buildEndlessProvenance,
} from './Provenance';
import {
  readGenerationState,
} from './ReservoirStore';
import {
  buildEndlessScanPlan,
} from './ScanPlan';
import {
  selectEndlessCatalog,
} from './Selector';
import {
  verifyEndlessSelection,
} from './Verifier';

const DEFAULT_MASTER_SEED = 20260913;
const DEFAULT_ROOT_DIR = '.generated/endless';
const DEFAULT_OUTPUT_DIR = 'public/content/endless';
const DEFAULT_CHUNK_ATTEMPTS = 500;
const DEFAULT_RESERVE_PERCENT = 15;
const DEFAULT_WARMUP_ATTEMPTS_PER_LANE = 100;
const DEFAULT_MAX_ATTEMPTS_PER_LANE = 2_000_000;

type EndlessCommand =
  | 'probe'
  | 'generate'
  | 'verify'
  | 'pack';

interface ParsedTokens {
  readonly values: ReadonlyMap<string, string>;
  readonly booleans: ReadonlySet<string>;
}

export interface EndlessCliHooks {
  readonly progress?: (line: string) => void;
}

export function runEndlessCli(
  args: readonly string[],
  hooks: EndlessCliHooks = {},
): string {
  const command = args[0] as EndlessCommand | undefined;
  const tokens = parseTokens(args.slice(1));

  switch (command) {
    case 'probe':
      assertAllowed(
        tokens,
        [
          '--master-seed',
          '--attempts-per-lane',
          '--target',
          '--reserve-percent',
        ],
        [],
      );
      return formatEndlessProbeReport(
        runEndlessProbe({
          masterSeed: readUint32(
            tokens.values,
            '--master-seed',
            DEFAULT_MASTER_SEED,
          ),
          attemptsPerLane: readInteger(
            tokens.values,
            '--attempts-per-lane',
            100,
            0,
          ),
          target: readInteger(
            tokens.values,
            '--target',
            ENDLESS_TARGET_COUNT,
            1,
          ),
          reservePercent: readInteger(
            tokens.values,
            '--reserve-percent',
            DEFAULT_RESERVE_PERCENT,
            0,
          ),
        }),
      );

    case 'generate': {
      assertAllowed(
        tokens,
        [
          '--master-seed',
          '--attempts-per-lane',
          '--chunk-attempts',
          '--target',
          '--root',
          '--reserve-percent',
          '--warmup-attempts-per-lane',
          '--max-attempts-per-lane',
        ],
        ['--resume'],
      );
      const rootDir = readPath(
        tokens.values,
        '--root',
        DEFAULT_ROOT_DIR,
      );
      const target = readInteger(
        tokens.values,
        '--target',
        ENDLESS_TARGET_COUNT,
        1,
      );
      const masterSeed = readUint32(
        tokens.values,
        '--master-seed',
        DEFAULT_MASTER_SEED,
      );
      const chunkAttempts = readInteger(
        tokens.values,
        '--chunk-attempts',
        DEFAULT_CHUNK_ATTEMPTS,
        1,
      );
      const resume =
        tokens.booleans.has('--resume');
      const uniformAttempts =
        tokens.values.get('--attempts-per-lane');

      let entries;
      let reservoirCount: number;
      let generationLines: string[];

      if (uniformAttempts !== undefined) {
        const report = runEndlessGeneration({
          rootDir,
          masterSeed,
          attemptsPerLane: parseInteger(
            uniformAttempts,
            '--attempts-per-lane',
            1,
          ),
          chunkAttempts,
          resume,
        });
        if (!report.completed) {
          throw new Error(
            'Endless uniform generation stopped before completing the requested scan.',
          );
        }
        entries = report.entries;
        reservoirCount = report.reservoirCount;
        generationLines = [
          'mode=uniform',
          `reservoir=${report.reservoirCount}`,
        ];
      } else {
        const report = runAdaptiveEndlessGeneration({
          rootDir,
          masterSeed,
          targetCount: target,
          reservePercent: readInteger(
            tokens.values,
            '--reserve-percent',
            DEFAULT_RESERVE_PERCENT,
            0,
          ),
          warmupAttemptsPerLane: readInteger(
            tokens.values,
            '--warmup-attempts-per-lane',
            DEFAULT_WARMUP_ATTEMPTS_PER_LANE,
            0,
          ),
          maxAttemptsPerLane: readInteger(
            tokens.values,
            '--max-attempts-per-lane',
            DEFAULT_MAX_ATTEMPTS_PER_LANE,
            1,
          ),
          chunkAttempts,
          resume,
          onProgress:
            hooks.progress === undefined
              ? undefined
              : (progress) =>
                  hooks.progress?.(
                    formatAdaptiveProgress(progress),
                  ),
        });
        if (!report.completed) {
          throw new Error(
            [
              'Adaptive Endless generation exhausted its scan budget before filling the reservoir.',
              `counts=${formatEndlessBandCounts(report.counts)}`,
              `targets=${formatEndlessBandCounts(report.targets)}`,
              'Resume with a larger --max-attempts-per-lane value.',
            ].join(' '),
          );
        }
        entries = report.entries;
        reservoirCount = report.reservoirCount;
        generationLines = [
          'mode=adaptive',
          `attempts=${report.totalAttempts}`,
          `reservoir=${report.reservoirCount}`,
          `bands=${formatEndlessBandCounts(report.counts)}`,
          `targets=${formatEndlessBandCounts(report.targets)}`,
        ];
      }

      let selection;
      try {
        selection = selectEndlessCatalog(
          entries,
          target,
        );
      } catch (error: unknown) {
        if (uniformAttempts === undefined) {
          throw new Error(
            `Adaptive Endless reservoir met its band targets but selector still exhausted. Resume with a larger --reserve-percent. ${String(error)}`,
          );
        }
        throw error;
      }
      const selectionPath = writeEndlessSelection(
        rootDir,
        selection,
      );
      return [
        'ENDLESS GENERATE',
        ...generationLines,
        `reservoirCount=${reservoirCount}`,
        `selected=${selection.length}`,
        `selection=${selectionPath}`,
      ].join('\n');
    }

    case 'verify': {
      assertAllowed(
        tokens,
        ['--target', '--root'],
        [],
      );
      const rootDir = readPath(
        tokens.values,
        '--root',
        DEFAULT_ROOT_DIR,
      );
      const target = readInteger(
        tokens.values,
        '--target',
        ENDLESS_TARGET_COUNT,
        1,
      );
      const selection = readEndlessSelection(
        rootDir,
      );
      if (selection.length !== target) {
        throw new Error(
          `Endless selection has ${selection.length} entries; expected ${target}.`,
        );
      }
      const report = verifyEndlessSelection(
        selection,
        buildCrossPoolFingerprints(),
      );
      const verificationPath =
        writeEndlessVerification(
          rootDir,
          report,
        );
      if (!report.ok) {
        const sample = report.failures
          .slice(0, 5)
          .map(
            (failure) =>
              `${failure.ordinal}:${failure.reason}`,
          )
          .join(', ');
        throw new Error(
          `Endless verification failed for ${report.rejectedVerificationCount} records (${sample}).`,
        );
      }
      return [
        'ENDLESS VERIFY',
        `verified=${report.verifiedCount}`,
        `rejected=${report.rejectedVerificationCount}`,
        `verification=${verificationPath}`,
      ].join('\n');
    }

    case 'pack': {
      assertAllowed(
        tokens,
        [
          '--target',
          '--root',
          '--output',
          '--project-root',
        ],
        [],
      );
      const rootDir = readPath(
        tokens.values,
        '--root',
        DEFAULT_ROOT_DIR,
      );
      const target = readInteger(
        tokens.values,
        '--target',
        ENDLESS_TARGET_COUNT,
        1,
      );
      const selection = readEndlessSelection(
        rootDir,
      );
      const verification = readEndlessVerification(
        rootDir,
      );
      const adaptiveState =
        readAdaptiveGenerationState(rootDir);
      const uniformState =
        readGenerationState(rootDir);
      if (
        adaptiveState !== null &&
        uniformState !== null
      ) {
        throw new Error(
          'Endless root contains both adaptive and uniform generation state.',
        );
      }
      if (
        adaptiveState === null &&
        uniformState === null
      ) {
        throw new Error(
          'Missing Endless generation state required for manifest provenance.',
        );
      }
      const sourceScanPlan =
        adaptiveState !== null
          ? buildAdaptiveSourceScanPlan(
              adaptiveState,
            )
          : buildEndlessScanPlan(
              uniformState!.masterSeed,
              uniformState!.attemptsPerLane,
            ).map((lane) => ({
              laneId: lane.id,
              archetype: lane.archetype,
              size: lane.size,
              startAttempt: lane.startAttempt,
              attemptCount: lane.attemptCount,
            }));
      const packed = packEndlessCatalog(
        selection,
        verification,
        {
          outputDir: readPath(
            tokens.values,
            '--output',
            DEFAULT_OUTPUT_DIR,
          ),
          targetCount: target,
          sourceScanPlan,
          provenance: buildEndlessProvenance(
            readPath(
              tokens.values,
              '--project-root',
              process.cwd(),
            ),
          ),
        },
      );
      return [
        'ENDLESS PACK',
        `entries=${packed.manifest.entryCount}`,
        `binary=${packed.binaryPath}`,
        `manifest=${packed.manifestPath}`,
        `sha256=${packed.manifest.productionAssetHash}`,
      ].join('\n');
    }

    default:
      throw new Error(
        'Usage: endless <probe|generate|verify|pack> [options]',
      );
  }
}

function formatAdaptiveProgress(
  progress: AdaptiveEndlessGenerationProgress,
): string {
  const filled =
    Math.min(progress.counts.easy, progress.targets.easy) +
    Math.min(progress.counts.medium, progress.targets.medium) +
    Math.min(progress.counts.hard, progress.targets.hard) +
    Math.min(progress.counts.expert, progress.targets.expert);
  const totalTarget =
    progress.targets.easy +
    progress.targets.medium +
    progress.targets.hard +
    progress.targets.expert;
  const percent = totalTarget === 0
    ? 100
    : Math.round((filled / totalTarget) * 1_000) / 10;

  const main = [
    'ENDLESS GENERATE PROGRESS',
    `filled=${filled}/${totalTarget} (${percent}%)`,
    `attempts=${progress.totalAttempts}`,
    `reservoir=${progress.reservoirCount}`,
    `bands=${formatEndlessBandCounts(progress.counts)}`,
    `lane=${progress.laneId}`,
    `laneAttempts=${progress.laneAttempts}`,
  ].join(' ');

  if (progress.chunksWritten % 10 !== 0) {
    return main;
  }

  return [
    main,
    `ENDLESS DIVERSITY hard ${formatDiversitySnapshot(progress.hardDiversity)}`,
    `ENDLESS DIVERSITY expert ${formatDiversitySnapshot(progress.expertDiversity)}`,
  ].join('\n');
}

function formatDiversitySnapshot(
  snapshot: EndlessBandDiversitySnapshot,
): string {
  return [
    `archetypes=${formatShareMap(snapshot.byArchetype)}`,
    `sizes=${formatShareMap(snapshot.bySize)}`,
    `lanes=${formatShareMap(snapshot.byLane, 5)}`,
  ].join(' ');
}

function formatShareMap(
  values: Readonly<Record<string, number>>,
  limit = Number.POSITIVE_INFINITY,
): string {
  const total = Object.values(values).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (total === 0) return '{}';

  const entries = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort((left, right) =>
      right[1] - left[1] ||
      left[0].localeCompare(right[0]),
    )
    .slice(0, limit)
    .map(([key, value]) => {
      const percent = Math.round(
        (value / total) * 1_000,
      ) / 10;
      return `${key}:${percent}%`;
    });
  return `{${entries.join(',')}}`;
}

function parseTokens(
  args: readonly string[],
): ParsedTokens {
  const values = new Map<string, string>();
  const booleans = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name.startsWith('--')) {
      throw new Error(
        `Unexpected Endless CLI argument ${name}.`,
      );
    }
    if (values.has(name) || booleans.has(name)) {
      throw new Error(
        `Duplicate Endless CLI option ${name}.`,
      );
    }

    const next = args[index + 1];
    if (next === undefined || next.startsWith('--')) {
      booleans.add(name);
      continue;
    }
    values.set(name, next);
    index += 1;
  }

  return { values, booleans };
}

function assertAllowed(
  tokens: ParsedTokens,
  valueNames: readonly string[],
  booleanNames: readonly string[],
): void {
  for (const name of tokens.values.keys()) {
    if (!valueNames.includes(name)) {
      throw new Error(
        `Unknown Endless CLI option ${name}.`,
      );
    }
  }
  for (const name of tokens.booleans) {
    if (!booleanNames.includes(name)) {
      throw new Error(
        `Unknown or valueless Endless CLI option ${name}.`,
      );
    }
  }
}

function readUint32(
  values: ReadonlyMap<string, string>,
  name: string,
  fallback: number,
): number {
  const value = readInteger(
    values,
    name,
    fallback,
    0,
  );
  if (value > 0xffff_ffff) {
    throw new RangeError(
      `${name} must be <= 4294967295.`,
    );
  }
  return value;
}

function readInteger(
  values: ReadonlyMap<string, string>,
  name: string,
  fallback: number,
  minimum: number,
): number {
  const raw = values.get(name);
  return raw === undefined
    ? fallback
    : parseInteger(raw, name, minimum);
}

function parseInteger(
  raw: string,
  name: string,
  minimum: number,
): number {
  if (!/^\d+$/.test(raw)) {
    throw new RangeError(
      `${name} must be an integer >= ${minimum}.`,
    );
  }
  const value = Number(raw);
  if (
    !Number.isSafeInteger(value) ||
    value < minimum
  ) {
    throw new RangeError(
      `${name} must be an integer >= ${minimum}.`,
    );
  }
  return value;
}

function readPath(
  values: ReadonlyMap<string, string>,
  name: string,
  fallback: string,
): string {
  const raw = values.get(name) ?? fallback;
  if (raw.trim().length === 0) {
    throw new Error(`${name} cannot be empty.`);
  }
  return resolve(raw);
}

function isMainModule(): boolean {
  const entryPath = process.argv[1];
  if (entryPath === undefined) return false;
  return import.meta.url === pathToFileURL(entryPath).href;
}

function main(): void {
  try {
    console.info(
      runEndlessCli(
        process.argv.slice(2),
        {
          progress: (line) => console.info(line),
        },
      ),
    );
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  }
}

if (isMainModule()) {
  main();
}
