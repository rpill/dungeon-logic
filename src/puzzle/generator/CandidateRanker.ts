import {
  DifficultyBand,
  DifficultyTarget,
  type DifficultyTarget as DifficultyTargetType,
} from '../difficulty/types';

import {
  TARGETED_ARCHETYPE_QUOTAS,
  TARGETED_POOL_SIZE,
  TARGETED_SHORTLIST_SIZE,
  TARGETED_SHORTLIST_SOFT_CAP,
  difficultyBandDistance as policyDifficultyBandDistance,
  type TargetedArchetypeQuotaMap,
  type TargetedDifficultyTarget,
} from './DifficultyTargetPolicy';

import {
  getGeneratorMonsterPolicy,
} from './CandidateFactory';

import {
  classifyRoomSpatialCategory,
} from './CandidateGenerator';

import {
  ALL_GENERATOR_ARCHETYPES,
  GeneratorArchetype,
  type AcceptedCandidate,
  type GeneratorBoardSize,
  type GeneratorPoolReport,
  type PlannedRoom,
  type RankedCandidate,
} from './types';

export function scoreCandidate(
  accepted: AcceptedCandidate,
): number {
  const metrics =
    accepted.quality.metrics;

  let score = 100;

  score -= scaledPenalty(
    metrics.wallDensity,
    0.48,
    0.55,
    8,
  );

  score -= scaledPenalty(
    metrics.thickWallCellRatio,
    0.35,
    0.60,
    8,
  );

  score -= inverseScaledPenalty(
    metrics.wallOpenBoundaryPerWall,
    1.30,
    1.45,
    8,
  );

  score -= scaledPenalty(
    metrics.largestWallComponentRatio,
    0.60,
    0.75,
    8,
  );

  score -= Math.min(
    4,
    Math.max(
      0,
      metrics.nearFullWallLineCount -
        1,
    ) * 2,
  );

  score += Math.min(
    3,
    metrics.objectAssistedForcedWallCount *
      0.25,
  );

  score -=
    getGeneratorMonsterPolicy(
      accepted.candidate,
    ).rankingPenalty;

  return roundScore(score);
}

export function candidateDistance(
  a: AcceptedCandidate,
  b: AcceptedCandidate,
): number {
  if (a === b) {
    return 0;
  }

  const aMetrics =
    a.quality.metrics;

  const bMetrics =
    b.quality.metrics;

  const components = [
    clamp01(
      Math.abs(
        a.candidate.size -
          b.candidate.size,
      ) / 2,
    ),
    clamp01(
      Math.abs(
        aMetrics.wallDensity -
          bMetrics.wallDensity,
      ) / 0.20,
    ),
    clamp01(
      Math.abs(
        aMetrics.thickWallCellRatio -
          bMetrics.thickWallCellRatio,
      ) / 0.40,
    ),
    clamp01(
      Math.abs(
        aMetrics.wallOpenBoundaryPerWall -
          bMetrics.wallOpenBoundaryPerWall,
      ) / 0.80,
    ),
    clamp01(
      Math.abs(
        aMetrics.largestWallComponentRatio -
          bMetrics.largestWallComponentRatio,
      ) / 0.50,
    ),
    clamp01(
      Math.abs(
        a.candidate.level.monsters.length -
          b.candidate.level.monsters.length,
      ) / 4,
    ),
    wallMaskDistance(a, b),
  ] as const;

  const total =
    components.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  const roomDistance =
    roomSpatialDistance(a, b);

  if (roomDistance === null) {
    return clamp01(
      total / components.length,
    );
  }

  return clamp01(
    (
      total +
      roomDistance * 2
    ) /
    (
      components.length + 2
    ),
  );
}

export interface TargetedPoolSelection {
  accepted:
    readonly AcceptedCandidate[];
  byArchetype:
    Readonly<
      Record<
        GeneratorArchetype,
        readonly AcceptedCandidate[]
      >
    >;
  backfillCount: number;
}

export function selectTargetedPoolFromReservoirs(
  reservoirs:
    Readonly<
      Record<
        GeneratorArchetype,
        readonly AcceptedCandidate[]
      >
    >,
  target: TargetedDifficultyTarget,
  quotas: TargetedArchetypeQuotaMap,
  requestedTotal = TARGETED_POOL_SIZE,
): TargetedPoolSelection {
  if (
    !Number.isInteger(requestedTotal) ||
    requestedTotal < 0
  ) {
    throw new RangeError(
      'requestedTotal must be a non-negative integer.',
    );
  }

  const nominalByArchetype =
    createEmptyAcceptedByArchetype();

  const selectedSet =
    new Set<AcceptedCandidate>();

  const nominalAccepted:
    AcceptedCandidate[] = [];

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const quota =
      Math.max(
        0,
        Math.floor(
          quotas[archetype],
        ),
      );

    const selected =
      selectTargetedArchetypeCandidates(
        reservoirs[archetype],
        archetype,
        target,
        quota,
      );

    nominalByArchetype[archetype] =
      selected;

    for (const accepted of selected) {
      selectedSet.add(accepted);
      nominalAccepted.push(accepted);
    }
  }

  const accepted =
    nominalAccepted.slice(
      0,
      requestedTotal,
    );

  const acceptedSet =
    new Set<AcceptedCandidate>(accepted);

  const surplus:
    AcceptedCandidate[] = [];

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    for (
      const candidate
      of reservoirs[archetype]
    ) {
      if (!selectedSet.has(candidate)) {
        surplus.push(candidate);
      }
    }
  }

  surplus.sort(
    (left, right) =>
      compareTargetPreference(
        left,
        right,
        target,
      ),
  );

  let backfillCount = 0;

  for (const candidate of surplus) {
    if (
      accepted.length >=
      requestedTotal
    ) {
      break;
    }

    if (acceptedSet.has(candidate)) {
      continue;
    }

    accepted.push(candidate);
    acceptedSet.add(candidate);
    backfillCount += 1;
  }

  const byArchetype =
    createEmptyAcceptedByArchetype();

  for (const candidate of accepted) {
    byArchetype[
      candidate.candidate.archetype
    ].push(candidate);
  }

  return {
    accepted,
    byArchetype,
    backfillCount,
  };
}

function selectTargetedArchetypeCandidates(
  reservoir:
    readonly AcceptedCandidate[],
  archetype: GeneratorArchetype,
  target: TargetedDifficultyTarget,
  quota: number,
): AcceptedCandidate[] {
  if (
    quota <= 0 ||
    reservoir.length === 0
  ) {
    return [];
  }

  const byDistance =
    new Map<
      number,
      AcceptedCandidate[]
    >();

  for (const accepted of reservoir) {
    const distance =
      policyDifficultyBandDistance(
        target,
        accepted.difficulty.band,
      );

    const group =
      byDistance.get(distance);

    if (group === undefined) {
      byDistance.set(
        distance,
        [accepted],
      );
    } else {
      group.push(accepted);
    }
  }

  const distances =
    [...byDistance.keys()].sort(
      (a, b) => a - b,
    );

  const selected:
    RankedCandidate[] = [];

  for (const distance of distances) {
    if (selected.length >= quota) {
      break;
    }

    const group =
      byDistance.get(distance);

    if (group === undefined) {
      continue;
    }

    const available =
      group.map(
        (accepted) => ({
          accepted,
          qualityScore:
            scoreCandidate(accepted),
        }),
      );

    available.sort(
      compareQualityThenSeed,
    );

    while (
      available.length > 0 &&
      selected.length < quota
    ) {
      const requiredSize =
        requiredMissingTargetedTwoRoomSize(
          archetype,
          available,
          selected,
          quota - selected.length,
        );

      const eligible =
        requiredSize === null
          ? available
          : available.filter(
              (entry) =>
                entry.accepted
                  .candidate.size ===
                requiredSize,
            );

      const candidates =
        eligible.length > 0
          ? eligible
          : available;

      let bestEntry =
        candidates[0];

      let best =
        rankForSelection(
          bestEntry,
          selected,
          rankWithinArchetypeFor(
            selected,
            archetype,
          ) + 1,
        );

      for (
        let index = 1;
        index < candidates.length;
        index += 1
      ) {
        const ranked =
          rankForSelection(
            candidates[index],
            selected,
            rankWithinArchetypeFor(
              selected,
              archetype,
            ) + 1,
          );

        if (
          compareSelection(
            ranked,
            best,
          ) < 0
        ) {
          bestEntry =
            candidates[index];
          best = ranked;
        }
      }

      available.splice(
        available.indexOf(bestEntry),
        1,
      );

      selected.push(best);
    }
  }

  return selected.map(
    (ranked) => ranked.accepted,
  );
}

function requiredMissingTargetedTwoRoomSize(
  archetype: GeneratorArchetype,
  available:
    readonly QualityEntry[],
  selected:
    readonly RankedCandidate[],
  remainingSlots: number,
): GeneratorBoardSize | null {
  if (
    remainingSlots <= 0 ||
    (
      archetype !==
        GeneratorArchetype
          .ChestTwoRooms &&
      archetype !==
        GeneratorArchetype
          .MixedTwoRooms
    )
  ) {
    return null;
  }

  const availableSizes =
    new Set(
      available.map(
        (entry) =>
          entry.accepted
            .candidate.size,
      ),
    );

  const selectedSizes =
    new Set(
      selected
        .filter(
          (entry) =>
            entry.accepted
              .candidate.archetype ===
            archetype,
        )
        .map(
          (entry) =>
            entry.accepted
              .candidate.size,
        ),
    );

  if (
    selectedSizes.has(7) &&
    !selectedSizes.has(8) &&
    availableSizes.has(8)
  ) {
    return 8;
  }

  if (
    selectedSizes.has(8) &&
    !selectedSizes.has(7) &&
    availableSizes.has(7)
  ) {
    return 7;
  }

  if (
    selectedSizes.size === 0 &&
    remainingSlots >= 2 &&
    availableSizes.has(7) &&
    availableSizes.has(8)
  ) {
    return null;
  }

  return null;
}

function compareTargetPreference(
  left: AcceptedCandidate,
  right: AcceptedCandidate,
  target: TargetedDifficultyTarget,
): number {
  const distanceDelta =
    policyDifficultyBandDistance(
      target,
      left.difficulty.band,
    ) -
    policyDifficultyBandDistance(
      target,
      right.difficulty.band,
    );

  if (distanceDelta !== 0) {
    return distanceDelta;
  }

  const qualityDelta =
    scoreCandidate(right) -
    scoreCandidate(left);

  if (qualityDelta !== 0) {
    return qualityDelta;
  }

  return (
    left.candidate.seed -
    right.candidate.seed
  );
}

function createEmptyAcceptedByArchetype():
  Record<
    GeneratorArchetype,
    AcceptedCandidate[]
  > {
  return {
    [GeneratorArchetype.MonsterOnly]: [],
    [GeneratorArchetype.ChestOneRoom]: [],
    [GeneratorArchetype.ChestTwoRooms]: [],
    [GeneratorArchetype.MixedOneRoom]: [],
    [GeneratorArchetype.MixedTwoRooms]: [],
  };
}

function rankWithinArchetypeFor(
  selected:
    readonly RankedCandidate[],
  archetype: GeneratorArchetype,
): number {
  return selected.filter(
    (entry) =>
      entry.accepted
        .candidate.archetype ===
      archetype,
  ).length;
}

export function selectGlobalTargetedShortlist(
  pool: GeneratorPoolReport,
  target: TargetedDifficultyTarget,
): readonly RankedCandidate[] {
  const exact =
    pool.accepted.filter(
      (entry) =>
        entry.difficulty.band ===
        target,
    );

  const fallback =
    pool.accepted.filter(
      (entry) =>
        entry.difficulty.band !==
        target,
    );

  const selected:
    RankedCandidate[] = [];

  const affinityTargets =
    deriveShortlistAffinityTargets(
      target,
    );

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    while (
      selected.length <
        TARGETED_SHORTLIST_SIZE &&
      rankWithinArchetypeFor(
        selected,
        archetype,
      ) <
        affinityTargets[archetype]
    ) {
      const chosen =
        takeBestGlobalCandidate(
          exact,
          selected,
          (candidate) =>
            candidate.candidate
              .archetype ===
              archetype &&
            rankWithinArchetypeFor(
              selected,
              archetype,
            ) <
              TARGETED_SHORTLIST_SOFT_CAP,
        );

      if (chosen === null) {
        break;
      }

      selected.push(chosen);
    }
  }

  fillGlobalCandidates(
    exact,
    selected,
    TARGETED_SHORTLIST_SIZE,
    true,
  );

  fillGlobalCandidates(
    exact,
    selected,
    TARGETED_SHORTLIST_SIZE,
    false,
  );

  if (
    selected.length <
    TARGETED_SHORTLIST_SIZE
  ) {
    const fallbackByDistance =
      new Map<
        number,
        AcceptedCandidate[]
      >();

    for (const candidate of fallback) {
      const distance =
        policyDifficultyBandDistance(
          target,
          candidate.difficulty.band,
        );

      const group =
        fallbackByDistance.get(
          distance,
        );

      if (group === undefined) {
        fallbackByDistance.set(
          distance,
          [candidate],
        );
      } else {
        group.push(candidate);
      }
    }

    const distances =
      [...fallbackByDistance.keys()]
        .sort(
          (left, right) =>
            left - right,
        );

    for (const distance of distances) {
      if (
        selected.length >=
        TARGETED_SHORTLIST_SIZE
      ) {
        break;
      }

      const group =
        fallbackByDistance.get(
          distance,
        );

      if (group === undefined) {
        continue;
      }

      fillGlobalCandidates(
        group,
        selected,
        TARGETED_SHORTLIST_SIZE,
        true,
      );

      fillGlobalCandidates(
        group,
        selected,
        TARGETED_SHORTLIST_SIZE,
        false,
      );
    }
  }

  return selected;
}

function deriveShortlistAffinityTargets(
  target: TargetedDifficultyTarget,
): Readonly<
  Record<
    GeneratorArchetype,
    number
  >
> {
  const quotas =
    TARGETED_ARCHETYPE_QUOTAS[
      target
    ];

  const raw =
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype, policyIndex) => {
        const scaled =
          quotas[archetype] *
          TARGETED_SHORTLIST_SIZE /
          TARGETED_POOL_SIZE;

        const floor =
          Math.floor(scaled);

        return {
          archetype,
          policyIndex,
          base:
            Math.min(
              floor,
              TARGETED_SHORTLIST_SOFT_CAP,
            ),
          remainder:
            scaled - floor,
        };
      },
    );

  const result:
    Record<
      GeneratorArchetype,
      number
    > = {
      [GeneratorArchetype.MonsterOnly]: 0,
      [GeneratorArchetype.ChestOneRoom]: 0,
      [GeneratorArchetype.ChestTwoRooms]: 0,
      [GeneratorArchetype.MixedOneRoom]: 0,
      [GeneratorArchetype.MixedTwoRooms]: 0,
    };

  let assigned = 0;

  for (const entry of raw) {
    result[entry.archetype] =
      entry.base;
    assigned += entry.base;
  }

  const remainderOrder =
    [...raw].sort(
      (left, right) => {
        if (
          left.remainder !==
          right.remainder
        ) {
          return (
            right.remainder -
            left.remainder
          );
        }

        return (
          left.policyIndex -
          right.policyIndex
        );
      },
    );

  while (
    assigned <
    TARGETED_SHORTLIST_SIZE
  ) {
    let progressed = false;

    for (
      const entry
      of remainderOrder
    ) {
      if (
        assigned >=
        TARGETED_SHORTLIST_SIZE
      ) {
        break;
      }

      if (
        result[entry.archetype] >=
        TARGETED_SHORTLIST_SOFT_CAP
      ) {
        continue;
      }

      result[entry.archetype] += 1;
      assigned += 1;
      progressed = true;
    }

    if (!progressed) {
      break;
    }
  }

  return result;
}

function fillGlobalCandidates(
  available:
    AcceptedCandidate[],
  selected:
    RankedCandidate[],
  limit: number,
  enforceSoftCap: boolean,
): void {
  while (
    selected.length < limit &&
    available.length > 0
  ) {
    const chosen =
      takeBestGlobalCandidate(
        available,
        selected,
        (candidate) =>
          !enforceSoftCap ||
          rankWithinArchetypeFor(
            selected,
            candidate.candidate
              .archetype,
          ) <
            TARGETED_SHORTLIST_SOFT_CAP,
      );

    if (chosen === null) {
      break;
    }

    selected.push(chosen);
  }
}

function takeBestGlobalCandidate(
  available:
    AcceptedCandidate[],
  selected:
    readonly RankedCandidate[],
  isEligible:
    (candidate: AcceptedCandidate) =>
      boolean,
): RankedCandidate | null {
  let bestAccepted:
    AcceptedCandidate | null = null;

  let bestRanked:
    RankedCandidate | null = null;

  for (
    const accepted
    of available
  ) {
    if (!isEligible(accepted)) {
      continue;
    }

    const ranked =
      rankGlobalCandidate(
        accepted,
        selected,
      );

    if (
      bestRanked === null ||
      compareSelection(
        ranked,
        bestRanked,
      ) < 0
    ) {
      bestAccepted = accepted;
      bestRanked = ranked;
    }
  }

  if (
    bestAccepted === null ||
    bestRanked === null
  ) {
    return null;
  }

  available.splice(
    available.indexOf(bestAccepted),
    1,
  );

  return bestRanked;
}

function rankGlobalCandidate(
  accepted: AcceptedCandidate,
  selected:
    readonly RankedCandidate[],
): RankedCandidate {
  const qualityScore =
    scoreCandidate(accepted);

  const rankWithinArchetype =
    rankWithinArchetypeFor(
      selected,
      accepted.candidate.archetype,
    ) + 1;

  if (selected.length === 0) {
    return {
      accepted,
      qualityScore,
      diversityScore: 0,
      selectionScore:
        qualityScore,
      rankWithinArchetype,
    };
  }

  return rankForSelection(
    {
      accepted,
      qualityScore,
    },
    selected,
    rankWithinArchetype,
  );
}

export function selectShortlist(
  pool: GeneratorPoolReport,
  perArchetype: number,
  difficultyTarget:
    DifficultyTargetType =
      DifficultyTarget.Any,
): readonly RankedCandidate[] {
  if (
    !Number.isInteger(perArchetype) ||
    perArchetype <= 0
  ) {
    throw new RangeError(
      'perArchetype must be a positive integer.',
    );
  }

  const shortlist:
    RankedCandidate[] = [];

  for (
    const archetypeResult
    of pool.archetypes
  ) {
    const archetype =
      archetypeResult
        .stats.archetype;

    const available =
      archetypeResult.accepted.map(
        (accepted) => ({
          accepted,
          qualityScore:
            scoreCandidate(accepted),
        }),
      );

    available.sort(
      difficultyTarget ===
        DifficultyTarget.Any
        ? compareQualityThenSeed
        : (a, b) =>
            compareInitialForTarget(
              a,
              b,
              difficultyTarget,
            ),
    );

    const selected:
      RankedCandidate[] = [];

    while (
      available.length > 0 &&
      selected.length < perArchetype
    ) {
      if (selected.length === 0) {
        const first =
          available.shift();

        if (first === undefined) {
          break;
        }

        selected.push({
          accepted: first.accepted,
          qualityScore:
            first.qualityScore,
          diversityScore: 0,
          selectionScore:
            first.qualityScore,
          rankWithinArchetype: 1,
        });

        continue;
      }

      const requiredSize =
        requiredMissingTwoRoomSize(
          archetype,
          available,
          selected,
          perArchetype,
        );

      const eligible =
        requiredSize === null
          ? available
          : available.filter(
              (entry) =>
                entry.accepted
                  .candidate.size ===
                requiredSize,
            );

      let bestEntry =
        eligible[0];

      let best =
        rankForSelection(
          bestEntry,
          selected,
          selected.length + 1,
        );

      for (
        let index = 1;
        index < eligible.length;
        index += 1
      ) {
        const ranked =
          rankForSelection(
            eligible[index],
            selected,
            selected.length + 1,
          );

        if (
          (
            difficultyTarget ===
              DifficultyTarget.Any
              ? compareSelection(
                  ranked,
                  best,
                )
              : compareSelectionForTarget(
                  ranked,
                  best,
                  difficultyTarget,
                )
          ) < 0
        ) {
          bestEntry =
            eligible[index];
          best = ranked;
        }
      }

      const bestIndex =
        available.indexOf(bestEntry);

      available.splice(
        bestIndex,
        1,
      );

      selected.push(best);
    }

    shortlist.push(...selected);
  }

  return shortlist;
}

const DIFFICULTY_BAND_INDEX = {
  [DifficultyBand.Easy]: 0,
  [DifficultyBand.Medium]: 1,
  [DifficultyBand.Hard]: 2,
  [DifficultyBand.Expert]: 3,
} as const;

const DIFFICULTY_TARGET_CENTER = {
  [DifficultyTarget.Easy]: 12,
  [DifficultyTarget.Medium]: 37,
  [DifficultyTarget.Hard]: 62,
  [DifficultyTarget.Expert]: 87,
} as const;

function difficultyBandDistance(
  accepted: AcceptedCandidate,
  target: DifficultyTargetType,
): number {
  if (target === DifficultyTarget.Any) {
    return 0;
  }

  const band =
    accepted.difficulty.band;

  if (band === DifficultyBand.Unrated) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(
    DIFFICULTY_BAND_INDEX[band] -
      DIFFICULTY_BAND_INDEX[target],
  );
}

function difficultyScoreDistance(
  accepted: AcceptedCandidate,
  target: DifficultyTargetType,
): number {
  if (target === DifficultyTarget.Any) {
    return 0;
  }

  const score =
    accepted.difficulty.score;

  if (score === null) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(
    score -
      DIFFICULTY_TARGET_CENTER[target],
  );
}

function compareInitialForTarget(
  a: QualityEntry,
  b: QualityEntry,
  target: Exclude<
    DifficultyTargetType,
    typeof DifficultyTarget.Any
  >,
): number {
  const aBandDistance =
    difficultyBandDistance(
      a.accepted,
      target,
    );

  const bBandDistance =
    difficultyBandDistance(
      b.accepted,
      target,
    );

  if (aBandDistance !== bBandDistance) {
    return aBandDistance <
      bBandDistance
      ? -1
      : 1;
  }

  if (a.qualityScore !== b.qualityScore) {
    return b.qualityScore -
      a.qualityScore;
  }

  const aScoreDistance =
    difficultyScoreDistance(
      a.accepted,
      target,
    );

  const bScoreDistance =
    difficultyScoreDistance(
      b.accepted,
      target,
    );

  if (aScoreDistance !== bScoreDistance) {
    return aScoreDistance <
      bScoreDistance
      ? -1
      : 1;
  }

  return (
    a.accepted.candidate.seed -
    b.accepted.candidate.seed
  );
}

function compareSelectionForTarget(
  a: RankedCandidate,
  b: RankedCandidate,
  target: Exclude<
    DifficultyTargetType,
    typeof DifficultyTarget.Any
  >,
): number {
  const aBandDistance =
    difficultyBandDistance(
      a.accepted,
      target,
    );

  const bBandDistance =
    difficultyBandDistance(
      b.accepted,
      target,
    );

  if (aBandDistance !== bBandDistance) {
    return aBandDistance <
      bBandDistance
      ? -1
      : 1;
  }

  if (a.selectionScore !== b.selectionScore) {
    return b.selectionScore -
      a.selectionScore;
  }

  if (a.qualityScore !== b.qualityScore) {
    return b.qualityScore -
      a.qualityScore;
  }

  const aScoreDistance =
    difficultyScoreDistance(
      a.accepted,
      target,
    );

  const bScoreDistance =
    difficultyScoreDistance(
      b.accepted,
      target,
    );

  if (aScoreDistance !== bScoreDistance) {
    return aScoreDistance <
      bScoreDistance
      ? -1
      : 1;
  }

  return (
    a.accepted.candidate.seed -
    b.accepted.candidate.seed
  );
}

function singleRoomSpatialDistance(
  sizeA: number,
  roomA: PlannedRoom,
  sizeB: number,
  roomB: PlannedRoom,
): number {
  const maxA =
    sizeA - 3;

  const maxB =
    sizeB - 3;

  const ax =
    roomA.topLeft.x / maxA;

  const ay =
    roomA.topLeft.y / maxA;

  const bx =
    roomB.topLeft.x / maxB;

  const by =
    roomB.topLeft.y / maxB;

  const positionDistance =
    (
      Math.abs(ax - bx) +
      Math.abs(ay - by)
    ) / 2;

  const categoryDistance =
    classifyRoomSpatialCategory(
      sizeA,
      roomA,
    ) ===
    classifyRoomSpatialCategory(
      sizeB,
      roomB,
    )
      ? 0
      : 1;

  return clamp01(
    positionDistance * 0.75 +
    categoryDistance * 0.25,
  );
}

function roomSpatialDistance(
  a: AcceptedCandidate,
  b: AcceptedCandidate,
): number | null {
  const aRooms =
    a.candidate.rooms;

  const bRooms =
    b.candidate.rooms;

  if (
    aRooms.length === 0 ||
    bRooms.length === 0 ||
    aRooms.length !==
      bRooms.length
  ) {
    return null;
  }

  if (
    aRooms.length === 1 &&
    bRooms.length === 1
  ) {
    return singleRoomSpatialDistance(
      a.candidate.size,
      aRooms[0],
      b.candidate.size,
      bRooms[0],
    );
  }

  if (
    aRooms.length === 2 &&
    bRooms.length === 2
  ) {
    const direct =
      (
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[0],
          b.candidate.size,
          bRooms[0],
        ) +
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[1],
          b.candidate.size,
          bRooms[1],
        )
      ) / 2;

    const swapped =
      (
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[0],
          b.candidate.size,
          bRooms[1],
        ) +
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[1],
          b.candidate.size,
          bRooms[0],
        )
      ) / 2;

    return Math.min(
      direct,
      swapped,
    );
  }

  return null;
}

interface QualityEntry {
  accepted: AcceptedCandidate;
  qualityScore: number;
}

function requiredMissingTwoRoomSize(
  archetype:
    GeneratorArchetype,
  available:
    readonly QualityEntry[],
  selected:
    readonly RankedCandidate[],
  perArchetype: number,
): GeneratorBoardSize | null {
  if (
    perArchetype < 2 ||
    (
      archetype !==
        GeneratorArchetype
          .ChestTwoRooms &&
      archetype !==
        GeneratorArchetype
          .MixedTwoRooms
    )
  ) {
    return null;
  }

  const poolSizes =
    new Set(
      available
        .map(
          (entry) =>
            entry.accepted
              .candidate.size,
        )
        .concat(
          selected.map(
            (entry) =>
              entry.accepted
                .candidate.size,
          ),
        ),
    );

  if (
    !poolSizes.has(7) ||
    !poolSizes.has(8)
  ) {
    return null;
  }

  const selectedSizes =
    new Set(
      selected.map(
        (entry) =>
          entry.accepted
            .candidate.size,
      ),
    );

  if (!selectedSizes.has(7)) {
    return 7;
  }

  if (!selectedSizes.has(8)) {
    return 8;
  }

  return null;
}

function rankForSelection(
  entry: QualityEntry,
  selected:
    readonly RankedCandidate[],
  rankWithinArchetype: number,
): RankedCandidate {
  let diversityScore = 1;

  for (
    const chosen
    of selected
  ) {
    diversityScore =
      Math.min(
        diversityScore,
        candidateDistance(
          entry.accepted,
          chosen.accepted,
        ),
      );
  }

  const selectionScore =
    roundScore(
      entry.qualityScore +
        diversityScore * 6,
    );

  return {
    accepted: entry.accepted,
    qualityScore:
      entry.qualityScore,
    diversityScore:
      roundScore(diversityScore),
    selectionScore,
    rankWithinArchetype,
  };
}

function compareQualityThenSeed(
  a: QualityEntry,
  b: QualityEntry,
): number {
  if (
    a.qualityScore !==
    b.qualityScore
  ) {
    return (
      b.qualityScore -
      a.qualityScore
    );
  }

  return (
    a.accepted.candidate.seed -
    b.accepted.candidate.seed
  );
}

function compareSelection(
  a: RankedCandidate,
  b: RankedCandidate,
): number {
  if (
    a.selectionScore !==
    b.selectionScore
  ) {
    return (
      b.selectionScore -
      a.selectionScore
    );
  }

  if (
    a.qualityScore !==
    b.qualityScore
  ) {
    return (
      b.qualityScore -
      a.qualityScore
    );
  }

  return (
    a.accepted.candidate.seed -
    b.accepted.candidate.seed
  );
}

function wallMaskDistance(
  a: AcceptedCandidate,
  b: AcceptedCandidate,
): number {
  if (
    a.candidate.size !==
    b.candidate.size
  ) {
    return 1;
  }

  const aSolution =
    a.candidate.level.solution;

  const bSolution =
    b.candidate.level.solution;

  const size =
    a.candidate.size;

  let differentCells = 0;
  const totalCells =
    size * size;

  for (
    let y = 0;
    y < size;
    y += 1
  ) {
    for (
      let x = 0;
      x < size;
      x += 1
    ) {
      if (
        aSolution[y][x] !==
        bSolution[y][x]
      ) {
        differentCells += 1;
      }
    }
  }

  return clamp01(
    differentCells /
      totalCells,
  );
}

function scaledPenalty(
  value: number,
  healthyThreshold: number,
  warningThreshold: number,
  maxPenalty: number,
): number {
  if (
    value <= healthyThreshold
  ) {
    return 0;
  }

  if (
    value >= warningThreshold
  ) {
    return maxPenalty;
  }

  return (
    (
      value -
      healthyThreshold
    ) /
    (
      warningThreshold -
      healthyThreshold
    )
  ) * maxPenalty;
}

function inverseScaledPenalty(
  value: number,
  warningThreshold: number,
  healthyThreshold: number,
  maxPenalty: number,
): number {
  if (
    value >= healthyThreshold
  ) {
    return 0;
  }

  if (
    value <= warningThreshold
  ) {
    return maxPenalty;
  }

  return (
    (
      healthyThreshold -
      value
    ) /
    (
      healthyThreshold -
      warningThreshold
    )
  ) * maxPenalty;
}

function clamp01(
  value: number,
): number {
  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}

function roundScore(
  value: number,
): number {
  return (
    Math.round(
      value * 1000,
    ) / 1000
  );
}
