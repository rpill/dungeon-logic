# Treasure Room Solver Pruning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every production change and superpowers:verification-before-completion before claiming the slice complete.

**Goal:** Reduce the solver search tree on chest-heavy levels by enforcing Treasure Room entrance geometry and singleton-room deductions on partial search states, without changing solver semantics or generator acceptance behavior.

**Architecture:** Extend `SearchState` room candidates with in-board boundary cells, centralize dynamic room viability, and add a Treasure Room propagator to the existing deterministic fixed point in `PuzzleSolver`. Reuse the existing rollback trail for every forced assignment. Keep `solveLevel()` and generator behavior semantically unchanged.

**Tech Stack:** TypeScript 6, Vite, tsx, Phaser project runtime.

**Spec:** `docs/superpowers/specs/2026-09-03-treasure-room-solver-pruning-design.md`

## Global constraints

- Hidden `level.solution` must never guide solver search.
- `solutionCount` semantics remain `0 | 1 | 2`, with `2` meaning 2+.
- Branch order remains `WALL -> OPEN`.
- Stable y→x tie behavior remains unchanged.
- Blocker stays `null`: CLOSED topology, not clue-counted WALL.
- Door stays fixed OPEN.
- Do not add timeouts, node budgets, quality reordering, open-2×2 pruning, dead-end pruning, or generator-specific solving in this slice.
- Every production change follows RED → verify failure → minimal GREEN → verify.
- Do not commit a RED state.

---

## Task 1: Make Treasure Room viability entrance-aware

**Files:**
- Create: `src/dev/treasureRoomPruningSanity.ts`
- Modify: `src/puzzle/solver/SearchState.ts`

### Step 1 — RED: two confirmed entrances invalidate the only room candidate

Add a standalone sanity fixture with:

- board size 4×4;
- one Chest at `(0, 0)`;
- no blockers, doors, or monsters;
- therefore exactly one static 3×3 room placement: top-left `(0, 0)`.

Confirm initial room viability is true, then assign:

```ts
(3, 0) = OPEN
(0, 3) = OPEN
```

Both cells are on the candidate boundary.

Expected future behavior:

```ts
!state.hasTreasureRoomCandidateForEveryChest()
```

Current behavior should fail because room viability only checks that the nine interior cells are not WALL.

Run:

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

Expected RED: assertion failure saying that two confirmed entrances must invalidate the candidate.

### Step 2 — GREEN: extend `RoomCandidate`

Change:

```ts
interface RoomCandidate {
  cells: readonly GridPosition[];
}
```

to:

```ts
interface RoomCandidate {
  cells: readonly GridPosition[];
  boundary: readonly GridPosition[];
}
```

During candidate initialization:

1. build the nine room cell keys;
2. inspect each room cell's four orthogonal neighbors;
3. keep only in-board neighbors outside the room;
4. deduplicate by position key;
5. store them in deterministic order.

Do not treat out-of-board space as an entrance.

### Step 3 — GREEN: centralize dynamic viability

Add an internal helper conceptually equivalent to:

```ts
private getViableRoomCandidates(
  chest: GridPosition,
): readonly RoomCandidate[]
```

A candidate is viable iff:

- no interior cell is `WALL`;
- confirmed boundary OPEN count is at most 1;
- confirmed OPEN + UNASSIGNED boundary count is at least 1.

`null` blockers count CLOSED.

Make both:

```ts
hasTreasureRoomCandidateForEveryChest()
roomCandidatePressure()
```

use the same helper.

### Step 4 — Verify Task 1

Run:

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

Expected GREEN.

Then:

```powershell
npm run build
```

Expected GREEN.

Do not commit yet; Task 1 is part of the larger pruning slice.

---

## Task 2: Propagate a singleton room interior

**Files:**
- Modify: `src/dev/treasureRoomPruningSanity.ts`
- Modify: `src/puzzle/solver/PuzzleSolver.ts`
- Modify: `src/puzzle/solver/SearchState.ts` only if a small public query helper is genuinely required

### Step 1 — RED: singleton candidate forces all room cells OPEN

Extend the standalone sanity with a 4×4 Chest-at-corner fixture where only the `(0,0)..(2,2)` room exists.

Call a future exported:

```ts
propagateTreasureRoomConstraints(state)
```

Expected:

- returns true;
- all mutable room cells become `SearchCellState.Open`;
- the Chest remains fixed OPEN.

Current code should fail to compile because the propagator does not exist.

### Step 2 — GREEN: add Treasure Room propagator

Export:

```ts
propagateTreasureRoomConstraints(
  state: SearchState,
): boolean
```

For every Chest:

- zero viable candidates → false;
- more than one → no forced assignment;
- exactly one → force every mutable UNASSIGNED interior cell OPEN.

Assignments must go through `SearchState.assign()`.

### Step 3 — GREEN: add propagator to fixed point

Inside `propagateConstraints()` use deterministic order:

```text
door
line
treasure room
```

Then loop again when trail length increased.

The existing post-propagation feasibility check may remain as a defensive invariant.

### Step 4 — Verify Task 2

Run:

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

Then:

```powershell
npm run build
```

Both must be GREEN.

---

## Task 3: Propagate the single entrance

**Files:**
- Modify: `src/dev/treasureRoomPruningSanity.ts`
- Modify: `src/puzzle/solver/PuzzleSolver.ts`

### Step 1 — RED: confirmed entrance closes remaining boundary

Fixture:

- singleton room candidate;
- one boundary cell already OPEN;
- several other boundary cells UNASSIGNED.

After Treasure Room propagation:

- confirmed entrance remains OPEN;
- every other mutable UNASSIGNED boundary cell is WALL.

### Step 2 — GREEN: close remaining boundary

For a singleton candidate:

- if confirmed OPEN boundary count > 1 → false;
- if confirmed OPEN count == 1 → assign every remaining mutable UNASSIGNED boundary cell WALL.

Blockers remain `null`; never assign them.

### Step 3 — RED: last possible entrance becomes OPEN

Fixture:

- no boundary OPEN;
- all boundary cells except one are already CLOSED by WALL or blocker;
- one mutable boundary cell remains UNASSIGNED.

Expected propagation forces that cell OPEN.

### Step 4 — GREEN: force final entrance

For a singleton candidate:

- 0 OPEN + 0 UNASSIGNED → false;
- 0 OPEN + 1 UNASSIGNED → force the remaining cell OPEN;
- 0 OPEN + 2+ UNASSIGNED → do not choose yet.

### Step 5 — Verify Task 3

Run pruning sanity and build again.

---

## Task 4: Cover fixed-object entrance semantics

**Files:**
- Modify: `src/dev/treasureRoomPruningSanity.ts`

These are regression coverage for the implemented logic; add them one at a time and confirm expected behavior.

### Case A — Blocker closes boundary without becoming WALL

Use one blocker on singleton room boundary.

Assert:

```ts
state.getCellState(blocker.x, blocker.y) === null
```

and verify it contributes CLOSED when determining the last possible entrance.

### Case B — Door outside room is an OPEN entrance

Use a valid Directional Door immediately outside the singleton room.

Assert Treasure Room propagation treats it as the confirmed OPEN entrance and closes other mutable boundary cells.

Do not permit a door inside the 3×3 room; static candidate filtering already rejects that.

### Verify

Run:

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

```powershell
npm run build
```

Then run browser sanity:

```powershell
npm run dev
```

Confirm existing validator, solver, and quality sanity suites stay green.

---

## Task 5: Preserve solver semantics

**Files:**
- Modify: `src/dev/solverSanity.ts` only where an outdated room fixture conflicts with the now-correct entrance rule

The existing 3×3 Chest fixture has no in-board boundary and therefore cannot ever have the required entrance. Replace that narrow fixture with a 4×4 room-at-corner fixture that has legal boundary cells.

Do not weaken the test. It should still prove:

- a viable room candidate exists initially;
- placing a WALL inside the only 3×3 room removes the final candidate.

Run browser sanity and confirm:

- deterministic diagnostics still deterministic;
- registered levels remain unique;
- ambiguous fixture still returns 2;
- unsat fixture still returns 0;
- most-constrained tie break remains stable.

---

## Task 6: Focused performance verification

**Files:**
- No production changes unless benchmark ergonomics require a separate approved dev-only helper.

Primary pathological seeds from profiler master seed `123456`:

```text
2567285821
421722065
3210444393
1838594120
```

All are 8×8 `chest-one-room`.

Compare before/after:

- nodesVisited
- branches
- propagationPasses
- completeCandidatesChecked
- solverMs

Primary goal: major node reduction on `2567285821` and `421722065`.

Do not change solver logic based only on timing noise.

If node reduction is weak, stop and profile before adding a different constraint.

---

## Task 7: Full verification

Run:

```powershell
npx tsx src/dev/treasureRoomPruningSanity.ts
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run build
```

```powershell
npm run dev
```

Confirm all sanity suites are GREEN.

Only after focused benchmark improvement is confirmed, run:

```powershell
npm run profile:generator -- --seed 123456
```

Compare accepted candidate IDs/order and aggregate search diagnostics with baseline.

---

## Task 8: Commit

Commit only after all semantic and performance checks above are green.

Suggested commit:

```powershell
git add docs/superpowers/specs/2026-09-03-treasure-room-solver-pruning-design.md docs/superpowers/plans/2026-09-03-treasure-room-solver-pruning.md src/dev/treasureRoomPruningSanity.ts src/dev/solverSanity.ts src/puzzle/solver/SearchState.ts src/puzzle/solver/PuzzleSolver.ts
```

```powershell
git status --short
```

```powershell
git commit -m "perf: prune treasure room solver search"
```

```powershell
npm run context:last
```

If `TREE.txt` is maintained manually and shows the new spec/plan/sanity file as missing, update it before the final commit.
