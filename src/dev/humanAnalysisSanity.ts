import {
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';

import {
  join,
} from 'node:path';

import {
  tmpdir,
} from 'node:os';

import {
  DifficultyBand,
} from '../puzzle/difficulty/types';

import type {
  LevelDefinition,
} from '../puzzle/types';

import {
  HumanSolveStatus,
} from '../puzzle/human-solver/types';

import {
  analyzeHumanLevels,
  extractGeneratedShortlistLevels,
  formatHumanAnalysisMarkdown,
  parseHumanAnalysisArgs,
  writeHumanAnalysisOutputs,
} from './analyzeHumanSolvability';

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const directFixture: LevelDefinition = {
  id: 'human-analysis-direct',
  width: 3,
  height: 3,
  rowClues: [3, 0, 3],
  columnClues: [2, 2, 2],
  monsters: [
    { x: 0, y: 1 },
    { x: 2, y: 1 },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '###',
    '...',
    '###',
  ],
};

async function main(): Promise<void> {
  console.info(
    '[Dungeon Logic] Human analysis sanity',
  );

  const authored =
    parseHumanAnalysisArgs([
      '--authored',
    ]);

  assert(
    authored.mode === 'authored',
    '--authored must select authored mode.',
  );

  const generated =
    parseHumanAnalysisArgs([
      '--seed',
      '123456',
      '--shortlist',
    ]);

  assert(
    generated.mode ===
      'generated-shortlist' &&
    generated.seed === 123456,
    '--seed <uint32> --shortlist must select generated shortlist mode.',
  );

  let invalidRejected = false;

  try {
    parseHumanAnalysisArgs([
      '--seed',
      '-1',
      '--shortlist',
    ]);
  } catch {
    invalidRejected = true;
  }

  assert(
    invalidRejected,
    'Invalid human-analysis seed must be rejected.',
  );

  const report =
    analyzeHumanLevels(
      [directFixture],
      {
        mode: 'authored',
        seed: null,
      },
    );

  assert(
    report.levels.length === 1,
    'Human analysis report must contain every requested level.',
  );

  assert(
    report.levels[0].result.status ===
      HumanSolveStatus.SolvedDirect,
    'Direct fixture must be reported as solved-direct.',
  );

  assert(
    report.summary.statusCounts[
      HumanSolveStatus.SolvedDirect
    ] === 1,
    'Human analysis summary must count solved-direct levels.',
  );

  assert(
    report.levels.every(
      (entry) =>
        entry.difficulty.version ===
        1,
    ),
    'Every human-analysis level must carry Difficulty v1.',
  );

  assert(
    report.levels[0].difficulty.band ===
      DifficultyBand.Easy,
    'Direct human-analysis fixture must be easy.',
  );

  assert(
    Object.values(
      report.summary.difficulty
        .bandCounts,
    ).reduce(
      (sum, value) =>
        sum + value,
      0,
    ) === report.summary.total,
    'Difficulty band summary must cover every analyzed level.',
  );

  const generatedLevels =
    extractGeneratedShortlistLevels(
      {
        schemaVersion: 1,
        masterSeed: 123456,
        shortlist: [
          {
            accepted: {
              candidate: {
                level: directFixture,
              },
            },
          },
        ],
      },
      123456,
    );

  assert(
    generatedLevels.length === 1 &&
    generatedLevels[0].id ===
      directFixture.id,
    'Generated shortlist parser must recover LevelDefinition entries from the generator report.',
  );

  const markdown =
    formatHumanAnalysisMarkdown(
      report,
    );

  assert(
    markdown.includes(
      '# Dungeon Logic Human Solvability',
    ) &&
    markdown.includes(
      'solved-direct',
    ) &&
    markdown.includes(
      'line-fill',
    ) &&
    markdown.includes(
      '- difficulty:',
    ) &&
    markdown.includes(
      '- band:',
    ) &&
    markdown.includes(
      '- score:',
    ) &&
    markdown.includes(
      '- reasoning tier:',
    ) &&
    markdown.includes(
      '- board load:',
    ) &&
    markdown.includes(
      '- direct load:',
    ) &&
    markdown.includes(
      '- advanced rule load:',
    ) &&
    markdown.includes(
      '- lookahead load:',
    ) &&
    markdown.includes(
      '- treasure room structural consensus steps:',
    ) &&
    markdown.includes(
      '- treasure room hypothesis consequence steps:',
    ),
    'Human-analysis Markdown must expose status, rule counts, and difficulty.',
  );

  const tempRoot =
    await mkdtemp(
      join(
        tmpdir(),
        'dungeon-human-analysis-',
      ),
    );

  try {
    const paths =
      await writeHumanAnalysisOutputs(
        report,
        tempRoot,
      );

    const json =
      await readFile(
        paths.jsonPath,
        'utf8',
      );

    const md =
      await readFile(
        paths.markdownPath,
        'utf8',
      );

    assert(
      json.endsWith('\n') &&
      md.endsWith('\n'),
      'Human-analysis output files must end with a newline.',
    );

    assert(
      json.includes(
        '"difficulty"',
      ) &&
      json.includes(
        '"bandCounts"',
      ) &&
      json.includes(
        '"minimumScore"',
      ) &&
      json.includes(
        '"medianScore"',
      ) &&
      json.includes(
        '"maximumScore"',
      ) &&
      json.includes(
        '"treasureRoomStructuralConsensusSteps"',
      ) &&
      json.includes(
        '"treasureRoomHypothesisConsequenceSteps"',
      ),
      'Human-analysis JSON must serialize Difficulty v1 summary and profiles.',
    );

    const second =
      await writeHumanAnalysisOutputs(
        report,
        tempRoot,
      );

    assert(
      await readFile(
        second.jsonPath,
        'utf8',
      ) === json &&
      await readFile(
        second.markdownPath,
        'utf8',
      ) === md,
      'Human-analysis outputs must be byte-deterministic for identical input.',
    );
  } finally {
    await rm(
      tempRoot,
      {
        recursive: true,
        force: true,
      },
    );
  }

  console.info(
    'PASS: CLI parsing',
  );
  console.info(
    'PASS: authored report',
  );
  console.info(
    'PASS: generated shortlist extraction',
  );
  console.info(
    'PASS: deterministic output writers',
  );
  console.info(
    '15/15 checks passed',
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);
