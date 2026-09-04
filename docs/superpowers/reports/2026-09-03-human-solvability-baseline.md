# Human Solvability Baseline — 2026-09-04

This report records the first deterministic baseline for the separate human-like
solver after adding bounded Treasure Room variant reasoning.

The analyzer is a dev/offline diagnostic tool. It does not change Generator
v1.2 acceptance, authored level registration, GameScene, BoardView, or
canonical LevelValidator semantics.

## Human solver model

The analyzer currently uses:

1. direct row/column deductions;
2. Directional Door deductions;
3. singleton Treasure Room interior / entrance deductions;
4. Monster exactly-one-exit deductions;
5. non-Monster hallway dead-end deductions outside every viable Treasure Room;
6. forbidden OPEN 2x2 deductions outside viable Treasure Rooms;
7. mandatory potential-connectivity articulation deductions;
8. bounded depth-1 proof by contradiction on a single mutable cell;
9. bounded Treasure Room variant reasoning.

Treasure Room variant reasoning is classified as contradiction-tier.

For one Chest, the solver enumerates currently viable combinations of:

```text
3x3 Treasure Room footprint
+
exactly one Treasure Room entrance
```

Each variant is checked by applying only that structural assumption and running
the existing DIRECT fixed point. No nested contradiction probing is allowed.

Variants that directly contradict the existing rules are discarded.

The solver then commits only Treasure Room facts justified by every surviving
variant:

- when every surviving variant has the same 3x3 footprint, remaining mutable
  interior cells of that footprint are committed OPEN;
- when exactly one full room+entrance variant survives, its entrance is
  committed OPEN and every remaining mutable non-entrance boundary cell is
  committed WALL.

The solver does not commit arbitrary board-wide consensus assignments produced
inside hypothetical variants.

The existing single-cell depth-1 contradiction scan keeps priority over this
heavier Treasure Room variant analysis.

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

No timestamps or wall-clock timings are written to these generated reports.

## Verification

After adding Treasure Room variant reasoning, the user-local regression runs
reported:

```text
Human solver sanity:   98/98 checks passed
Human analysis sanity: 15/15 checks passed
```

The full repository `sanity:generator` and `build` are still expected as the
final repository-level regression gate before committing this follow-up.

## Current authored baseline

Current-repository result:

```text
total=12
solved-direct=6
solved-with-contradiction=6
stuck=0
invalid=0
directSteps=212
contradictionSteps=39
assignments=539
unknownRemaining=0
```

| Level | Status | Direct steps | Contradiction-tier steps | Unknown |
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
| level-011 | solved-with-contradiction | 17 | 10 | 0 |
| level-012 | solved-with-contradiction | 23 | 7 | 0 |

### Former authored stuck: level-011

Before Treasure Room variant reasoning:

```text
status=stuck
directSteps=0
contradictionSteps=9
unknownRemaining=53
```

After the new rule:

```text
status=solved-with-contradiction
directSteps=17
contradictionSteps=10
unknownRemaining=0
treasure-room-variant rule count=1
ordinary contradiction rule count=9
```

The important distinction is that `contradictionSteps` counts every
contradiction-tier proof step, while `ruleCounts.contradiction` counts only the
ordinary single-cell contradiction rule. A `treasure-room-variant` step is
therefore included in `contradictionSteps` but has its own rule-count bucket.

## Generator v1.2 shortlist baseline — seed 123456

Current-repository result:

```text
total=15
solved-direct=10
solved-with-contradiction=5
stuck=0
invalid=0
directSteps=290
contradictionSteps=32
assignments=762
unknownRemaining=0
```

| Candidate | Status | Direct steps | Contradiction-tier steps | Unknown |
| --- | --- | ---: | ---: | ---: |
| generated-monster-only-7-2491075932 | solved-direct | 20 | 0 | 0 |
| generated-monster-only-8-361304057 | solved-with-contradiction | 26 | 1 | 0 |
| generated-monster-only-7-512302628 | solved-with-contradiction | 24 | 2 | 0 |
| generated-chest-one-room-8-2568418654 | solved-with-contradiction | 30 | 20 | 0 |
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

### Former generated stuck: generated-chest-one-room-8-2568418654

Before Treasure Room variant reasoning:

```text
status=stuck
directSteps=0
contradictionSteps=0
unknownRemaining=63
```

Diagnostic investigation found nine initially viable Treasure Room footprints.
When complete `room footprint + sole entrance` variants were filtered using
DIRECT deductions only, every surviving variant shared the same Treasure Room
footprint.

After adding bounded Treasure Room variant reasoning:

```text
status=solved-with-contradiction
directSteps=30
contradictionSteps=20
unknownRemaining=0
treasure-room-variant rule count=1
ordinary contradiction rule count=19
```

So the level was not evidence that Generator v1.2 necessarily produced a
guess-only puzzle. It exposed a missing structural reasoning rule in the human
solver.

## First difficulty comparison

Under the current model:

```text
Authored:
  solved-direct             6 / 12 = 50.0%
  solved-with-contradiction 6 / 12 = 50.0%
  stuck                     0 / 12 = 0.0%

Generated shortlist:
  solved-direct             10 / 15 = 66.7%
  solved-with-contradiction  5 / 15 = 33.3%
  stuck                      0 / 15 = 0.0%
```

The reviewed generated shortlist is therefore not broadly harder than the
authored batch according to the current analyzer. A larger share of the
generated shortlist is direct-only.

This does not yet define player-facing difficulty. Contradiction-step count,
direct-step count, board size, branching burden, visual pattern recognition,
and human playtest friction are different signals and should not be collapsed
into an invented easy/medium/hard threshold yet.

## Scope boundary

All 27 currently analyzed authored/shortlisted levels are solvable by the
current human model without invoking the DFS uniqueness solver as a solving
oracle and without contradiction lookahead deeper than the explicitly bounded
rules above.

This is a useful first completeness boundary, not proof that the human solver
models every reasonable human deduction.

Human-solvability results still do not gate Generator v1.2 acceptance or
ranking.

The next generator/difficulty decision should be based on these traces plus
human playtesting rather than adding more human-solver rules without a concrete
counterexample.
