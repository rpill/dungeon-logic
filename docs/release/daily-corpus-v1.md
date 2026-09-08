# Daily v1 Corpus Curation Report

Generated on 2026-09-09 for the v1 release-content pass.

## Reproduction

- Master seed: `20260909`
- Board size: `7x7`
- Scan plan:
  - `monster-only`: 1,000 attempts
  - `mixed-one-room`: 5,000 attempts
  - `chest-one-room`: 3,000 attempts
- Runtime generation: **none**. These are immutable offline snapshots.
- Calendar binding is defined separately in `src/content/daily/calendar.ts`; Task 25 maps these immutable snapshots to the current v1 release-candidate UTC schedule.

## Reservoir and gates

- Canonically accepted after monster-density policy: 915
- Medium/hard candidates in score range 30–68 before campaign exclusion: 203
- Rejected for campaign-equivalent wall geometry: 30
- Daily-release eligible after campaign exclusion: 173
- Selected snapshots: 60
- Eligible remainder after selection: 113

Every selected snapshot is revalidated by canonical acceptance and Human Solver. Blockers, Directional Doors, two-room archetypes, easy, expert, and unrated candidates are excluded.

## Final mix

- `monster-only`: 24
- `mixed-one-room`: 24
- `chest-one-room`: 12
- Medium: 27
- Hard: 33
- Difficulty score range: 30–67
- Mean difficulty score: 50.6
- Maximum distance from the selector target score: 7
- Minimum adjacent candidate distance: 0.18247084548104953
- Mean adjacent candidate distance: 0.32665549560826096
- Rotation/reflection-equivalent wall layouts within Daily: 0
- Rotation/reflection-equivalent wall layouts against Campaign 001–030: 0

## Selected snapshots

| # | Archetype | Band | Score | Target | Source candidate |
|---:|---|---|---:|---:|---|
| 01 | `monster-only` | medium | 32 | 32 | `generated-monster-only-7-580725752` |
| 02 | `mixed-one-room` | medium | 31 | 34 | `generated-mixed-one-room-7-901780229` |
| 03 | `chest-one-room` | medium | 44 | 44 | `generated-chest-one-room-7-1106647292` |
| 04 | `mixed-one-room` | medium | 43 | 40 | `generated-mixed-one-room-7-2366879774` |
| 05 | `monster-only` | medium | 44 | 38 | `generated-monster-only-7-581019942` |
| 06 | `monster-only` | medium | 44 | 44 | `generated-monster-only-7-3696005191` |
| 07 | `mixed-one-room` | medium | 45 | 46 | `generated-mixed-one-room-7-2632286051` |
| 08 | `chest-one-room` | medium | 45 | 48 | `generated-chest-one-room-7-2724640094` |
| 09 | `mixed-one-room` | hard | 55 | 52 | `generated-mixed-one-room-7-2703757857` |
| 10 | `monster-only` | medium | 44 | 50 | `generated-monster-only-7-2324599163` |
| 11 | `monster-only` | hard | 56 | 56 | `generated-monster-only-7-3259934192` |
| 12 | `mixed-one-room` | hard | 57 | 58 | `generated-mixed-one-room-7-839416118` |
| 13 | `chest-one-room` | hard | 55 | 50 | `generated-chest-one-room-7-3476639917` |
| 14 | `mixed-one-room` | hard | 62 | 64 | `generated-mixed-one-room-7-4111376756` |
| 15 | `monster-only` | hard | 62 | 62 | `generated-monster-only-7-1279586770` |
| 16 | `monster-only` | medium | 31 | 34 | `generated-monster-only-7-2098303882` |
| 17 | `mixed-one-room` | medium | 32 | 36 | `generated-mixed-one-room-7-64295394` |
| 18 | `chest-one-room` | hard | 56 | 52 | `generated-chest-one-room-7-3231631432` |
| 19 | `mixed-one-room` | medium | 43 | 42 | `generated-mixed-one-room-7-1855909423` |
| 20 | `monster-only` | medium | 44 | 40 | `generated-monster-only-7-751838800` |
| 21 | `monster-only` | medium | 44 | 46 | `generated-monster-only-7-2099142525` |
| 22 | `mixed-one-room` | medium | 44 | 48 | `generated-mixed-one-room-7-3979842936` |
| 23 | `chest-one-room` | hard | 59 | 54 | `generated-chest-one-room-7-860051705` |
| 24 | `mixed-one-room` | hard | 54 | 54 | `generated-mixed-one-room-7-2917799764` |
| 25 | `monster-only` | hard | 56 | 52 | `generated-monster-only-7-978987067` |
| 26 | `monster-only` | hard | 58 | 58 | `generated-monster-only-7-817878084` |
| 27 | `mixed-one-room` | hard | 60 | 60 | `generated-mixed-one-room-7-1613757372` |
| 28 | `chest-one-room` | hard | 59 | 56 | `generated-chest-one-room-7-1331308710` |
| 29 | `mixed-one-room` | hard | 67 | 66 | `generated-mixed-one-room-7-748474622` |
| 30 | `monster-only` | hard | 62 | 64 | `generated-monster-only-7-2397203802` |
| 31 | `monster-only` | medium | 32 | 36 | `generated-monster-only-7-165633380` |
| 32 | `mixed-one-room` | medium | 32 | 32 | `generated-mixed-one-room-7-2413012821` |
| 33 | `chest-one-room` | hard | 61 | 58 | `generated-chest-one-room-7-1687770787` |
| 34 | `mixed-one-room` | medium | 31 | 38 | `generated-mixed-one-room-7-4285378288` |
| 35 | `monster-only` | medium | 43 | 42 | `generated-monster-only-7-47470392` |
| 36 | `monster-only` | medium | 44 | 48 | `generated-monster-only-7-3119498482` |
| 37 | `mixed-one-room` | medium | 43 | 44 | `generated-mixed-one-room-7-1462676595` |
| 38 | `chest-one-room` | hard | 62 | 60 | `generated-chest-one-room-7-3798207083` |
| 39 | `mixed-one-room` | hard | 56 | 50 | `generated-mixed-one-room-7-4193463377` |
| 40 | `monster-only` | hard | 56 | 54 | `generated-monster-only-7-2342509615` |
| 41 | `monster-only` | hard | 59 | 60 | `generated-monster-only-7-1178773961` |
| 42 | `mixed-one-room` | hard | 57 | 56 | `generated-mixed-one-room-7-2717993136` |
| 43 | `chest-one-room` | hard | 66 | 62 | `generated-chest-one-room-7-2529247727` |
| 44 | `mixed-one-room` | hard | 61 | 62 | `generated-mixed-one-room-7-1126751909` |
| 45 | `monster-only` | hard | 65 | 66 | `generated-monster-only-7-43534527` |
| 46 | `monster-only` | medium | 32 | 33 | `generated-monster-only-7-1941578599` |
| 47 | `mixed-one-room` | medium | 30 | 35 | `generated-mixed-one-room-7-3160720178` |
| 48 | `chest-one-room` | hard | 64 | 64 | `generated-chest-one-room-7-2736571921` |
| 49 | `mixed-one-room` | medium | 44 | 41 | `generated-mixed-one-room-7-3680821131` |
| 50 | `monster-only` | medium | 43 | 39 | `generated-monster-only-7-424792351` |
| 51 | `monster-only` | medium | 44 | 45 | `generated-monster-only-7-2329254683` |
| 52 | `mixed-one-room` | medium | 44 | 47 | `generated-mixed-one-room-7-1331311834` |
| 53 | `chest-one-room` | hard | 64 | 66 | `generated-chest-one-room-7-1889396405` |
| 54 | `mixed-one-room` | hard | 57 | 53 | `generated-mixed-one-room-7-4210093901` |
| 55 | `monster-only` | hard | 57 | 51 | `generated-monster-only-7-3874985645` |
| 56 | `monster-only` | hard | 57 | 57 | `generated-monster-only-7-2655229940` |
| 57 | `mixed-one-room` | hard | 57 | 59 | `generated-mixed-one-room-7-2471555070` |
| 58 | `chest-one-room` | hard | 59 | 56 | `generated-chest-one-room-7-3512546275` |
| 59 | `mixed-one-room` | hard | 67 | 65 | `generated-mixed-one-room-7-4127462827` |
| 60 | `monster-only` | hard | 61 | 63 | `generated-monster-only-7-3891071716` |
