export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state =
      normalizeSeed(seed);
  }

  nextUint32(): number {
    let value =
      this.state >>> 0;

    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    this.state =
      value >>> 0;

    return this.state;
  }

  nextFloat(): number {
    return (
      this.nextUint32() /
      0x1_0000_0000
    );
  }

  int(
    minInclusive: number,
    maxExclusive: number,
  ): number {
    if (
      !Number.isInteger(minInclusive) ||
      !Number.isInteger(maxExclusive) ||
      maxExclusive <= minInclusive
    ) {
      throw new RangeError(
        'Invalid integer RNG range.',
      );
    }

    return (
      minInclusive +
      Math.floor(
        this.nextFloat() *
          (
            maxExclusive -
            minInclusive
          ),
      )
    );
  }

  choose<T>(
    items: readonly T[],
  ): T {
    if (items.length === 0) {
      throw new RangeError(
        'Cannot choose from an empty array.',
      );
    }

    return items[
      this.int(0, items.length)
    ];
  }

  shuffled<T>(
    items: readonly T[],
  ): T[] {
    const result = [...items];

    for (
      let index =
        result.length - 1;
      index > 0;
      index -= 1
    ) {
      const other =
        this.int(
          0,
          index + 1,
        );

      [
        result[index],
        result[other],
      ] = [
        result[other],
        result[index],
      ];
    }

    return result;
  }
}

export function deriveCandidateSeed(
  masterSeed: number,
  archetype: string,
  attempt: number,
): number {
  if (
    !Number.isInteger(attempt) ||
    attempt < 0
  ) {
    throw new RangeError(
      'Attempt must be a non-negative integer.',
    );
  }

  return hashSeedText(
    `${masterSeed >>> 0}:${archetype}:${attempt}`,
  );
}

export function hashSeedText(
  text: string,
): number {
  let hash = 0x811c9dc5;

  for (const character of text) {
    hash ^=
      character.charCodeAt(0);

    hash =
      Math.imul(
        hash,
        0x01000193,
      ) >>> 0;
  }

  return hash === 0
    ? 0x6d2b79f5
    : hash;
}

function normalizeSeed(
  seed: number,
): number {
  if (!Number.isInteger(seed)) {
    throw new TypeError(
      'Seed must be an integer.',
    );
  }

  const normalized =
    seed >>> 0;

  return normalized === 0
    ? 0x6d2b79f5
    : normalized;
}
