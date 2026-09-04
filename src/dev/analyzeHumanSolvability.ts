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
  analyzeDifficulty,
} from '../puzzle/difficulty/DifficultyAnalyzer';

import type {
  DifficultyProfile,
} from '../puzzle/difficulty/types';

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
  difficulty: DifficultyProfile;
}

export interface HumanDifficultyBandCounts {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  unrated: number;
}

export interface HumanDifficultySummary {
  bandCounts:
    HumanDifficultyBandCounts;
  minimumScore: number | null;
  medianScore: number | null;
  maximumScore: number | null;
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
  difficulty: HumanDifficultySummary;
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
  HumanRule.TreasureRoomStructuralConsensus,
  HumanRule.TreasureRoomHypothesisConsequence,
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
      (level) => {
        const result =
          analyzeHumanSolvability(
            level,
          );

        return {
          id: level.id,
          width: level.width,
          height: level.height,
          result,
          difficulty:
            analyzeDifficulty(
              level,
              result,
            ),
        };
      },
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

  const difficultyBandCounts:
    HumanDifficultyBandCounts = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    unrated: 0,
  };

  const ratedScores: number[] = [];

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

    difficultyBandCounts[
      analysis.difficulty.band
    ] += 1;

    if (
      analysis.difficulty.score !==
      null
    ) {
      ratedScores.push(
        analysis.difficulty.score,
      );
    }
  }

  ratedScores.sort(
    (a, b) => a - b,
  );

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
      difficulty: {
        bandCounts:
          difficultyBandCounts,
        minimumScore:
          ratedScores[0] ?? null,
        medianScore:
          median(ratedScores),
        maximumScore:
          ratedScores[
            ratedScores.length - 1
          ] ?? null,
      },
    },
    levels: analyses,
  };
}

function median(
  values: readonly number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const middle =
    Math.floor(
      values.length / 2,
    );

  if (values.length % 2 === 1) {
    return values[middle];
  }

  return (
    values[middle - 1] +
    values[middle]
  ) / 2;
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
    '- difficulty:',
    `  - easy: ${report.summary.difficulty.bandCounts.easy}`,
    `  - medium: ${report.summary.difficulty.bandCounts.medium}`,
    `  - hard: ${report.summary.difficulty.bandCounts.hard}`,
    `  - expert: ${report.summary.difficulty.bandCounts.expert}`,
    `  - unrated: ${report.summary.difficulty.bandCounts.unrated}`,
    `  - minimum score: ${formatNullableNumber(report.summary.difficulty.minimumScore)}`,
    `  - median score: ${formatNullableNumber(report.summary.difficulty.medianScore)}`,
    `  - maximum score: ${formatNullableNumber(report.summary.difficulty.maximumScore)}`,
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
      '- difficulty:',
      `  - version: ${analysis.difficulty.version}`,
      `  - band: ${analysis.difficulty.band}`,
      `  - score: ${formatNullableNumber(analysis.difficulty.score)}`,
      `  - reasoning tier: ${analysis.difficulty.reasoningTier}`,
      `  - board load: ${analysis.difficulty.components.boardLoad}`,
      `  - direct load: ${analysis.difficulty.components.directLoad}`,
      `  - advanced rule load: ${analysis.difficulty.components.advancedRuleLoad}`,
      `  - lookahead load: ${analysis.difficulty.components.lookaheadLoad}`,
      `  - ordinary contradictions: ${analysis.difficulty.ordinaryContradictions}`,
      `  - treasure room variant steps: ${analysis.difficulty.treasureRoomVariantSteps}`,
      `  - treasure room structural consensus steps: ${analysis.difficulty.treasureRoomStructuralConsensusSteps}`,
      `  - treasure room hypothesis consequence steps: ${analysis.difficulty.treasureRoomHypothesisConsequenceSteps}`,
      '  - reasons:',
      ...analysis.difficulty.reasons.map(
        (reason) =>
          `    - ${reason}`,
      ),
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

function formatNullableNumber(
  value: number | null,
): string {
  return value === null
    ? 'null'
    : String(value);
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
      `${analysis.id}: ${analysis.result.status} direct=${analysis.result.directSteps} contradiction=${analysis.result.contradictionSteps} unknown=${analysis.result.unknownRemaining} difficulty=${analysis.difficulty.band} score=${formatNullableNumber(analysis.difficulty.score)}`,
    );
  }

  console.info(
    `summary: total=${report.summary.total} direct=${report.summary.statusCounts['solved-direct']} contradiction=${report.summary.statusCounts['solved-with-contradiction']} stuck=${report.summary.statusCounts.stuck} invalid=${report.summary.statusCounts.invalid}`,
  );
  console.info(
    `difficulty: easy=${report.summary.difficulty.bandCounts.easy} medium=${report.summary.difficulty.bandCounts.medium} hard=${report.summary.difficulty.bandCounts.hard} expert=${report.summary.difficulty.bandCounts.expert} unrated=${report.summary.difficulty.bandCounts.unrated} min=${formatNullableNumber(report.summary.difficulty.minimumScore)} median=${formatNullableNumber(report.summary.difficulty.medianScore)} max=${formatNullableNumber(report.summary.difficulty.maximumScore)}`,
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
