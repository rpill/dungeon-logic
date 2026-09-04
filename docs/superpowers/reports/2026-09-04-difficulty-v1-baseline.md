# Difficulty Analysis v1 Baseline — 2026-09-04

## Verification provenance

This baseline records the verified Difficulty Analysis v1 state after the
consolidated patch was applied to the user's full repository.

Verification source:

```text
user-local repository
D:\dev\games\dungeon-logic
```

The user reported that the requested full regression sequence completed
successfully and that the expected baseline/target checks were correct.

This document deliberately does not invent output hashes or timing numbers that
were not pasted back into the conversation.

## Implemented scope

Difficulty Analysis v1 is an internal deterministic layer above Human Solver.

It provides:

- a versioned continuous `0..100` score for rated solved levels;
- internal development bands:
  - `easy`
  - `medium`
  - `hard`
  - `expert`
  - `unrated`
- reasoning tiers:
  - `direct`
  - `contradiction-light`
  - `contradiction-heavy`
  - `expert-lookahead`
  - `unrated`
- deterministic score components:
  - board load
  - direct load
  - advanced direct-rule load
  - lookahead load
- deterministic diagnostic reasons.

The Difficulty Analyzer is separate from Human Solver.

It does not change:

- LevelValidator rules;
- PuzzleSolver uniqueness semantics;
- Human Solver deduction semantics;
- LevelQualityAnalyzer thresholds;
- Generator v1.2 geometry;
- Generator v1.2 accepted-pool validity/quality gates.

## Difficulty v1 reasoning bands

The hardest required modeled reasoning tier determines the non-overlapping
score interval.

```text
easy:   0..24
medium: 25..49
hard:   50..74
expert: 75..100
```

Classification:

```text
easy:
  ordinary contradiction = 0
  treasure-room-variant = 0

medium:
  ordinary contradiction = 1..2
  no expert condition

hard:
  ordinary contradiction = 3..8
  no expert condition

expert:
  treasure-room-variant >= 1
  OR ordinary contradiction >= 9
```

`stuck` and `invalid` Human Solver results produce:

```text
band=unrated
reasoningTier=unrated
score=null
```

Difficulty v1 is not percentile-based and does not use DFS node counts,
wall-clock solver time, current-pool distribution, random values, or timestamps.

## Authored baseline

Human Solver status:

```text
total=12
solved-direct=6
solved-with-contradiction=6
stuck=0
invalid=0
```

Difficulty v1 distribution:

```text
easy=6
medium=1
hard=3
expert=2
unrated=0
```

Per-level baseline:

| Level | Human status | Difficulty band |
| --- | --- | --- |
| level-001 | solved-direct | easy |
| level-002 | solved-direct | easy |
| level-003 | solved-direct | easy |
| level-004 | solved-direct | easy |
| level-005 | solved-direct | easy |
| level-006 | solved-with-contradiction | hard |
| level-007 | solved-with-contradiction | hard |
| level-008 | solved-with-contradiction | medium |
| level-009 | solved-direct | easy |
| level-010 | solved-with-contradiction | expert |
| level-011 | solved-with-contradiction | expert |
| level-012 | solved-with-contradiction | hard |

The authored batch therefore remains fully solved by the current Human Solver;
Difficulty Analysis only interprets the existing trace.

## Generator seed 123456 default shortlist baseline

Default command:

```text
npm run generate:candidates -- --seed 123456
```

Default difficulty target:

```text
any
```

Human Solver shortlist status:

```text
total=15
solved-direct=10
solved-with-contradiction=5
stuck=0
invalid=0
```

Difficulty v1 shortlist distribution:

```text
easy=10
medium=3
hard=1
expert=1
unrated=0
```

Expected default shortlist bands:

| Candidate | Difficulty |
| --- | --- |
| generated-monster-only-7-2491075932 | easy |
| generated-monster-only-8-361304057 | medium |
| generated-monster-only-7-512302628 | medium |
| generated-chest-one-room-8-2568418654 | expert |
| generated-chest-one-room-7-3193369624 | easy |
| generated-chest-one-room-8-4193628777 | medium |
| generated-chest-two-rooms-8-214184125 | hard |
| generated-chest-two-rooms-7-870245706 | easy |
| generated-chest-two-rooms-7-819912849 | easy |
| generated-mixed-one-room-8-1936134028 | easy |
| generated-mixed-one-room-8-4234123378 | easy |
| generated-mixed-one-room-6-4267384426 | easy |
| generated-mixed-two-rooms-8-3305430967 | easy |
| generated-mixed-two-rooms-7-4032331667 | easy |
| generated-mixed-two-rooms-7-3373527181 | easy |

The former human-solver outlier:

```text
generated-chest-one-room-8-2568418654
```

is rated `expert` rather than `stuck`.

## Generator integration boundary

Difficulty metadata is attached only after a candidate has already passed the
existing Generator v1.2 acceptance path.

Conceptually:

```text
generate
→ existing validity / uniqueness / quality / warning gates
→ accepted candidate
→ Human Solver
→ Difficulty Analyzer
→ DifficultyProfile
→ ranking / reports
```

Difficulty Analysis v1 does not add a new CandidateFactory rejection reason.

An `unrated` candidate is diagnostic metadata, not an automatic rejection.

Rejected attempts do not run the Human Solver / Difficulty Analyzer work added
by Difficulty v1.

## Difficulty-target shortlist ranking

Generator CLI accepts:

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

`any` preserves the existing Generator v1.2 shortlist selection behavior for
the same accepted pool.

For a specific target:

1. exact requested band is preferred;
2. adjacent bands are fallback;
3. existing quality/diversity ranking remains meaningful inside equal
   difficulty distance;
4. score-center distance is only a later tie-break;
5. unrated candidates rank after rated alternatives;
6. difficulty does not change accepted-pool membership.

The existing two-room 7x7/8x8 shortlist coverage requirement remains stronger
than difficulty preference.

## Targeted seed-123456 verification

The targeted command was included in the full user-local verification:

```text
npm run generate:candidates -- --seed 123456 --difficulty hard
```

The accepted pool remained governed by the existing Generator v1.2 acceptance
rules.

Expected accepted total remained:

```text
50
```

The shortlist was allowed to differ from the default `any` shortlist in order to
prefer `hard` candidates.

Difficulty targeting is ranking-only in v1.

## Regression commands verified by the user

The full requested verification sequence was:

```text
npm run sanity:difficulty
npm run sanity:human
npm run sanity:human-analysis
npm run sanity:generator
npx tsx src/dev/profilerSanity.ts
npx tsx src/dev/generatedPlaytestSanity.ts
npx tsx src/dev/gameBoardLayoutSanity.ts
npm run build
npm run analyze:human -- --authored
npm run generate:candidates -- --seed 123456
npm run analyze:human -- --seed 123456 --shortlist
npm run generate:candidates -- --seed 123456 --difficulty hard
```

The user reported that everything was OK.

No test/build result is claimed here beyond that user-local verification report.

## Current design boundary

Difficulty Analysis v1 remains an internal development instrument.

Not implemented in this version:

- player-facing difficulty labels;
- campaign progression based on score;
- authored level reordering based only on Difficulty v1;
- difficulty acceptance gates;
- generation geometry changes targeted at a desired score;
- telemetry calibration;
- percentile difficulty;
- deeper contradiction lookahead;
- additional Human Solver rules without a concrete counterexample.

The next difficulty work should be driven by larger generated samples and human
playtests, not by adding more scoring complexity immediately.
