# Daily 7305 Binary Catalog Design

## Goal

Replace the current 365 TypeScript Daily snapshots with one production binary catalog containing 7,305 immutable Daily puzzles (20 years), while guaranteeing zero structural overlap between Campaign, Daily, and Endless.

The release calendar starts at `2026-09-09` and contains exactly 7,305 consecutive UTC dates through `2046-09-08` inclusive.

## Current-state audit

The 2026-09-18 project archive contains:

- 64 authored/promoted Campaign levels.
- 365 Daily snapshot modules under `src/content/daily/snapshots/`.
- 100,000 Endless entries in `.generated/endless/selection.jsonl`.
- 100,000 records across `.generated/endless/reservoir/`.
- `public/content/endless/verified-levels.bin` with 100,000 records.

The Endless reservoir is not a reserve pool: every one of its 100,000 structural fingerprints is already present in the selected Endless catalog. There are no spare verified Endless candidates in the archive.

Current cross-pool structural audit:

- Campaign fingerprints: 64 unique.
- Daily fingerprints: 365 unique.
- Endless fingerprints: 100,000 unique.
- Campaign ↔ Daily collisions: 0.
- Daily ↔ Endless collisions: 0.
- Campaign ↔ Endless collisions: 10.

The 10 Campaign ↔ Endless collisions must be repaired before freezing the new Daily catalog.

The current Endless selection cannot simply donate the 7,305 Daily entries. Its low-score supply is far too small for the agreed weekday policy: only 37 selected Endless entries score `0..15` and only 63 score `10..30`, while the 20-year calendar needs 1,043 Mondays and 1,043 Tuesdays.

## Calendar and weekday difficulty policy

`DAILY_RELEASE_COUNT = 7305`.

Calendar range:

- first date: `2026-09-09`
- last date: `2046-09-08`

Weekday occurrence counts in that range:

- Monday: 1,043
- Tuesday: 1,043
- Wednesday: 1,044
- Thursday: 1,044
- Friday: 1,044
- Saturday: 1,044
- Sunday: 1,043

Difficulty score bands are fixed:

| Weekday | Score band |
| --- | ---: |
| Monday | 0..15 |
| Tuesday | 10..30 |
| Wednesday | 25..45 |
| Thursday | 40..60 |
| Friday | 55..75 |
| Saturday | 70..90 |
| Sunday | 80..95 |

Every selected Daily entry must fall inside the band for its exact UTC release date. No fallback outside the band is allowed.

## Daily candidate policy

Daily is rebuilt from scratch because the game is not released and no compatibility with the existing 365 snapshots is required.

Daily generation uses a dedicated deterministic master seed and attempt stream separate from Endless. The exact seed is stored in the offline generation manifest, not relied on by runtime.

Production-safe Daily candidates use the existing Daily archetype family:

- `monster-only`
- `mixed-one-room`
- `chest-one-room`

Board sizes are 7x7 or 8x8. Blockers and doors are forbidden. Candidates must be uniquely solvable and accepted by the existing quality and human-solvability gates.

The selector keeps approximately the existing Daily composition over the full catalog:

- monster-only: about 60%
- mixed-one-room: about 34%
- chest-one-room: about 6%

These are balancing targets, not reasons to violate weekday difficulty or uniqueness. Weekday score validity and structural uniqueness take priority.

Neighbor diversity remains enforced. The selector prefers candidates sufficiently distant from recent Daily entries and penalizes repeated archetypes/similar geometry over a short rolling window.

## Structural uniqueness

Structural identity uses the existing `campaignReleaseStructuralFingerprint(solution)` function. It canonicalizes the solution wall mask across all rotations and reflections.

This is intentionally stricter than comparing ids or generator seeds. Two boards with equivalent wall solutions are considered duplicates even if generated from different seeds or transformed geometrically.

The final invariant is:

- Campaign ↔ Daily = 0 collisions.
- Daily ↔ Daily = 0 collisions.
- Daily ↔ Endless = 0 collisions.
- Campaign ↔ Endless = 0 collisions.

### Selection order

1. Load the 64 current Campaign fingerprints.
2. Repair the 10 Campaign-colliding Endless entries with newly generated replacements that do not collide with Campaign or the other 99,990 Endless fingerprints.
3. Freeze the repaired 100,000-entry Endless fingerprint set.
4. Generate Daily candidates using a separate deterministic stream.
5. Reject every candidate whose fingerprint exists in Campaign or repaired Endless.
6. Reject every candidate whose fingerprint has already been selected for Daily.
7. Assign 7,305 candidates to exact calendar ordinals while satisfying the weekday score band for every date.
8. Run a full independent cross-pool audit before packing production files.

## Endless collision repair

The existing Endless ordering and progression should remain unchanged except at the 10 colliding ordinals.

Each colliding ordinal is replaced by a fresh candidate chosen to match the original entry as closely as possible:

1. same lane/archetype and board size when feasible;
2. difficulty score nearest to the original target score;
3. quality score and neighbor distance used as tie-breakers;
4. no collision with Campaign, Daily, or any other Endless entry.

The other 99,990 Endless entries remain untouched.

The repaired Endless selection is repacked to the existing production binary format and receives a new manifest/content hash.

## Offline Daily generation artifacts

Development-only artifacts live under `.generated/daily/` and are never imported into the game bundle:

```text
.generated/daily/
  generation-state.json
  reservoir/
  selection.jsonl
  verification.json
  audit.json
```

`selection.jsonl` stores provenance for every ordinal, including at minimum:

- ordinal
- UTC date key
- generator seed
- candidate id
- archetype
- board size
- difficulty score
- difficulty band
- quality score
- structural fingerprint
- target weekday band
- previous-neighbor distance

Generation is resumable. `generation-state.json` records the next attempt for every generation lane so interrupted scans do not restart from zero.

## Daily production binary

Production no longer contains one TypeScript module per Daily puzzle.

Production files:

```text
public/content/daily/
  verified-levels.bin
  verified-levels-manifest.json
```

The binary stores exact puzzle definitions, not just seeds. A future generator change therefore cannot silently alter a released Daily puzzle.

### Binary structure

The catalog uses a versioned header, an offset table, and variable-length records.

Header contains:

- magic/version
- entry count (`7305`)
- first UTC date ordinal metadata
- offset-table location

Each level record stores enough data to reconstruct an exact `LevelDefinition`:

- board size
- archetype code (for diagnostics)
- difficulty score (for diagnostics/sanity)
- solution wall mask
- monster positions
- chest positions

Row and column clues are reconstructed deterministically from the stored solution wall mask. Runtime ids are reconstructed from ordinal as `daily-0001` through `daily-7305`. Daily production policy forbids blockers and doors, so they decode as empty arrays.

Records are addressed through the offset table. This allows a catalog object to decode only the requested level instead of eagerly allocating 7,305 `LevelDefinition` objects at boot.

## Runtime architecture

New runtime components:

- `DailyCatalogFormat.ts` — binary constants, record decoder/encoder shared by dev packer and runtime.
- `DailyCatalog.ts` — owns the loaded ArrayBuffer, offset table, and on-demand decoded-level cache.
- `DailyCatalogLoader.ts` — fetches `public/content/daily/verified-levels.bin` during boot and validates header/version/count.
- `calendar.ts` — computes date ↔ ordinal mapping without materializing 7,305 date/level objects.

`DailyService` receives `DailyCatalog` rather than a static `DAILY_RELEASE_ENTRIES` array. It resolves an entry by date/ordinal on demand.

The Daily archive/calendar UI computes whether a date is inside the release range from calendar bounds and requests a level only for visible/interactive dates that require an actual puzzle preview or launch.

Profile migration must not depend on importing all Daily levels. Legacy id/date mapping is derived arithmetically from the release start date and ordinal.

## Source cleanup

After the production Daily catalog passes all checks, delete:

```text
src/content/daily/snapshots/daily001.ts
...
src/content/daily/snapshots/daily365.ts
src/content/daily/snapshots/index.ts
```

The current static `src/content/daily/manifest.ts` is removed or replaced with lightweight catalog metadata only. No production TypeScript file imports 7,305 level definitions.

## Verification and release gates

Packing is refused unless every condition below passes:

1. `entryCount === 7305`.
2. Calendar range is exactly `2026-09-09..2046-09-08`.
3. Every date maps to exactly one ordinal and every ordinal maps back to the same date.
4. Every Daily difficulty score is inside its weekday band.
5. Every Daily fingerprint is unique.
6. Daily ↔ Campaign collision count is 0.
7. Daily ↔ Endless collision count is 0.
8. Campaign ↔ Endless collision count is 0 after Endless repair.
9. Every decoded binary level satisfies `LevelDefinition` invariants.
10. Encode → decode roundtrip preserves the exact solution, monsters, chests, size, and derived clues.
11. Production binary hash matches the manifest.
12. No `dailyNNN.ts` snapshot modules remain in production source.
13. Existing Daily gameplay, drafts, archive, streak, leaderboard, preview, and completion sanity tests pass against the catalog-backed runtime.

A separate audit command prints per-weekday score distributions, archetype mix, size mix, duplicate counts, and cross-pool collision counts so the final 20-year catalog can be inspected before release.

## Failure behavior

Generation and packing are strict. If a weekday band is under-supplied, generation continues from its saved lane attempts; the selector never silently widens the agreed score band.

If the production binary cannot be loaded or fails header/hash validation, Daily is treated as unavailable rather than generating a puzzle on the player's device.

## Non-goals

- No runtime puzzle generation.
- No preservation of the existing 365 pre-release Daily bindings.
- No change to Daily leaderboard semantics, streak semantics, hint policy, or replay policy.
- No redesign of Campaign content.
- No wholesale rebuild of the existing Endless 100,000; only the 10 current Campaign collisions are replaced.
