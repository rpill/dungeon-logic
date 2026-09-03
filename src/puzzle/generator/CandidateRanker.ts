import {
  getGeneratorMonsterPolicy,
} from './CandidateFactory';

import {
  classifyRoomSpatialCategory,
} from './CandidateGenerator';

import {
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

export function selectShortlist(
  pool: GeneratorPoolReport,
  perArchetype: number,
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
      compareQualityThenSeed,
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
          compareSelection(
            ranked,
            best,
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
