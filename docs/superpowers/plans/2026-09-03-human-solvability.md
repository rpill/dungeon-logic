# Human Solvability Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic pure-TypeScript analyzer that classifies a Dungeon Logic level as directly solvable, solvable with one-level proof by contradiction, stuck, or invalid, while recording explainable human deduction steps.

**Architecture:** Reuse the existing rollback-friendly `SearchState`, but keep the current DFS `PuzzleSolver` unchanged. A new direct-deduction engine applies named player-explainable rules to a fixed point; a separate contradiction engine may make exactly one temporary WALL/OPEN assumption and run only direct deductions underneath it. A dev CLI analyzes authored levels and generated shortlist reports without changing Generator v1.2 acceptance.

**Tech Stack:** TypeScript 6, Node 22 / `tsx`, Vite 8, existing Dungeon Logic puzzle core. No Phaser dependency inside `src/puzzle/human-solver/`.

**Spec:** `docs/superpowers/specs/2026-09-03-human-solvability-design.md`

## Global Constraints

- `level.solution` must never guide human analysis.
- Existing `solveLevel()` and `solveLevelWithDiagnostics()` semantics remain unchanged.
- Existing DFS search remains the uniqueness solver and is never called by the Human Solver.
- `LevelValidator` remains final authority for a complete committed board.
- Contradiction depth is exactly one assumption; no nested contradiction calls.
- A contradiction probe may run direct deductions to a fixed point.
- Direct deduction order is deterministic and matches the spec.
- Monster, Chest, and Directional Door remain fixed OPEN.
- Fixed Blocker remains CLOSED metadata, never clue-counted WALL.
- Treasure Room deductions are conservative while more than one room candidate remains.
- Human solvability does not affect Generator v1.2 acceptance or ranking in this slice.
- No `easy / medium / hard` thresholds in this slice.
- No Phaser imports in `src/puzzle/human-solver/`.
- No TypeScript enums; preserve `erasableSyntaxOnly`.
- Every production change follows RED → observed failure → minimal GREEN → verification.
- Do not commit RED states.
- Run PowerShell commands one per line.
- Preserve current generated-playtest query mode and adaptive GameScene layout; this plan does not modify those systems.

---

## File Structure

### Create

```text
src/puzzle/human-solver/
  ContradictionEngine.ts
  DirectDeductionEngine.ts
  HumanSolver.ts
  types.ts

src/dev/
  analyzeHumanSolvability.ts
  humanSolverSanity.ts
```

### Modify

```text
src/puzzle/solver/SearchState.ts
package.json
CURRENT_STATE.md
TREE.txt
```

### Intentionally unchanged

```text
src/puzzle/LevelValidator.ts
src/puzzle/PuzzleState.ts
src/puzzle/solver/PuzzleSolver.ts
src/puzzle/solver/types.ts
src/puzzle/generator/CandidateFactory.ts
src/puzzle/generator/CandidateRanker.ts
src/dev/generatorSanity.ts
src/dev/profileGenerator.ts
src/dev/profilerSanity.ts
src/scenes/GameScene.ts
vite.config.ts
```

`src/dev/generatorSanity.ts` and profiler files are still run for regression verification; they are not modified unless a genuinely unrelated existing failure is discovered.

---

# Task 1: Add human-solver contracts and direct line deductions

**Files:**
- Create: `src/puzzle/human-solver/types.ts`
- Create: `src/puzzle/human-solver/DirectDeductionEngine.ts`
- Create: `src/puzzle/human-solver/HumanSolver.ts`
- Create: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces: `HumanSolveStatus`
- Produces: `HumanDeductionTier`
- Produces: `HumanRule`
- Produces: `HumanAssignment`
- Produces: `HumanSolveStep`
- Produces: `HumanSolveResult`
- Produces: `analyzeHumanSolvability(level): HumanSolveResult`
- Produces internal direct fixed-point runner used by later tasks.

- [ ] **Step 1: RED — add a direct line-only solvable fixture**

Create `src/dev/humanSolverSanity.ts` with a standalone 3×3 corridor fixture:

```ts
const directCorridor: LevelDefinition = {
  id: 'human-direct-corridor',
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
```

The test dynamically imports the future module so RED is an assertion failure rather than a compile failure, then expects:

```ts
result.status === 'solved-direct'
result.contradictionSteps === 0
result.unknownRemaining === 0
result.steps.length > 0
result.steps.every(
  (step) => step.tier === 'direct',
)
```

Also assert every committed assignment agrees with the final validated board by requiring `status === 'solved-direct'`.

- [ ] **Step 2: Run RED**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

Expected RED:

```text
Human solvability analyzer must exist.
```

- [ ] **Step 3: GREEN — create exact public constants and types**

In `types.ts` add the contracts from the design spec. Use object constants plus indexed union types, not TypeScript enums.

Initialize `ruleCounts` with every `HumanRule` key present at zero.

- [ ] **Step 4: GREEN — implement line deduction discovery**

`DirectDeductionEngine.ts` must expose an internal result shape:

```ts
export type DirectFixedPointResult =
  | {
      ok: true;
      steps: readonly HumanProofStep[];
    }
  | {
      ok: false;
      steps: readonly HumanProofStep[];
      contradiction: string;
    };
```

Implement deterministic line scanning in this order:

```text
rows y=0..height-1
columns x=0..width-1
```

For each line:

```ts
const wallsNeeded =
  status.target -
  status.wallsPlaced;
```

Contradiction:

```ts
wallsNeeded < 0 ||
wallsNeeded >
  status.unassigned.length
```

Deduction:

```ts
wallsNeeded === 0
=> all unassigned OPEN
=> rule line-complete

wallsNeeded ===
  status.unassigned.length
=> all unassigned WALL
=> rule line-fill
```

Apply one human reason at a time, then restart row scanning.

- [ ] **Step 5: GREEN — implement initial `analyzeHumanSolvability()`**

Algorithm for Task 1:

```text
new PuzzleState(level) for metadata validation
new SearchState(level)
run direct line fixed point
if contradiction -> invalid
if complete -> materialize + LevelValidator
if not complete -> stuck
```

Materialization must create a new `PuzzleState(level)` and set ordinary WALL cells only. Never read `level.solution`.

Counts:

```text
directSteps =
  committed direct step count

contradictionSteps = 0

assignments =
  sum(committed step assignments)

unknownRemaining =
  state.getUnassignedMutablePositions().length
```

- [ ] **Step 6: Verify Task 1 GREEN**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

Expected: direct fixture passes.

```powershell
npm run build
```

Expected: build GREEN.

Do not commit yet if the project is still carrying the generated-playtest/adaptive-layout worktree changes; keep this slice isolated in staging later.

---

# Task 2: Add Door and singleton Treasure Room deductions with explanations

**Files:**
- Modify: `src/puzzle/solver/SearchState.ts`
- Modify: `src/puzzle/human-solver/DirectDeductionEngine.ts`
- Modify: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces a read-only public solver query for viable Treasure Room candidates.
- Adds direct rules `door`, `treasure-room-interior`, and `treasure-room-entrance`.

- [ ] **Step 1: RED — Door deduction fixture**

Add a 3×3 fixture with a horizontal Door at `(1,1)`.

Before any row/column clue can force the four framing cells, expect direct trace to contain a `door` step assigning:

```text
(0,1) OPEN
(2,1) OPEN
(1,0) WALL
(1,2) WALL
```

Use clues compatible with those assignments.

Assert the Door step explanation contains:

```text
horizontal
(1,1)
```

- [ ] **Step 2: Run RED**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

Expected: Door-rule assertion fails.

- [ ] **Step 3: GREEN — implement deterministic Door rule**

Scan `state.level.doors` in source order.

Do not allow a Blocker to satisfy a required framing WALL. If a required ordinary-wall position is not assignable as WALL, return a direct contradiction.

If a required value is already present, it is not a new assignment.

Record one `door` step containing every newly forced assignment for that Door.

- [ ] **Step 4: RED — expose viable room candidates for explanation**

Add a sanity check that a corner Chest on a 4×4 board exposes exactly one currently viable 3×3 room candidate and that the candidate exposes:

```ts
cells
boundary
```

Current `SearchState` keeps viable-candidate calculation private, so RED must fail until a read-only query exists.

- [ ] **Step 5: GREEN — add read-only Treasure Room query**

In `SearchState.ts` promote the internal room-candidate view to a solver-only exported type, for example:

```ts
export interface TreasureRoomCandidate {
  cells: readonly GridPosition[];
  boundary: readonly GridPosition[];
}
```

Add:

```ts
getViableTreasureRoomCandidates(
  chest: GridPosition,
): readonly TreasureRoomCandidate[]
```

Return the same candidates used by existing solver viability logic. Do not create a second definition of viability.

Keep current `getSingleViableTreasureRoomCandidate()` working by delegating to the new public query.

- [ ] **Step 6: RED — singleton room deductions**

Use a 4×4 Chest-at-corner fixture where only room `(0,0)..(2,2)` can exist.

Expect human steps:

```text
treasure-room-interior
```

forcing all mutable UNASSIGNED room cells OPEN.

Then construct a partial fixture where boundary `(3,1)` is already OPEN and expect:

```text
treasure-room-entrance
```

forcing all remaining mutable boundary cells WALL.

Add a second case with no confirmed OPEN boundary and exactly one possible boundary cell; expect that cell OPEN.

- [ ] **Step 7: GREEN — implement singleton Treasure Room rules**

For each Chest in source order:

```text
0 viable
=> contradiction

>1 viable
=> no human deduction in this slice

1 viable
=> force interior OPEN
=> apply exact-one-entrance boundary logic
```

Record room bounds or top-left in explanations.

Do not add common-cell reasoning across multiple candidates.

- [ ] **Step 8: Verify Task 2**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

```powershell
npm run build
```

All GREEN.

---

# Task 3: Add Monster and non-Monster hallway dead-end reasoning

**Files:**
- Modify: `src/puzzle/solver/SearchState.ts`
- Modify: `src/puzzle/human-solver/DirectDeductionEngine.ts`
- Modify: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces: conservative room-membership query for one position.
- Adds: `monster-dead-end`
- Adds: `hallway-not-dead-end`

- [ ] **Step 1: RED — Monster with one confirmed exit closes all other exits**

Fixture:

```text
Monster at (1,1)
(1,0) already OPEN
(0,1), (2,1), (1,2) mutable UNASSIGNED
```

Expect one `monster-dead-end` step assigning the three remaining neighbors WALL.

Also add:

```text
Monster with zero OPEN + exactly one UNASSIGNED neighbor
=> last neighbor OPEN
```

and contradiction cases:

```text
Monster with two confirmed OPEN neighbors
Monster with no confirmed or possible exit
```

- [ ] **Step 2: Run RED**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

Expected: Monster rule assertions fail.

- [ ] **Step 3: GREEN — implement Monster rule**

Treat:

```text
out-of-board = CLOSED
Blocker = CLOSED
WALL = CLOSED
OPEN = confirmed exit
UNASSIGNED mutable = possible exit
```

Scan Monsters in `level.monsters` source order.

Record the Monster coordinate in each explanation.

- [ ] **Step 4: RED — conservative hallway classification**

Add tests for a Chest level where:

- a cell included in any currently viable Treasure Room candidate is not proven hallway;
- a cell included in none of the viable candidates is proven hallway.

Expected new SearchState query:

```ts
canBelongToAnyViableTreasureRoom(
  position: GridPosition,
): boolean
```

No-Chest levels return `false` for every ordinary position.

- [ ] **Step 5: GREEN — add room-membership query**

Implement `canBelongToAnyViableTreasureRoom()` by checking the same current viable-candidate lists exposed in Task 2.

Do not use hidden generated `rooms` metadata; Human Solver operates on `LevelDefinition` only.

- [ ] **Step 6: RED — non-Monster hallway cannot become a dead end**

Construct a proven hallway OPEN cell with:

```text
one confirmed OPEN neighbor
one UNASSIGNED possible neighbor
all other neighbors closed
```

and no Monster on that cell.

Expect:

```text
last possible neighbor = OPEN
rule hallway-not-dead-end
```

Add contradiction:

```text
confirmedOpen + possibleOpen < 2
```

for a proven hallway non-Monster cell.

Do not apply this rule to a cell that can still belong to a viable Treasure Room.

- [ ] **Step 7: GREEN — implement hallway dead-end prevention**

Scan board y then x.

Only inspect cells that are:

```text
SearchCellState.Open
not Monster
not Chest
not Directional Door special handling
proven outside every viable Treasure Room
```

A Door remains hallway OPEN topology, but its own direct constraints should have run earlier; it may be included as a non-Monster hallway cell only if existing dungeon semantics allow it. If this reveals a mismatch with `LevelValidator`, preserve validator semantics and add a regression fixture before changing behavior.

- [ ] **Step 8: Verify Task 3**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npm run build
```

Both GREEN.

---

# Task 4: Add forbidden OPEN 2x2 and mandatory-connectivity cut-cell deductions

**Files:**
- Modify: `src/puzzle/solver/SearchState.ts`
- Modify: `src/puzzle/human-solver/DirectDeductionEngine.ts`
- Modify: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces a conservative query for whether a cell set can fit inside a viable Treasure Room.
- Adds: `open-2x2`
- Adds: `connectivity`

- [ ] **Step 1: RED — 2x2 outside rooms forces fourth cell WALL**

No-Chest fixture with one 2x2 window:

```text
OPEN OPEN
OPEN ?
```

Expect:

```text
? = WALL
rule open-2x2
```

Add contradiction for four confirmed OPEN cells.

- [ ] **Step 2: RED — possible Treasure Room suppresses the 2x2 deduction**

Create a Chest fixture where the same four cells are contained in at least one currently viable 3x3 room candidate.

Expect no `open-2x2` deduction for that window.

- [ ] **Step 3: GREEN — add shared viable-room containment query**

In `SearchState` add:

```ts
canCellSetBelongToAnyViableTreasureRoom(
  positions: readonly GridPosition[],
): boolean
```

Return true when one currently viable room candidate contains every requested position.

The 2x2 rule scans windows by top-left y then x and applies only when this query returns false.

- [ ] **Step 4: RED — connectivity cut cell**

Build a partial state where two confirmed OPEN regions can only be connected through one UNASSIGNED bridge cell.

Expected:

```text
bridge = OPEN
rule connectivity
```

Also assert no connectivity deduction when:

```text
mandatory OPEN count < 2
```

or when an alternate UNASSIGNED path remains.

- [ ] **Step 5: GREEN — implement direct graph cut-cell test**

Do not call contradiction engine.

For each mutable UNASSIGNED cell in y→x order:

1. treat that cell as removed only for the graph check;
2. treat WALL and Blocker as closed;
3. treat OPEN and every other UNASSIGNED cell as traversable;
4. collect confirmed OPEN cells as mandatory terminals;
5. flood from the first terminal;
6. if another terminal is unreachable, return one `connectivity` deduction assigning the tested cell OPEN.

This rule is a direct graph theorem over the current potential-open graph, not a nested assumption.

- [ ] **Step 6: Verify Task 4**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npm run build
```

Both GREEN.

---

# Task 5: Add bounded single-assumption contradiction reasoning

**Files:**
- Create: `src/puzzle/human-solver/ContradictionEngine.ts`
- Modify: `src/puzzle/human-solver/HumanSolver.ts`
- Modify: `src/puzzle/human-solver/types.ts`
- Modify: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces one deterministic contradiction deduction or no deduction.
- Contradiction probes invoke direct fixed point only.
- Produces `HumanContradictionProof`.

- [ ] **Step 1: RED — direct stall returns `stuck` before contradiction exists**

Keep a fixture whose committed state reaches a direct fixed point with UNASSIGNED cells.

Assert the current pre-Task-5 analyzer returns:

```text
stuck
```

This locks the separation between direct and contradiction tiers.

- [ ] **Step 2: RED — test one-assumption proof mechanics without nested search**

Add an internal sanity helper that constructs a `SearchState`, chooses one UNASSIGNED cell, and calls the future contradiction engine directly.

The fixture must arrange a temporary assumption so direct deductions end in a known contradiction. Assert the returned proof contains:

```ts
assumption
deductions
contradiction
```

and that after the probe the original state's:

```ts
checkpoint()
getCellState()
getUnassignedMutablePositions()
```

are unchanged.

Also instrument the direct runner in the sanity test to ensure the contradiction engine never calls itself recursively.

- [ ] **Step 3: Run RED**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

Expected: contradiction-engine import/API missing or contradiction assertion failure.

- [ ] **Step 4: GREEN — implement assumption probe**

For one position and one value:

```text
checkpoint
assign assumption
run direct fixed point in proof mode
run cheap committed-state feasibility checks
capture proof
rollback
```

Proof mode must never enter `ContradictionEngine`.

A failed initial assignment is an immediate contradiction for that assumption.

- [ ] **Step 5: GREEN — deterministic contradiction scan**

After a committed direct stall:

```text
for unassigned positions y→x:
  probe WALL
  probe OPEN
```

Outcomes:

```text
WALL fails, OPEN survives
=> commit OPEN

OPEN fails, WALL survives
=> commit WALL

both fail
=> invalid

neither fails
=> continue
```

Commit exactly one contradiction deduction, record it, then return to the full direct fixed point.

- [ ] **Step 6: GREEN — final status classification**

The main loop becomes:

```text
direct fixed point
if contradiction -> invalid
if complete -> validate complete board
try one contradiction deduction
if committed -> repeat
if none -> stuck
```

If solved and `contradictionSteps === 0`:

```text
solved-direct
```

If solved and `contradictionSteps > 0`:

```text
solved-with-contradiction
```

- [ ] **Step 7: Verify Task 5**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npx tsx src/dev/solverSanity.ts
```

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

```powershell
npm run build
```

All GREEN.

---

# Task 6: Add authored/generated analysis CLI and deterministic reports

**Files:**
- Create: `src/dev/analyzeHumanSolvability.ts`
- Modify: `package.json`
- Modify: `src/dev/humanSolverSanity.ts`

**Interfaces:**
- Produces `npm run analyze:human -- --authored`
- Produces `npm run analyze:human -- --seed <uint32> --shortlist`
- Writes `.generated/human-analysis-<seed>.json`
- Writes `.generated/human-analysis-<seed>.md`

- [ ] **Step 1: RED — CLI argument parser**

Add exported pure parser:

```ts
export type HumanAnalysisCliMode =
  | {
      mode: 'authored';
    }
  | {
      mode: 'shortlist';
      seed: number;
    };
```

Valid:

```text
--authored
--seed 123456 --shortlist
```

Invalid:

```text
no mode
--authored plus --shortlist
negative seed
seed > 4294967295
non-integer seed
--seed without --shortlist
```

Sanity expects invalid combinations to throw descriptive errors.

- [ ] **Step 2: GREEN — implement parser and package script**

Add:

```json
"analyze:human": "tsx src/dev/analyzeHumanSolvability.ts"
```

Keep existing package scripts unchanged.

- [ ] **Step 3: RED — generated report type guard**

Add pure loader validation tests for:

```text
schemaVersion === 1
masterSeed === requested seed
Array.isArray(shortlist)
each shortlist entry has accepted.candidate.level
```

Malformed input must fail before analysis.

- [ ] **Step 4: GREEN — authored mode**

Import the registered levels from `src/data/levels/index.ts`.

Analyze exactly the current authored registry in registry order.

Print for each level:

```text
id
size
status
direct
contradiction
assignments
unknown
rule counts
```

Do not infer difficulty labels.

- [ ] **Step 5: GREEN — shortlist mode**

Read:

```text
.generated/candidates-<seed>.json
```

Do not regenerate.

Analyze:

```ts
report.shortlist.map(
  (entry) =>
    entry.accepted.candidate,
)
```

Preserve shortlist order.

Write:

```text
.generated/human-analysis-<seed>.json
.generated/human-analysis-<seed>.md
```

JSON must include full `HumanSolveResult.steps`.

Markdown must include the candidate id, archetype, size, status, counters, and compact rule counts.

- [ ] **Step 6: RED/GREEN — deterministic serialization**

Run the shortlist analysis twice on the same fixture report in a temporary directory and compare the produced JSON and Markdown bytes.

No timestamp or elapsed duration may be written into deterministic output.

- [ ] **Step 7: Verify Task 6**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npm run build
```

Both GREEN.

---

# Task 7: Calibrate on authored levels and seed 123456 without changing Generator policy

**Files:**
- Modify tests only if a real analyzer bug is discovered.
- Do not modify Generator acceptance files in response to status distribution.

**Interfaces:**
- Consumes final analyzer and CLI.
- Produces verified content-analysis evidence.

- [ ] **Step 1: Analyze authored levels**

```powershell
npm run analyze:human -- --authored
```

Record actual status and rule-count distribution for `level001`–`level012`.

Do not assume every authored level is human-solvable under the current rule vocabulary. `stuck` is a valid finding.

- [ ] **Step 2: Analyze seed 123456 shortlist**

Ensure the existing generator artifact exists:

```text
.generated/candidates-123456.json
```

Then run:

```powershell
npm run analyze:human -- --seed 123456 --shortlist
```

Expected operational result:

- exactly 15 shortlist candidates analyzed;
- no crashes;
- deterministic JSON and Markdown written;
- statuses are observed, not predeclared.

- [ ] **Step 3: Repeat seed analysis and compare byte hashes**

Run again:

```powershell
npm run analyze:human -- --seed 123456 --shortlist
```

Then in PowerShell:

```powershell
Get-FileHash .generated\human-analysis-123456.json -Algorithm SHA256
Get-FileHash .generated\human-analysis-123456.md -Algorithm SHA256
```

Store the hashes, run once more if necessary, and confirm hashes do not change.

- [ ] **Step 4: Check the five manually playtested candidates**

Find and record actual analyzer result for:

```text
generated-monster-only-7-512302628
generated-mixed-one-room-6-4267384426
generated-mixed-two-rooms-7-4032331667
generated-chest-two-rooms-8-214184125
generated-chest-one-room-8-2568418654
```

For each, capture:

```text
status
directSteps
contradictionSteps
unknownRemaining
ruleCounts
```

These results answer the original question of whether the levels can be completed by the current model of human logic without deeper guessing.

- [ ] **Step 5: Do not tune Generator from these results yet**

Even if several candidates are `stuck`, do not change:

```text
RejectionReason
CandidateFactory
CandidateRanker
Generator v1.2 thresholds
```

A future Generator v1.3 design requires comparing analyzer output with actual playtest experience first.

---

# Task 8: Final regression verification and documentation

**Files:**
- Modify: `CURRENT_STATE.md`
- Modify: `TREE.txt`

**Interfaces:**
- Documentation records only verified implemented behavior and actual calibration results.

- [ ] **Step 1: Run all relevant regression checks before docs**

```powershell
npx tsx src/dev/humanSolverSanity.ts
```

```powershell
npx tsx src/dev/solverSanity.ts
```

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
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

All must be GREEN before claiming implementation complete.

- [ ] **Step 2: Update `CURRENT_STATE.md` from verified facts only**

Add a Human Solvability Analyzer section documenting:

```text
public API
four statuses
direct rule set
single-level contradiction semantics
deterministic explanation steps
authored CLI mode
generated shortlist CLI mode
no Generator gate integration
no difficulty labels yet
```

Add the actual authored and seed-123456 summary discovered in Task 7. Do not write predicted counts.

Update the old Solver-v1 “does not yet provide logical explanation steps / difficulty scoring” wording precisely:

- logical human-analysis explanations are now provided by the separate Human Solver;
- calibrated difficulty scoring is still not implemented;
- solving from current player `PuzzleState` remains not implemented.

- [ ] **Step 3: Update `TREE.txt`**

Ensure these paths exist:

```text
docs/superpowers/plans/2026-09-03-human-solvability.md
docs/superpowers/specs/2026-09-03-human-solvability-design.md
src/dev/analyzeHumanSolvability.ts
src/dev/humanSolverSanity.ts
src/puzzle/human-solver/ContradictionEngine.ts
src/puzzle/human-solver/DirectDeductionEngine.ts
src/puzzle/human-solver/HumanSolver.ts
src/puzzle/human-solver/types.ts
```

Also retain the recently added generated-playtest/adaptive-layout files once those slices are committed/documented.

- [ ] **Step 4: Fresh verification after docs**

```powershell
npx tsx src/dev/humanSolverSanity.ts
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

Confirm `.generated/` analysis outputs remain ignored and unstaged.

- [ ] **Step 5: Commit only after GREEN evidence**

Stage the human-solvability files and documentation explicitly. Do not use `git add .` while unrelated generated-playtest/adaptive-layout changes are present.

Suggested commit after the slice is fully verified:

```powershell
git commit -m "feat: add human solvability analysis"
```

Then:

```powershell
npm run context:last
```

---

## Final Review Checklist

- [ ] Human Solver has no Phaser import.
- [ ] Human Solver never reads `level.solution`.
- [ ] Human Solver never calls existing DFS `solveLevel()`.
- [ ] Existing solver uniqueness behavior is unchanged.
- [ ] Direct rules are deterministic and explained.
- [ ] Direct fixed point restarts from the first rule after every committed step.
- [ ] Door rules require ordinary framing WALL cells.
- [ ] Treasure Room rules use the same viable-candidate semantics as existing SearchState.
- [ ] Multi-candidate Treasure Room common-cell reasoning is deferred.
- [ ] Monster finishes with exactly one possible OPEN exit.
- [ ] Reverse dead-end rule is applied only to proven hallway cells.
- [ ] 2x2 rule is suppressed when a viable Treasure Room could contain the window.
- [ ] Connectivity rule is a one-cell graph cut test and does not invoke contradiction reasoning.
- [ ] Contradiction depth is exactly one assumption.
- [ ] Assumption probes run direct rules only.
- [ ] Assumption probes always rollback.
- [ ] Proof-only assignments do not increment committed assignment counts.
- [ ] `stuck` is distinct from invalid/non-unique.
- [ ] Complete boards are validated by existing `LevelValidator`.
- [ ] CLI does not regenerate candidate pools.
- [ ] Seed report outputs contain no timestamps or timing noise.
- [ ] Repeated seed output is byte-deterministic.
- [ ] Generator v1.2 acceptance/ranking is unchanged.
- [ ] No difficulty thresholds are invented.
- [ ] Actual seed-123456 status distribution is documented only after running it.
