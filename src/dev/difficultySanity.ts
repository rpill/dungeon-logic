import {
  levels as authoredLevels,
} from '../data/levels';

import {
  analyzeHumanSolvability,
} from '../puzzle/human-solver/HumanSolver';

import {
  analyzeDifficulty,
} from '../puzzle/difficulty/DifficultyAnalyzer';

import {
  DifficultyBand,
  DifficultyTarget,
  ReasoningTier,
} from '../puzzle/difficulty/types';

import {
  HumanRule,
  HumanSolveStatus,
  createEmptyHumanRuleCounts,
  type HumanSolveResult,
} from '../puzzle/human-solver/types';

import type {
  LevelDefinition,
} from '../puzzle/types';

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createLevel(
  size: 6 | 7 | 8,
): LevelDefinition {
  return {
    id: `difficulty-${size}`,
    width: size,
    height: size,
    rowClues: Array.from({ length: size }, () => 0),
    columnClues: Array.from({ length: size }, () => 0),
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: Array.from({ length: size }, () => '.'.repeat(size)),
  };
}

function createHumanResult(
  input: {
    status?:
      | 'solved-direct'
      | 'solved-with-contradiction'
      | 'stuck'
      | 'invalid';
    directSteps?: number;
    ordinaryContradictions?: number;
    treasureRoomVariantSteps?: number;
    unknownRemaining?: number;
    advancedRules?: readonly (
      | 'door'
      | 'treasure-room-interior'
      | 'treasure-room-entrance'
      | 'monster-dead-end'
      | 'hallway-not-dead-end'
      | 'open-2x2'
      | 'connectivity'
    )[];
  },
): HumanSolveResult {
  const ruleCounts =
    createEmptyHumanRuleCounts();

  ruleCounts[HumanRule.Contradiction] =
    input.ordinaryContradictions ?? 0;

  ruleCounts[HumanRule.TreasureRoomVariant] =
    input.treasureRoomVariantSteps ?? 0;

  for (const rule of input.advancedRules ?? []) {
    ruleCounts[rule] = 1;
  }

  const contradictionSteps =
    (input.ordinaryContradictions ?? 0) +
    (input.treasureRoomVariantSteps ?? 0);

  return {
    status:
      input.status ??
      (
        contradictionSteps === 0
          ? HumanSolveStatus.SolvedDirect
          : HumanSolveStatus.SolvedWithContradiction
      ),
    directSteps: input.directSteps ?? 0,
    contradictionSteps,
    assignments: 0,
    unknownRemaining: input.unknownRemaining ?? 0,
    ruleCounts,
    steps: [],
  };
}

function allAdvancedRules(): readonly (
  | typeof HumanRule.Door
  | typeof HumanRule.TreasureRoomInterior
  | typeof HumanRule.TreasureRoomEntrance
  | typeof HumanRule.MonsterDeadEnd
  | typeof HumanRule.HallwayNotDeadEnd
  | typeof HumanRule.Open2x2
  | typeof HumanRule.Connectivity
)[] {
  return [
    HumanRule.Door,
    HumanRule.TreasureRoomInterior,
    HumanRule.TreasureRoomEntrance,
    HumanRule.MonsterDeadEnd,
    HumanRule.HallwayNotDeadEnd,
    HumanRule.Open2x2,
    HumanRule.Connectivity,
  ];
}

function runBandChecks(): void {
  const cases = [
    [0, 0, DifficultyBand.Easy],
    [1, 0, DifficultyBand.Medium],
    [2, 0, DifficultyBand.Medium],
    [3, 0, DifficultyBand.Hard],
    [8, 0, DifficultyBand.Hard],
    [9, 0, DifficultyBand.Expert],
    [0, 1, DifficultyBand.Expert],
  ] as const;

  for (const [ordinary, roomVariant, expected] of cases) {
    const actual = analyzeDifficulty(
      createLevel(6),
      createHumanResult({
        ordinaryContradictions: ordinary,
        treasureRoomVariantSteps: roomVariant,
      }),
    ).band;

    assert(
      actual === expected,
      `Expected band ${expected}, got ${actual}.`,
    );
  }
}

function runScoreBoundaryChecks(): void {
  assert(
    analyzeDifficulty(
      createLevel(6),
      createHumanResult({ directSteps: 0 }),
    ).score === 0,
    'Minimum easy score must be 0.',
  );

  assert(
    analyzeDifficulty(
      createLevel(8),
      createHumanResult({
        directSteps: 30,
        advancedRules: allAdvancedRules(),
      }),
    ).score === 24,
    'Maximum direct-only score must stay at 24.',
  );

  assert(
    analyzeDifficulty(
      createLevel(6),
      createHumanResult({ ordinaryContradictions: 1 }),
    ).score === 25,
    'Minimum medium score must be 25.',
  );

  assert(
    analyzeDifficulty(
      createLevel(8),
      createHumanResult({
        directSteps: 30,
        ordinaryContradictions: 2,
        advancedRules: allAdvancedRules(),
      }),
    ).score === 49,
    'Maximum medium score must be 49.',
  );

  assert(
    analyzeDifficulty(
      createLevel(6),
      createHumanResult({ ordinaryContradictions: 3 }),
    ).score === 50,
    'Minimum hard score must be 50.',
  );

  assert(
    analyzeDifficulty(
      createLevel(8),
      createHumanResult({
        directSteps: 30,
        ordinaryContradictions: 8,
        advancedRules: allAdvancedRules(),
      }),
    ).score === 74,
    'Maximum hard score must be 74.',
  );

  assert(
    analyzeDifficulty(
      createLevel(6),
      createHumanResult({ ordinaryContradictions: 9 }),
    ).score === 75,
    'Minimum ordinary expert score must be 75.',
  );
}

function runUnratedChecks(): void {
  for (
    const status of [
      HumanSolveStatus.Stuck,
      HumanSolveStatus.Invalid,
    ] as const
  ) {
    const profile = analyzeDifficulty(
      createLevel(8),
      createHumanResult({
        status,
        unknownRemaining: 17,
      }),
    );

    assert(
      profile.band === DifficultyBand.Unrated,
      `${status} must be unrated.`,
    );
    assert(
      profile.reasoningTier === ReasoningTier.Unrated,
      `${status} must use unrated reasoning tier.`,
    );
    assert(
      profile.score === null,
      `${status} must have null score.`,
    );
  }
}

function runDeterminismChecks(): void {
  const input = createHumanResult({
    directSteps: 21,
    ordinaryContradictions: 6,
    advancedRules: [
      HumanRule.TreasureRoomInterior,
      HumanRule.HallwayNotDeadEnd,
      HumanRule.Open2x2,
    ],
  });

  const first = analyzeDifficulty(createLevel(7), input);
  const second = analyzeDifficulty(createLevel(7), input);

  assert(
    JSON.stringify(first) === JSON.stringify(second),
    'Difficulty profile must be deterministic.',
  );

  for (const value of Object.values(first.components)) {
    assert(
      value >= 0 && value <= 1,
      'Difficulty components must stay in 0..1.',
    );
  }

  assert(
    DifficultyTarget.Any === 'any',
    'DifficultyTarget.Any must be any.',
  );
}

function runAuthoredCorpusChecks(): void {
  const expected = new Map<string, string>([
    ['level-001', DifficultyBand.Easy],
    ['level-002', DifficultyBand.Easy],
    ['level-003', DifficultyBand.Easy],
    ['level-004', DifficultyBand.Easy],
    ['level-005', DifficultyBand.Easy],
    ['level-006', DifficultyBand.Hard],
    ['level-007', DifficultyBand.Hard],
    ['level-008', DifficultyBand.Medium],
    ['level-009', DifficultyBand.Easy],
    ['level-010', DifficultyBand.Expert],
    ['level-011', DifficultyBand.Expert],
    ['level-012', DifficultyBand.Hard],
  ]);

  const counts = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    unrated: 0,
  };

  for (const level of authoredLevels) {
    const profile = analyzeDifficulty(
      level,
      analyzeHumanSolvability(level),
    );

    assert(
      profile.band === expected.get(level.id),
      `${level.id} expected ${expected.get(level.id)}, got ${profile.band}.`,
    );

    counts[profile.band] += 1;
  }

  assert(
    counts.easy === 6 &&
      counts.medium === 1 &&
      counts.hard === 3 &&
      counts.expert === 2 &&
      counts.unrated === 0,
    `Unexpected authored difficulty distribution: ${JSON.stringify(counts)}`,
  );
}

runBandChecks();
runScoreBoundaryChecks();
runUnratedChecks();
runDeterminismChecks();
runAuthoredCorpusChecks();

console.info(
  '[Dungeon Logic] Difficulty sanity: formula + bands + unrated + determinism + authored corpus checks passed',
);
