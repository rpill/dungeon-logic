import {
  buildGeneratedCandidatesUrl,
  parseGeneratedPlaytestSeed,
  resolveGeneratedCandidate,
} from '../data/levels';

import type {
  LevelDefinition,
} from '../puzzle/types';

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function fixtureLevel(
  id: string,
): LevelDefinition {
  return {
    id,
    width: 2,
    height: 2,
    rowClues: [0, 0],
    columnClues: [0, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '..',
      '..',
    ],
  };
}

function main(): void {
  console.info(
    '[Dungeon Logic] Generated playtest sanity',
  );

  const firstLevel =
    fixtureLevel(
      'generated-playtest-first',
    );

  const secondLevel =
    fixtureLevel(
      'generated-playtest-second',
    );

  const report = {
    pool: {
      archetypes: [
        {
          accepted: [
            {
              candidate: {
                id:
                  'generated-first',
                level:
                  firstLevel,
              },
            },
          ],
        },
        {
          accepted: [
            {
              candidate: {
                id:
                  'generated-second',
                level:
                  secondLevel,
              },
            },
          ],
        },
      ],
    },
  };

  assert(
    resolveGeneratedCandidate(
      report,
      'generated-second',
    ) === secondLevel,
    'Resolver must return the accepted candidate level matching candidate id.',
  );

  assert(
    resolveGeneratedCandidate(
      report,
      'missing-candidate',
    ) === null,
    'Unknown generated candidate id must return null.',
  );

  assert(
    resolveGeneratedCandidate(
      report,
      null,
    ) === null,
    'Missing generated candidate id must return null.',
  );

  assert(
    resolveGeneratedCandidate(
      {
        pool: {
          archetypes: [
            {
              accepted:
                'not-an-array',
            },
          ],
        },
      },
      'generated-second',
    ) === null,
    'Malformed generated report must return null.',
  );

  assert(
    parseGeneratedPlaytestSeed(
      '123456',
    ) === 123456,
    'Decimal uint32 seed must parse.',
  );

  assert(
    parseGeneratedPlaytestSeed(
      '4294967296',
    ) === null &&
    parseGeneratedPlaytestSeed(
      '-1',
    ) === null &&
    parseGeneratedPlaytestSeed(
      'banana',
    ) === null,
    'Invalid generated playtest seeds must return null.',
  );

  assert(
    buildGeneratedCandidatesUrl(
      123456,
    ) ===
      '/__generated/candidates-123456.json',
    'Generated candidate URL must match the dev endpoint contract.',
  );

  console.info(
    '7/7 checks passed',
  );
}

main();
