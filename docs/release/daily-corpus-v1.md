# Daily Production Corpus Report

**Updated:** 2026-09-19  
**Shipped catalog:** `daily-0001` … `daily-7305`

## Production model

- Selected records: **7,305**.
- Calendar: `2026-09-09` through `2046-09-08` UTC.
- Runtime generation: **none**.
- Production asset: `public/content/daily/verified-levels.bin`.
- Manifest: `public/content/daily/verified-levels-manifest.json`.
- Binary format: fixed 28-byte records containing exact board geometry/object masks plus difficulty/archetype metadata.
- Per-level `src/content/daily/snapshots/*.ts` files are not shipped.

## Release gates

Every production record is re-audited against the current Campaign and Endless selections using structural fingerprints. Rotation/reflection-equivalent wall layouts are treated as collisions.

- Daily structural duplicates: **0**.
- Campaign/Daily structural collisions: **0**.
- Endless/Daily structural collisions: **0**.
- Campaign/Endless structural collisions: **0**.
- Weekday difficulty violations: **0**.
- Verified Daily records: **7,305 / 7,305**.
- Campaign exclusion scope: **Campaign 001–064**.
- Endless exclusion scope: **100,000 production entries**.

## Composition

| Archetype | Count |
|---|---:|
| `monster-only` | 4,854 |
| `mixed-one-room` | 2,429 |
| `chest-one-room` | 22 |
| **Total** | **7,305** |

| Board size | Count |
|---|---:|
| 7×7 | 5,412 |
| 8×8 | 1,893 |
| **Total** | **7,305** |

The authoritative counts and SHA-256 are stored in the production manifest; `src/dev/dailyCorpusSanity.ts` independently reads and checks the binary against current cross-pool fingerprints.
