import {
  decodeEndlessCatalog,
  type EndlessCatalogEntry,
  type EndlessCatalogManifest,
} from './CatalogFormat';
import {
  generateCandidate,
} from '../../puzzle/generator/CandidateGenerator';
import type {
  LevelDefinition,
} from '../../puzzle/types';

export interface EndlessCatalog {
  readonly length: number;
  get(index: number): EndlessCatalogEntry;
  createLevel(index: number): LevelDefinition;
}

export function createEndlessCatalog(
  bytes: ArrayBuffer | Uint8Array,
  manifest: EndlessCatalogManifest,
): EndlessCatalog {
  const entries = decodeEndlessCatalog(
    bytes,
    manifest,
  );

  const get = (
    index: number,
  ): EndlessCatalogEntry => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= entries.length
    ) {
      throw new RangeError(
        `Endless catalog index ${index} is out of range 0..${Math.max(0, entries.length - 1)}.`,
      );
    }
    return entries[index];
  };

  return {
    length: entries.length,
    get,
    createLevel(index: number): LevelDefinition {
      const entry = get(index);
      const result = generateCandidate({
        seed: entry.seed,
        archetype: entry.archetype,
        size: entry.size,
      });
      if (!result.ok) {
        throw new Error(
          `Endless catalog compatibility error at index ${index}: ${result.reason}`,
        );
      }
      return result.candidate.level;
    },
  };
}
