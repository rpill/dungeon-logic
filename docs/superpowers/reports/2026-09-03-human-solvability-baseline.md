# Human Solvability Baseline — 2026-09-03

This report records the first deterministic baseline for the separate human-like
solver. It is a dev/offline analyzer and does not change Generator v1.2
acceptance, authored level registration, GameScene, BoardView, or canonical
LevelValidator semantics.

## Human solver model

The analyzer uses:

1. direct row/column deductions;
2. Directional Door deductions;
3. singleton Treasure Room interior / entrance deductions;
4. Monster exactly-one-exit deductions;
5. non-Monster hallway dead-end deductions outside every viable Treasure Room;
6. forbidden OPEN 2x2 deductions outside viable Treasure Rooms;
7. mandatory potential-connectivity articulation deductions;
8. bounded depth-1 proof by contradiction.

Contradiction probing is strictly depth-1. A probe assigns one cell, runs only
the direct deduction fixed point, records a contradiction if one is reached,
rolls back completely, and may then commit the opposite value. It never nests
another hypothetical contradiction probe and never calls the DFS uniqueness
solver as an oracle.

The canonical LevelValidator is still used only to validate a complete
materialized board.

Statuses:

- `solved-direct`
- `solved-with-contradiction`
- `stuck`
- `invalid`

## Commands

```text
npm run sanity:human
npm run sanity:human-analysis
npm run analyze:human -- --authored
npm run analyze:human -- --seed 123456 --shortlist
```

Generated analysis reads:

```text
.generated/candidates-<seed>.json
```

and writes deterministic reports:

```text
.generated/human-analysis-<seed>.json
.generated/human-analysis-<seed>.md
```

Authored analysis writes:

```text
.generated/human-analysis-authored.json
.generated/human-analysis-authored.md
```

No timestamps or wall-clock timings are written to these reports.

## Current-repository authored baseline

These results were produced by the user's current repository with:

```text
npm run analyze:human -- --authored
```

| Level | Status | Direct steps | Contradiction steps | Unknown |
| --- | --- | ---: | ---: | ---: |
| level-001 | solved-direct | 11 | 0 | 0 |
| level-002 | solved-direct | 12 | 0 | 0 |
| level-003 | solved-direct | 15 | 0 | 0 |
| level-004 | solved-direct | 15 | 0 | 0 |
| level-005 | solved-direct | 17 | 0 | 0 |
| level-006 | solved-with-contradiction | 21 | 7 | 0 |
| level-007 | solved-with-contradiction | 20 | 5 | 0 |
| level-008 | solved-with-contradiction | 19 | 1 | 0 |
| level-009 | solved-direct | 15 | 0 | 0 |
| level-010 | solved-with-contradiction | 27 | 9 | 0 |
| level-011 | stuck | 0 | 9 | 53 |
| level-012 | solved-with-contradiction | 23 | 7 | 0 |

Summary:

```text
total=12
solved-direct=6
solved-with-contradiction=5
stuck=1
invalid=0
```

This means half of the current authored batch is not solvable by direct rules
alone under the present human model. `level-011` remains stuck even after nine
successful depth-1 contradiction deductions, with 53 mutable cells still
unknown.

## Generator v1.2 shortlist baseline — seed 123456

These results were produced by the user's current repository with:

```text
npm run analyze:human -- --seed 123456 --shortlist
```

| Candidate | Status | Direct steps | Contradiction steps | Unknown |
| --- | --- | ---: | ---: | ---: |
| generated-monster-only-7-2491075932 | solved-direct | 20 | 0 | 0 |
| generated-monster-only-8-361304057 | solved-with-contradiction | 26 | 1 | 0 |
| generated-monster-only-7-512302628 | solved-with-contradiction | 24 | 2 | 0 |
| generated-chest-one-room-8-2568418654 | stuck | 0 | 0 | 63 |
| generated-chest-one-room-7-3193369624 | solved-direct | 16 | 0 | 0 |
| generated-chest-one-room-8-4193628777 | solved-with-contradiction | 22 | 1 | 0 |
| generated-chest-two-rooms-8-214184125 | solved-with-contradiction | 26 | 8 | 0 |
| generated-chest-two-rooms-7-870245706 | solved-direct | 16 | 0 | 0 |
| generated-chest-two-rooms-7-819912849 | solved-direct | 18 | 0 | 0 |
| generated-mixed-one-room-8-1936134028 | solved-direct | 17 | 0 | 0 |
| generated-mixed-one-room-8-4234123378 | solved-direct | 20 | 0 | 0 |
| generated-mixed-one-room-6-4267384426 | solved-direct | 11 | 0 | 0 |
| generated-mixed-two-rooms-8-3305430967 | solved-direct | 16 | 0 | 0 |
| generated-mixed-two-rooms-7-4032331667 | solved-direct | 13 | 0 | 0 |
| generated-mixed-two-rooms-7-3373527181 | solved-direct | 15 | 0 | 0 |

Summary:

```text
total=15
solved-direct=10
solved-with-contradiction=4
stuck=1
invalid=0
```

The most important generated outlier is:

```text
generated-chest-one-room-8-2568418654
status=stuck
directSteps=0
contradictionSteps=0
unknownRemaining=63
```

The current human model cannot find even the first deduction on this candidate.

## First comparison

Under the current rule model:

```text
Authored:
  direct  = 6 / 12 = 50.0%
  contradiction = 5 / 12 = 41.7%
  stuck = 1 / 12 = 8.3%

Generated shortlist:
  direct  = 10 / 15 = 66.7%
  contradiction = 4 / 15 = 26.7%
  stuck = 1 / 15 = 6.7%
```

So the reviewed generated shortlist is not broadly harder than the authored
batch according to this analyzer. In fact, a larger share of generated
shortlist levels are direct-only.

However, individual outliers matter. The 8x8 chest-one-room candidate above is
qualitatively different from most of the pool because the analyzer cannot make
a single opening deduction.

These statuses are diagnostic, not final human difficulty labels. A `stuck`
result means only that the current modeled rule set cannot continue. It does
not prove that a human cannot find another valid deduction pattern that has not
yet been implemented.

## Scope boundary

Human-solvability results do not yet gate Generator v1.2 acceptance or ranking.

No easy/medium/hard thresholds are defined yet. The next useful work is to
inspect traces for the two stuck cases (`level-011` and
`generated-chest-one-room-8-2568418654`) and determine whether:

1. the level genuinely requires deeper guessing;
2. the human solver is missing a reasonable direct deduction rule;
3. the generator should eventually penalize/reject a specific structural
   pattern.

Difficulty calibration should use these traces plus human playtesting rather
than invented thresholds.
