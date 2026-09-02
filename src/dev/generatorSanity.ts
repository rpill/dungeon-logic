import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

import {
  deriveClues,
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';

import {
  createCandidatePool,
  evaluateCandidate,
} from '../puzzle/generator/CandidateFactory';

import {
  candidateDistance,
  scoreCandidate,
  selectShortlist,
} from '../puzzle/generator/CandidateRanker';

import {
  level001,
} from '../data/levels/level001';

import {
  analyzeLevelQuality,
} from '../puzzle/quality/LevelQualityAnalyzer';

import {
  solveLevel,
} from '../puzzle/solver/PuzzleSolver';

import type {
  LevelDefinition,
} from '../puzzle/types';

import {
  GeneratorArchetype,
  type AcceptedCandidate,
  type GeneratedCandidate,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorBoardSize,
  type GeneratorConfig,
  type GeneratorPoolReport,
} from '../puzzle/generator/types';

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

function sequence(
  seed: number,
): readonly number[] {
  const random =
    new SeededRandom(seed);

  return [
    random.nextUint32(),
    random.nextUint32(),
    random.nextUint32(),
    random.nextUint32(),
  ];
}

function findGeneratedMonsterOnly():
  Extract<
    ReturnType<
      typeof generateCandidate
    >,
    { ok: true }
  > {
  for (
    let seed = 1;
    seed <= 500;
    seed += 1
  ) {
    const result =
      generateCandidate({
        archetype:
          GeneratorArchetype.MonsterOnly,
        size: 7,
        seed,
      });

    if (result.ok) {
      return result;
    }
  }

  throw new Error(
    'Expected a Monster-only candidate within deterministic seed range.',
  );
}

function findCandidateForArchetype(
  archetype: GeneratorArchetypeType,
  size: GeneratorBoardSize,
): GeneratedCandidate {
  for (
    let seed = 1;
    seed <= 2000;
    seed += 1
  ) {
    const result =
      generateCandidate({
        archetype,
        size,
        seed,
      });

    if (result.ok) {
      return result.candidate;
    }
  }

  throw new Error(
    `Expected generated candidate for ${archetype} ${size}x${size}.`,
  );
}

function runRngChecks(): void {
  const first =
    sequence(123456);

  const second =
    sequence(123456);

  const different =
    sequence(123457);

  assert(
    JSON.stringify(first) ===
      JSON.stringify(second),
    'Same RNG seed must reproduce the same sequence.',
  );

  assert(
    JSON.stringify(first) !==
      JSON.stringify(different),
    'Different RNG seeds must change the sequence.',
  );

  assert(
    deriveCandidateSeed(
      123456,
      'monster-only',
      7,
    ) ===
      deriveCandidateSeed(
        123456,
        'monster-only',
        7,
      ),
    'Candidate seed derivation must be deterministic.',
  );

  assert(
    deriveCandidateSeed(
      123456,
      'monster-only',
      7,
    ) !==
      deriveCandidateSeed(
        123456,
        'monster-only',
        8,
      ),
    'Attempt number must affect candidate seed.',
  );
}

function runMonsterOnlyChecks(): void {
  const generated =
    findGeneratedMonsterOnly();

  const repeated =
    generateCandidate({
      archetype:
        GeneratorArchetype.MonsterOnly,
      size:
        generated.candidate.size,
      seed:
        generated.candidate.seed,
    });

  assert(
    repeated.ok,
    'Previously successful candidate seed must reproduce.',
  );

  if (repeated.ok) {
    assert(
      JSON.stringify(
        repeated.candidate.level,
      ) ===
        JSON.stringify(
          generated.candidate.level,
        ),
      'Candidate generation must be deterministic.',
    );
  }

  assert(
    generated.candidate.level.chests.length ===
      0,
    'Monster-only candidate must have no Chest.',
  );

  assert(
    generated.candidate.level.monsters.length >
      0,
    'Monster-only candidate must contain at least one Monster.',
  );

  const clues =
    deriveClues(
      generated.candidate.level.solution,
    );

  assert(
    JSON.stringify(
      clues.rowClues,
    ) ===
      JSON.stringify(
        generated.candidate.level.rowClues,
      ),
    'Generated row clues must come from solution.',
  );

  assert(
    JSON.stringify(
      clues.columnClues,
    ) ===
      JSON.stringify(
        generated.candidate.level.columnClues,
      ),
    'Generated column clues must come from solution.',
  );
}

function runArchetypeChecks(): void {
  const oneRoomChestOnly =
    findCandidateForArchetype(
      GeneratorArchetype.ChestOneRoom,
      7,
    );

  assert(
    oneRoomChestOnly.rooms.length === 1,
    'Chest-one-room candidate must plan exactly one room.',
  );

  assert(
    oneRoomChestOnly.level.chests.length ===
      1,
    'Chest-one-room candidate must contain exactly one Chest.',
  );

  assert(
    oneRoomChestOnly.level.monsters.length ===
      0,
    'Chest-one-room candidate must contain no Monsters.',
  );

  const twoRoomChestOnly =
    findCandidateForArchetype(
      GeneratorArchetype.ChestTwoRooms,
      8,
    );

  assert(
    twoRoomChestOnly.rooms.length === 2,
    'Chest-two-rooms candidate must plan exactly two rooms.',
  );

  assert(
    twoRoomChestOnly.level.chests.length ===
      2,
    'Chest-two-rooms candidate must contain exactly two Chests.',
  );

  assert(
    twoRoomChestOnly.level.monsters.length ===
      0,
    'Chest-two-rooms candidate must contain no Monsters.',
  );

  const mixedOne =
    findCandidateForArchetype(
      GeneratorArchetype.MixedOneRoom,
      7,
    );

  assert(
    mixedOne.rooms.length === 1 &&
      mixedOne.level.chests.length === 1 &&
      mixedOne.level.monsters.length > 0,
    'Mixed-one-room candidate must contain one room, one Chest, and Monsters.',
  );

  const mixedTwo =
    findCandidateForArchetype(
      GeneratorArchetype.MixedTwoRooms,
      8,
    );

  assert(
    mixedTwo.rooms.length === 2 &&
      mixedTwo.level.chests.length === 2 &&
      mixedTwo.level.monsters.length > 0,
    'Mixed-two-rooms candidate must contain two rooms, two Chests, and Monsters.',
  );

  const unsupported =
    generateCandidate({
      archetype:
        GeneratorArchetype.ChestTwoRooms,
      size: 6,
      seed: 1,
    });

  assert(
    !unsupported.ok,
    'Two-room archetype must reject unsupported 6x6 size.',
  );

  for (
    const candidate
    of [
      oneRoomChestOnly,
      twoRoomChestOnly,
      mixedOne,
      mixedTwo,
    ]
  ) {
    assertFixedObjectsOpen(
      candidate,
    );

    assertChestDistanceGuideline(
      candidate,
    );
  }
}

function assertFixedObjectsOpen(
  candidate: GeneratedCandidate,
): void {
  for (
    const monster
    of candidate.level.monsters
  ) {
    assert(
      candidate.level.solution[
        monster.y
      ][monster.x] === '.',
      'Monster must be OPEN in generated solution.',
    );
  }

  for (
    const chest
    of candidate.level.chests
  ) {
    assert(
      candidate.level.solution[
        chest.y
      ][chest.x] === '.',
      'Chest must be OPEN in generated solution.',
    );
  }
}

function assertChestDistanceGuideline(
  candidate: GeneratedCandidate,
): void {
  for (
    let roomIndex = 0;
    roomIndex <
      candidate.rooms.length;
    roomIndex += 1
  ) {
    const room =
      candidate.rooms[roomIndex];

    const chest =
      candidate.level.chests[
        roomIndex
      ];

    assert(
      chest !== undefined,
      `Room ${roomIndex} must have a corresponding Chest.`,
    );

    if (chest === undefined) {
      continue;
    }

    const distance =
      Math.abs(
        chest.x -
          room.internalEntrance.x,
      ) +
      Math.abs(
        chest.y -
          room.internalEntrance.y,
      );

    assert(
      distance >= 2,
      'Chest must be at least two orthogonal steps from internal room entrance.',
    );
  }
}


function runAcceptancePipelineChecks(): void {
  const accepted =
    findAcceptedGeneratedCandidate();

  assert(
    accepted !== null,
    'Expected at least one generated candidate to pass the full acceptance pipeline.',
  );

  const invalidCandidate =
    wrapGeneratedFixture({
      id: 'generator-invalid-open-4x4',
      width: 4,
      height: 4,
      rowClues: [0, 0, 0, 0],
      columnClues: [0, 0, 0, 0],
      monsters: [],
      chests: [],
      blockers: [],
      doors: [],
      solution: [
        '....',
        '....',
        '....',
        '....',
      ],
    });

  const invalidEvaluation =
    evaluateCandidate(
      invalidCandidate,
    );

  assert(
    invalidEvaluation.status ===
      'invalid',
    `Open 4x4 fixture must be rejected as invalid, got ${invalidEvaluation.status}.`,
  );

  const ambiguousBase:
    LevelDefinition = {
      id:
        'generator-non-unique-4x4',
      width: 4,
      height: 4,
      rowClues: [1, 1, 1, 1],
      columnClues: [1, 1, 1, 1],
      monsters: [],
      chests: [],
      blockers: [],
      doors: [],
      solution: [
        '....',
        '....',
        '....',
        '....',
      ],
    };

  const ambiguousSolve =
    solveLevel(
      ambiguousBase,
    );

  assert(
    ambiguousSolve.solutionCount === 2,
    'Ambiguous fixture must still have 2+ solutions.',
  );

  assert(
    ambiguousSolve.firstSolution !== null,
    'Ambiguous fixture must expose a valid first solution.',
  );

  if (
    ambiguousSolve.firstSolution ===
    null
  ) {
    throw new Error(
      'Ambiguous fixture unexpectedly has no first solution.',
    );
  }

  const ambiguousCandidate =
    wrapGeneratedFixture({
      ...ambiguousBase,
      solution:
        ambiguousSolve.firstSolution,
    });

  const ambiguousEvaluation =
    evaluateCandidate(
      ambiguousCandidate,
    );

  assert(
    ambiguousEvaluation.status ===
      'non-unique',
    `Valid ambiguous fixture must be rejected as non-unique, got ${ambiguousEvaluation.status}.`,
  );

  const hardQualityReport =
    analyzeLevelQuality(level001);

  assert(
    solveLevel(level001).solutionCount ===
      1,
    'level001 must remain unique before using it as hard-quality fixture.',
  );

  assert(
    !hardQualityReport.passes,
    'level001 must fail the current hard authored quality gate.',
  );

  const hardQualityEvaluation =
    evaluateCandidate(
      wrapGeneratedFixture(
        level001,
      ),
    );

  assert(
    hardQualityEvaluation.status ===
      'hard-quality',
    `Valid unique level001 must be rejected as hard-quality, got ${hardQualityEvaluation.status}.`,
  );

  const warningLevel:
    LevelDefinition = {
      id:
        'generator-geometry-warning-historical-level011',
      width: 8,
      height: 8,
      rowClues: [
        5, 5, 4, 5,
        4, 2, 2, 5,
      ],
      columnClues: [
        5, 5, 1, 4,
        2, 5, 5, 5,
      ],
      monsters: [],
      chests: [
        { x: 0, y: 7 },
        { x: 2, y: 0 },
      ],
      blockers: [],
      doors: [],
      solution: [
        '##...###',
        '##...###',
        '##....##',
        '#####...',
        '##...##.',
        '...#.#..',
        '...#...#',
        '...#####',
      ],
    };

  const warningSolve =
    solveLevel(
      warningLevel,
    );

  assert(
    warningSolve.solutionCount === 1,
    'Historical compact level011 fixture must remain unique.',
  );

  const warningQuality =
    analyzeLevelQuality(
      warningLevel,
    );

  assert(
    warningQuality.passes,
    'Geometry-warning fixture must pass the hard quality gate.',
  );

  assert(
    warningQuality.warnings.length > 0,
    'Geometry-warning fixture must produce at least one soft warning.',
  );

  const warningEvaluation =
    evaluateCandidate(
      wrapGeneratedFixture(
        warningLevel,
      ),
    );

  assert(
    warningEvaluation.status ===
      'geometry-warning',
    `Valid unique compact fixture must be rejected as geometry-warning, got ${warningEvaluation.status}.`,
  );
}

function findAcceptedGeneratedCandidate():
  GeneratedCandidate | null {
  const searches:
    readonly {
      archetype:
        GeneratorArchetypeType;
      size:
        GeneratorBoardSize;
    }[] = [
      {
        archetype:
          GeneratorArchetype.MonsterOnly,
        size: 7,
      },
      {
        archetype:
          GeneratorArchetype.ChestOneRoom,
        size: 7,
      },
      {
        archetype:
          GeneratorArchetype.MixedOneRoom,
        size: 7,
      },
      {
        archetype:
          GeneratorArchetype.ChestTwoRooms,
        size: 8,
      },
      {
        archetype:
          GeneratorArchetype.MixedTwoRooms,
        size: 8,
      },
    ];

  for (const search of searches) {
    for (
      let seed = 1;
      seed <= 5000;
      seed += 1
    ) {
      const generated =
        generateCandidate({
          archetype:
            search.archetype,
          size:
            search.size,
          seed,
        });

      if (!generated.ok) {
        continue;
      }

      const evaluation =
        evaluateCandidate(
          generated.candidate,
        );

      if (
        evaluation.status ===
        'accepted'
      ) {
        return generated.candidate;
      }
    }
  }

  return null;
}

function wrapGeneratedFixture(
  level: LevelDefinition,
): GeneratedCandidate {
  return {
    id: level.id,
    seed: 0,
    archetype:
      GeneratorArchetype.MonsterOnly,
    size:
      level.width === 6 ||
      level.width === 7 ||
      level.width === 8
        ? level.width
        : 6,
    rooms: [],
    level,
  };
}


function runCandidatePoolChecks(): void {
  expectThrow(
    () => {
      createCandidatePool({
        masterSeed: 1,
        acceptedPerArchetype: 0,
        shortlistPerArchetype: 1,
        maxAttemptsPerArchetype: 10,
      });
    },
    'acceptedPerArchetype = 0 must be rejected.',
  );

  expectThrow(
    () => {
      createCandidatePool({
        masterSeed: 1,
        acceptedPerArchetype: 1,
        shortlistPerArchetype: 2,
        maxAttemptsPerArchetype: 10,
      });
    },
    'shortlist target above accepted target must be rejected.',
  );

  const smallConfig:
    GeneratorConfig = {
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 5000,
    };

  const first =
    createCandidatePool(
      smallConfig,
    );

  assert(
    first.completed,
    'Small deterministic pool must complete.',
  );

  assert(
    first.accepted.length === 5,
    'Small pool must contain one accepted candidate per archetype.',
  );

  assert(
    first.archetypes.length === 5,
    'Small pool must report all five archetypes.',
  );

  for (
    const archetypeResult
    of first.archetypes
  ) {
    assert(
      archetypeResult.accepted.length === 1,
      `${archetypeResult.stats.archetype} must contribute exactly one accepted candidate.`,
    );

    assert(
      archetypeResult.stats.accepted === 1,
      `${archetypeResult.stats.archetype} accepted counter must equal one.`,
    );

    assert(
      !archetypeResult.exhausted,
      `${archetypeResult.stats.archetype} must not exhaust the attempt budget.`,
    );

    assert(
      archetypeResult.stats.attempts >= 1 &&
        archetypeResult.stats.attempts <=
          smallConfig.maxAttemptsPerArchetype,
      `${archetypeResult.stats.archetype} attempt count must stay within configured bounds.`,
    );
  }

  const second =
    createCandidatePool(
      smallConfig,
    );

  assert(
    JSON.stringify(first) ===
      JSON.stringify(second),
    'Repeated pool generation must be byte-equivalent after JSON.stringify.',
  );
}

function expectThrow(
  action: () => void,
  message: string,
): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(
    threw,
    message,
  );
}


function runRankingChecks(): void {
  const healthy =
    createRankingFixture({
      seed: 101,
      size: 7,
    });

  assert(
    scoreCandidate(healthy) === 100,
    'Healthy middle-range candidate must score 100.',
  );

  const lowerWallDensity =
    createRankingFixture({
      seed: 102,
      size: 7,
      metrics: {
        wallDensity: 0.20,
      },
    });

  assert(
    scoreCandidate(
      lowerWallDensity,
    ) === 100,
    'Lowering wall density below healthy threshold must not increase score above 100.',
  );

  const thickWalls =
    createRankingFixture({
      seed: 103,
      size: 7,
      metrics: {
        thickWallCellRatio: 0.60,
      },
    });

  assert(
    scoreCandidate(thickWalls) < 100,
    'Thick-wall ratio above healthy threshold must reduce score.',
  );

  const weakBoundary =
    createRankingFixture({
      seed: 104,
      size: 7,
      metrics: {
        wallOpenBoundaryPerWall: 1.30,
      },
    });

  assert(
    scoreCandidate(weakBoundary) < 100,
    'Low wall/open boundary must reduce score.',
  );

  const largeComponent =
    createRankingFixture({
      seed: 105,
      size: 7,
      metrics: {
        largestWallComponentRatio: 0.75,
      },
    });

  assert(
    scoreCandidate(
      largeComponent,
    ) < 100,
    'Oversized largest wall component must reduce score.',
  );

  const nearFullLines =
    createRankingFixture({
      seed: 106,
      size: 7,
      metrics: {
        nearFullWallLineCount: 3,
      },
    });

  assert(
    scoreCandidate(
      nearFullLines,
    ) === 96,
    'Three near-full lines must apply the bounded four-point penalty.',
  );

  const objectBonus =
    createRankingFixture({
      seed: 107,
      size: 7,
      metrics: {
        objectAssistedForcedWallCount:
          100,
      },
    });

  assert(
    scoreCandidate(objectBonus) === 103,
    'Object-assisted bonus must be capped at three points.',
  );

  assert(
    candidateDistance(
      healthy,
      healthy,
    ) === 0,
    'Candidate distance to itself must be zero.',
  );

  const distant =
    createRankingFixture({
      seed: 108,
      size: 8,
      metrics: {
        wallDensity: 0.20,
        thickWallCellRatio: 0,
        wallOpenBoundaryPerWall: 2.40,
        largestWallComponentRatio: 0.05,
      },
      monsterCount: 4,
      fill: '#',
    });

  const distance =
    candidateDistance(
      healthy,
      distant,
    );

  assert(
    distance > 0 &&
      distance <= 1,
    'Candidate distance must stay in (0, 1] for distinct fixtures.',
  );

  runShortlistDiversityChecks();
}

function runShortlistDiversityChecks(): void {
  const candidateA =
    createRankingFixture({
      seed: 1,
      size: 7,
    });

  const candidateB =
    createRankingFixture({
      seed: 2,
      size: 7,
    });

  const candidateC =
    createRankingFixture({
      seed: 3,
      size: 8,
      metrics: {
        wallDensity: 0.20,
        thickWallCellRatio: 0,
        wallOpenBoundaryPerWall: 2.40,
        largestWallComponentRatio: 0.05,
        nearFullWallLineCount: 2,
      },
      monsterCount: 4,
      fill: '#',
    });

  const candidateD =
    createRankingFixture({
      seed: 4,
      size: 6,
      metrics: {
        wallDensity: 0.80,
        thickWallCellRatio: 0.90,
        wallOpenBoundaryPerWall: 0.50,
        largestWallComponentRatio: 0.95,
        nearFullWallLineCount: 8,
      },
      monsterCount: 4,
      fill: '#',
    });

  const pool =
    createRankingPool([
      candidateA,
      candidateB,
      candidateC,
      candidateD,
    ]);

  const shortlist =
    selectShortlist(
      pool,
      2,
    );

  assert(
    shortlist.length === 2,
    'Two-entry ranking fixture must produce two shortlisted candidates.',
  );

  assert(
    shortlist[0].accepted.candidate.seed ===
      candidateA.candidate.seed,
    'Best raw-quality candidate with lowest seed must be selected first.',
  );

  assert(
    shortlist[1].accepted.candidate.seed ===
      candidateC.candidate.seed,
    'A slightly lower-quality but clearly novel candidate must beat an almost identical candidate.',
  );

  assert(
    shortlist.every(
      (ranked) =>
        ranked.accepted.candidate.seed !==
        candidateD.candidate.seed,
    ),
    'Very low quality candidate must not win solely from novelty.',
  );
}

function createRankingFixture(
  input: {
    seed: number;
    size: GeneratorBoardSize;
    metrics?: Partial<
      AcceptedCandidate[
        'quality'
      ]['metrics']
    >;
    monsterCount?: number;
    fill?: '#' | '.';
  },
): AcceptedCandidate {
  const size =
    input.size;

  const fill =
    input.fill ?? '.';

  const solution =
    Array.from(
      { length: size },
      () => fill.repeat(size),
    );

  const monsters =
    Array.from(
      {
        length:
          input.monsterCount ?? 0,
      },
      (_, index) => ({
        x: index % size,
        y: Math.floor(
          index / size,
        ),
      }),
    );

  const candidate:
    GeneratedCandidate = {
      id:
        `ranking-${input.seed}`,
      seed: input.seed,
      archetype:
        GeneratorArchetype.MonsterOnly,
      size,
      rooms: [],
      level: {
        id:
          `ranking-${input.seed}`,
        width: size,
        height: size,
        rowClues:
          Array.from(
            { length: size },
            () => 0,
          ),
        columnClues:
          Array.from(
            { length: size },
            () => 0,
          ),
        monsters,
        chests: [],
        blockers: [],
        doors: [],
        solution,
      },
    };

  return {
    candidate,
    solutionCount: 1,
    quality: {
      passes: true,
      issues: [],
      warnings: [],
      metrics: {
        wallDensity: 0.40,
        fullWallLineCount: 0,
        nearFullWallLineCount: 0,
        solidWall3x3Count: 0,
        thickWallCellCount: 0,
        thickWallCellRatio: 0.20,
        wallOpenBoundaryEdgeCount: 24,
        wallOpenBoundaryPerWall: 1.60,
        largestWallComponentSize: 8,
        largestWallComponentRatio: 0.40,
        largestWallComponentPerimeterPerWall:
          2,
        clueOnlyForcedWallCount: 0,
        clueOnlyForcedWallRatio: 0,
        objectAwareForcedWallCount: 0,
        objectAssistedForcedWallCount: 0,
        ...input.metrics,
      },
    },
  };
}

function createRankingPool(
  accepted:
    readonly AcceptedCandidate[],
): GeneratorPoolReport {
  return {
    masterSeed: 1,
    config: {
      masterSeed: 1,
      acceptedPerArchetype:
        accepted.length,
      shortlistPerArchetype: 2,
      maxAttemptsPerArchetype:
        accepted.length,
    },
    archetypes: [
      {
        stats: {
          archetype:
            GeneratorArchetype.MonsterOnly,
          attempts:
            accepted.length,
          accepted:
            accepted.length,
          rejectionCounts: {
            'generation-failed': 0,
            invalid: 0,
            'non-unique': 0,
            'hard-quality': 0,
            'geometry-warning': 0,
          },
        },
        accepted,
        rejectionSamples: [],
        exhausted: false,
      },
    ],
    accepted,
    completed: true,
  };
}

runRngChecks();
runMonsterOnlyChecks();
runArchetypeChecks();
runAcceptancePipelineChecks();
runCandidatePoolChecks();
runRankingChecks();

console.info(
  '[Dungeon Logic] Generator sanity: generation + acceptance + pool + ranking RED checks passed',
);
