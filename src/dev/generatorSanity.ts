import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

import {
  deriveClues,
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';

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

runRngChecks();
runMonsterOnlyChecks();
runArchetypeChecks();

console.info(
  '[Dungeon Logic] Generator sanity: RNG + all archetype generation checks passed',
);
