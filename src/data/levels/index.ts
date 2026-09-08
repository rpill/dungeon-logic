import type { LevelDefinition } from '../../puzzle/types';

import { level001 } from './level001';
import { level002 } from './level002';
import { level003 } from './level003';
import { level004 } from './level004';
import { level005 } from './level005';
import { level006 } from './level006';
import { level007 } from './level007';
import { level008 } from './level008';
import { level009 } from './level009';
import { level010 } from './level010';
import { level011 } from './level011';
import { level012 } from './level012';

export {
  level001,
  level002,
  level003,
  level004,
  level005,
  level006,
  level007,
  level008,
  level009,
  level010,
  level011,
  level012,
};

export const levels:
  readonly LevelDefinition[] = [
  level001,
  level002,
  level003,
  level004,
  level005,
  level006,
  level007,
  level008,
  level009,
  level010,
  level011,
  level012,
  ];

export function tryResolveLevel(
  value: string | null,
): LevelDefinition | null {
  if (value === null) {
    return null;
  }

  const levelNumber = Number(value);
  if (!Number.isInteger(levelNumber)) {
    return null;
  }

  return levels[levelNumber - 1] ?? null;
}

export function resolveLevel(
  value: string | null,
): LevelDefinition {
  if (value === null) {
    return level001;
  }

  const levelNumber =
    Number(value);

  if (
    !Number.isInteger(
      levelNumber,
    )
  ) {
    return level001;
  }

  return (
    levels[levelNumber - 1] ??
    level001
  );
}

export function parseGeneratedPlaytestSeed(
  value: string | null,
): number | null {
  if (
    value === null ||
    !/^[0-9]+$/.test(value)
  ) {
    return null;
  }

  const seed = Number(value);

  if (
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0xffff_ffff
  ) {
    return null;
  }

  return seed;
}

export function buildGeneratedCandidatesUrl(
  seed: number,
): string {
  return (
    `/__generated/candidates-${seed}.json`
  );
}

export function resolveGeneratedCandidate(
  report: unknown,
  candidateId: string | null,
): LevelDefinition | null {
  if (
    candidateId === null ||
    candidateId.length === 0 ||
    !isRecord(report) ||
    !isRecord(report.pool) ||
    !Array.isArray(
      report.pool.archetypes,
    )
  ) {
    return null;
  }

  for (
    const archetype
    of report.pool.archetypes
  ) {
    if (
      !isRecord(archetype) ||
      !Array.isArray(
        archetype.accepted,
      )
    ) {
      continue;
    }

    for (
      const accepted
      of archetype.accepted
    ) {
      if (
        !isRecord(accepted) ||
        !isRecord(
          accepted.candidate,
        )
      ) {
        continue;
      }

      const candidate =
        accepted.candidate;

      if (
        candidate.id !== candidateId
      ) {
        continue;
      }

      if (
        isLevelDefinition(
          candidate.level,
        )
      ) {
        return candidate.level;
      }

      return null;
    }
  }

  return null;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function isLevelDefinition(
  value: unknown,
): value is LevelDefinition {
  if (!isRecord(value)) {
    return false;
  }

  const width = value.width;
  const height = value.height;

  return (
    typeof value.id === 'string' &&
    typeof width === 'number' &&
    Number.isInteger(width) &&
    width > 0 &&
    typeof height === 'number' &&
    Number.isInteger(height) &&
    height > 0 &&
    isIntegerArray(value.rowClues) &&
    value.rowClues.length === height &&
    isIntegerArray(
      value.columnClues,
    ) &&
    value.columnClues.length === width &&
    Array.isArray(value.monsters) &&
    Array.isArray(value.chests) &&
    Array.isArray(value.blockers) &&
    Array.isArray(value.doors) &&
    isSolution(
      value.solution,
      width,
      height,
    )
  );
}

function isIntegerArray(
  value: unknown,
): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'number' &&
        Number.isInteger(item),
    )
  );
}

function isSolution(
  value: unknown,
  width: number,
  height: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === height &&
    value.every(
      (row) =>
        typeof row === 'string' &&
        row.length === width &&
        /^[.#]+$/.test(row),
    )
  );
}
