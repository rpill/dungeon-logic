import type { EndlessCatalog } from '../content/endless/EndlessCatalog';
import { getEndlessProgressionTarget } from '../content/endless/ProgressionPolicy';
import type { GeneratorArchetype as GeneratorArchetypeValue } from '../puzzle/generator/types';

const MAX_SCORE = 100;

export class EndlessLevelPicker {
  private readonly catalog: EndlessCatalog;
  private readonly byScore: readonly (readonly number[])[];

  constructor(catalog: EndlessCatalog) {
    this.catalog = catalog;
    const buckets = Array.from({ length: MAX_SCORE + 1 }, () => [] as number[]);
    for (let index = 0; index < catalog.length; index += 1) {
      buckets[catalog.get(index).difficultyScore].push(index);
    }
    this.byScore = buckets;
  }

  pickCatalogIndex(logicalOrdinal: number): number {
    if (!Number.isInteger(logicalOrdinal) || logicalOrdinal < 0) {
      throw new RangeError('Endless logical ordinal must be a non-negative integer.');
    }
    const current = this.pickBase(logicalOrdinal, null);
    if (logicalOrdinal === 0) return current;
    const previous = this.pickBase(logicalOrdinal - 1, null);
    return current === previous ? this.pickBase(logicalOrdinal, previous) : current;
  }

  private pickBase(logicalOrdinal: number, excludedIndex: number | null): number {
    const target = getEndlessProgressionTarget(logicalOrdinal + 1);
    const bandSet = new Set<string>(target.allowedBands);
    const sizeSet = new Set<number>(target.allowedSizes);
    const seed = mix32(logicalOrdinal + 1);
    const preferredSize = target.allowedSizes[seed % target.allowedSizes.length];
    const preferredArchetypeCode = (seed >>> 8) % 5;

    for (const mode of ['strict', 'band', 'any'] as const) {
      for (let distance = 0; distance <= MAX_SCORE; distance += 1) {
        let bestIndex = -1;
        let bestPenalty = Number.POSITIVE_INFINITY;
        let bestTie = Number.POSITIVE_INFINITY;
        const scores = distance === 0
          ? [target.targetScore]
          : [target.targetScore - distance, target.targetScore + distance];
        for (const score of scores) {
          if (score < 0 || score > MAX_SCORE) continue;
          for (const index of this.byScore[score]) {
            if (index === excludedIndex) continue;
            const entry = this.catalog.get(index);
            if (mode !== 'any' && !bandSet.has(entry.difficultyBand)) continue;
            if (mode === 'strict' && !sizeSet.has(entry.size)) continue;
            const penalty = (entry.size === preferredSize ? 0 : 2)
              + (archetypeCode(entry.archetype) === preferredArchetypeCode ? 0 : 1);
            const tie = mix32(seed ^ index ^ (score << 16));
            if (penalty < bestPenalty || (penalty === bestPenalty && tie < bestTie)) {
              bestIndex = index;
              bestPenalty = penalty;
              bestTie = tie;
            }
          }
        }
        if (bestIndex >= 0) return bestIndex;
      }
    }

    throw new Error('Endless catalog has no selectable entries.');
  }
}

function archetypeCode(archetype: GeneratorArchetypeValue): number {
  switch (archetype) {
    case 'monster-only': return 0;
    case 'chest-one-room': return 1;
    case 'chest-two-rooms': return 2;
    case 'mixed-one-room': return 3;
    case 'mixed-two-rooms': return 4;
  }
}

function mix32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}
