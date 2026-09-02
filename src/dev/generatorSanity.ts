import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

import {
  deriveClues,
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';

import {
  evaluateCandidate,
} from '../puzzle/generator/CandidateFactory';

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
  type GeneratedCandidate,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorBoardSize,
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

runRngChecks();
runMonsterOnlyChecks();
runArchetypeChecks();
runAcceptancePipelineChecks();

console.info(
  '[Dungeon Logic] Generator sanity: generation + full acceptance pipeline checks passed',
);
