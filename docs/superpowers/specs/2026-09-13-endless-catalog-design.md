# Endless Verified Catalog Design

Date: 2026-09-13
Project: Dungeon Logic
Status: Approved in chat; pending written-spec review

## Goal

Add an Endless content system backed by a large, pre-generated and pre-verified catalog rather than generating/searching levels during play.

The target production catalog is 100,000 levels. The runtime must do only deterministic reconstruction of a selected level from compact catalog metadata; all expensive solving, uniqueness checks, human-solvability analysis, difficulty scoring, quality filtering, deduplication, and sequence curation happen offline.

This first implementation phase covers the content pipeline and runtime catalog reader only. Player profile, Home/Endless UI, rewarded-hint behavior, clean streaks, analytics, and automatic transition to the next Endless level are follow-up integration work after the catalog pipeline is proven.

## Existing Foundation

Dungeon Logic already has the core pieces needed for the offline verifier:

- `generateCandidate({ archetype, size, seed })` is deterministic and reconstructs a candidate from explicit metadata.
- `evaluateCandidate(candidate)` verifies the generated solution with `LevelValidator`, checks uniqueness with `PuzzleSolver`, applies `LevelQualityAnalyzer`, runs `HumanSolver`, and computes a `DifficultyProfile` with `DifficultyAnalyzer`.
- Difficulty is already represented as `easy`, `medium`, `hard`, `expert`, or `unrated`, with a numeric score for rated solved candidates.
- `candidateDistance()` already measures content similarity/diversity.
- `campaignReleaseStructuralFingerprint()` canonicalizes a solution under rotation/reflection and can be reused as a cross-pool structural collision key.
- Campaign and Daily release selection already establish deterministic reservoir/selection patterns that Endless can follow rather than inventing a second generator architecture.

The Endless implementation should reuse these canonical functions. It must not duplicate solver, quality, difficulty, or generator logic.

## Non-Goals for This Phase

This phase does not:

- add an Endless button or scene;
- change Campaign or Daily behavior;
- generate a level by searching at runtime;
- create a separate difficulty mode selector for the player;
- introduce score multipliers, XP, or a new progression system;
- redesign the existing difficulty model;
- store complete `LevelDefinition` objects in the production catalog.

## High-Level Pipeline

The offline workflow is:

```text
endless:probe
  -> endless:generate
  -> endless:verify
  -> endless:pack
  -> runtime catalog reader
```

The commands are separate on purpose. A long production generation run must be resumable/repeatable without making the runtime asset format depend on temporary scan files.

### `endless:probe`

Purpose: estimate feasibility before a production scan.

It scans a configurable bounded sample and reports:

- attempts per second and accepted levels per second;
- generation failures;
- invalid/non-unique/hard-quality/geometry-warning counts;
- HumanSolver unrated/stuck count;
- accepted counts by archetype, board size, band, and score bucket;
- structural duplicate rate;
- Campaign/Daily collision count;
- estimated attempts and wall-clock time required to obtain 100,000 final entries.

`probe` writes diagnostics only. Its output is not a production catalog input.

### `endless:generate`

Purpose: scan deterministic source space and create a verified reservoir.

The scan is defined by a master seed plus deterministic attempt ranges for each `(archetype, size)` source lane. Each lane derives candidate seeds using the existing deterministic seed machinery.

For every candidate:

1. Generate with `generateCandidate()`.
2. Reject generation failures.
3. Reject duplicate playable signatures within the scan.
4. Run the canonical `evaluateCandidate()` path.
5. Reject anything not `CandidateStatus.Accepted`.
6. Reject `difficulty.band === unrated` or `difficulty.score === null` defensively even though a canonical accepted candidate should normally be rated.
7. Compute the canonical structural fingerprint.
8. Reject structural collisions with authored Campaign content.
9. Reject structural collisions with the production Daily corpus.
10. Reject structural duplicates already accepted into the Endless reservoir.
11. Persist compact verified-reservoir metadata plus enough provenance to re-run verification.

The reservoir is intentionally larger than 100,000 so the selector has room to satisfy difficulty and diversity constraints. The exact overscan factor is decided from `probe` data, not hard-coded from an assumption.

### `endless:verify`

Purpose: independently re-run canonical validation on every candidate selected for packing.

For every selected entry, regenerate from `(seed, archetype, size)` and verify:

- generation succeeds;
- regenerated identity is stable;
- validator passes;
- exact solver reports exactly one solution;
- quality gate passes with no geometry warning;
- HumanSolver still solves it;
- DifficultyAnalyzer reproduces the stored score and band;
- structural fingerprint matches the stored fingerprint;
- no duplicate candidate identity exists;
- no structural duplicate exists inside Endless;
- no structural collision exists against Campaign/Daily.

A production pack is forbidden if any selected entry fails. There is no "skip bad records while packing" behavior.

### `endless:pack`

Purpose: turn a fully verified ordered selection into production runtime assets.

Output:

```text
public/content/endless/verified-levels.bin
public/content/endless/verified-levels-manifest.json
```

The binary contains the final play order. The manifest describes compatibility and aggregate diagnostics.

## Production Binary Format

Catalog version 1 uses a fixed 8-byte little-endian record:

```text
byte 0..3  uint32 seed
byte 4     uint8 archetype code
byte 5     uint8 board size (6/7/8)
byte 6     uint8 difficulty score (0..100)
byte 7     uint8 difficulty band code
```

Band code:

```text
0 = easy
1 = medium
2 = hard
3 = expert
```

`unrated` is not representable in a production record and therefore cannot accidentally ship.

The explicit archetype and board size are required because `generateCandidate()` needs all three values; seed alone is not a complete reconstruction key in the current generator API.

At 100,000 entries the binary is exactly 800,000 bytes before transport compression.

The runtime reader validates:

- file length is exactly `recordSize * count`;
- catalog version and record size are supported;
- archetype code, board size, score, and band code are in range;
- requested index is in range.

The runtime never invokes `PuzzleSolver`, `HumanSolver`, `DifficultyAnalyzer`, or quality analysis.

## Manifest Format

Version 1 manifest contains at minimum:

```text
catalogVersion
recordSize
entryCount
catalogTargetCount
generatorVersion
difficultyModelVersion
solverSourceHash
generatorSourceHash
gameRulesSourceHash
campaignContentHash
dailyContentHash
sourceScanPlan
verifiedCount
rejectedVerificationCount
duplicateCount
campaignCollisionCount
dailyCollisionCount
countsByBand
countsByArchetype
countsBySize
scoreHistogram
productionAssetHash
```

Hashes are build-time compatibility/provenance guards. They do not need to be recomputed by the browser at startup. Offline verification and release sanity compare the manifest against the current sources/assets.

A generator/rules/difficulty change may invalidate the old catalog even if the binary still parses. Regeneration is therefore explicit rather than silently accepting stale content.

## Difficulty Sequence

The player does not select a difficulty. The catalog itself is the final Endless progression order.

The sequence targets are defined by ordinal rather than mutable player skill state, so the same catalog index always means the same level.

### Intro progression

The first 500 entries are curated with an explicit rising target score envelope:

```text
1..20      Easy, gentle rise
21..60     Easy -> Medium transition
61..150    mostly Medium, introduce Hard
151..300   Medium -> Hard
301..500   mostly Hard, introduce Expert sparingly
```

The selector operates on numeric difficulty score first and band as a hard eligibility guard. This avoids abrupt jumps caused by treating bands as four discrete buckets.

### Long-run progression

From entry 501 onward difficulty does not increase forever. It uses deterministic difficulty waves centered in Hard/Expert territory, with recovery slots between peaks.

The long-run target function must:

- be deterministic from ordinal;
- remain bounded;
- include both Hard and Expert candidates;
- deliberately include easier recovery slots rather than producing an endless monotonic climb;
- avoid long same-band streaks when suitable candidates exist.

The exact numeric score curve is a policy module with tests; it is not embedded in the scanner or runtime reader.

## Selection and Diversity

Selection is deterministic and independent of reservoir input ordering.

For each output ordinal:

1. Obtain target score and allowed difficulty bands from the progression policy.
2. Filter out used candidate IDs and structural fingerprints.
3. Prefer candidates close to target score.
4. Apply diversity pressure using existing `candidateDistance()` against a recent window.
5. Apply archetype and board-size anti-streak constraints.
6. Use stable tie breakers: selection score, quality score, candidate ID, seed.

The selector may use a documented diversity fallback if an ordinal cannot meet the preferred neighbor-distance threshold, but it may not violate uniqueness, cross-pool collision, or difficulty eligibility constraints.

Initial policy constraints:

- no identical structural fingerprint anywhere in the 100,000-entry catalog;
- no Campaign/Daily structural fingerprint collision;
- avoid more than 3 consecutive levels of the same archetype when alternatives are available;
- avoid more than 3 consecutive levels of the same board size when alternatives are available;
- use a recent-window diversity score rather than trying to maximize pairwise distance across all 100,000 entries.

The exact threshold/window values are tuning constants validated by probe/selection diagnostics.

## Campaign and Daily Separation

Endless is a separate content pool.

Cross-pool exclusion uses the canonical structural fingerprint of `level.solution`, including rotation/reflection normalization. This is stronger than comparing seed or candidate ID: an Endless level cannot be a rotated/reflected structural copy of a Campaign or Daily level.

Campaign and Daily remain authoritative. Endless generation adapts around them; existing Campaign/Daily content is never changed to make room for Endless.

## Temporary Reservoir Data

The production game receives only `.bin + manifest`.

Offline generation may write chunked intermediate files under `.generated/endless/` so a large scan does not require holding the entire reservoir in memory and can be resumed after interruption.

Intermediate data may include:

- reconstruction key `(seed, archetype, size)`;
- candidate ID;
- difficulty score/band;
- quality score;
- structural fingerprint;
- compact diversity metrics required by selection;
- source lane and attempt ordinal;
- verifier/version provenance.

No intermediate format is a public runtime contract.

## Determinism

The following must be deterministic:

- source scan plan;
- seed derivation;
- candidate generation;
- verifier result for unchanged source versions;
- reservoir serialization order;
- selection result independent of input order;
- final binary bytes;
- manifest content except for fields explicitly excluded from reproducibility (the design currently requires no timestamp field).

Running the same production command twice from the same source tree must produce byte-identical `.bin` and semantically/byte-identical manifest JSON.

## Runtime API

The runtime module exposes a small read-only interface, conceptually:

```ts
interface EndlessCatalogEntry {
  readonly seed: number;
  readonly archetype: GeneratorArchetype;
  readonly size: GeneratorBoardSize;
  readonly difficultyScore: number;
  readonly difficultyBand: Exclude<DifficultyBand, 'unrated'>;
}

interface EndlessCatalog {
  readonly length: number;
  get(index: number): EndlessCatalogEntry;
  createLevel(index: number): LevelDefinition;
}
```

`createLevel(index)` calls only `generateCandidate()` with the stored reconstruction key and asserts successful deterministic reconstruction. It does not re-evaluate the level.

A reconstruction failure is treated as a catalog/source compatibility error, not replaced by runtime random generation.

## Failure Policy

Offline commands fail hard on corrupted or incompatible inputs.

Production packing fails if:

- fewer than the requested 100,000 verified selections exist;
- any verification mismatch occurs;
- a duplicate or Campaign/Daily collision remains;
- a record cannot be encoded losslessly;
- the final asset hash does not match the generated manifest.

Runtime reader errors are explicit for missing/corrupt catalog assets. It does not silently synthesize new content because that would break the guarantee that Endless serves only pre-verified levels.

## Commands

Add package scripts with a single CLI implementation family:

```text
npm run endless:probe -- [options]
npm run endless:generate -- [options]
npm run endless:verify -- [options]
npm run endless:pack -- [options]
npm run sanity:endless-catalog
```

Production defaults:

```text
target = 100000
```

Scan counts/overscan are not frozen until the first real probe establishes acceptance rates and bottlenecks.

## Testing Strategy

### Unit/sanity tests

Tests cover:

- binary encode/decode round trip;
- invalid/corrupt record rejection;
- progression target curve boundaries;
- deterministic selector independent of input ordering;
- duplicate fingerprint exclusion;
- Campaign/Daily collision exclusion;
- archetype/size anti-streak policy;
- difficulty eligibility per progression segment;
- deterministic manifest generation;
- runtime `createLevel()` reconstruction.

### Red/green integration proof

A catalog fixture is packed, read through the runtime reader, regenerated, and compared with the original verified candidate.

The verification test deliberately mutates one stored metadata field/source fixture and must fail, proving the compatibility check detects drift.

### Production verification

Before declaring a production catalog shippable:

1. `endless:verify` reports zero rejected verification entries.
2. duplicate count is zero.
3. Campaign collision count is zero.
4. Daily collision count is zero.
5. selected count is exactly 100,000.
6. binary length is exactly 800,000 bytes for catalog v1.
7. regeneration sampling and full metadata verification pass.
8. project `npm run build` passes.
9. existing generator/difficulty/campaign/daily sanity suites still pass.

## Implementation Boundaries

New Endless-specific code should live outside the canonical generator/solver internals unless a tiny reusable extraction is necessary.

Expected areas:

```text
src/content/endless/          runtime format/manifest/reader/progression policy
src/dev/endless/              probe, scan, verify, select, pack CLIs and offline helpers
src/dev/endlessCatalogSanity.ts
public/content/endless/       generated production assets (only after production generation)
```

Existing canonical modules are dependencies, not copies:

```text
src/puzzle/generator/*
src/puzzle/solver/*
src/puzzle/human-solver/*
src/puzzle/difficulty/*
src/puzzle/quality/*
src/content/release/*
```

## Delivery Order

Implementation proceeds in this order:

1. Catalog record types and binary codec.
2. Progression target policy.
3. Scanner/evaluator adapter around canonical generator functions.
4. Cross-pool fingerprint index for Campaign/Daily.
5. Deterministic reservoir format/chunking.
6. Deterministic selector.
7. Full re-verifier.
8. Packer and manifest/hash generation.
9. Runtime reader/reconstruction API.
10. Probe CLI and production-generation CLI wiring.
11. Sanity/integration tests and build verification.
12. Run a small real probe and report throughput/acceptance distribution before attempting the full 100,000-level production scan.

The full 100,000-level asset generation is a content-production run, not required to finish the code architecture. We first prove the pipeline with small fixtures/probe data, then size the production scan from measured acceptance rates.
