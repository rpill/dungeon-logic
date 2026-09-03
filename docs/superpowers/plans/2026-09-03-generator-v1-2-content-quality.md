# Generator v1.2 Content Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dev-only Dungeon Logic generator from v1.1 to v1.2 so generated pools have spatially varied Treasure Rooms, bounded Monster density, and guaranteed 7×7/8×8 coverage for two-room archetypes while preserving canonical puzzle rules and deterministic generation.

**Architecture:** Keep the existing `CandidateGenerator` → `CandidateFactory` → `CandidateRanker` split. `CandidateGenerator` owns spatial room planning, `CandidateFactory` owns generator-only acceptance policy and two-room A+ pool coverage, and `CandidateRanker` owns Monster penalty plus shortlist diversity/size guarantees. `profileGenerator.ts` mirrors the new factory semantics; no Solver, Validator, or authored `LevelQualityAnalyzer` rules change.

**Tech Stack:** TypeScript 6, Node/tsx dev sanity scripts, Vite 8, Phaser 4 runtime (unchanged), deterministic `SeededRandom`, existing `LevelValidator`, `PuzzleSolver`, and `LevelQualityAnalyzer`.

**Spec:** `docs/superpowers/specs/2026-09-03-generator-v1-2-content-quality-design.md`

## Global Constraints

- Canonical dungeon rules are unchanged.
- `LevelValidator` remains the validity authority and is not modified by this slice.
- `PuzzleSolver` semantics and pruning are unchanged.
- `LevelQualityAnalyzer` authored hard/soft thresholds are unchanged.
- Monster-density limits are Generator v1.2 policy only.
- Monster-bearing archetypes are exactly `monster-only`, `mixed-one-room`, and `mixed-two-rooms`.
- Monster hard caps are exactly: 6×6 `>5`, 7×7 `>7`, 8×8 `>8`.
- Monster ranking penalty boundary is exactly: 6×6 `5`, 7×7 `7`, 8×8 `8`.
- Boundary Monster-count penalty is exactly `-4` ranking points.
- Two-room archetypes are exactly `chest-two-rooms` and `mixed-two-rooms`; their allowed sizes remain exactly 7×7 and 8×8.
- A+ may add at most one accepted candidate beyond `acceptedPerArchetype` for each two-room archetype.
- `maxAttemptsPerArchetype` remains the hard outer attempt limit.
- Treasure Rooms remain exactly 3×3 with one intended in-board entrance.
- Treasure Rooms may touch board edges/corners; out-of-board space is never an entrance.
- No Blockers or Directional Doors are added to generated candidates.
- Do not fix the current per-archetype/global duplicate-set mismatch in this slice.
- No `Math.random()` inside Generator v1.2.
- No TypeScript enums or constructor parameter properties (`erasableSyntaxOnly` compatibility).
- Do not export implementation internals solely for tests; exported helpers in this plan are shared by production generator/ranker/report/profiler code.
- Keep Git commands PowerShell/cmd-safe: one command per line, no `&&`, no Unix backslash continuation.
- Use one batched RED edit/run and one batched GREEN edit/run per task rather than one archive per individual assertion.
- Never commit a RED state.
- After every behavior commit, run `npm run context:last`.
- Do not update `CURRENT_STATE.md` or `TREE.txt` until the final verified task.

---

## File Structure

### Existing files modified

- `src/puzzle/generator/CandidateGenerator.ts`
  - add shared spatial classification helpers;
  - stratify one-room and two-room static room planning;
  - keep hallway carving/dead-end/Chest rules unchanged.

- `src/puzzle/generator/CandidateFactory.ts`
  - add generator-only Monster policy helper;
  - add A+ pool-completion and attempt-size helpers;
  - gate overloaded Monster candidates before `evaluateCandidate()`.

- `src/puzzle/generator/CandidateRanker.ts`
  - apply the `-4` boundary Monster penalty;
  - add weighted Treasure Room spatial distance;
  - enforce two-room 7×7/8×8 shortlist representation.

- `src/puzzle/generator/types.ts`
  - add `RejectionReason.MonsterDensity`;
  - no new runtime puzzle contracts.

- `src/dev/generatorSanity.ts`
  - add all v1.2 RED/GREEN regression fixtures;
  - update old small-pool assumptions that A+ intentionally changes.

- `src/dev/profileGenerator.ts`
  - mirror Monster gate and A+ size/stopping semantics;
  - report Monster-density attempts with zero solver work.

- `src/dev/profilerSanity.ts`
  - add parity checks for Monster-density and two-room coverage behavior.

- `src/dev/generateCandidates.ts`
  - print `monster-density` counts;
  - identify output as Generator v1.2;
  - print room top-lefts and spatial category/profile in shortlist Markdown.

- `CURRENT_STATE.md`
  - record Generator v1.2 only after all verification is green.

- `TREE.txt`
  - record this plan/spec path only in the final docs commit, per the approved spec.

### Created file

- `docs/superpowers/plans/2026-09-03-generator-v1-2-content-quality.md`
  - this implementation plan.

### Intentionally unchanged

- `src/puzzle/LevelValidator.ts`
- `src/puzzle/quality/LevelQualityAnalyzer.ts`
- `src/puzzle/solver/PuzzleSolver.ts`
- production `src/data/levels/levelNNN.ts`
- duplicate-signature scope/ownership

---

### Task 1: Spatially stratify Treasure Room planning

**Files:**
- Modify: `src/puzzle/generator/CandidateGenerator.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: existing `PlannedRoom`, `SeededRandom`, `buildRoomEnvironment()`, `roomsOverlapOrTouch()`, `enumerateRoomPlans()`.
- Produces:
  - `RoomSpatialCategory` constant/type with exact values `corner | edge | interior`.
  - `classifyRoomSpatialCategory(size: number, room: PlannedRoom): RoomSpatialCategory`.
  - `getRoomSpatialCategories(size: number, rooms: readonly PlannedRoom[]): readonly RoomSpatialCategory[]`.
  - existing `generateCandidate()` behavior with deterministic stratified room selection.

- [ ] **Step 1: Add one batched RED group for spatial semantics**

In `src/dev/generatorSanity.ts`, extend the `CandidateGenerator` import:

```ts
import {
  RoomSpatialCategory,
  classifyRoomSpatialCategory,
  deriveClues,
  generateCandidate,
  getHallwayDeadEnds,
  getRoomSpatialCategories,
} from '../puzzle/generator/CandidateGenerator';
```

Add:

```ts
function roomFixture(
  x: number,
  y: number,
): PlannedRoom {
  return {
    topLeft: { x, y },
    internalEntrance: {
      x: x + 2,
      y: y + 1,
    },
    externalEntrance: {
      x: x + 3,
      y: y + 1,
    },
  };
}

function runRoomSpatialV12Checks(): void {
  const corner =
    roomFixture(0, 0);

  const edge =
    roomFixture(0, 2);

  const interior =
    roomFixture(2, 2);

  assert(
    classifyRoomSpatialCategory(
      7,
      corner,
    ) === RoomSpatialCategory.Corner,
    '7x7 topLeft (0,0) must classify as corner.',
  );

  assert(
    classifyRoomSpatialCategory(
      7,
      edge,
    ) === RoomSpatialCategory.Edge,
    '7x7 topLeft (0,2) must classify as edge.',
  );

  assert(
    classifyRoomSpatialCategory(
      7,
      interior,
    ) === RoomSpatialCategory.Interior,
    '7x7 topLeft (2,2) must classify as interior.',
  );

  const forward =
    getRoomSpatialCategories(
      7,
      [corner, interior],
    );

  const reversed =
    getRoomSpatialCategories(
      7,
      [interior, corner],
    );

  assert(
    JSON.stringify(forward) ===
      JSON.stringify(reversed),
    'Two-room spatial profile must be order-independent.',
  );

  assert(
    JSON.stringify(forward) ===
      JSON.stringify([
        RoomSpatialCategory.Corner,
        RoomSpatialCategory.Interior,
      ]),
    'Two-room spatial profile must use stable category order.',
  );

  const categories =
    new Set<string>();

  const topLefts =
    new Set<string>();

  for (
    let seed = 1;
    seed <= 500 &&
    (
      categories.size < 3 ||
      topLefts.size < 3
    );
    seed += 1
  ) {
    const result =
      generateCandidate({
        archetype:
          GeneratorArchetype.ChestOneRoom,
        size: 7,
        seed,
      });

    if (!result.ok) {
      continue;
    }

    const room =
      result.candidate.rooms[0];

    assert(
      room !== undefined,
      'Chest-one-room candidate must expose one planned room.',
    );

    if (room === undefined) {
      continue;
    }

    assert(
      room.externalEntrance.x >= 0 &&
        room.externalEntrance.x < 7 &&
        room.externalEntrance.y >= 0 &&
        room.externalEntrance.y < 7,
      'Edge/corner room entrance must stay in board bounds.',
    );

    categories.add(
      classifyRoomSpatialCategory(
        7,
        room,
      ),
    );

    topLefts.add(
      `${room.topLeft.x}:${room.topLeft.y}`,
    );
  }

  assert(
    categories.size === 3,
    'Deterministic 7x7 chest-one-room seed scan must produce corner, edge, and interior placements.',
  );

  assert(
    topLefts.size >= 3,
    'Deterministic 7x7 chest-one-room seed scan must produce at least three distinct room positions.',
  );

  const repeatedA =
    generateCandidate({
      archetype:
        GeneratorArchetype.ChestOneRoom,
      size: 7,
      seed: 123,
    });

  const repeatedB =
    generateCandidate({
      archetype:
        GeneratorArchetype.ChestOneRoom,
      size: 7,
      seed: 123,
    });

  assert(
    JSON.stringify(repeatedA) ===
      JSON.stringify(repeatedB),
    'Room stratification must preserve candidate-seed determinism.',
  );
}
```

Add `runRoomSpatialV12Checks();` in `main()` immediately after `runArchetypeChecks();`.

Also add the existing `PlannedRoom` type to the generator-types import:

```ts
type PlannedRoom,
```

- [ ] **Step 2: Run RED once**

Run:

```powershell
npm run sanity:generator
```

Expected: TypeScript/tsx fails because `RoomSpatialCategory`, `classifyRoomSpatialCategory`, and `getRoomSpatialCategories` do not exist yet.

Do not weaken the assertions to make current v1.1 pass.

- [ ] **Step 3: Implement shared spatial classification in `CandidateGenerator.ts`**

Near the generator-local room types/constants, add:

```ts
export const RoomSpatialCategory = {
  Corner: 'corner',
  Edge: 'edge',
  Interior: 'interior',
} as const;

export type RoomSpatialCategory =
  typeof RoomSpatialCategory[
    keyof typeof RoomSpatialCategory
  ];

const ROOM_SPATIAL_CATEGORY_ORDER:
  readonly RoomSpatialCategory[] = [
    RoomSpatialCategory.Corner,
    RoomSpatialCategory.Edge,
    RoomSpatialCategory.Interior,
  ];

export function classifyRoomSpatialCategory(
  size: number,
  room: PlannedRoom,
): RoomSpatialCategory {
  const maxTopLeft =
    size - 3;

  const touchesHorizontal =
    room.topLeft.x === 0 ||
    room.topLeft.x === maxTopLeft;

  const touchesVertical =
    room.topLeft.y === 0 ||
    room.topLeft.y === maxTopLeft;

  if (
    touchesHorizontal &&
    touchesVertical
  ) {
    return RoomSpatialCategory.Corner;
  }

  if (
    touchesHorizontal ||
    touchesVertical
  ) {
    return RoomSpatialCategory.Edge;
  }

  return RoomSpatialCategory.Interior;
}

export function getRoomSpatialCategories(
  size: number,
  rooms: readonly PlannedRoom[],
): readonly RoomSpatialCategory[] {
  return rooms
    .map(
      (room) =>
        classifyRoomSpatialCategory(
          size,
          room,
        ),
    )
    .sort(
      (a, b) =>
        ROOM_SPATIAL_CATEGORY_ORDER.indexOf(a) -
        ROOM_SPATIAL_CATEGORY_ORDER.indexOf(b),
    );
}
```

These exports are production-shared helpers: `CandidateGenerator` uses them now, `CandidateRanker` and Markdown reporting use them in later tasks.

- [ ] **Step 4: Replace uniform one-room planning with category-priority planning**

Refactor the one-room branch of `planRoomEnvironment()` to:

```ts
const plans =
  enumerateRoomPlans(size);

if (roomCount === 1) {
  const categoryPriority =
    random.shuffled(
      ROOM_SPATIAL_CATEGORY_ORDER,
    );

  for (
    const category
    of categoryPriority
  ) {
    const matchingPlans =
      random.shuffled(
        plans.filter(
          (plan) =>
            classifyRoomSpatialCategory(
              size,
              plan,
            ) === category,
        ),
      );

    for (
      const plan
      of matchingPlans
    ) {
      const environment =
        buildRoomEnvironment(
          [plan],
        );

      if (environment !== null) {
        return environment;
      }
    }
  }

  return null;
}
```

Important: this is a static-placement priority/fallback only. Do not add same-attempt retries after downstream hallway carving fails.

- [ ] **Step 5: Replace uniform two-room planning with unordered spatial-profile priority**

Add exact profile constants plus an internal helper:

```ts
const TWO_ROOM_SPATIAL_PROFILE_ORDER = [
  'corner+corner',
  'corner+edge',
  'corner+interior',
  'edge+edge',
  'edge+interior',
  'interior+interior',
] as const;

function roomSpatialProfileKey(
  size: number,
  rooms: readonly PlannedRoom[],
): string {
  return getRoomSpatialCategories(
    size,
    rooms,
  ).join('+');
}
```

In the two-room branch, first collect all statically usable environments:

```ts
const usable:
  RoomEnvironment[] = [];

for (
  let firstIndex = 0;
  firstIndex < plans.length;
  firstIndex += 1
) {
  for (
    let secondIndex =
      firstIndex + 1;
    secondIndex < plans.length;
    secondIndex += 1
  ) {
    const first =
      plans[firstIndex];

    const second =
      plans[secondIndex];

    if (
      roomsOverlapOrTouch(
        first,
        second,
      )
    ) {
      continue;
    }

    const environment =
      buildRoomEnvironment(
        [first, second],
      );

    if (environment !== null) {
      usable.push(environment);
    }
  }
}
```

Then choose the target from all six approved profiles and use the remaining shuffled profiles as deterministic fallback:

```ts
const profilePriority =
  random.shuffled(
    TWO_ROOM_SPATIAL_PROFILE_ORDER,
  );

for (
  const profileKey
  of profilePriority
) {
  const matching =
    random.shuffled(
      usable.filter(
        (environment) =>
          roomSpatialProfileKey(
            size,
            environment.rooms,
          ) === profileKey,
      ),
    );

  const selected =
    matching[0];

  if (selected !== undefined) {
    return selected;
  }
}

return null;
```

Do not change `roomsOverlapOrTouch()`, `buildRoomEnvironment()`, hallway carving, Chest distance, or dead-end logic.

- [ ] **Step 6: Run GREEN batch**

Run:

```powershell
npm run sanity:generator
```

Expected: all existing Generator v1.1 checks plus `runRoomSpatialV12Checks()` pass.

Run:

```powershell
npm run build
```

Expected: success.

- [ ] **Step 7: Commit Task 1**

```powershell
git add src/puzzle/generator/CandidateGenerator.ts src/dev/generatorSanity.ts
git commit -m "feat: stratify treasure room generation"
npm run context:last
```

---

### Task 2: Add Generator-only Monster density gate and ranking penalty

**Files:**
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `GeneratedCandidate`, `GeneratorBoardSize`, existing factory rejection pipeline.
- Produces:
  - `RejectionReason.MonsterDensity = 'monster-density'`.
  - `getGeneratorMonsterPolicy(candidate: GeneratedCandidate)` shared by factory/ranker/profiler.
  - exact `-4` boundary penalty in `scoreCandidate()`.

- [ ] **Step 1: Add one batched RED group for Monster policy**

Extend imports in `generatorSanity.ts`:

```ts
import {
  createCandidatePool,
  evaluateCandidate,
  getGeneratorMonsterPolicy,
} from '../puzzle/generator/CandidateFactory';
```

Also import `RejectionReason`.

Extend `createRankingFixture()` input:

```ts
archetype?: GeneratorArchetypeType;
```

and change fixture construction from hardcoded MonsterOnly to:

```ts
archetype:
  input.archetype ??
  GeneratorArchetype.MonsterOnly,
```

Add:

```ts
function createMonsterPolicyFixture(
  size: GeneratorBoardSize,
  monsterCount: number,
  archetype:
    GeneratorArchetypeType =
      GeneratorArchetype.MonsterOnly,
): GeneratedCandidate {
  return createRankingFixture({
    seed:
      size * 100 + monsterCount,
    size,
    monsterCount,
    archetype,
  }).candidate;
}

function runMonsterDensityV12Checks(): void {
  const reject6 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        6,
        6,
      ),
    );

  const reject7 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        7,
        8,
        GeneratorArchetype
          .MixedOneRoom,
      ),
    );

  const reject8 =
    getGeneratorMonsterPolicy(
      createMonsterPolicyFixture(
        8,
        9,
        GeneratorArchetype
          .MixedTwoRooms,
      ),
    );

  for (
    const decision
    of [
      reject6,
      reject7,
      reject8,
    ]
  ) {
    assert(
      decision.reject,
      'Monster count above the per-size hard cap must be rejected.',
    );

    assert(
      decision.reason ===
        RejectionReason
          .MonsterDensity,
      'Monster hard-cap rejection must use monster-density.',
    );
  }

  const boundaryCases =
    [
      [6, 5],
      [7, 7],
      [8, 8],
    ] as const;

  for (
    const [size, monsterCount]
    of boundaryCases
  ) {
    const accepted =
      createRankingFixture({
        seed:
          5000 +
          size * 100 +
          monsterCount,
        size,
        monsterCount,
      });

    const baseline =
      createRankingFixture({
        seed:
          6000 +
          size * 100 +
          monsterCount,
        size,
        monsterCount:
          monsterCount - 1,
      });

    const policy =
      getGeneratorMonsterPolicy(
        accepted.candidate,
      );

    assert(
      !policy.reject &&
        policy.rankingPenalty === 4,
      `${size}x${size} boundary Monster count must remain allowed with a 4-point penalty.`,
    );

    assert(
      scoreCandidate(accepted) ===
        scoreCandidate(baseline) - 4,
      `${size}x${size} boundary Monster count must subtract exactly 4 ranking points.`,
    );
  }

  const lowMixed =
    createRankingFixture({
      seed: 7001,
      size: 8,
      monsterCount: 2,
      archetype:
        GeneratorArchetype
          .MixedOneRoom,
    });

  assert(
    getGeneratorMonsterPolicy(
      lowMixed.candidate,
    ).rankingPenalty === 0,
    'Low Monster counts must not receive a penalty.',
  );

  const chestOnly =
    createRankingFixture({
      seed: 7002,
      size: 8,
      monsterCount: 20,
      archetype:
        GeneratorArchetype
          .ChestOneRoom,
    });

  assert(
    !getGeneratorMonsterPolicy(
      chestOnly.candidate,
    ).reject,
    'Chest-only archetypes must be outside Monster-density policy.',
  );

  assert(
    getGeneratorMonsterPolicy(
      chestOnly.candidate,
    ).rankingPenalty === 0,
    'Chest-only archetypes must receive no Monster-density ranking penalty.',
  );
}
```

Call `runMonsterDensityV12Checks();` after `runRoomSpatialV12Checks();`.

- [ ] **Step 2: Run RED once**

```powershell
npm run sanity:generator
```

Expected: failure because `getGeneratorMonsterPolicy` and `RejectionReason.MonsterDensity` do not exist and the ranker does not subtract 4.

- [ ] **Step 3: Add the rejection reason**

In `types.ts`:

```ts
export const RejectionReason = {
  GenerationFailed:
    'generation-failed',
  Duplicate: 'duplicate',
  MonsterDensity:
    'monster-density',
  Invalid: 'invalid',
  NonUnique: 'non-unique',
  HardQuality: 'hard-quality',
  GeometryWarning:
    'geometry-warning',
} as const;
```

Every exhaustive `Record<RejectionReason, number>` initializer must now include MonsterDensity.

- [ ] **Step 4: Implement one shared Monster policy helper in `CandidateFactory.ts`**

Change the generator-types import so `GeneratorArchetype` is imported as a runtime value (not only `type GeneratorArchetype`), and add `type GeneratorBoardSize`.

Add:

```ts
const MONSTER_POLICY:
  Readonly<
    Record<
      GeneratorBoardSize,
      {
        penaltyCount: number;
        hardCap: number;
      }
    >
  > = {
    6: {
      penaltyCount: 5,
      hardCap: 5,
    },
    7: {
      penaltyCount: 7,
      hardCap: 7,
    },
    8: {
      penaltyCount: 8,
      hardCap: 8,
    },
  };

function isMonsterBearingArchetype(
  archetype: GeneratorArchetype,
): boolean {
  return (
    archetype ===
      GeneratorArchetype.MonsterOnly ||
    archetype ===
      GeneratorArchetype.MixedOneRoom ||
    archetype ===
      GeneratorArchetype.MixedTwoRooms
  );
}

export function getGeneratorMonsterPolicy(
  candidate: GeneratedCandidate,
): {
  reject: boolean;
  rankingPenalty: 0 | 4;
  reason:
    | typeof RejectionReason.MonsterDensity
    | null;
  diagnostic: string | null;
} {
  if (
    !isMonsterBearingArchetype(
      candidate.archetype,
    )
  ) {
    return {
      reject: false,
      rankingPenalty: 0,
      reason: null,
      diagnostic: null,
    };
  }

  const rule =
    MONSTER_POLICY[
      candidate.size
    ];

  const count =
    candidate.level.monsters.length;

  if (count > rule.hardCap) {
    return {
      reject: true,
      rankingPenalty: 0,
      reason:
        RejectionReason
          .MonsterDensity,
      diagnostic:
        `${candidate.size}x${candidate.size} candidate has ${count} Monsters; Generator v1.2 hard cap is ${rule.hardCap}.`,
    };
  }

  return {
    reject: false,
    rankingPenalty:
      count === rule.penaltyCount
        ? 4
        : 0,
    reason: null,
    diagnostic: null,
  };
}
```

`hardCap` and `penaltyCount` are intentionally equal: the exact boundary survives with a penalty; only `>` hardCap rejects.

- [ ] **Step 5: Gate Monster overload before `evaluateCandidate()`**

Preserve the existing duplicate check order so this slice does not silently alter dedupe behavior.

Immediately after duplicate handling and before:

```ts
const evaluation =
  evaluateCandidate(
    generation.candidate,
  );
```

add:

```ts
const monsterPolicy =
  getGeneratorMonsterPolicy(
    generation.candidate,
  );

if (monsterPolicy.reject) {
  recordRejection(
    rejectionCounts,
    rejectionSamples,
    attempts,
    candidateSeed,
    RejectionReason
      .MonsterDensity,
    monsterPolicy.diagnostic ??
      'Monster density rejected candidate.',
  );

  continue;
}
```

Update `createEmptyRejectionCounts()`:

```ts
[RejectionReason.MonsterDensity]: 0,
```

Do not put this rule inside `LevelQualityAnalyzer`.

- [ ] **Step 6: Apply exact ranking penalty in `CandidateRanker.ts`**

Import:

```ts
import {
  getGeneratorMonsterPolicy,
} from './CandidateFactory';
```

At the end of existing geometric/object score calculation, before `roundScore(score)`:

```ts
score -=
  getGeneratorMonsterPolicy(
    accepted.candidate,
  ).rankingPenalty;
```

Do not change existing geometric thresholds or the novelty multiplier.

- [ ] **Step 7: Run GREEN batch**

```powershell
npm run sanity:generator
```

Expected: v1.2 Monster policy tests pass and all earlier checks remain green, including the pre-existing `runBasicPropagationQualityChecks()` coverage. `src/puzzle/quality/LevelQualityAnalyzer.ts` must remain unmodified.

```powershell
npm run build
```

Expected: success.

- [ ] **Step 8: Commit Task 2**

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateFactory.ts src/puzzle/generator/CandidateRanker.ts src/dev/generatorSanity.ts
git commit -m "feat: bound generated monster density"
npm run context:last
```

---

### Task 3: Add A+ two-room size coverage to accepted pools

**Files:**
- Modify: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `ALLOWED_SIZES`, `SeededRandom`, actual accepted candidate sizes.
- Produces shared factory helpers used later by the profiler:
  - `isTwoRoomGeneratorArchetype(archetype): boolean`.
  - `isArchetypePoolComplete(archetype, acceptedCount, acceptedSizes, target): boolean`.
  - `chooseArchetypeAttemptSize(archetype, acceptedCount, acceptedSizes, target, random): GeneratorBoardSize`.

- [ ] **Step 1: Add one batched RED group for A+ completion**

Extend CandidateFactory imports in `generatorSanity.ts`:

```ts
import {
  chooseArchetypeAttemptSize,
  createCandidatePool,
  evaluateCandidate,
  getGeneratorMonsterPolicy,
  isArchetypePoolComplete,
} from '../puzzle/generator/CandidateFactory';
```

Add:

```ts
function runTwoRoomCoverageV12Checks(): void {
  const only8 =
    new Set<GeneratorBoardSize>(
      [8],
    );

  const both =
    new Set<GeneratorBoardSize>(
      [7, 8],
    );

  assert(
    !isArchetypePoolComplete(
      GeneratorArchetype
        .ChestTwoRooms,
      10,
      only8,
      10,
    ),
    'Two-room pool at count target must remain incomplete when 7x7 is missing.',
  );

  assert(
    isArchetypePoolComplete(
      GeneratorArchetype
        .ChestTwoRooms,
      11,
      both,
      10,
    ),
    'Two-room pool must complete after missing size is accepted.',
  );

  assert(
    isArchetypePoolComplete(
      GeneratorArchetype
        .MonsterOnly,
      10,
      only8,
      10,
    ),
    'Non-two-room pool must keep count-only completion semantics.',
  );

  const forcedRandom =
    new SeededRandom(123456);

  assert(
    chooseArchetypeAttemptSize(
      GeneratorArchetype
        .ChestTwoRooms,
      10,
      only8,
      10,
      forcedRandom,
    ) === 7,
    'Coverage phase must force the missing 7x7 size.',
  );

  const forcedOther =
    new Set<GeneratorBoardSize>(
      [7],
    );

  assert(
    chooseArchetypeAttemptSize(
      GeneratorArchetype
        .MixedTwoRooms,
      10,
      forcedOther,
      10,
      new SeededRandom(123456),
    ) === 8,
    'Coverage phase must force the missing 8x8 size.',
  );

  const smallConfig:
    GeneratorConfig = {
    masterSeed: 123456,
    acceptedPerArchetype: 1,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 5000,
  };

  const pool =
    createCandidatePool(
      smallConfig,
    );

  assert(
    pool.completed,
    'A+ reduced pool must complete.',
  );

  for (
    const result
    of pool.archetypes
  ) {
    const isTwoRoom =
      result.stats.archetype ===
        GeneratorArchetype
          .ChestTwoRooms ||
      result.stats.archetype ===
        GeneratorArchetype
          .MixedTwoRooms;

    assert(
      result.accepted.length ===
        (isTwoRoom ? 2 : 1),
      `${result.stats.archetype} reduced A+ accepted count is wrong.`,
    );

    if (isTwoRoom) {
      const sizes =
        new Set(
          result.accepted.map(
            (accepted) =>
              accepted.candidate.size,
          ),
        );

      assert(
        sizes.has(7) &&
          sizes.has(8),
        `${result.stats.archetype} A+ reduced pool must contain 7x7 and 8x8.`,
      );
    }
  }

  assert(
    pool.accepted.length === 7,
    'acceptedPerArchetype=1 must yield 7 total accepted candidates under A+ (1+1+2+1+2).',
  );

  const tinyBudget =
    createCandidatePool({
      masterSeed: 123456,
      acceptedPerArchetype: 1,
      shortlistPerArchetype: 1,
      maxAttemptsPerArchetype: 1,
    });

  for (
    const result
    of tinyBudget.archetypes
  ) {
    if (
      result.stats.archetype !==
        GeneratorArchetype
          .ChestTwoRooms &&
      result.stats.archetype !==
        GeneratorArchetype
          .MixedTwoRooms
    ) {
      continue;
    }

    assert(
      result.exhausted,
      `${result.stats.archetype} must be exhausted when the attempt limit prevents A+ size coverage.`,
    );
  }
}
```

Call `runTwoRoomCoverageV12Checks();` after `runMonsterDensityV12Checks();`.

Update the old `runCandidatePoolChecks()` assertions that currently demand exactly five accepted candidates for the same `acceptedPerArchetype: 1` config. Replace them with the intentional A+ counts above rather than keeping contradictory expectations.

- [ ] **Step 2: Run RED once**

```powershell
npm run sanity:generator
```

Expected: failure because count-only stopping still terminates two-room archetypes after the first accepted candidate and the new helpers do not exist.

- [ ] **Step 3: Implement shared two-room completion helper**

`CandidateFactory.ts` already needs the runtime `GeneratorArchetype` import from Task 2; keep it as a value import and keep `GeneratorBoardSize` as a type import.

Add:

```ts
export function isTwoRoomGeneratorArchetype(
  archetype: GeneratorArchetype,
): boolean {
  return (
    archetype ===
      GeneratorArchetype.ChestTwoRooms ||
    archetype ===
      GeneratorArchetype.MixedTwoRooms
  );
}

export function isArchetypePoolComplete(
  archetype: GeneratorArchetype,
  acceptedCount: number,
  acceptedSizes:
    ReadonlySet<GeneratorBoardSize>,
  target: number,
): boolean {
  if (acceptedCount < target) {
    return false;
  }

  if (
    !isTwoRoomGeneratorArchetype(
      archetype,
    )
  ) {
    return true;
  }

  return (
    acceptedSizes.has(7) &&
    acceptedSizes.has(8)
  );
}
```

Add `GeneratorBoardSize` to CandidateFactory type imports.

- [ ] **Step 4: Implement normal-size vs coverage-size selection**

Add:

```ts
export function chooseArchetypeAttemptSize(
  archetype: GeneratorArchetype,
  acceptedCount: number,
  acceptedSizes:
    ReadonlySet<GeneratorBoardSize>,
  target: number,
  random: SeededRandom,
): GeneratorBoardSize {
  const allowed =
    ALLOWED_SIZES[archetype];

  if (
    acceptedCount >= target &&
    isTwoRoomGeneratorArchetype(
      archetype,
    )
  ) {
    if (!acceptedSizes.has(7)) {
      return 7;
    }

    if (!acceptedSizes.has(8)) {
      return 8;
    }
  }

  return random.choose(allowed);
}
```

The helper consumes the candidate-seed-local RNG exactly once in the normal phase and zero times for size choice in coverage phase. That is acceptable because v1.2 determinism is version-local, not required to match v1.1.

- [ ] **Step 5: Change the factory loop stopping condition**

Inside `createArchetypePool()` add:

```ts
const acceptedSizes =
  new Set<GeneratorBoardSize>();
```

Replace the loop condition:

```ts
accepted.length <
  config.acceptedPerArchetype
```

with:

```ts
!isArchetypePoolComplete(
  archetype,
  accepted.length,
  acceptedSizes,
  config.acceptedPerArchetype,
)
```

Replace current size choice with:

```ts
const size =
  chooseArchetypeAttemptSize(
    archetype,
    accepted.length,
    acceptedSizes,
    config.acceptedPerArchetype,
    random,
  );
```

On accepted candidate, after `accepted.push(...)`:

```ts
acceptedSizes.add(
  evaluation.accepted
    .candidate.size,
);
```

Replace exhaustion computation with:

```ts
exhausted:
  !isArchetypePoolComplete(
    archetype,
    accepted.length,
    acceptedSizes,
    config.acceptedPerArchetype,
  ),
```

Do not add an extra attempt budget.

- [ ] **Step 6: Assert the “at most +1” invariant**

In `runTwoRoomCoverageV12Checks()` after each two-room result:

```ts
assert(
  result.accepted.length <=
    smallConfig
      .acceptedPerArchetype + 1,
  `${result.stats.archetype} A+ must add at most one accepted candidate beyond target.`,
);
```

For non-two-room results assert exact target count.

- [ ] **Step 7: Run GREEN batch**

```powershell
npm run sanity:generator
```

Expected: A+ tests pass; old pool checks are updated to the intentional 7-candidate reduced result.

```powershell
npm run build
```

Expected: success.

- [ ] **Step 8: Commit Task 3**

```powershell
git add src/puzzle/generator/CandidateFactory.ts src/dev/generatorSanity.ts
git commit -m "feat: guarantee two-room size coverage"
npm run context:last
```

---

### Task 4: Add room spatial novelty and two-room shortlist size guarantee

**Files:**
- Modify: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes:
  - `classifyRoomSpatialCategory()`;
  - accepted candidates that may contain one/two `PlannedRoom`s;
  - existing `candidateDistance()` and diversity multiplier `* 6`.
- Produces:
  - weighted room spatial distance for room-bearing candidates;
  - order-independent two-room room matching;
  - guaranteed 7×7 + 8×8 representation for two-room shortlist sizes `>= 2`.

- [ ] **Step 1: Extend ranking fixture support in one RED batch**

Change `createRankingFixture()` input to support:

```ts
rooms?: readonly PlannedRoom[];
```

Set:

```ts
rooms:
  input.rooms ?? [],
```

and make `createRankingPool()` derive the stats archetype from the fixture set:

```ts
const archetype =
  accepted[0]?.candidate
    .archetype ??
  GeneratorArchetype.MonsterOnly;

assert(
  accepted.every(
    (candidate) =>
      candidate.candidate
        .archetype === archetype,
  ),
  'Ranking fixture pool must contain one archetype.',
);
```

Use `archetype` in `stats.archetype`.

- [ ] **Step 2: Add RED room-distance assertions**

Add to `runRankingChecks()` or a new `runRankingV12Checks()`:

```ts
const roomA =
  roomFixture(0, 0);

const roomB =
  roomFixture(0, 2);

const roomC =
  roomFixture(2, 2);

const oneRoomSameA =
  createRankingFixture({
    seed: 8101,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestOneRoom,
    rooms: [roomA],
  });

const oneRoomSameB =
  createRankingFixture({
    seed: 8102,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestOneRoom,
    rooms: [roomA],
  });

const oneRoomMoved =
  createRankingFixture({
    seed: 8103,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestOneRoom,
    rooms: [roomC],
  });

assert(
  candidateDistance(
    oneRoomSameA,
    oneRoomSameB,
  ) <
    candidateDistance(
      oneRoomSameA,
      oneRoomMoved,
    ),
  'Moved/category-different Treasure Room must increase candidate distance.',
);

const pairAB =
  createRankingFixture({
    seed: 8201,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [roomA, roomB],
  });

const pairBA =
  createRankingFixture({
    seed: 8202,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [roomB, roomA],
  });

assert(
  candidateDistance(
    pairAB,
    pairBA,
  ) === 0,
  'Swapping two-room metadata order must not create fake candidate distance.',
);
```

For the exact `=== 0` fixture, ensure all other fixture dimensions/metrics/solution masks are identical except seed and room array order. Candidate seed is not a distance component.

- [ ] **Step 3: Add RED two-room shortlist coverage fixture**

Build four accepted candidates in one `ChestTwoRooms` ranking pool:

```ts
const best8 =
  createRankingFixture({
    seed: 8301,
    size: 8,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [
      roomFixture(0, 0),
      roomFixture(5, 5),
    ],
  });

const second8 =
  createRankingFixture({
    seed: 8302,
    size: 8,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [
      roomFixture(0, 2),
      roomFixture(5, 5),
    ],
  });

const seven =
  createRankingFixture({
    seed: 8303,
    size: 7,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [
      roomFixture(0, 0),
      roomFixture(4, 4),
    ],
  });

const thirdChoice =
  createRankingFixture({
    seed: 8304,
    size: 8,
    archetype:
      GeneratorArchetype
        .ChestTwoRooms,
    rooms: [
      roomFixture(2, 0),
      roomFixture(5, 3),
    ],
  });

const twoRoomPool =
  createRankingPool([
    best8,
    second8,
    seven,
    thirdChoice,
  ]);

const twoRoomShortlist =
  selectShortlist(
    twoRoomPool,
    3,
  );

const selectedSizes =
  new Set(
    twoRoomShortlist.map(
      (ranked) =>
        ranked.accepted
          .candidate.size,
    ),
  );

assert(
  selectedSizes.has(7) &&
    selectedSizes.has(8),
  'Two-room shortlist of at least two slots must represent 7x7 and 8x8.',
);

assert(
  twoRoomShortlist.length === 3,
  'Third two-room shortlist slot must remain available after size coverage.',
);
```

Keep the existing “poor quality must not win solely from novelty” assertion unchanged.

- [ ] **Step 4: Run RED once**

```powershell
npm run sanity:generator
```

Expected: room-order/distance and size-coverage assertions fail under the v1.1 ranker.

- [ ] **Step 5: Implement single-room spatial distance in `CandidateRanker.ts`**

Import the runtime `GeneratorArchetype` value plus `type GeneratorBoardSize` and `type PlannedRoom` from `types.ts`, and import:

```ts
import {
  classifyRoomSpatialCategory,
} from './CandidateGenerator';
```

Add:

```ts
function singleRoomSpatialDistance(
  sizeA: number,
  roomA: PlannedRoom,
  sizeB: number,
  roomB: PlannedRoom,
): number {
  const maxA =
    sizeA - 3;

  const maxB =
    sizeB - 3;

  const ax =
    roomA.topLeft.x / maxA;

  const ay =
    roomA.topLeft.y / maxA;

  const bx =
    roomB.topLeft.x / maxB;

  const by =
    roomB.topLeft.y / maxB;

  const positionDistance =
    (
      Math.abs(ax - bx) +
      Math.abs(ay - by)
    ) / 2;

  const categoryDistance =
    classifyRoomSpatialCategory(
      sizeA,
      roomA,
    ) ===
    classifyRoomSpatialCategory(
      sizeB,
      roomB,
    )
      ? 0
      : 1;

  return clamp01(
    positionDistance * 0.75 +
    categoryDistance * 0.25,
  );
}
```

Add `PlannedRoom` to type imports.

- [ ] **Step 6: Implement order-independent candidate room distance**

Add:

```ts
function roomSpatialDistance(
  a: AcceptedCandidate,
  b: AcceptedCandidate,
): number | null {
  const aRooms =
    a.candidate.rooms;

  const bRooms =
    b.candidate.rooms;

  if (
    aRooms.length === 0 ||
    bRooms.length === 0 ||
    aRooms.length !==
      bRooms.length
  ) {
    return null;
  }

  if (
    aRooms.length === 1 &&
    bRooms.length === 1
  ) {
    return singleRoomSpatialDistance(
      a.candidate.size,
      aRooms[0],
      b.candidate.size,
      bRooms[0],
    );
  }

  if (
    aRooms.length === 2 &&
    bRooms.length === 2
  ) {
    const direct =
      (
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[0],
          b.candidate.size,
          bRooms[0],
        ) +
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[1],
          b.candidate.size,
          bRooms[1],
        )
      ) / 2;

    const swapped =
      (
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[0],
          b.candidate.size,
          bRooms[1],
        ) +
        singleRoomSpatialDistance(
          a.candidate.size,
          aRooms[1],
          b.candidate.size,
          bRooms[0],
        )
      ) / 2;

    return Math.min(
      direct,
      swapped,
    );
  }

  return null;
}
```

- [ ] **Step 7: Add room component with weight 2 to `candidateDistance()`**

Keep the seven existing components unchanged.

After calculating their total, do:

```ts
const roomDistance =
  roomSpatialDistance(a, b);

if (roomDistance === null) {
  return clamp01(
    total /
      components.length,
  );
}

return clamp01(
  (
    total +
    roomDistance * 2
  ) /
  (
    components.length + 2
  ),
);
```

This preserves exact Monster-only v1.1 distance behavior.

- [ ] **Step 8: Enforce two-room size representation in `selectShortlist()`**

Add:

```ts
function requiredMissingTwoRoomSize(
  archetype:
    GeneratorArchetype,
  available:
    readonly QualityEntry[],
  selected:
    readonly RankedCandidate[],
  perArchetype: number,
): GeneratorBoardSize | null {
  if (
    perArchetype < 2 ||
    (
      archetype !==
        GeneratorArchetype
          .ChestTwoRooms &&
      archetype !==
        GeneratorArchetype
          .MixedTwoRooms
    )
  ) {
    return null;
  }

  const poolSizes =
    new Set(
      available
        .map(
          (entry) =>
            entry.accepted
              .candidate.size,
        )
        .concat(
          selected.map(
            (entry) =>
              entry.accepted
                .candidate.size,
          ),
        ),
    );

  if (
    !poolSizes.has(7) ||
    !poolSizes.has(8)
  ) {
    return null;
  }

  const selectedSizes =
    new Set(
      selected.map(
        (entry) =>
          entry.accepted
            .candidate.size,
      ),
    );

  if (!selectedSizes.has(7)) {
    return 7;
  }

  if (!selectedSizes.has(8)) {
    return 8;
  }

  return null;
}
```

In each archetype loop, take:

```ts
const archetype =
  archetypeResult
    .stats.archetype;
```

Before evaluating later-slot candidates, compute:

```ts
const requiredSize =
  requiredMissingTwoRoomSize(
    archetype,
    available,
    selected,
    perArchetype,
  );

const eligible =
  requiredSize === null
    ? available
    : available.filter(
        (entry) =>
          entry.accepted
            .candidate.size ===
          requiredSize,
      );
```

Select the best from `eligible` using the existing `rankForSelection()` + `compareSelection()` logic, then remove the matching object from the original `available` array by identity/index.

Do not change:
- first slot = pure quality;
- `selectionScore = qualityScore + diversityScore * 6`;
- deterministic quality/seed tie-breaks.

- [ ] **Step 9: Run GREEN batch**

```powershell
npm run sanity:generator
```

Expected:
- room spatial novelty assertions pass;
- swapped two-room room order adds no fake distance;
- two-room shortlist contains both 7 and 8;
- existing poor-quality-vs-novelty test remains green.

```powershell
npm run build
```

Expected: success.

- [ ] **Step 10: Commit Task 4**

```powershell
git add src/puzzle/generator/CandidateRanker.ts src/dev/generatorSanity.ts
git commit -m "feat: diversify generator shortlists"
npm run context:last
```

---

### Task 5: Mirror v1.2 in profiler/reporting, verify seed 123456, and document final state

**Files:**
- Modify: `src/dev/profileGenerator.ts`
- Modify: `src/dev/profilerSanity.ts`
- Modify: `src/dev/generateCandidates.ts`
- Modify: `src/dev/generatorSanity.ts`
- Modify: `CURRENT_STATE.md`
- Modify: `TREE.txt`

**Interfaces:**
- Consumes:
  - `getGeneratorMonsterPolicy()`;
  - `isArchetypePoolComplete()`;
  - `chooseArchetypeAttemptSize()`;
  - `classifyRoomSpatialCategory()` / `getRoomSpatialCategories()`;
  - default generator config.
- Produces:
  - profiler attempt status `monster-density`;
  - profiler A+ completion parity;
  - v1.2 human-readable output;
  - final verified project documentation.

- [ ] **Step 1: Add one batched RED group for profiler parity**

In `profileGenerator.ts`, the eventual `GeneratorAttemptProfileStatus` must include:

```ts
| typeof RejectionReason.MonsterDensity
```

In `profilerSanity.ts`, add checks that profile runs are still deterministic except timings and that a Monster-density attempt, when present, has no Solver work.

Use a deterministic bounded search over master seeds rather than hardcoding an unverified future attempt seed:

```ts
function findMonsterDensityProfile():
  GeneratorRunProfile {
  for (
    let seed = 1;
    seed <= 200;
    seed += 1
  ) {
    const profile =
      profileGeneratorRun({
        masterSeed: seed,
        acceptedPerArchetype: 1,
        shortlistPerArchetype: 1,
        maxAttemptsPerArchetype: 300,
      });

    if (
      profile.attempts.some(
        (attempt) =>
          attempt.status ===
            RejectionReason
              .MonsterDensity,
      )
    ) {
      return profile;
    }
  }

  throw new Error(
    'Expected a deterministic profile with at least one monster-density rejection within seed bound.',
  );
}
```

Then assert:

```ts
const densityProfile =
  findMonsterDensityProfile();

for (
  const attempt
  of densityProfile.attempts
) {
  if (
    attempt.status !==
      RejectionReason
        .MonsterDensity
  ) {
    continue;
  }

  assert(
    attempt.solverDiagnostics ===
      null,
    'Monster-density rejection must happen before Solver diagnostics exist.',
  );

  assert(
    attempt.timings.solverMs === 0,
    'Monster-density rejection must spend zero recorded Solver time.',
  );
}
```

Add a reduced A+ profiler check:

```ts
const coverageProfile =
  profileGeneratorRun({
    masterSeed: 123456,
    acceptedPerArchetype: 1,
    shortlistPerArchetype: 1,
    maxAttemptsPerArchetype: 5000,
  });

for (
  const archetype
  of [
    GeneratorArchetype
      .ChestTwoRooms,
    GeneratorArchetype
      .MixedTwoRooms,
  ]
) {
  const acceptedAttempts =
    coverageProfile.attempts
      .filter(
        (attempt) =>
          attempt.archetype ===
            archetype &&
          attempt.status ===
            CandidateStatus.Accepted,
      );

  assert(
    new Set(
      acceptedAttempts.map(
        (attempt) =>
          attempt.size,
      ),
    ).size === 2,
    `${archetype} profiler must mirror A+ 7x7/8x8 coverage.`,
  );
}
```

- [ ] **Step 2: Run profiler RED once**

```powershell
npx tsx src/dev/profilerSanity.ts
```

Expected: failure because profiler still has v1.1 count-only stopping/size selection and no Monster-density gate.

- [ ] **Step 3: Mirror Monster policy and A+ helpers in `profileGenerator.ts`**

Extend `GeneratorAttemptProfileStatus` with:

```ts
| typeof RejectionReason.MonsterDensity
```

Import from `CandidateFactory`:

```ts
import {
  chooseArchetypeAttemptSize,
  getGeneratorMonsterPolicy,
  isArchetypePoolComplete,
} from '../puzzle/generator/CandidateFactory';
```

Per archetype, replace scalar-only state with:

```ts
const acceptedSizes =
  new Set<GeneratorBoardSize>();
```

Change the loop condition to the same `isArchetypePoolComplete(...)` call used by CandidateFactory.

Change size choice to the same `chooseArchetypeAttemptSize(...)` helper.

Preserve duplicate detection order, then before `profileGeneratedCandidate(...)` add:

```ts
const monsterPolicy =
  getGeneratorMonsterPolicy(
    generation.candidate,
  );

if (monsterPolicy.reject) {
  attempts.push({
    archetype,
    attempt,
    candidateSeed,
    size,
    candidateId:
      generation.candidate.id,
    status:
      RejectionReason
        .MonsterDensity,
    diagnostic:
      monsterPolicy.diagnostic,
    solverDiagnostics: null,
    timings: {
      generationMs,
      validationMs: 0,
      solverMs: 0,
      qualityMs: 0,
      totalMs:
        performance.now() -
        attemptStart,
    },
  });

  continue;
}
```

When accepted:

```ts
accepted += 1;
acceptedSizes.add(size);
```

After the per-archetype loop, compute:

```ts
const archetypeCompleted =
  isArchetypePoolComplete(
    archetype,
    accepted,
    acceptedSizes,
    config.acceptedPerArchetype,
  );

if (!archetypeCompleted) {
  completed = false;
}
```

Initialize `let completed = true;` before the archetype loop and return that local boolean as `GeneratorRunProfile.completed` instead of recomputing completion from accepted count alone.

Do not change `GeneratorArchetypeProfile` shape solely for this; its existing `{ archetype, attempts, accepted }` fields remain sufficient.

Do not refactor the old per-archetype duplicate signature set in this task.

- [ ] **Step 4: Update generator CLI/reports to v1.2**

In `generateCandidates.ts`:

1. Change Markdown header:

```ts
'# Dungeon Logic Generator v1.2'
```

2. Add room review lines in `appendCandidate()`:

```ts
const roomTopLefts =
  candidate.rooms.length === 0
    ? 'none'
    : candidate.rooms
        .map(
          (room) =>
            `(${room.topLeft.x},${room.topLeft.y})`,
        )
        .join(', ');

const roomProfile =
  candidate.rooms.length === 0
    ? 'none'
    : getRoomSpatialCategories(
        candidate.size,
        candidate.rooms,
      ).join(' + ');
```

and output:

```ts
`- room top-lefts: ${roomTopLefts}`,
`- room spatial profile: ${roomProfile}`,
```

3. Import `getRoomSpatialCategories()` from `CandidateGenerator`.

4. Add CLI stats field:

```ts
`monster-density=${stats.rejectionCounts[RejectionReason.MonsterDensity]}`,
```

5. If there is a user-visible CLI title string such as `Dungeon Logic Generator v1`/`v1.1`, change it to `Dungeon Logic Generator v1.2`.

Keep `schemaVersion: 1` unless a pre-existing schema test proves a version bump is required; this feature changes values/enum members, not the report object shape.

- [ ] **Step 5: Extend generator output-format sanity**

In `runOutputFormatChecks()` add assertions that generated Markdown contains:

```ts
'# Dungeon Logic Generator v1.2'
'room top-lefts:'
'room spatial profile:'
```

Add an assertion that every `rejectionCounts` object has numeric:

```ts
RejectionReason.MonsterDensity
```

Do not assert a positive count for every seed/archetype; zero is valid.

- [ ] **Step 6: Run focused GREEN commands**

```powershell
npm run sanity:generator
```

Expected: all v1.2 generator behavior/output checks pass.

```powershell
npx tsx src/dev/profilerSanity.ts
```

Expected: all profiler sanity checks pass, including Monster-density zero-Solver and A+ coverage.

```powershell
npm run build
```

Expected: success.

Do not continue to documentation if any of the three commands is red.

- [ ] **Step 7: Run the full default generator for acceptance criteria**

Run:

```powershell
npm run generate:candidates -- --seed 123456
```

Expected:
- all five archetypes complete within 5000 attempts;
- no Monster-bearing accepted candidate exceeds its hard cap;
- both two-room accepted pools contain 7 and 8;
- both two-room shortlists contain 7 and 8.

Run the same command a second time:

```powershell
npm run generate:candidates -- --seed 123456
```

Compare the generated JSON and Markdown content. Because the same file paths are overwritten, use Git/PowerShell or a temporary copy before the second run if needed; compare content, not filesystem timestamps.

Expected: byte-equivalent generated content for the same v1.2 master seed.

- [ ] **Step 8: Check the specific chest-one-room regression**

Inspect `.generated/candidates-123456.json` programmatically or manually.

Required:

```text
chest-one-room accepted pool:
  at least 3 distinct room topLeft positions

chest-one-room shortlist:
  at least 2 distinct room topLeft positions
```

Also confirm no 8×8 accepted Monster-bearing candidate has 9 or 10 Monsters.

If any of these content acceptance criteria fail, do not tune Solver or Validator. Return to the v1.2 generation/ranking policy in Tasks 1–4.

- [ ] **Step 9: Run the full generator profile once**

```powershell
npm run profile:generator -- --seed 123456
```

Expected: completes in a practical developer time after the already-landed Treasure Room solver pruning.

There is no hard wall-clock threshold. This run exists to detect a catastrophic v1.2 regression, not to trigger new solver optimization.

- [ ] **Step 10: Update `CURRENT_STATE.md` only from verified facts**

Add/update the Generator section with these exact facts only if Step 6–9 verified them:

```text
Generator v1.2 content-quality pass implemented:
- Treasure Room generation is spatially stratified across corner / edge / interior placements with deterministic fallback.
- Treasure Rooms may touch board edges/corners when their intended external entrance remains in bounds.
- Generator-only Monster density policy applies to monster-only, mixed-one-room, mixed-two-rooms:
  - 6x6: 5 penalized, >5 rejected
  - 7x7: 7 penalized, >7 rejected
  - 8x8: 8 penalized, >8 rejected
- Boundary Monster count costs 4 ranking points; authored LevelQualityAnalyzer rules are unchanged.
- Two-room archetypes use A+ accepted-pool coverage: completed pools contain 7x7 and 8x8; coverage may add at most one accepted candidate over target.
- Two-room shortlists with at least two slots contain both 7x7 and 8x8.
- Candidate novelty includes weighted Treasure Room spatial distance with order-independent two-room matching.
- Profiler mirrors Monster-density and A+ stopping semantics.
- Generator remains deterministic and dev-only; generated levels are not registered automatically.
```

Record the actual seed-123456 result only if verified, including whether A+ produced 10 or 11 accepted candidates for either two-room archetype.

Keep the global dedupe-scope mismatch listed as separate/unfixed.

- [ ] **Step 11: Update `TREE.txt`**

Add the now-committed docs paths if missing:

```text
docs/superpowers/plans/2026-09-03-generator-v1-2-content-quality.md
docs/superpowers/specs/2026-09-03-generator-v1-2-content-quality-design.md
```

Do not add `.generated/`.

- [ ] **Step 12: Final fresh verification after docs edit**

```powershell
npm run sanity:generator
```

Expected: success.

```powershell
npx tsx src/dev/profilerSanity.ts
```

Expected: success.

```powershell
npm run build
```

Expected: success.

```powershell
git status --short
```

Expected:
- only intended tracked Task 5 files plus docs are modified;
- `.generated/` is absent because it remains ignored.

- [ ] **Step 13: Commit Task 5**

```powershell
git add src/dev/profileGenerator.ts src/dev/profilerSanity.ts src/dev/generateCandidates.ts src/dev/generatorSanity.ts CURRENT_STATE.md TREE.txt
git commit -m "feat: finish generator v1.2 content quality"
npm run context:last
```

---

# Final Verification Checklist

Before calling Generator v1.2 complete:

- [ ] `npm run sanity:generator` passes from a fresh run.
- [ ] `npx tsx src/dev/profilerSanity.ts` passes from a fresh run.
- [ ] `npm run build` passes from a fresh run.
- [ ] Same v1.2 master seed reproduces identical generator content.
- [ ] All accepted candidates still pass `LevelValidator`.
- [ ] All accepted candidates still have `solutionCount === 1`.
- [ ] Existing hard quality and generator-warning policy remain green.
- [ ] Generated Monster positions still equal hallway dead ends exactly.
- [ ] 6×6 / 7×7 / 8×8 Monster hard caps are enforced only in generator acceptance.
- [ ] 5 / 7 / 8 boundary Monster counts receive exactly `-4` ranking points.
- [ ] Two-room completed pools contain both 7×7 and 8×8.
- [ ] Two-room shortlist of 3 contains both sizes.
- [ ] `chest-one-room` seed-123456 accepted pool has at least 3 distinct room top-lefts.
- [ ] `chest-one-room` seed-123456 shortlist has at least 2 distinct room top-lefts.
- [ ] No 8×8 accepted Monster-bearing candidate has 9–10 Monsters.
- [ ] Profiler Monster-density rejections have `solverDiagnostics === null` and `solverMs === 0`.
- [ ] No Solver/Validator/LevelQualityAnalyzer rule was changed.
- [ ] No Blocker/Door generation was added.
- [ ] Global dedupe-scope mismatch remains untouched.
- [ ] `.generated/` remains ignored and unstaged.
