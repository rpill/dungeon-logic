import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import {
  join,
  resolve,
} from 'node:path';

import {
  pathToFileURL,
} from 'node:url';

import {
  createCandidatePool,
} from '../puzzle/generator/CandidateFactory';

import {
  selectShortlist,
} from '../puzzle/generator/CandidateRanker';

import {
  DEFAULT_GENERATOR_CONFIG,
  RejectionReason,
  type GeneratorConfig,
  type GeneratorRunReport,
  type RankedCandidate,
} from '../puzzle/generator/types';


export function parseMasterSeed(
  args: readonly string[],
): number {
  if (
    args.length !== 2 ||
    args[0] !== '--seed' ||
    !/^[0-9]+$/.test(args[1])
  ) {
    throw new Error(
      'Usage: npm run generate:candidates -- --seed <uint32>',
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

export function buildGeneratorRunReport(
  config: GeneratorConfig,
): GeneratorRunReport {
  const pool =
    createCandidatePool(config);

  const shortlist =
    pool.completed
      ? selectShortlist(
          pool,
          config.shortlistPerArchetype,
        )
      : [];

  return {
    schemaVersion: 1,
    masterSeed: pool.masterSeed,
    config: pool.config,
    pool,
    shortlist,
  };
}

export function createSerializableReport(
  report: GeneratorRunReport,
): unknown {
  return {
    schemaVersion: report.schemaVersion,
    masterSeed: report.masterSeed,
    config: report.config,
    pool: report.pool,
    shortlist: report.shortlist,
  };
}

export function formatShortlistMarkdown(
  report: GeneratorRunReport,
): string {
  const lines: string[] = [
    '# Dungeon Logic Generator v1',
    '',
    `Master seed: ${report.masterSeed}`,
    '',
  ];

  if (report.shortlist.length === 0) {
    lines.push(
      '_No shortlisted candidates._',
      '',
    );

    return lines.join('\n');
  }

  let currentArchetype:
    string | null = null;

  for (
    const ranked
    of report.shortlist
  ) {
    const candidate =
      ranked.accepted.candidate;

    if (
      candidate.archetype !==
      currentArchetype
    ) {
      currentArchetype =
        candidate.archetype;

      lines.push(
        `## ${currentArchetype}`,
        '',
      );
    }

    appendCandidate(
      lines,
      ranked,
    );
  }

  return lines.join('\n');
}

function appendCandidate(
  lines: string[],
  ranked: RankedCandidate,
): void {
  const accepted =
    ranked.accepted;

  const candidate =
    accepted.candidate;

  const level =
    candidate.level;

  const metrics =
    accepted.quality.metrics;

  lines.push(
    `### #${ranked.rankWithinArchetype} ${candidate.id}`,
    '',
    `- archetype: ${candidate.archetype}`,
    `- candidate seed: ${candidate.seed}`,
    `- size: ${candidate.size}x${candidate.size}`,
    `- row clues: ${level.rowClues.join(', ')}`,
    `- column clues: ${level.columnClues.join(', ')}`,
    `- Monsters: ${formatPositions(level.monsters)}`,
    `- Chests: ${formatPositions(level.chests)}`,
    `- solutionCount: ${accepted.solutionCount}`,
    `- quality score: ${ranked.qualityScore}`,
    `- diversity score: ${ranked.diversityScore}`,
    `- selection score: ${ranked.selectionScore}`,
    `- wall density: ${formatMetric(metrics.wallDensity)}`,
    `- thick-wall ratio: ${formatMetric(metrics.thickWallCellRatio)}`,
    `- wall/open boundary: ${formatMetric(metrics.wallOpenBoundaryPerWall)}`,
    `- largest wall component: ${formatMetric(metrics.largestWallComponentRatio)}`,
    '',
    '```text',
    ...level.solution,
    '```',
    '',
  );
}

function formatPositions(
  positions:
    readonly {
      x: number;
      y: number;
    }[],
): string {
  if (positions.length === 0) {
    return 'none';
  }

  return positions
    .map(
      (position) =>
        `(${position.x},${position.y})`,
    )
    .join(', ');
}

function formatMetric(
  value: number,
): string {
  return value.toFixed(3);
}

export interface GeneratorOutputPaths {
  jsonPath: string;
  markdownPath: string;
}

export async function writeGeneratorOutputs(
  report: GeneratorRunReport,
  outputDirectory = '.generated',
): Promise<GeneratorOutputPaths> {
  await mkdir(
    outputDirectory,
    {
      recursive: true,
    },
  );

  const jsonPath =
    join(
      outputDirectory,
      `candidates-${report.masterSeed}.json`,
    );

  const markdownPath =
    join(
      outputDirectory,
      `shortlist-${report.masterSeed}.md`,
    );

  const jsonText =
    JSON.stringify(
      createSerializableReport(
        report,
      ),
      null,
      2,
    ) + '\n';

  const markdown =
    formatShortlistMarkdown(
      report,
    );

  const markdownText =
    markdown.endsWith('\n')
      ? markdown
      : `${markdown}\n`;

  await writeFile(
    jsonPath,
    jsonText,
    'utf8',
  );

  await writeFile(
    markdownPath,
    markdownText,
    'utf8',
  );

  return {
    jsonPath,
    markdownPath,
  };
}

async function runCli(): Promise<void> {
  const masterSeed =
    parseMasterSeed(
      process.argv.slice(2),
    );

  const report =
    buildGeneratorRunReport({
      ...DEFAULT_GENERATOR_CONFIG,
      masterSeed,
    });

  const paths =
    await writeGeneratorOutputs(
      report,
    );

  printRunSummary(
    report,
    paths,
  );

  if (!report.pool.completed) {
    process.exitCode = 1;
  }
}

function printRunSummary(
  report: GeneratorRunReport,
  paths: GeneratorOutputPaths,
): void {
  console.info(
    `[Dungeon Logic] Generator v1 seed ${report.masterSeed}`,
  );

  for (
    const archetypeResult
    of report.pool.archetypes
  ) {
    const stats =
      archetypeResult.stats;

    console.info(
      [
        `${stats.archetype}:`,
        `attempts=${stats.attempts}`,
        `accepted=${stats.accepted}`,
        `generation-failed=${stats.rejectionCounts[RejectionReason.GenerationFailed]}`,
        `invalid=${stats.rejectionCounts[RejectionReason.Invalid]}`,
        `non-unique=${stats.rejectionCounts[RejectionReason.NonUnique]}`,
        `hard-quality=${stats.rejectionCounts[RejectionReason.HardQuality]}`,
        `geometry-warning=${stats.rejectionCounts[RejectionReason.GeometryWarning]}`,
      ].join(' '),
    );
  }

  console.info(
    `Total accepted: ${report.pool.accepted.length}`,
  );

  console.info(
    `Shortlisted: ${report.shortlist.length}`,
  );

  console.info(
    `JSON: ${paths.jsonPath}`,
  );

  console.info(
    `Markdown: ${paths.markdownPath}`,
  );

  if (!report.pool.completed) {
    const exhausted =
      report.pool.archetypes
        .filter(
          (result) =>
            result.exhausted,
        )
        .map(
          (result) =>
            result.stats.archetype,
        );

    console.error(
      `Generator pool incomplete. Exhausted archetypes: ${exhausted.join(', ')}`,
    );
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
        `[Dungeon Logic] Generator failed: ${message}`,
      );

      process.exitCode = 1;
    },
  );
}
