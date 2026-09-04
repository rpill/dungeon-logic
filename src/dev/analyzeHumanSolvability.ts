import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';

import {
  join,
} from 'node:path';

import {
  levels as authoredLevels,
} from '../data/levels';

import {
  analyzeHumanSolvability,
} from '../puzzle/human-solver/HumanSolver';

import {
  HumanRule,
  HumanSolveStatus,
  type HumanSolveResult,
} from '../puzzle/human-solver/types';

import type {
  DoorDefinition,
  GridPosition,
  LevelDefinition,
} from '../puzzle/types';

export type HumanAnalysisMode =
  | 'authored'
  | 'generated-shortlist';

export type HumanAnalysisCliOptions =
  | {
      mode: 'authored';
    }
  | {
      mode: 'generated-shortlist';
      seed: number;
    };

export interface HumanAnalysisSource {
  mode: HumanAnalysisMode;
  seed: number | null;
}

export interface HumanLevelAnalysis {
  id: string;
  width: number;
  height: number;
  result: HumanSolveResult;
}

export interface HumanAnalysisStatusCounts {
  'solved-direct': number;
  'solved-with-contradiction': number;
  stuck: number;
  invalid: number;
}

export interface HumanAnalysisSummary {
  total: number;
  statusCounts: HumanAnalysisStatusCounts;
  directSteps: number;
  contradictionSteps: number;
  assignments: number;
  unknownRemaining: number;
}

export interface HumanAnalysisReport {
  schemaVersion: 1;
  source: HumanAnalysisSource;
  summary: HumanAnalysisSummary;
  levels: readonly HumanLevelAnalysis[];
}

export interface HumanAnalysisOutputPaths {
  jsonPath: string;
  markdownPath: string;
}

const HUMAN_RULE_ORDER = [
  HumanRule.LineComplete,
  HumanRule.LineFill,
  HumanRule.Door,
  HumanRule.TreasureRoomInterior,
  HumanRule.TreasureRoomEntrance,
  HumanRule.TreasureRoomVariant,
  HumanRule.MonsterDeadEnd,
  HumanRule.HallwayNotDeadEnd,
  HumanRule.Open2x2,
  HumanRule.Connectivity,
  HumanRule.Contradiction,
] as const;

export function parseHumanAnalysisArgs(
  args: readonly string[],
): HumanAnalysisCliOptions {
  if (
    args.length === 1 &&
    args[0] === '--authored'
  ) {
    return {
      mode: 'authored',
    };
  }

  if (
    args.length === 3 &&
    args[0] === '--seed' &&
    args[2] === '--shortlist'
  ) {
    return {
      mode: 'generated-shortlist',
      seed: parseUint32Seed(
        args[1],
      ),
    };
  }

  throw new Error(
    'Usage: npm run analyze:human -- --authored OR npm run analyze:human -- --seed <uint32> --shortlist',
  );
}

function parseUint32Seed(
  value: string,
): number {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(
      'Human-analysis seed must be a decimal uint32 value.',
    );
  }

  const seed = Number(value);

  if (
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0xffff_ffff
  ) {
    throw new RangeError(
      'Human-analysis seed must be from 0 to 4294967295.',
    );
  }

  return seed;
}

export function analyzeHumanLevels(
  levels: readonly LevelDefinition[],
  source: HumanAnalysisSource,
): HumanAnalysisReport {
  const analyses =
    levels.map(
      (level) => ({
        id: level.id,
        width: level.width,
        height: level.height,
        result:
          analyzeHumanSolvability(
            level,
          ),
      }),
    );

  const statusCounts:
    HumanAnalysisStatusCounts = {
    [HumanSolveStatus.SolvedDirect]: 0,
    [HumanSolveStatus
      .SolvedWithContradiction]: 0,
    [HumanSolveStatus.Stuck]: 0,
    [HumanSolveStatus.Invalid]: 0,
  };

  let directSteps = 0;
  let contradictionSteps = 0;
  let assignments = 0;
  let unknownRemaining = 0;

  for (
    const analysis
    of analyses
  ) {
    statusCounts[
      analysis.result.status
    ] += 1;

    directSteps +=
      analysis.result.directSteps;
    contradictionSteps +=
      analysis.result
        .contradictionSteps;
    assignments +=
      analysis.result.assignments;
    unknownRemaining +=
      analysis.result
        .unknownRemaining;
  }

  return {
    schemaVersion: 1,
    source,
    summary: {
      total: analyses.length,
      statusCounts,
      directSteps,
      contradictionSteps,
      assignments,
      unknownRemaining,
    },
    levels: analyses,
  };
}

export function extractGeneratedShortlistLevels(
  input: unknown,
  expectedSeed: number,
): readonly LevelDefinition[] {
  const root = asRecord(input);

  if (root === null) {
    throw new Error(
      'Generated candidate report must be an object.',
    );
  }

  if (
    root.masterSeed !==
    expectedSeed
  ) {
    throw new Error(
      `Generated candidate report seed does not match ${expectedSeed}.`,
    );
  }

  if (!Array.isArray(root.shortlist)) {
    throw new Error(
      'Generated candidate report must contain a shortlist array.',
    );
  }

  const result:
    LevelDefinition[] = [];

  for (
    const ranked
    of root.shortlist
  ) {
    const rankedRecord =
      asRecord(ranked);

    const accepted =
      rankedRecord === null
        ? null
        : asRecord(
            rankedRecord.accepted,
          );

    const candidate =
      accepted === null
        ? null
        : asRecord(
            accepted.candidate,
          );

    const level =
      candidate?.level;

    if (!isLevelDefinition(level)) {
      throw new Error(
        'Generated shortlist contains a malformed candidate level.',
      );
    }

    result.push(level);
  }

  if (result.length === 0) {
    throw new Error(
      'Generated candidate shortlist is empty.',
    );
  }

  return result;
}

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function isLevelDefinition(
  value: unknown,
): value is LevelDefinition {
  const record = asRecord(value);

  if (record === null) {
    return false;
  }

  return (
    typeof record.id === 'string' &&
    isPositiveInteger(
      record.width,
    ) &&
    isPositiveInteger(
      record.height,
    ) &&
    isNumberArray(
      record.rowClues,
    ) &&
    isNumberArray(
      record.columnClues,
    ) &&
    isPositionArray(
      record.monsters,
    ) &&
    isPositionArray(
      record.chests,
    ) &&
    isPositionArray(
      record.blockers,
    ) &&
    isDoorArray(
      record.doors,
    ) &&
    isStringArray(
      record.solution,
    )
  );
}

function isPositiveInteger(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  );
}

function isNumberArray(
  value: unknown,
): value is readonly number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'number' &&
        Number.isInteger(entry),
    )
  );
}

function isStringArray(
  value: unknown,
): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'string',
    )
  );
}

function isPositionArray(
  value: unknown,
): value is readonly GridPosition[] {
  return (
    Array.isArray(value) &&
    value.every(isGridPosition)
  );
}

function isGridPosition(
  value: unknown,
): value is GridPosition {
  const record = asRecord(value);

  return (
    record !== null &&
    typeof record.x === 'number' &&
    Number.isInteger(record.x) &&
    typeof record.y === 'number' &&
    Number.isInteger(record.y)
  );
}

function isDoorArray(
  value: unknown,
): value is readonly DoorDefinition[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) => {
        const record =
          asRecord(entry);

        return (
          record !== null &&
          isGridPosition(
            record.position,
          ) &&
          (
            record.orientation ===
              'horizontal' ||
            record.orientation ===
              'vertical'
          )
        );
      },
    )
  );
}

export function formatHumanAnalysisMarkdown(
  report: HumanAnalysisReport,
): string {
  const lines: string[] = [
    '# Dungeon Logic Human Solvability',
    '',
    `Source: ${formatSource(report.source)}`,
    '',
    '## Summary',
    '',
    `- total: ${report.summary.total}`,
    `- solved-direct: ${report.summary.statusCounts['solved-direct']}`,
    `- solved-with-contradiction: ${report.summary.statusCounts['solved-with-contradiction']}`,
    `- stuck: ${report.summary.statusCounts.stuck}`,
    `- invalid: ${report.summary.statusCounts.invalid}`,
    `- direct steps: ${report.summary.directSteps}`,
    `- contradiction steps: ${report.summary.contradictionSteps}`,
    `- assignments: ${report.summary.assignments}`,
    `- unknown remaining: ${report.summary.unknownRemaining}`,
    '',
  ];

  for (
    const analysis
    of report.levels
  ) {
    lines.push(
      `## ${analysis.id}`,
      '',
      `- size: ${analysis.width}x${analysis.height}`,
      `- status: ${analysis.result.status}`,
      `- direct steps: ${analysis.result.directSteps}`,
      `- contradiction steps: ${analysis.result.contradictionSteps}`,
      `- assignments: ${analysis.result.assignments}`,
      `- unknown remaining: ${analysis.result.unknownRemaining}`,
      '- rule counts:',
    );

    for (
      const rule
      of HUMAN_RULE_ORDER
    ) {
      lines.push(
        `  - ${rule}: ${analysis.result.ruleCounts[rule]}`,
      );
    }

    const contradictionSteps =
      analysis.result.steps.filter(
        (step) =>
          step.rule ===
          HumanRule.Contradiction,
      );

    if (
      contradictionSteps.length > 0
    ) {
      lines.push(
        '- contradiction proofs:',
      );

      for (
        const step
        of contradictionSteps
      ) {
        const proof = step.proof;

        if (proof === null) {
          continue;
        }

        const committed =
          step.assignments[0];

        lines.push(
          `  - assume (${proof.assumption.position.x},${proof.assumption.position.y})=${proof.assumption.value.toUpperCase()} -> ${proof.contradiction} -> commit (${committed.position.x},${committed.position.y})=${committed.value.toUpperCase()}`,
        );
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

function formatSource(
  source: HumanAnalysisSource,
): string {
  if (source.mode === 'authored') {
    return 'authored levels';
  }

  return (
    `generated shortlist, seed ${source.seed}`
  );
}

export async function writeHumanAnalysisOutputs(
  report: HumanAnalysisReport,
  outputDirectory = '.generated',
): Promise<HumanAnalysisOutputPaths> {
  await mkdir(
    outputDirectory,
    {
      recursive: true,
    },
  );

  const suffix =
    report.source.mode ===
      'authored'
      ? 'authored'
      : String(
          report.source.seed,
        );

  const jsonPath = join(
    outputDirectory,
    `human-analysis-${suffix}.json`,
  );

  const markdownPath = join(
    outputDirectory,
    `human-analysis-${suffix}.md`,
  );

  const jsonText =
    JSON.stringify(
      report,
      null,
      2,
    ) + '\n';

  const markdown =
    formatHumanAnalysisMarkdown(
      report,
    );

  await writeFile(
    jsonPath,
    jsonText,
    'utf8',
  );

  await writeFile(
    markdownPath,
    markdown.endsWith('\n')
      ? markdown
      : `${markdown}\n`,
    'utf8',
  );

  return {
    jsonPath,
    markdownPath,
  };
}

async function runCli(): Promise<void> {
  const options =
    parseHumanAnalysisArgs(
      process.argv.slice(2),
    );

  let source:
    HumanAnalysisSource;
  let levels:
    readonly LevelDefinition[];

  if (options.mode === 'authored') {
    source = {
      mode: 'authored',
      seed: null,
    };
    levels = authoredLevels;
  } else {
    const reportPath = join(
      '.generated',
      `candidates-${options.seed}.json`,
    );

    const text =
      await readFile(
        reportPath,
        'utf8',
      );

    levels =
      extractGeneratedShortlistLevels(
        JSON.parse(text) as unknown,
        options.seed,
      );

    source = {
      mode:
        'generated-shortlist',
      seed: options.seed,
    };
  }

  const report =
    analyzeHumanLevels(
      levels,
      source,
    );

  const paths =
    await writeHumanAnalysisOutputs(
      report,
    );

  printHumanAnalysisSummary(
    report,
    paths,
  );
}

function printHumanAnalysisSummary(
  report: HumanAnalysisReport,
  paths: HumanAnalysisOutputPaths,
): void {
  console.info(
    '[Dungeon Logic] Human solvability analysis',
  );
  console.info(
    `source: ${formatSource(report.source)}`,
  );

  for (
    const analysis
    of report.levels
  ) {
    console.info(
      `${analysis.id}: ${analysis.result.status} direct=${analysis.result.directSteps} contradiction=${analysis.result.contradictionSteps} unknown=${analysis.result.unknownRemaining}`,
    );
  }

  console.info(
    `summary: total=${report.summary.total} direct=${report.summary.statusCounts['solved-direct']} contradiction=${report.summary.statusCounts['solved-with-contradiction']} stuck=${report.summary.statusCounts.stuck} invalid=${report.summary.statusCounts.invalid}`,
  );
  console.info(
    `wrote: ${paths.jsonPath}`,
  );
  console.info(
    `wrote: ${paths.markdownPath}`,
  );
}

const entryPath =
  process.argv[1] ?? '';

if (
  entryPath.endsWith(
    'analyzeHumanSolvability.ts',
  ) ||
  entryPath.endsWith(
    'analyzeHumanSolvability.js',
  )
) {
  runCli().catch(
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
