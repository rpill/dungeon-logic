import {
  existsSync,
  mkdirSync,
  readFileSync,
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
  EndlessSelectedEntry,
  EndlessSelectionRecord,
  EndlessVerificationReport,
} from './types';

export const ENDLESS_SELECTION_FILE = 'selection.jsonl';
export const ENDLESS_VERIFICATION_FILE = 'verification.json';

export function writeEndlessSelection(
  rootDir: string,
  entries: readonly EndlessSelectedEntry[],
): string {
  mkdirSync(rootDir, { recursive: true });
  const path = join(
    rootDir,
    ENDLESS_SELECTION_FILE,
  );
  const body = entries
    .map((entry) =>
      JSON.stringify(toSelectionRecord(entry)),
    )
    .join('\n') + (entries.length === 0 ? '' : '\n');
  writeAtomicReplace(path, body);
  return path;
}

export function readEndlessSelection(
  rootDir: string,
): readonly EndlessSelectionRecord[] {
  const path = join(
    rootDir,
    ENDLESS_SELECTION_FILE,
  );
  if (!existsSync(path)) {
    throw new Error(
      `Missing Endless selection artifact ${path}.`,
    );
  }

  const lines = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  return lines.map((line, index) => {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error: unknown) {
      throw new Error(
        `Malformed Endless selection JSON on line ${index + 1}: ${String(error)}`,
      );
    }
    return parseSelectionRecord(value);
  });
}

export function writeEndlessVerification(
  rootDir: string,
  report: EndlessVerificationReport,
): string {
  const path = join(
    rootDir,
    ENDLESS_VERIFICATION_FILE,
  );
  writeAtomicReplace(
    path,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return path;
}

export function readEndlessVerification(
  rootDir: string,
): EndlessVerificationReport {
  const path = join(
    rootDir,
    ENDLESS_VERIFICATION_FILE,
  );
  if (!existsSync(path)) {
    throw new Error(
      `Missing Endless verification artifact ${path}.`,
    );
  }
  const value: unknown = JSON.parse(
    readFileSync(path, 'utf8'),
  );
  return parseVerificationReport(value);
}

function toSelectionRecord(
  entry: EndlessSelectedEntry,
): EndlessSelectionRecord {
  const {
    diversity: _diversity,
    ...record
  } = entry;
  return record;
}

function parseSelectionRecord(
  value: unknown,
): EndlessSelectionRecord {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    throw new Error(
      'Endless selection record must be an object.',
    );
  }
  const record = value as Record<string, unknown>;

  assertIntegerField(record, 'ordinal', 1);
  assertIntegerField(record, 'laneIndex', 0);
  assertIntegerField(record, 'attempt', 0);
  assertIntegerField(record, 'seed', 0, 0xffff_ffff);
  assertIntegerField(record, 'size', 6, 8);
  if (
    record.size !== 6 &&
    record.size !== 7 &&
    record.size !== 8
  ) {
    throw new Error(
      `Invalid Endless selection board size ${String(record.size)}.`,
    );
  }
  assertIntegerField(record, 'difficultyScore', 0, 100);
  assertFiniteField(record, 'qualityScore');
  assertIntegerField(record, 'targetScore', 0, 100);
  assertFiniteField(record, 'selectionScore');

  assertNonEmptyStringField(record, 'laneId');
  assertNonEmptyStringField(record, 'candidateId');
  assertNonEmptyStringField(record, 'structuralFingerprint');

  if (
    typeof record.archetype !== 'string' ||
    !ALL_GENERATOR_ARCHETYPES.includes(
      record.archetype as never,
    )
  ) {
    throw new Error(
      `Invalid Endless selection archetype ${String(record.archetype)}.`,
    );
  }
  if (
    record.difficultyBand !== DifficultyBand.Easy &&
    record.difficultyBand !== DifficultyBand.Medium &&
    record.difficultyBand !== DifficultyBand.Hard &&
    record.difficultyBand !== DifficultyBand.Expert
  ) {
    throw new Error(
      `Invalid Endless selection difficultyBand ${String(record.difficultyBand)}.`,
    );
  }
  if (
    record.previousDistance !== null &&
    (
      typeof record.previousDistance !== 'number' ||
      !Number.isFinite(record.previousDistance) ||
      record.previousDistance < 0
    )
  ) {
    throw new Error(
      'Invalid Endless selection previousDistance.',
    );
  }
  return value as EndlessSelectionRecord;
}

function assertIntegerField(
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): void {
  const value = record[key];
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `Invalid Endless selection numeric field ${key}.`,
    );
  }
}

function assertFiniteField(
  record: Record<string, unknown>,
  key: string,
): void {
  const value = record[key];
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `Invalid Endless selection numeric field ${key}.`,
    );
  }
}

function assertNonEmptyStringField(
  record: Record<string, unknown>,
  key: string,
): void {
  const value = record[key];
  if (
    typeof value !== 'string' ||
    value.length === 0
  ) {
    throw new Error(
      `Invalid Endless selection string field ${key}.`,
    );
  }
}

function parseVerificationReport(
  value: unknown,
): EndlessVerificationReport {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    throw new Error(
      'Endless verification report must be an object.',
    );
  }
  const report = value as Record<string, unknown>;
  if (
    typeof report.selectionHash !== 'string' ||
    typeof report.ok !== 'boolean' ||
    !Number.isInteger(report.verifiedCount) ||
    !Number.isInteger(report.rejectedVerificationCount) ||
    !Number.isInteger(report.duplicateCount) ||
    !Number.isInteger(report.campaignCollisionCount) ||
    !Number.isInteger(report.dailyCollisionCount) ||
    !Array.isArray(report.failures)
  ) {
    throw new Error(
      'Invalid Endless verification report schema.',
    );
  }
  return value as EndlessVerificationReport;
}

function writeAtomicReplace(
  path: string,
  body: string,
): void {
  mkdirSync(dirname(path), {
    recursive: true,
  });
  const temp = `${path}.tmp-${process.pid}`;
  writeFileSync(temp, body, 'utf8');
  renameSync(temp, path);
}
