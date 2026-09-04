# Dungeon Logic — Difficulty Analysis v1 Design

Date: 2026-09-04

Status: proposed design for review

## 1. Purpose

Add a separate, deterministic difficulty-analysis layer on top of the existing
Human Solver.

The new layer answers:

> Given a level and the deterministic Human Solver trace, how difficult does
> this level appear under the current modeled human reasoning system?

This is an internal development signal first.

It is not a player-facing difficulty promise, not a campaign progression
system, and not a new correctness rule for generated levels.

The immediate goals are:

1. produce a stable continuous difficulty score;
2. produce coarse internal difficulty bands;
3. explain why a level received its score;
4. make generated-candidate ranking capable of preferring a requested
   difficulty;
5. preserve existing Generator v1.2 acceptance semantics;
6. provide a foundation for later progression and human-playtest calibration.

## 2. Non-goals

Difficulty Analysis v1 does not:

- display `easy`, `medium`, `hard`, or `expert` to players;
- define campaign progression;
- change authored level order;
- change puzzle rules;
- change Human Solver deduction semantics;
- change LevelValidator;
- change PuzzleSolver uniqueness semantics;
- reject generated candidates merely because the Human Solver cannot solve
  them;
- alter CandidateGenerator geometry to force a requested score;
- introduce new Blocker or Directional Door generation;
- claim that the score is a validated measure of real human difficulty;
- derive difficulty from DFS node counts or solver wall-clock timings.

The v1 labels are development bands only and are explicitly versioned.

## 3. Why difficulty must be a separate layer

Human Solver and Difficulty Analyzer have different responsibilities.

### Human Solver

Human Solver answers:

- can the current modeled human rule set solve the level?
- which deductions were used?
- how many direct deductions were committed?
- how many contradiction-tier deductions were committed?
- which rule families were required?
- did the solve get stuck?

Human Solver must remain a reasoning engine, not a difficulty model.

### Difficulty Analyzer

Difficulty Analyzer interprets the Human Solver result.

It answers:

- what is the hardest modeled reasoning tier required?
- how much work was required inside that tier?
- how large is the board?
- how many advanced direct-rule families were used?
- what internal band and continuous score should be assigned?
- what human-readable reasons explain the classification?

Keeping this layer separate allows difficulty weights and thresholds to evolve
without changing solving behavior.

## 4. Evidence from the current corpus

The current analyzed corpus contains:

- 12 authored levels;
- 15 Generator v1.2 shortlist levels from seed `123456`;
- 27 total levels;
- zero `stuck`;
- zero `invalid`.

Current authored distribution:

```text
solved-direct:             6
solved-with-contradiction: 6
stuck:                     0
invalid:                   0
```

Current generated shortlist distribution:

```text
solved-direct:             10
solved-with-contradiction:  5
stuck:                      0
invalid:                    0
```

The corpus demonstrates that raw `directSteps` alone is not a useful primary
difficulty classifier.

Examples:

- a large direct-only level may have many direct steps but require no
  hypothetical reasoning;
- a level with one single-cell contradiction is qualitatively different from a
  direct-only level;
- a level with nine or more contradiction proofs is qualitatively different
  from a level with one;
- `treasure-room-variant` requires structured hypothetical reasoning over a
  complete `3x3 room + sole entrance` variant and should be treated as a higher
  reasoning tier than ordinary direct deductions.

Therefore Difficulty Analysis v1 uses a tiered model rather than one global
weighted sum.

## 5. Core design principle: reasoning tier first

Difficulty is classified in two stages.

### Stage A — choose the reasoning band

The hardest reasoning technique required sets a non-overlapping score range.

```text
easy:   0..24
medium: 25..49
hard:   50..74
expert: 75..100
```

A lower reasoning tier can never outrank a higher reasoning tier.

For example:

- a very large direct-only 8x8 level can never score above 24;
- a level requiring one ordinary contradiction always scores at least 25;
- a level requiring three ordinary contradictions always scores at least 50;
- a level requiring Treasure Room variant reasoning always scores at least 75.

### Stage B — rank inside the band

Board size, direct-solve length, advanced direct-rule variety, and lookahead
burden determine where the level sits inside its band.

This provides a continuous score without allowing secondary metrics to override
the primary reasoning tier.

## 6. Public internal types

New module:

```text
src/puzzle/difficulty/
  DifficultyAnalyzer.ts
  types.ts
```

Proposed types:

```ts
export type DifficultyBand =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'unrated';

export type ReasoningTier =
  | 'direct'
  | 'contradiction-light'
  | 'contradiction-heavy'
  | 'expert-lookahead'
  | 'unrated';

export interface DifficultyComponents {
  readonly boardLoad: number;
  readonly directLoad: number;
  readonly advancedRuleLoad: number;
  readonly lookaheadLoad: number;
}

export interface DifficultyProfile {
  readonly version: 1;
  readonly score: number | null;
  readonly band: DifficultyBand;
  readonly reasoningTier: ReasoningTier;
  readonly components: DifficultyComponents;
  readonly ordinaryContradictions: number;
  readonly treasureRoomVariantSteps: number;
  readonly reasons: readonly string[];
}
```

Primary API:

```ts
export function analyzeDifficulty(
  level: LevelDefinition,
  humanResult: HumanSolveResult,
): DifficultyProfile;
```

The function is pure and deterministic.

It does not invoke Human Solver internally.

The caller chooses when Human Solver should run and passes the result in.

## 7. Unrated behavior

A level receives:

```text
band = unrated
reasoningTier = unrated
score = null
```

when Human Solver returns:

```text
stuck
invalid
```

The reasons array explains the cause.

Examples:

```text
"Human Solver is stuck with 23 mutable cells unresolved."
```

or:

```text
"Human Solver marked the level invalid under the modeled rules."
```

An `unrated` profile is diagnostic.

It is not automatically a Generator rejection.

## 8. Reasoning-band classification

Classification uses rule-specific counts, not only
`humanResult.contradictionSteps`.

This matters because `contradictionSteps` includes every contradiction-tier
step, including `treasure-room-variant`.

Define:

```ts
const ordinaryContradictions =
  humanResult.ruleCounts.contradiction;

const treasureRoomVariantSteps =
  humanResult.ruleCounts['treasure-room-variant'];
```

Band rules are evaluated in this order.

### Expert

A solved level is `expert` if either condition is true:

```text
treasureRoomVariantSteps >= 1
```

or:

```text
ordinaryContradictions >= 9
```

Reasoning tier:

```text
expert-lookahead
```

### Hard

A solved level is `hard` when:

```text
ordinaryContradictions is 3..8
```

and no expert condition applies.

Reasoning tier:

```text
contradiction-heavy
```

### Medium

A solved level is `medium` when:

```text
ordinaryContradictions is 1..2
```

and no expert condition applies.

Reasoning tier:

```text
contradiction-light
```

### Easy

A solved level is `easy` when:

```text
ordinaryContradictions = 0
treasureRoomVariantSteps = 0
```

Reasoning tier:

```text
direct
```

## 9. Score components

All component values are normalized to the inclusive range:

```text
0.0 .. 1.0
```

Use a shared clamp helper:

```ts
clamp01(value)
```

### 9.1 Board load

Board size is useful as a secondary signal.

Current gameplay sizes are 6x6 through 8x8.

Formula:

```ts
const cells =
  level.width * level.height;

const boardLoad =
  clamp01(
    (cells - 36) /
    (64 - 36),
  );
```

Reference values:

```text
6x6 = 0.000
7x7 = 13 / 28 ~= 0.464
8x8 = 1.000
```

If future boards are smaller or larger, clamping keeps v1 deterministic until a
new difficulty version intentionally changes the formula.

### 9.2 Direct load

`directSteps` is interpreted as the number of committed direct reasoning
applications, not as the primary difficulty tier.

Formula:

```ts
const directLoad =
  clamp01(
    humanResult.directSteps / 30,
  );
```

`30` is the v1 normalization cap.

It is based on the current analyzed corpus and is intentionally versioned rather
than dynamically computed from the current candidate pool.

A future larger corpus may justify Difficulty v2 with a different cap.

### 9.3 Advanced direct-rule load

Difficulty v1 measures variety of advanced direct reasoning, not the raw count
of every application.

The advanced direct families are:

```text
door
treasure-room-interior
treasure-room-entrance
monster-dead-end
hallway-not-dead-end
open-2x2
connectivity
```

Line rules are excluded:

```text
line-complete
line-fill
```

Contradiction-tier rules are also excluded:

```text
contradiction
treasure-room-variant
```

For each advanced family, count whether it appeared at least once.

Formula:

```ts
const advancedFamiliesUsed =
  ADVANCED_DIRECT_RULES.filter(
    (rule) =>
      humanResult.ruleCounts[rule] > 0,
  ).length;

const advancedRuleLoad =
  advancedFamiliesUsed / 7;
```

This prevents one rule repeated ten times from masquerading as ten different
kinds of cognitive burden.

### 9.4 Lookahead load

Lookahead load is normalized within the already-selected reasoning band.

#### Easy

```text
lookaheadLoad = 0
```

#### Medium

For ordinary contradiction count `c` in `1..2`:

```ts
lookaheadLoad =
  (c - 1) /
  (2 - 1);
```

Therefore:

```text
1 contradiction => 0
2 contradictions => 1
```

#### Hard

For ordinary contradiction count `c` in `3..8`:

```ts
lookaheadLoad =
  (c - 3) /
  (8 - 3);
```

Therefore:

```text
3 contradictions => 0
8 contradictions => 1
```

#### Expert without Treasure Room variant

For ordinary contradiction count `c >= 9`:

```ts
lookaheadLoad =
  clamp01(
    (c - 9) / 11,
  );
```

Reference:

```text
9 contradictions  => 0
20 contradictions => 1
```

`20` is the v1 expert normalization cap.

#### Expert with Treasure Room variant

If:

```text
treasureRoomVariantSteps >= 1
```

then:

```text
lookaheadLoad = 1
```

This encodes the design decision that structured room+entrance hypothesis
analysis is currently the highest modeled reasoning tier.

If later human playtests show that this is overstated, Difficulty v2 may alter
this rule without changing Human Solver.

## 10. Exact score formula

Each reasoning band has a fixed inclusive interval.

### Easy score

Weights:

```text
boardLoad        0.35
directLoad       0.35
advancedRuleLoad 0.30
```

Formula:

```ts
const intra =
  0.35 * boardLoad +
  0.35 * directLoad +
  0.30 * advancedRuleLoad;

const score =
  Math.round(
    24 * intra,
  );
```

Result remains in:

```text
0..24
```

### Medium score

Weights:

```text
boardLoad        0.15
directLoad       0.20
advancedRuleLoad 0.15
lookaheadLoad    0.50
```

Formula:

```ts
const intra =
  0.15 * boardLoad +
  0.20 * directLoad +
  0.15 * advancedRuleLoad +
  0.50 * lookaheadLoad;

const score =
  25 +
  Math.round(
    24 * intra,
  );
```

Result remains in:

```text
25..49
```

### Hard score

Use the same within-tier weights:

```ts
const intra =
  0.15 * boardLoad +
  0.20 * directLoad +
  0.15 * advancedRuleLoad +
  0.50 * lookaheadLoad;

const score =
  50 +
  Math.round(
    24 * intra,
  );
```

Result remains in:

```text
50..74
```

### Expert score

Use the same component weights.

The expert interval has 26 integer values, including both endpoints.

Formula:

```ts
const intra =
  0.15 * boardLoad +
  0.20 * directLoad +
  0.15 * advancedRuleLoad +
  0.50 * lookaheadLoad;

const score =
  75 +
  Math.round(
    25 * intra,
  );
```

Result remains in:

```text
75..100
```

All final scores must be clamped to their selected band as a defensive
invariant.

## 11. Reasons

Difficulty profiles include deterministic human-readable reasons.

Reasons are not localized player UI.

Examples:

```text
"Solved without contradiction-tier reasoning."
```

```text
"Requires 2 ordinary depth-1 contradiction deductions."
```

```text
"Requires 8 ordinary depth-1 contradiction deductions."
```

```text
"Requires Treasure Room variant reasoning."
```

```text
"Uses a full 8x8 board."
```

```text
"Uses 4 advanced direct-rule families."
```

Reason order is deterministic.

Suggested order:

1. reasoning-tier reason;
2. Treasure Room variant reason when present;
3. board-size reason;
4. direct-step reason;
5. advanced-rule-variety reason.

The reasons are diagnostic support for tuning and reports.

They are not used to compute the score.

## 12. Expected classification of the current 27-level corpus

These are regression expectations for Difficulty v1.

Exact score values may be asserted in unit tests once calculated from the
formula, but the minimum required regression contract is the band.

### 12.1 Authored levels

```text
level-001 => easy
level-002 => easy
level-003 => easy
level-004 => easy
level-005 => easy
level-006 => hard
level-007 => hard
level-008 => medium
level-009 => easy
level-010 => expert
level-011 => expert
level-012 => hard
```

Expected summary:

```text
easy:   6
medium: 1
hard:   3
expert: 2
unrated: 0
```

### 12.2 Generated shortlist — seed 123456

```text
generated-monster-only-7-2491075932 => easy
generated-monster-only-8-361304057 => medium
generated-monster-only-7-512302628 => medium

generated-chest-one-room-8-2568418654 => expert
generated-chest-one-room-7-3193369624 => easy
generated-chest-one-room-8-4193628777 => medium

generated-chest-two-rooms-8-214184125 => hard
generated-chest-two-rooms-7-870245706 => easy
generated-chest-two-rooms-7-819912849 => easy

generated-mixed-one-room-8-1936134028 => easy
generated-mixed-one-room-8-4234123378 => easy
generated-mixed-one-room-6-4267384426 => easy

generated-mixed-two-rooms-8-3305430967 => easy
generated-mixed-two-rooms-7-4032331667 => easy
generated-mixed-two-rooms-7-3373527181 => easy
```

Expected summary:

```text
easy:   10
medium: 3
hard:    1
expert:  1
unrated: 0
```

## 13. Analyzer CLI integration

Existing command:

```text
npm run analyze:human
```

continues to run Human Solver.

The generated JSON and Markdown reports are extended with a difficulty profile
for every analyzed level.

Example Markdown section:

```text
- difficulty:
  - version: 1
  - band: hard
  - score: 63
  - reasoning tier: contradiction-heavy
  - board load: ...
  - direct load: ...
  - advanced rule load: ...
  - lookahead load: ...
  - ordinary contradictions: 6
  - treasure room variant steps: 0
  - reasons:
    - ...
```

The summary gains deterministic counts:

```text
difficulty:
  easy: N
  medium: N
  hard: N
  expert: N
  unrated: N
```

and optional score statistics:

```text
minimum score
median score
maximum score
```

Median is deterministic and useful for reports, but it does not influence any
individual score.

No timestamps are added.

## 14. Generator integration boundary

Difficulty Analysis v1 must not run for every raw generation attempt.

Generator v1.2 currently performs many cheap or medium-cost rejections before a
candidate reaches the accepted pool.

Human Solver and Difficulty Analyzer should run only after the candidate has
already passed the existing canonical Generator v1.2 acceptance path.

Conceptually:

```text
generate candidate
  ↓
existing generation validity / quality gates
  ↓
canonical uniqueness checks
  ↓
accepted candidate
  ↓
Human Solver
  ↓
Difficulty Analyzer
  ↓
store difficulty profile on accepted candidate
  ↓
CandidateRanker
```

This avoids multiplying Human Solver cost across hundreds of rejected attempts.

Existing Generator v1.2 acceptance semantics remain unchanged.

## 15. Generated candidate report schema

Accepted candidate records should expose the difficulty profile used by ranking
and reports.

Conceptual shape:

```ts
interface AcceptedCandidate {
  // existing fields
  readonly candidate: Candidate;
  readonly quality: ...;
  readonly difficulty: DifficultyProfile;
}
```

Whether the current JSON schema requires a schema-version bump will be decided
during implementation by inspecting the exact existing serialized contract.

The implementation must not silently break:

- generated playtest extraction;
- profiler report parsing;
- shortlist report formatting;
- deterministic JSON snapshots.

If a schema bump is required, it must be explicit and covered by regression
tests.

## 16. Ranking target

CandidateRanker gains an internal optional difficulty target:

```ts
export type DifficultyTarget =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'any';
```

This is a development/generation option.

It is not a player setting.

### `any`

Preserve existing Generator v1.2 ranking behavior as closely as possible.

Difficulty must not perturb ranking when target is `any`, except for deterministic
serialization of the new profile.

### Specific target

For a requested band, difficulty acts as a ranking preference.

It does not alter candidate geometry and does not make a candidate invalid.

Priority order:

```text
exact requested band
nearest adjacent band
next-nearest band
remaining rated band
unrated
```

Recommended band distance:

```text
easy   = 0
medium = 1
hard   = 2
expert = 3
```

Distance:

```ts
Math.abs(
  targetIndex -
  candidateIndex,
)
```

Within the same band-distance group:

1. existing Generator v1.2 quality/ranking criteria remain primary;
2. difficulty-score proximity to the center of the requested band is a
   secondary tie-break;
3. existing deterministic seed/id ordering remains the final tie-break.

This avoids destroying layout quality merely to hit a numeric score.

## 17. Target-band centers

For tie-breaking only:

```text
easy center   = 12
medium center = 37
hard center   = 62
expert center = 87
```

Difficulty target ranking may compute:

```ts
const scoreDistance =
  Math.abs(
    profile.score -
    targetCenter,
  );
```

This must never make a farther difficulty band outrank an exact-band candidate.

Band distance remains the first difficulty preference.

## 18. Shortlist behavior

Difficulty target changes shortlist preference, not accepted-pool membership.

Example:

```text
--difficulty hard
```

The shortlist should prefer:

1. hard;
2. medium/expert at equal band distance;
3. easy;
4. unrated.

When two adjacent bands are equally distant from the target, preserve existing
quality ranking before using score distance.

For example, for target `hard`:

```text
hard   distance 0
medium distance 1
expert distance 1
easy   distance 2
```

The existing quality rank decides ordering between a strong medium and a weak
expert before score-center proximity is used as a tie-break.

## 19. No hard difficulty gate in v1

Difficulty is deliberately not added to CandidateFactory rejection reasons in
v1.

Reasons:

1. the current Human Solver is a modeled subset of human reasoning;
2. `stuck` may indicate a missing human rule rather than a bad puzzle;
3. the 27-level corpus is too small for confident rejection thresholds;
4. Generator v1.2 quality and uniqueness gates already protect correctness;
5. human playtesting is still needed before difficulty becomes a content gate.

A future version may introduce an explicit difficulty acceptance target, but
that requires a separate design decision.

## 20. No dynamic percentiles

Difficulty bands must not be percentile-based.

A level's score and band must not change merely because unrelated candidates
were added to the pool.

Therefore:

- no quartiles;
- no rank-normalization against the current accepted pool;
- no seed-dependent thresholds;
- no percentile-based easy/medium/hard labels.

Difficulty v1 is absolute and versioned.

## 21. No DFS difficulty signal

DFS uniqueness diagnostics such as:

```text
nodesVisited
branches
maxDepth
wall-clock solver time
```

are not part of Difficulty v1.

Those metrics measure the implementation behavior of the uniqueness solver, not
the modeled human solve.

They remain useful profiler diagnostics but must not influence the Human
Difficulty score.

The previously slow DFS candidate
`generated-chest-one-room-8-2568418654` is a good example: uniqueness-search
cost and human reasoning burden are related only indirectly.

## 22. Determinism requirements

For the same:

```text
LevelDefinition
HumanSolveResult
Difficulty version
```

Difficulty Analyzer must produce byte-for-byte equivalent serialized output.

No use of:

- `Math.random()`;
- current time;
- wall-clock timings;
- current accepted-pool distribution;
- environment-dependent data.

Reasons and component ordering are deterministic.

## 23. Testing strategy

Difficulty v1 receives its own sanity suite.

Proposed file:

```text
src/dev/difficultySanity.ts
```

### Unit-level checks

Test:

1. direct-only result => easy;
2. one ordinary contradiction => medium;
3. two ordinary contradictions => medium;
4. three ordinary contradictions => hard;
5. eight ordinary contradictions => hard;
6. nine ordinary contradictions => expert;
7. Treasure Room variant => expert regardless of ordinary count;
8. stuck => unrated/null score;
9. invalid => unrated/null score;
10. 6x6 board load = 0;
11. 8x8 board load = 1;
12. component ranges stay 0..1;
13. score stays inside selected band;
14. identical inputs produce identical profile;
15. reasons are deterministic.

### Corpus regression checks

Run Human Solver + Difficulty Analyzer on all 12 authored levels and assert the
expected bands from section 12.1.

Run against Generator seed `123456` shortlist and assert section 12.2 where the
existing generated fixture/report path makes this practical.

If loading the full generated JSON would make the sanity test dependent on a
developer-generated file, keep generated-corpus assertions in the existing
analysis sanity fixture rather than requiring `.generated/` to exist.

### Ranking regression checks

Test:

1. `any` preserves existing ranking;
2. exact-band candidate outranks adjacent-band candidate for a targeted run;
3. adjacent-band fallback works when exact band is absent;
4. quality ranking remains deterministic inside equal band distance;
5. score-center distance is only a later tie-break;
6. unrated candidates rank after rated alternatives for a specific target;
7. accepted-pool membership does not change.

## 24. CLI shape

Difficulty target should be explicit and dev-only.

Proposed generator option:

```text
--difficulty any
--difficulty easy
--difficulty medium
--difficulty hard
--difficulty expert
```

Default:

```text
any
```

Existing generator commands without the flag preserve current behavior.

The exact parser integration follows the existing generator CLI conventions and
will be confirmed from the current repository during implementation.

## 25. Performance

Human Solver is more expensive than reading existing quality metadata, so v1
must avoid running it on rejected attempts.

Record profiling around accepted-candidate difficulty analysis only if current
generator profiler architecture can do so without coupling wall-clock timing to
the difficulty score.

Performance timings may be reported separately.

They never affect difficulty.

## 26. Versioning

Difficulty profile includes:

```text
version: 1
```

The formula is part of the versioned contract.

Changing any of the following requires deliberate version consideration:

- band thresholds;
- board normalization;
- direct-step normalization cap;
- advanced-rule family list;
- lookahead normalization;
- score weights;
- expert Treasure Room variant treatment.

During development before Difficulty v1 is relied upon externally, minor
changes may still be made, but regression fixtures must be updated explicitly.

## 27. Relationship to future campaign progression

This design intentionally stops before campaign progression.

Future progression may choose a distribution such as:

```text
5 easy
5 medium
3 hard
1 expert
```

or may use a smooth score ramp.

That future system should consume DifficultyProfile rather than duplicate
difficulty logic.

It may also incorporate:

- player completion rates;
- restart counts;
- solve times;
- hint usage;
- observed abandonment;
- explicit human playtest labels.

None of those signals belong in Difficulty Analysis v1.

## 28. Relationship to future generator evolution

Difficulty target in v1 is ranking-only.

A later Generator version may add:

- archetype-specific difficulty distributions;
- generation parameters correlated with desired difficulty;
- accepted-pool quotas by difficulty;
- campaign batch generation;
- human-solvability gating when confidence is sufficient.

Those are separate future changes.

This design does not pre-authorize them.

## 29. Rejected alternatives

### Alternative A — one global weighted sum

Example:

```text
score =
  board size +
  direct steps +
  contradiction count * large weight
```

Rejected because secondary factors can blur qualitative reasoning boundaries.

A large direct-only puzzle could accidentally outrank a puzzle that genuinely
requires contradiction reasoning.

### Alternative B — percentile bands

Example:

```text
bottom 25% = easy
top 25% = expert
```

Rejected because difficulty becomes pool-dependent.

The same unchanged level could change band after generating unrelated levels.

### Alternative C — use DFS complexity

Rejected because uniqueness-search complexity is implementation-specific and
does not model the human reasoning process we intentionally built.

### Alternative D — immediately reject `stuck`

Rejected because a previous `stuck` candidate exposed a missing Treasure Room
reasoning rule rather than proving the puzzle was guess-only.

## 30. Success criteria for Difficulty Analysis v1

The implementation is complete when:

1. DifficultyAnalyzer is a pure separate module.
2. Every solved Human Solver result receives a deterministic 0..100 score.
3. Every solved result receives exactly one internal band.
4. `stuck` and `invalid` become `unrated` with `score=null`.
5. The current 12 authored levels match the expected band table.
6. The seed `123456` shortlist matches the expected band table.
7. Human analysis JSON/Markdown includes difficulty profiles and summary counts.
8. Generator accepted candidates can carry difficulty metadata.
9. Generator ranking supports `any/easy/medium/hard/expert`.
10. Default `any` preserves existing Generator v1.2 ranking behavior.
11. Specific difficulty targets change ranking preference only.
12. Generator v1.2 acceptance/rejection semantics do not change.
13. Existing generated playtest mode remains functional.
14. Existing generator sanity remains green.
15. Human Solver sanity remains green.
16. Build remains green.
17. Output remains deterministic across repeated runs.

## 31. Rollout boundary

After Difficulty v1 is implemented and verified:

- do not immediately define player-facing difficulty labels;
- do not immediately reorder authored levels solely by score;
- do not immediately add hard generator rejection thresholds;
- collect more generated candidates and human playtest impressions;
- compare observed friction against score and reasoning tier;
- revise only when concrete mismatches appear.

The intended result is a stable internal measurement instrument first, not a
premature claim that difficulty has been solved.
