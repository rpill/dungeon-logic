import {
  resolve,
} from 'node:path';

import {
  pathToFileURL,
} from 'node:url';

import {
  DifficultyTarget,
} from '../puzzle/difficulty/types';

import {
  createCandidatePool,
} from '../puzzle/generator/CandidateFactory';

import type {
  TargetedDifficultyTarget,
} from '../puzzle/generator/DifficultyTargetPolicy';

import {
  DEFAULT_GENERATOR_CONFIG,
  type GeneratorPoolReport,
  type GeneratorRunReport,
} from '../puzzle/generator/types';

import {
  parseDifficultyCorpusArgs,
  summarizeDifficultyCorpus,
} from './DifficultyCorpusAnalyzer';

import {
  writeDifficultyCorpusOutputs,
  writeTargetedDifficultyCorpusOutputs,
} from './DifficultyCorpusOutput';

import {
  summarizeTargetedDifficultyCorpus,
} from './TargetedDifficultyCorpusAnalyzer';

import {
  buildGeneratorRunReport,
} from './generateCandidates';

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
  formatTargetedDifficultyCorpusMarkdown,
  writeDifficultyCorpusOutputs,
  writeTargetedDifficultyCorpusOutputs,
} from './DifficultyCorpusOutput';

export {
  summarizeTargetedDifficultyCorpus,
} from './TargetedDifficultyCorpusAnalyzer';

export type {
  TargetedDifficultyCorpusArchetypeContribution,
  TargetedDifficultyCorpusReport,
  TargetedDifficultyCorpusSeedResult,
  TargetedDifficultyCorpusTargetSummary,
} from './TargetedDifficultyCorpusAnalyzer';

async function runCli(): Promise<void> {
  const options =
    parseDifficultyCorpusArgs(
      process.argv.slice(2),
    );

  console.info(
    `[Dungeon Logic] Difficulty corpus: ${options.seeds.length} seeds`,
  );

  if (
    options.difficulty ===
    'legacy-any'
  ) {
    await runLegacyCorpus(
      options.seeds,
    );
    return;
  }

  const targets:
    readonly TargetedDifficultyTarget[] =
      options.difficulty === 'all'
        ? [
            DifficultyTarget.Easy,
            DifficultyTarget.Medium,
            DifficultyTarget.Hard,
            DifficultyTarget.Expert,
          ]
        : [options.difficulty];

  await runTargetedCorpus(
    options.seeds,
    targets,
  );
}

async function runLegacyCorpus(
  seeds: readonly number[],
): Promise<void> {
  const pools:
    GeneratorPoolReport[] = [];

  for (const seed of seeds) {
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

async function runTargetedCorpus(
  seeds: readonly number[],
  targets:
    readonly TargetedDifficultyTarget[],
): Promise<void> {
  const reports:
    GeneratorRunReport[] = [];

  for (const target of targets) {
    for (const seed of seeds) {
      console.info(
        `Generating target ${target} seed ${seed}...`,
      );

      const report =
        buildGeneratorRunReport(
          {
            ...DEFAULT_GENERATOR_CONFIG,
            masterSeed: seed,
          },
          target,
        );

      reports.push(report);

      console.info(
        `target ${target} seed ${seed}: accepted=${report.pool.accepted.length} completed=${report.pool.completed} exact=${report.pool.targeting?.exactCount ?? 0} fallback=${report.pool.targeting?.fallbackCount ?? 0}`,
      );
    }
  }

  const report =
    summarizeTargetedDifficultyCorpus(
      reports,
    );

  const paths =
    await writeTargetedDifficultyCorpusOutputs(
      report,
    );

  for (const summary of report.summaries) {
    console.info(
      `target ${summary.target}: completed=${summary.completedSeeds}/${summary.seedCount} poolExact=${summary.poolExact}/${summary.totalAccepted} shortlistExact=${summary.shortlistExact}/${summary.shortlistSlots} backfillSeeds=${summary.backfillSeeds} unrated=${summary.unrated}`,
    );
  }

  console.info(
    `JSON: ${paths.jsonPath}`,
  );

  console.info(
    `Markdown: ${paths.markdownPath}`,
  );

  if (
    report.seedResults.some(
      (entry) =>
        !entry.completed,
    )
  ) {
    console.error(
      'Targeted difficulty corpus contains incomplete generator pools.',
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
