import {
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';

import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  writeDifficultyCorpusOutputs,
  writeTargetedDifficultyCorpusOutputs,
} from './DifficultyCorpusOutput';

import {
  formatDifficultyCorpusMarkdown,
  parseDifficultyCorpusArgs,
  summarizeDifficultyCorpus,
} from './DifficultyCorpusAnalyzer';

import {
  summarizeTargetedDifficultyCorpus,
} from './TargetedDifficultyCorpusAnalyzer';

import {
  DifficultyBand,
  type DifficultyBand as DifficultyBandType,
} from '../puzzle/difficulty/types';

import {
  ALL_GENERATOR_ARCHETYPES,
  GeneratorArchetype,
  RejectionReason,
  type AcceptedCandidate,
  type ArchetypePoolResult,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorPoolReport,
  type GeneratorRunReport,
} from '../puzzle/generator/types';

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function checkCliParsing(): void {
  const parsed =
    parseDifficultyCorpusArgs([
      '--seeds',
      '1,42,123456,4294967295',
    ]);

  assert(
    JSON.stringify(parsed.seeds) ===
      JSON.stringify([
        1,
        42,
        123456,
        4294967295,
      ]),
    'CLI must preserve explicit seed order.',
  );

  assert(
    parsed.difficulty === 'legacy-any',
    'Legacy corpus CLI must preserve the original any-pool mode.',
  );

  const targeted =
    parseDifficultyCorpusArgs([
      '--seeds',
      '42,7',
      '--difficulty',
      'medium',
    ]);

  assert(
    targeted.difficulty ===
      DifficultyBand.Medium &&
      JSON.stringify(targeted.seeds) ===
        JSON.stringify([42, 7]),
    'Targeted corpus CLI must parse a rated difficulty target without reordering seeds.',
  );

  const allTargets =
    parseDifficultyCorpusArgs([
      '--seeds',
      '1',
      '--difficulty',
      'all',
    ]);

  assert(
    allTargets.difficulty === 'all',
    'Targeted corpus CLI must expose the all-target mode.',
  );

  for (
    const args
    of [
      [],
      ['--seeds'],
      ['--seed', '1,2'],
      ['--seeds', ''],
      ['--seeds', '1,'],
      ['--seeds', '-1,2'],
      ['--seeds', '1,4294967296'],
      ['--seeds', '1,1'],
      ['--seeds', '1', '--difficulty'],
      ['--seeds', '1', '--difficulty', 'any'],
      ['--seeds', '1', '--difficulty', 'impossible'],
      ['--difficulty', 'medium', '--seeds', '1'],
    ]
  ) {
    assertThrows(
      () => {
        parseDifficultyCorpusArgs(
          args,
        );
      },
      `Expected CLI rejection for ${JSON.stringify(args)}.`,
    );
  }
}

function checkCorpusSummary(): void {
  const pools = [
    createPool(
      11,
      DifficultyBand.Easy,
    ),
    createPool(
      22,
      DifficultyBand.Hard,
    ),
  ];

  const report =
    summarizeDifficultyCorpus(
      pools,
      1,
    );

  assert(
    report.schemaVersion === 1,
    'Corpus report schema must be v1.',
  );

  assert(
    JSON.stringify(report.seeds) ===
      JSON.stringify([11, 22]),
    'Corpus report must preserve seed order.',
  );

  assert(
    report.summary.seedCount === 2 &&
      report.summary.completedSeeds === 2 &&
      report.summary.totalAccepted === 10,
    'Corpus summary must aggregate both synthetic pools.',
  );

  assert(
    report.summary.bandCounts.easy === 5 &&
      report.summary.bandCounts.hard === 5 &&
      report.summary.bandCounts.medium === 0 &&
      report.summary.bandCounts.expert === 0 &&
      report.summary.bandCounts.unrated === 0,
    'Corpus band counts must aggregate accepted candidates.',
  );

  const monster =
    report.archetypes.find(
      (entry) =>
        entry.archetype ===
        GeneratorArchetype.MonsterOnly,
    );

  assert(
    monster !== undefined,
    'Monster-only aggregate must exist.',
  );

  assert(
    monster.bandCounts.easy === 1 &&
      monster.bandCounts.hard === 1,
    'Per-archetype band counts must aggregate seeds.',
  );

  assert(
    monster.coverage.easy.minAvailable === 0 &&
      monster.coverage.easy.maxAvailable === 1 &&
      monster.coverage.easy.seedsWithAny === 1 &&
      monster.coverage.easy.seedsWithAtLeastTargetSlots === 1 &&
      monster.coverage.easy.classification === 'partial',
    'Coverage must expose cross-seed availability for easy.',
  );

  assert(
    monster.coverage.medium.classification === 'none',
    'Never-generated bands must classify as none.',
  );

  const easyTarget =
    report.targets.find(
      (entry) =>
        entry.target ===
        DifficultyBand.Easy,
    );

  assert(
    easyTarget !== undefined,
    'Easy target aggregate must exist.',
  );

  assert(
    easyTarget.totalSlots === 10 &&
      easyTarget.exactSlots === 5 &&
      easyTarget.fallbackSlots === 5 &&
      easyTarget.exactRate === 0.5,
    'Target aggregate must distinguish exact hits from fallbacks.',
  );

  const hardTarget =
    report.targets.find(
      (entry) =>
        entry.target ===
        DifficultyBand.Hard,
    );

  assert(
    hardTarget !== undefined &&
      hardTarget.exactSlots === 5 &&
      hardTarget.fallbackSlots === 5,
    'Hard target must mirror the synthetic availability split.',
  );

  const markdown =
    formatDifficultyCorpusMarkdown(
      report,
    );

  for (
    const required
    of [
      '# Dungeon Logic Difficulty Corpus',
      'Seeds: 11, 22',
      '## Accepted difficulty distribution',
      '## Archetype coverage',
      '## Target shortlist performance',
      'stable-full',
      'partial',
      'none',
    ]
  ) {
    assert(
      markdown.includes(required),
      `Markdown must include ${required}.`,
    );
  }

  const second =
    summarizeDifficultyCorpus(
      pools,
      1,
    );

  assert(
    JSON.stringify(report) ===
      JSON.stringify(second),
    'Corpus summary must be deterministic.',
  );
}

function createPool(
  seed: number,
  band: DifficultyBandType,
): GeneratorPoolReport {
  const archetypes:
    ArchetypePoolResult[] = [];

  const allAccepted:
    AcceptedCandidate[] = [];

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const accepted =
      createAccepted(
        seed,
        archetype,
        band,
      );

    allAccepted.push(accepted);

    archetypes.push({
      stats: {
        archetype,
        attempts: 1,
        accepted: 1,
        rejectionCounts:
          createEmptyRejectionCounts(),
      },
      accepted: [accepted],
      rejectionSamples: [],
      exhausted: false,
    });
  }

  return {
    masterSeed: seed,
    config: {
      masterSeed: seed,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 1,
    },
    archetypes,
    accepted: allAccepted,
    completed: true,
  };
}

function createAccepted(
  seed: number,
  archetype: GeneratorArchetypeType,
  band: DifficultyBandType,
): AcceptedCandidate {
  const size =
    archetype ===
        GeneratorArchetype.ChestTwoRooms ||
      archetype ===
        GeneratorArchetype.MixedTwoRooms
      ? 7
      : 6;

  return {
    candidate: {
      id: `${archetype}-${seed}`,
      seed,
      archetype,
      size,
      rooms: [],
      level: {
        id: `${archetype}-${seed}`,
        width: size,
        height: size,
        rowClues:
          Array.from(
            { length: size },
            () => 0,
          ),
        columnClues:
          Array.from(
            { length: size },
            () => 0,
          ),
        monsters: [],
        chests: [],
        blockers: [],
        doors: [],
        solution:
          Array.from(
            { length: size },
            () => '.'.repeat(size),
          ),
      },
    },
    quality: {
      passes: true,
      issues: [],
      warnings: [],
      metrics: {
        wallDensity: 0.5,
        fullWallLineCount: 0,
        nearFullWallLineCount: 0,
        solidWall3x3Count: 0,
        thickWallCellCount: 0,
        thickWallCellRatio: 0.2,
        wallOpenBoundaryEdgeCount: 10,
        wallOpenBoundaryPerWall: 1.6,
        largestWallComponentSize: 1,
        largestWallComponentRatio: 0.2,
        largestWallComponentPerimeterPerWall: 2,
        clueOnlyForcedWallCount: 0,
        clueOnlyForcedWallRatio: 0,
        objectAwareForcedWallCount: 0,
        objectAssistedForcedWallCount: 0,
        basicPropagationResolvedWallCount: 0,
        basicPropagationResolvedNonWallCount: 0,
        basicPropagationResolvedCount: 0,
        basicPropagationResolvedRatio: 0,
      },
    },
    solutionCount: 1,
    difficulty: {
      version: 1,
      score:
        band === DifficultyBand.Unrated
          ? null
          : band === DifficultyBand.Easy
            ? 12
            : band === DifficultyBand.Medium
              ? 37
              : band === DifficultyBand.Hard
                ? 62
                : 87,
      band,
      reasoningTier:
        band === DifficultyBand.Easy
          ? 'direct'
          : band === DifficultyBand.Medium
            ? 'contradiction-light'
            : band === DifficultyBand.Hard
              ? 'contradiction-heavy'
              : band === DifficultyBand.Expert
                ? 'expert-lookahead'
                : 'unrated',
      components: {
        boardLoad: 0,
        directLoad: 0,
        advancedRuleLoad: 0,
        lookaheadLoad: 0,
      },
      ordinaryContradictions: 0,
      treasureRoomVariantSteps: 0,
      treasureRoomStructuralConsensusSteps: 0,
      treasureRoomHypothesisConsequenceSteps: 0,
      reasons: [],
    },
  };
}

function createEmptyRejectionCounts():
  Record<
    typeof RejectionReason[keyof typeof RejectionReason],
    number
  > {
  return {
    [RejectionReason.GenerationFailed]: 0,
    [RejectionReason.Duplicate]: 0,
    [RejectionReason.MonsterDensity]: 0,
    [RejectionReason.Invalid]: 0,
    [RejectionReason.NonUnique]: 0,
    [RejectionReason.HardQuality]: 0,
    [RejectionReason.GeometryWarning]: 0,
  };
}

function createTargetedRunReport(
  seed: number,
  target:
    | typeof DifficultyBand.Easy
    | typeof DifficultyBand.Medium
    | typeof DifficultyBand.Hard
    | typeof DifficultyBand.Expert,
  band: DifficultyBandType,
): GeneratorRunReport {
  const pool = createPool(seed, band);

  const quotas = {
    [GeneratorArchetype.MonsterOnly]: 1,
    [GeneratorArchetype.ChestOneRoom]: 1,
    [GeneratorArchetype.ChestTwoRooms]: 1,
    [GeneratorArchetype.MixedOneRoom]: 1,
    [GeneratorArchetype.MixedTwoRooms]: 1,
  } as const;

  const exactCount =
    pool.accepted.filter(
      (accepted) =>
        accepted.difficulty.band === target,
    ).length;

  const targetedPool: GeneratorPoolReport = {
    ...pool,
    config: {
      ...pool.config,
      difficultyTarget: target,
    },
    targeting: {
      difficultyTarget: target,
      requestedPoolSize: 50,
      nominalQuotas: quotas,
      archetypes:
        ALL_GENERATOR_ARCHETYPES.map(
          (archetype) => ({
            archetype,
            nominalQuota: 1,
            reservoirGoal: 2,
            reservoirCount: 1,
            finalAccepted: 1,
            exactCount:
              band === target ? 1 : 0,
            fallbackCount:
              band === target ? 0 : 1,
          }),
        ),
      exactCount,
      fallbackCount:
        pool.accepted.length - exactCount,
      exactRate:
        exactCount / pool.accepted.length,
      backfillUsed: false,
      backfillCount: 0,
      missingSlots: 0,
    },
  };

  const shortlist =
    targetedPool.accepted
      .slice(0, 3)
      .map(
        (accepted, index) => ({
          accepted,
          qualityScore: 100,
          diversityScore: index === 0 ? 1 : 0.5,
          selectionScore: 100,
          rankWithinArchetype: 1,
        }),
      );

  const shortlistExact =
    shortlist.filter(
      (entry) =>
        entry.accepted.difficulty.band === target,
    ).length;

  const shortlistArchetypeCounts = {
    [GeneratorArchetype.MonsterOnly]: 0,
    [GeneratorArchetype.ChestOneRoom]: 0,
    [GeneratorArchetype.ChestTwoRooms]: 0,
    [GeneratorArchetype.MixedOneRoom]: 0,
    [GeneratorArchetype.MixedTwoRooms]: 0,
  };

  for (const entry of shortlist) {
    shortlistArchetypeCounts[
      entry.accepted.candidate.archetype
    ] += 1;
  }

  return {
    schemaVersion: 1,
    masterSeed: seed,
    difficultyTarget: target,
    config: targetedPool.config,
    pool: targetedPool,
    shortlist,
    shortlistTargeting: {
      difficultyTarget: target,
      requestedShortlistSize: 15,
      exactCount: shortlistExact,
      fallbackCount:
        shortlist.length - shortlistExact,
      exactRate:
        shortlist.length === 0
          ? 0
          : shortlistExact / shortlist.length,
      archetypeCounts:
        shortlistArchetypeCounts,
    },
  };
}

function checkTargetedCorpusSummary(): void {
  const reports = [
    createTargetedRunReport(
      11,
      DifficultyBand.Medium,
      DifficultyBand.Medium,
    ),
    createTargetedRunReport(
      22,
      DifficultyBand.Medium,
      DifficultyBand.Hard,
    ),
  ];

  const report =
    summarizeTargetedDifficultyCorpus(
      reports,
    );

  assert(
    report.mode === 'targeted' &&
      JSON.stringify(report.seeds) ===
        JSON.stringify([11, 22]) &&
      JSON.stringify(report.targets) ===
        JSON.stringify([DifficultyBand.Medium]),
    'Targeted corpus must preserve deterministic seed order and target identity.',
  );

  const medium = report.summaries[0];

  assert(
    medium !== undefined &&
      medium.seedCount === 2 &&
      medium.completedSeeds === 2 &&
      medium.totalAccepted === 10 &&
      medium.poolExact === 5 &&
      medium.poolFallback === 5 &&
      medium.poolExactRate === 0.5,
    'Targeted corpus must aggregate exact/fallback pool arithmetic.',
  );

  assert(
    medium.shortlistSlots === 6 &&
      medium.shortlistExact === 3 &&
      medium.shortlistFallback === 3 &&
      medium.shortlistExactRate === 0.5,
    'Targeted corpus must aggregate global shortlist exact/fallback arithmetic.',
  );

  assert(
    medium.backfillSeeds === 0 &&
      medium.unrated === 0,
    'Synthetic targeted corpus must expose backfill and unrated counts.',
  );

  const repeated =
    summarizeTargetedDifficultyCorpus(
      reports,
    );

  assert(
    JSON.stringify(report) ===
      JSON.stringify(repeated),
    'Targeted corpus summary must be deterministic.',
  );
}

function assertThrows(
  action: () => void,
  message: string,
): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(threw, message);
}

async function checkOutputWriter(): Promise<void> {
  const report =
    summarizeDifficultyCorpus(
      [
        createPool(11, DifficultyBand.Easy),
        createPool(22, DifficultyBand.Hard),
      ],
      1,
    );

  const directory =
    await mkdtemp(
      join(
        tmpdir(),
        'dungeon-logic-difficulty-corpus-',
      ),
    );

  try {
    const first =
      await writeDifficultyCorpusOutputs(
        report,
        directory,
      );

    const firstJson =
      await readFile(
        first.jsonPath,
        'utf8',
      );

    const firstMarkdown =
      await readFile(
        first.markdownPath,
        'utf8',
      );

    const second =
      await writeDifficultyCorpusOutputs(
        report,
        directory,
      );

    const secondJson =
      await readFile(
        second.jsonPath,
        'utf8',
      );

    const secondMarkdown =
      await readFile(
        second.markdownPath,
        'utf8',
      );

    assert(
      firstJson === secondJson &&
        firstMarkdown ===
          secondMarkdown,
      'Repeated corpus writes must be byte-identical.',
    );

    assert(
      firstJson.endsWith('\n') &&
        firstMarkdown.endsWith('\n'),
      'Corpus outputs must end with a newline.',
    );

    assert(
      first.jsonPath.endsWith(
        'difficulty-corpus.json',
      ) &&
        first.markdownPath.endsWith(
          'difficulty-corpus.md',
        ),
      'Corpus output filenames must be stable.',
    );
  } finally {
    await rm(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
}

async function checkTargetedOutputWriter(): Promise<void> {
  const report =
    summarizeTargetedDifficultyCorpus([
      createTargetedRunReport(
        11,
        DifficultyBand.Medium,
        DifficultyBand.Medium,
      ),
      createTargetedRunReport(
        22,
        DifficultyBand.Medium,
        DifficultyBand.Hard,
      ),
    ]);

  const directory =
    await mkdtemp(
      join(
        tmpdir(),
        'dungeon-logic-targeted-difficulty-corpus-',
      ),
    );

  try {
    const first =
      await writeTargetedDifficultyCorpusOutputs(
        report,
        directory,
      );

    const firstJson =
      await readFile(first.jsonPath, 'utf8');
    const firstMarkdown =
      await readFile(first.markdownPath, 'utf8');

    const second =
      await writeTargetedDifficultyCorpusOutputs(
        report,
        directory,
      );

    const secondJson =
      await readFile(second.jsonPath, 'utf8');
    const secondMarkdown =
      await readFile(second.markdownPath, 'utf8');

    assert(
      firstJson === secondJson &&
        firstMarkdown === secondMarkdown,
      'Repeated targeted corpus writes must be byte-identical.',
    );

    assert(
      first.jsonPath.endsWith(
        'difficulty-corpus-medium.json',
      ) &&
        first.markdownPath.endsWith(
          'difficulty-corpus-medium.md',
        ),
      'Single-target corpus filenames must include the target band.',
    );

    assert(
      firstMarkdown.includes(
        '# Dungeon Logic Targeted Difficulty Corpus',
      ) &&
        firstMarkdown.includes(
          '## Archetype contribution',
        ) &&
        firstMarkdown.includes(
          '## Per-seed results',
        ),
      'Targeted corpus Markdown must expose summary, archetype contribution, and per-seed diagnostics.',
    );
  } finally {
    await rm(
      directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
}

async function main(): Promise<void> {
  checkCliParsing();
  checkCorpusSummary();
  checkTargetedCorpusSummary();
  await checkOutputWriter();
  await checkTargetedOutputWriter();

  console.info(
    '[Dungeon Logic] Difficulty corpus sanity: legacy + targeted CLI, aggregation, exact/fallback, coverage, and deterministic outputs passed',
  );
}

void main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);
