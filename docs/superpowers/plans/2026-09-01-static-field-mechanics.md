# Static Field Mechanics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Fixed Blockers and Directional Doors to Dungeon Logic while preserving the existing wall-count, connectivity, monster-dead-end, treasure-room, and hallway-width rules.

**Architecture:** Blockers and doors remain immutable level metadata rather than mutable `CellState` values. `PuzzleState` owns fixed-object lookup and overlap validation; `LevelValidator` derives OPEN/CLOSED topology from both mutable wall state and blocker metadata, and validates door orientation as an additional solved condition. Board rendering stays placeholder-only for this slice.

**Tech Stack:** Phaser 3, TypeScript, Vite.

**Spec:** `docs/superpowers/specs/2026-09-01-static-field-mechanics-design.md`

## Global Constraints

- `CellState` remains exactly `unknown | wall | floor`.
- Row/column clues count only ordinary mutable `Wall` cells.
- Blockers are CLOSED but are not `CellState.Wall`.
- Doors are OPEN immutable cells.
- Unknown and Floor remain OPEN.
- No enums; project uses `erasableSyntaxOnly`.
- Hidden `solution` remains dev data only and must not decide runtime victory.
- Existing `level001`, `level002`, and `level003` must keep working.
- No solver, generator, keys, switches, interactive doors, edge doors, or ORYX final visual pass in this implementation.
- Run `npm run build` for every implementation checkpoint.
- Run local dev sanity checks after every validator change.
- Commit each independently testable task.

---

## File Structure

### Modify

- `src/puzzle/types.ts` — add `DoorDefinition` and new level metadata arrays.
- `src/puzzle/PuzzleState.ts` — fixed-object lookup, immutable-cell behavior, overlap checks, door initialization.
- `src/puzzle/LevelValidator.ts` — blocker-aware topology, door validation, room exclusion, solved condition.
- `src/dev/validatorSanity.ts` — regression fixtures for blockers, doors, overlaps, and the new integrated level.
- `src/data/levels/level001.ts` — add empty metadata arrays.
- `src/data/levels/level002.ts` — add empty metadata arrays.
- `src/data/levels/level003.ts` — add empty metadata arrays.
- `src/data/levels/index.ts` — register `level004`.
- `src/board/BoardView.ts` — placeholder markers for blocker and door.
- `CURRENT_STATE.md` — document implemented mechanics and correct the outdated fixed 6×6 wording.
- `TREE.txt` — include new plan and `level004.ts`.

### Create

- `src/data/levels/level004.ts` — integration level using two monsters, one blocker, one horizontal door, no chest.

### Intentionally unchanged

- `src/board/CellView.ts` — existing fixed-marker rendering is sufficient for placeholder `X`, `↔`, `↕`.
- `src/scenes/GameScene.ts` — already resolves levels generically through `resolveLevel`.
- `src/puzzle/CellState` semantics — no new mutable state values.

---

### Task 1: Extend level metadata and PuzzleState fixed-object model

**Files:**
- Modify: `src/puzzle/types.ts`
- Modify: `src/puzzle/PuzzleState.ts`
- Modify: `src/data/levels/level001.ts`
- Modify: `src/data/levels/level002.ts`
- Modify: `src/data/levels/level003.ts`
- Modify: `src/dev/validatorSanity.ts`

**Interfaces:**
- Produces: `DoorDefinition`
- Produces: `LevelDefinition.blockers`
- Produces: `LevelDefinition.doors`
- Produces: `PuzzleState.isBlocker(x, y): boolean`
- Produces: `PuzzleState.isDoor(x, y): boolean`
- Produces: `PuzzleState.getDoor(x, y): DoorDefinition | null`

- [ ] **Step 1: Add a failing sanity case for fixed metadata**

In `src/dev/validatorSanity.ts`, import `DoorDefinition` and add a case named `fixed blocker and door metadata`.

The case must construct this level:

```ts
const level: LevelDefinition = {
  id: 'sanity-fixed-metadata',
  width: 3,
  height: 3,
  rowClues: [0, 0, 0],
  columnClues: [0, 0, 0],
  monsters: [],
  chests: [],
  blockers: [
    {
      x: 0,
      y: 0,
    },
  ],
  doors: [
    {
      position: {
        x: 1,
        y: 1,
      },
      orientation: 'horizontal',
    },
  ],
  solution: [
    '...',
    '...',
    '...',
  ],
};
```

Then assert:

```ts
const puzzle = new PuzzleState(level);

assert(
  puzzle.isBlocker(0, 0),
  'Blocker metadata should be queryable.',
);

assert(
  puzzle.isDoor(1, 1),
  'Door metadata should be queryable.',
);

assert(
  puzzle.getDoor(1, 1)?.orientation ===
    'horizontal',
  'Door orientation should be preserved.',
);

assert(
  puzzle.setCellState(
    0,
    0,
    CellState.Wall,
  ) !== CellState.Wall,
  'Blocker must reject mutable wall state.',
);

assert(
  puzzle.setCellState(
    1,
    1,
    CellState.Wall,
  ) === CellState.Floor,
  'Door must stay fixed open.',
);
```

- [ ] **Step 2: Run the build and verify RED**

Run:

```bash
npm run build
```

Expected: TypeScript errors because `blockers`, `doors`, `DoorDefinition`, and PuzzleState lookup methods do not exist yet.

- [ ] **Step 3: Add metadata types**

In `src/puzzle/types.ts`, add:

```ts
export interface DoorDefinition {
  position: GridPosition;

  orientation:
    | 'horizontal'
    | 'vertical';
}
```

Extend `LevelDefinition`:

```ts
blockers: readonly GridPosition[];
doors: readonly DoorDefinition[];
```

Update the `solution` comment to:

```ts
/**
 * # = ordinary mutable wall
 * . = non-wall cell in the hidden solution
 *
 * Fixed metadata such as blockers and doors is
 * represented separately by LevelDefinition.
 */
solution: readonly string[];
```

- [ ] **Step 4: Keep old levels compatible**

Add to `level001`, `level002`, and `level003` immediately before `solution`:

```ts
blockers: [],
doors: [],
```

- [ ] **Step 5: Add PuzzleState lookup methods**

Import `DoorDefinition` in `PuzzleState.ts`.

Add:

```ts
isBlocker(
  x: number,
  y: number,
): boolean {
  return this.level.blockers.some(
    (blocker) =>
      blocker.x === x &&
      blocker.y === y,
  );
}

isDoor(
  x: number,
  y: number,
): boolean {
  return this.getDoor(x, y) !== null;
}

getDoor(
  x: number,
  y: number,
): DoorDefinition | null {
  return (
    this.level.doors.find(
      (door) =>
        door.position.x === x &&
        door.position.y === y,
    ) ?? null
  );
}
```

Extend `isFixedCell()`:

```ts
return (
  this.isMonster(x, y) ||
  this.isChest(x, y) ||
  this.isBlocker(x, y) ||
  this.isDoor(x, y)
);
```

Change fixed-cell rejection in `setCellState()` and `toggleCellState()` to return the cell's actual stored state:

```ts
if (this.isFixedCell(x, y)) {
  return this.cells[y][x];
}
```

- [ ] **Step 6: Initialize doors as open and leave blockers metadata-only**

In `createInitialGrid()`, after chest initialization, add:

```ts
for (
  const door
  of this.level.doors
) {
  this.assertPositionInsideBoard(
    door.position,
  );

  grid[door.position.y][door.position.x] =
    CellState.Floor;
}
```

For blockers, validate positions but do not set `CellState.Wall`.

- [ ] **Step 7: Reject overlapping fixed objects**

Call a new private validation method before `createInitialGrid()` in the constructor:

```ts
constructor(level: LevelDefinition) {
  this.level = level;
  this.validateFixedObjects();
  this.cells = this.createInitialGrid();
}
```

Implement:

```ts
private validateFixedObjects(): void {
  const occupied =
    new Set<string>();

  const fixedPositions:
    readonly GridPosition[] = [
      ...this.level.monsters,
      ...this.level.chests,
      ...this.level.blockers,
      ...this.level.doors.map(
        (door) =>
          door.position,
      ),
    ];

  for (
    const position
    of fixedPositions
  ) {
    this.assertPositionInsideBoard(
      position,
    );

    const key =
      `${position.x}:${position.y}`;

    if (occupied.has(key)) {
      throw new Error(
        `Fixed objects overlap at (${position.x}, ${position.y}).`,
      );
    }

    occupied.add(key);
  }
}
```

- [ ] **Step 8: Update sanity helper levels**

Extend `createLevelFromBoard()` with optional metadata arguments:

```ts
function createLevelFromBoard(
  id: string,
  board: readonly string[],
  monsters: readonly GridPosition[],
  chests: readonly GridPosition[],
  blockers: readonly GridPosition[] = [],
  doors: readonly DoorDefinition[] = [],
): LevelDefinition {
```

Return both fields:

```ts
blockers,
doors,
solution: board,
```

- [ ] **Step 9: Add overlap sanity coverage**

Add a `fixed object overlap rejected` case that attempts:

```ts
const level: LevelDefinition = {
  id: 'sanity-fixed-overlap',
  width: 2,
  height: 2,
  rowClues: [0, 0],
  columnClues: [0, 0],
  monsters: [
    {
      x: 0,
      y: 0,
    },
  ],
  chests: [],
  blockers: [
    {
      x: 0,
      y: 0,
    },
  ],
  doors: [],
  solution: [
    '..',
    '..',
  ],
};

let threw = false;

try {
  new PuzzleState(level);
} catch {
  threw = true;
}

assert(
  threw,
  'Overlapping fixed objects must be rejected.',
);
```

- [ ] **Step 10: Verify**

Run:

```bash
npm run build
npm run dev
```

Expected: build succeeds; all existing sanity cases plus the two new metadata cases pass.

- [ ] **Step 11: Commit**

```bash
git add src/puzzle/types.ts src/puzzle/PuzzleState.ts src/data/levels/level001.ts src/data/levels/level002.ts src/data/levels/level003.ts src/dev/validatorSanity.ts
git commit -m "feat: add static field metadata"
```

---

### Task 2: Make blockers part of CLOSED topology without counting as walls

**Files:**
- Modify: `src/puzzle/LevelValidator.ts`
- Modify: `src/dev/validatorSanity.ts`

**Interfaces:**
- Consumes: `PuzzleState.isBlocker()`
- Produces: blocker-aware `isOpen()`
- Produces: blocker-aware connectivity, dead-end, room, and 2×2 checks automatically through the shared topology helper

- [ ] **Step 1: Add a failing blocker-topology sanity case**

Create a 2×2 fixture with no ordinary walls and one blocker:

```ts
const board = [
  '..',
  '..',
];

const level =
  createLevelFromBoard(
    'sanity-blocker-topology',
    board,
    [],
    [],
    [
      {
        x: 0,
        y: 0,
      },
    ],
  );

const puzzle =
  createPuzzleFromBoard(
    level,
    board,
  );

const result =
  validatePuzzle(puzzle);
```

Assert:

```ts
assert(
  puzzle.getRowWallCount(0) === 0,
  'Blocker must not count as a row wall.',
);

assert(
  puzzle.getColumnWallCount(0) === 0,
  'Blocker must not count as a column wall.',
);

assert(
  result.hallwayWidthValid,
  'Blocker must break an otherwise open 2x2.',
);
```

- [ ] **Step 2: Run dev sanity and verify RED**

Run:

```bash
npm run dev
```

Expected: `sanity-blocker-topology` fails because the current validator treats the blocker cell as open.

- [ ] **Step 3: Make the shared topology helper blocker-aware**

Change `isOpen()` in `LevelValidator.ts` to:

```ts
function isOpen(
  puzzle: PuzzleState,
  x: number,
  y: number,
): boolean {
  if (puzzle.isBlocker(x, y)) {
    return false;
  }

  return (
    puzzle.getCellState(
      x,
      y,
    ) !== CellState.Wall
  );
}
```

No generic `isClosed()` helper is needed for door framing. Directional doors require ordinary clue-counted `CellState.Wall` cells on the perpendicular axis; that check is added explicitly in Task 3.

- [ ] **Step 4: Verify all topology regressions**

Run:

```bash
npm run build
npm run dev
```

Expected: all sanity checks pass. Existing clue counts remain unchanged because `getRowWallCount()` and `getColumnWallCount()` still count only `CellState.Wall`.

- [ ] **Step 5: Commit**

```bash
git add src/puzzle/LevelValidator.ts src/dev/validatorSanity.ts
git commit -m "feat: apply blockers to dungeon topology"
```

---

### Task 3: Validate directional doors and exclude doors from treasure-room interiors

**Files:**
- Modify: `src/puzzle/LevelValidator.ts`
- Modify: `src/dev/validatorSanity.ts`

**Interfaces:**
- Produces: `ValidationResult.doorsValid: boolean`
- Changes: `ValidationResult.isSolved` requires `doorsValid`
- Consumes: `PuzzleState.getDoor()`, `PuzzleState.isDoor()`, blocker-aware `isOpen()` and ordinary-wall checks

- [ ] **Step 1: Add failing door sanity cases**

Add four cases:

1. `valid horizontal door`
2. `blocker cannot frame directional door`
3. `invalid horizontal door side`
4. `edge door invalid`

For the valid horizontal door:

```ts
const board = [
  '.#.',
  '...',
  '.#.',
];

const level =
  createLevelFromBoard(
    'sanity-horizontal-door',
    board,
    [],
    [],
    [],
    [
      {
        position: {
          x: 1,
          y: 1,
        },
        orientation: 'horizontal',
      },
    ],
  );

const puzzle =
  createPuzzleFromBoard(
    level,
    board,
  );

const result =
  validatePuzzle(puzzle);

assert(
  result.doorsValid,
  'Horizontal door should accept open left/right and wall up/down.',
);
```

The perpendicular cells are ordinary clue-counted walls.

Add a separate blocker-frame regression fixture where the upper perpendicular neighbor is a Fixed Blocker and the lower perpendicular neighbor is an ordinary wall. Assert:

```ts
assert(
  !result.doorsValid,
  'Blocker must not replace a wall framing a directional door.',
);
```

For the invalid-side case, use the same door but make one horizontal neighbor a wall:

```ts
const board = [
  '.#.',
  '#..',
  '.#.',
];
```

Assert `!result.doorsValid`.

For the edge case, create a vertical door at `(0, 1)` on a 3×3 board and assert `!result.doorsValid`.

- [ ] **Step 2: Run build and verify RED**

Run:

```bash
npm run build
```

Expected: TypeScript fails because `ValidationResult.doorsValid` does not exist.

- [ ] **Step 3: Add `doorsValid` to validation result**

Extend:

```ts
export interface ValidationResult {
  rowCluesValid: boolean;
  columnCluesValid: boolean;

  treasureRoomsValid: boolean;
  connectivityValid: boolean;

  monsterDeadEndsValid: boolean;
  hallwayWidthValid: boolean;
  doorsValid: boolean;

  isSolved: boolean;
}
```

In `validatePuzzle()` compute:

```ts
const doorsValid =
  areDoorsValid(puzzle);
```

Require it in solved state:

```ts
const isSolved =
  rowCluesValid &&
  columnCluesValid &&
  connectivityValid &&
  treasureRoomsValid &&
  compatibleRoomLayoutExists &&
  doorsValid;
```

Return `doorsValid`.

- [ ] **Step 4: Implement door validation**

Add:

```ts
function areDoorsValid(
  puzzle: PuzzleState,
): boolean {
  for (
    const door
    of puzzle.level.doors
  ) {
    const x =
      door.position.x;

    const y =
      door.position.y;

    if (
      x <= 0 ||
      x >= puzzle.level.width - 1 ||
      y <= 0 ||
      y >= puzzle.level.height - 1
    ) {
      return false;
    }

    if (
      door.orientation ===
      'horizontal'
    ) {
      if (
        !isOpen(
          puzzle,
          x - 1,
          y,
        ) ||
        !isOpen(
          puzzle,
          x + 1,
          y,
        ) ||
        !isOrdinaryWall(
          puzzle,
          x,
          y - 1,
        ) ||
        !isOrdinaryWall(
          puzzle,
          x,
          y + 1,
        )
      ) {
        return false;
      }

      continue;
    }

    if (
      !isOpen(
        puzzle,
        x,
        y - 1,
      ) ||
      !isOpen(
        puzzle,
        x,
        y + 1,
      ) ||
      !isOrdinaryWall(
        puzzle,
        x - 1,
        y,
      ) ||
      !isOrdinaryWall(
        puzzle,
        x + 1,
        y,
      )
    ) {
      return false;
    }
  }

  return true;
}
```

Add the ordinary-wall helper:

```ts
function isOrdinaryWall(
  puzzle: PuzzleState,
  x: number,
  y: number,
): boolean {
  return (
    puzzle.getCellState(
      x,
      y,
    ) === CellState.Wall
  );
}
```

- [ ] **Step 5: Prevent a door from becoming part of a treasure room**

Inside `isRoomCandidateValid()`, while iterating candidate cells, add:

```ts
if (
  puzzle.isDoor(
    position.x,
    position.y,
  )
) {
  return false;
}
```

A door directly outside a room remains valid because `countRoomEntrances()` sees it as OPEN.

- [ ] **Step 6: Add a room regression case**

Create a valid 3×3 treasure-room-shaped candidate containing a door metadata cell inside the 3×3 and assert:

```ts
assert(
  !result.treasureRoomsValid,
  'Directional door must not be accepted inside a treasure room.',
);
```

- [ ] **Step 7: Verify**

Run:

```bash
npm run build
npm run dev
```

Expected: all sanity checks pass, including valid/invalid door orientation and room exclusion.

- [ ] **Step 8: Commit**

```bash
git add src/puzzle/LevelValidator.ts src/dev/validatorSanity.ts
git commit -m "feat: validate directional doors"
```

---

### Task 4: Render blocker and door placeholders on the board

**Files:**
- Modify: `src/board/BoardView.ts`

**Interfaces:**
- Consumes: `PuzzleState.isBlocker()`
- Consumes: `PuzzleState.getDoor()`
- Does not change `CellView`

- [ ] **Step 1: Extend fixed-marker selection**

In `BoardView.createCells()`, keep monster/chest precedence and extend the current `fixedMarker` selection:

```ts
if (
  this.puzzle.isMonster(
    x,
    y,
  )
) {
  fixedMarker = 'M';
} else if (
  this.puzzle.isChest(
    x,
    y,
  )
) {
  fixedMarker = 'C';
} else if (
  this.puzzle.isBlocker(
    x,
    y,
  )
) {
  fixedMarker = 'X';
} else {
  const door =
    this.puzzle.getDoor(
      x,
      y,
    );

  if (door !== null) {
    fixedMarker =
      door.orientation ===
      'horizontal'
        ? '↔'
        : '↕';
  }
}
```

The existing `CellView` already makes every non-null `fixedMarker` non-interactive, so no input change is required.

- [ ] **Step 2: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual placeholder check**

Run:

```bash
npm run dev
```

At this point old levels contain no blocker/door, so the board should render exactly as before. The visual integration itself is exercised after `level004` is added in Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/board/BoardView.ts
git commit -m "feat: render static field markers"
```

---

### Task 5: Add an integrated blocker + door test level

**Files:**
- Create: `src/data/levels/level004.ts`
- Modify: `src/data/levels/index.ts`
- Modify: `src/dev/validatorSanity.ts`

**Interfaces:**
- Produces: `level004`
- Extends: `?level=4`

- [ ] **Step 1: Create `level004.ts`**

Use this exact fixture:

```ts
import type {
  LevelDefinition,
} from '../../puzzle/types';

export const level004:
  LevelDefinition = {
    id: 'level-004',

    width: 6,
    height: 6,

    rowClues: [
      4,
      4,
      2,
      5,
      4,
      5,
    ],

    columnClues: [
      5,
      3,
      4,
      5,
      3,
      4,
    ],

    monsters: [
      {
        x: 0,
        y: 0,
      },
      {
        x: 5,
        y: 5,
      },
    ],

    chests: [],

    blockers: [
      {
        x: 2,
        y: 1,
      },
    ],

    doors: [
      {
        position: {
          x: 3,
          y: 2,
        },
        orientation: 'horizontal',
      },
    ],

    solution: [
      '..####',
      '#..###',
      '#....#',
      '####.#',
      '####..',
      '#####.',
    ],
  };
```

Semantics of the hidden solution:

```text
M.####
#.X###
#..↔.#
####.#
####..
#####M
```

`X` is metadata at `(2, 1)` and is intentionally represented as `.` in `solution`, because it is not an ordinary clue-counted wall. The horizontal door at `(3, 2)` is framed by ordinary walls at `(3, 1)` and `(3, 3)`.

- [ ] **Step 2: Register level004**

In `src/data/levels/index.ts`:

```ts
import { level004 } from './level004';
```

Export it and append it to `levels`:

```ts
export {
  level001,
  level002,
  level003,
  level004,
};

export const levels:
  readonly LevelDefinition[] = [
    level001,
    level002,
    level003,
    level004,
  ];
```

- [ ] **Step 3: Add integrated sanity coverage**

Import `level004`.

Add:

```ts
{
  name: 'valid level004 solution',
  run: () => {
    checkValidLevel(level004);
  },
},
```

Extend `checkValidLevel()`:

```ts
assert(
  result.doorsValid,
  'Directional doors should be valid.',
);
```

Extend level selection:

```ts
assert(
  resolveLevel('4') === level004,
  'Query level=4 should select level004.',
);
```

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
npm run dev
```

Expected: all sanity checks pass.

- [ ] **Step 5: Manual playtest**

Open:

```text
?level=4
```

Verify:

- `X` is visible and cannot be edited.
- `↔` is visible and cannot be edited.
- Blocker does not contribute to the row/column clue counts.
- Solving to the hidden ordinary-wall layout produces `Dungeon complete!`.
- A wrong wall arrangement that violates the door orientation cannot solve even if row/column numbers happen to match.

- [ ] **Step 6: Commit**

```bash
git add src/data/levels/level004.ts src/data/levels/index.ts src/dev/validatorSanity.ts
git commit -m "feat: add static mechanics test level"
```

---

### Task 6: Update project state documentation

**Files:**
- Modify: `CURRENT_STATE.md`
- Modify: `TREE.txt`

**Interfaces:**
- Documentation only.

- [ ] **Step 1: Document fixed field mechanics**

Add to `CURRENT_STATE.md`:

- Fixed Blocker is immutable, CLOSED, and excluded from wall clues.
- Directional Door is immutable OPEN and validates horizontal/vertical topology.
- Doors cannot be on edges.
- Doors cannot be inside treasure rooms.
- Levels may have `chests: []`.
- `level004` exercises two monsters, no chest, blocker, and directional door.

- [ ] **Step 2: Correct stale board-size wording**

Replace the stale statement that rendering is specifically `6×6` with wording that rendering follows `LevelDefinition.width` / `height` and currently exercises 6×6 and 7×7 levels.

- [ ] **Step 3: Update TREE**

Add:

```text
docs/superpowers/plans/2026-09-01-static-field-mechanics.md
src/data/levels/level004.ts
```

- [ ] **Step 4: Final verification**

Run:

```bash
npm run build
npm run dev
```

Manually confirm `?level=1`, `?level=3`, and `?level=4`.

Expected:

- old 6×6 level still works;
- old 7×7 level still works;
- new static-mechanics level works;
- all dev sanity checks pass.

- [ ] **Step 5: Commit**

```bash
git add CURRENT_STATE.md TREE.txt
git commit -m "docs: record static field mechanics"
```

---

## Final Review Checklist

- `CellState` still contains only Unknown, Wall, Floor.
- Old levels explicitly use `blockers: []` and `doors: []`.
- Blocker cannot be edited.
- Door cannot be edited.
- Blocker never increments wall clue counts.
- Blocker is CLOSED for connectivity, dead ends, rooms, and 2×2 topology.
- Door is OPEN for connectivity, dead ends, and 2×2 topology.
- Door orientation requires two opposite OPEN neighbors.
- The two perpendicular neighbors must be ordinary WALL cells.
- Fixed Blocker cannot replace a WALL framing a directional door.
- Edge door returns `doorsValid: false`.
- Door inside treasure room prevents that room candidate from being valid.
- `isSolved` requires `doorsValid`.
- `chests: []` continues to produce an empty valid room layout.
- Runtime victory never compares against `level.solution`.
- `level004` hidden solution passes the complete validator.
- `npm run build` passes.
- Local validator sanity suite passes.
- Old levels still play.
