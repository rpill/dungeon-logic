# Dungeon Logic — Generator v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic dev-only solution-first candidate generator that produces 50 accepted Monster/Chest puzzle candidates across five archetypes, filters them through the existing validator/solver/quality layers, and writes a 15-level human-review shortlist without registering generated levels in the game.

**Architecture:** `CandidateGenerator` constructs complete WALL/OPEN dungeon solutions from seeded OPEN-space growth, then derives clues and fixed-object metadata. `CandidateFactory` is the acceptance pipeline and batch coordinator, while `CandidateRanker` scores only accepted candidates and performs diversity-aware top-3 selection per archetype. Existing `LevelValidator`, `solveLevel()`, and `analyzeLevelQuality()` remain authoritative; generator code never changes runtime victory rules and never depends on Phaser.

**Tech Stack:** TypeScript, Vite, existing Dungeon Logic puzzle core, Node.js dev CLI via `tsx`. No Phaser dependency inside `src/puzzle/generator/`.

**Spec:** `docs/superpowers/specs/2026-09-02-generator-v1-design.md`

## Global Constraints

- Generator v1 is dev-only and must not alter runtime puzzle rules.
- Generator v1 supports only Monster and Chest fixed gameplay objects.
- Every generated level has `blockers: []` and `doors: []`.
- Supported board sizes are exactly 6×6, 7×7, and 8×8.
- Archetypes are exactly: Monster-only; one Treasure Room Chest-only; two Treasure Rooms Chest-only; Monsters + one Treasure Room; Monsters + two Treasure Rooms.
- Two-Treasure-Room archetypes support only 7×7 and 8×8.
- Generation is solution-first; clues are derived from the generated solution.
- `LevelValidator` is the canonical validity authority.
- `solveLevel(level)` is the uniqueness authority and must return `solutionCount === 1` for every accepted candidate.
- `LevelQualityAnalyzer` is the authored-quality authority.
- A candidate with hard quality issues is rejected.
- A candidate with any current geometry warning is rejected from the automatic accepted pool.
- Normal successful pool size is 10 accepted candidates per archetype, 50 total.
- Normal shortlist size is 3 per archetype, 15 total.
- Randomness is seeded and deterministic; no `Math.random()` is allowed inside Generator v1.
- Same master seed must reproduce attempt order, candidate seeds, layouts, rejection counters, accepted pool, ranking, and shortlist.
- Generated files live only under `.generated/`.
- Generator must never create or modify `src/data/levels/levelNNN.ts`.
- No blockers, doors, keys, switches, lava/water mechanics, difficulty scoring, hints, campaign generation, ORYX work, or Yandex SDK work in this plan.
- Chest placement follows the existing authored guideline: at least two orthogonal steps from the internal room cell of the sole Treasure Room entrance.
- No hard wall-clock performance assertions.
- No TypeScript enums and no constructor parameter properties; `erasableSyntaxOnly` remains compatible.
- Run `npm run build` at every implementation checkpoint.
- Run `npm run sanity:generator` after every generator behavior change once that command exists.
- Keep existing validator / solver / level-quality sanity green.
- Commit every independently testable task.
- After every commit run `npm run context:last`.
- Git commands must be PowerShell/cmd-safe, one command per line, never chained with `&&`, and never use Unix backslash continuations.

---

## File Structure

### Create

- `src/puzzle/generator/types.ts` — generator archetypes, configuration, candidate/result/report contracts.
- `src/puzzle/generator/SeededRandom.ts` — deterministic uint32 RNG, seed hashing/derivation, deterministic choice/shuffle.
- `src/puzzle/generator/CandidateGenerator.ts` — solution-first room planning, hallway carving, dead-end detection, Monster/Chest placement, clue derivation.
- `src/puzzle/generator/CandidateFactory.ts` — single-candidate evaluation, reject reasons, per-archetype batch collection, attempt limits, statistics.
- `src/puzzle/generator/CandidateRanker.ts` — bounded quality score, candidate distance, diversity-aware top-3 selection.
- `src/dev/generatorSanity.ts` — standalone deterministic Generator v1 regression suite.
- `src/dev/generateCandidates.ts` — Node dev CLI and `.generated/` writers.
- `docs/superpowers/plans/2026-09-02-generator-v1.md` — this implementation plan.

### Modify

- `package.json` — add `tsx`, Node typings, `sanity:generator`, and `generate:candidates`.
- `package-lock.json` — lock dev-tool dependencies.
- `.gitignore` — ignore `.generated/`.
- `CURRENT_STATE.md` — document Generator v1 only after implementation is verified.
- `TREE.txt` — add generator source files, sanity/CLI files, spec, and plan.

### Intentionally unchanged

- `src/puzzle/LevelValidator.ts` — no rule changes.
- `src/puzzle/PuzzleState.ts` — no runtime state changes unless a concrete generator counterexample proves a core bug.
- `src/puzzle/solver/PuzzleSolver.ts` — no generator-specific behavior.
- `src/puzzle/quality/LevelQualityAnalyzer.ts` — no threshold tuning as part of generator implementation.
- `src/scenes/BootScene.ts` — full generator sanity must not run on every Phaser startup.
- `src/scenes/GameScene.ts` — no generated-level registration.
- `src/data/levels/index.ts` — generated candidates are not campaign/dev registered levels.
- `src/data/levels/level001.ts` … `level012.ts` — existing authored levels remain unchanged.

---

## Shared Interfaces Locked by This Plan

`src/puzzle/types.ts` already provides `LevelDefinition` with:

```ts
export interface LevelDefinition {
  id: string;
  width: number;
  height: number;
  rowClues: readonly number[];
  columnClues: readonly number[];
  monsters: readonly GridPosition[];
  chests: readonly GridPosition[];
  blockers: readonly GridPosition[];
  doors: readonly DoorDefinition[];
  solution: readonly string[];
}
```

Existing solver API:

```ts
export function solveLevel(
  level: LevelDefinition,
): SolveResult;
```

Existing quality API:

```ts
export function analyzeLevelQuality(
  level: LevelDefinition,
): LevelQualityReport;
```

Existing validator path for a complete solution remains:

```ts
const puzzle = new PuzzleState(level);

// Apply every '#' in level.solution as CellState.Wall.

const result = validatePuzzle(puzzle);
```

Generator v1 types introduced in Task 1:

```ts
export const GeneratorArchetype = {
  MonsterOnly: 'monster-only',
  ChestOneRoom: 'chest-one-room',
  ChestTwoRooms: 'chest-two-rooms',
  MixedOneRoom: 'mixed-one-room',
  MixedTwoRooms: 'mixed-two-rooms',
} as const;

export type GeneratorArchetype =
  typeof GeneratorArchetype[
    keyof typeof GeneratorArchetype
  ];

export type GeneratorBoardSize =
  | 6
  | 7
  | 8;

export interface GeneratorConfig {
  masterSeed: number;
  acceptedPerArchetype: number;
  shortlistPerArchetype: number;
  maxAttemptsPerArchetype: number;
}

export interface PlannedRoom {
  topLeft: GridPosition;
  internalEntrance: GridPosition;
  externalEntrance: GridPosition;
}

export interface GeneratedCandidate {
  id: string;
  seed: number;
  archetype: GeneratorArchetype;
  size: GeneratorBoardSize;
  rooms: readonly PlannedRoom[];
  level: LevelDefinition;
}

export type CandidateGenerationResult =
  | {
      ok: true;
      candidate: GeneratedCandidate;
    }
  | {
      ok: false;
      reason: string;
    };
```

Default full-run configuration introduced in Task 5:

```ts
export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  masterSeed: 123456,
  acceptedPerArchetype: 10,
  shortlistPerArchetype: 3,
  maxAttemptsPerArchetype: 5000,
};
```

---

# Task 1: Add generator dev runner, contracts, and deterministic RNG

**Files:**
- Create: `src/puzzle/generator/types.ts`
- Create: `src/puzzle/generator/SeededRandom.ts`
- Create: `src/dev/generatorSanity.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: existing `GridPosition`, `LevelDefinition`.
- Produces: `GeneratorArchetype`, `GeneratorBoardSize`, `GeneratorConfig`, `PlannedRoom`, `GeneratedCandidate`, `CandidateGenerationResult`.
- Produces: `SeededRandom`.
- Produces: `deriveCandidateSeed(masterSeed, archetype, attempt): number`.
- Produces: `npm run sanity:generator`.

- [ ] **Step 1: Add the Node TypeScript dev runner dependencies**

Run:

```powershell
npm install --save-dev tsx @types/node
```

Do not add any runtime dependency.

- [ ] **Step 2: Add the generator sanity script before RNG implementation**

Add to `package.json` scripts:

```json
"sanity:generator": "tsx src/dev/generatorSanity.ts"
```

Create `src/dev/generatorSanity.ts` with the first RED checks:

```ts
import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

function sequence(seed: number): readonly number[] {
  const random = new SeededRandom(seed);

  return [
    random.nextUint32(),
    random.nextUint32(),
    random.nextUint32(),
    random.nextUint32(),
  ];
}

const first = sequence(123456);
const second = sequence(123456);
const different = sequence(123457);

assert(
  JSON.stringify(first) ===
    JSON.stringify(second),
  'Same RNG seed must reproduce the same sequence.',
);

assert(
  JSON.stringify(first) !==
    JSON.stringify(different),
  'Different RNG seeds must change the sequence.',
);

assert(
  deriveCandidateSeed(
    123456,
    'monster-only',
    7,
  ) ===
    deriveCandidateSeed(
      123456,
      'monster-only',
      7,
    ),
  'Candidate seed derivation must be deterministic.',
);

assert(
  deriveCandidateSeed(
    123456,
    'monster-only',
    7,
  ) !==
    deriveCandidateSeed(
      123456,
      'monster-only',
      8,
    ),
  'Attempt number must affect candidate seed.',
);

console.info(
  '[Dungeon Logic] Generator sanity: RNG checks passed',
);
```

- [ ] **Step 3: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because `../puzzle/generator/SeededRandom` does not exist.

- [ ] **Step 4: Add generator contracts**

Create `src/puzzle/generator/types.ts` using the locked interfaces above.

Also add:

```ts
export const ALL_GENERATOR_ARCHETYPES:
  readonly GeneratorArchetype[] = [
    GeneratorArchetype.MonsterOnly,
    GeneratorArchetype.ChestOneRoom,
    GeneratorArchetype.ChestTwoRooms,
    GeneratorArchetype.MixedOneRoom,
    GeneratorArchetype.MixedTwoRooms,
  ];

export const ALLOWED_SIZES:
  Readonly<
    Record<
      GeneratorArchetype,
      readonly GeneratorBoardSize[]
    >
  > = {
    'monster-only': [6, 7, 8],
    'chest-one-room': [6, 7, 8],
    'chest-two-rooms': [7, 8],
    'mixed-one-room': [6, 7, 8],
    'mixed-two-rooms': [7, 8],
  };
```

- [ ] **Step 5: Implement deterministic RNG**

Create `src/puzzle/generator/SeededRandom.ts`.

Use xorshift32 with explicit uint32 normalization:

```ts
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state =
      normalizeSeed(seed);
  }

  nextUint32(): number {
    let value =
      this.state >>> 0;

    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    this.state =
      value >>> 0;

    return this.state;
  }

  nextFloat(): number {
    return (
      this.nextUint32() /
      0x1_0000_0000
    );
  }

  int(
    minInclusive: number,
    maxExclusive: number,
  ): number {
    if (
      !Number.isInteger(minInclusive) ||
      !Number.isInteger(maxExclusive) ||
      maxExclusive <= minInclusive
    ) {
      throw new RangeError(
        'Invalid integer RNG range.',
      );
    }

    return (
      minInclusive +
      Math.floor(
        this.nextFloat() *
          (
            maxExclusive -
            minInclusive
          ),
      )
    );
  }

  choose<T>(
    items: readonly T[],
  ): T {
    if (items.length === 0) {
      throw new RangeError(
        'Cannot choose from an empty array.',
      );
    }

    return items[
      this.int(0, items.length)
    ];
  }

  shuffled<T>(
    items: readonly T[],
  ): T[] {
    const result = [...items];

    for (
      let index =
        result.length - 1;
      index > 0;
      index -= 1
    ) {
      const other =
        this.int(
          0,
          index + 1,
        );

      [
        result[index],
        result[other],
      ] = [
        result[other],
        result[index],
      ];
    }

    return result;
  }
}

function normalizeSeed(
  seed: number,
): number {
  if (!Number.isInteger(seed)) {
    throw new TypeError(
      'Seed must be an integer.',
    );
  }

  const normalized =
    seed >>> 0;

  return normalized === 0
    ? 0x6d2b79f5
    : normalized;
}
```

Add deterministic text hashing and candidate-seed derivation:

```ts
export function deriveCandidateSeed(
  masterSeed: number,
  archetype: string,
  attempt: number,
): number {
  if (
    !Number.isInteger(attempt) ||
    attempt < 0
  ) {
    throw new RangeError(
      'Attempt must be a non-negative integer.',
    );
  }

  return hashSeedText(
    `${masterSeed >>> 0}:${archetype}:${attempt}`,
  );
}

export function hashSeedText(
  text: string,
): number {
  let hash = 0x811c9dc5;

  for (const character of text) {
    hash ^=
      character.charCodeAt(0);

    hash =
      Math.imul(
        hash,
        0x01000193,
      ) >>> 0;
  }

  return hash === 0
    ? 0x6d2b79f5
    : hash;
}
```

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: RNG checks pass.

Run:

```powershell
npm run build
```

Expected: TypeScript/Vite build succeeds.

- [ ] **Step 7: Commit Task 1**

Run:

```powershell
git add package.json package-lock.json src/puzzle/generator/types.ts src/puzzle/generator/SeededRandom.ts src/dev/generatorSanity.ts
git commit -m "feat: add seeded generator foundation"
npm run context:last
```

---

# Task 2: Generate deterministic Monster-only solution-first candidates

**Files:**
- Create: `src/puzzle/generator/CandidateGenerator.ts`
- Modify: `src/dev/generatorSanity.ts`
- Modify: `src/puzzle/generator/types.ts`

**Interfaces:**
- Consumes: `SeededRandom`.
- Consumes: `GeneratorArchetype.MonsterOnly`.
- Produces: `generateCandidate(input): CandidateGenerationResult`.
- Produces: `deriveClues(solution): { rowClues; columnClues }`.
- Produces: `getHallwayDeadEnds(solution, rooms): readonly GridPosition[]`.
- Produces: complete Monster-only `LevelDefinition` with `blockers: []`, `doors: []`.

Use:

```ts
export interface GenerateCandidateInput {
  archetype: GeneratorArchetype;
  size: GeneratorBoardSize;
  seed: number;
}

export function generateCandidate(
  input: GenerateCandidateInput,
): CandidateGenerationResult;
```

- [ ] **Step 1: Add RED Monster-only checks**

Extend `src/dev/generatorSanity.ts`:

```ts
import {
  GeneratorArchetype,
} from '../puzzle/generator/types';

import {
  deriveClues,
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';
```

Add a helper that scans a deterministic seed range:

```ts
function findGeneratedMonsterOnly():
  Extract<
    ReturnType<
      typeof generateCandidate
    >,
    { ok: true }
  > {
  for (
    let seed = 1;
    seed <= 500;
    seed += 1
  ) {
    const result =
      generateCandidate({
        archetype:
          GeneratorArchetype.MonsterOnly,
        size: 7,
        seed,
      });

    if (result.ok) {
      return result;
    }
  }

  throw new Error(
    'Expected a Monster-only candidate within deterministic seed range.',
  );
}
```

Then assert:

```ts
const generated =
  findGeneratedMonsterOnly();

const repeated =
  generateCandidate({
    archetype:
      GeneratorArchetype.MonsterOnly,
    size:
      generated.candidate.size,
    seed:
      generated.candidate.seed,
  });

assert(
  repeated.ok,
  'Previously successful candidate seed must reproduce.',
);

if (repeated.ok) {
  assert(
    JSON.stringify(
      repeated.candidate.level,
    ) ===
      JSON.stringify(
        generated.candidate.level,
      ),
    'Candidate generation must be deterministic.',
  );
}

assert(
  generated.candidate.level.chests.length === 0,
  'Monster-only candidate must have no Chest.',
);

assert(
  generated.candidate.level.monsters.length > 0,
  'Monster-only candidate must contain at least one Monster.',
);

const clues =
  deriveClues(
    generated.candidate.level.solution,
  );

assert(
  JSON.stringify(clues.rowClues) ===
    JSON.stringify(
      generated.candidate.level.rowClues,
    ),
  'Generated row clues must come from solution.',
);

assert(
  JSON.stringify(clues.columnClues) ===
    JSON.stringify(
      generated.candidate.level.columnClues,
    ),
  'Generated column clues must come from solution.',
);
```

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because `CandidateGenerator.ts` and its exports do not exist.

- [ ] **Step 3: Implement clue derivation first**

In `CandidateGenerator.ts`:

```ts
export function deriveClues(
  solution: readonly string[],
): {
  rowClues: readonly number[];
  columnClues: readonly number[];
} {
  if (solution.length === 0) {
    throw new Error(
      'Solution must contain at least one row.',
    );
  }

  const width =
    solution[0].length;

  if (width === 0) {
    throw new Error(
      'Solution rows must not be empty.',
    );
  }

  const rowClues =
    solution.map(
      (row) =>
        countWalls(row),
    );

  const columnClues =
    Array.from(
      { length: width },
      (_, x) => {
        let count = 0;

        for (
          let y = 0;
          y < solution.length;
          y += 1
        ) {
          if (
            solution[y][x] ===
            '#'
          ) {
            count += 1;
          }
        }

        return count;
      },
    );

  return {
    rowClues,
    columnClues,
  };
}
```

`countWalls()` must reject symbols other than `#` and `.` and every row must have equal width.

- [ ] **Step 4: Implement OPEN-grid primitives**

Use an internal `boolean[][]` where `true` means OPEN.

Add internal helpers:

```ts
interface MutablePosition {
  x: number;
  y: number;
}

const ORTHOGONAL_DIRECTIONS:
  readonly GridPosition[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
```

Implement:

```ts
function createOpenGrid(
  size: number,
): boolean[][];

function isInside(
  size: number,
  x: number,
  y: number,
): boolean;

function canOpenWithoutTwoByTwo(
  grid: readonly boolean[][],
  x: number,
  y: number,
  roomCellKeys: ReadonlySet<string>,
): boolean;

function serializeSolution(
  grid: readonly boolean[][],
): readonly string[];
```

`canOpenWithoutTwoByTwo()` temporarily treats `(x, y)` as OPEN and rejects any 2×2 block containing that cell when all four cells are OPEN and the block is not fully contained in a planned Treasure Room. Task 2 has no rooms, so every OPEN 2×2 is rejected.

- [ ] **Step 5: Implement Monster-only hallway growth**

For Monster-only:

1. create an all-CLOSED grid;
2. pick a deterministic random start cell;
3. open it;
4. grow from a frontier of OPEN cells;
5. candidate target OPEN count is:

```ts
const totalCells =
  size * size;

const targetOpenRatio =
  0.46 +
  random.nextFloat() * 0.14;

const targetOpenCount =
  Math.round(
    totalCells *
      targetOpenRatio,
  );
```

6. each growth step shuffles orthogonal directions;
7. prefer continuing the previous direction with a small deterministic bias;
8. add only in-bounds CLOSED cells passing `canOpenWithoutTwoByTwo()`;
9. stop when target is reached or no legal frontier remains.

Keep the implementation deterministic by storing frontier entries with an optional previous direction; never iterate through unordered object keys as random input.

- [ ] **Step 6: Detect hallway dead ends and place Monsters**

Export:

```ts
export function getHallwayDeadEnds(
  solution: readonly string[],
  rooms: readonly PlannedRoom[],
): readonly GridPosition[];
```

For Task 2 `rooms` is empty.

A hallway OPEN cell is a dead end when it has exactly one orthogonally OPEN neighbor. Room cells are excluded from the set of cells that may themselves become hallway dead ends.

Convert every dead end to a Monster coordinate.

Monster-only generation returns `generation-failed` if there are zero dead ends.

- [ ] **Step 7: Construct `LevelDefinition`**

For a successful candidate:

```ts
const solution =
  serializeSolution(grid);

const {
  rowClues,
  columnClues,
} = deriveClues(solution);

const level: LevelDefinition = {
  id:
    `generated-${input.archetype}-${input.size}-${input.seed >>> 0}`,
  width: input.size,
  height: input.size,
  rowClues,
  columnClues,
  monsters,
  chests: [],
  blockers: [],
  doors: [],
  solution,
};
```

Return:

```ts
return {
  ok: true,
  candidate: {
    id: level.id,
    seed: input.seed >>> 0,
    archetype: input.archetype,
    size: input.size,
    rooms: [],
    level,
  },
};
```

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: RNG and Monster-only deterministic generation checks pass.

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 9: Commit Task 2**

Run:

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateGenerator.ts src/dev/generatorSanity.ts
git commit -m "feat: generate monster-only candidates"
npm run context:last
```

---

# Task 3: Add Treasure Room planning and all five archetypes

**Files:**
- Modify: `src/puzzle/generator/CandidateGenerator.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `PlannedRoom`.
- Produces: deterministic 1-room and 2-room solution-first generation.
- Produces: exact single intended entrance per room.
- Produces: Chest placement satisfying authored distance guideline.
- Produces: Chest-only and mixed archetypes.

- [ ] **Step 1: Add RED archetype coverage**

Add to `generatorSanity.ts`:

```ts
function findCandidateForArchetype(
  archetype: GeneratorArchetype,
  size: GeneratorBoardSize,
): GeneratedCandidate {
  for (
    let seed = 1;
    seed <= 2000;
    seed += 1
  ) {
    const result =
      generateCandidate({
        archetype,
        size,
        seed,
      });

    if (result.ok) {
      return result.candidate;
    }
  }

  throw new Error(
    `Expected generated candidate for ${archetype} ${size}x${size}.`,
  );
}
```

Check representative supported shapes:

```ts
const oneRoomChestOnly =
  findCandidateForArchetype(
    GeneratorArchetype.ChestOneRoom,
    7,
  );

assert(
  oneRoomChestOnly.rooms.length === 1,
  'Chest-one-room candidate must plan exactly one room.',
);

assert(
  oneRoomChestOnly.level.chests.length === 1,
  'Chest-one-room candidate must contain exactly one Chest.',
);

assert(
  oneRoomChestOnly.level.monsters.length === 0,
  'Chest-one-room candidate must contain no Monsters.',
);

const twoRoomChestOnly =
  findCandidateForArchetype(
    GeneratorArchetype.ChestTwoRooms,
    8,
  );

assert(
  twoRoomChestOnly.rooms.length === 2,
  'Chest-two-rooms candidate must plan exactly two rooms.',
);

assert(
  twoRoomChestOnly.level.chests.length === 2,
  'Chest-two-rooms candidate must contain exactly two Chests.',
);

assert(
  twoRoomChestOnly.level.monsters.length === 0,
  'Chest-two-rooms candidate must contain no Monsters.',
);

const mixedOne =
  findCandidateForArchetype(
    GeneratorArchetype.MixedOneRoom,
    7,
  );

assert(
  mixedOne.rooms.length === 1 &&
    mixedOne.level.chests.length === 1 &&
    mixedOne.level.monsters.length > 0,
  'Mixed-one-room candidate must contain one room, one Chest, and Monsters.',
);

const mixedTwo =
  findCandidateForArchetype(
    GeneratorArchetype.MixedTwoRooms,
    8,
  );

assert(
  mixedTwo.rooms.length === 2 &&
    mixedTwo.level.chests.length === 2 &&
    mixedTwo.level.monsters.length > 0,
  'Mixed-two-rooms candidate must contain two rooms, two Chests, and Monsters.',
);
```

Also assert that requesting an unsupported 6×6 two-room archetype returns `ok: false`.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because only Monster-only is implemented.

- [ ] **Step 3: Represent planned Treasure Rooms**

For each `PlannedRoom` derive its nine room cells from `topLeft`.

Internally add:

```ts
interface RoomPlacement {
  plan: PlannedRoom;
  roomCellKeys: ReadonlySet<string>;
  forbiddenExternalKeys: ReadonlySet<string>;
}
```

A room entrance consists of:

- one internal room boundary cell;
- one adjacent external hallway cell.

All orthogonal external neighbors of the 3×3 room except the chosen `externalEntrance` are forbidden from hallway carving. This guarantees the generator intends exactly one entrance; the validator still decides whether the final room is truly valid.

- [ ] **Step 4: Deterministically choose room placements**

Enumerate every legal 3×3 top-left coordinate.

For each room candidate enumerate entrance directions/cells that leave an in-bounds external entrance.

Shuffle candidates with `SeededRandom`.

For two-room archetypes reject room-pair choices when:

- 3×3 footprints overlap;
- one room's external entrance lies inside the other room;
- room footprints touch in a way that creates unavoidable extra orthogonal room entrances;
- the union of forbidden external cells leaves either intended entrance unable to reach non-room board space.

Do not store room footprints in `LevelDefinition`; they remain generator-only metadata.

- [ ] **Step 5: Connect required entrances before free growth**

For one room, start hallway OPEN growth at its `externalEntrance`.

For two rooms, connect the two external entrance cells first.

Implement a deterministic randomized depth-first path search:

```ts
function carveConnection(
  grid: boolean[][],
  start: GridPosition,
  target: GridPosition,
  random: SeededRandom,
  roomCellKeys: ReadonlySet<string>,
  forbiddenExternalKeys: ReadonlySet<string>,
): boolean;
```

The path search:

- stays in bounds;
- never opens `forbiddenExternalKeys`;
- never enters room cells except that rooms are already OPEN separately;
- uses `canOpenWithoutTwoByTwo()`;
- backtracks when stuck;
- uses Manhattan distance only as a weak ordering preference, not as a deterministic shortest-path requirement;
- returns `false` instead of throwing when no path can be carved.

A failed connection becomes `generation-failed`.

- [ ] **Step 6: Grow additional hallway from the connected seed network**

After required room entrances are connected:

- continue the same frontier growth used for Monster-only;
- never open forbidden room-adjacent cells;
- room cells remain permanently OPEN;
- the target OPEN count includes room cells.

The OPEN 2×2 guard must allow 2×2 blocks only when all four cells belong to the same planned 3×3 Treasure Room.

- [ ] **Step 7: Place Monsters according to archetype**

After final solution geometry:

```ts
const deadEnds =
  getHallwayDeadEnds(
    solution,
    plannedRooms,
  );
```

Rules:

- `monster-only`: require `deadEnds.length > 0`, monsters = every dead end.
- `chest-one-room`: require `deadEnds.length === 0`, monsters = `[]`.
- `chest-two-rooms`: require `deadEnds.length === 0`, monsters = `[]`.
- `mixed-one-room`: require `deadEnds.length > 0`, monsters = every dead end.
- `mixed-two-rooms`: require `deadEnds.length > 0`, monsters = every dead end.

No Monster may be added anywhere else.

- [ ] **Step 8: Place Chests with authored entrance-distance rule**

For each room:

1. enumerate its nine cells;
2. compute Manhattan distance from `internalEntrance`;
3. keep cells with distance `>= 2`;
4. choose one with seeded RNG.

The selected Chest must be OPEN by construction.

If no legal Chest cell exists, return `generation-failed`.

- [ ] **Step 9: Verify all generated fixed objects are represented as OPEN**

In sanity, for every found candidate:

```ts
for (
  const monster
  of candidate.level.monsters
) {
  assert(
    candidate.level.solution[
      monster.y
    ][monster.x] === '.',
    'Monster must be OPEN in generated solution.',
  );
}

for (
  const chest
  of candidate.level.chests
) {
  assert(
    candidate.level.solution[
      chest.y
    ][chest.x] === '.',
    'Chest must be OPEN in generated solution.',
  );
}
```

For each Chest, locate its corresponding room and assert Manhattan distance from `internalEntrance >= 2`.

- [ ] **Step 10: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: all five archetype generation checks pass.

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 11: Commit Task 3**

Run:

```powershell
git add src/puzzle/generator/CandidateGenerator.ts src/dev/generatorSanity.ts
git commit -m "feat: generate treasure room archetypes"
npm run context:last
```

---

# Task 4: Add the authoritative single-candidate acceptance pipeline

**Files:**
- Create: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `PuzzleState`, `CellState`, `validatePuzzle`, `solveLevel`, `analyzeLevelQuality`.
- Produces: `evaluateCandidate(candidate): CandidateEvaluation`.
- Produces exact statuses: `invalid`, `unsat`, `non-unique`, `hard-quality`, `geometry-warning`, `accepted`.

Add contracts:

```ts
export const CandidateStatus = {
  Invalid: 'invalid',
  Unsat: 'unsat',
  NonUnique: 'non-unique',
  HardQuality: 'hard-quality',
  GeometryWarning: 'geometry-warning',
  Accepted: 'accepted',
} as const;

export type CandidateStatus =
  typeof CandidateStatus[
    keyof typeof CandidateStatus
  ];

export interface AcceptedCandidate {
  candidate: GeneratedCandidate;
  quality: LevelQualityReport;
  solutionCount: 1;
}

export type CandidateEvaluation =
  | {
      status: 'accepted';
      accepted: AcceptedCandidate;
      diagnostic: null;
    }
  | {
      status:
        | 'invalid'
        | 'unsat'
        | 'non-unique'
        | 'hard-quality'
        | 'geometry-warning';
      accepted: null;
      diagnostic: string;
    };
```

- [ ] **Step 1: Add RED accepted-candidate evaluation**

Use a candidate found by Task 3 and assert:

```ts
const evaluation =
  evaluateCandidate(candidate);

assert(
  evaluation.status ===
    CandidateStatus.Accepted,
  `Expected accepted candidate, got ${evaluation.status}: ${evaluation.diagnostic ?? ''}`,
);
```

If the first generation fixture is not unique or quality-clean, scan the same deterministic seed range until `evaluateCandidate()` accepts one. The scan itself must be deterministic and bounded.

- [ ] **Step 2: Add RED rejection fixtures**

Add helpers that wrap a `LevelDefinition` as a `GeneratedCandidate`.

Use existing authored/known fixtures for specific pipeline stages:

1. **invalid** — a complete level with correct clue shape but invalid canonical dungeon topology (for example an open 2×2 outside any Treasure Room).
2. **unsat** — reuse the solver sanity's known unsatisfiable clue fixture.
3. **non-unique** — reuse the solver sanity's known ambiguous fixture that returns `solutionCount === 2`.
4. **hard-quality** — wrap existing valid/unique `level001` and assert its current hard authored quality result before using it as fixture; if current thresholds no longer reject it, embed a valid unique historical high-density fixture instead.
5. **geometry-warning** — embed the historical compact-wall `level011` fixture already used by `levelQualitySanity` as the warning fixture.

Each test must assert the exact status, not merely "not accepted".

- [ ] **Step 3: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because `evaluateCandidate()` does not exist.

- [ ] **Step 4: Materialize generated solution into `PuzzleState`**

In `CandidateFactory.ts` add:

```ts
function createPuzzleFromSolution(
  level: LevelDefinition,
): PuzzleState {
  const puzzle =
    new PuzzleState(level);

  for (
    let y = 0;
    y < level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      if (
        level.solution[y][x] ===
        '#'
      ) {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );
      }
    }
  }

  return puzzle;
}
```

Do not compare solver output to `level.solution`.

- [ ] **Step 5: Implement evaluation order exactly**

```ts
export function evaluateCandidate(
  candidate: GeneratedCandidate,
): CandidateEvaluation {
  const puzzle =
    createPuzzleFromSolution(
      candidate.level,
    );

  const validation =
    validatePuzzle(puzzle);

  if (!validation.isSolved) {
    return {
      status:
        CandidateStatus.Invalid,
      accepted: null,
      diagnostic:
        describeValidationFailure(
          validation,
        ),
    };
  }

  const solveResult =
    solveLevel(candidate.level);

  if (
    solveResult.solutionCount === 0
  ) {
    return {
      status:
        CandidateStatus.Unsat,
      accepted: null,
      diagnostic:
        'Solver found no solution.',
    };
  }

  if (
    solveResult.solutionCount === 2
  ) {
    return {
      status:
        CandidateStatus.NonUnique,
      accepted: null,
      diagnostic:
        'Solver found 2+ solutions.',
    };
  }

  const quality =
    analyzeLevelQuality(
      candidate.level,
    );

  if (!quality.passes) {
    return {
      status:
        CandidateStatus.HardQuality,
      accepted: null,
      diagnostic:
        quality.issues.join('; '),
    };
  }

  if (
    quality.warnings.length > 0
  ) {
    return {
      status:
        CandidateStatus.GeometryWarning,
      accepted: null,
      diagnostic:
        quality.warnings.join('; '),
    };
  }

  return {
    status:
      CandidateStatus.Accepted,
    accepted: {
      candidate,
      quality,
      solutionCount: 1,
    },
    diagnostic: null,
  };
}
```

`describeValidationFailure()` must list false validation flags from `ValidationResult`; do not silently return a generic string when details are available.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: exact acceptance/rejection status checks pass.

Run:

```powershell
npm run build
```

Expected: build succeeds.

Also run the existing app dev sanity manually:

```powershell
npm run dev
```

Expected from the user's local console: existing validator, solver, and level-quality sanity remain green.

- [ ] **Step 7: Commit Task 4**

Run:

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateFactory.ts src/dev/generatorSanity.ts
git commit -m "feat: evaluate generated candidates"
npm run context:last
```

---

# Task 5: Build balanced per-archetype pools with deterministic attempt statistics

**Files:**
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/puzzle/generator/CandidateFactory.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `deriveCandidateSeed`, `ALLOWED_SIZES`, `generateCandidate`, `evaluateCandidate`.
- Produces: `DEFAULT_GENERATOR_CONFIG`.
- Produces: `createCandidatePool(config): GeneratorRunReport`.
- Produces per-archetype attempts, rejection counters, accepted candidates, and exhaustion state.

Add:

```ts
export const RejectionReason = {
  GenerationFailed: 'generation-failed',
  Invalid: 'invalid',
  Unsat: 'unsat',
  NonUnique: 'non-unique',
  HardQuality: 'hard-quality',
  GeometryWarning: 'geometry-warning',
} as const;

export interface ArchetypeRunStats {
  archetype: GeneratorArchetype;
  attempts: number;
  accepted: number;
  rejectionCounts:
    Readonly<
      Record<
        RejectionReason,
        number
      >
    >;
}

export interface ArchetypePoolResult {
  stats: ArchetypeRunStats;
  accepted:
    readonly AcceptedCandidate[];
  exhausted: boolean;
}

export interface GeneratorPoolReport {
  masterSeed: number;
  config: GeneratorConfig;
  archetypes:
    readonly ArchetypePoolResult[];
  accepted:
    readonly AcceptedCandidate[];
  completed: boolean;
}
```

- [ ] **Step 1: Add RED config-validation tests**

Assert these throw:

```ts
createCandidatePool({
  masterSeed: 1,
  acceptedPerArchetype: 0,
  shortlistPerArchetype: 1,
  maxAttemptsPerArchetype: 10,
});

createCandidatePool({
  masterSeed: 1,
  acceptedPerArchetype: 1,
  shortlistPerArchetype: 2,
  maxAttemptsPerArchetype: 10,
});
```

The second is invalid because shortlist target cannot exceed accepted target.

- [ ] **Step 2: Add RED small real-pool test**

Use:

```ts
const smallConfig: GeneratorConfig = {
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
  'Small deterministic pool must complete.',
);

assert(
  pool.accepted.length === 5,
  'Small pool must contain one accepted candidate per archetype.',
);

for (
  const archetypeResult
  of pool.archetypes
) {
  assert(
    archetypeResult.accepted.length === 1,
    `${archetypeResult.stats.archetype} must contribute exactly one accepted candidate.`,
  );
}
```

Also run it twice and compare a normalized JSON form excluding no fields; reports must be byte-equivalent after `JSON.stringify`.

- [ ] **Step 3: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because `createCandidatePool()` does not exist.

- [ ] **Step 4: Validate generator configuration**

Add:

```ts
function validateGeneratorConfig(
  config: GeneratorConfig,
): void {
  if (
    !Number.isInteger(
      config.masterSeed,
    )
  ) {
    throw new TypeError(
      'masterSeed must be an integer.',
    );
  }

  if (
    !Number.isInteger(
      config.acceptedPerArchetype,
    ) ||
    config.acceptedPerArchetype <= 0
  ) {
    throw new RangeError(
      'acceptedPerArchetype must be positive.',
    );
  }

  if (
    !Number.isInteger(
      config.shortlistPerArchetype,
    ) ||
    config.shortlistPerArchetype <= 0 ||
    config.shortlistPerArchetype >
      config.acceptedPerArchetype
  ) {
    throw new RangeError(
      'shortlistPerArchetype must be positive and not exceed acceptedPerArchetype.',
    );
  }

  if (
    !Number.isInteger(
      config.maxAttemptsPerArchetype,
    ) ||
    config.maxAttemptsPerArchetype <= 0
  ) {
    throw new RangeError(
      'maxAttemptsPerArchetype must be positive.',
    );
  }
}
```

- [ ] **Step 5: Choose board size deterministically per attempt**

For each archetype and attempt:

```ts
const candidateSeed =
  deriveCandidateSeed(
    config.masterSeed,
    archetype,
    attempt,
  );

const random =
  new SeededRandom(
    candidateSeed,
  );

const allowedSizes =
  ALLOWED_SIZES[archetype];

const size =
  random.choose(
    allowedSizes,
  );
```

Then call `generateCandidate({ archetype, size, seed: candidateSeed })`.

Do not maintain mutable global RNG state across archetypes; candidate derivation must be independently reproducible.

- [ ] **Step 6: Count every outcome**

For `generateCandidate(...).ok === false`, increment `generation-failed`.

For generated candidates, map evaluation statuses to the matching rejection counter.

For accepted candidates:

- append exactly once;
- increment `accepted`;
- do not increment a rejection count.

Stop one archetype when it reaches `acceptedPerArchetype`.

Mark it `exhausted: true` only when the attempt limit is hit before the target.

Continue collecting other archetype results so diagnostics are complete, but final `completed` is false if any archetype exhausted.

- [ ] **Step 7: Add bounded rejection samples**

Add at most five diagnostic samples per rejection reason per archetype:

```ts
export interface RejectionSample {
  attempt: number;
  candidateSeed: number;
  reason: RejectionReason;
  diagnostic: string;
}
```

Do not store every rejected full level in the report.

- [ ] **Step 8: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: small deterministic five-archetype pool completes and repeated report is identical.

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 9: Commit Task 5**

Run:

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateFactory.ts src/dev/generatorSanity.ts
git commit -m "feat: build balanced candidate pools"
npm run context:last
```

---

# Task 6: Add bounded quality ranking and diversity-aware shortlist selection

**Files:**
- Create: `src/puzzle/generator/CandidateRanker.ts`
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `AcceptedCandidate`, current `LevelQualityMetrics`.
- Produces: `scoreCandidate(candidate): number`.
- Produces: `candidateDistance(a, b): number`.
- Produces: `selectShortlist(pool, perArchetype): readonly RankedCandidate[]`.

Add:

```ts
export interface RankedCandidate {
  accepted: AcceptedCandidate;
  qualityScore: number;
  diversityScore: number;
  selectionScore: number;
  rankWithinArchetype: number;
}
```

- [ ] **Step 1: Add RED bounded-score tests**

Create small `AcceptedCandidate` fixtures by wrapping deterministic metrics.

Assert:

1. a healthy middle-range candidate scores `100` before optional object bonus cap;
2. lowering wall density below the healthy zone does not keep increasing the score;
3. thick-wall ratio over 0.35 introduces a penalty;
4. `wallOpenBoundaryPerWall < 1.45` introduces a penalty;
5. `largestWallComponentRatio > 0.60` introduces a penalty;
6. more than one near-full line introduces only a small bounded penalty;
7. object-assisted deductions add no more than `3` points.

- [ ] **Step 2: Lock the exact scoring formula**

Implement:

```ts
export function scoreCandidate(
  accepted: AcceptedCandidate,
): number {
  const metrics =
    accepted.quality.metrics;

  let score = 100;

  score -= scaledPenalty(
    metrics.wallDensity,
    0.48,
    0.55,
    8,
  );

  score -= scaledPenalty(
    metrics.thickWallCellRatio,
    0.35,
    0.60,
    8,
  );

  score -= inverseScaledPenalty(
    metrics.wallOpenBoundaryPerWall,
    1.30,
    1.45,
    8,
  );

  score -= scaledPenalty(
    metrics.largestWallComponentRatio,
    0.60,
    0.75,
    8,
  );

  score -= Math.min(
    4,
    Math.max(
      0,
      metrics.nearFullWallLineCount -
        1,
    ) * 2,
  );

  score += Math.min(
    3,
    metrics.objectAssistedForcedWallCount *
      0.25,
  );

  return roundScore(score);
}
```

`scaledPenalty()` returns 0 at/below healthy threshold and reaches but never exceeds `maxPenalty` at/above warning threshold.

`inverseScaledPenalty()` is the mirrored version for metrics where lower is worse.

- [ ] **Step 3: Add RED novelty tests**

Create three same-archetype accepted fixtures:

- A: best raw quality;
- B: almost identical to A;
- C: slightly lower raw quality but clearly different size/metrics/wall mask.

Assert shortlist:

- picks A first;
- prefers C over B for a later slot when quality gap is small;
- does not let a very low-quality candidate win solely from novelty.

- [ ] **Step 4: Implement candidate distance**

Distance must be `[0, 1]`.

Use the average of these normalized components:

```text
board size difference
wall density difference / 0.20
thick-wall ratio difference / 0.40
boundary-per-wall difference / 0.80
largest-component-ratio difference / 0.50
Monster count difference / 4
wall-mask Hamming distance when sizes match; otherwise 1
```

Clamp every component to `[0, 1]`.

For wall-mask Hamming:

```ts
differentCells / totalCells
```

- [ ] **Step 5: Implement diversity-aware top-N selection per archetype**

For each archetype:

1. stable-sort accepted candidates by `qualityScore DESC`, then `candidate.seed ASC`;
2. choose first by pure quality;
3. for each later slot compute novelty as the **minimum** distance to any already selected candidate;
4. compute:

```ts
selectionScore =
  qualityScore +
  novelty * 6;
```

5. select highest `selectionScore`;
6. tie-break by `qualityScore DESC`, then `seed ASC`.

Using minimum novelty prevents a candidate from being "different from one selection" while duplicating another.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm run sanity:generator
```

Expected: ranking and diversity selection checks pass plus previous generator checks.

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit Task 6**

Run:

```powershell
git add src/puzzle/generator/types.ts src/puzzle/generator/CandidateRanker.ts src/dev/generatorSanity.ts
git commit -m "feat: rank diverse generator candidates"
npm run context:last
```

---

# Task 7: Add the standalone CLI, JSON report, Markdown shortlist, and `.generated/`

**Files:**
- Create: `src/dev/generateCandidates.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `src/puzzle/generator/types.ts`
- Modify: `src/dev/generatorSanity.ts`

**Interfaces:**
- Consumes: `createCandidatePool()`, `selectShortlist()`.
- Produces: `npm run generate:candidates -- --seed <uint32>`.
- Produces: `.generated/candidates-<seed>.json`.
- Produces: `.generated/shortlist-<seed>.md`.
- Produces non-zero exit status on invalid seed or incomplete pool.

- [ ] **Step 1: Add RED pure output-format checks**

Before adding filesystem code, export pure formatter functions from `generateCandidates.ts`:

```ts
export function formatShortlistMarkdown(
  report: GeneratorRunReport,
): string;

export function createSerializableReport(
  report: GeneratorRunReport,
): unknown;
```

In sanity, build a small completed report and assert Markdown contains:

```text
Dungeon Logic Generator v1
Master seed
archetype
candidate seed
size
row clues
column clues
Monsters
Chests
solutionCount: 1
wall density
thick-wall ratio
wall/open boundary
largest wall component
```

Assert serialized report contains schema version:

```ts
schemaVersion: 1
```

- [ ] **Step 2: Run RED**

Run:

```powershell
npm run sanity:generator
```

Expected: FAIL because CLI formatter module does not exist.

- [ ] **Step 3: Add `.generated/` ignore**

Append exactly:

```gitignore
.generated/
```

Do not ignore authored level files.

- [ ] **Step 4: Add CLI package script**

Add:

```json
"generate:candidates": "tsx src/dev/generateCandidates.ts"
```

- [ ] **Step 5: Parse master seed strictly**

Support only:

```text
--seed 123456
```

For v1, seed is required.

Parsing contract:

- decimal integer only;
- `0 <= seed <= 4294967295`;
- missing, fractional, negative, NaN, or overflow seed throws a user-facing error and sets non-zero exit code.

Do not silently substitute `Math.random()`.

- [ ] **Step 6: Compose the full run report**

Add:

```ts
export interface GeneratorRunReport {
  schemaVersion: 1;
  masterSeed: number;
  config: GeneratorConfig;
  pool: GeneratorPoolReport;
  shortlist:
    readonly RankedCandidate[];
}
```

Flow:

```ts
const pool =
  createCandidatePool(config);

const shortlist =
  pool.completed
    ? selectShortlist(
        pool,
        config.shortlistPerArchetype,
      )
    : [];

const report: GeneratorRunReport = {
  schemaVersion: 1,
  masterSeed: config.masterSeed,
  config,
  pool,
  shortlist,
};
```

If pool is incomplete, still write JSON and set a non-zero exit code. Do not write a misleading 15-entry shortlist.

- [ ] **Step 7: Write JSON and Markdown**

Use Node:

```ts
import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import { join } from 'node:path';
```

Create `.generated/` recursively.

Paths:

```ts
const jsonPath =
  join(
    '.generated',
    `candidates-${seed}.json`,
  );

const markdownPath =
  join(
    '.generated',
    `shortlist-${seed}.md`,
  );
```

JSON:

```ts
JSON.stringify(
  createSerializableReport(
    report,
  ),
  null,
  2,
) + '\n'
```

Markdown must group entries by archetype and contain exactly three sections per archetype in a successful default run.

ASCII solution is written directly from `candidate.level.solution` inside fenced `text` blocks.

- [ ] **Step 8: Print rejection statistics**

For each archetype print:

```text
attempts
accepted
generation-failed
invalid
unsat
non-unique
hard-quality
geometry-warning
```

Then print total accepted and shortlisted counts and both output paths.

Do not print every rejected candidate to console.

- [ ] **Step 9: Assert generator does not touch authored level directory**

In `generatorSanity.ts` use Node `readdir()`:

```ts
const before =
  await readdir(
    'src/data/levels',
  );

// run pure pool generation and formatters

const after =
  await readdir(
    'src/data/levels',
  );

assert(
  JSON.stringify(before.sort()) ===
    JSON.stringify(after.sort()),
  'Generator pipeline must not create authored level files.',
);
```

Make `generatorSanity.ts` use an async `main()` and set `process.exitCode = 1` on failure.

- [ ] **Step 10: Verify GREEN on small sanity**

Run:

```powershell
npm run sanity:generator
```

Expected: all generator checks pass.

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 11: Run one real default generation**

Run:

```powershell
npm run generate:candidates -- --seed 123456
```

Expected successful contract:

```text
Total accepted: 50
Shortlisted: 15
```

Expected files:

```text
.generated/candidates-123456.json
.generated/shortlist-123456.md
```

If the generator cannot reach this target within `5000` attempts for any archetype, do **not** increase the attempt limit blindly. Inspect rejection counters first and fix the geometry construction bottleneck responsible for the failing archetype.

- [ ] **Step 12: Re-run identical seed and verify byte-for-byte determinism**

PowerShell:

```powershell
Get-FileHash .generated\candidates-123456.json
Get-FileHash .generated\shortlist-123456.md
```

Record both hashes.

Run again:

```powershell
npm run generate:candidates -- --seed 123456
```

Then:

```powershell
Get-FileHash .generated\candidates-123456.json
Get-FileHash .generated\shortlist-123456.md
```

Expected: both hashes are unchanged.

- [ ] **Step 13: Commit Task 7**

Run:

```powershell
git add package.json package-lock.json .gitignore src/puzzle/generator/types.ts src/dev/generateCandidates.ts src/dev/generatorSanity.ts
git commit -m "feat: add generator candidate CLI"
npm run context:last
```

`.generated/` files must not appear in the commit.

---

# Task 8: Strengthen generator integration sanity for accepted pool invariants

**Files:**
- Modify: `src/dev/generatorSanity.ts`
- Modify: `src/puzzle/generator/CandidateGenerator.ts` only if a concrete invariant failure is found
- Modify: `src/puzzle/generator/CandidateFactory.ts` only if a concrete acceptance/reporting failure is found
- Modify: `src/puzzle/generator/CandidateRanker.ts` only if a concrete shortlist failure is found

**Interfaces:**
- Consumes: real generator, validator, solver, analyzer.
- Produces: final deterministic regression suite covering spec acceptance invariants.

- [ ] **Step 1: Add accepted-candidate invariant helper**

For every accepted candidate in the small deterministic pool, assert:

```ts
function assertAcceptedCandidate(
  accepted: AcceptedCandidate,
): void {
  const level =
    accepted.candidate.level;

  const puzzle =
    createPuzzleForSanity(level);

  assert(
    validatePuzzle(puzzle).isSolved,
    `${accepted.candidate.id} must pass LevelValidator.`,
  );

  assert(
    solveLevel(level).solutionCount ===
      1,
    `${accepted.candidate.id} must be unique.`,
  );

  const quality =
    analyzeLevelQuality(level);

  assert(
    quality.passes,
    `${accepted.candidate.id} must pass hard quality.`,
  );

  assert(
    quality.warnings.length === 0,
    `${accepted.candidate.id} must have no geometry warnings.`,
  );
}
```

`createPuzzleForSanity()` applies only `#` as `CellState.Wall`.

- [ ] **Step 2: Assert archetype contracts**

For each accepted candidate:

```text
monster-only:
  rooms=0, chests=0, monsters>0

chest-one-room:
  rooms=1, chests=1, monsters=0

chest-two-rooms:
  rooms=2, chests=2, monsters=0

mixed-one-room:
  rooms=1, chests=1, monsters>0

mixed-two-rooms:
  rooms=2, chests=2, monsters>0
```

Also assert candidate size belongs to `ALLOWED_SIZES[archetype]`.

- [ ] **Step 3: Assert exact dead-end/Monster correspondence**

For accepted candidate:

```ts
const deadEnds =
  getHallwayDeadEnds(
    level.solution,
    accepted.candidate.rooms,
  );

const monsterKeys =
  new Set(
    level.monsters.map(
      ({ x, y }) =>
        `${x}:${y}`,
    ),
  );

const deadEndKeys =
  new Set(
    deadEnds.map(
      ({ x, y }) =>
        `${x}:${y}`,
    ),
  );
```

Assert sets are exactly equal.

This is generator-side sanity; the validator remains canonical.

- [ ] **Step 4: Assert clue derivation again for every accepted candidate**

```ts
const derived =
  deriveClues(
    level.solution,
  );

assert(
  arraysEqual(
    derived.rowClues,
    level.rowClues,
  ),
  'Generated row clues must match solution.',
);

assert(
  arraysEqual(
    derived.columnClues,
    level.columnClues,
  ),
  'Generated column clues must match solution.',
);
```

- [ ] **Step 5: Assert shortlist invariants on a deterministic reduced pool**

Use a reduced but multi-candidate config:

```ts
const shortlistConfig: GeneratorConfig = {
  masterSeed: 123456,
  acceptedPerArchetype: 3,
  shortlistPerArchetype: 2,
  maxAttemptsPerArchetype: 5000,
};
```

Assert:

- 15 accepted total;
- 10 shortlisted total;
- exactly 2 shortlist entries per archetype;
- no duplicate candidate IDs;
- no duplicate candidate seeds within the same archetype;
- same seed produces identical shortlist order.

This exercises diversity selection without forcing a 50-candidate run on every sanity invocation.

- [ ] **Step 6: Verify all regression layers**

Run:

```powershell
npm run build
```

Run:

```powershell
npm run sanity:generator
```

Run:

```powershell
npm run dev
```

Expected user-local console:

```text
Validator sanity: 19/19
Solver sanity: 12/12
Level quality sanity: 5/5
```

Generator sanity must also complete without failures.

- [ ] **Step 7: Verify the full default contract again**

Run:

```powershell
npm run generate:candidates -- --seed 123456
```

Expected:

```text
50 accepted
15 shortlisted
10 accepted per archetype
3 shortlisted per archetype
```

Open:

```text
.generated/shortlist-123456.md
```

Manually scan that it contains five archetype groups and fifteen candidate entries.

- [ ] **Step 8: Commit Task 8**

Run:

```powershell
git add src/dev/generatorSanity.ts src/puzzle/generator/CandidateGenerator.ts src/puzzle/generator/CandidateFactory.ts src/puzzle/generator/CandidateRanker.ts
git commit -m "test: cover generator integration invariants"
npm run context:last
```

Only add generator source files that actually changed while fixing concrete RED failures.

---

# Task 9: Document verified Generator v1 and update project tree

**Files:**
- Modify: `CURRENT_STATE.md`
- Modify: `TREE.txt`

**Interfaces:**
- Consumes: verified Generator v1 behavior.
- Produces: current-state documentation matching actual implementation only.

- [ ] **Step 1: Add Generator v1 implemented section to `CURRENT_STATE.md`**

Document only facts verified by Tasks 1–8:

```text
- dev-only solution-first generator exists;
- five Monster/Chest archetypes;
- 6×6 / 7×7 / 8×8 size rules;
- deterministic master/candidate seeds;
- existing validator → solver → quality acceptance pipeline;
- geometry warnings reject automatic candidates but remain non-runtime authored warnings;
- 10 accepted per archetype / 50 total default pool;
- diversity-aware 3-per-archetype / 15 total shortlist;
- .generated JSON + Markdown outputs;
- generated levels are never registered automatically;
- generator sanity is a separate command, not BootScene startup;
- difficulty scoring still not implemented.
```

Do not claim a specific seed produces 50 candidates unless the full command actually succeeded during Task 7/8.

- [ ] **Step 2: Update `TREE.txt`**

Add:

```text
docs/superpowers/plans/2026-09-02-generator-v1.md
docs/superpowers/specs/2026-09-02-generator-v1-design.md
src/dev/generateCandidates.ts
src/dev/generatorSanity.ts
src/puzzle/generator/CandidateFactory.ts
src/puzzle/generator/CandidateGenerator.ts
src/puzzle/generator/CandidateRanker.ts
src/puzzle/generator/SeededRandom.ts
src/puzzle/generator/types.ts
```

Do not include `.generated/` because it is ignored local output, not repository structure.

- [ ] **Step 3: Final build**

Run:

```powershell
npm run build
```

Expected: success.

- [ ] **Step 4: Final generator sanity**

Run:

```powershell
npm run sanity:generator
```

Expected: all generator checks pass.

- [ ] **Step 5: Final existing dev sanity**

Run:

```powershell
npm run dev
```

Expected user-local existing sanity output remains green.

- [ ] **Step 6: Final real generation**

Run:

```powershell
npm run generate:candidates -- --seed 123456
```

Expected only if already established in Tasks 7–8:

```text
Total accepted: 50
Shortlisted: 15
```

- [ ] **Step 7: Confirm ignored artifacts are not staged**

Run:

```powershell
git status --short
```

Expected: `.generated/` is absent.

- [ ] **Step 8: Commit documentation**

Run:

```powershell
git add CURRENT_STATE.md TREE.txt
git commit -m "docs: record generator v1"
npm run context:last
```

---

# Final Verification Checklist

Before calling Generator v1 complete, verify all of these from fresh commands:

- [ ] `npm run build` succeeds.
- [ ] `npm run sanity:generator` succeeds.
- [ ] Existing validator sanity remains green.
- [ ] Existing solver sanity remains green.
- [ ] Existing level-quality sanity remains green.
- [ ] Same RNG seed reproduces the same primitive sequence.
- [ ] Same candidate seed reproduces the same candidate.
- [ ] Same master seed reproduces the same pool report and shortlist order.
- [ ] Different seeds change at least one meaningful generated result.
- [ ] Every accepted candidate passes `validatePuzzle(...).isSolved`.
- [ ] Every accepted candidate has `solveLevel(...).solutionCount === 1`.
- [ ] Every accepted candidate has `quality.passes === true`.
- [ ] Every accepted candidate has `quality.warnings.length === 0`.
- [ ] Monster coordinates equal hallway dead-end coordinates exactly.
- [ ] Chest counts and room counts match archetype.
- [ ] Chest positions satisfy authored entrance-distance guideline.
- [ ] Row clues are derived from generated solution.
- [ ] Column clues are derived from generated solution.
- [ ] Default run reaches 10 accepted candidates per archetype.
- [ ] Default run reaches 50 accepted candidates total.
- [ ] Default shortlist contains 3 candidates per archetype.
- [ ] Default shortlist contains 15 candidates total.
- [ ] Shortlist contains no duplicate candidate IDs.
- [ ] `.generated/candidates-<seed>.json` is written.
- [ ] `.generated/shortlist-<seed>.md` is written.
- [ ] Re-running the same seed produces identical output file hashes.
- [ ] `.generated/` is ignored by git.
- [ ] `src/data/levels/` is unchanged by generator execution.
- [ ] No Generator v1 code imports Phaser.
- [ ] No runtime puzzle rule or win condition was modified.
- [ ] No difficulty score, hints, blockers, doors, ORYX, campaign, or Yandex systems were added.
