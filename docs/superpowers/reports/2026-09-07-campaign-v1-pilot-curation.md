# Campaign v1 Pilot Curation Report

Date: 2026-09-07

The first four selections come from the three approved deterministic easy-target reports (`123456`, `654321`, `1337`). Those reports contained only one eligible easy `chest-one-room` candidate at size 6/7, while the pilot needs distinct chest levels in slots 2 and 5. To avoid shipping the same puzzle twice, slot 5 uses a deterministic rescue candidate generated directly with `generateCandidate({ archetype: 'chest-one-room', size: 7, seed: 2320 })` and accepted fresh by the canonical `evaluateCandidate` + campaign promotion gates. No generator policy or campaign curation rule was changed.

| Slot | Seed | Candidate id | Archetype | Size | Difficulty score | Human status | Why here |
| ---: | ---: | --- | --- | ---: | ---: | --- | --- |
| 1 | 123456 | `generated-monster-only-6-2398889868` | monster-only | 6×6 | 4 | solved-direct | The shortest readable opener in the eligible pool: line clues establish most of the board and one explicit monster-dead-end deduction introduces the object rule without extra rule families. |
| 2 | 123456 | `generated-chest-one-room-7-3193369624` | chest-one-room | 7×7 | 10 | solved-direct | A clean single-room board with no monsters lets the Treasure Room tutorial own the level while the room sits away from the opening level's visual structure. |
| 3 | 654321 | `generated-monster-only-6-2057422507` | monster-only | 6×6 | 6 | solved-direct | Returns to monsters with a visibly different wall pattern and adds an open-2×2 deduction, giving a small reasoning step-up without leaving the easy band. |
| 4 | 1337 | `generated-mixed-one-room-6-3782245294` | mixed-one-room | 6×6 | 6 | solved-direct | The first mixed board actually uses both Treasure Room interior logic and a monster-dead-end deduction, so the mechanics combine instead of merely coexisting visually. |
| 5 | 2320 | `generated-chest-one-room-7-2320` | chest-one-room | 7×7 | 11 | solved-direct | A second distinct room placement closes the pilot with a slightly denser chest-only puzzle, acting as a consolidation level after the mixed board rather than repeating slot 2. |
