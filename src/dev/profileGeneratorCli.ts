import {
  pathToFileURL,
} from 'node:url';

import {
  DEFAULT_GENERATOR_CONFIG,
  type GeneratorConfig,
} from '../puzzle/generator/types';

import {
  formatGeneratorProfileReport,
  profileGeneratorRun,
} from './profileGenerator';

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

export function buildProfileGeneratorCliReport(
  args: readonly string[],
  baseConfig: GeneratorConfig =
    DEFAULT_GENERATOR_CONFIG,
  topN = 20,
): string {
  const masterSeed =
    parseProfileMasterSeed(args);

  const profile =
    profileGeneratorRun({
      ...baseConfig,
      masterSeed,
    });

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
