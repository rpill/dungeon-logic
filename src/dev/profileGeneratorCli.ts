import {
  pathToFileURL,
} from 'node:url';

import {
  DifficultyTarget,
  type DifficultyTarget as DifficultyTargetType,
} from '../puzzle/difficulty/types';

import {
  DEFAULT_GENERATOR_CONFIG,
  type GeneratorConfig,
} from '../puzzle/generator/types';

import {
  formatGeneratorProfileReport,
  profileGeneratorRun,
} from './profileGenerator';

export interface ProfileGeneratorCliOptions {
  masterSeed: number;
  difficultyTarget:
    DifficultyTargetType;
}

export function parseProfileMasterSeed(
  args: readonly string[],
): number {
  if (
    args.length !== 2 ||
    args[0] !== '--seed' ||
    !/^[0-9]+$/.test(args[1])
  ) {
    throw new Error(
      'Usage: npm run profile:generator -- --seed <uint32>',
    );
  }

  const seed =
    Number(args[1]);

  if (
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0xffff_ffff
  ) {
    throw new RangeError(
      'Seed must be a decimal uint32 value from 0 to 4294967295.',
    );
  }

  return seed;
}

export function parseProfileGeneratorCliArgs(
  args: readonly string[],
): ProfileGeneratorCliOptions {
  if (
    args.length !== 2 &&
    args.length !== 4
  ) {
    throw new Error(
      'Usage: npm run profile:generator -- --seed <uint32> [--difficulty any|easy|medium|hard|expert]',
    );
  }

  const masterSeed =
    parseProfileMasterSeed(
      args.slice(0, 2),
    );

  if (args.length === 2) {
    return {
      masterSeed,
      difficultyTarget:
        DifficultyTarget.Any,
    };
  }

  if (args[2] !== '--difficulty') {
    throw new Error(
      'Usage: npm run profile:generator -- --seed <uint32> [--difficulty any|easy|medium|hard|expert]',
    );
  }

  const target =
    [
      DifficultyTarget.Any,
      DifficultyTarget.Easy,
      DifficultyTarget.Medium,
      DifficultyTarget.Hard,
      DifficultyTarget.Expert,
    ].find(
      (value) =>
        value === args[3],
    );

  if (target === undefined) {
    throw new Error(
      'Difficulty target must be one of: any, easy, medium, hard, expert.',
    );
  }

  return {
    masterSeed,
    difficultyTarget: target,
  };
}

export function buildProfileGeneratorCliReport(
  args: readonly string[],
  baseConfig: GeneratorConfig =
    DEFAULT_GENERATOR_CONFIG,
  topN = 20,
): string {
  const options =
    parseProfileGeneratorCliArgs(
      args,
    );

  const profile =
    profileGeneratorRun(
      options.difficultyTarget ===
        DifficultyTarget.Any
        ? {
            ...baseConfig,
            masterSeed:
              options.masterSeed,
          }
        : {
            ...baseConfig,
            masterSeed:
              options.masterSeed,
            difficultyTarget:
              options.difficultyTarget,
          },
    );

  return formatGeneratorProfileReport(
    profile,
    topN,
  );
}

function isMainModule(): boolean {
  const entryPath =
    process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return (
    import.meta.url ===
    pathToFileURL(entryPath).href
  );
}

function main(): void {
  try {
    const report =
      buildProfileGeneratorCliReport(
        process.argv.slice(2),
      );

    console.info(report);
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  }
}

if (isMainModule()) {
  main();
}
