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

runRngChecks();
runMonsterOnlyChecks();

console.info(
  '[Dungeon Logic] Generator sanity: RNG + Monster-only checks passed',
);
