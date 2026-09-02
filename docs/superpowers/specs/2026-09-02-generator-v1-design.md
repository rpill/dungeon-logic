# Dungeon Logic — Generator v1 Design

Date: 2026-09-02

## Status

Design approved in chat. This document specifies **Generator v1** only.

Generator v1 is a permanent **dev-only candidate factory + shortlist pipeline** for producing base Monster / Chest puzzle candidates. It does **not** register generated levels in the game automatically and does **not** change runtime puzzle rules.

## 1. Goals

Generator v1 must:

1. generate puzzle candidates **solution-first**;
2. support only the existing base Monster / Chest rules;
3. use deterministic seeded randomness;
4. generate a balanced pool across five archetypes;
5. validate every accepted candidate with the existing `LevelValidator`;
6. require exactly one solution through the existing `PuzzleSolver`;
7. require the existing hard authored-quality gate to pass;
8. reject candidates that trigger current geometry warnings;
9. rank accepted candidates without collapsing toward one geometric style;
10. produce a human-readable shortlist for manual review;
11. preserve reproducibility and expose rejection statistics;
12. remain independent from Phaser and runtime UI.

The purpose is to test whether the current validator + solver + quality filters are sufficient to support a future production level-generation pipeline.

## 2. Non-goals

Generator v1 does not implement:

- production campaign generation;
- automatic registration into `src/data/levels/`;
- automatic `level013.ts`, `level014.ts`, etc.;
- blockers;
- directional doors;
- keys, switches, locked doors, water, lava, or other future mechanics;
- difficulty scoring;
- logical explanation steps;
- hint generation;
- generation from the player's current partial puzzle state;
- Yandex Games integration;
- production persistence;
- automatic selection of final shipping levels;
- a guarantee that a technically accepted puzzle is fun.

Manual visual review and playtest remain required.

## 3. Scope

Supported board sizes:

- 6×6;
- 7×7;
- 8×8.

Supported fixed gameplay objects:

- Monster;
- Chest.

Every generated candidate uses:

```ts
blockers: []
doors: []
```

## 4. Archetypes

### 4.1 Monster-only

Allowed sizes: 6×6 / 7×7 / 8×8.

Requirements:

- `chests: []`;
- at least one Monster;
- every hallway dead end contains a Monster;
- every Monster is in a hallway dead end.

### 4.2 One Treasure Room, Chest-only

Allowed sizes: 6×6 / 7×7 / 8×8.

Requirements:

- exactly one Treasure Room;
- exactly one Chest;
- no Monsters.

### 4.3 Two Treasure Rooms, Chest-only

Allowed sizes: 7×7 / 8×8.

Requirements:

- exactly two compatible Treasure Rooms;
- exactly two Chests;
- no Monsters.

6×6 is intentionally excluded because two 3×3 rooms leave too little room for varied hallway geometry.

### 4.4 Monsters + one Treasure Room

Allowed sizes: 6×6 / 7×7 / 8×8.

Requirements:

- exactly one Treasure Room;
- exactly one Chest;
- one or more Monsters;
- Monster/dead-end rules remain exact.

### 4.5 Monsters + two Treasure Rooms

Allowed sizes: 7×7 / 8×8.

Requirements:

- exactly two compatible Treasure Rooms;
- exactly two Chests;
- one or more Monsters.

6×6 is intentionally excluded.

## 5. Candidate-pool target

A normal successful run must obtain:

- 10 accepted candidates per archetype;
- 5 archetypes;
- 50 accepted candidates total.

The shortlist contains:

- top 3 candidates per archetype;
- 15 shortlisted candidates total.

A global ranking must never be allowed to remove an archetype from the shortlist.

## 6. Deterministic seeded generation

Generator v1 must be reproducible.

Example:

```text
master seed = 123456
```

must always produce the same:

- attempt sequence;
- candidate seeds;
- candidate layouts;
- reject reasons;
- accepted pool;
- ranking;
- shortlist.

All tie-breaking must also be deterministic.

A candidate must have its own deterministic derived seed so any individual result can be reproduced later.

Normal CLI usage:

```text
npm run generate:candidates -- --seed 123456
```

If a future convenience mode generates a random master seed automatically, that seed must be printed and persisted in output metadata.

## 7. High-level architecture

Proposed module layout:

```text
src/puzzle/generator/
  SeededRandom.ts
  CandidateGenerator.ts
  CandidateFactory.ts
  CandidateRanker.ts
  types.ts

src/dev/
  generateCandidates.ts
  generatorSanity.ts
```

Responsibilities:

### `SeededRandom.ts`

Pure deterministic pseudo-random generator.

- initialize from seed;
- deterministic integer/float generation;
- deterministic array shuffle / choice;
- no use of `Math.random()` inside Generator v1.

### `CandidateGenerator.ts`

Produces a single solution-first candidate for:

- archetype;
- board size;
- candidate seed.

It constructs geometry and metadata but does not decide whether the candidate is accepted into the pool.

### `CandidateFactory.ts`

Owns the batch pipeline.

- iterate archetypes;
- derive candidate seeds;
- enforce per-archetype attempt limits;
- invoke `CandidateGenerator`;
- run validator / solver / quality filters;
- record reject reason and diagnostics;
- stop after 10 accepted candidates per archetype;
- return full run report.

### `CandidateRanker.ts`

Ranks only already-accepted candidates.

- calculate bounded quality score;
- perform diversity-aware top-3 selection per archetype;
- deterministic tie-breaking.

### `types.ts`

Contains generator-only data contracts:

- archetype;
- candidate;
- candidate status;
- rejection reason;
- metrics snapshot;
- batch statistics;
- shortlist entry;
- run report.

Generator types must not leak into runtime puzzle rules.

### `src/dev/generateCandidates.ts`

CLI/dev entry point.

- parse seed;
- run factory;
- write diagnostic JSON;
- write shortlist Markdown;
- print summary;
- exit non-zero when target pool cannot be completed.

### `src/dev/generatorSanity.ts`

Regression suite for Generator v1.

It must not depend on Phaser.

## 8. Solution-first generation

Generator v1 does **not** randomize row/column clues first.

It first constructs a complete dungeon solution and derives clues from that solution.

```text
choose archetype / size / candidate seed
        ↓
place Treasure Room footprints if required
        ↓
choose exactly one entrance per Treasure Room
        ↓
grow connected OPEN hallway network
        ↓
stop near seeded target OPEN density
        ↓
detect hallway dead ends
        ↓
place Monsters according to dead-end rules
        ↓
place one Chest inside each Treasure Room
        ↓
all unused ordinary cells become WALL
        ↓
derive row clues and column clues
        ↓
LevelValidator
        ↓
PuzzleSolver uniqueness
        ↓
LevelQualityAnalyzer
```

## 9. Treasure Room construction

When an archetype requires Treasure Rooms, generation starts by selecting non-overlapping 3×3 room footprints.

Generator-side structural constraints should cheaply avoid obviously unusable layouts, such as:

- overlapping rooms;
- room placement that cannot have a legal hallway entrance;
- room configurations that leave no practical hallway space;
- directly incompatible room footprints.

Each room gets exactly one intended entrance cell on its perimeter.

The generator may use intended room metadata internally while building the solution, but `LevelDefinition` still stores only Chest positions, final WALL / OPEN solution, and public level fields.

Treasure Room position must not become a new runtime field in `LevelDefinition`.

The existing validator remains the source of truth for whether the resulting 3×3 room is actually valid.

## 10. Hallway growth

The generator grows OPEN space rather than placing walls directly.

The hallway network must:

- remain orthogonally connected;
- connect required room entrances;
- avoid creating OPEN 2×2 outside Treasure Rooms;
- support branches;
- allow loops when they do not violate existing rules;
- cover a meaningful portion of the board;
- use seeded randomness.

Growth should be frontier-based.

Seeded decisions may influence:

- frontier ordering;
- continuation direction;
- turn probability;
- branching probability;
- loop attempts;
- target open density.

The algorithm should include some directional persistence so corridors do not become pure random-walk noise.

No new dungeon rule should be encoded merely to make generation easier. If a generated candidate violates a canonical rule, `LevelValidator` rejects it.

## 11. Target density

Generator v1 should not use one fixed OPEN/WALL density.

For each candidate, choose a target range or target value deterministically from the candidate seed.

The purpose is to create variation rather than optimize toward one density.

The existing authored quality gate remains responsible for rejecting excessive wall density.

## 12. Monster placement

After hallway geometry is complete:

1. identify hallway dead ends using the same topological interpretation as the game;
2. every hallway dead end receives a Monster;
3. no Monster is placed outside a hallway dead end.

For Chest-only archetypes:

- the candidate is rejected if its hallway geometry contains a dead end, because every dead end would require a Monster and the archetype requires none.

For Monster archetypes:

- candidate generation may impose a reasonable minimum/maximum Monster count as a generator-shape constraint if needed;
- these bounds are generator configuration, not new dungeon rules.

`LevelValidator` remains authoritative.

## 13. Chest placement

Each Treasure Room contains exactly one Chest.

Chest selection must obey the existing authored-content readability guideline used by the current diversity batch:

- Chest must be at least two orthogonal steps from the internal room cell of the room's sole entrance.

This remains an authored-content guideline, not a new `LevelValidator` rule.

Chest position is selected deterministically from legal cells using candidate RNG.

## 14. WALL construction and clue derivation

After OPEN geometry and fixed objects are finalized:

- every unused ordinary cell becomes ordinary `WALL`;
- row clues are counted automatically from ordinary `WALL`;
- column clues are counted automatically from ordinary `WALL`.

Monster and Chest cells are OPEN and do not count as ordinary walls.

The generated `solution` contains only:

```text
# = ordinary WALL
. = non-WALL
```

as in current level definitions.

## 15. Acceptance pipeline

```text
candidate generation
    ↓
generation structurally failed?
    → generation-failed

    ↓
LevelValidator
    invalid
    → invalid

    ↓
PuzzleSolver
    0 solutions
    → unsat

    2+ solutions
    → non-unique

    exactly 1
    ↓
LevelQualityAnalyzer
    report.passes === false
    → hard-quality

    report.warnings.length > 0
    → geometry-warning

    ↓
accepted
```

The generator must not duplicate the complete logic of the validator or solver.

Existing systems remain authoritative:

- `LevelValidator` → canonical puzzle validity;
- `PuzzleSolver` → `0 / 1 / 2+` solution count;
- `LevelQualityAnalyzer` → authored hard-quality + geometry warnings.

## 16. Attempt limit

Each archetype has a hard attempt limit.

Initial v1 default:

```text
5000 attempts per archetype
```

If an archetype cannot obtain 10 accepted candidates:

- stop the run as unsuccessful;
- still write diagnostic JSON;
- preserve all counters and accepted candidates already found;
- print which archetype failed;
- return non-zero CLI exit status.

The attempt limit must be configurable in code and not scattered as magic numbers.

## 17. Rejection reasons

At minimum the batch report distinguishes:

- `generation-failed`;
- `invalid`;
- `unsat`;
- `non-unique`;
- `hard-quality`;
- `geometry-warning`;
- `accepted`.

Where practical, rejected records should preserve a short diagnostic reason.

## 18. Quality ranking

Ranking happens **only after acceptance**.

The ranking system must not maximize metrics indefinitely.

Base concept:

```text
base quality score = 100
```

Apply bounded penalties only when a candidate approaches undesirable regions.

Initial ranking signals may include:

- wall density above a healthy middle range;
- thick-wall ratio above a moderate value;
- low WALL↔OPEN boundary per wall;
- oversized largest wall component;
- multiple near-full lines.

Object-assisted deductions may receive a small capped bonus.

Important rule:

> Once a candidate is comfortably inside the healthy range, it must not receive endless reward for becoming even thinner, emptier, or more fragmented.

Exact coefficients are implementation details and may be tuned with regression fixtures without changing the architecture.

## 19. Diversity-aware shortlist selection

Selecting the three highest raw scores is not sufficient.

Per archetype:

1. rank 10 accepted candidates by base quality;
2. choose the first candidate by best quality;
3. choose candidates two and three using quality + novelty relative to already selected candidates.

Novelty may consider:

- board size;
- wall density;
- thick-wall ratio;
- WALL↔OPEN boundary per wall;
- largest wall component ratio;
- Monster count;
- Treasure Room count;
- wall-mask difference when board sizes match.

Novelty exists to prevent three near-clones from occupying one archetype's shortlist.

It must not allow a poor-quality candidate to beat a clearly stronger candidate solely because it is different.

All ties use deterministic stable ordering and/or candidate seed.

## 20. Output files

Generated artifacts are local dev outputs and are not source files.

Directory:

```text
.generated/
```

Add `.generated/` to `.gitignore`.

For seed `123456`:

```text
.generated/
  candidates-123456.json
  shortlist-123456.md
```

### `candidates-<seed>.json`

Machine-readable run report.

It should contain at least:

- schema/generator version;
- master seed;
- configuration;
- per-archetype attempt statistics;
- rejection counters;
- accepted candidates;
- candidate seed;
- archetype;
- size;
- solution;
- row/column clues;
- Monsters;
- Chests;
- solver result;
- hard-quality metrics/issues;
- geometry warnings/metrics;
- ranking data;
- shortlist membership.

Full rejected layouts do not need to be persisted for every failed attempt if that creates excessive output, but aggregate counts and useful diagnostics must be retained.

### `shortlist-<seed>.md`

Human-readable review artifact.

For each of 15 shortlisted candidates include:

- rank within archetype;
- archetype;
- board size;
- candidate seed;
- quality score;
- novelty/diversity information as useful;
- ASCII solution;
- Monster coordinates;
- Chest coordinates;
- row clues;
- column clues;
- relevant quality metrics;
- solver result.

## 21. CLI output

Example shape:

```text
Dungeon Logic Generator v1
Seed: 123456

Monster-only
  attempts: 184
  accepted: 10
  generation-failed: 91
  invalid: 34
  unsat: 7
  non-unique: 22
  hard-quality: 12
  geometry-warning: 8

...

Total accepted: 50
Shortlisted: 15

Wrote:
  .generated/candidates-123456.json
  .generated/shortlist-123456.md
```

The exact numbers are illustrative only.

## 22. Generator sanity checks

Generator sanity must be a separate command and must not run the full candidate factory on every Phaser startup.

Recommended command:

```text
npm run sanity:generator
```

Minimum regression coverage:

1. same seed produces identical deterministic result;
2. different seeds produce at least one meaningful difference;
3. every accepted candidate passes `LevelValidator`;
4. every accepted candidate has `solutionCount === 1`;
5. every accepted candidate passes hard authored quality;
6. every accepted candidate has zero geometry warnings;
7. Monster placement matches hallway dead ends exactly;
8. Treasure Room / Chest counts match archetype;
9. generated row clues match solution;
10. generated column clues match solution;
11. successful full-pool run contains exactly 10 accepted candidates per archetype;
12. successful full-pool run contains exactly 50 accepted candidates;
13. shortlist contains exactly 3 candidates per archetype;
14. shortlist contains exactly 15 candidates;
15. shortlist has no duplicate candidate IDs/seeds;
16. generator does not write generated levels into `src/data/levels/`.

Sanity tests must be deterministic.

A small test configuration may use reduced target counts/attempt counts where appropriate so regression tests remain practical, while at least one integration sanity covers the real batch contract if runtime is acceptable.

## 23. Performance policy

Generator v1 may expose useful timing information for profiling, but tests must not contain a hard wall-clock assertion such as:

```text
solver must finish under 1 second
```

Correctness and determinism are regression requirements; wall-clock timing is not.

## 24. Failure handling

The CLI must fail loudly for:

- invalid CLI seed;
- impossible generator configuration;
- exhausted attempt limit before target pool is reached;
- file-write failure;
- internal invariant violation.

On attempt exhaustion:

- diagnostic output should still be written when possible;
- completed archetype results should not be discarded.

A single malformed generated candidate should normally become a rejected attempt rather than terminate the entire batch, unless it exposes an internal programming/invariant error.

## 25. Relationship to existing systems

Generator v1 must remain downstream of existing puzzle-core rules.

It must not modify the meaning of:

- `UNKNOWN`;
- `WALL`;
- `FLOOR`;
- Monster;
- Chest;
- Treasure Room;
- row/column clues;
- dead ends;
- connectivity;
- open 2×2 restrictions.

It must not use hidden `level.solution` as an oracle for the solver. The generated solution is the candidate being tested; uniqueness still comes from the existing solver.

The authored `LevelQualityAnalyzer` remains separate from runtime victory.

## 26. Files expected to change

Implementation is expected to add:

```text
src/puzzle/generator/SeededRandom.ts
src/puzzle/generator/CandidateGenerator.ts
src/puzzle/generator/CandidateFactory.ts
src/puzzle/generator/CandidateRanker.ts
src/puzzle/generator/types.ts
src/dev/generateCandidates.ts
src/dev/generatorSanity.ts
```

Likely changes:

```text
package.json
.gitignore
CURRENT_STATE.md
TREE.txt
```

Potential small helper extraction from existing puzzle code is allowed only if required to avoid duplicating canonical topology logic and if regression coverage remains intact.

Generator v1 must not require changes to runtime `GameScene` behavior.

## 27. Acceptance criteria

Generator v1 is complete when:

1. `npm run build` succeeds;
2. existing validator sanity checks still pass;
3. existing solver sanity checks still pass;
4. existing level-quality sanity checks still pass;
5. generator sanity passes;
6. same master seed reproduces identical output;
7. a normal successful run yields exactly 50 accepted candidates;
8. every archetype contributes exactly 10 accepted candidates;
9. generated shortlist contains exactly 15 entries, 3 per archetype;
10. every accepted candidate is canonically valid;
11. every accepted candidate is uniquely solvable;
12. every accepted candidate passes hard authored quality;
13. every accepted candidate has no current geometry warnings;
14. `.generated/candidates-<seed>.json` is created;
15. `.generated/shortlist-<seed>.md` is created;
16. no generated candidate is automatically registered in the game;
17. manual review can reproduce any shortlisted candidate from its seed.

## 28. Development process

Implementation follows TDD.

Preferred slices:

```text
seeded RNG
→ deterministic candidate geometry
→ clue derivation
→ single-candidate validation pipeline
→ per-archetype factory
→ full 50-candidate pool
→ ranking
→ diversity shortlist
→ output writers / CLI
→ final integration sanity
```

Each slice:

```text
RED
→ confirm expected failure
→ GREEN
→ regression verification
→ commit
```

Do not combine Generator v1 with unrelated ORYX/UI work.
