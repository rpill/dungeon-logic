import {
  resolve,
} from 'node:path';

import {
  pathToFileURL,
} from 'node:url';

import {
  createCandidatePool,
} from '../puzzle/generator/CandidateFactory';

import {
  DEFAULT_GENERATOR_CONFIG,
  type GeneratorPoolReport,
} from '../puzzle/generator/types';

import {
  parseDifficultyCorpusArgs,
  summarizeDifficultyCorpus,
} from './DifficultyCorpusAnalyzer';

import {
  writeDifficultyCorpusOutputs,
} from './DifficultyCorpusOutput';

export {
  formatDifficultyCorpusMarkdown,
  parseDifficultyCorpusArgs,
  summarizeDifficultyCorpus,
} from './DifficultyCorpusAnalyzer';

export type {
  DifficultyCorpusBandCounts,
  DifficultyCorpusCliOptions,
  DifficultyCorpusOutputPaths,
  DifficultyCorpusRatedBand,
  DifficultyCorpusReport,
} from './DifficultyCorpusAnalyzer';

export {
  writeDifficultyCorpusOutputs,
} from './DifficultyCorpusOutput';

async function runCli(): Promise<void> {
  const options =
    parseDifficultyCorpusArgs(
      process.argv.slice(2),
    );

  console.info(
    `[Dungeon Logic] Difficulty corpus: ${options.seeds.length} seeds`,
  );

  const pools:
    GeneratorPoolReport[] = [];

  for (const seed of options.seeds) {
    console.info(
      `Generating seed ${seed}...`,
    );

    const pool =
      createCandidatePool({
        ...DEFAULT_GENERATOR_CONFIG,
        masterSeed: seed,
      });

    pools.push(pool);

    console.info(
      `seed ${seed}: accepted=${pool.accepted.length} completed=${pool.completed}`,
    );
  }

  const report =
    summarizeDifficultyCorpus(
      pools,
      DEFAULT_GENERATOR_CONFIG
        .shortlistPerArchetype,
    );

  const paths =
    await writeDifficultyCorpusOutputs(
      report,
    );

  console.info(
    `Accepted: ${report.summary.totalAccepted}`,
  );

  console.info(
    `Bands: easy=${report.summary.bandCounts.easy} medium=${report.summary.bandCounts.medium} hard=${report.summary.bandCounts.hard} expert=${report.summary.bandCounts.expert} unrated=${report.summary.bandCounts.unrated}`,
  );

  for (const target of report.targets) {
    console.info(
      `target ${target.target}: exact=${target.exactSlots}/${target.totalSlots} fallback=${target.fallbackSlots}`,
    );
  }

  console.info(
    `JSON: ${paths.jsonPath}`,
  );

  console.info(
    `Markdown: ${paths.markdownPath}`,
  );

  if (
    report.summary.completedSeeds !==
    report.summary.seedCount
  ) {
    console.error(
      'Difficulty corpus contains incomplete generator pools.',
    );

    process.exitCode = 1;
  }
}

function isDirectExecution(): boolean {
  const entryPath =
    process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return (
    pathToFileURL(
      resolve(entryPath),
    ).href === import.meta.url
  );
}

if (isDirectExecution()) {
  void runCli().catch(
    (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `[Dungeon Logic] Difficulty corpus failed: ${message}`,
      );

      process.exitCode = 1;
    },
  );
}
