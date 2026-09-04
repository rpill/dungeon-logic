import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DifficultyBand,
  DifficultyTarget,
  type DifficultyProfile,
} from '../puzzle/difficulty/types';

import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

import {
  RoomSpatialCategory,
  classifyRoomSpatialCategory,
  deriveClues,
  generateCandidate,
  getHallwayDeadEnds,
  getRoomSpatialCategories,
} from '../puzzle/generator/CandidateGenerator';

import {
  chooseArchetypeAttemptSize,
  createCandidatePool,
  evaluateCandidate,
  getGeneratorMonsterPolicy,
  isArchetypePoolComplete,
} from '../puzzle/generator/CandidateFactory';

import {
  candidateDistance,
  scoreCandidate,
  selectShortlist,
} from '../puzzle/generator/CandidateRanker';

import {
  buildGeneratorRunReport,
  createSerializableReport,
  formatShortlistMarkdown,
  parseGeneratorCliArgs,
  parseMasterSeed,
  writeGeneratorOutputs,
} from './generateCandidates';

import {
  level001,
} from '../data/levels/level001';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import {
  analyzeLevelQuality,
} from '../puzzle/quality/LevelQualityAnalyzer';

import {
  solveLevel,
} from '../puzzle/solver/PuzzleSolver';

import {
  CellState,
  type LevelDefinition,
} from '../puzzle/types';

import {
  ALLOWED_SIZES,
  ALL_GENERATOR_ARCHETYPES,
  GeneratorArchetype,
  RejectionReason,
  type AcceptedCandidate,
  type GeneratedCandidate,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorBoardSize,
  type GeneratorConfig,
  type GeneratorPoolReport,
  type PlannedRoom,
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

  if (accepted === null) {
    throw new Error(
      'Accepted fixture unexpectedly missing.',
    );
  }

  const acceptedEvaluation =
    evaluateCandidate(accepted);

  assert(
    acceptedEvaluation.status ===
      'accepted' &&
      acceptedEvaluation.accepted
        .difficulty.version === 1,
    'Accepted candidate must carry Difficulty v1.',
  );

  assert(
    !Object.values(
      RejectionReason,
    ).includes(
      'difficulty' as RejectionReason,
    ),
    'Difficulty must not become a generator rejection reason.',
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
    first.accepted.length === 7,
    'acceptedPerArchetype=1 must yield 7 total accepted candidates under A+ (1+1+2+1+2).',
  );

  assert(
    first.archetypes.length === 5,
    'Small pool must report all five archetypes.',
  );

  for (
    const archetypeResult
    of first.archetypes
  ) {
    const isTwoRoom =
      archetypeResult.stats.archetype ===
        GeneratorArchetype.ChestTwoRooms ||
      archetypeResult.stats.archetype ===
        GeneratorArchetype.MixedTwoRooms;

    const expectedAccepted =
      isTwoRoom ? 2 : 1;

    assert(
      archetypeResult.accepted.length ===
        expectedAccepted,
      `${archetypeResult.stats.archetype} reduced A+ accepted count is wrong.`,
    );

    assert(
      archetypeResult.stats.accepted ===
        expectedAccepted,
      `${archetypeResult.stats.archetype} accepted counter must match the A+ pool size.`,
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

    if (isTwoRoom) {
      const sizes =
        new Set(
          archetypeResult.accepted.map(
            (accepted) =>
              accepted.candidate.size,
          ),
        );

      assert(
        sizes.has(7) &&
          sizes.has(8),
        `${archetypeResult.stats.archetype} A+ reduced pool must contain 7x7 and 8x8.`,
      );

      assert(
        archetypeResult.accepted.length <=
          smallConfig.acceptedPerArchetype + 1,
        `${archetypeResult.stats.archetype} A+ must add at most one accepted candidate beyond target.`,
      );
    }
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
  runRankingV12Checks();
  runDifficultyTargetRankingChecks();
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


function runRankingV12Checks(): void {
  const roomA =
    roomFixture(0, 0);

  const roomB =
    roomFixture(0, 2);

  const roomC =
    roomFixture(2, 2);

  const oneRoomSameA =
    createRankingFixture({
      seed: 8101,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestOneRoom,
      rooms: [roomA],
    });

  const oneRoomSameB =
    createRankingFixture({
      seed: 8102,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestOneRoom,
      rooms: [roomA],
    });

  const oneRoomMoved =
    createRankingFixture({
      seed: 8103,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestOneRoom,
      rooms: [roomC],
    });

  assert(
    candidateDistance(
      oneRoomSameA,
      oneRoomSameB,
    ) <
      candidateDistance(
        oneRoomSameA,
        oneRoomMoved,
      ),
    'Moved/category-different Treasure Room must increase candidate distance.',
  );

  const pairAB =
    createRankingFixture({
      seed: 8201,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomA,
        roomB,
      ],
    });

  const pairBA =
    createRankingFixture({
      seed: 8202,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomB,
        roomA,
      ],
    });

  assert(
    candidateDistance(
      pairAB,
      pairBA,
    ) === 0,
    'Swapping two-room metadata order must not create fake candidate distance.',
  );

  const best8 =
    createRankingFixture({
      seed: 8301,
      size: 8,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 0),
        roomFixture(5, 5),
      ],
    });

  const second8 =
    createRankingFixture({
      seed: 8302,
      size: 8,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 2),
        roomFixture(5, 5),
      ],
    });

  const seven =
    createRankingFixture({
      seed: 8303,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 0),
        roomFixture(4, 4),
      ],
      metrics: {
        nearFullWallLineCount: 3,
      },
    });

  const thirdChoice =
    createRankingFixture({
      seed: 8304,
      size: 8,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(2, 0),
        roomFixture(5, 3),
      ],
    });

  const twoRoomPool =
    createRankingPool([
      best8,
      second8,
      seven,
      thirdChoice,
    ]);

  const twoRoomShortlist =
    selectShortlist(
      twoRoomPool,
      3,
    );

  assert(
    twoRoomShortlist.length === 3,
    'Two-room shortlist must still contain three candidates.',
  );

  const selectedSizes =
    new Set(
      twoRoomShortlist.map(
        (ranked) =>
          ranked.accepted
            .candidate.size,
      ),
    );

  assert(
    selectedSizes.has(7) &&
      selectedSizes.has(8),
    'Two-room shortlist of at least two slots must represent 7x7 and 8x8.',
  );
}

function runDifficultyTargetRankingChecks(): void {
  const easy =
    createRankingFixture({
      seed: 9101,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Easy,
          12,
        ),
    });

  const medium =
    createRankingFixture({
      seed: 9102,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Medium,
          37,
        ),
    });

  const hard =
    createRankingFixture({
      seed: 9103,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Hard,
          62,
        ),
    });

  const expert =
    createRankingFixture({
      seed: 9104,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Expert,
          87,
        ),
    });

  const bandPool =
    createRankingPool([
      easy,
      medium,
      hard,
      expert,
    ]);

  for (
    const target
    of [
      DifficultyTarget.Easy,
      DifficultyTarget.Medium,
      DifficultyTarget.Hard,
      DifficultyTarget.Expert,
    ] as const
  ) {
    const selected =
      selectShortlist(
        bandPool,
        1,
        target,
      );

    assert(
      selected[0].accepted
        .difficulty.band === target,
      `${target} target must prefer an exact-band candidate.`,
    );
  }

  const qualityMedium =
    createRankingFixture({
      seed: 9201,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Medium,
          37,
        ),
    });

  const weakerExpert =
    createRankingFixture({
      seed: 9202,
      size: 7,
      metrics: {
        nearFullWallLineCount: 2,
      },
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Expert,
          87,
        ),
    });

  const fallback =
    selectShortlist(
      createRankingPool([
        weakerExpert,
        qualityMedium,
      ]),
      1,
      DifficultyTarget.Hard,
    );

  assert(
    fallback[0].accepted
      .candidate.seed ===
      qualityMedium.candidate.seed,
    'Equal band distance must preserve existing quality preference before score-center distance.',
  );

  const centerMedium =
    createRankingFixture({
      seed: 9301,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Medium,
          45,
        ),
    });

  const centerExpert =
    createRankingFixture({
      seed: 9302,
      size: 7,
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Expert,
          78,
        ),
    });

  const centerChoice =
    selectShortlist(
      createRankingPool([
        centerMedium,
        centerExpert,
      ]),
      1,
      DifficultyTarget.Hard,
    );

  assert(
    centerChoice[0].accepted
      .candidate.seed ===
      centerExpert.candidate.seed,
    'Score-center proximity must break a later tie inside equal band distance.',
  );

  const unrated =
    createRankingFixture({
      seed: 9401,
      size: 7,
      metrics: {
        objectAssistedForcedWallCount:
          100,
      },
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Unrated,
          null,
        ),
    });

  const rated =
    createRankingFixture({
      seed: 9402,
      size: 7,
      metrics: {
        nearFullWallLineCount: 3,
      },
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Easy,
          12,
        ),
    });

  const unratedFallback =
    selectShortlist(
      createRankingPool([
        unrated,
        rated,
      ]),
      1,
      DifficultyTarget.Expert,
    );

  assert(
    unratedFallback[0].accepted
      .candidate.seed ===
      rated.candidate.seed,
    'Specific targets must rank rated candidates ahead of unrated candidates.',
  );

  const anyPool =
    createRankingPool([
      easy,
      medium,
      hard,
      expert,
    ]);

  const legacyAny =
    selectShortlist(
      anyPool,
      3,
    );

  const explicitAny =
    selectShortlist(
      anyPool,
      3,
      DifficultyTarget.Any,
    );

  assert(
    JSON.stringify(
      legacyAny.map(
        (entry) =>
          entry.accepted
            .candidate.seed,
      ),
    ) ===
      JSON.stringify(
        explicitAny.map(
          (entry) =>
            entry.accepted
              .candidate.seed,
        ),
      ),
    'Explicit any target must preserve the legacy shortlist ordering.',
  );

  const hard8a =
    createRankingFixture({
      seed: 9501,
      size: 8,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 0),
        roomFixture(5, 5),
      ],
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Hard,
          62,
        ),
    });

  const hard8b =
    createRankingFixture({
      seed: 9502,
      size: 8,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 2),
        roomFixture(5, 5),
      ],
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Hard,
          63,
        ),
    });

  const medium7 =
    createRankingFixture({
      seed: 9503,
      size: 7,
      archetype:
        GeneratorArchetype
          .ChestTwoRooms,
      rooms: [
        roomFixture(0, 0),
        roomFixture(4, 4),
      ],
      difficulty:
        createDifficultyFixture(
          DifficultyBand.Medium,
          37,
        ),
    });

  const targetedTwoRoom =
    selectShortlist(
      createRankingPool([
        hard8a,
        hard8b,
        medium7,
      ]),
      3,
      DifficultyTarget.Hard,
    );

  const targetedSizes =
    new Set(
      targetedTwoRoom.map(
        (entry) =>
          entry.accepted
            .candidate.size,
      ),
    );

  assert(
    targetedSizes.has(7) &&
      targetedSizes.has(8),
    'Two-room 7x7/8x8 coverage must remain stronger than difficulty preference.',
  );
}

function createDifficultyFixture(
  band:
    | 'easy'
    | 'medium'
    | 'hard'
    | 'expert'
    | 'unrated' =
      DifficultyBand.Easy,
  score: number | null = 12,
): DifficultyProfile {
  return {
    version: 1,
    score,
    band,
    reasoningTier:
      band === 'easy'
        ? 'direct'
        : band === 'medium'
          ? 'contradiction-light'
          : band === 'hard'
            ? 'contradiction-heavy'
            : band === 'expert'
              ? 'expert-lookahead'
              : 'unrated',
    components: {
      boardLoad: 0,
      directLoad: 0,
      advancedRuleLoad: 0,
      lookaheadLoad: 0,
    },
    ordinaryContradictions: 0,
    treasureRoomVariantSteps: 0,
    treasureRoomStructuralConsensusSteps: 0,
    treasureRoomHypothesisConsequenceSteps: 0,
    reasons: [],
  };
}

function createRankingFixture(
  input: {
    seed: number;
    size: GeneratorBoardSize;
    archetype?: GeneratorArchetypeType;
    rooms?: readonly PlannedRoom[];
    metrics?: Partial<
      AcceptedCandidate[
      'quality'
      ]['metrics']
    >;
    monsterCount?: number;
    fill?: '#' | '.';
    difficulty?: DifficultyProfile;
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
      input.archetype ??
      GeneratorArchetype.MonsterOnly,
    size,
    rooms:
      input.rooms ?? [],
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
    difficulty:
      input.difficulty ??
      createDifficultyFixture(),
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
        basicPropagationResolvedWallCount: 0,
        basicPropagationResolvedNonWallCount: 0,
        basicPropagationResolvedCount: 0,
        basicPropagationResolvedRatio: 0,
        ...input.metrics,
      },
    },
  };
}

function createRankingPool(
  accepted:
    readonly AcceptedCandidate[],
): GeneratorPoolReport {
  const archetype =
    accepted[0]?.candidate
      .archetype ??
    GeneratorArchetype.MonsterOnly;

  assert(
    accepted.every(
      (candidate) =>
        candidate.candidate
          .archetype === archetype,
    ),
    'Ranking fixture pool must contain one archetype.',
  );

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
          archetype,
          attempts:
            accepted.length,
          accepted:
            accepted.length,
          rejectionCounts: {
            'generation-failed': 0,
            duplicate: 0,
            'monster-density': 0,
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


function runCliContractChecks(): void {
  assert(
    parseMasterSeed([
      '--seed',
      '123456',
    ]) === 123456,
    'CLI seed parser must accept a valid uint32 decimal seed.',
  );

  const defaultOptions =
    parseGeneratorCliArgs([
      '--seed',
      '123456',
    ]);

  assert(
    defaultOptions.masterSeed ===
      123456 &&
    defaultOptions.difficultyTarget ===
      DifficultyTarget.Any,
    'Generator CLI must default difficulty target to any.',
  );

  const expertOptions =
    parseGeneratorCliArgs([
      '--seed',
      '123456',
      '--difficulty',
      'expert',
    ]);

  assert(
    expertOptions.masterSeed ===
      123456 &&
    expertOptions.difficultyTarget ===
      DifficultyTarget.Expert,
    'Generator CLI must parse an explicit expert difficulty target.',
  );

  for (
    const args
    of [
      ['--seed', '123456', '--difficulty'],
      ['--seed', '123456', '--difficulty', 'unrated'],
      ['--seed', '123456', '--difficulty', 'impossible'],
      ['--difficulty', 'hard', '--seed', '123456'],
      ['--seed', '123456', 'hard', '--difficulty'],
    ]
  ) {
    expectThrow(
      () => {
        parseGeneratorCliArgs(args);
      },
      `Invalid difficulty CLI args must throw: ${JSON.stringify(args)}`,
    );
  }

  expectThrow(
    () => {
      parseMasterSeed([
        '--seed',
        '123456',
        '--difficulty',
        'hard',
      ]);
    },
    'Legacy parseMasterSeed helper must keep its exact two-argument contract.',
  );

  for (
    const args
    of [
      [],
      ['--seed'],
      ['--seed', '-1'],
      ['--seed', '1.5'],
      ['--seed', 'NaN'],
      ['--seed', '4294967296'],
      ['123456'],
      ['--seed', '12abc'],
    ]
  ) {
    expectThrow(
      () => {
        parseMasterSeed(args);
      },
      `Invalid CLI args must throw: ${JSON.stringify(args)}`,
    );
  }

  const report =
    buildGeneratorRunReport({
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 5000,
    });

  assert(
    report.schemaVersion === 1,
    'Generator run report must use schemaVersion 1.',
  );

  assert(
    report.masterSeed === 123456,
    'Generator run report must preserve master seed.',
  );

  assert(
    report.difficultyTarget ===
      DifficultyTarget.Any,
    'Generator run report must default difficulty target to any.',
  );

  assert(
    report.pool.completed,
    'Small deterministic CLI report must complete.',
  );

  assert(
    report.pool.accepted.length === 7,
    'Small deterministic CLI report must contain seven accepted candidates under A+.',
  );

  assert(
    report.shortlist.length === 5,
    'Small deterministic CLI report must shortlist one candidate per archetype.',
  );
}

function runOutputFormatChecks(): void {
  const accepted =
    createRankingFixture({
      seed: 424242,
      size: 7,
      monsterCount: 2,
    });

  const pool =
    createRankingPool([
      accepted,
    ]);

  const shortlist =
    selectShortlist(
      pool,
      1,
    );

  const report = {
    schemaVersion: 1 as const,
    masterSeed: 123456,
    difficultyTarget:
      DifficultyTarget.Any,
    config: {
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 100,
    },
    pool,
    shortlist,
  };

  const markdown =
    formatShortlistMarkdown(
      report,
    );

  const requiredMarkdownParts =
    [
      '# Dungeon Logic Generator v1.2',
      'Master seed',
      'Difficulty target: any',
      'archetype',
      'candidate seed',
      'size',
      'room top-lefts:',
      'room spatial profile:',
      'row clues',
      'column clues',
      'Monsters',
      'Chests',
      'solutionCount: 1',
      'difficulty band:',
      'difficulty score:',
      'difficulty reasoning tier:',
      'wall density',
      'thick-wall ratio',
      'wall/open boundary',
      'largest wall component',
    ] as const;

  for (
    const part
    of requiredMarkdownParts
  ) {
    assert(
      markdown.includes(part),
      `Shortlist Markdown must contain "${part}".`,
    );
  }

  const serializable =
    createSerializableReport(
      report,
    );

  assert(
    typeof serializable ===
    'object' &&
    serializable !== null &&
    'schemaVersion' in serializable &&
    serializable.schemaVersion === 1,
    'Serializable generator report must contain schemaVersion: 1.',
  );

  assert(
    typeof serializable ===
      'object' &&
    serializable !== null &&
    'difficultyTarget' in
      serializable &&
    serializable.difficultyTarget ===
      DifficultyTarget.Any,
    'Serializable generator report must include difficultyTarget.',
  );

  for (
    const archetypeResult
    of report.pool.archetypes
  ) {
    assert(
      typeof archetypeResult
        .stats.rejectionCounts[
          RejectionReason
            .MonsterDensity
        ] === 'number',
      `${archetypeResult.stats.archetype} report must expose numeric monster-density rejection count.`,
    );
  }
}


async function runFilesystemCliChecks(): Promise<void> {
  const levelsBefore =
    (
      await readdir(
        'src/data/levels',
      )
    ).sort();

  const packageJson =
    JSON.parse(
      await readFile(
        'package.json',
        'utf8',
      ),
    ) as {
      scripts?: Record<
        string,
        string
      >;
    };

  assert(
    packageJson.scripts?.[
    'generate:candidates'
    ] ===
    'tsx src/dev/generateCandidates.ts',
    'package.json must expose generate:candidates CLI script.',
  );

  const gitignore =
    await readFile(
      '.gitignore',
      'utf8',
    );

  assert(
    gitignore
      .split(/\r?\n/)
      .includes('.generated/'),
    '.gitignore must contain .generated/.',
  );

  const accepted =
    createRankingFixture({
      seed: 515151,
      size: 7,
      monsterCount: 1,
    });

  const pool =
    createRankingPool([
      accepted,
    ]);

  const report = {
    schemaVersion: 1 as const,
    masterSeed: 123456,
    difficultyTarget:
      DifficultyTarget.Any,
    config: {
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 100,
    },
    pool,
    shortlist:
      selectShortlist(
        pool,
        1,
      ),
  };

  const tempRoot =
    await mkdtemp(
      join(
        tmpdir(),
        'dungeon-logic-generator-',
      ),
    );

  try {
    const paths =
      await writeGeneratorOutputs(
        report,
        tempRoot,
      );

    assert(
      paths.jsonPath ===
      join(
        tempRoot,
        'candidates-123456.json',
      ),
      'JSON output path must include the master seed.',
    );

    assert(
      paths.markdownPath ===
      join(
        tempRoot,
        'shortlist-123456.md',
      ),
      'Markdown output path must include the master seed.',
    );

    const jsonText =
      await readFile(
        paths.jsonPath,
        'utf8',
      );

    assert(
      jsonText.endsWith('\n'),
      'JSON output must end with a newline.',
    );

    const parsed =
      JSON.parse(jsonText) as {
        schemaVersion?: number;
        masterSeed?: number;
      };

    assert(
      parsed.schemaVersion === 1 &&
      parsed.masterSeed === 123456,
      'Written JSON report must preserve schemaVersion and masterSeed.',
    );

    const markdown =
      await readFile(
        paths.markdownPath,
        'utf8',
      );

    assert(
      markdown.includes(
        '# Dungeon Logic Generator v1.2',
      ),
      'Written Markdown shortlist must contain the v1.2 generator title.',
    );
  } finally {
    await rm(
      tempRoot,
      {
        recursive: true,
        force: true,
      },
    );
  }

  const levelsAfter =
    (
      await readdir(
        'src/data/levels',
      )
    ).sort();

  assert(
    JSON.stringify(
      levelsBefore,
    ) ===
    JSON.stringify(
      levelsAfter,
    ),
    'Generator pipeline must not create authored level files.',
  );
}


function createPuzzleForSanity(
  level: LevelDefinition,
): PuzzleState {
  const puzzle =
    new PuzzleState(level);

  for (
    let y = 0;
    y < level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      if (
        level.solution[y][x] ===
        '#'
      ) {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );
      }
    }
  }

  return puzzle;
}

function assertAcceptedCandidate(
  accepted: AcceptedCandidate,
): void {
  const candidate =
    accepted.candidate;

  const level =
    candidate.level;

  const puzzle =
    createPuzzleForSanity(
      level,
    );

  assert(
    validatePuzzle(puzzle).isSolved,
    `${candidate.id} must pass LevelValidator.`,
  );

  assert(
    solveLevel(level).solutionCount ===
      1,
    `${candidate.id} must be unique.`,
  );

  const quality =
    analyzeLevelQuality(level);

  assert(
    quality.passes,
    `${candidate.id} must pass hard quality.`,
  );

  assert(
    quality.warnings.length === 0,
    `${candidate.id} must have no geometry warnings.`,
  );

  assert(
    ALLOWED_SIZES[
      candidate.archetype
    ].includes(
      candidate.size,
    ),
    `${candidate.id} must use an allowed size for ${candidate.archetype}.`,
  );

  assertArchetypeContract(
    candidate,
  );

  assertDeadEndsMatchMonsters(
    candidate,
  );

  const derived =
    deriveClues(
      level.solution,
    );

  assert(
    arraysEqual(
      derived.rowClues,
      level.rowClues,
    ),
    `${candidate.id} generated row clues must match solution.`,
  );

  assert(
    arraysEqual(
      derived.columnClues,
      level.columnClues,
    ),
    `${candidate.id} generated column clues must match solution.`,
  );

  assertFixedObjectsOpen(
    candidate,
  );

  assertChestDistanceGuideline(
    candidate,
  );
}

function assertArchetypeContract(
  candidate: GeneratedCandidate,
): void {
  const roomCount =
    candidate.rooms.length;

  const chestCount =
    candidate.level.chests.length;

  const monsterCount =
    candidate.level.monsters.length;

  switch (candidate.archetype) {
    case GeneratorArchetype.MonsterOnly:
      assert(
        roomCount === 0 &&
          chestCount === 0 &&
          monsterCount > 0,
        `${candidate.id} must match monster-only object contract.`,
      );
      break;

    case GeneratorArchetype.ChestOneRoom:
      assert(
        roomCount === 1 &&
          chestCount === 1 &&
          monsterCount === 0,
        `${candidate.id} must match chest-one-room object contract.`,
      );
      break;

    case GeneratorArchetype.ChestTwoRooms:
      assert(
        roomCount === 2 &&
          chestCount === 2 &&
          monsterCount === 0,
        `${candidate.id} must match chest-two-rooms object contract.`,
      );
      break;

    case GeneratorArchetype.MixedOneRoom:
      assert(
        roomCount === 1 &&
          chestCount === 1 &&
          monsterCount > 0,
        `${candidate.id} must match mixed-one-room object contract.`,
      );
      break;

    case GeneratorArchetype.MixedTwoRooms:
      assert(
        roomCount === 2 &&
          chestCount === 2 &&
          monsterCount > 0,
        `${candidate.id} must match mixed-two-rooms object contract.`,
      );
      break;
  }

  assert(
    candidate.level.blockers.length ===
      0 &&
      candidate.level.doors.length ===
        0,
    `${candidate.id} Generator v1 candidate must not contain blockers or doors.`,
  );
}

function assertDeadEndsMatchMonsters(
  candidate: GeneratedCandidate,
): void {
  const deadEnds =
    getHallwayDeadEnds(
      candidate.level.solution,
      candidate.rooms,
    );

  const monsterKeys =
    candidate.level.monsters
      .map(
        ({ x, y }) =>
          `${x}:${y}`,
      )
      .sort();

  const deadEndKeys =
    deadEnds
      .map(
        ({ x, y }) =>
          `${x}:${y}`,
      )
      .sort();

  assert(
    JSON.stringify(
      monsterKeys,
    ) ===
      JSON.stringify(
        deadEndKeys,
      ),
    `${candidate.id} Monster coordinates must equal hallway dead ends exactly.`,
  );
}

function arraysEqual(
  first: readonly number[],
  second: readonly number[],
): boolean {
  return (
    first.length ===
      second.length &&
    first.every(
      (value, index) =>
        value === second[index],
    )
  );
}



function playableCandidateSignatureForSanity(
  candidate: GeneratedCandidate,
): string {
  const level =
    candidate.level;

  const positions =
    (
      values:
        readonly {
          x: number;
          y: number;
        }[],
    ): readonly string[] =>
      values
        .map(
          ({ x, y }) =>
            `${x}:${y}`,
        )
        .sort();

  const doors =
    level.doors
      .map(
        (door) =>
          `${door.position.x}:${door.position.y}:${door.orientation}`,
      )
      .sort();

  return JSON.stringify({
    size: candidate.size,
    rowClues: level.rowClues,
    columnClues:
      level.columnClues,
    monsters:
      positions(
        level.monsters,
      ),
    chests:
      positions(
        level.chests,
      ),
    blockers:
      positions(
        level.blockers,
      ),
    doors,
    solution:
      level.solution,
  });
}

function runDuplicatePoolChecks(): void {
  const duplicateConfig:
    GeneratorConfig = {
    masterSeed: 123456,
    acceptedPerArchetype: 6,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 5000,
  };

  const pool =
    createCandidatePool(
      duplicateConfig,
    );

  assert(
    pool.completed,
    'Duplicate regression pool must complete.',
  );

  const chestOne =
    pool.archetypes.find(
      (result) =>
        result.stats.archetype ===
        GeneratorArchetype.ChestOneRoom,
    );

  if (chestOne === undefined) {
    throw new Error(
      'Duplicate regression pool must contain chest-one-room results.',
    );
  }

  assert(
    chestOne.accepted.length === 6,
    'Chest-one-room must still fill all six accepted slots after duplicate rejection.',
  );

  const signatures =
    chestOne.accepted.map(
      (accepted) =>
        playableCandidateSignatureForSanity(
          accepted.candidate,
        ),
    );

  assert(
    new Set(signatures).size ===
      signatures.length,
    'Chest-one-room accepted pool must not contain duplicate playable puzzles.',
  );

  /*
   * Do not require this particular master seed
   * to encounter a duplicate. Spatial generation
   * changes can legitimately remove an incidental
   * collision while dedupe behavior stays correct.
   *
   * The durable regression invariant here is that
   * no duplicate playable signature survives into
   * the accepted pool.
   */
}

function runBasicPropagationQualityChecks(): void {
  const level: LevelDefinition = {
    id:
      'quality-basic-propagation-overexposed',
    width: 8,
    height: 8,
    rowClues: [
      2,
      2,
      2,
      5,
      0,
      5,
      3,
      7,
    ],
    columnClues: [
      3,
      3,
      2,
      7,
      3,
      0,
      3,
      5,
    ],
    monsters: [
      { x: 7, y: 3 },
      { x: 0, y: 5 },
      { x: 2, y: 6 },
      { x: 4, y: 6 },
      { x: 7, y: 6 },
      { x: 5, y: 7 },
    ],
    chests: [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ],
    blockers: [],
    doors: [],
    solution: [
      '...#...#',
      '...#...#',
      '...#...#',
      '#.###.#.',
      '........',
      '.#.##.##',
      '##.#....',
      '#####.##',
    ],
  };

  const report =
    analyzeLevelQuality(level);

  assert(
    report.metrics
      .basicPropagationResolvedWallCount ===
      21,
    'Basic line propagation must resolve 21 wall cells for the overexposed fixture.',
  );

  assert(
    report.metrics
      .basicPropagationResolvedNonWallCount ===
      35,
    'Basic line propagation must resolve 35 non-wall cells including fixed-open objects.',
  );

  assert(
    report.metrics
      .basicPropagationResolvedCount ===
      56,
    'Basic line propagation must resolve 56 of 64 cells for the overexposed fixture.',
  );

  assert(
    report.metrics
      .basicPropagationResolvedRatio ===
      0.875,
    'Basic line propagation must resolve exactly 87.5% of the overexposed fixture.',
  );

  assert(
    report.passes,
    'Basic propagation overexposure must remain a soft quality warning, not a hard-quality failure.',
  );

  assert(
    report.warnings.some(
      (warning) =>
        warning.includes(
          'basic propagation',
        ),
    ),
    'A level with more than 70% basic propagation coverage must emit a soft warning.',
  );
}

function runIntegrationInvariantChecks(): void {
  const shortlistConfig:
    GeneratorConfig = {
    masterSeed: 123456,
    acceptedPerArchetype: 3,
    shortlistPerArchetype: 2,
    maxAttemptsPerArchetype: 5000,
  };

  const firstPool =
    createCandidatePool(
      shortlistConfig,
    );

  assert(
    firstPool.completed,
    'Reduced integration pool must complete.',
  );

  assert(
    firstPool.accepted.length >= 15 &&
      firstPool.accepted.length <= 17,
    'Reduced integration pool must contain 15-17 accepted candidates under A+.',
  );

  for (
    const archetypeResult
    of firstPool.archetypes
  ) {
    const isTwoRoom =
      archetypeResult.stats.archetype ===
        GeneratorArchetype.ChestTwoRooms ||
      archetypeResult.stats.archetype ===
        GeneratorArchetype.MixedTwoRooms;

    if (isTwoRoom) {
      const sizes =
        new Set(
          archetypeResult.accepted.map(
            (accepted) =>
              accepted.candidate.size,
          ),
        );

      assert(
        archetypeResult.accepted.length >= 3 &&
          archetypeResult.accepted.length <= 4,
        `${archetypeResult.stats.archetype} integration pool must contain target or target+1 accepted candidates.`,
      );

      assert(
        sizes.has(7) &&
          sizes.has(8),
        `${archetypeResult.stats.archetype} integration pool must cover 7x7 and 8x8.`,
      );
    } else {
      assert(
        archetypeResult.accepted.length === 3,
        `${archetypeResult.stats.archetype} integration pool must keep exact target count.`,
      );
    }
  }

  for (
    const accepted
    of firstPool.accepted
  ) {
    assertAcceptedCandidate(
      accepted,
    );
  }

  const firstShortlist =
    selectShortlist(
      firstPool,
      shortlistConfig
        .shortlistPerArchetype,
    );

  assert(
    firstShortlist.length === 10,
    'Reduced integration shortlist must contain 10 candidates.',
  );

  const shortlistedIds =
    firstShortlist.map(
      (ranked) =>
        ranked.accepted
          .candidate.id,
    );

  assert(
    new Set(
      shortlistedIds,
    ).size ===
      shortlistedIds.length,
    'Reduced integration shortlist must not contain duplicate candidate IDs.',
  );

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const entries =
      firstShortlist.filter(
        (ranked) =>
          ranked.accepted
            .candidate
            .archetype ===
          archetype,
      );

    assert(
      entries.length === 2,
      `${archetype} must contribute exactly two shortlisted candidates.`,
    );

    const seeds =
      entries.map(
        (ranked) =>
          ranked.accepted
            .candidate.seed,
      );

    assert(
      new Set(seeds).size ===
        seeds.length,
      `${archetype} shortlist must not duplicate candidate seeds.`,
    );
  }

  const secondPool =
    createCandidatePool(
      shortlistConfig,
    );

  assert(
    secondPool.completed,
    'Repeated reduced integration pool must complete.',
  );

  const secondShortlist =
    selectShortlist(
      secondPool,
      shortlistConfig
        .shortlistPerArchetype,
    );

  const firstOrder =
    firstShortlist.map(
      (ranked) =>
        ranked.accepted
          .candidate.id,
    );

  const secondOrder =
    secondShortlist.map(
      (ranked) =>
        ranked.accepted
          .candidate.id,
    );

  assert(
    JSON.stringify(
      firstOrder,
    ) ===
      JSON.stringify(
        secondOrder,
      ),
    'Same master seed must reproduce identical shortlist order.',
  );
}

function roomFixture(
  x: number,
  y: number,
): PlannedRoom {
  return {
    topLeft: { x, y },
    internalEntrance: {
      x: x + 2,
      y: y + 1,
    },
    externalEntrance: {
      x: x + 3,
      y: y + 1,
    },
  };
}

function runRoomSpatialV12Checks(): void {
  const corner =
    roomFixture(0, 0);

  const edge =
    roomFixture(0, 2);

  const interior =
    roomFixture(2, 2);

  assert(
    classifyRoomSpatialCategory(
      7,
      corner,
    ) === RoomSpatialCategory.Corner,
    '7x7 topLeft (0,0) must classify as corner.',
  );

  assert(
    classifyRoomSpatialCategory(
      7,
      edge,
    ) === RoomSpatialCategory.Edge,
    '7x7 topLeft (0,2) must classify as edge.',
  );

  assert(
    classifyRoomSpatialCategory(
      7,
      interior,
    ) === RoomSpatialCategory.Interior,
    '7x7 topLeft (2,2) must classify as interior.',
  );

  const forward =
    getRoomSpatialCategories(
      7,
      [corner, interior],
    );

  const reversed =
    getRoomSpatialCategories(
      7,
      [interior, corner],
    );

  assert(
    JSON.stringify(forward) ===
      JSON.stringify(reversed),
    'Two-room spatial profile must be order-independent.',
  );

  assert(
    JSON.stringify(forward) ===
      JSON.stringify([
        RoomSpatialCategory.Corner,
        RoomSpatialCategory.Interior,
      ]),
    'Two-room spatial profile must use stable category order.',
  );

  const spatialFixtures = [
    {
      seed: 1,
      expected:
        RoomSpatialCategory.Corner,
    },
    {
      seed: 49,
      expected:
        RoomSpatialCategory.Edge,
    },
    {
      seed: 52,
      expected:
        RoomSpatialCategory.Interior,
    },
  ] as const;

  const topLefts =
    new Set<string>();

  for (
    const fixture
    of spatialFixtures
  ) {
    const result =
      generateCandidate({
        archetype:
          GeneratorArchetype.ChestOneRoom,
        size: 7,
        seed: fixture.seed,
      });

    assert(
      result.ok,
      `Expected deterministic chest-one-room fixture seed ${fixture.seed} to generate successfully.`,
    );

    if (!result.ok) {
      continue;
    }

    const room =
      result.candidate.rooms[0];

    assert(
      room !== undefined,
      'Chest-one-room candidate must expose one planned room.',
    );

    if (room === undefined) {
      continue;
    }

    assert(
      room.externalEntrance.x >= 0 &&
        room.externalEntrance.x < 7 &&
        room.externalEntrance.y >= 0 &&
        room.externalEntrance.y < 7,
      'Edge/corner room entrance must stay in board bounds.',
    );

    assert(
      classifyRoomSpatialCategory(
        7,
        room,
      ) === fixture.expected,
      `Seed ${fixture.seed} must reproduce ${fixture.expected} room placement.`,
    );

    topLefts.add(
      `${room.topLeft.x}:${room.topLeft.y}`,
    );
  }

  assert(
    topLefts.size ===
      spatialFixtures.length,
    'Deterministic room fixtures must use distinct room positions.',
  );

  const repeatedA =
    generateCandidate({
      archetype:
        GeneratorArchetype.ChestOneRoom,
      size: 7,
      seed: 123,
    });

  const repeatedB =
    generateCandidate({
      archetype:
        GeneratorArchetype.ChestOneRoom,
      size: 7,
      seed: 123,
    });

  assert(
    JSON.stringify(repeatedA) ===
      JSON.stringify(repeatedB),
    'Room stratification must preserve candidate-seed determinism.',
  );
}


function createMonsterPolicyFixture(
  size: GeneratorBoardSize,
  monsterCount: number,
  archetype:
    GeneratorArchetypeType =
      GeneratorArchetype.MonsterOnly,
): GeneratedCandidate {
  return createRankingFixture({
    seed:
      size * 100 + monsterCount,
    size,
    monsterCount,
    archetype,
  }).candidate;
}

function runMonsterDensityV12Checks(): void {
  const reject6 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        6,
        6,
      ),
    );

  const reject7 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        7,
        8,
        GeneratorArchetype
          .MixedOneRoom,
      ),
    );

  const reject8 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        8,
        9,
        GeneratorArchetype
          .MixedTwoRooms,
      ),
    );

  for (
    const decision
    of [
      reject6,
      reject7,
      reject8,
    ]
  ) {
    assert(
      decision.reject,
      'Monster count above the per-size hard cap must be rejected.',
    );

    assert(
      decision.reason ===
        RejectionReason
          .MonsterDensity,
      'Monster hard-cap rejection must use monster-density.',
    );
  }

  const boundaryCases =
    [
      [6, 5],
      [7, 7],
      [8, 8],
    ] as const;

  for (
    const [size, monsterCount]
    of boundaryCases
  ) {
    const penalized =
      createRankingFixture({
        seed:
          5000 +
          size * 100 +
          monsterCount,
        size,
        monsterCount,
      });

    const baseline =
      createRankingFixture({
        seed:
          6000 +
          size * 100 +
          monsterCount,
        size,
        monsterCount:
          monsterCount - 1,
      });

    const policy =
      getGeneratorMonsterPolicy(
        penalized.candidate,
      );

    assert(
      !policy.reject &&
        policy.rankingPenalty === 4,
      `${size}x${size} boundary Monster count must remain allowed with a 4-point penalty.`,
    );

    assert(
      scoreCandidate(penalized) ===
        scoreCandidate(baseline) - 4,
      `${size}x${size} boundary Monster count must subtract exactly 4 ranking points.`,
    );
  }

  const lowMixed =
    createRankingFixture({
      seed: 7001,
      size: 8,
      monsterCount: 2,
      archetype:
        GeneratorArchetype
          .MixedOneRoom,
    });

  assert(
    getGeneratorMonsterPolicy(
      lowMixed.candidate,
    ).rankingPenalty === 0,
    'Low Monster counts must not receive a penalty.',
  );

  const chestOnly =
    createRankingFixture({
      seed: 7002,
      size: 8,
      monsterCount: 20,
      archetype:
        GeneratorArchetype
          .ChestOneRoom,
    });

  assert(
    !getGeneratorMonsterPolicy(
      chestOnly.candidate,
    ).reject,
    'Chest-only archetypes must be outside Monster-density policy.',
  );

  assert(
    getGeneratorMonsterPolicy(
      chestOnly.candidate,
    ).rankingPenalty === 0,
    'Chest-only archetypes must receive no Monster-density ranking penalty.',
  );
}


function runTwoRoomCoverageV12Checks(): void {
  const only8 =
    new Set<GeneratorBoardSize>(
      [8],
    );

  const both =
    new Set<GeneratorBoardSize>(
      [7, 8],
    );

  assert(
    !isArchetypePoolComplete(
      GeneratorArchetype
        .ChestTwoRooms,
      10,
      only8,
      10,
    ),
    'Two-room pool at count target must remain incomplete when 7x7 is missing.',
  );

  assert(
    isArchetypePoolComplete(
      GeneratorArchetype
        .ChestTwoRooms,
      11,
      both,
      10,
    ),
    'Two-room pool must complete after missing size is accepted.',
  );

  assert(
    isArchetypePoolComplete(
      GeneratorArchetype
        .MonsterOnly,
      10,
      only8,
      10,
    ),
    'Non-two-room pool must keep count-only completion semantics.',
  );

  assert(
    chooseArchetypeAttemptSize(
      GeneratorArchetype
        .ChestTwoRooms,
      10,
      only8,
      10,
      new SeededRandom(123456),
    ) === 7,
    'Coverage phase must force the missing 7x7 size.',
  );

  const only7 =
    new Set<GeneratorBoardSize>(
      [7],
    );

  assert(
    chooseArchetypeAttemptSize(
      GeneratorArchetype
        .MixedTwoRooms,
      10,
      only7,
      10,
      new SeededRandom(123456),
    ) === 8,
    'Coverage phase must force the missing 8x8 size.',
  );

  const tinyBudget =
    createCandidatePool({
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 1,
    });

  for (
    const result
    of tinyBudget.archetypes
  ) {
    if (
      result.stats.archetype !==
        GeneratorArchetype
          .ChestTwoRooms &&
      result.stats.archetype !==
        GeneratorArchetype
          .MixedTwoRooms
    ) {
      continue;
    }

    assert(
      result.exhausted,
      `${result.stats.archetype} must be exhausted when the attempt limit prevents A+ size coverage.`,
    );
  }
}

async function main(): Promise<void> {
  runRngChecks();
  runMonsterOnlyChecks();
  runArchetypeChecks();
  runRoomSpatialV12Checks();
  runMonsterDensityV12Checks();
  runTwoRoomCoverageV12Checks();
  runAcceptancePipelineChecks();
  runCandidatePoolChecks();
  runRankingChecks();
  runOutputFormatChecks();
  runCliContractChecks();
  runBasicPropagationQualityChecks();
  runDuplicatePoolChecks();
  runIntegrationInvariantChecks();
  await runFilesystemCliChecks();

  console.info(
    '[Dungeon Logic] Generator sanity: generation + acceptance + pool + ranking + integration invariants + output + CLI filesystem checks passed',
  );
}

void main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);
