import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

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

console.info(
  '[Dungeon Logic] Generator sanity: RNG checks passed',
);
