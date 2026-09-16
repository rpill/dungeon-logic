import {
  getEndlessProgressionTarget,
} from '../../content/endless/ProgressionPolicy';
import {
  candidateDiversityDistance,
} from '../../puzzle/generator/CandidateRanker';
import type {
  EndlessReservoirEntry,
  EndlessSelectedEntry,
} from './types';

const RECENT_DIVERSITY_WINDOW = 4;
const CANDIDATES_PER_SCORE_BUCKET = 6;
const PREFERRED_SCORE_WINDOWS = [2, 4, 8, 14, 100] as const;
const DIFFICULTY_BONUS = 48;
const DIFFICULTY_WEIGHT = 6;
const DIVERSITY_WEIGHT = 12;
const OPENING_MONOTONIC_PHASES = [[1, 29], [30, 60]] as const;

const SELECTOR_BANDS = [
  'easy',
  'medium',
  'hard',
  'expert',
] as const satisfies readonly EndlessReservoirEntry['difficultyBand'][];

type SelectorBand = (typeof SELECTOR_BANDS)[number];
type SelectorBandCounts = Record<SelectorBand, number>;

export function selectEndlessCatalog(
  reservoir: readonly EndlessReservoirEntry[],
  targetCount: number,
): readonly EndlessSelectedEntry[] {
  if (
    !Number.isInteger(targetCount) ||
    targetCount < 0
  ) {
    throw new RangeError(
      'Endless targetCount must be a non-negative integer.',
    );
  }
  if (targetCount > reservoir.length) {
    throw new Error(
      `Endless selector requested ${targetCount} entries from a reservoir of ${reservoir.length}.`,
    );
  }

  validateReservoirUniqueness(reservoir);
  const buckets = buildBuckets(reservoir);
  const remainingBandCounts = countBands(reservoir);
  const futureDemandByAllowedMask = buildFutureDemandByAllowedMask(
    targetCount,
  );
  const selected: EndlessSelectedEntry[] = [];
  const usedCandidateIds = new Set<string>();
  const usedFingerprints = new Set<string>();

  for (
    let ordinal = 1;
    ordinal <= targetCount;
    ordinal += 1
  ) {
    const progression =
      getEndlessProgressionTarget(ordinal);
    const currentAllowedMask = bandMask(
      progression.allowedBands,
    );
    futureDemandByAllowedMask[currentAllowedMask] -= 1;

    const safeBands = getCoverageSafeBands(
      progression.allowedBands,
      remainingBandCounts,
      futureDemandByAllowedMask,
    );

    let candidates: readonly EndlessReservoirEntry[] = [];
    for (const scoreWindow of PREFERRED_SCORE_WINDOWS) {
      candidates = collectCandidateWindow({
        buckets,
        usedCandidateIds,
        usedFingerprints,
        allowedBands: safeBands,
        allowedSizes: progression.allowedSizes,
        targetScore: progression.targetScore,
        scoreWindow,
      });
      if (candidates.length > 0) break;
    }

    if (candidates.length === 0) {
      throwSelectionExhaustion(
        ordinal,
        progression.targetScore,
        progression.allowedBands,
        reservoir,
        usedCandidateIds,
      );
    }

    const antiStreak = applyAntiStreakPreference(
      candidates,
      selected,
    );
    const recent = selected.slice(
      -RECENT_DIVERSITY_WINDOW,
    );

    const ranked = [...antiStreak].sort(
      (left, right) => {
        const leftScore = calculateSelectionScore(
          left,
          recent,
          progression.targetScore,
        );
        const rightScore = calculateSelectionScore(
          right,
          recent,
          progression.targetScore,
        );
        return (
          rightScore - leftScore ||
          right.qualityScore - left.qualityScore ||
          compareText(
            left.candidateId,
            right.candidateId,
          ) ||
          left.seed - right.seed
        );
      },
    );

    const picked = ranked[0];
    const previous = selected.at(-1);
    const previousDistance =
      previous === undefined
        ? null
        : candidateDiversityDistance(
            picked.diversity,
            previous.diversity,
          );
    const selectionScore = calculateSelectionScore(
      picked,
      recent,
      progression.targetScore,
    );

    usedCandidateIds.add(picked.candidateId);
    usedFingerprints.add(
      picked.structuralFingerprint,
    );
    remainingBandCounts[picked.difficultyBand] -= 1;
    selected.push({
      ...picked,
      ordinal,
      targetScore: progression.targetScore,
      selectionScore,
      previousDistance,
    });
  }

  return normalizeOpeningDifficultyOrder(selected);
}

function normalizeOpeningDifficultyOrder(
  selected: readonly EndlessSelectedEntry[],
): readonly EndlessSelectedEntry[] {
  if (selected.length < 2) return selected;

  const reordered = [...selected];
  for (const [startOrdinal, endOrdinal] of OPENING_MONOTONIC_PHASES) {
    const startIndex = startOrdinal - 1;
    if (startIndex >= reordered.length) continue;
    const endIndex = Math.min(endOrdinal, reordered.length);
    const phase = orderMonotonicPhase(
      reordered.slice(startIndex, endIndex),
      reordered.slice(0, startIndex),
    );
    reordered.splice(startIndex, phase.length, ...phase);
  }

  const rebuilt: EndlessSelectedEntry[] = [];
  for (let index = 0; index < reordered.length; index += 1) {
    const entry = reordered[index];
    const ordinal = index + 1;
    const progression = getEndlessProgressionTarget(ordinal);
    const recent = rebuilt.slice(-RECENT_DIVERSITY_WINDOW);
    const previous = rebuilt.at(-1);
    rebuilt.push({
      ...entry,
      ordinal,
      targetScore: progression.targetScore,
      selectionScore: calculateSelectionScore(
        entry,
        recent,
        progression.targetScore,
      ),
      previousDistance:
        previous === undefined
          ? null
          : candidateDiversityDistance(
              entry.diversity,
              previous.diversity,
            ),
    });
  }

  return rebuilt;
}

function orderMonotonicPhase(
  phase: readonly EndlessSelectedEntry[],
  prefix: readonly EndlessSelectedEntry[],
): readonly EndlessSelectedEntry[] {
  const scores = [...new Set(phase.map((entry) => entry.difficultyScore))].sort(
    (left, right) => left - right,
  );
  const ordered: EndlessSelectedEntry[] = [];

  for (const score of scores) {
    const remaining = phase
      .filter((entry) => entry.difficultyScore === score)
      .sort((left, right) => left.ordinal - right.ordinal);

    while (remaining.length > 0) {
      const context = [...prefix, ...ordered];
      const preferred = applyAntiStreakPreference(remaining, context);
      const picked = preferred[0];
      ordered.push(picked);
      const index = remaining.indexOf(picked);
      remaining.splice(index, 1);
    }
  }

  return ordered;
}

interface CandidateWindowOptions {
  readonly buckets: ReadonlyMap<string, readonly EndlessReservoirEntry[]>;
  readonly usedCandidateIds: ReadonlySet<string>;
  readonly usedFingerprints: ReadonlySet<string>;
  readonly allowedBands: readonly SelectorBand[];
  readonly allowedSizes: readonly EndlessReservoirEntry['size'][];
  readonly targetScore: number;
  readonly scoreWindow: number;
}

function collectCandidateWindow(
  options: CandidateWindowOptions,
): readonly EndlessReservoirEntry[] {
  const minScore = Math.max(
    0,
    options.targetScore - options.scoreWindow,
  );
  const maxScore = Math.min(
    100,
    options.targetScore + options.scoreWindow,
  );
  const result: EndlessReservoirEntry[] = [];

  for (const band of options.allowedBands) {
    for (
      let score = minScore;
      score <= maxScore;
      score += 1
    ) {
      const bucket = options.buckets.get(
        bucketKey(band, score),
      );
      if (bucket === undefined) continue;

      let added = 0;
      for (const entry of bucket) {
        if (
          options.usedCandidateIds.has(
            entry.candidateId,
          ) ||
          options.usedFingerprints.has(
            entry.structuralFingerprint,
          ) ||
          !options.allowedSizes.includes(entry.size)
        ) {
          continue;
        }
        result.push(entry);
        added += 1;
        if (
          added >= CANDIDATES_PER_SCORE_BUCKET
        ) {
          break;
        }
      }
    }
  }

  return result;
}

function buildBuckets(
  reservoir: readonly EndlessReservoirEntry[],
): ReadonlyMap<string, readonly EndlessReservoirEntry[]> {
  const buckets = new Map<
    string,
    EndlessReservoirEntry[]
  >();

  const stable = [...reservoir].sort(
    compareReservoirStable,
  );
  for (const entry of stable) {
    const key = bucketKey(
      entry.difficultyBand,
      entry.difficultyScore,
    );
    const bucket = buckets.get(key) ?? [];
    bucket.push(entry);
    buckets.set(key, bucket);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((left, right) => (
      right.qualityScore - left.qualityScore ||
      compareText(left.candidateId, right.candidateId) ||
      left.seed - right.seed
    ));
  }

  return buckets;
}

function countBands(
  reservoir: readonly EndlessReservoirEntry[],
): SelectorBandCounts {
  const counts: SelectorBandCounts = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  };
  for (const entry of reservoir) {
    counts[entry.difficultyBand] += 1;
  }
  return counts;
}

function buildFutureDemandByAllowedMask(
  targetCount: number,
): number[] {
  const demand = Array<number>(1 << SELECTOR_BANDS.length).fill(0);
  for (let ordinal = 1; ordinal <= targetCount; ordinal += 1) {
    const progression = getEndlessProgressionTarget(ordinal);
    demand[bandMask(progression.allowedBands)] += 1;
  }
  return demand;
}

function getCoverageSafeBands(
  allowedBands: readonly SelectorBand[],
  remainingBandCounts: Readonly<SelectorBandCounts>,
  futureDemandByAllowedMask: readonly number[],
): readonly SelectorBand[] {
  const maskCount = 1 << SELECTOR_BANDS.length;
  const supplyByMask = Array<number>(maskCount).fill(0);
  const requiredByMask = Array<number>(maskCount).fill(0);

  for (let mask = 1; mask < maskCount; mask += 1) {
    for (let index = 0; index < SELECTOR_BANDS.length; index += 1) {
      const bit = 1 << index;
      if ((mask & bit) !== 0) {
        supplyByMask[mask] +=
          remainingBandCounts[SELECTOR_BANDS[index]];
      }
    }

    for (
      let allowedMask = 1;
      allowedMask < futureDemandByAllowedMask.length;
      allowedMask += 1
    ) {
      if ((allowedMask & ~mask) === 0) {
        requiredByMask[mask] +=
          futureDemandByAllowedMask[allowedMask];
      }
    }
  }

  return allowedBands.filter((band) => {
    const pickedBit = bandBit(band);
    for (let mask = 1; mask < maskCount; mask += 1) {
      const supplyAfterPick =
        supplyByMask[mask] -
        ((mask & pickedBit) !== 0 ? 1 : 0);
      if (requiredByMask[mask] > supplyAfterPick) {
        return false;
      }
    }
    return true;
  });
}

function bandMask(
  bands: readonly SelectorBand[],
): number {
  return bands.reduce(
    (mask, band) => mask | bandBit(band),
    0,
  );
}

function bandBit(band: SelectorBand): number {
  const index = SELECTOR_BANDS.indexOf(band);
  if (index < 0) {
    throw new Error(`Unsupported Endless difficulty band ${band}.`);
  }
  return 1 << index;
}

function applyAntiStreakPreference<T extends EndlessReservoirEntry>(
  candidates: readonly T[],
  selected: readonly EndlessSelectedEntry[],
): readonly T[] {
  if (selected.length < 3) return candidates;

  const lastThree = selected.slice(-3);
  const repeatedArchetype = lastThree.every(
    (entry) =>
      entry.archetype === lastThree[0].archetype,
  )
    ? lastThree[0].archetype
    : null;
  const repeatedSize = lastThree.every(
    (entry) => entry.size === lastThree[0].size,
  )
    ? lastThree[0].size
    : null;

  if (
    repeatedArchetype === null &&
    repeatedSize === null
  ) {
    return candidates;
  }

  const preferred = candidates.filter(
    (entry) =>
      (repeatedArchetype === null ||
        entry.archetype !== repeatedArchetype) &&
      (repeatedSize === null ||
        entry.size !== repeatedSize),
  );
  if (preferred.length > 0) return preferred;

  if (repeatedArchetype !== null) {
    const archetypeAlternatives = candidates.filter(
      (entry) =>
        entry.archetype !== repeatedArchetype,
    );
    if (archetypeAlternatives.length > 0) {
      return archetypeAlternatives;
    }
  }

  if (repeatedSize !== null) {
    const sizeAlternatives = candidates.filter(
      (entry) => entry.size !== repeatedSize,
    );
    if (sizeAlternatives.length > 0) {
      return sizeAlternatives;
    }
  }

  return candidates;
}

function calculateSelectionScore(
  entry: EndlessReservoirEntry,
  recent: readonly EndlessSelectedEntry[],
  targetScore: number,
): number {
  const difficultyBonus = Math.max(
    0,
    DIFFICULTY_BONUS -
      Math.abs(
        entry.difficultyScore - targetScore,
      ) * DIFFICULTY_WEIGHT,
  );
  const diversity =
    recent.length === 0
      ? 0
      : Math.min(
          ...recent.map((existing) =>
            candidateDiversityDistance(
              entry.diversity,
              existing.diversity,
            ),
          ),
        );

  return round(
    entry.qualityScore +
      difficultyBonus +
      diversity * DIVERSITY_WEIGHT,
  );
}

function validateReservoirUniqueness(
  reservoir: readonly EndlessReservoirEntry[],
): void {
  const ids = new Set<string>();
  const fingerprints = new Set<string>();

  for (const entry of reservoir) {
    if (ids.has(entry.candidateId)) {
      throw new Error(
        `Endless reservoir contains duplicate candidate ID ${entry.candidateId}.`,
      );
    }
    if (
      fingerprints.has(
        entry.structuralFingerprint,
      )
    ) {
      throw new Error(
        `Endless reservoir contains duplicate structural fingerprint for ${entry.candidateId}.`,
      );
    }
    ids.add(entry.candidateId);
    fingerprints.add(entry.structuralFingerprint);
  }
}

function throwSelectionExhaustion(
  ordinal: number,
  targetScore: number,
  allowedBands: readonly string[],
  reservoir: readonly EndlessReservoirEntry[],
  usedCandidateIds: ReadonlySet<string>,
): never {
  const remaining = reservoir.filter(
    (entry) =>
      !usedCandidateIds.has(entry.candidateId),
  );
  const countsByBand: Record<string, number> = {};
  const countsByArchetype: Record<string, number> = {};
  const countsBySize: Record<string, number> = {};

  for (const entry of remaining) {
    countsByBand[entry.difficultyBand] =
      (countsByBand[entry.difficultyBand] ?? 0) + 1;
    countsByArchetype[entry.archetype] =
      (countsByArchetype[entry.archetype] ?? 0) + 1;
    countsBySize[String(entry.size)] =
      (countsBySize[String(entry.size)] ?? 0) + 1;
  }

  throw new Error(
    `Endless selection exhausted at ordinal ${ordinal}; targetScore=${targetScore}; allowedBands=${allowedBands.join(',')}; remaining=${remaining.length}; byBand=${JSON.stringify(countsByBand)}; byArchetype=${JSON.stringify(countsByArchetype)}; bySize=${JSON.stringify(countsBySize)}.`,
  );
}

function bucketKey(
  band: string,
  score: number,
): string {
  return `${band}:${score}`;
}

function compareReservoirStable(
  left: EndlessReservoirEntry,
  right: EndlessReservoirEntry,
): number {
  return (
    compareText(left.candidateId, right.candidateId) ||
    left.seed - right.seed ||
    compareText(left.archetype, right.archetype) ||
    left.size - right.size
  );
}

function compareText(
  left: string,
  right: string,
): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
