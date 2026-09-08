# Campaign v1 Curation Report

**Date:** 2026-09-08

## Reservoir recipe

- Master seed: `20260908`
- `monster-only` 7×7: 1,500 attempts → 289 release-accepted candidates
- `mixed-one-room` 7×7: 5,000 attempts → 576 release-accepted candidates
- `chest-one-room` 7×7: 2,000 attempts → 97 release-accepted candidates
- Total release reservoir: **962 accepted candidates**
- Promoted to campaign: **25** (`006–030`)
- Retained reproducible reservoir: **937** candidates

The reservoir is not committed as a large JSON blob. It is exactly reproducible from `CAMPAIGN_RELEASE_MASTER_SEED` and `CAMPAIGN_RELEASE_SCAN_PLAN` in `src/content/release/CampaignReleaseSelection.ts`.

8×8 candidates were not required for Campaign v1: every late slot permits 7×7, while 8×8 canonical solving was materially more expensive during offline curation. Generic 8×8 generation remains available for Daily/future content.

## Selection gates

- Final-v1 campaign slot allow-list from `curationPlan.ts`.
- Generic generator monster-density hard cap.
- Canonical candidate acceptance and independent campaign promotion revalidation.
- Human Solver rated result only.
- Target difficulty score per slot.
- Minimum adjacent structural distance `0.28` whenever eligible alternatives exist.
- Global wall-layout fingerprint uniqueness across rotation/reflection.
- Candidate id uniqueness.

## Promoted levels

| Slot | Archetype | Difficulty | Target | Actual | Quality | Prev. distance | Eligible | Source candidate |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 006 | `mixed-one-room` | easy | 14 | 14 | 101.250 | — | 532 | `generated-mixed-one-room-7-1202807671` |
| 007 | `monster-only` | easy | 15 | 15 | 101.500 | 0.327 | 231 | `generated-monster-only-7-108316283` |
| 008 | `monster-only` | medium | 30 | 30 | 99.747 | 0.304 | 230 | `generated-monster-only-7-3789115606` |
| 009 | `monster-only` | medium | 31 | 32 | 102.500 | 0.354 | 67 | `generated-monster-only-7-754018346` |
| 010 | `mixed-one-room` | medium | 30 | 31 | 101.260 | 0.299 | 29 | `generated-mixed-one-room-7-186736811` |
| 011 | `monster-only` | medium | 32 | 32 | 101.000 | 0.301 | 66 | `generated-monster-only-7-4082243152` |
| 012 | `monster-only` | medium | 43 | 43 | 102.500 | 0.362 | 121 | `generated-monster-only-7-4161707177` |
| 013 | `mixed-one-room` | medium | 44 | 45 | 100.000 | 0.318 | 69 | `generated-mixed-one-room-7-1720831423` |
| 014 | `monster-only` | hard | 55 | 56 | 101.250 | 0.378 | 56 | `generated-monster-only-7-1660428563` |
| 015 | `chest-one-room` | medium | 44 | 44 | 100.000 | 0.469 | 4 | `generated-chest-one-room-7-3249734737` |
| 016 | `chest-one-room` | hard | 57 | 57 | 100.000 | 0.285 | 20 | `generated-chest-one-room-7-3043298098` |
| 017 | `mixed-one-room` | medium | 45 | 43 | 99.564 | 0.497 | 27 | `generated-mixed-one-room-7-1411362502` |
| 018 | `chest-one-room` | hard | 58 | 58 | 100.000 | 0.468 | 16 | `generated-chest-one-room-7-3380548303` |
| 019 | `mixed-one-room` | hard | 56 | 57 | 101.500 | 0.447 | 67 | `generated-mixed-one-room-7-4265337869` |
| 020 | `chest-one-room` | hard | 60 | 60 | 100.000 | 0.401 | 15 | `generated-chest-one-room-7-2763683218` |
| 021 | `mixed-one-room` | hard | 59 | 59 | 100.000 | 0.419 | 40 | `generated-mixed-one-room-7-1928236537` |
| 022 | `chest-one-room` | hard | 62 | 62 | 100.000 | 0.392 | 52 | `generated-chest-one-room-7-1650520951` |
| 023 | `monster-only` | hard | 57 | 57 | 101.500 | 0.311 | 119 | `generated-monster-only-7-3998501993` |
| 024 | `chest-one-room` | hard | 61 | 60 | 100.000 | 0.515 | 12 | `generated-chest-one-room-7-1414354357` |
| 025 | `mixed-one-room` | hard | 60 | 60 | 101.250 | 0.558 | 39 | `generated-mixed-one-room-7-1156550436` |
| 026 | `monster-only` | hard | 62 | 62 | 101.250 | 0.340 | 54 | `generated-monster-only-7-118748130` |
| 027 | `chest-one-room` | hard | 64 | 64 | 91.806 | 0.455 | 11 | `generated-chest-one-room-7-1989983689` |
| 028 | `mixed-one-room` | hard | 64 | 62 | 98.984 | 0.425 | 38 | `generated-mixed-one-room-7-3716676536` |
| 029 | `monster-only` | hard | 66 | 66 | 100.000 | 0.361 | 53 | `generated-monster-only-7-2131173993` |
| 030 | `chest-one-room` | hard | 69 | 69 | 93.745 | 0.465 | 99 | `generated-chest-one-room-7-519962590` |

All 25 selections completed without the diversity fallback. `campaign001–005` remain unchanged.
