# Dungeon Logic — Treasure Room Solver Pruning Design

## Goal

Reduce the solver search tree for chest-heavy generated levels by enforcing Treasure Room geometry earlier on partial search states, without changing puzzle rules, solution semantics, deterministic branch order, or generator acceptance behavior.

The first optimization target is the current `chest-one-room` pathological workload. The optimization must reduce search work by pruning impossible room/entrance states before a board becomes complete.

## Context

The solver already has:

- deterministic `WALL -> OPEN` DFS;
- row/column fixed-point propagation;
- Directional Door propagation;
- potential-connectivity pruning;
- static 3×3 Treasure Room candidates around each Chest;
- a partial candidate check that only rejects a room candidate when one of its nine cells is already `WALL`;
- deterministic most-constrained branching;
- deterministic solver diagnostics.

The generator profiler showed that runtime is dominated by solver search, especially `chest-one-room` 8×8 candidates. The first optimization should therefore reduce `nodesVisited`, not micro-optimize JavaScript operations.

## Non-goals

This slice does **not**:

- change generator geometry or quality thresholds;
- move quality evaluation before uniqueness solving;
- add solver timeouts or node budgets;
- change `solveLevel()` / `solveLevelWithDiagnostics()` result semantics;
- use hidden `level.solution` to prune solver search;
- change branch order from `WALL -> OPEN`;
- add open-2×2 partial pruning;
- add Monster/dead-end partial pruning;
- add a second generator-specific solver;
- redesign Treasure Room rules.

Those are separate later slices if profiling still justifies them.

---

# 1. Treasure Room candidate model

Each precomputed 3×3 candidate must carry two sets of geometry:

```ts
interface RoomCandidate {
  cells: readonly GridPosition[];
  boundary: readonly GridPosition[];
}
```

`cells` are the nine cells inside the room.

`boundary` is the deduplicated set of in-board cells orthogonally adjacent to the 3×3 room but not inside it.

For an interior 3×3 room this is twelve cells. If the room touches a board edge, out-of-board positions are omitted because the runtime validator does not count the outside of the board as an entrance.

Static candidate filtering remains unchanged in meaning:

- the candidate contains the target Chest;
- it contains exactly one Chest total;
- no Blocker is inside;
- no Monster is inside;
- no Directional Door is inside.

A Directional Door directly outside the room remains allowed and is an OPEN entrance candidate.

---

# 2. Partial entrance semantics

For one candidate, every `boundary` position is classified from `SearchState`:

### Confirmed OPEN

`SearchCellState.Open`.

This includes fixed OPEN objects represented by the search state, such as Chest, Monster, and Directional Door.

### Confirmed CLOSED

Either:

- `SearchCellState.Wall`;
- `null` for a Fixed Blocker.

A Blocker is CLOSED topology but never an ordinary clue-counting wall.

### Undecided

`SearchCellState.Unassigned`.

The final Treasure Room rule requires **exactly one confirmed OPEN boundary cell**.

Therefore a partial candidate is entrance-feasible iff:

```text
confirmedOpen <= 1
and
confirmedOpen + undecided >= 1
```

Equivalently:

- two or more confirmed OPEN boundary cells make the candidate impossible;
- one confirmed OPEN keeps the candidate possible;
- zero confirmed OPEN requires at least one undecided boundary cell;
- zero confirmed OPEN and zero undecided means the candidate can never obtain an entrance.

This entrance feasibility is combined with the existing interior rule that none of the nine room cells may be `WALL`.

---

# 3. Single source of truth for viable candidates

`SearchState` should have one internal helper that computes the currently viable candidates for a Chest.

Conceptually:

```ts
private getViableRoomCandidates(
  chest: GridPosition,
): readonly RoomCandidate[]
```

A candidate is viable only when:

1. all nine interior cells can still be OPEN;
2. its boundary can still end with exactly one entrance.

`hasTreasureRoomCandidateForEveryChest()` must use this helper instead of duplicating room feasibility logic.

`roomCandidatePressure()` must also use the same helper so branch scoring and validity never disagree about which room candidates are still alive.

No persistent mutable "active candidate" cache is required in this slice. Candidate lists are tiny (at most nine 3×3 placements around one Chest), so recomputing viability from the current rollback-friendly search state is simpler and safer.

---

# 4. Treasure Room propagation

Add Treasure Room propagation to the existing solver fixed point.

Conceptual solver order per fixed-point pass:

```text
Directional Door propagation
Row/column propagation
Treasure Room propagation
repeat while SearchState trail changed
```

The Treasure Room propagator processes every Chest.

## 4.1 Zero viable candidates

If a Chest has zero viable room candidates:

```text
return false
```

The current branch is impossible.

This moves part of the existing post-propagation room pruning into the fixed point, so contradictions created by room propagation are detected immediately.

## 4.2 More than one viable candidate

Do not force a room placement.

The propagator may only establish that the Chest still has at least one legal 3×3 possibility.

Common-cell reasoning across multiple candidates is intentionally deferred.

## 4.3 Exactly one viable candidate

If only one candidate remains, every valid completion must use it.

Force every mutable UNASSIGNED cell inside its 3×3 `cells` to:

```text
OPEN
```

If any room cell cannot be OPEN, propagation fails.

Then enforce its single-entrance boundary:

### Exactly one boundary cell is already OPEN

Every remaining mutable UNASSIGNED boundary cell must become:

```text
WALL
```

Fixed Blockers remain `null` and require no assignment.

### No boundary cell is OPEN and exactly one boundary cell is UNASSIGNED

That last possible entrance must become:

```text
OPEN
```

### No boundary cell is OPEN and multiple boundary cells are UNASSIGNED

Do not choose between them yet.

### Two or more boundary cells are OPEN

The candidate is impossible and propagation fails.

### No boundary cell is OPEN and none is UNASSIGNED

The candidate is impossible and propagation fails.

Assignments use the existing `SearchState.assign()` trail, so rollback semantics remain unchanged.

---

# 5. Interaction with row/column clues

A mutable room boundary cell forced CLOSED becomes an ordinary:

```text
SearchCellState.Wall
```

and therefore participates in row/column clue counts exactly like any other solver wall.

A room interior or entrance cell forced OPEN does not count as a wall.

Because Treasure Room propagation runs inside the same fixed point as line propagation, new room assignments can immediately trigger row/column deductions, which can then further restrict room candidates on the next pass.

No special clue accounting is added.

---

# 6. Interaction with fixed objects

The optimization must preserve current static-field semantics.

## Fixed Blocker

- represented as `null`;
- CLOSED for entrance feasibility;
- cannot be assigned;
- does not count as a wall clue.

## Directional Door

- fixed OPEN;
- cannot be inside a Treasure Room candidate;
- may sit immediately outside a room;
- if on the chosen room boundary, it counts as an already OPEN entrance.

## Monster

- fixed OPEN;
- cannot be inside a Treasure Room candidate;
- if outside on a candidate boundary, it is an OPEN boundary cell and therefore contributes to entrance count.

## Chest

- fixed OPEN;
- exactly one Chest must be inside each candidate;
- another Chest outside on the candidate boundary is OPEN and contributes to entrance count.

No special-case rewriting of these objects is introduced.

---

# 7. Multiple Treasure Rooms

This slice keeps the current per-Chest candidate model.

It does not yet compute the full compatible cross-product of room layouts during partial search.

Therefore it may still leave some branches alive where:

- every Chest individually has a viable candidate;
- but the candidates cannot all coexist in one final compatible room layout.

That stronger global room-layout pruning is a possible follow-up only if profiling after this slice shows that two-room archetypes remain expensive.

The new propagation must nevertheless remain sound with multiple Chests: if one Chest has exactly one viable candidate, every global valid solution must use that candidate, so forcing its interior and entrance constraints is safe.

---

# 8. Solver API and determinism invariants

The optimization must preserve:

```ts
solveLevel(level): SolveResult
```

and:

```ts
solveLevelWithDiagnostics(level): {
  result: SolveResult;
  diagnostics: SolverDiagnostics;
}
```

For the same level before and after optimization:

- `solutionCount` must not change;
- valid unique levels remain unique;
- unsatisfiable levels remain unsatisfiable;
- ambiguous levels still clamp at `2`;
- `firstSolution` must remain deterministic;
- branch order remains `WALL -> OPEN`;
- y→x tie behavior remains deterministic.

Diagnostics are allowed and expected to change because the search tree changes.

---

# 9. TDD coverage required before implementation

The first RED must exercise behavior that the current solver does not provide.

Required focused cases:

1. **Two confirmed entrances kill a candidate**
   - one 3×3 candidate;
   - two boundary cells assigned OPEN;
   - candidate becomes impossible.

2. **Single surviving room candidate forces its interior OPEN**
   - only one room placement remains viable;
   - propagation assigns every mutable room cell OPEN.

3. **Confirmed entrance closes the rest of the boundary**
   - singleton candidate has one boundary OPEN;
   - remaining mutable boundary cells become WALL.

4. **Last possible entrance is forced OPEN**
   - singleton candidate has no OPEN boundary;
   - every boundary position except one is CLOSED;
   - final mutable boundary position becomes OPEN.

5. **Blocker is CLOSED without becoming WALL**
   - blocker on room boundary helps close the perimeter;
   - blocker remains `null`.

6. **Door outside room counts as OPEN entrance**
   - door immediately outside singleton room;
   - other mutable boundary cells are forced WALL.

7. Existing solver sanity remains green:
   - malformed metadata;
   - doors;
   - connectivity;
   - registered levels;
   - deterministic diagnostics;
   - existing Treasure Room candidate test;
   - most-constrained tie break.

Tests must not inspect hidden `level.solution` for solver decisions.

---

# 10. Performance verification

Performance is evaluated from deterministic solver counters first and wall-clock time second.

Primary metrics:

- `nodesVisited`;
- `branches`;
- `propagationPasses`;
- `completeCandidatesChecked`.

Wall-clock `solverMs` is supporting evidence because it is machine-dependent.

Pathological baseline candidates from profiler seed `123456`:

- `chest-one-room`, candidate seed `2567285821`, size 8;
- `chest-one-room`, candidate seed `421722065`, size 8;
- `chest-one-room`, candidate seed `3210444393`, size 8;
- `chest-one-room`, candidate seed `1838594120`, size 8.

The first two accepted candidates are the primary benchmark targets.

Success criteria for this slice:

1. semantic parity is exact;
2. no registered-level or generator acceptance regression;
3. search nodes decrease materially on the pathological chest-one-room candidates;
4. target is roughly an order-of-magnitude reduction on the two worst accepted candidates, but correctness is mandatory even if the first constraint produces a smaller gain.

If the improvement is weak, do not stack unrelated optimizations into the same change. Re-profile and choose the next constraint separately.

---

# 11. Verification and commit boundaries

Before calling the optimization complete:

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run build
```

```powershell
npm run dev
```

Confirm all validator, solver, and level-quality sanity checks remain green.

Then benchmark the pathological candidate seeds and compare diagnostics against the recorded baseline.

The full:

```powershell
npm run profile:generator -- --seed 123456
```

is run only after focused benchmarking shows that the change is promising.

Implementation should use RED → GREEN cycles and be committed only after the complete solver-pruning slice is green.
