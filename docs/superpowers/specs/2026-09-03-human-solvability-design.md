# Human Solvability Analyzer Design

## 1. Purpose

Dungeon Logic already has a deterministic uniqueness solver. `solveLevel()` answers whether a `LevelDefinition` has `0`, `1`, or `2+` valid WALL / OPEN solutions. It is allowed to use deterministic DFS after propagation.

That is necessary for content correctness, but it does not answer a different product question:

> Can a player reach the unique solution by understandable logical deductions without guessing?

This slice adds a separate pure-TypeScript Human Solvability Analyzer. It must model player-facing deductions, preserve explanations for every committed step, and distinguish direct deduction from a bounded proof by contradiction.

It is a diagnostic/content-review system first. It is not a gameplay hint system and it is not a Generator acceptance gate in this slice.

---

## 2. Non-goals

This slice does not:

- change `LevelValidator`;
- change `PuzzleSolver` uniqueness semantics;
- replace `solveLevel()`;
- change Generator v1.2 acceptance, ranking, novelty, Monster density, or A+ coverage;
- auto-promote generated candidates;
- assign final `easy / medium / hard` labels;
- add runtime hint UI;
- solve from the player's current `PuzzleState`;
- allow unrestricted DFS;
- allow nested contradiction assumptions;
- use hidden `level.solution` as an oracle.

Generated analysis may read `.generated/candidates-<seed>.json` only through a dev CLI.

---

## 3. Core classification

The analyzer returns exactly one of four statuses:

```ts
export const HumanSolveStatus = {
  SolvedDirect: 'solved-direct',
  SolvedWithContradiction:
    'solved-with-contradiction',
  Stuck: 'stuck',
  Invalid: 'invalid',
} as const;
```

### `solved-direct`

The analyzer reaches a valid complete board using only direct, explainable deductions.

### `solved-with-contradiction`

Direct deductions reach a fixed point before the puzzle is complete. One or more bounded contradiction deductions are then required. Every contradiction proof uses exactly one temporary assumption and only direct deductions under that assumption.

### `stuck`

The board remains incomplete after:

1. exhausting direct deductions;
2. checking every currently unassigned mutable cell for a single-assumption contradiction deduction.

`stuck` does not mean unsatisfiable or non-unique. It means the current human-rule vocabulary cannot prove another move without deeper search.

### `invalid`

The analyzer reaches a contradiction that applies to the committed state, or reaches a complete assignment that does not satisfy `LevelValidator`.

For accepted generated candidates and registered authored levels this status should normally never occur; it exists to keep the API total and useful for sanity fixtures.

---

## 4. Reuse of existing solver state

The analyzer reuses `src/puzzle/solver/SearchState.ts`.

Reasons:

- `SearchState` already represents `UNASSIGNED / WALL / OPEN`;
- fixed Monster, Chest, and Directional Door cells already begin OPEN;
- Fixed Blockers already remain CLOSED metadata (`null`);
- reversible `checkpoint()` / `rollback()` already exist;
- row / column status already exists;
- potential-connectivity feasibility already exists;
- current Treasure Room candidate viability already exists.

The Human Solvability Analyzer must not call the existing DFS search loop.

The existing `PuzzleSolver` remains the machine solver and uniqueness authority.

`SearchState` may receive small read-only query helpers required by human rules, but its existing assignment and rollback semantics must stay unchanged.

---

## 5. Public API

Create:

```text
src/puzzle/human-solver/
  HumanSolver.ts
  DirectDeductionEngine.ts
  ContradictionEngine.ts
  types.ts
```

Public entry point:

```ts
export function analyzeHumanSolvability(
  level: LevelDefinition,
): HumanSolveResult;
```

Types:

```ts
export const HumanDeductionTier = {
  Direct: 'direct',
  Contradiction: 'contradiction',
} as const;

export const HumanRule = {
  LineComplete: 'line-complete',
  LineFill: 'line-fill',
  Door: 'door',
  TreasureRoomInterior:
    'treasure-room-interior',
  TreasureRoomEntrance:
    'treasure-room-entrance',
  MonsterDeadEnd: 'monster-dead-end',
  HallwayNotDeadEnd:
    'hallway-not-dead-end',
  Open2x2: 'open-2x2',
  Connectivity: 'connectivity',
  Contradiction: 'contradiction',
} as const;

export interface HumanAssignment {
  position: GridPosition;
  value:
    | typeof SearchCellState.Wall
    | typeof SearchCellState.Open;
}

export interface HumanContradictionProof {
  assumption: HumanAssignment;
  deductions:
    readonly HumanProofStep[];
  contradiction: string;
}

export interface HumanProofStep {
  rule: Exclude<
    HumanRule,
    typeof HumanRule.Contradiction
  >;
  assignments:
    readonly HumanAssignment[];
  explanation: string;
}

export interface HumanSolveStep {
  index: number;
  tier: HumanDeductionTier;
  rule: HumanRule;
  assignments:
    readonly HumanAssignment[];
  explanation: string;
  proof:
    HumanContradictionProof | null;
}

export interface HumanSolveResult {
  status: HumanSolveStatus;
  directSteps: number;
  contradictionSteps: number;
  assignments: number;
  unknownRemaining: number;
  ruleCounts:
    Readonly<Record<HumanRule, number>>;
  steps: readonly HumanSolveStep[];
}
```

A direct step may contain several assignments when one human reason forces several cells, for example “row 4 already has all required walls, therefore these four remaining cells are OPEN”.

`assignments` counts committed cell assignments, not proof-only temporary assignments.

---

## 6. Determinism

Human analysis must be deterministic.

Direct rule order:

```text
1. row clues, y ascending
2. column clues, x ascending
3. Directional Doors, source order
4. Treasure Rooms, Chest source order
5. Monsters, source order
6. non-Monster hallway dead-end prevention, y then x
7. forbidden OPEN 2x2 windows, y then x
8. mandatory connectivity cut cells, y then x
```

The engine applies the first available deduction, records one `HumanSolveStep`, then restarts rule scanning from rule 1.

This produces a stable explanation trace and avoids output changing merely because a later rule can also make the same assignment.

Contradiction candidate order is stable y then x. For one position test `WALL` first and `OPEN` second.

---

## 7. Direct deduction semantics

### 7.1 Row / column completion

For a line:

```text
wallsNeeded = target - wallsPlaced
```

If:

```text
wallsNeeded == 0
```

all mutable UNASSIGNED cells in the line are OPEN.

Rule:

```text
line-complete
```

If:

```text
wallsNeeded == unassigned.length
```

all mutable UNASSIGNED cells in the line are WALL.

Rule:

```text
line-fill
```

If:

```text
wallsNeeded < 0
or
wallsNeeded > unassigned.length
```

the current state is contradictory.

The explanation identifies row/column index, clue target, walls already placed, and number of remaining cells.

---

### 7.2 Directional Door

Reuse the public dungeon rule exactly:

Horizontal Door:

```text
left/right = OPEN
up/down = ordinary WALL
```

Vertical Door:

```text
up/down = OPEN
left/right = ordinary WALL
```

A Fixed Blocker cannot substitute for a required ordinary framing WALL.

The explanation identifies the Door position and orientation.

---

### 7.3 Treasure Room

Human reasoning uses only currently viable 3x3 room candidates.

If one Chest has zero viable candidates, the state is contradictory.

If more than one viable candidate remains, this slice performs no common-cell intersection deduction.

If exactly one viable candidate remains:

- every mutable UNASSIGNED interior cell becomes OPEN;
- if exactly one boundary cell is already OPEN, every remaining mutable UNASSIGNED boundary cell becomes WALL;
- if zero boundary cells are OPEN and exactly one boundary cell remains capable of becoming OPEN, that cell becomes OPEN;
- if two or more boundary cells are OPEN, contradiction;
- if no boundary cell can become OPEN, contradiction.

Rules:

```text
treasure-room-interior
treasure-room-entrance
```

The explanation names the Chest and the selected room top-left or its 3x3 bounds.

---

### 7.4 Monster dead end

A Monster is a fixed OPEN hallway cell and must finish with exactly one orthogonally adjacent OPEN cell.

For each Monster inspect in-board orthogonal neighbors:

- `OPEN` is a confirmed exit;
- `UNASSIGNED` is a possible exit;
- WALL / Blocker / out-of-board is closed.

Contradictions:

```text
confirmedOpen > 1
confirmedOpen == 0 && possibleOpen == 0
```

Deductions:

```text
confirmedOpen == 1
=> all remaining possible exits WALL

confirmedOpen == 0 && possibleOpen == 1
=> last possible exit OPEN
```

Rule:

```text
monster-dead-end
```

---

### 7.5 Every hallway dead end contains a Monster

This rule is applied only to a confirmed OPEN non-Monster cell that is proven hallway space.

A cell is proven hallway space when it cannot belong to any currently viable Treasure Room candidate.

A non-Monster hallway cell may not finish with degree 1.

Let:

```text
confirmedOpen =
  orthogonal neighbors currently OPEN

possibleOpen =
  orthogonal neighbors currently UNASSIGNED
```

If:

```text
confirmedOpen + possibleOpen < 2
```

the state is contradictory.

If:

```text
confirmedOpen == 1
and
possibleOpen == 1
```

the last possible neighbor must become OPEN.

Other cases do not force a single cell in this slice.

Rule:

```text
hallway-not-dead-end
```

This is intentionally conservative while Treasure Room placement remains ambiguous.

---

### 7.6 Forbidden OPEN 2x2

A 2x2 window may be fully OPEN only when it can belong to a currently viable Treasure Room.

Therefore the human rule is applied only when no currently viable Treasure Room candidate contains all four cells of that 2x2 window.

If all four cells are confirmed OPEN:

```text
contradiction
```

If exactly three are OPEN and the fourth is mutable UNASSIGNED:

```text
fourth = WALL
```

Rule:

```text
open-2x2
```

No deduction is made when a viable Treasure Room could still legally contain that 2x2.

---

### 7.7 Mandatory connectivity cut cell

All final OPEN cells must form one orthogonally connected region.

A mutable UNASSIGNED cell is directly forced OPEN when removing only that cell from the current potential-OPEN graph would make already mandatory OPEN cells impossible to connect.

This is a graph cut-cell deduction. It must not run other deduction rules under a temporary assumption.

Conceptually:

```text
potential graph =
  OPEN + UNASSIGNED traversable cells

closed =
  WALL + Blocker

mandatory terminals =
  currently confirmed OPEN cells
```

For each UNASSIGNED mutable cell in y→x order:

1. omit that cell from the potential graph;
2. flood from one mandatory OPEN cell;
3. if another mandatory OPEN cell becomes unreachable, the omitted cell is required OPEN.

Rule:

```text
connectivity
```

If there are fewer than two mandatory OPEN cells, no connectivity deduction is available.

---

## 8. Direct fixed point

`DirectDeductionEngine` exposes a routine conceptually equivalent to:

```ts
runDirectFixedPoint(
  state: SearchState,
  mode: 'committed' | 'proof',
): DirectRunResult
```

Behavior:

1. validate cheap direct contradictions;
2. find the first deterministic direct deduction;
3. apply all assignments in that step through `SearchState.assign()`;
4. record the step;
5. restart scanning from row clues;
6. stop when no direct rule can make progress.

It does not call contradiction reasoning.

For proof mode it returns proof steps without incrementing committed result counters.

---

## 9. Single-assumption contradiction

Contradiction reasoning is entered only after direct fixed point stalls on an incomplete state.

For each UNASSIGNED mutable position in y→x order:

```text
test assumption WALL
test assumption OPEN
```

One assumption probe:

1. create a checkpoint;
2. assign the temporary assumption;
3. run direct fixed point only;
4. detect contradiction from direct rules / line feasibility / room viability / Monster rules / 2x2 / connectivity feasibility;
5. rollback to the checkpoint.

Nested contradiction is forbidden.

Outcomes for one cell:

### Neither assumption contradicts

No deduction.

### WALL contradicts, OPEN survives

Commit:

```text
cell = OPEN
```

as one `contradiction` step.

### OPEN contradicts, WALL survives

Commit:

```text
cell = WALL
```

as one `contradiction` step.

### Both contradict

The committed state is `invalid`.

After committing one contradiction step, return to the full direct fixed point before searching for another contradiction.

A contradiction step stores:

- the failed assumption;
- the direct proof deductions produced under that assumption;
- the final contradiction explanation.

Temporary proof assignments do not count toward `HumanSolveResult.assignments`.

---

## 10. Solved-state validation

When no mutable UNASSIGNED cells remain:

1. materialize the `SearchState` assignment into a new `PuzzleState`;
2. set ordinary WALL cells;
3. call the existing `validatePuzzle()`;
4. return solved only when `validation.isSolved === true`.

The Human Solver never compares against `level.solution`.

A complete assignment rejected by `LevelValidator` returns `invalid`.

---

## 11. Difficulty data, not difficulty labels

This slice records evidence only:

- direct step count;
- contradiction step count;
- committed assignment count;
- unknown cells at stall;
- count per rule;
- full deterministic explanation trace.

It does not convert these values into `easy / medium / hard`.

After authored levels and generated shortlist candidates are analyzed, a later design can decide whether a calibrated difficulty model is justified.

---

## 12. Dev analysis CLI

Create:

```text
src/dev/analyzeHumanSolvability.ts
```

Add package script:

```json
"analyze:human": "tsx src/dev/analyzeHumanSolvability.ts"
```

Supported initial modes:

```powershell
npm run analyze:human -- --authored
```

Analyzes registered `level001` through `level012`.

```powershell
npm run analyze:human -- --seed 123456 --shortlist
```

Reads:

```text
.generated/candidates-123456.json
```

and analyzes exactly `report.shortlist[].accepted.candidate.level`.

The CLI validates:

```text
schemaVersion === 1
masterSeed === requested seed
shortlist is an array
```

Malformed or missing generated input exits non-zero with a human-readable message.

Generated analysis does not regenerate candidates.

For seed mode write ignored diagnostics:

```text
.generated/human-analysis-123456.json
.generated/human-analysis-123456.md
```

The Markdown summary contains candidate id, archetype, size, status, direct steps, contradiction steps, assignments, unknown remaining, and rule counts.

The JSON contains the same summary plus full `steps`.

---

## 13. Generator integration is deferred

Human solvability is observational in this slice.

Do not add:

```text
human-stuck
human-contradiction
```

to Generator rejection reasons.

Do not change:

```text
CandidateFactory
CandidateRanker
profileGenerator
generatorSanity acceptance policy
```

After the analyzer has been compared with real playtest experience, a future Generator v1.3 design may decide whether:

- `stuck` candidates should be rejected;
- contradiction count should be capped;
- human-solvability data should affect ranking;
- specific deduction rules should define progression tiers.

Those decisions require evidence from this analyzer and are explicitly out of scope now.

---

## 14. Required validation set

Before this slice is documented as complete:

1. dedicated human-solver sanity is GREEN;
2. existing solver sanity is GREEN;
3. Treasure Room pruning sanity is GREEN;
4. generator sanity is GREEN;
5. profiler sanity is GREEN;
6. build is GREEN;
7. authored `level001`–`level012` can all be analyzed without crashes;
8. seed `123456` shortlist can all be analyzed without crashes;
9. repeated seed `123456` analysis is deterministic after excluding no fields;
10. no generated candidate is automatically accepted/rejected differently from Generator v1.2.

The actual status distribution for authored and seed-123456 content must be recorded only after running the implementation. Do not predict those results in advance.
