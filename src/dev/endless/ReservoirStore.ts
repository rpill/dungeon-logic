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

import {
  DifficultyBand,
} from '../../puzzle/difficulty/types';
import {
  ALL_GENERATOR_ARCHETYPES,
} from '../../puzzle/generator/types';
import type {
  EndlessReservoirEntry,
} from './types';

export interface EndlessGenerationState {
  readonly version: 1;
  readonly masterSeed: number;
  readonly attemptsPerLane: number;
  readonly nextAttemptByLane: Readonly<Record<string, number>>;
}

export interface WriteReservoirChunkOptions {
  readonly rootDir: string;
  readonly laneIndex: number;
  readonly startAttempt: number;
  readonly endAttemptExclusive: number;
  readonly entries: readonly EndlessReservoirEntry[];
}

export function writeReservoirChunk(
  options: WriteReservoirChunkOptions,
): string {
  validateChunkRange(options);
  const laneDir = join(
    options.rootDir,
    'reservoir',
    `lane-${pad(options.laneIndex, 2)}`,
  );
  mkdirSync(laneDir, { recursive: true });

  const filePath = join(
    laneDir,
    `chunk-${pad(options.startAttempt, 9)}-${pad(options.endAttemptExclusive - 1, 9)}.jsonl`,
  );
  const body = options.entries
    .map(serializeReservoirEntry)
    .join('\n') + (options.entries.length === 0 ? '' : '\n');

  writeAtomicStable(filePath, body);
  return filePath;
}

export function readReservoirCoverage(
  rootDir: string,
): ReadonlyMap<number, number> {
  const reservoirDir = join(rootDir, 'reservoir');
  if (!existsSync(reservoirDir)) return new Map();

  const coverage = new Map<number, number>();
  const laneDirs = readdirSync(
    reservoirDir,
    { withFileTypes: true },
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const laneDirName of laneDirs) {
    const laneMatch = /^lane-(\d+)$/.exec(laneDirName);
    if (laneMatch === null) {
      throw new Error(
        `Invalid Endless reservoir lane directory ${laneDirName}.`,
      );
    }
    const laneIndex = Number(laneMatch[1]);
    const laneDir = join(reservoirDir, laneDirName);
    const ranges = readdirSync(laneDir)
      .filter((name) => name.endsWith('.jsonl'))
      .map((fileName) => {
        const match = /^chunk-(\d+)-(\d+)\.jsonl$/.exec(fileName);
        if (match === null) {
          throw new Error(
            `Invalid Endless reservoir chunk name ${fileName}.`,
          );
        }
        const start = Number(match[1]);
        const endExclusive = Number(match[2]) + 1;
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(endExclusive) ||
          start < 0 ||
          endExclusive <= start
        ) {
          throw new Error(
            `Invalid Endless reservoir chunk range ${fileName}.`,
          );
        }
        return { start, endExclusive, fileName };
      })
      .sort(
        (left, right) =>
          left.start - right.start ||
          left.endExclusive - right.endExclusive ||
          left.fileName.localeCompare(right.fileName),
      );

    let nextAttempt = 0;
    for (const range of ranges) {
      if (range.start !== nextAttempt) {
        throw new Error(
          `Non-contiguous Endless reservoir coverage for lane ${laneIndex}: expected chunk at ${nextAttempt}, got ${range.start}.`,
        );
      }
      nextAttempt = range.endExclusive;
    }
    if (ranges.length > 0) {
      coverage.set(laneIndex, nextAttempt);
    }
  }

  return coverage;
}

export function readReservoirChunks(
  rootDir: string,
): readonly EndlessReservoirEntry[] {
  const reservoirDir = join(rootDir, 'reservoir');
  if (!existsSync(reservoirDir)) return [];

  const entries: EndlessReservoirEntry[] = [];
  const seenProvenance = new Set<string>();

  const laneDirs = readdirSync(
    reservoirDir,
    { withFileTypes: true },
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const laneDirName of laneDirs) {
    const laneDir = join(reservoirDir, laneDirName);
    const files = readdirSync(laneDir)
      .filter((name) => name.endsWith('.jsonl'))
      .sort();

    for (const fileName of files) {
      const text = readFileSync(
        join(laneDir, fileName),
        'utf8',
      );
      const lines = text
        .split(/\r?\n/)
        .filter((line) => line.length > 0);

      for (const line of lines) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch (error: unknown) {
          throw new Error(
            `Malformed Endless reservoir JSON in ${fileName}: ${String(error)}`,
          );
        }

        const entry = parseReservoirEntry(parsed);
        const provenance = `${entry.laneId}:${entry.attempt}`;
        if (seenProvenance.has(provenance)) {
          throw new Error(
            `Duplicate Endless reservoir provenance ${provenance}.`,
          );
        }
        seenProvenance.add(provenance);
        entries.push(entry);
      }
    }
  }

  entries.sort(compareReservoirEntry);
  return entries;
}

export function writeGenerationState(
  rootDir: string,
  state: EndlessGenerationState,
): string {
  validateGenerationState(state);
  const filePath = join(
    rootDir,
    'generation-state.json',
  );
  const stableState: EndlessGenerationState = {
    version: 1,
    masterSeed: state.masterSeed >>> 0,
    attemptsPerLane: state.attemptsPerLane,
    nextAttemptByLane: Object.fromEntries(
      Object.entries(state.nextAttemptByLane)
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
  writeAtomicReplace(
    filePath,
    `${JSON.stringify(stableState, null, 2)}\n`,
  );
  return filePath;
}

export function readGenerationState(
  rootDir: string,
): EndlessGenerationState | null {
  const filePath = join(
    rootDir,
    'generation-state.json',
  );
  if (!existsSync(filePath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(
      readFileSync(filePath, 'utf8'),
    );
  } catch (error: unknown) {
    throw new Error(
      `Malformed Endless generation state: ${String(error)}`,
    );
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null
  ) {
    throw new Error(
      'Endless generation state must be an object.',
    );
  }

  const candidate = parsed as Partial<EndlessGenerationState>;
  const state: EndlessGenerationState = {
    version: candidate.version as 1,
    masterSeed: candidate.masterSeed as number,
    attemptsPerLane: candidate.attemptsPerLane as number,
    nextAttemptByLane:
      candidate.nextAttemptByLane as Readonly<Record<string, number>>,
  };
  validateGenerationState(state);
  return state;
}

function serializeReservoirEntry(
  entry: EndlessReservoirEntry,
): string {
  return JSON.stringify({
    laneIndex: entry.laneIndex,
    laneId: entry.laneId,
    attempt: entry.attempt,
    seed: entry.seed,
    candidateId: entry.candidateId,
    archetype: entry.archetype,
    size: entry.size,
    difficultyScore: entry.difficultyScore,
    difficultyBand: entry.difficultyBand,
    qualityScore: entry.qualityScore,
    structuralFingerprint: entry.structuralFingerprint,
    diversity: entry.diversity,
  });
}

function parseReservoirEntry(
  value: unknown,
): EndlessReservoirEntry {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    throw new Error(
      'Endless reservoir entry must be an object.',
    );
  }

  const entry = value as Record<string, unknown>;
  const archetype = entry.archetype;
  const difficultyBand = entry.difficultyBand;
  const size = entry.size;

  if (
    typeof entry.laneIndex !== 'number' ||
    !Number.isInteger(entry.laneIndex) ||
    entry.laneIndex < 0 ||
    typeof entry.laneId !== 'string' ||
    typeof entry.attempt !== 'number' ||
    !Number.isInteger(entry.attempt) ||
    entry.attempt < 0 ||
    typeof entry.seed !== 'number' ||
    !Number.isInteger(entry.seed) ||
    entry.seed < 0 ||
    entry.seed > 0xffff_ffff ||
    typeof entry.candidateId !== 'string' ||
    !ALL_GENERATOR_ARCHETYPES.includes(
      archetype as never,
    ) ||
    (size !== 6 && size !== 7 && size !== 8) ||
    typeof entry.difficultyScore !== 'number' ||
    !Number.isInteger(entry.difficultyScore) ||
    entry.difficultyScore < 0 ||
    entry.difficultyScore > 100 ||
    ![
      DifficultyBand.Easy,
      DifficultyBand.Medium,
      DifficultyBand.Hard,
      DifficultyBand.Expert,
    ].includes(difficultyBand as never) ||
    typeof entry.qualityScore !== 'number' ||
    !Number.isFinite(entry.qualityScore) ||
    typeof entry.structuralFingerprint !== 'string' ||
    !isDiversitySignature(entry.diversity)
  ) {
    throw new Error(
      'Invalid Endless reservoir entry schema.',
    );
  }

  return value as EndlessReservoirEntry;
}

function isDiversitySignature(
  value: unknown,
): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const signature = value as Record<string, unknown>;
  const size = signature.size;
  return (
    (size === 6 || size === 7 || size === 8) &&
    typeof signature.wallDensity === 'number' &&
    Number.isFinite(signature.wallDensity) &&
    typeof signature.thickWallCellRatio === 'number' &&
    Number.isFinite(signature.thickWallCellRatio) &&
    typeof signature.wallOpenBoundaryPerWall === 'number' &&
    Number.isFinite(signature.wallOpenBoundaryPerWall) &&
    typeof signature.largestWallComponentRatio === 'number' &&
    Number.isFinite(signature.largestWallComponentRatio) &&
    typeof signature.monsterCount === 'number' &&
    Number.isInteger(signature.monsterCount) &&
    signature.monsterCount >= 0 &&
    Array.isArray(signature.solution) &&
    signature.solution.length === size &&
    signature.solution.every(
      (row) => typeof row === 'string' && row.length === size,
    ) &&
    Array.isArray(signature.rooms)
  );
}

function validateChunkRange(
  options: WriteReservoirChunkOptions,
): void {
  if (
    !Number.isInteger(options.laneIndex) ||
    options.laneIndex < 0 ||
    !Number.isInteger(options.startAttempt) ||
    options.startAttempt < 0 ||
    !Number.isInteger(options.endAttemptExclusive) ||
    options.endAttemptExclusive <= options.startAttempt
  ) {
    throw new RangeError(
      'Invalid Endless reservoir chunk range.',
    );
  }

  for (const entry of options.entries) {
    if (
      entry.laneIndex !== options.laneIndex ||
      entry.attempt < options.startAttempt ||
      entry.attempt >= options.endAttemptExclusive
    ) {
      throw new Error(
        `Endless reservoir entry ${entry.candidateId} falls outside its chunk provenance.`,
      );
    }
  }
}

function validateGenerationState(
  state: EndlessGenerationState,
): void {
  if (
    state.version !== 1 ||
    !Number.isInteger(state.masterSeed) ||
    state.masterSeed < 0 ||
    state.masterSeed > 0xffff_ffff ||
    !Number.isInteger(state.attemptsPerLane) ||
    state.attemptsPerLane < 0 ||
    typeof state.nextAttemptByLane !== 'object' ||
    state.nextAttemptByLane === null
  ) {
    throw new Error(
      'Invalid Endless generation state schema.',
    );
  }

  for (const [laneId, nextAttempt] of Object.entries(state.nextAttemptByLane)) {
    if (
      laneId.length === 0 ||
      !Number.isInteger(nextAttempt) ||
      nextAttempt < 0 ||
      nextAttempt > state.attemptsPerLane
    ) {
      throw new Error(
        `Invalid Endless next attempt for lane ${laneId}.`,
      );
    }
  }
}

function writeAtomicReplace(
  filePath: string,
  body: string,
): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}`;
  writeFileSync(tempPath, body, 'utf8');
  renameSync(tempPath, filePath);
}

function writeAtomicStable(
  filePath: string,
  body: string,
): void {
  mkdirSync(dirname(filePath), { recursive: true });

  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf8');
    if (existing === body) return;
    throw new Error(
      `Refusing to overwrite incompatible Endless artifact ${filePath}.`,
    );
  }

  const tempPath = `${filePath}.tmp-${process.pid}`;
  writeFileSync(tempPath, body, 'utf8');
  renameSync(tempPath, filePath);
}

function compareReservoirEntry(
  left: EndlessReservoirEntry,
  right: EndlessReservoirEntry,
): number {
  return (
    left.laneIndex - right.laneIndex ||
    left.attempt - right.attempt ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}
