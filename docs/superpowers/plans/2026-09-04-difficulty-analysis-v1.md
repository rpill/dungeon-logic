# Difficulty Analysis v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic internal Difficulty Analysis v1 layer that scores Human Solver traces, reports difficulty for authored/generated levels, attaches difficulty metadata only to already-accepted generator candidates, and lets shortlist ranking prefer `easy | medium | hard | expert` without changing Generator v1.2 acceptance semantics.

**Architecture:** `DifficultyAnalyzer` is a pure puzzle-core module that consumes `LevelDefinition + HumanSolveResult` and returns a versioned `DifficultyProfile`. Existing Human Solver remains the reasoning authority; Generator v1.2 remains the acceptance authority. Accepted candidates receive a profile after validation, uniqueness, hard-quality, and geometry-warning gates; `CandidateRanker` may use that profile as a ranking preference, while `any` preserves current ranking behavior.

**Tech Stack:** TypeScript 6, Node/`tsx` dev scripts, existing Phaser/Vite project. Difficulty core has no Phaser dependency. Existing `LevelValidator`, `PuzzleSolver`, `LevelQualityAnalyzer`, Human Solver, Generator v1.2, profiler, and generated-playtest path remain authoritative in their current domains.

**Spec:** `docs/superpowers/specs/2026-09-04-difficulty-analysis-v1-design.md`

## Global Constraints

- Difficulty Analysis v1 is internal/dev-facing only; do not expose `easy`, `medium`, `hard`, or `expert` in player UI.
- Human Solver deduction behavior is unchanged.
- `LevelValidator` is unchanged.
- `PuzzleSolver` uniqueness behavior is unchanged.
- `LevelQualityAnalyzer` thresholds are unchanged.
- Generator v1.2 acceptance/rejection reasons and pool-completion rules are unchanged.
- Difficulty never becomes a CandidateFactory rejection reason in v1.
- `stuck` and `invalid` Human Solver results map to `unrated` with `score: null`.
- Human Solver and Difficulty Analyzer run only after a generated candidate already passes existing canonical acceptance.
- Difficulty target changes shortlist preference only; it never changes generated geometry or accepted-pool membership.
- Default difficulty target is exactly `any`.
- `any` must preserve existing Generator v1.2 shortlist selection order for the same accepted pool.
- Two-room 7×7/8×8 shortlist coverage remains a stronger invariant than difficulty preference.
- No dynamic percentiles, seed-relative thresholds, DFS-node difficulty, or wall-clock difficulty signals.
- Score bands are fixed: easy `0..24`, medium `25..49`, hard `50..74`, expert `75..100`.
- Expert applies when `treasure-room-variant >= 1` or ordinary `contradiction >= 9`.
- Hard applies for ordinary contradiction count `3..8` when no expert condition applies.
- Medium applies for ordinary contradiction count `1..2` when no expert condition applies.
- Easy applies when ordinary contradiction count and Treasure Room variant count are both zero.
- No TypeScript enums and no constructor parameter properties; remain compatible with `erasableSyntaxOnly`.
- No `Math.random()` or time/environment values in difficulty calculation.
- Generated `.generated/` artifacts remain ignored and unstaged.
- Keep generator report `schemaVersion: 1`; Difficulty v1 adds backward-compatible fields rather than invalidating existing dev report consumers.
- PowerShell commands are one command per line and never chained with `&&`.
- Execute this plan in large task-level RED/GREEN batches; do not require the user to run one micro-test per sub-rule.
- Never commit a RED state.
- After every behavior commit run `npm run context:last`.

---

## File Structure

### Create

- `src/puzzle/difficulty/types.ts`
  - Difficulty constants/types only.
  - Defines `DifficultyBand`, `ReasoningTier`, `DifficultyTarget`, `DifficultyComponents`, `DifficultyProfile`.

- `src/puzzle/difficulty/DifficultyAnalyzer.ts`
  - Pure deterministic `analyzeDifficulty(level, humanResult)` implementation.
  - Owns v1 thresholds, normalization, band selection, score calculation, and diagnostic reasons.

- `src/dev/difficultySanity.ts`
  - Dedicated RED/GREEN sanity suite for formula boundaries, deterministic output, corpus bands, and unrated behavior.

- `docs/superpowers/plans/2026-09-04-difficulty-analysis-v1.md`
  - This implementation plan.

- `docs/superpowers/reports/2026-09-04-difficulty-v1-baseline.md`
  - Created only after final real verification; records actual authored/seed-123456 results and generator-target smoke results.

### Modify

- `package.json`
  - Add `sanity:difficulty`.
  - Preserve every existing script.

- `src/dev/analyzeHumanSolvability.ts`
  - Attach a DifficultyProfile to every level analysis.
  - Add band summary and min/median/max rated score.
  - Extend Markdown/JSON output deterministically.

- `src/dev/humanAnalysisSanity.ts`
  - Assert difficulty report shape, corpus band summary, and deterministic output.

- `src/puzzle/generator/types.ts`
  - Add `difficulty: DifficultyProfile` to `AcceptedCandidate`.
  - Add `difficultyTarget: DifficultyTarget` to `GeneratorRunReport`.
  - Do not add a difficulty rejection reason.

- `src/puzzle/generator/CandidateFactory.ts`
  - After existing candidate acceptance gates pass, run Human Solver once and attach `analyzeDifficulty(...)`.
  - Do not run Human Solver for rejected attempts.

- `src/puzzle/generator/CandidateRanker.ts`
  - Add optional `DifficultyTarget` to shortlist selection.
  - Preserve current `any` path exactly.
  - For a specific target, band distance precedes existing selection criteria; score-center distance is only a later tie-break.

- `src/dev/generateCandidates.ts`
  - Parse optional `--difficulty`.
  - Default to `any`.
  - Pass target to `selectShortlist`.
  - Serialize/report difficulty target and candidate difficulty.

- `src/dev/generatorSanity.ts`
  - Update accepted fixtures for required difficulty metadata.
  - Add acceptance-boundary tests proving difficulty is not a gate.
  - Add target-ranking tests and CLI/output tests.
  - Assert default `any` preserves current ranking semantics.

- `src/dev/profileGenerator.ts`
  - Mirror accepted-candidate difficulty attachment.
  - Add `humanDifficultyMs` timing only for candidates that have already reached existing accepted status.
  - Include that time in `totalMs`.
  - Keep every rejected attempt at `humanDifficultyMs === 0`.

- `src/dev/profilerSanity.ts`
  - Assert profiler parity and zero human-difficulty work for rejected attempts.
  - Assert accepted profile contains a DifficultyProfile.

- `CURRENT_STATE.md`
  - Update only after all final verification is green.

- `TREE.txt`
  - Update only after all final verification is green.

### Intentionally unchanged

- `src/puzzle/LevelValidator.ts`
- `src/puzzle/PuzzleState.ts`
- `src/puzzle/solver/PuzzleSolver.ts`
- `src/puzzle/solver/SearchState.ts`
- `src/puzzle/quality/LevelQualityAnalyzer.ts`
- `src/puzzle/human-solver/DirectDeductionEngine.ts`
- `src/puzzle/human-solver/HumanSolver.ts`
- `src/puzzle/human-solver/types.ts`
- `src/puzzle/generator/CandidateGenerator.ts`
- authored `src/data/levels/levelNNN.ts`
- runtime scenes/board rendering
- generated-playtest HTTP/file access behavior
- `.gitignore`

---

# Task 1: Implement the pure Difficulty Analyzer and lock Difficulty v1 formula

**Files:**
- Create: `src/puzzle/difficulty/types.ts`
- Create: `src/puzzle/difficulty/DifficultyAnalyzer.ts`
- Create: `src/dev/difficultySanity.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes:
  - `LevelDefinition` from `src/puzzle/types.ts`.
  - `HumanSolveResult`, `HumanSolveStatus`, `HumanRule` from `src/puzzle/human-solver/types.ts`.
- Produces:
  - `DifficultyBand`
  - `ReasoningTier`
  - `DifficultyTarget`
  - `DifficultyComponents`
  - `DifficultyProfile`
  - `analyzeDifficulty(level: LevelDefinition, humanResult: HumanSolveResult): DifficultyProfile`

- [ ] **Step 1: Add RED contracts to `src/dev/difficultySanity.ts`**

Create the test file with a small no-framework `assert()` helper and a `createHumanResult()` helper based on the real Human Solver type:

```ts
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

  ruleCounts[
    HumanRule.Contradiction
  ] =
    input.ordinaryContradictions ?? 0;

  ruleCounts[
    HumanRule.TreasureRoomVariant
  ] =
    input.treasureRoomVariantSteps ?? 0;

  for (
    const rule
    of input.advancedRules ?? []
  ) {
    ruleCounts[rule] = 1;
  }

  const contradictionSteps =
    (
      input.ordinaryContradictions ?? 0
    ) +
    (
      input.treasureRoomVariantSteps ?? 0
    );

  return {
    status:
      input.status ??
      (
        contradictionSteps === 0
          ? HumanSolveStatus.SolvedDirect
          : HumanSolveStatus.SolvedWithContradiction
      ),
    directSteps:
      input.directSteps ?? 0,
    contradictionSteps,
    assignments: 0,
    unknownRemaining:
      input.unknownRemaining ?? 0,
    ruleCounts,
    steps: [],
  };
}
```

Add one batched RED group that asserts exact band boundaries:

```ts
assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({}),
  ).band ===
    DifficultyBand.Easy,
  'Direct-only must be easy.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 1,
    }),
  ).band ===
    DifficultyBand.Medium,
  'One contradiction must be medium.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 2,
    }),
  ).band ===
    DifficultyBand.Medium,
  'Two contradictions must remain medium.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 3,
    }),
  ).band ===
    DifficultyBand.Hard,
  'Three contradictions must be hard.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 8,
    }),
  ).band ===
    DifficultyBand.Hard,
  'Eight contradictions must remain hard.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 9,
    }),
  ).band ===
    DifficultyBand.Expert,
  'Nine contradictions must be expert.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      treasureRoomVariantSteps: 1,
    }),
  ).band ===
    DifficultyBand.Expert,
  'Treasure Room variant reasoning must be expert.',
);
```

Add exact score-edge assertions:

```ts
assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      directSteps: 0,
    }),
  ).score === 0,
  'Minimum easy score must be 0.',
);

assert(
  analyzeDifficulty(
    createLevel(8),
    createHumanResult({
      directSteps: 30,
      advancedRules: [
        HumanRule.Door,
        HumanRule.TreasureRoomInterior,
        HumanRule.TreasureRoomEntrance,
        HumanRule.MonsterDeadEnd,
        HumanRule.HallwayNotDeadEnd,
        HumanRule.Open2x2,
        HumanRule.Connectivity,
      ],
    }),
  ).score === 24,
  'Maximum direct-only score must stay inside easy at 24.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 1,
    }),
  ).score === 25,
  'Minimum medium score must be 25.',
);

assert(
  analyzeDifficulty(
    createLevel(8),
    createHumanResult({
      directSteps: 30,
      ordinaryContradictions: 2,
      advancedRules: [
        HumanRule.Door,
        HumanRule.TreasureRoomInterior,
        HumanRule.TreasureRoomEntrance,
        HumanRule.MonsterDeadEnd,
        HumanRule.HallwayNotDeadEnd,
        HumanRule.Open2x2,
        HumanRule.Connectivity,
      ],
    }),
  ).score === 49,
  'Maximum medium score must be 49.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 3,
    }),
  ).score === 50,
  'Minimum hard score must be 50.',
);

assert(
  analyzeDifficulty(
    createLevel(8),
    createHumanResult({
      directSteps: 30,
      ordinaryContradictions: 8,
      advancedRules: [
        HumanRule.Door,
        HumanRule.TreasureRoomInterior,
        HumanRule.TreasureRoomEntrance,
        HumanRule.MonsterDeadEnd,
        HumanRule.HallwayNotDeadEnd,
        HumanRule.Open2x2,
        HumanRule.Connectivity,
      ],
    }),
  ).score === 74,
  'Maximum hard score must be 74.',
);

assert(
  analyzeDifficulty(
    createLevel(6),
    createHumanResult({
      ordinaryContradictions: 9,
    }),
  ).score === 75,
  'Minimum ordinary expert score must be 75.',
);
```

Add unrated checks:

```ts
for (
  const status
  of [
    HumanSolveStatus.Stuck,
    HumanSolveStatus.Invalid,
  ] as const
) {
  const profile =
    analyzeDifficulty(
      createLevel(8),
      createHumanResult({
        status,
        unknownRemaining: 17,
      }),
    );

  assert(
    profile.band ===
      DifficultyBand.Unrated,
    `${status} must be unrated.`,
  );

  assert(
    profile.reasoningTier ===
      ReasoningTier.Unrated,
    `${status} must use unrated reasoning tier.`,
  );

  assert(
    profile.score === null,
    `${status} must have null score.`,
  );
}
```

Add determinism and range checks:

```ts
const deterministicInput =
  createHumanResult({
    directSteps: 21,
    ordinaryContradictions: 6,
    advancedRules: [
      HumanRule.TreasureRoomInterior,
      HumanRule.HallwayNotDeadEnd,
      HumanRule.Open2x2,
    ],
  });

const first =
  analyzeDifficulty(
    createLevel(7),
    deterministicInput,
  );

const second =
  analyzeDifficulty(
    createLevel(7),
    deterministicInput,
  );

assert(
  JSON.stringify(first) ===
    JSON.stringify(second),
  'Difficulty profile must be deterministic.',
);

for (
  const value
  of Object.values(first.components)
) {
  assert(
    value >= 0 &&
      value <= 1,
    'Difficulty components must stay in 0..1.',
  );
}

assert(
  DifficultyTarget.Any === 'any',
  'DifficultyTarget.Any must be any.',
);
```

End the file with one summary line:

```ts
console.info(
  '[Dungeon Logic] Difficulty sanity: formula + bands + unrated + determinism RED checks passed',
);
```

- [ ] **Step 2: Add the package script before production implementation**

Modify only the `scripts` object in `package.json` by adding:

```json
"sanity:difficulty": "tsx src/dev/difficultySanity.ts"
```

Keep:

```text
sanity:generator
generate:candidates
profile:generator
sanity:human
sanity:human-analysis
analyze:human
```

unchanged.

- [ ] **Step 3: Run the batched RED**

Run:

```powershell
npm run sanity:difficulty
```

Expected: TypeScript/module failure because `src/puzzle/difficulty/DifficultyAnalyzer.ts` and `types.ts` do not exist yet.

This is the only user-visible RED checkpoint for Task 1.

- [ ] **Step 4: Implement `src/puzzle/difficulty/types.ts`**

Use constant objects instead of enums:

```ts
export const DifficultyBand = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
  Expert: 'expert',
  Unrated: 'unrated',
} as const;

export type DifficultyBand =
  typeof DifficultyBand[
    keyof typeof DifficultyBand
  ];

export const ReasoningTier = {
  Direct: 'direct',
  ContradictionLight:
    'contradiction-light',
  ContradictionHeavy:
    'contradiction-heavy',
  ExpertLookahead:
    'expert-lookahead',
  Unrated: 'unrated',
} as const;

export type ReasoningTier =
  typeof ReasoningTier[
    keyof typeof ReasoningTier
  ];

export const DifficultyTarget = {
  Any: 'any',
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
  Expert: 'expert',
} as const;

export type DifficultyTarget =
  typeof DifficultyTarget[
    keyof typeof DifficultyTarget
  ];

export interface DifficultyComponents {
  readonly boardLoad: number;
  readonly directLoad: number;
  readonly advancedRuleLoad: number;
  readonly lookaheadLoad: number;
}

export interface DifficultyProfile {
  readonly version: 1;
  readonly score: number | null;
  readonly band: DifficultyBand;
  readonly reasoningTier: ReasoningTier;
  readonly components:
    DifficultyComponents;
  readonly ordinaryContradictions:
    number;
  readonly treasureRoomVariantSteps:
    number;
  readonly reasons:
    readonly string[];
}
```

- [ ] **Step 5: Implement band selection in `DifficultyAnalyzer.ts`**

Import the real Human Solver rule constants and define the seven advanced direct families exactly:

```ts
const ADVANCED_DIRECT_RULES = [
  HumanRule.Door,
  HumanRule.TreasureRoomInterior,
  HumanRule.TreasureRoomEntrance,
  HumanRule.MonsterDeadEnd,
  HumanRule.HallwayNotDeadEnd,
  HumanRule.Open2x2,
  HumanRule.Connectivity,
] as const;
```

Implement:

```ts
export function analyzeDifficulty(
  level: LevelDefinition,
  humanResult: HumanSolveResult,
): DifficultyProfile
```

with this order:

```text
stuck/invalid
→ expert if treasure-room-variant >= 1
→ expert if ordinary contradiction >= 9
→ hard if ordinary contradiction >= 3
→ medium if ordinary contradiction >= 1
→ easy
```

Do not use `humanResult.contradictionSteps` for band selection because it includes `treasure-room-variant`.

- [ ] **Step 6: Implement v1 components exactly**

Use raw component values for score calculation and round only the stored diagnostic component values to six decimals.

```ts
const boardLoad =
  clamp01(
    (
      level.width *
      level.height -
      36
    ) /
    28,
  );

const directLoad =
  clamp01(
    humanResult.directSteps /
      30,
  );

const advancedFamiliesUsed =
  ADVANCED_DIRECT_RULES
    .filter(
      (rule) =>
        humanResult
          .ruleCounts[rule] > 0,
    )
    .length;

const advancedRuleLoad =
  advancedFamiliesUsed / 7;
```

Lookahead:

```ts
function getLookaheadLoad(
  band: DifficultyBand,
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
): number {
  if (
    band ===
    DifficultyBand.Easy
  ) {
    return 0;
  }

  if (
    band ===
    DifficultyBand.Medium
  ) {
    return clamp01(
      ordinaryContradictions - 1,
    );
  }

  if (
    band ===
    DifficultyBand.Hard
  ) {
    return clamp01(
      (
        ordinaryContradictions -
        3
      ) / 5,
    );
  }

  if (
    band ===
    DifficultyBand.Expert &&
    treasureRoomVariantSteps >= 1
  ) {
    return 1;
  }

  if (
    band ===
    DifficultyBand.Expert
  ) {
    return clamp01(
      (
        ordinaryContradictions -
        9
      ) / 11,
    );
  }

  return 0;
}
```

- [ ] **Step 7: Implement exact score formula**

Easy:

```ts
const intra =
  0.35 * boardLoad +
  0.35 * directLoad +
  0.30 * advancedRuleLoad;

score =
  Math.round(
    24 * intra,
  );
```

Medium/hard:

```ts
const intra =
  0.15 * boardLoad +
  0.20 * directLoad +
  0.15 * advancedRuleLoad +
  0.50 * lookaheadLoad;
```

Medium:

```ts
score =
  25 +
  Math.round(
    24 * intra,
  );
```

Hard:

```ts
score =
  50 +
  Math.round(
    24 * intra,
  );
```

Expert:

```ts
score =
  75 +
  Math.round(
    25 * intra,
  );
```

Defensively clamp the final integer to the selected band.

- [ ] **Step 8: Implement deterministic reasons**

For solved profiles, emit reasons in this exact order:

1. reasoning tier;
2. Treasure Room variant detail when present;
3. board size;
4. direct-step count;
5. advanced-rule-family count.

Exact templates:

```text
Solved without contradiction-tier reasoning.
Requires 1 ordinary depth-1 contradiction deduction.
Requires N ordinary depth-1 contradiction deductions.
Requires Treasure Room variant reasoning (1 step).
Requires Treasure Room variant reasoning (N steps).
Board size is WxH.
Uses N committed direct deduction steps.
Uses N advanced direct-rule families.
```

For stuck:

```text
Human Solver is stuck with N mutable cells unresolved.
```

For invalid:

```text
Human Solver marked the level invalid under the modeled rules.
```

Unrated profiles use zeroed components, preserve the two rule counts, and return no fake numeric score.

- [ ] **Step 9: Verify Task 1 GREEN**

Run:

```powershell
npm run sanity:difficulty
```

Expected: all Task 1 difficulty checks pass.

Run:

```powershell
npm run sanity:human
```

Expected: existing Human Solver sanity remains green.

Run:

```powershell
npm run build
```

Expected: success.

- [ ] **Step 10: Commit Task 1**

```powershell
git add package.json src/puzzle/difficulty/types.ts src/puzzle/difficulty/DifficultyAnalyzer.ts src/dev/difficultySanity.ts
```

```powershell
git commit -m "feat: add difficulty analyzer"
```

```powershell
npm run context:last
```

---

# Task 2: Add difficulty to Human Solver reports and lock the 27-level corpus bands

**Files:**
- Modify: `src/dev/analyzeHumanSolvability.ts`
- Modify: `src/dev/humanAnalysisSanity.ts`
- Modify: `src/dev/difficultySanity.ts`

**Interfaces:**
- Consumes:
  - `analyzeHumanSolvability(level)`.
  - `analyzeDifficulty(level, humanResult)`.
- Produces:
  - `HumanLevelAnalysis.difficulty: DifficultyProfile`.
  - deterministic difficulty summary counts.
  - deterministic rated score min/median/max.
  - Markdown and JSON with a difficulty section for every level.

- [ ] **Step 1: Add RED report-shape checks**

In `HumanLevelAnalysis`, the intended shape is:

```ts
export interface HumanLevelAnalysis {
  id: string;
  width: number;
  height: number;
  result: HumanSolveResult;
  difficulty: DifficultyProfile;
}
```

Add:

```ts
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
```

and extend `HumanAnalysisSummary` with:

```ts
difficulty:
  HumanDifficultySummary;
```

Before implementing, extend `src/dev/humanAnalysisSanity.ts` so its authored fixture asserts:

```ts
assert(
  report.levels.every(
    (entry) =>
      entry.difficulty.version ===
      1,
  ),
  'Every human-analysis level must carry Difficulty v1.',
);

assert(
  Object.values(
    report.summary
      .difficulty.bandCounts,
  ).reduce(
    (sum, value) =>
      sum + value,
    0,
  ) === report.summary.total,
  'Difficulty band summary must cover every analyzed level.',
);
```

Add deterministic writer assertions that generated JSON contains:

```text
"difficulty"
"bandCounts"
"minimumScore"
"medianScore"
"maximumScore"
```

and Markdown contains:

```text
- difficulty:
- band:
- score:
- reasoning tier:
- board load:
- direct load:
- advanced rule load:
- lookahead load:
```

- [ ] **Step 2: Add corpus-band RED checks to `difficultySanity.ts`**

Import authored levels and run real Human Solver + Difficulty Analyzer:

```ts
import {
  levels as authoredLevels,
} from '../data/levels';

import {
  analyzeHumanSolvability,
} from '../puzzle/human-solver/HumanSolver';
```

Expected authored map:

```ts
const EXPECTED_AUTHORED_BANDS =
  new Map([
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
  ] as const);
```

Assert every authored level matches.

Also assert authored distribution exactly:

```text
easy=6
medium=1
hard=3
expert=2
unrated=0
```

Do not require `.generated/` for `sanity:difficulty`; generated-shortlist corpus checks remain in `humanAnalysisSanity` fixture/extraction path.

- [ ] **Step 3: Run Task 2 RED**

```powershell
npm run sanity:human-analysis
```

Expected: FAIL because difficulty is not yet attached to report entries.

```powershell
npm run sanity:difficulty
```

Expected: authored band checks may already pass at the analyzer level, but report integration remains RED in `sanity:human-analysis`.

- [ ] **Step 4: Attach difficulty in one pass**

In `analyzeHumanLevels()`, avoid running Human Solver twice:

```ts
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
```

- [ ] **Step 5: Build deterministic difficulty summary**

Initialize:

```ts
const difficultyBandCounts:
  HumanDifficultyBandCounts = {
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0,
  unrated: 0,
};
```

During the existing summary loop:

```ts
difficultyBandCounts[
  analysis.difficulty.band
] += 1;
```

Collect only non-null scores, sort ascending numerically, then calculate:

```ts
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

  if (
    values.length % 2 === 1
  ) {
    return values[middle];
  }

  return (
    values[middle - 1] +
    values[middle]
  ) / 2;
}
```

Summary shape:

```ts
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
```

- [ ] **Step 6: Extend Markdown deterministically**

After existing Human Solver summary lines add:

```text
- difficulty:
  - easy: N
  - medium: N
  - hard: N
  - expert: N
  - unrated: N
  - minimum score: N|null
  - median score: N|null
  - maximum score: N|null
```

For each level, immediately after `unknown remaining` add:

```text
- difficulty:
  - version: 1
  - band: ...
  - score: ...
  - reasoning tier: ...
  - board load: ...
  - direct load: ...
  - advanced rule load: ...
  - lookahead load: ...
  - ordinary contradictions: ...
  - treasure room variant steps: ...
  - reasons:
    - ...
```

For `score: null`, write literal:

```text
null
```

Use stored component values; do not recompute difficulty in the formatter.

- [ ] **Step 7: Lock the current real 27-level band baseline**

Run:

```powershell
npm run analyze:human -- --authored
```

Required summary:

```text
Human status:
  direct=6
  contradiction=6
  stuck=0
  invalid=0

Difficulty:
  easy=6
  medium=1
  hard=3
  expert=2
  unrated=0
```

Run:

```powershell
npm run analyze:human -- --seed 123456 --shortlist
```

Required difficulty distribution:

```text
easy=10
medium=3
hard=1
expert=1
unrated=0
```

Required generated bands:

```text
generated-monster-only-7-2491075932 => easy
generated-monster-only-8-361304057 => medium
generated-monster-only-7-512302628 => medium
generated-chest-one-room-8-2568418654 => expert
generated-chest-one-room-7-3193369624 => easy
generated-chest-one-room-8-4193628777 => medium
generated-chest-two-rooms-8-214184125 => hard
generated-chest-two-rooms-7-870245706 => easy
generated-chest-two-rooms-7-819912849 => easy
generated-mixed-one-room-8-1936134028 => easy
generated-mixed-one-room-8-4234123378 => easy
generated-mixed-one-room-6-4267384426 => easy
generated-mixed-two-rooms-8-3305430967 => easy
generated-mixed-two-rooms-7-4032331667 => easy
generated-mixed-two-rooms-7-3373527181 => easy
```

- [ ] **Step 8: Verify Task 2 GREEN**

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human-analysis
```

```powershell
npm run sanity:human
```

```powershell
npm run build
```

Expected: all green.

- [ ] **Step 9: Commit Task 2**

```powershell
git add src/dev/analyzeHumanSolvability.ts src/dev/humanAnalysisSanity.ts src/dev/difficultySanity.ts
```

```powershell
git commit -m "feat: report human difficulty profiles"
```

```powershell
npm run context:last
```

---

# Task 3: Attach DifficultyProfile to accepted generator candidates without creating a new gate

**Files:**
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/dev/generatorSanity.ts`
- Modify: `src/dev/profileGenerator.ts`
- Modify: `src/dev/profilerSanity.ts`

**Interfaces:**
- Consumes:
  - existing accepted-candidate order in `evaluateCandidate()`: validator → uniqueness solver → quality → warning gate.
  - `analyzeHumanSolvability(level)`.
  - `analyzeDifficulty(level, humanResult)`.
- Produces:
  - `AcceptedCandidate.difficulty: DifficultyProfile`.
  - profiler `humanDifficultyMs`.
  - no new CandidateStatus/RejectionReason.

- [ ] **Step 1: Add RED accepted-candidate contract**

Modify the `AcceptedCandidate` contract in the test expectations first:

```ts
export interface AcceptedCandidate {
  candidate: GeneratedCandidate;
  quality: LevelQualityReport;
  solutionCount: 1;
  difficulty: DifficultyProfile;
}
```

In `generatorSanity.ts`, extend an already-known accepted candidate assertion:

```ts
assert(
  evaluation.status ===
    CandidateStatus.Accepted,
  'Fixture must remain accepted.',
);

assert(
  evaluation.accepted
    .difficulty.version === 1,
  'Accepted candidate must carry Difficulty v1.',
);

assert(
  evaluation.accepted
    .difficulty.band !==
    undefined,
  'Accepted candidate must expose a difficulty band.',
);
```

Add a crucial non-gating assertion by creating or reusing a synthetic accepted fixture whose supplied Human Solver result equivalent would be unrated only in a focused helper test. The production acceptance behavior to assert is:

```text
Difficulty band is not inspected by CandidateFactory to choose CandidateStatus.
There is no Difficulty rejection reason.
```

Test the actual type/constants:

```ts
assert(
  !Object.values(
    RejectionReason,
  ).includes(
    'difficulty' as RejectionReason,
  ),
  'Difficulty must not become a generator rejection reason.',
);
```

- [ ] **Step 2: Add RED profiler boundary checks**

Extend timing contracts to require:

```ts
humanDifficultyMs: number;
```

For a rejected attempt:

```ts
assert(
  rejected.timings
    .humanDifficultyMs === 0,
  'Rejected attempts must not run Human Solver/DifficultyAnalyzer.',
);
```

For accepted attempt:

```ts
assert(
  accepted.timings
    .humanDifficultyMs >= 0,
  'Accepted attempts must expose human-difficulty timing.',
);

assert(
  accepted.evaluation.status ===
    CandidateStatus.Accepted &&
  accepted.evaluation.accepted
    .difficulty.version === 1,
  'Profiler accepted evaluation must carry Difficulty v1.',
);
```

- [ ] **Step 3: Run Task 3 RED**

```powershell
npm run sanity:generator
```

Expected: RED because accepted candidates do not yet have `difficulty`.

```powershell
npx tsx src/dev/profilerSanity.ts
```

Expected: RED because timing/evaluation profile does not yet contain the new accepted-only difficulty work.

- [ ] **Step 4: Extend generator types**

In `src/puzzle/generator/types.ts` add a type-only import:

```ts
import type {
  DifficultyProfile,
} from '../difficulty/types';
```

Extend only:

```ts
export interface AcceptedCandidate {
  candidate: GeneratedCandidate;
  quality: LevelQualityReport;
  solutionCount: 1;
  difficulty: DifficultyProfile;
}
```

Do not alter `CandidateStatus`.

Do not alter `RejectionReason`.

Do not add difficulty to `GeneratorConfig`; target selection belongs to Task 4 and must not affect pool creation.

- [ ] **Step 5: Attach difficulty only after the existing warning gate**

In `CandidateFactory.ts`, import:

```ts
import {
  analyzeDifficulty,
} from '../difficulty/DifficultyAnalyzer';

import {
  analyzeHumanSolvability,
} from '../human-solver/HumanSolver';
```

Keep the current order exactly through:

```text
validatePuzzle
solveLevel
analyzeLevelQuality
quality.passes
quality.warnings.length
```

Only after the candidate has survived all of them:

```ts
const humanResult =
  analyzeHumanSolvability(
    candidate.level,
  );

const difficulty =
  analyzeDifficulty(
    candidate.level,
    humanResult,
  );
```

Then return:

```ts
return {
  status:
    CandidateStatus.Accepted,
  accepted: {
    candidate,
    quality,
    solutionCount: 1,
    difficulty,
  },
  diagnostic: null,
};
```

Do not reject `difficulty.band === 'unrated'`.

- [ ] **Step 6: Update generator sanity fixtures cleanly**

Existing ranking fixtures manually construct `AcceptedCandidate`.

Add one helper:

```ts
function createDifficultyFixture(
  band:
    | 'easy'
    | 'medium'
    | 'hard'
    | 'expert'
    | 'unrated' = 'easy',
  score: number | null = 12,
): DifficultyProfile {
  return {
    version: 1,
    score,
    band,
    reasoningTier:
      band === 'easy'
        ? 'direct'
        : band === 'medium'
          ? 'contradiction-light'
          : band === 'hard'
            ? 'contradiction-heavy'
            : band === 'expert'
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
    reasons: [],
  };
}
```

Every manual accepted fixture gets:

```ts
difficulty:
  createDifficultyFixture(),
```

Do not run Human Solver inside purely synthetic ranker fixture construction.

- [ ] **Step 7: Mirror accepted-only difficulty timing in profiler**

In `profileGenerator.ts`, extend both timing interfaces:

```ts
humanDifficultyMs: number;
```

Initialize to zero for every attempt.

Do not invoke Human Solver before current validation/solver/quality result has reached accepted.

At the accepted branch:

```ts
const humanDifficultyStart =
  performance.now();

const humanResult =
  analyzeHumanSolvability(
    candidate.level,
  );

const difficulty =
  analyzeDifficulty(
    candidate.level,
    humanResult,
  );

const humanDifficultyMs =
  performance.now() -
  humanDifficultyStart;
```

Construct the accepted evaluation with the same `difficulty` field as CandidateFactory.

`totalMs` must now include `humanDifficultyMs`.

Profiler report lines gain:

```text
humanDifficultyMs=...
```

for archetype totals, status totals, and slow-attempt rows where the current formatter lists component timings.

Difficulty score never reads this timing.

- [ ] **Step 8: Preserve existing pre-Solver/pre-human rejection invariants**

In `profilerSanity.ts`, keep all existing MonsterDensity assertions and add:

```ts
assert(
  monsterDensityAttempt
    .timings.solverMs === 0,
  'Monster-density rejection must stay pre-Solver.',
);

assert(
  monsterDensityAttempt
    .timings.humanDifficultyMs ===
    0,
  'Monster-density rejection must stay pre-human-difficulty.',
);
```

For hard-quality, geometry-warning, duplicate, generation-failed, and non-unique statuses, assert `humanDifficultyMs === 0`.

Only `accepted` may have non-zero human-difficulty work.

- [ ] **Step 9: Verify Task 3 GREEN**

```powershell
npm run sanity:generator
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human
```

```powershell
npm run build
```

Expected: all green.

- [ ] **Step 10: Run a real pool smoke test**

```powershell
npm run generate:candidates -- --seed 123456
```

Required:

```text
50 accepted total
15 shortlisted total
all existing v1.2 archetype completion invariants remain satisfied
```

Inspect `.generated/candidates-123456.json` and assert programmatically in sanity or a one-off Node/tsx check that:

```text
every accepted candidate has accepted.difficulty.version === 1
every shortlist entry has accepted.difficulty.version === 1
```

Do not require every accepted candidate to be rated; `unrated` is legal v1 metadata.

- [ ] **Step 11: Commit Task 3**

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateFactory.ts src/dev/generatorSanity.ts src/dev/profileGenerator.ts src/dev/profilerSanity.ts
```

```powershell
git commit -m "feat: profile accepted candidate difficulty"
```

```powershell
npm run context:last
```

---

# Task 4: Add difficulty-target shortlist ranking and generator CLI option

**Files:**
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/dev/generateCandidates.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes:
  - `AcceptedCandidate.difficulty`.
  - existing `scoreCandidate()`, `candidateDistance()`, two-room size coverage, `rankForSelection()`.
- Produces:
  - `selectShortlist(pool, perArchetype, target?: DifficultyTarget)`.
  - `GeneratorRunReport.difficultyTarget`.
  - generator CLI forms:
    - `--seed <uint32>`
    - `--seed <uint32> --difficulty any|easy|medium|hard|expert`

- [ ] **Step 1: Add RED target-ranking fixtures**

Create four accepted candidates of one archetype with equal quality metrics and fixed difficulty:

```text
easy   score=12 seed=100
medium score=37 seed=200
hard   score=62 seed=300
expert score=87 seed=400
```

For `perArchetype=1` assert:

```ts
selectShortlist(
  pool,
  1,
  DifficultyTarget.Easy,
)[0].accepted.difficulty.band ===
  DifficultyBand.Easy;

selectShortlist(
  pool,
  1,
  DifficultyTarget.Medium,
)[0].accepted.difficulty.band ===
  DifficultyBand.Medium;

selectShortlist(
  pool,
  1,
  DifficultyTarget.Hard,
)[0].accepted.difficulty.band ===
  DifficultyBand.Hard;

selectShortlist(
  pool,
  1,
  DifficultyTarget.Expert,
)[0].accepted.difficulty.band ===
  DifficultyBand.Expert;
```

- [ ] **Step 2: Add RED fallback and `any` preservation tests**

No exact hard candidate:

```text
medium qualityScore=99
expert qualityScore=95
```

Both have band distance 1 from hard.

Assert medium wins because existing quality ranking is primary inside equal band distance.

Then make quality/selection equal and scores:

```text
medium score=45
expert score=78
hard target center=62
```

Distance to center:

```text
medium: 17
expert: 16
```

Assert expert wins only at this later tie-break.

Add one `unrated` candidate with stronger quality and assert it still ranks after all rated candidates for a specific target.

For `DifficultyTarget.Any`, compare the entire shortlist IDs/order against the same pool passed through the current no-target expected ordering. This is the key backward-compatibility test.

- [ ] **Step 3: Add RED two-room coverage precedence test**

Construct a two-room pool where:

```text
selected first candidate: 8x8 hard
best target-matching remaining candidate: 8x8 hard
available 7x7 candidate: medium
perArchetype=3
target=hard
```

Assert shortlist still includes both 7 and 8.

Difficulty preference must never disable the existing required missing-size logic.

- [ ] **Step 4: Add RED CLI parser tests**

Introduce intended parser:

```ts
export interface GeneratorCliOptions {
  masterSeed: number;
  difficultyTarget:
    DifficultyTarget;
}
```

Valid:

```ts
parseGeneratorCliArgs([
  '--seed',
  '123456',
]);
```

must return:

```ts
{
  masterSeed: 123456,
  difficultyTarget:
    DifficultyTarget.Any,
}
```

Valid targeted:

```ts
parseGeneratorCliArgs([
  '--seed',
  '123456',
  '--difficulty',
  'expert',
]);
```

must return target `expert`.

Reject:

```text
--difficulty impossible
--difficulty unrated
missing target
extra positional args
negative seed
seed > uint32
```

Keep existing `parseMasterSeed(args)` exported as a compatibility helper for existing tests/callers; implement it by returning `parseGeneratorCliArgs(args).masterSeed` only for the legacy two-argument form.

- [ ] **Step 5: Run Task 4 RED**

```powershell
npm run sanity:generator
```

Expected: targeted `selectShortlist` / CLI assertions fail because difficulty targeting is not implemented.

- [ ] **Step 6: Add target helpers to `CandidateRanker.ts`**

Define fixed band indexes:

```ts
const DIFFICULTY_BAND_INDEX = {
  easy: 0,
  medium: 1,
  hard: 2,
  expert: 3,
} as const;

const DIFFICULTY_TARGET_CENTER = {
  easy: 12,
  medium: 37,
  hard: 62,
  expert: 87,
} as const;
```

Implement:

```ts
function difficultyBandDistance(
  accepted: AcceptedCandidate,
  target: DifficultyTarget,
): number
```

Rules:

```text
target=any => 0
candidate=unrated with specific target => Number.POSITIVE_INFINITY
rated => absolute band-index difference
```

Implement:

```ts
function difficultyScoreDistance(
  accepted: AcceptedCandidate,
  target: DifficultyTarget,
): number
```

Rules:

```text
target=any => 0
score=null => Number.POSITIVE_INFINITY
rated => abs(score - target center)
```

- [ ] **Step 7: Preserve `any` as the exact legacy comparator path**

Change signature:

```ts
export function selectShortlist(
  pool: GeneratorPoolReport,
  perArchetype: number,
  difficultyTarget:
    DifficultyTarget =
      DifficultyTarget.Any,
): readonly RankedCandidate[]
```

When `difficultyTarget === 'any'`, use the same existing:

```text
compareQualityThenSeed
requiredMissingTwoRoomSize
rankForSelection
compareSelection
```

without inserting difficulty into those comparisons.

This explicit branch protects current Generator v1.2 behavior.

- [ ] **Step 8: Apply specific target as a preference class**

For specific target, initial available ordering is:

1. smaller difficulty band distance;
2. higher existing quality score;
3. smaller difficulty score-center distance;
4. lower candidate seed.

For later iterative selection:

1. existing required missing two-room size filter first;
2. smaller difficulty band distance;
3. higher existing `selectionScore`;
4. higher existing `qualityScore`;
5. smaller difficulty score-center distance;
6. lower candidate seed.

Do not add difficulty score into `selectionScore` arithmetic.

That keeps difficulty as a preference class instead of contaminating the established quality/diversity score.

- [ ] **Step 9: Extend generator report and CLI**

In `src/puzzle/generator/types.ts`, import `DifficultyTarget` as a type and extend:

```ts
export interface GeneratorRunReport {
  schemaVersion: 1;
  masterSeed: number;
  difficultyTarget:
    DifficultyTarget;
  // existing fields unchanged
}
```

Keep `schemaVersion: 1` because this is an additive field in a dev report and existing consumers read named nested fields rather than reject unknown fields.

In `generateCandidates.ts` implement:

```ts
export function parseGeneratorCliArgs(
  args: readonly string[],
): GeneratorCliOptions
```

accepting exactly:

```text
--seed N
--seed N --difficulty TARGET
```

Build report:

```ts
export function buildGeneratorRunReport(
  config: GeneratorConfig,
  difficultyTarget:
    DifficultyTarget =
      DifficultyTarget.Any,
): GeneratorRunReport
```

Call:

```ts
selectShortlist(
  pool,
  config.shortlistPerArchetype,
  difficultyTarget,
)
```

and return `difficultyTarget` at top level.

`createSerializableReport()` must include it.

Markdown header adds:

```text
Difficulty target: any|easy|medium|hard|expert
```

Each candidate block adds:

```text
- difficulty band: ...
- difficulty score: ...
- difficulty reasoning tier: ...
```

For an unrated candidate score, print `null`.

- [ ] **Step 10: Preserve generated-playtest and human-analysis compatibility**

The existing consumers read:

```text
report.shortlist[*].accepted.candidate.level
```

and ignore added fields.

Run:

```powershell
npx tsx src/dev/generatedPlaytestSanity.ts
```

Expected: green.

Run:

```powershell
npm run sanity:human-analysis
```

Expected: generated shortlist extraction remains green.

Do not rewrite these consumers just because new fields exist.

- [ ] **Step 11: Verify Task 4 GREEN**

```powershell
npm run sanity:generator
```

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human-analysis
```

```powershell
npx tsx src/dev/generatedPlaytestSanity.ts
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run build
```

Expected: all green.

- [ ] **Step 12: Real CLI checks**

Default:

```powershell
npm run generate:candidates -- --seed 123456
```

Required report field:

```text
Difficulty target: any
```

and existing seed-123456 shortlist IDs/order must remain:

```text
generated-monster-only-7-2491075932
generated-monster-only-8-361304057
generated-monster-only-7-512302628
generated-chest-one-room-8-2568418654
generated-chest-one-room-7-3193369624
generated-chest-one-room-8-4193628777
generated-chest-two-rooms-8-214184125
generated-chest-two-rooms-7-870245706
generated-chest-two-rooms-7-819912849
generated-mixed-one-room-8-1936134028
generated-mixed-one-room-8-4234123378
generated-mixed-one-room-6-4267384426
generated-mixed-two-rooms-8-3305430967
generated-mixed-two-rooms-7-4032331667
generated-mixed-two-rooms-7-3373527181
```

Target smoke:

```powershell
npm run generate:candidates -- --seed 123456 --difficulty hard
```

Required:

- pool acceptance counts/invariants are unchanged from the same seed;
- shortlist may reorder/select different accepted candidates;
- within each archetype, exact hard candidates are preferred when available subject to the two-room size-coverage invariant;
- no accepted candidate disappears from the pool because of difficulty.

- [ ] **Step 13: Commit Task 4**

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateRanker.ts src/dev/generateCandidates.ts src/dev/generatorSanity.ts
```

```powershell
git commit -m "feat: target generator shortlist difficulty"
```

```powershell
npm run context:last
```

---

# Task 5: Final deterministic verification, baseline report, and project-state docs

**Files:**
- Create: `docs/superpowers/reports/2026-09-04-difficulty-v1-baseline.md`
- Modify: `CURRENT_STATE.md`
- Modify: `TREE.txt`
- Modify: `src/dev/difficultySanity.ts` only if a final real-result regression needs to be locked
- Modify: `src/dev/generatorSanity.ts` only if a final real-result regression needs to be locked

**Interfaces:**
- Consumes: fully implemented Difficulty v1.
- Produces: verified baseline documentation and clean repository state.

- [ ] **Step 1: Run all dedicated sanity layers fresh**

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human
```

```powershell
npm run sanity:human-analysis
```

```powershell
npm run sanity:generator
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npx tsx src/dev/generatedPlaytestSanity.ts
```

```powershell
npx tsx src/dev/gameBoardLayoutSanity.ts
```

Every command must be green before documentation is written.

- [ ] **Step 2: Run the full build**

```powershell
npm run build
```

Expected: TypeScript + Vite build succeeds.

- [ ] **Step 3: Verify authored Difficulty v1 baseline**

```powershell
npm run analyze:human -- --authored
```

Required:

```text
total=12
human:
  solved-direct=6
  solved-with-contradiction=6
  stuck=0
  invalid=0

difficulty:
  easy=6
  medium=1
  hard=3
  expert=2
  unrated=0
```

No authored level may change Human Solver status because DifficultyAnalyzer is read-only.

- [ ] **Step 4: Verify generated shortlist Difficulty v1 baseline**

First regenerate the default report:

```powershell
npm run generate:candidates -- --seed 123456
```

Then:

```powershell
npm run analyze:human -- --seed 123456 --shortlist
```

Required:

```text
total=15
human:
  solved-direct=10
  solved-with-contradiction=5
  stuck=0
  invalid=0

difficulty:
  easy=10
  medium=3
  hard=1
  expert=1
  unrated=0
```

- [ ] **Step 5: Verify default generator determinism twice**

Run:

```powershell
npm run generate:candidates -- --seed 123456
```

Then:

```powershell
Get-FileHash .generated\candidates-123456.json
```

```powershell
Get-FileHash .generated\shortlist-123456.md
```

Record both hashes locally.

Run again:

```powershell
npm run generate:candidates -- --seed 123456
```

Then repeat both `Get-FileHash` commands.

Required: JSON hash is identical across the two default runs; Markdown hash is identical across the two default runs.

Do not compare these hashes to pre-Difficulty-v1 hashes because accepted candidate JSON now intentionally contains difficulty metadata.

- [ ] **Step 6: Verify target preference does not alter accepted pool**

Save the default JSON to a temporary ignored path:

```powershell
Copy-Item .generated\candidates-123456.json .generated\candidates-123456-default-copy.json
```

Run:

```powershell
npm run generate:candidates -- --seed 123456 --difficulty expert
```

Compare the `pool.accepted[*].candidate.id` arrays between the default copy and the targeted report with a short local `tsx`/Node inspection.

Required:

```text
same accepted candidate IDs in same pool order
difficultyTarget differs
shortlist is allowed to differ
```

Delete temporary copy:

```powershell
Remove-Item .generated\candidates-123456-default-copy.json
```

- [ ] **Step 7: Verify profiler boundary with real seed**

```powershell
npm run profile:generator -- --seed 123456
```

Required qualitative invariants:

```text
generation-failed humanDifficultyMs=0
duplicate humanDifficultyMs=0
monster-density humanDifficultyMs=0
non-unique humanDifficultyMs=0
hard-quality humanDifficultyMs=0
geometry-warning humanDifficultyMs=0
accepted may have humanDifficultyMs>0
```

No hard wall-clock threshold.

- [ ] **Step 8: Write `2026-09-04-difficulty-v1-baseline.md` from actual outputs**

The report must contain only verified values from Steps 1–7.

Sections:

```text
Difficulty v1 formula/version
Authored band distribution
Authored per-level band + score
Generated seed-123456 band distribution
Generated shortlist per-candidate band + score
Default any shortlist ID order
Targeted hard/expert smoke result
Accepted-pool invariance
Profiler accepted-only human-difficulty boundary
Deterministic output hashes
Known limitations / no player-facing labels
```

Do not invent easy/medium/hard player progression.

Do not state that difficulty is human-validated.

- [ ] **Step 9: Update `CURRENT_STATE.md` only with implemented verified facts**

Add a section equivalent to:

```text
## Difficulty Analysis v1

- separate pure DifficultyAnalyzer consumes Human Solver results;
- internal bands: easy / medium / hard / expert / unrated;
- score is deterministic and versioned;
- reasoning tier sets a non-overlapping score range;
- Treasure Room variant or >=9 ordinary contradiction proofs => expert;
- Human analysis JSON/Markdown includes DifficultyProfile;
- generated accepted candidates carry DifficultyProfile only after canonical acceptance;
- difficulty is not a Generator rejection reason;
- generator CLI accepts optional --difficulty any|easy|medium|hard|expert;
- default any preserves Generator v1.2 shortlist behavior;
- specific target changes shortlist preference only;
- two-room size coverage remains stronger than difficulty preference;
- no player-facing difficulty/progression is implemented.
```

Include actual authored/generated baseline counts only after the fresh commands verify them.

- [ ] **Step 10: Update `TREE.txt`**

Add:

```text
docs/superpowers/plans/2026-09-04-difficulty-analysis-v1.md
docs/superpowers/reports/2026-09-04-difficulty-v1-baseline.md
docs/superpowers/specs/2026-09-04-difficulty-analysis-v1-design.md
src/dev/difficultySanity.ts
src/puzzle/difficulty/DifficultyAnalyzer.ts
src/puzzle/difficulty/types.ts
```

Do not add `.generated/`.

- [ ] **Step 11: Final verification after docs edit**

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human
```

```powershell
npm run sanity:human-analysis
```

```powershell
npm run sanity:generator
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run build
```

```powershell
git status --short
```

Required:

- all tests/build green;
- only intended tracked Difficulty v1/doc files modified;
- `.generated/` absent from status.

- [ ] **Step 12: Commit Task 5**

```powershell
git add docs/superpowers/reports/2026-09-04-difficulty-v1-baseline.md CURRENT_STATE.md TREE.txt
```

Also add `src/dev/difficultySanity.ts` or `src/dev/generatorSanity.ts` only when Step 8–10 introduced a real final regression assertion there.

Commit:

```powershell
git commit -m "docs: record difficulty analysis v1"
```

Then:

```powershell
npm run context:last
```

---

# Final Verification Checklist

Before calling Difficulty Analysis v1 complete:

- [ ] `npm run sanity:difficulty` passes from a fresh run.
- [ ] `npm run sanity:human` passes from a fresh run.
- [ ] `npm run sanity:human-analysis` passes from a fresh run.
- [ ] `npm run sanity:generator` passes from a fresh run.
- [ ] `npx tsx src/dev/profilerSanity.ts` passes from a fresh run.
- [ ] `npx tsx src/dev/generatedPlaytestSanity.ts` passes.
- [ ] `npm run build` passes.
- [ ] Difficulty Analyzer contains no Phaser dependency.
- [ ] Difficulty Analyzer does not call Human Solver internally.
- [ ] Human Solver semantics are unchanged.
- [ ] LevelValidator semantics are unchanged.
- [ ] PuzzleSolver semantics are unchanged.
- [ ] LevelQualityAnalyzer semantics are unchanged.
- [ ] Easy scores remain inside `0..24`.
- [ ] Medium scores remain inside `25..49`.
- [ ] Hard scores remain inside `50..74`.
- [ ] Expert scores remain inside `75..100`.
- [ ] `stuck` and `invalid` return `unrated` and `score=null`.
- [ ] Treasure Room variant reasoning forces expert band.
- [ ] Ordinary contradiction count 9+ forces expert band.
- [ ] Current authored bands are `6 easy / 1 medium / 3 hard / 2 expert / 0 unrated`.
- [ ] Current seed-123456 shortlist bands are `10 easy / 3 medium / 1 hard / 1 expert / 0 unrated`.
- [ ] Accepted generated candidates carry `DifficultyProfile`.
- [ ] Rejected generator attempts do not run Human Solver/DifficultyAnalyzer.
- [ ] Difficulty is not a CandidateFactory rejection reason.
- [ ] Default CLI difficulty target is `any`.
- [ ] Default `any` preserves current shortlist ordering.
- [ ] Specific difficulty target changes shortlist preference only.
- [ ] Targeting does not alter accepted-pool membership.
- [ ] Two-room 7×7/8×8 shortlist coverage remains intact.
- [ ] Unrated candidates remain accepted but rank after rated alternatives for a specific target.
- [ ] Same seed + same target produces byte-identical JSON/Markdown content.
- [ ] Generated playtest still reads the additive generator report shape.
- [ ] `.generated/` remains ignored and unstaged.
- [ ] No player-facing difficulty labels, campaign progression, or difficulty gate were added.

# Execution Shape

The implementation should be executed as five task-level RED/GREEN batches:

```text
Task 1: Difficulty core
Task 2: Human reports + 27-level corpus
Task 3: Accepted generator metadata + profiler boundary
Task 4: Target ranking + CLI
Task 5: Full verification + docs
```

Do not split these into dozens of user download/run cycles. Within one execution session, perform internal RED/GREEN steps locally and hand the user a consolidated archive/checkpoint only when a task-level review boundary is useful.
