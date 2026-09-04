# Generator Difficulty v2 Design

Date: 2026-09-04
Project: Dungeon Logic
Status: Approved design

## 1. Purpose

Generator Difficulty v2 makes difficulty-targeted generation produce candidate pools and shortlists that are intentionally biased toward `easy`, `medium`, `hard`, or `expert`, instead of generating the normal v1.2 pool first and only applying difficulty-aware shortlist ranking afterward.

The existing `difficulty=any` behavior remains the compatibility baseline and must not change.

## 2. Goals

- Preserve Generator v1.2 behavior exactly when `difficulty=any`.
- Add a distinct targeted-generation path for `easy`, `medium`, `hard`, and `expert`.
- Keep the targeted accepted pool at 50 candidates when generation completes.
- Allocate targeted pool capacity dynamically across archetypes using difficulty affinity quotas.
- Prefer exact difficulty matches, while allowing deterministic fallback when exact supply is insufficient.
- Replace per-archetype targeted shortlist selection with a global shortlist of 15 candidates.
- Preserve archetype diversity where possible without sacrificing exact difficulty matches.
- Preserve 7x7/8x8 diversity for two-room archetypes only when doing so does not reduce difficulty match quality.
- Extend the multi-seed corpus tooling so it measures actual targeted generation, not only targeted shortlist selection from an `any` pool.
- Keep Solver, Human Solver, Difficulty v1, validation rules, quality thresholds, and game mechanics unchanged.

## 3. Non-goals

Generator Difficulty v2 does not:

- change Difficulty v1 scoring or band thresholds;
- change Human Solver rules or reasoning tiers;
- change canonical validation rules;
- change uniqueness semantics;
- add new puzzle mechanics;
- add blockers or directional doors to generation;
- introduce dynamic percentile-based difficulty;
- use wall-clock timing as a difficulty signal;
- redesign geometry solely to manipulate difficulty scores;
- force every archetype to produce every difficulty band;
- guarantee that every targeted pool candidate is an exact target-band match;
- tune target-conditioned composition before the first post-v2 corpus measurement.

## 4. Compatibility mode: `difficulty=any`

`difficulty=any` is a strict backward-compatibility path.

It must retain Generator v1.2 behavior, including:

- the existing five archetypes;
- the existing accepted-per-archetype target;
- the existing two-room completion rule that may allow `target + 1` accepted candidate to guarantee 7x7 and 8x8 size coverage;
- the existing shortlist behavior of `shortlistPerArchetype` candidates per archetype;
- the existing ranking order and selection-score behavior;
- existing deterministic output for the same seed and configuration.

No targeted reservoir, dynamic affinity quota, global targeted shortlist, or targeted backfill logic applies to `difficulty=any`.

## 5. Targeted mode

Targeted mode applies when `difficultyTarget` is one of:

- `easy`
- `medium`
- `hard`
- `expert`

A completed targeted pool contains exactly 50 accepted candidates.

### 5.1 Initial archetype affinity quotas

The first v2 profile is:

| Target | monster-only | mixed-one-room | mixed-two-rooms | chest-two-rooms | chest-one-room | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| easy | 18 | 16 | 10 | 4 | 2 | 50 |
| medium | 10 | 10 | 16 | 8 | 6 | 50 |
| hard | 4 | 4 | 14 | 20 | 8 | 50 |
| expert | 2 | 2 | 6 | 10 | 30 | 50 |

These values are an initial policy profile, not permanent balance constants. They may be adjusted in a later tuning cycle using corpus evidence.

The affinity profile should be represented explicitly in generator configuration or a dedicated policy module rather than scattered conditional logic.

## 6. Targeted candidate reservoir

For an archetype with final quota `Q`, targeted generation collects a bounded reservoir before selecting the final archetype contribution.

### 6.1 Reservoir goal

The initial reservoir goal is:

`reservoirGoal = 2 * Q`

The reservoir contains only candidates that already pass the existing generator acceptance pipeline.

That means a reservoir candidate must satisfy the same existing requirements as an accepted candidate, including:

- structural/canonical validity;
- uniqueness requirements;
- quality thresholds;
- Human Solver analysis;
- Difficulty analysis.

Difficulty targeting does not weaken ordinary quality acceptance.

### 6.2 Hard stop

The existing `maxAttemptsPerArchetype` remains the hard attempt limit.

Generation stops attempting an archetype when either:

- the reservoir goal is reached; or
- `maxAttemptsPerArchetype` is exhausted.

The generator must not perform unbounded exact-band searching.

## 7. Final per-archetype selection

After reservoir collection, the generator chooses up to `Q` final candidates for that archetype.

Selection priority is deterministic and ordered by:

1. exact target band;
2. increasing rated-band distance from the target;
3. existing ranking / selection-quality ordering;
4. existing deterministic seed tie-break behavior.

`unrated` is always worse than every rated fallback band.

Difficulty distance is ordinal over:

`easy < medium < hard < expert`

Examples:

- target `medium`: `easy` and `hard` are distance 1, `expert` is distance 2;
- target `expert`: `hard` is distance 1, `medium` distance 2, `easy` distance 3.

Existing ranking tie-break semantics should be reused rather than replaced when candidates are equal on target distance.

## 8. Two-room size coverage in targeted mode

The old v1.2 `target + 1` rule does not apply in targeted mode because targeted pools must remain exactly 50 when complete.

For two-room archetypes, the final selection should prefer having both 7x7 and 8x8 represented, but only inside the same difficulty-preference tier.

Difficulty quality dominates size diversity.

Therefore:

- do not replace an exact target-band candidate with a fallback candidate only to obtain the missing board size;
- when two candidates are otherwise equivalent in difficulty tier, size coverage may be used as a diversity preference;
- targeted pool size remains within the configured quota.

## 9. Global backfill

An archetype may fail to supply its full quota before its attempt limit.

Any missing slots become global backfill slots.

Backfill draws from eligible surplus candidates across other archetypes. Backfill ranking uses the same priority:

1. exact target band;
2. target-band distance;
3. existing quality/ranking ordering;
4. deterministic seed tie-break.

Backfill may cause the final archetype distribution to differ from the nominal affinity quotas.

A targeted pool is `completed=true` only when 50 final candidates are available after backfill.

If fewer than 50 eligible candidates exist after all hard-stop attempts, the pool is `completed=false` and reports the actual final accepted count.

## 10. Targeted shortlist

### 10.1 `difficulty=any`

Unchanged: use the existing per-archetype shortlist path.

### 10.2 Specific target

For `easy`, `medium`, `hard`, or `expert`, shortlist selection becomes global.

The targeted shortlist size is 15.

Selection occurs in three conceptual passes.

### Pass 1: exact target with soft diversity cap

- consider only exact target-band candidates;
- prefer archetype distribution implied by the affinity policy;
- apply a soft maximum of 9 out of 15 from any one archetype;
- preserve existing ranking order inside equivalent groups.

### Pass 2: exact-target overflow

If exact target-band candidates remain but the soft diversity cap prevents filling all 15 slots, relax the cap.

Exact target matches always beat fallback candidates.

Therefore, 15 exact candidates from one archetype are preferable to a mixed shortlist containing fallback candidates only to improve archetype diversity.

### Pass 3: fallback

Fallback is used only when fewer than 15 exact target-band candidates exist in the final pool.

Fallback order is:

1. increasing band distance;
2. existing ranking / quality ordering;
3. deterministic seed tie-break.

Soft diversity should be attempted during fallback selection, but it must never replace a better exact candidate.

## 11. Determinism

All targeted-generation behavior must be deterministic for a given seed and configuration.

Do not introduce `Math.random()` or wall-clock-dependent ordering.

Deterministic output includes:

- reservoir contents;
- final targeted pool;
- global backfill;
- targeted shortlist;
- report ordering;
- generated JSON/Markdown output.

## 12. Report and schema changes

The generator report should expose enough information to distinguish policy intent from actual output.

Targeted reports should include at least:

- `difficultyTarget`;
- requested total pool size;
- nominal archetype quotas;
- actual accepted counts per archetype;
- reservoir goal and actual reservoir count per archetype;
- exact target count per archetype and overall;
- fallback count per archetype and overall;
- final pool exact rate;
- shortlist exact count / fallback count;
- shortlist archetype distribution;
- whether global backfill was used;
- missing slots if `completed=false`.

Prefer additive schema evolution. Do not remove existing fields required by current tooling unless an explicit migration is necessary.

## 13. Corpus analyzer v2

The multi-seed corpus analyzer must continue supporting the current `any`-pool analysis, and it must gain a mode that measures real targeted generation.

The same seed set should be runnable for each target band.

The targeted corpus should report, at minimum:

- seed completion rate;
- final accepted count;
- exact/fallback distribution in the 50-candidate pool;
- exact/fallback distribution in the 15-candidate shortlist;
- per-archetype actual contribution;
- frequency of backfill;
- per-target exact shortlist rate;
- unrated count;
- deterministic output.

The existing 10-seed corpus remains the standard regression corpus:

`1,42,1337,12345,54321,123456,654321,1000003,305419896,987654321`

## 14. Composition tuning policy

Target-conditioned composition changes are deferred until after the first Generator Difficulty v2 infrastructure corpus run.

The first implementation should change selection policy, reservoir behavior, quotas, backfill, shortlist behavior, and reporting only.

After measuring the 10-seed corpus:

- identify which targets still have insufficient exact supply;
- adjust only existing CandidateGenerator composition knobs that are supported by evidence;
- likely candidates include board size distribution, monster density/count, room-count/archetype choices, or already-existing spatial constraints;
- do not add new mechanics merely to move difficulty scores.

At most two post-v2 tuning cycles are planned before the generator is frozen for main game development.

## 15. Testing strategy

Testing must protect mechanics and policy invariants, not specific visual output.

### 15.1 Backward compatibility tests

For `difficulty=any`:

- existing deterministic baseline remains unchanged;
- old accepted-per-archetype behavior remains unchanged;
- two-room `+1` coverage behavior remains unchanged;
- old shortlist remains `shortlistPerArchetype * archetypeCount`;
- existing seed 123456 baseline remains identical unless a separately approved compatibility change is required.

### 15.2 Targeted quota tests

Verify:

- each initial affinity profile sums to 50;
- targeted mode does not use old two-room `+1` completion;
- reservoir goal is `2 * quota`;
- attempt hard stop remains enforced;
- exact target candidates rank ahead of all fallback candidates;
- rated fallback ranks ahead of unrated;
- global backfill fills missing archetype quota where eligible surplus exists;
- completed targeted pool has exactly 50 candidates.

### 15.3 Size coverage tests

Verify:

- 7x7/8x8 diversity is preferred among equivalent difficulty-tier candidates;
- size diversity never displaces exact target with fallback;
- targeted final count never exceeds quota because of size coverage.

### 15.4 Targeted shortlist tests

Verify:

- targeted shortlist size is 15 when pool is complete;
- exact candidates always precede fallback;
- soft archetype cap is 9 while sufficient diverse exact supply exists;
- cap may be exceeded to avoid fallback;
- fallback appears only when total exact supply is below 15;
- fallback ordering is deterministic and distance-aware.

### 15.5 Corpus tests

Verify deterministic corpus output and summary arithmetic for targeted mode.

Do not assert tuned exact-rate thresholds before the first measured targeted corpus establishes a baseline.

## 16. Acceptance criteria for Generator Difficulty v2 infrastructure

The infrastructure implementation is complete when:

- `difficulty=any` passes backward-compatibility tests and remains behaviorally identical;
- targeted mode supports all four rated targets;
- targeted completed pools contain exactly 50 candidates;
- targeted pools use the approved affinity profile;
- reservoir and hard-stop behavior are deterministic;
- global backfill is deterministic;
- targeted shortlist is global and contains 15 candidates when the pool is complete;
- exact difficulty matches have absolute priority over fallback;
- soft diversity cap does not reduce exact-target coverage;
- two-room size diversity does not reduce exact-target coverage;
- targeted corpus can be run across the standard 10 seeds;
- the first targeted corpus result is captured for tuning decisions.

## 17. Freeze rule

After Generator Difficulty v2 infrastructure and at most two evidence-driven composition tuning cycles, generator architecture is considered frozen for main game development.

Further generator work should require a concrete campaign or playtest problem rather than speculative optimization.
