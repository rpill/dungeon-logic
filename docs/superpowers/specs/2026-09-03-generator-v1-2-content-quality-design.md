# Dungeon Logic — Generator v1.2 Content Quality Design

## Goal

Improve the generated candidate pool and shortlist in three confirmed areas without changing canonical dungeon rules:

1. Treasure Room placement is too spatially repetitive, especially `chest-one-room`.
2. Monster-bearing archetypes can produce visually overloaded levels with too many Monsters.
3. Two-room archetypes can collapse to one board size even though both 7×7 and 8×8 are supported.

Generator v1.2 remains deterministic, solution-first, dev-only, and compatible with the existing Validator → Solver → Quality pipeline.

## Current observed problems

The v1.1 review for master seed `123456` showed:

- `chest-one-room` accepted candidates repeatedly use the same or near-identical Treasure Room position;
- Monster-only shortlist candidates can contain very high Monster counts, including 9–10 Monsters on 8×8;
- `chest-two-rooms` and `mixed-two-rooms` shortlists can contain only 8×8 candidates;
- current solver performance is no longer the blocking problem, so v1.2 should optimize content quality rather than search performance.

These are generator/content-selection problems, not runtime puzzle-rule problems.

---

# 1. Architecture

Keep the existing module boundaries and put each policy where it belongs.

## `CandidateGenerator.ts`

Owns **what geometry is created**.

Generator v1.2 adds spatially stratified Treasure Room placement here.

## `CandidateFactory.ts`

Owns **what is allowed into the accepted pool**.

Generator v1.2 adds:

- generator-only Monster hard caps;
- two-room board-size coverage phase (`A+`);
- rejection diagnostics for Monster overload.

## `CandidateRanker.ts`

Owns **what is preferred in the shortlist**.

Generator v1.2 adds:

- Monster boundary-count ranking penalty;
- Treasure Room spatial distance as a novelty component;
- mandatory 7×7 + 8×8 representation in a two-room shortlist when the shortlist has at least two slots.

## `types.ts`

Only receives contract changes genuinely required by the above behavior, primarily the new generator rejection reason.

Do **not** create a new `GeneratorContentPolicy.ts` subsystem in v1.2. The policies are small, layer-specific, and fit the existing architecture.

---

# 2. Non-goals

Generator v1.2 does **not**:

- change `LevelValidator` rules;
- change Treasure Room size, entrance count, Chest rules, Monster/dead-end rules, connectivity, or open-2×2 rules;
- change `LevelQualityAnalyzer` hard or soft authored-content thresholds;
- apply Monster-count limits to manually authored levels;
- change Solver semantics or add more solver pruning;
- change branch order, hidden-solution policy, or uniqueness semantics;
- add Blockers or Directional Doors to generated geometry;
- add difficulty estimation or logical explanation scoring;
- redesign hallway growth beyond what is required to support room-position stratification;
- fix the current per-archetype/global duplicate-set mismatch in this slice.

The dedupe mismatch remains a separate future cleanup because current archetype object contracts already make practical cross-archetype playable duplicates unlikely/impossible under the current five archetypes.

---

# 3. Determinism invariants

For the same generator version, config, and master seed, v1.2 must deterministically reproduce:

- attempt numbers;
- candidate seeds;
- board-size decisions;
- room spatial target decisions;
- generated layouts;
- rejection reasons;
- accepted pools;
- ranking;
- shortlists.

No `Math.random()` is introduced.

Existing candidate-seed derivation remains the reproducibility anchor.

Changing v1.1 generation policy means v1.2 is **not** required to reproduce v1.1 candidate IDs/layouts for the same master seed. It is only required to be deterministic within v1.2.

---

# 4. Treasure Room spatial categories

Treasure Rooms may touch board edges and corners.

For a 3×3 room with `topLeft` and board size `size`, define:

```text
maxTopLeft = size - 3

touchesLeft   = topLeft.x == 0
touchesRight  = topLeft.x == maxTopLeft
touchesTop    = topLeft.y == 0
touchesBottom = topLeft.y == maxTopLeft
```

The room spatial category is:

### `corner`

The room footprint touches two perpendicular board edges:

```text
(left or right) AND (top or bottom)
```

### `edge`

The room footprint touches exactly one board edge.

### `interior`

The room footprint touches no board edge.

A room touching the board edge is legal as long as its intended `externalEntrance` is still inside the board and final geometry satisfies the normal validator rules.

Out-of-board space is never an entrance.

---

# 5. Stratified room generation

The current room planner enumerates legal 3×3 placements and entrance directions, shuffles them, then takes the first usable environment. v1.2 keeps enumeration and static validity rules but changes the **ordering policy**.

## 5.1 One-room archetypes

Applies to:

- `chest-one-room`;
- `mixed-one-room`.

For each candidate seed:

1. enumerate the same legal `PlannedRoom` values as today;
2. classify each plan by its 3×3 `topLeft` as `corner`, `edge`, or `interior`;
3. deterministically choose one target category from those three using the candidate RNG;
4. shuffle the target-category plans deterministically and try them first;
5. if no statically usable room environment exists in that category, deterministically fall back to the other categories;
6. preserve the existing static room-environment validation.

Fallback prevents a spatial preference from turning into a new hard puzzle rule.

The selected category is a generation preference, not metadata stored in `LevelDefinition`.

## 5.2 Two-room archetypes

Applies to:

- `chest-two-rooms`;
- `mixed-two-rooms`.

Two-room placement uses an unordered category profile derived from the two room categories:

```text
corner + corner
corner + edge
corner + interior
edge + edge
edge + interior
interior + interior
```

For each candidate seed:

1. enumerate the same legal individual room plans;
2. enumerate statically compatible room pairs using the existing overlap/touch/environment rules;
3. classify each pair into one of the six profiles above;
4. deterministically choose a target profile using the candidate RNG;
5. shuffle compatible pairs inside that profile and try them first;
6. if the profile has no statically usable pair, deterministically fall back through the remaining profiles.

Room ordering in `GeneratedCandidate.rooms` remains deterministic. The profile is conceptually unordered so swapping room 1 / room 2 does not create fake diversity.

## 5.3 Fallback boundary

The stratified fallback applies to **static room-placement selection**.

Do not add a large same-attempt backtracking system that retries many different room environments after downstream hallway carving fails. If downstream carving fails, that candidate attempt remains `generation-failed`; the next deterministic candidate seed gets its own spatial target.

This keeps v1.2 bounded and preserves the current candidate-attempt model.

---

# 6. Monster-density policy

Monster limits are **Generator v1.2 policy only**.

They apply to all Monster-bearing archetypes:

- `monster-only`;
- `mixed-one-room`;
- `mixed-two-rooms`.

They do not apply to authored levels, `LevelValidator`, or the general `LevelQualityAnalyzer`.

## 6.1 Per-size limits

```text
6×6:
  no penalty: 1–4 Monsters
  ranking penalty: exactly 5
  hard reject: > 5

7×7:
  no penalty: 1–6 Monsters
  ranking penalty: exactly 7
  hard reject: > 7

8×8:
  no penalty: 1–7 Monsters
  ranking penalty: exactly 8
  hard reject: > 8
```

The earlier “healthy lower bounds” are **not** minimum requirements. A valid mixed 8×8 with only 2–3 Monsters remains allowed and receives no low-count penalty.

The existing archetype contract still requires `monsterCount > 0` for Monster-bearing archetypes.

## 6.2 Hard rejection

After `generateCandidate()` succeeds and before expensive Solver/quality work, `CandidateFactory` checks the Monster hard cap.

If exceeded:

- reject the candidate immediately;
- do not run uniqueness solving;
- record a generator-specific rejection reason, conceptually `monster-density`;
- include a diagnostic containing size, actual Monster count, and cap.

Example diagnostic shape:

```text
8x8 candidate has 9 Monsters; Generator v1.2 hard cap is 8.
```

Do **not** remove Monsters from dead ends to satisfy the cap. Monsters still equal hallway dead ends exactly; overloaded geometry is rejected instead.

## 6.3 Ranking penalty

A candidate exactly on the penalty boundary remains accepted but loses **4 points** from the generator ranking base score:

```text
6×6 with 5 Monsters  -> -4
7×7 with 7 Monsters  -> -4
8×8 with 8 Monsters  -> -4
```

All lower allowed counts receive 0 Monster penalty.

This penalty lives in `CandidateRanker.scoreCandidate()` (or an equivalent internal helper used by it), not in `LevelQualityAnalyzer`.

The existing bounded geometric score remains otherwise unchanged.

A 4-point penalty is intentionally smaller than the strongest existing geometric penalties but large enough to make an overloaded candidate lose to a comparably good cleaner candidate.

---

# 7. Two-room size coverage — A+

The confirmed size-collapse problem is scoped to the two-room archetypes:

- `chest-two-rooms`;
- `mixed-two-rooms`.

They support exactly:

```text
7×7
8×8
```

Generator v1.2 guarantees that a **completed default pool** for each two-room archetype contains at least one accepted candidate of each size.

## 7.1 Normal phase

Until `accepted.length >= acceptedPerArchetype`, size choice remains the current deterministic per-attempt choice from the archetype's allowed sizes.

## 7.2 Coverage phase

If the normal target has been reached but one allowed two-room size is still missing:

1. continue attempts without resetting attempt numbering;
2. keep deriving candidate seeds exactly as normal;
3. force board-size selection to the currently missing size;
4. run the normal generation / validation / solver / quality / Monster policy pipeline;
5. stop as soon as an accepted candidate covers the missing size.

With two allowed sizes, the accepted pool can therefore exceed `acceptedPerArchetype` by at most one candidate.

Example:

```text
acceptedPerArchetype = 10
first 10 accepted are all 8×8
coverage phase searches 7×7 only
first accepted 7×7 becomes accepted candidate #11
stop
```

This avoids filling the report with arbitrary extra already-covered-size candidates.

## 7.3 Attempt limit and exhaustion

The existing `maxAttemptsPerArchetype` remains the hard outer limit.

A two-room archetype is complete only if both are true:

```text
accepted.length >= acceptedPerArchetype
AND
accepted sizes contain 7 and 8
```

If the attempt limit is reached before size coverage, `exhausted` is true and the full generator run is incomplete.

No extra hidden attempt budget is added.

## 7.4 Other archetypes

Monster-only, chest-one-room, and mixed-one-room keep their existing pool stopping rule in v1.2.

A+ is deliberately not generalized to all 6/7/8 archetypes because the confirmed failure is the two-room 7/8 collapse and we do not need to enlarge every accepted pool.

---

# 8. Shortlist size guarantee

For two-room archetypes, when:

- both 7×7 and 8×8 exist in the accepted pool; and
- `shortlistPerArchetype >= 2`;

the shortlist must contain at least one candidate of each size.

Selection order:

1. first slot: best candidate by normal generator ranking base score, then deterministic seed tie-break;
2. while a required size is still missing and enough shortlist slots remain, restrict the next selection to candidates of a missing size and choose the best by the usual quality + novelty selection score;
3. once both sizes are represented, remaining slots are unrestricted and use normal diversity-aware selection.

For the default shortlist size of 3, the result is always:

```text
at least one 7×7
at least one 8×8
third slot = best remaining quality/diversity choice
```

If a test/custom config requests fewer than two slots, the impossible two-size guarantee is not applied.

---

# 9. Treasure Room spatial novelty in ranking

Stratified generation creates spatial variety in the accepted pool. The ranker must also avoid selecting near-identical room placements from that pool.

Existing candidate distance remains based on size, wall geometry metrics, Monster count, and wall-mask distance. Room-bearing archetypes gain one additional **weighted room spatial distance** component.

Monster-only candidates keep the existing distance behavior unchanged.

## 9.1 Normalize room position

For a room:

```text
maxTopLeft = size - 3
normalizedX = topLeft.x / maxTopLeft
normalizedY = topLeft.y / maxTopLeft
```

For supported sizes 6/7/8, `maxTopLeft > 0`.

## 9.2 Single-room position distance

For two rooms being compared:

```text
positionDistance =
  (abs(ax - bx) + abs(ay - by)) / 2

categoryDistance =
  0 if categories equal
  1 otherwise

roomDistance =
  0.75 * positionDistance +
  0.25 * categoryDistance
```

Clamp to `[0, 1]`.

This makes exact/near-identical room positions visibly similar while still rewarding a meaningful `corner` / `edge` / `interior` change.

## 9.3 Two-room position distance

Two-room archetypes compare the two possible room matchings:

```text
A1 -> B1, A2 -> B2
A1 -> B2, A2 -> B1
```

Compute the average single-room distance for both matchings and use the **smaller** value.

This makes room ordering irrelevant and prevents swapped room arrays from looking artificially diverse.

## 9.4 Weight inside candidate distance

For room-bearing archetypes, room spatial distance has weight `2` while each existing distance component keeps weight `1`.

Conceptually:

```text
weightedAverage(
  existing components, weight 1 each,
  roomSpatialDistance, weight 2
)
```

The final candidate distance remains clamped to `[0, 1]`.

The existing novelty multiplier remains:

```text
selectionScore = qualityScore + diversityScore * 6
```

No new unbounded novelty bonus is introduced.

---

# 10. Interaction between the three policies

The pipeline becomes:

```text
derive candidate seed
        ↓
choose board size
        ↓
choose spatial Treasure Room target/profile when applicable
        ↓
generate solution-first geometry
        ↓
Monster hard-cap check (generator-only)
        ↓
LevelValidator
        ↓
PuzzleSolver uniqueness
        ↓
LevelQualityAnalyzer
        ↓
accepted pool
        ↓
A+ coverage phase for two-room archetypes if required
        ↓
CandidateRanker
  - existing geometry quality
  - Monster boundary penalty
  - existing novelty
  - room spatial novelty
  - two-room size representation
        ↓
shortlist
```

Canonical puzzle rules remain below/inside Validator and are unaffected by these content policies.

---

# 11. Profiler parity

`src/dev/profileGenerator.ts` currently mirrors candidate-factory behavior so profiler results correspond to real generator attempts.

Generator v1.2 must update profiler mirroring for:

- Monster hard-cap rejection before Solver;
- the new generator rejection reason;
- two-room A+ coverage-phase stopping/size selection;
- any changed attempt counts caused by the above.

Profiler diagnostics themselves do not need new solver counters.

The profiler must continue to be deterministic for a fixed v1.2 seed.

Do not use old v1.1 attempt/status counts as semantic-parity requirements because v1.2 intentionally changes acceptance and pool composition.

---

# 12. Reporting

Existing generated artifacts remain:

```text
.generated/candidates-<seed>.json
.generated/shortlist-<seed>.md
```

The output should make v1.2 review practical.

At minimum:

- rejection summaries include `monster-density`;
- shortlisted entries continue to show board size and Monster count;
- shortlisted room-bearing entries expose the existing room coordinates/metadata so room-position diversity can be reviewed;
- pool accepted count may be 11 for a two-room archetype when A+ coverage was required.

No production levels are automatically registered.

---

# 13. TDD coverage required

Implementation must use RED → GREEN cycles.

Required behavior coverage:

## Room generation

1. room spatial classification distinguishes corner / edge / interior;
2. edge and corner 3×3 rooms are legal when they have an in-board entrance;
3. one-room spatial target prioritizes its category before fallback;
4. two-room spatial profile is order-independent;
5. same seed reproduces the same spatial target and generated candidate.

## Monster policy

6. 6×6 with 6 Monsters is rejected before Solver;
7. 7×7 with 8 Monsters is rejected before Solver;
8. 8×8 with 9 Monsters is rejected before Solver;
9. 5 / 7 / 8 boundary counts remain accepted but receive the ranking penalty;
10. lower Monster counts receive no penalty;
11. chest-only archetypes are unaffected;
12. authored `LevelQualityAnalyzer` behavior is unchanged.

## A+ size coverage

13. two-room pool does not stop at target when one supported size is missing;
14. coverage phase forces attempts to the missing size;
15. first accepted missing-size candidate completes the archetype;
16. accepted pool grows by at most one beyond target;
17. hitting attempt limit without coverage marks archetype exhausted;
18. non-two-room pool stopping semantics remain unchanged.

## Shortlist

19. default two-room shortlist contains both 7×7 and 8×8;
20. third slot remains quality/diversity driven;
21. room spatial distance is 0 for same placement;
22. room spatial distance increases for moved/category-different rooms;
23. two-room room-order swap produces no fake distance;
24. poor quality still cannot win solely from novelty;
25. repeated shortlist selection is deterministic.

## Integration

26. all accepted candidates still pass `LevelValidator`;
27. all accepted candidates still have `solutionCount === 1`;
28. all accepted candidates still pass the existing hard quality gate and generator warning policy;
29. generated Monster positions still equal hallway dead ends exactly;
30. generator and profiler agree on the new rejection/stopping semantics.

---

# 14. v1.2 seed-123456 acceptance criteria

After focused tests are green, run the full default generator for master seed `123456`.

The v1.2 result must satisfy:

1. all five archetypes complete within the existing attempt limit;
2. both two-room accepted pools contain 7×7 and 8×8;
3. both two-room shortlists contain 7×7 and 8×8;
4. no accepted Monster-bearing candidate exceeds its per-size hard cap;
5. no 8×8 candidate with 9–10 Monsters survives into accepted pool;
6. `chest-one-room` accepted pool no longer collapses to one repeated `topLeft` position;
7. `chest-one-room` shortlist contains at least two distinct room `topLeft` positions;
8. all accepted candidates remain valid and unique;
9. output remains deterministic on repeated runs.

For item 6, the expected practical check is at least **three distinct room `topLeft` positions** among the default 10 accepted `chest-one-room` candidates. This is a content-quality regression guard for the specific v1.1 failure, not a new puzzle rule.

Do not require every spatial category to appear in every shortlist. Stratification is a generation preference plus ranking signal, not a hard corner/edge/interior quota.

---

# 15. Verification

Before calling Generator v1.2 complete, run the focused RED/GREEN checks and then the normal project verification:

```powershell
npm run sanity:generator
```

```powershell
npx tsx src/dev/profilerSanity.ts
```

```powershell
npm run build
```

Then run the default generator twice:

```powershell
npm run generate:candidates -- --seed 123456
```

Compare deterministic outputs and manually inspect the updated shortlist.

Run a full generator profile only after generator semantics are green:

```powershell
npm run profile:generator -- --seed 123456
```

Profiling is verification that v1.2 remains practical, not an invitation to add more solver optimization in the same slice.

---

# 16. Commit boundaries

This is one Generator v1.2 feature slice, but implementation should be split into green, independently reviewable commits where practical:

1. room spatial stratification;
2. Monster density policy;
3. two-room A+ pool coverage;
4. shortlist size/spatial diversity;
5. profiler/report/docs integration.

Never commit a RED state.

After each completed commit:

```powershell
npm run context:last
```

The final v1.2 state should update `CURRENT_STATE.md` and `TREE.txt` only after behavior is verified.
