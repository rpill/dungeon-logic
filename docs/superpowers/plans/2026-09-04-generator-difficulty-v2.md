# Generator Difficulty v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic difficulty-targeted generation that builds a 50-candidate pool biased toward `easy`, `medium`, `hard`, or `expert`, then selects a global 15-candidate shortlist without changing the `difficulty=any` Generator v1.2 baseline.

**Architecture:** Keep the existing `any` path as a strict compatibility branch. Add a small policy module for fixed v2 affinity constants, extend CandidateFactory with a targeted reservoir/backfill path that reuses the existing candidate acceptance pipeline, and add a separate global targeted-shortlist selector in CandidateRanker so the legacy per-archetype shortlist remains available for compatibility/corpus analysis. Extend reports, profiler parity, and the corpus analyzer additively; do not tune CandidateGenerator composition until the first targeted 10-seed corpus is measured.

**Tech Stack:** TypeScript 6, Node/tsx dev scripts, existing Phaser/Vite project, existing canonical validator, PuzzleSolver, Human Solver, Difficulty v1, LevelQualityAnalyzer.

**Spec:** `docs/superpowers/specs/2026-09-04-generator-difficulty-v2-design.md`

## Global Constraints

- `difficulty=any` must preserve Generator v1.2 behavior, accepted pool ordering, existing ranking semantics, two-room `target + 1` completion behavior, and deterministic seed behavior.
- Specific targets are exactly `easy`, `medium`, `hard`, and `expert`.
- A completed targeted pool contains exactly 50 final accepted candidates.
- Initial targeted quotas are fixed by the approved profile and sum to 50 for every target.
- Reservoir goal is exactly `2 * nominalQuota`; `maxAttemptsPerArchetype` remains the hard stop.
- Reservoir candidates must pass the existing acceptance pipeline; difficulty targeting must not weaken validator, uniqueness, quality, Human Solver, or Difficulty checks.
- Exact target band beats every fallback. Rated fallback beats `unrated`.
- Targeted two-room size diversity is soft and must never displace an exact target candidate with a fallback.
- Targeted shortlist size is exactly 15 for a completed targeted pool; soft per-archetype cap is 9, but the cap must be relaxed rather than introduce fallback while exact candidates remain.
- No `Math.random()`, wall-clock ordering, dynamic percentiles, new mechanics, blocker generation, door generation, Difficulty v1 formula changes, Human Solver changes, or composition tuning in this implementation.
- Existing corpus invocation `npm run analyze:difficulty-corpus -- --seeds <list>` remains the legacy any-pool analysis path.
- New targeted corpus mode uses the same standard 10 seeds and measures real targeted generation.
- Do not commit intermediate tasks in this chat workflow. Treat task boundaries as review checkpoints; commit only after the full user-side verification pass succeeds.

---

## File Map

### Create

- `src/puzzle/generator/DifficultyTargetPolicy.ts` — owns v2 target constants, affinity quotas, target-band distance, reservoir goals, and target-type guards.
- `src/dev/TargetedDifficultyCorpusAnalyzer.ts` — aggregates real targeted generator runs without changing the legacy corpus report type.
- `docs/superpowers/reports/2026-09-04-generator-difficulty-v2-infrastructure-baseline.md` — copied from the first measured 10-seed targeted corpus after implementation.

### Modify

- `src/puzzle/generator/types.ts` — additive targeted diagnostics/report contracts; keep legacy fields intact.
- `src/puzzle/generator/CandidateFactory.ts` — dispatch strict `any` compatibility path vs targeted reservoir/backfill path.
- `src/puzzle/generator/CandidateRanker.ts` — reusable target preference ordering plus new global targeted shortlist; preserve existing `selectShortlist()` semantics.
- `src/dev/generatorSanity.ts` — RED/GREEN policy, pool, backfill, size coverage, shortlist, and `any` compatibility checks.
- `src/dev/generateCandidates.ts` — targeted report composition/Markdown diagnostics while preserving existing CLI syntax and legacy output behavior.
- `src/dev/profileGenerator.ts` — mirror targeted reservoir/final-selection accounting while preserving rejected-candidate `humanDifficultyMs === 0` semantics.
- `src/dev/profileGeneratorCli.ts` — print targeted reservoir/final counts when a specific target is requested; legacy output unchanged for `any`.
- `src/dev/profilerSanity.ts` — targeted profiler/factory parity checks.
- `src/dev/DifficultyCorpusAnalyzer.ts` — preserve legacy analyzer unchanged except shared target types/helpers if needed.
- `src/dev/DifficultyCorpusOutput.ts` — write deterministic targeted corpus JSON/Markdown alongside legacy outputs.
- `src/dev/analyzeDifficultyCorpus.ts` — extend CLI parsing with `--difficulty easy|medium|hard|expert|all` while keeping the old two-argument form valid.
- `src/dev/difficultyCorpusSanity.ts` — targeted report arithmetic, parser, determinism, and output-path checks.
- `TREE.txt` — regenerate after new source/report files exist.

### Intentionally unchanged

- `src/puzzle/generator/CandidateGenerator.ts`
- `src/puzzle/generator/SeededRandom.ts`
- `src/puzzle/difficulty/DifficultyAnalyzer.ts`
- `src/puzzle/difficulty/types.ts`
- `src/puzzle/human-solver/*`
- `src/puzzle/solver/*`
- `src/puzzle/LevelValidator.ts`
- `src/puzzle/quality/LevelQualityAnalyzer.ts`
- runtime board/scenes and authored levels

---

### Task 1: Lock Targeted Difficulty Policy and Additive Contracts

**Files:**
- Create: `src/puzzle/generator/DifficultyTargetPolicy.ts`
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: existing `DifficultyBand`, `DifficultyTarget`, `GeneratorArchetype`, `AcceptedCandidate`.
- Produces: `TargetedDifficultyTarget`, `TARGETED_POOL_SIZE`, `TARGETED_SHORTLIST_SIZE`, `TARGETED_SHORTLIST_SOFT_CAP`, `TARGETED_ARCHETYPE_QUOTAS`, `isTargetedDifficultyTarget()`, `getTargetedArchetypeQuota()`, `getTargetedReservoirGoal()`, `difficultyBandDistance()`.
- Produces additive `TargetedArchetypePoolDiagnostics`, `TargetedPoolDiagnostics`, and `TargetedShortlistDiagnostics` contracts.

- [ ] **Step 1: Add RED policy checks to `generatorSanity.ts`**

Import the not-yet-created policy API and add one focused check function:

```ts
import {
  TARGETED_ARCHETYPE_QUOTAS,
  TARGETED_POOL_SIZE,
  TARGETED_SHORTLIST_SIZE,
  TARGETED_SHORTLIST_SOFT_CAP,
  difficultyBandDistance,
  getTargetedArchetypeQuota,
  getTargetedReservoirGoal,
} from '../puzzle/generator/DifficultyTargetPolicy';

import {
  DifficultyBand,
  DifficultyTarget,
} from '../puzzle/difficulty/types';

function runDifficultyTargetPolicyChecks(): void {
  assert(TARGETED_POOL_SIZE === 50, 'Targeted pool size must be 50.');
  assert(TARGETED_SHORTLIST_SIZE === 15, 'Targeted shortlist size must be 15.');
  assert(TARGETED_SHORTLIST_SOFT_CAP === 9, 'Targeted shortlist soft cap must be 9.');

  const expected = {
    easy: [18, 16, 10, 4, 2],
    medium: [10, 10, 16, 8, 6],
    hard: [4, 4, 14, 20, 8],
    expert: [2, 2, 6, 10, 30],
  } as const;

  const archetypes = [
    GeneratorArchetype.MonsterOnly,
    GeneratorArchetype.MixedOneRoom,
    GeneratorArchetype.MixedTwoRooms,
    GeneratorArchetype.ChestTwoRooms,
    GeneratorArchetype.ChestOneRoom,
  ] as const;

  for (const target of [
    DifficultyTarget.Easy,
    DifficultyTarget.Medium,
    DifficultyTarget.Hard,
    DifficultyTarget.Expert,
  ] as const) {
    const quotas = archetypes.map(
      (archetype) => getTargetedArchetypeQuota(target, archetype),
    );

    assert(
      JSON.stringify(quotas) === JSON.stringify(expected[target]),
      `${target} affinity quotas must match the approved v2 profile.`,
    );

    assert(
      quotas.reduce((sum, value) => sum + value, 0) === 50,
      `${target} affinity quotas must sum to 50.`,
    );

    for (const archetype of archetypes) {
      assert(
        getTargetedReservoirGoal(target, archetype) ===
          2 * getTargetedArchetypeQuota(target, archetype),
        `${target}/${archetype} reservoir goal must be 2x quota.`,
      );
    }
  }

  assert(
    difficultyBandDistance(DifficultyTarget.Medium, DifficultyBand.Medium) === 0,
    'Exact target band distance must be zero.',
  );
  assert(
    difficultyBandDistance(DifficultyTarget.Medium, DifficultyBand.Easy) === 1 &&
      difficultyBandDistance(DifficultyTarget.Medium, DifficultyBand.Hard) === 1,
    'Adjacent rated bands must have distance one.',
  );
  assert(
    difficultyBandDistance(DifficultyTarget.Medium, DifficultyBand.Expert) === 2,
    'Expert must be distance two from medium.',
  );
  assert(
    difficultyBandDistance(DifficultyTarget.Expert, DifficultyBand.Unrated) > 3,
    'Unrated must rank below every rated fallback.',
  );
}
```

Call `runDifficultyTargetPolicyChecks()` from the existing sanity entry sequence.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: TypeScript/module resolution fails because `DifficultyTargetPolicy.ts` and its exports do not exist yet.

- [ ] **Step 3: Create `DifficultyTargetPolicy.ts`**

Use one explicit policy table; do not scatter target conditionals through CandidateFactory:

```ts
import {
  DifficultyBand,
  DifficultyTarget,
  type DifficultyBand as DifficultyBandType,
  type DifficultyTarget as DifficultyTargetType,
} from '../difficulty/types';

import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeType,
} from './types';

export type TargetedDifficultyTarget =
  Exclude<
    DifficultyTargetType,
    typeof DifficultyTarget.Any
  >;

export type TargetedArchetypeQuotaMap =
  Readonly<Record<GeneratorArchetypeType, number>>;

export const TARGETED_POOL_SIZE = 50;
export const TARGETED_SHORTLIST_SIZE = 15;
export const TARGETED_SHORTLIST_SOFT_CAP = 9;
export const TARGETED_RESERVOIR_MULTIPLIER = 2;

export const TARGETED_ARCHETYPE_QUOTAS:
  Readonly<Record<TargetedDifficultyTarget, TargetedArchetypeQuotaMap>> = {
  easy: {
    'monster-only': 18,
    'mixed-one-room': 16,
    'mixed-two-rooms': 10,
    'chest-two-rooms': 4,
    'chest-one-room': 2,
  },
  medium: {
    'monster-only': 10,
    'mixed-one-room': 10,
    'mixed-two-rooms': 16,
    'chest-two-rooms': 8,
    'chest-one-room': 6,
  },
  hard: {
    'monster-only': 4,
    'mixed-one-room': 4,
    'mixed-two-rooms': 14,
    'chest-two-rooms': 20,
    'chest-one-room': 8,
  },
  expert: {
    'monster-only': 2,
    'mixed-one-room': 2,
    'mixed-two-rooms': 6,
    'chest-two-rooms': 10,
    'chest-one-room': 30,
  },
};

const RATED_BAND_INDEX = {
  [DifficultyBand.Easy]: 0,
  [DifficultyBand.Medium]: 1,
  [DifficultyBand.Hard]: 2,
  [DifficultyBand.Expert]: 3,
} as const;

export function isTargetedDifficultyTarget(
  target: DifficultyTargetType,
): target is TargetedDifficultyTarget {
  return target !== DifficultyTarget.Any;
}

export function getTargetedArchetypeQuota(
  target: TargetedDifficultyTarget,
  archetype: GeneratorArchetypeType,
): number {
  return TARGETED_ARCHETYPE_QUOTAS[target][archetype];
}

export function getTargetedReservoirGoal(
  target: TargetedDifficultyTarget,
  archetype: GeneratorArchetypeType,
): number {
  return (
    getTargetedArchetypeQuota(target, archetype) *
    TARGETED_RESERVOIR_MULTIPLIER
  );
}

export function difficultyBandDistance(
  target: TargetedDifficultyTarget,
  band: DifficultyBandType,
): number {
  if (band === DifficultyBand.Unrated) {
    return 4;
  }

  return Math.abs(
    RATED_BAND_INDEX[target] -
      RATED_BAND_INDEX[band],
  );
}
```

Do not add a target-conditioned board-size or monster-density table in this file yet.

- [ ] **Step 4: Add targeted diagnostic types to `types.ts`**

Keep every existing field unchanged and add only optional targeted metadata so `JSON.stringify()` for the `any` path does not gain extra keys:

```ts
import type {
  TargetedDifficultyTarget,
} from './DifficultyTargetPolicy';

export interface TargetedArchetypePoolDiagnostics {
  archetype: GeneratorArchetype;
  nominalQuota: number;
  reservoirGoal: number;
  reservoirCount: number;
  finalAccepted: number;
  exactCount: number;
  fallbackCount: number;
}

export interface TargetedPoolDiagnostics {
  difficultyTarget: TargetedDifficultyTarget;
  requestedPoolSize: 50;
  nominalQuotas:
    Readonly<Record<GeneratorArchetype, number>>;
  archetypes:
    readonly TargetedArchetypePoolDiagnostics[];
  exactCount: number;
  fallbackCount: number;
  exactRate: number;
  backfillUsed: boolean;
  backfillCount: number;
  missingSlots: number;
}

export interface TargetedShortlistDiagnostics {
  difficultyTarget: TargetedDifficultyTarget;
  requestedShortlistSize: 15;
  exactCount: number;
  fallbackCount: number;
  exactRate: number;
  archetypeCounts:
    Readonly<Record<GeneratorArchetype, number>>;
}
```

Extend, without renaming existing fields:

```ts
export interface GeneratorPoolReport {
  // existing fields stay in their existing order
  targeting?: TargetedPoolDiagnostics;
}

export interface GeneratorRunReport {
  // existing fields stay in their existing order
  shortlistTargeting?: TargetedShortlistDiagnostics;
}
```

If the current `GeneratorConfig` already contains `difficultyTarget`, keep its current type/default exactly. Do not introduce a second target field.

- [ ] **Step 5: Verify GREEN for policy-only checks**

Run:

```powershell
npm run sanity:generator
```

Expected: all pre-existing generator sanity checks plus the new policy-table checks pass. No generator behavior has changed yet.

**Review checkpoint:** policy/constants/types only; no commit yet.

---

### Task 2: Add Targeted Reservoir Selection and Global Backfill

**Files:**
- Modify: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: existing `evaluateCandidate()`, candidate seed/size attempt sequence, `scoreCandidate()`, existing quality/diversity tie-breaks, policy quotas/distance.
- Produces: `selectTargetedPoolFromReservoirs()` as a pure deterministic selector.
- Produces: `createCandidatePool(config)` dispatching to the untouched compatibility path for `any` and the new targeted path for rated targets.

- [ ] **Step 1: Add pure RED fixtures for target priority, size coverage, and backfill**

Add a fixture helper to `generatorSanity.ts` that clones a known accepted candidate and changes only generator metadata/difficulty fields needed by CandidateRanker. Use the existing `AcceptedCandidate` shape, including its current `difficulty` profile. Keep `quality` from a real accepted fixture so `scoreCandidate()` remains valid.

Create fixtures that prove these invariants:

```ts
const mediumExact8 = acceptedFixture({
  id: 'medium-exact-8',
  seed: 10,
  archetype: GeneratorArchetype.ChestTwoRooms,
  size: 8,
  band: DifficultyBand.Medium,
});

const mediumExact7 = acceptedFixture({
  id: 'medium-exact-7',
  seed: 11,
  archetype: GeneratorArchetype.ChestTwoRooms,
  size: 7,
  band: DifficultyBand.Medium,
});

const hardFallback7 = acceptedFixture({
  id: 'hard-fallback-7',
  seed: 12,
  archetype: GeneratorArchetype.ChestTwoRooms,
  size: 7,
  band: DifficultyBand.Hard,
});
```

Assertions:

```ts
const exactWins = selectTargetedPoolFromReservoirs(
  makeReservoirMap({
    'chest-two-rooms': [mediumExact8, hardFallback7],
  }),
  DifficultyTarget.Medium,
  makeQuotaMap({ 'chest-two-rooms': 1 }),
  1,
);

assert(
  exactWins.accepted[0].candidate.id === 'medium-exact-8',
  'Exact target must beat fallback even when fallback adds missing board size.',
);

const sizeTie = selectTargetedPoolFromReservoirs(
  makeReservoirMap({
    'chest-two-rooms': [mediumExact8, mediumExact7],
  }),
  DifficultyTarget.Medium,
  makeQuotaMap({ 'chest-two-rooms': 2 }),
  2,
);

assert(
  new Set(sizeTie.accepted.map((entry) => entry.candidate.size)).size === 2,
  'Equivalent target tier should preserve 7x7/8x8 diversity when quota allows it.',
);
```

Add a backfill fixture with one archetype short of quota and another with exact surplus; assert final count reaches the requested total, `backfillCount` is positive, and the surplus exact candidate beats a rated fallback surplus.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: compile failure because `selectTargetedPoolFromReservoirs()` does not exist.

- [ ] **Step 3: Add deterministic targeted pool selector to `CandidateRanker.ts`**

Export:

```ts
export interface TargetedPoolSelection {
  accepted: readonly AcceptedCandidate[];
  byArchetype:
    Readonly<
      Record<
        GeneratorArchetype,
        readonly AcceptedCandidate[]
      >
    >;
  backfillCount: number;
}

export function selectTargetedPoolFromReservoirs(
  reservoirs:
    Readonly<
      Record<
        GeneratorArchetype,
        readonly AcceptedCandidate[]
      >
    >,
  target: TargetedDifficultyTarget,
  quotas: TargetedArchetypeQuotaMap,
  requestedTotal = TARGETED_POOL_SIZE,
): TargetedPoolSelection;
```

Implement one shared preference comparator:

```ts
function compareTargetPreference(
  left: AcceptedCandidate,
  right: AcceptedCandidate,
  target: TargetedDifficultyTarget,
): number {
  const distanceDelta =
    difficultyBandDistance(target, left.difficulty.band) -
    difficultyBandDistance(target, right.difficulty.band);

  if (distanceDelta !== 0) {
    return distanceDelta;
  }

  const qualityDelta =
    scoreCandidate(right) -
    scoreCandidate(left);

  if (qualityDelta !== 0) {
    return qualityDelta;
  }

  return left.candidate.seed - right.candidate.seed;
}
```

For each archetype:

1. group candidates by difficulty distance;
2. exhaust lower-distance groups before considering higher-distance groups;
3. inside a single distance group, reuse the current diversity-aware ranking behavior rather than inventing a second quality formula;
4. for `chest-two-rooms` and `mixed-two-rooms`, when the currently selected tier has both sizes and at least two remaining slots, prefer covering both 7 and 8 before taking a second candidate of the same size;
5. never cross a difficulty-distance boundary only to obtain size diversity.

After nominal selection, concatenate unselected reservoir surplus from every archetype, sort by the same target preference, and fill `requestedTotal - selected.length`. Rebuild `byArchetype` from the actual final accepted set so backfill can make one archetype exceed its nominal quota.

- [ ] **Step 4: Preserve the existing `any` factory path before adding dispatch**

In `CandidateFactory.ts`, extract the current `createCandidatePool()` body to a private helper without changing its statements/order except for the function wrapper:

```ts
function createCompatibilityCandidatePool(
  config: GeneratorConfig,
): GeneratorPoolReport {
  // current v1.2 pool body moved here unchanged
}
```

Do this before writing targeted generation. Existing tests must remain green at this point.

Run:

```powershell
npm run sanity:generator
```

Expected: all existing checks still pass.

- [ ] **Step 5: Add targeted reservoir generation**

Dispatch after existing config validation:

```ts
export function createCandidatePool(
  config: GeneratorConfig,
): GeneratorPoolReport {
  validateGeneratorConfig(config);

  if (!isTargetedDifficultyTarget(config.difficultyTarget)) {
    return createCompatibilityCandidatePool(config);
  }

  return createTargetedCandidatePool(
    config,
    config.difficultyTarget,
  );
}
```

`createTargetedCandidatePool()` must use the same current attempt loop ingredients as the compatibility path:

```ts
for (const archetype of ALL_GENERATOR_ARCHETYPES) {
  const quota = getTargetedArchetypeQuota(target, archetype);
  const reservoirGoal = getTargetedReservoirGoal(target, archetype);
  const reservoir: AcceptedCandidate[] = [];

  for (
    let attempt = 0;
    attempt < config.maxAttemptsPerArchetype &&
      reservoir.length < reservoirGoal;
    attempt += 1
  ) {
    // preserve current deterministic size selection / candidate-seed derivation
    // preserve current generateCandidate -> evaluateCandidate pipeline
    // preserve current rejection accounting / duplicate semantics
    // push only evaluation.accepted candidates into reservoir
  }

  reservoirs[archetype] = reservoir;
  // retain attempts/rejectionSamples/exhausted for report construction
}
```

Do not call Human Solver or Difficulty a second time: targeted mode must use the `difficulty` already attached by the existing accepted-candidate evaluation pipeline.

Call `selectTargetedPoolFromReservoirs()` once all archetype reservoirs are collected.

Build `GeneratorPoolReport.accepted` from the final selection, not the entire reservoir.

Set:

```ts
completed = finalSelection.accepted.length === TARGETED_POOL_SIZE;
```

Do not apply the compatibility `target + 1` two-room completion rule in this branch.

- [ ] **Step 6: Populate targeted pool diagnostics**

For each actual archetype, calculate:

```ts
const finalAccepted =
  finalSelection.byArchetype[archetype];

const exactCount =
  finalAccepted.filter(
    (entry) => entry.difficulty.band === target,
  ).length;
```

Attach `pool.targeting` only in targeted mode. Compute `exactRate` as zero when accepted is empty, otherwise round deterministically to six decimal places using the same style already used by corpus metrics.

`missingSlots` is:

```ts
Math.max(
  0,
  TARGETED_POOL_SIZE - finalSelection.accepted.length,
);
```

`backfillUsed` is `backfillCount > 0`.

- [ ] **Step 7: Add a real small targeted integration check**

Use the default generator config with one fixed seed and a specific target, but keep this as one integration check rather than the full 10-seed benchmark:

```ts
const targeted = createCandidatePool({
  ...DEFAULT_GENERATOR_CONFIG,
  masterSeed: 123456,
  difficultyTarget: DifficultyTarget.Medium,
});

assert(
  targeted.accepted.length <= 50,
  'Targeted pool must never exceed 50 final candidates.',
);

if (targeted.completed) {
  assert(
    targeted.accepted.length === 50,
    'Completed targeted pool must contain exactly 50 candidates.',
  );
}

assert(
  targeted.targeting?.requestedPoolSize === 50,
  'Targeted pool must expose v2 diagnostics.',
);
```

Do not assert a minimum medium exact-rate yet.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: policy, pure selector, compatibility, and targeted integration checks pass.

**Review checkpoint:** targeted pool infrastructure works; no shortlist/report/corpus tuning yet; no commit.

---

### Task 3: Add the Global 15-Candidate Targeted Shortlist

**Files:**
- Modify: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: targeted pool, affinity quotas, existing `scoreCandidate()` / diversity-aware ranking.
- Produces: `selectGlobalTargetedShortlist(pool, target): readonly RankedCandidate[]`.
- Keeps existing `selectShortlist(pool, perArchetype, difficultyTarget)` behavior intact for compatibility and legacy any-pool corpus emulation.

- [ ] **Step 1: Add RED shortlist fixtures**

Add deterministic fixture pools that cover all three conceptual passes.

Case A: 15 exact candidates distributed across archetypes. Assert length 15 and fallback count zero.

Case B: 15+ exact candidates exist, but 12 exact candidates are from one archetype and only three exact candidates exist elsewhere. Assert all 15 selected entries are exact even though one archetype exceeds the soft cap of 9.

Case C: only 12 exact candidates exist globally plus several distance-1 and distance-2 fallbacks. Assert shortlist contains all 12 exact first, then three distance-1 fallbacks; no distance-2 fallback may displace distance-1.

Case D: diverse exact supply is sufficient. Assert no archetype exceeds 9.

Use assertions of this form:

```ts
const shortlist =
  selectGlobalTargetedShortlist(
    fixturePool,
    DifficultyTarget.Expert,
  );

assert(shortlist.length === 15, 'Completed targeted shortlist must contain 15 candidates.');

const fallbackStart =
  shortlist.findIndex(
    (entry) =>
      entry.accepted.difficulty.band !== DifficultyBand.Expert,
  );

assert(
  fallbackStart === -1 ||
    shortlist.slice(0, fallbackStart).every(
      (entry) => entry.accepted.difficulty.band === DifficultyBand.Expert,
    ),
  'Fallback must never precede an exact target candidate.',
);
```

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: compile failure because `selectGlobalTargetedShortlist()` does not exist.

- [ ] **Step 3: Add deterministic affinity targets for shortlist pass 1**

Inside CandidateRanker, derive the 15-slot preferred distribution from the 50-slot policy with a largest-remainder allocation:

```ts
function deriveShortlistAffinityTargets(
  target: TargetedDifficultyTarget,
): Readonly<Record<GeneratorArchetype, number>> {
  const quotas = TARGETED_ARCHETYPE_QUOTAS[target];

  const raw = ALL_GENERATOR_ARCHETYPES.map(
    (archetype, policyIndex) => {
      const scaled =
        quotas[archetype] *
        TARGETED_SHORTLIST_SIZE /
        TARGETED_POOL_SIZE;

      return {
        archetype,
        policyIndex,
        base: Math.floor(scaled),
        remainder: scaled - Math.floor(scaled),
      };
    },
  );

  // allocate remaining slots by remainder descending,
  // then policy order; cap each preferred target at 9 and
  // deterministically redistribute any capped remainder.
}
```

This allocation is only a pass-1 preference. It must not block exact overflow in pass 2.

- [ ] **Step 4: Implement `selectGlobalTargetedShortlist()`**

Export:

```ts
export function selectGlobalTargetedShortlist(
  pool: GeneratorPoolReport,
  target: TargetedDifficultyTarget,
): readonly RankedCandidate[];
```

Algorithm:

```ts
const exact = pool.accepted.filter(
  (entry) => entry.difficulty.band === target,
);

const fallback = pool.accepted.filter(
  (entry) => entry.difficulty.band !== target,
);

const selected: RankedCandidate[] = [];
```

Pass 1:
- rank exact candidates with existing quality/diversity behavior;
- fill toward `deriveShortlistAffinityTargets(target)`;
- enforce `TARGETED_SHORTLIST_SOFT_CAP` while diverse exact supply exists.

Pass 2:
- if fewer than 15 are selected and unselected exact candidates remain, ignore the cap and fill exclusively from exact candidates.

Pass 3:
- only after exact is exhausted, rank fallback by `difficultyBandDistance()` first;
- within one distance, reuse existing ranking/diversity ordering;
- attempt the soft cap during fallback, then relax it if necessary to reach 15.

Return at most 15. A completed targeted pool must normally return exactly 15.

When producing `RankedCandidate.rankWithinArchetype`, count the selected position within that candidate's actual archetype, not its global shortlist index.

- [ ] **Step 5: Prove legacy `selectShortlist()` did not change**

Keep all existing `selectShortlist()` tests intact and add one explicit assertion that an `any` pool still returns:

```ts
DEFAULT_GENERATOR_CONFIG.shortlistPerArchetype *
  ALL_GENERATOR_ARCHETYPES.length
```

entries and preserves the current seed-123456 candidate IDs already asserted by `generatorSanity.ts`.

Do not route legacy any-pool corpus target emulation through the new global function.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: all legacy shortlist tests and all global targeted-shortlist fixtures pass.

**Review checkpoint:** targeted pool + global shortlist policy complete; no commit.

---

### Task 4: Wire Run Reports, CLI Output, and Profiler Parity

**Files:**
- Modify: `src/dev/generateCandidates.ts`
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/dev/generatorSanity.ts`
- Modify: `src/dev/profileGenerator.ts`
- Modify: `src/dev/profileGeneratorCli.ts`
- Modify: `src/dev/profilerSanity.ts`

**Interfaces:**
- Consumes: `createCandidatePool()`, legacy `selectShortlist()`, new `selectGlobalTargetedShortlist()`.
- Produces: run-report `shortlistTargeting` metadata only in specific-target mode.
- Preserves current CLI syntax `npm run generate:candidates -- --seed <uint32> --difficulty <target>` and existing filenames.
- Keeps profiler/factory attempt and acceptance semantics aligned.

- [ ] **Step 1: Add RED run-report diagnostics checks**

In `generatorSanity.ts`, call `buildGeneratorRunReport()` for a targeted config and assert:

```ts
if (report.pool.completed) {
  assert(
    report.shortlist.length === 15,
    'Completed targeted run report must contain a 15-entry global shortlist.',
  );
}

assert(
  report.shortlistTargeting?.difficultyTarget === DifficultyTarget.Medium,
  'Targeted run report must expose shortlist target diagnostics.',
);

assert(
  report.shortlistTargeting === undefined ||
    report.shortlistTargeting.exactCount +
      report.shortlistTargeting.fallbackCount ===
      report.shortlist.length,
  'Targeted shortlist exact/fallback arithmetic must match shortlist length.',
);
```

For `difficulty=any`, assert `pool.targeting === undefined` and `shortlistTargeting === undefined` so serialized legacy reports do not gain targeted-only keys.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: targeted report still uses the old shortlist path and/or lacks `shortlistTargeting`.

- [ ] **Step 3: Dispatch shortlist building in `buildGeneratorRunReport()`**

Use explicit branching:

```ts
const shortlist =
  pool.completed
    ? isTargetedDifficultyTarget(config.difficultyTarget)
      ? selectGlobalTargetedShortlist(
          pool,
          config.difficultyTarget,
        )
      : selectShortlist(
          pool,
          config.shortlistPerArchetype,
          config.difficultyTarget,
        )
    : [];
```

Build `shortlistTargeting` only for a specific target. Count exact/fallback and actual archetype distribution from the final shortlist. Use six-decimal deterministic `exactRate` arithmetic.

Keep `schemaVersion` unchanged unless the current implementation already requires a higher value; this change is additive.

- [ ] **Step 4: Make Markdown distinguish targeted runs without changing any-mode formatting**

For `any`, keep the existing v1.2 Markdown byte structure.

For a specific target, prepend deterministic metadata:

```text
Difficulty target: medium
Targeted pool: 50 requested
Pool exact: <count>
Pool fallback: <count>
Global backfill: <count>
Shortlist exact: <count>/15
Shortlist fallback: <count>/15
```

Then emit one `## Global targeted shortlist` section. Each candidate block must include its archetype explicitly so global selection order remains readable.

Do not group/re-sort the targeted shortlist after selection; report ordering is part of deterministic output.

- [ ] **Step 5: Preserve existing CLI parsing and output filenames**

Do not introduce a second target flag. The current Difficulty v1 CLI already supports:

```powershell
npm run generate:candidates -- --seed 123456 --difficulty hard
```

Continue writing the existing candidate/shortlist filenames used by dev playtest. The target is distinguished by report metadata, not a new runtime route.

- [ ] **Step 6: Add targeted profiler parity**

In `profileGenerator.ts`, mirror the same mode split used by CandidateFactory:

- `difficulty=any`: current profiler loop/results remain unchanged;
- specific target: attempt until each archetype reaches its reservoir goal or hard stop;
- run Human Solver + Difficulty only after the candidate passes ordinary acceptance, preserving the existing accepted-only timing rule;
- after reservoirs are collected, reuse `selectTargetedPoolFromReservoirs()` rather than duplicating selection logic;
- report reservoir accepted count separately from final accepted count.

Do not change the existing invariant:

```ts
rejected humanDifficultyMs === 0
```

- [ ] **Step 7: Add profiler RED/GREEN checks**

In `profilerSanity.ts`, add one targeted config and assert:

```ts
assert(
  profiled.pool.completed === factory.pool.completed,
  'Targeted profiler/factory completion must match.',
);

assert(
  JSON.stringify(
    profiled.pool.accepted.map((entry) => entry.candidate.id),
  ) === JSON.stringify(
    factory.pool.accepted.map((entry) => entry.candidate.id),
  ),
  'Targeted profiler must select the same final candidate IDs as CandidateFactory.',
);
```

Also compare per-archetype attempt counts and reservoir counts. Do not compare wall-clock durations.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Run:

```powershell
npm run sanity:profiler
```

Run:

```powershell
npm run build
```

Expected: all three commands pass; no claim about full completion is made until the final regression task.

**Review checkpoint:** production targeted generation/reporting/profiler path complete; no commit.

---

### Task 5: Extend Corpus Analysis to Measure Real Targeted Generation

**Files:**
- Create: `src/dev/TargetedDifficultyCorpusAnalyzer.ts`
- Modify: `src/dev/DifficultyCorpusAnalyzer.ts`
- Modify: `src/dev/DifficultyCorpusOutput.ts`
- Modify: `src/dev/analyzeDifficultyCorpus.ts`
- Modify: `src/dev/difficultyCorpusSanity.ts`

**Interfaces:**
- Consumes: `buildGeneratorRunReport()`, standard generator config, targeted pool/shortlist diagnostics.
- Produces: legacy corpus behavior unchanged for `--seeds <list>`.
- Produces new CLI forms:
  - `--seeds <list> --difficulty easy`
  - `--seeds <list> --difficulty medium`
  - `--seeds <list> --difficulty hard`
  - `--seeds <list> --difficulty expert`
  - `--seeds <list> --difficulty all`
- Produces deterministic `.generated/difficulty-corpus-<target>.json|md` for one target and `.generated/difficulty-corpus-targeted.json|md` for `all`.

- [ ] **Step 1: Add RED parser checks while preserving the old form**

Change the CLI option contract to:

```ts
export interface DifficultyCorpusCliOptions {
  seeds: readonly number[];
  difficulty:
    | 'legacy-any'
    | TargetedDifficultyTarget
    | 'all';
}
```

Add assertions:

```ts
assert(
  parseDifficultyCorpusArgs([
    '--seeds',
    '1,42',
  ]).difficulty === 'legacy-any',
  'Old corpus invocation must stay legacy-any.',
);

assert(
  parseDifficultyCorpusArgs([
    '--seeds',
    '1,42',
    '--difficulty',
    'medium',
  ]).difficulty === DifficultyTarget.Medium,
  'Corpus CLI must parse one targeted band.',
);

assert(
  parseDifficultyCorpusArgs([
    '--seeds',
    '1,42',
    '--difficulty',
    'all',
  ]).difficulty === 'all',
  'Corpus CLI must parse all-target mode.',
);
```

Invalid target, duplicate `--difficulty`, or missing value must throw.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:difficulty-corpus
```

Expected: parser assertions fail because only the old two-argument form exists.

- [ ] **Step 3: Create targeted corpus report contracts**

In `TargetedDifficultyCorpusAnalyzer.ts` define:

```ts
export interface TargetedDifficultyCorpusArchetypeContribution {
  archetype: GeneratorArchetype;
  accepted: number;
  exact: number;
  fallback: number;
}

export interface TargetedDifficultyCorpusSeedResult {
  seed: number;
  target: TargetedDifficultyTarget;
  completed: boolean;
  accepted: number;
  poolExact: number;
  poolFallback: number;
  shortlistSlots: number;
  shortlistExact: number;
  shortlistFallback: number;
  backfillUsed: boolean;
  backfillCount: number;
  missingSlots: number;
  unrated: number;
  archetypes:
    readonly TargetedDifficultyCorpusArchetypeContribution[];
}

export interface TargetedDifficultyCorpusTargetSummary {
  target: TargetedDifficultyTarget;
  seedCount: number;
  completedSeeds: number;
  totalAccepted: number;
  poolExact: number;
  poolFallback: number;
  poolExactRate: number;
  shortlistSlots: number;
  shortlistExact: number;
  shortlistFallback: number;
  shortlistExactRate: number;
  backfillSeeds: number;
  unrated: number;
  archetypes:
    readonly TargetedDifficultyCorpusArchetypeContribution[];
}

export interface TargetedDifficultyCorpusReport {
  schemaVersion: 1;
  mode: 'targeted';
  seeds: readonly number[];
  targets: readonly TargetedDifficultyTarget[];
  summaries:
    readonly TargetedDifficultyCorpusTargetSummary[];
  seedResults:
    readonly TargetedDifficultyCorpusSeedResult[];
}
```

Rates are deterministic six-decimal fractions, not percentages in JSON.

- [ ] **Step 4: Implement pure targeted summarization**

Export:

```ts
export function summarizeTargetedDifficultyCorpus(
  reports: readonly GeneratorRunReport[],
): TargetedDifficultyCorpusReport;
```

Require every input report to have a specific `difficultyTarget` and targeted diagnostics. Reject mixed/legacy reports with a descriptive error rather than silently treating them as fallback.

Aggregate:
- completion count;
- pool exact/fallback;
- shortlist exact/fallback;
- per-archetype actual final contribution;
- `backfillUsed` frequency;
- missing slots;
- unrated count from final accepted candidates;
- per-target rates.

Sort summaries by `easy`, `medium`, `hard`, `expert`, and seed results by target order then seed input order. Do not sort by measured exact rate.

- [ ] **Step 5: Extend `analyzeDifficultyCorpus.ts` execution without altering legacy analysis**

Use:

```ts
if (options.difficulty === 'legacy-any') {
  // current implementation unchanged
} else {
  const targets =
    options.difficulty === 'all'
      ? [
          DifficultyTarget.Easy,
          DifficultyTarget.Medium,
          DifficultyTarget.Hard,
          DifficultyTarget.Expert,
        ] as const
      : [options.difficulty];

  const reports: GeneratorRunReport[] = [];

  for (const target of targets) {
    for (const seed of options.seeds) {
      reports.push(
        buildGeneratorRunReport({
          ...DEFAULT_GENERATOR_CONFIG,
          masterSeed: seed,
          difficultyTarget: target,
        }),
      );
    }
  }

  const report =
    summarizeTargetedDifficultyCorpus(reports);

  // write targeted deterministic output
}
```

If any targeted pool is incomplete, still write the report and set non-zero exit status after output, matching the existing corpus philosophy.

- [ ] **Step 6: Add deterministic targeted Markdown/output paths**

In `DifficultyCorpusOutput.ts`, add:

```ts
export async function writeTargetedDifficultyCorpusOutputs(
  report: TargetedDifficultyCorpusReport,
  outputDirectory = '.generated',
): Promise<DifficultyCorpusOutputPaths>;
```

File naming:

```ts
const suffix =
  report.targets.length === 1
    ? report.targets[0]
    : 'targeted';

const jsonPath = join(
  outputDirectory,
  `difficulty-corpus-${suffix}.json`,
);

const markdownPath = join(
  outputDirectory,
  `difficulty-corpus-${suffix}.md`,
);
```

Markdown sections, in this order:

```text
# Dungeon Logic Targeted Difficulty Corpus
Seeds
Targets

## Target summary
| Target | Seeds complete | Accepted | Pool exact | Pool fallback | Pool exact rate | Shortlist exact | Shortlist fallback | Shortlist exact rate | Backfill seeds | Unrated |

## Archetype contribution
(one table per target)

## Per-seed results
(one deterministic row per target/seed)
```

Do not include timestamps or elapsed durations.

- [ ] **Step 7: Add synthetic arithmetic/determinism tests**

Construct a small targeted report fixture with two seeds and two targets. Assert:

```ts
summary.poolExact + summary.poolFallback === summary.totalAccepted
```

and:

```ts
summary.shortlistExact + summary.shortlistFallback === summary.shortlistSlots
```

Assert `JSON.stringify(summarizeTargetedDifficultyCorpus(input))` is byte-equal on two calls with the same ordered input.

Write outputs to a temp directory twice and compare file contents byte-for-byte.

Do not assert a target exact-rate threshold in sanity.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm run sanity:difficulty-corpus
```

Run:

```powershell
npm run sanity:generator
```

Run:

```powershell
npm run build
```

Expected: legacy corpus checks and new targeted corpus checks pass.

**Review checkpoint:** corpus can now measure real targeted generation; no composition tuning and no commit.

---

### Task 6: Full Regression, 10-Seed Infrastructure Baseline, and Freeze Point

**Files:**
- Create: `docs/superpowers/reports/2026-09-04-generator-difficulty-v2-infrastructure-baseline.md`
- Modify: `TREE.txt`

**Interfaces:**
- Consumes: all implemented v2 infrastructure.
- Produces: the first evidence set used to decide whether one composition-tuning cycle is needed.
- Does not change CandidateGenerator composition in this task.

- [ ] **Step 1: Run the complete local regression suite**

Run each command separately:

```powershell
npm run sanity:validator
```

```powershell
npm run sanity:solver
```

```powershell
npm run sanity:quality
```

```powershell
npm run sanity:generator
```

```powershell
npm run sanity:profiler
```

```powershell
npm run sanity:human
```

```powershell
npm run sanity:difficulty
```

```powershell
npm run sanity:human-analysis
```

```powershell
npm run sanity:difficulty-corpus
```

```powershell
npm run sanity:generated-playtest
```

```powershell
npm run sanity:game-board-layout
```

```powershell
npm run build
```

If the actual package script names differ for validator/quality/playtest/layout, use the already-existing names in `package.json`; do not create aliases merely to match this plan.

- [ ] **Step 2: Re-run the `any` seed-123456 baseline**

Run:

```powershell
npm run generate:candidates -- --seed 123456 --difficulty any
```

Verify existing Generator v1.2 sanity assertions still cover:

```text
monster-only accepted = 10
chest-one-room accepted = 10
chest-two-rooms accepted = 10 or the existing compatibility +1 only when size coverage requires it
mixed-one-room accepted = 10
mixed-two-rooms accepted = 10 or the existing compatibility +1 only when size coverage requires it
shortlist = 15 using the legacy per-archetype path
```

For seed `123456`, preserve the already-established shortlist candidate IDs from the pre-v2 baseline; do not update the baseline merely because implementation order changed.

- [ ] **Step 3: Smoke-test one seed for every targeted band**

Run separately:

```powershell
npm run generate:candidates -- --seed 123456 --difficulty easy
```

```powershell
npm run generate:candidates -- --seed 123456 --difficulty medium
```

```powershell
npm run generate:candidates -- --seed 123456 --difficulty hard
```

```powershell
npm run generate:candidates -- --seed 123456 --difficulty expert
```

For every completed run verify:
- final accepted = 50;
- shortlist = 15;
- pool/shortlist exact + fallback arithmetic balances;
- targeted diagnostics identify nominal quota vs actual contribution;
- no `target + 1` targeted overflow occurs.

Do not fail infrastructure acceptance solely because one band has a low exact rate; that is the measurement this task is intended to produce.

- [ ] **Step 4: Run the standard 10-seed targeted corpus for all four bands**

Run:

```powershell
npm run analyze:difficulty-corpus -- --seeds 1,42,1337,12345,54321,123456,654321,1000003,305419896,987654321 --difficulty all
```

Expected outputs:

```text
.generated/difficulty-corpus-targeted.json
.generated/difficulty-corpus-targeted.md
```

The command may exit non-zero if any targeted pool is incomplete, but it must still write both deterministic diagnostics files.

- [ ] **Step 5: Capture the infrastructure baseline exactly as measured**

Copy the generated Markdown report into the tracked reports directory without manually rewriting numbers:

```powershell
Copy-Item .generated\difficulty-corpus-targeted.md docs\superpowers\reports\2026-09-04-generator-difficulty-v2-infrastructure-baseline.md
```

This file is the evidence used for the first tuning decision. Do not edit target exact rates by hand.

- [ ] **Step 6: Decide tuning need from evidence, but do not tune in this plan**

Use the captured report to answer only:
- which target bands complete on all 10 seeds;
- pool exact rate per band;
- shortlist exact rate per band;
- which archetypes contribute actual accepted candidates;
- how often backfill is used;
- whether `medium` remains supply-constrained.

Any change to board-size distribution, monster density/count, room count, or spatial composition is a separate evidence-driven tuning task after this infrastructure plan.

- [ ] **Step 7: Regenerate project context/tree**

Run:

```powershell
npm run context
```

Then inspect:

```powershell
git diff -- TREE.txt
```

`TREE.txt` must include:

```text
src/puzzle/generator/DifficultyTargetPolicy.ts
src/dev/TargetedDifficultyCorpusAnalyzer.ts
docs/superpowers/reports/2026-09-04-generator-difficulty-v2-infrastructure-baseline.md
```

No diagnostic throwaway files from prior Treasure Room investigations should reappear.

- [ ] **Step 8: Final staging review before the user commit**

Run:

```powershell
git status --short
```

Then:

```powershell
git diff --stat
```

Only after the user has provided fresh successful verification output should the final implementation commit be proposed. Suggested commit message at that point:

```text
feat: add targeted generator difficulty v2
```

---

## Self-Review Notes

### Spec coverage

- Strict `difficulty=any` compatibility: Tasks 2, 3, 4, 6.
- Fixed 50-candidate targeted pool and affinity quotas: Tasks 1, 2.
- `2 * Q` bounded reservoirs and existing hard stop: Tasks 1, 2.
- Exact > rated fallback > unrated: Tasks 1, 2, 3.
- Two-room 7x7/8x8 preference without crossing difficulty tier: Task 2.
- Deterministic global backfill: Task 2.
- Global 15-candidate shortlist, soft cap 9, exact overflow, fallback only after exact exhaustion: Task 3.
- Additive targeted report diagnostics: Task 4.
- Profiler parity: Task 4.
- Real targeted corpus mode and deterministic outputs: Task 5.
- Standard 10-seed first measurement and tracked baseline: Task 6.
- Composition tuning deferred: Global constraints and Task 6.

### Type consistency

- `TargetedDifficultyTarget` originates only in `DifficultyTargetPolicy.ts` and is reused by selector/report/corpus contracts.
- `selectShortlist()` remains legacy/per-archetype; `selectGlobalTargetedShortlist()` is specific to production targeted runs.
- `selectTargetedPoolFromReservoirs()` is the one pure pool-selection implementation reused by Factory and profiler.
- `GeneratorPoolReport.targeting` and `GeneratorRunReport.shortlistTargeting` are optional and omitted for `any`.

### Scope check

This plan implements infrastructure only. CandidateGenerator composition tuning is deliberately excluded until the measured baseline exists, matching the approved design and the two-tuning-cycle freeze rule.
