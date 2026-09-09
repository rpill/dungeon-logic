# Daily v1 Corpus Curation Report

**Updated:** 2026-09-09  
**Shipped corpus:** `daily-001` … `daily-365`

## Reproduction and release model

- Master seed: `20260909`.
- Board size: `7x7`.
- Offline scan plan remains `monster-only` 1,000 attempts, `mixed-one-room` 5,000 attempts, `chest-one-room` 3,000 attempts per deterministic reservoir pass.
- Runtime generation: **none**. All 365 Daily puzzles are committed static snapshots.
- Calendar binding is static in `src/content/daily/calendar.ts` and covers `2026-09-09` through `2027-09-08` UTC.
- `daily-001` … `daily-060` are preserved from the original release corpus; `daily-061` … `daily-365` extend the schedule for the remainder of the year.

## Release gates

Every shipped snapshot is revalidated by canonical acceptance and Human Solver. Blockers, Directional Doors, two-room archetypes, easy, expert, and unrated candidates are excluded. Candidate IDs and rotation/reflection-equivalent wall layouts are unique across Daily. Daily wall layouts are also excluded against **Campaign 001–064**.

- Selected snapshots: **365**.
- Campaign/Daily structural collisions: **0**.
- Duplicate Daily structural fingerprints: **0**.
- `monster-only`: **217**.
- `mixed-one-room`: **126**.
- `chest-one-room`: **22**.
- Medium: **190**.
- Hard: **175**.
- Difficulty score range: **30–68**.
- Mean difficulty score: **48.18**.
- Maximum distance from the selector target score: **7**.

## Preserved first 60 vs extension

| Range | Count | Monster | Mixed | Chest | Medium | Hard | Score range | Mean score |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| `daily-001` … `daily-060` | 60 | 24 | 24 | 12 | 27 | 33 | 30–67 | 50.60 |
| `daily-061` … `daily-365` | 305 | 193 | 102 | 10 | 163 | 142 | 31–68 | 47.70 |
| **Total** | **365** | **217** | **126** | **22** | **190** | **175** | **30–68** | **48.18** |

The exact immutable snapshot content and provenance live in `src/content/daily/snapshots/`. The one-to-one UTC mapping is documented in `docs/release/daily-calendar-v1.md`.
