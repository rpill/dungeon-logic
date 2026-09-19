# Daily 7305 Binary Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 7,305 immutable Daily puzzles in one binary catalog with zero structural collisions inside Daily or against Campaign/Endless, replacing the legacy per-level TypeScript snapshots.

**Architecture:** Daily production content is a fixed-record binary catalog plus JSON manifest. Runtime fetches both once during boot and exposes lightweight dated entries whose `level` is decoded and cached on first use. Offline production and sanity tooling independently verify weekday difficulty bands and all cross-pool structural fingerprints.

**Tech Stack:** TypeScript, Phaser/Vite runtime, Node/tsx development tooling, fixed-record little-endian binary assets.

**Spec:** `docs/superpowers/specs/2026-09-19-daily-7305-binary-catalog-design.md`

## Global Constraints

- Exactly 7,305 Daily entries covering UTC dates `2026-09-09` through `2046-09-08` inclusive.
- Weekday difficulty bands: Sun 80..95, Mon 0..15, Tue 10..30, Wed 25..45, Thu 40..60, Fri 55..75, Sat 70..90.
- Structural collisions must be zero for Daily↔Daily, Daily↔Campaign, Daily↔Endless, and Campaign↔Endless.
- Production Daily content must not import or ship per-level TypeScript snapshots.
- Runtime stores exact generated puzzle geometry in the binary asset and does not regenerate puzzles from seeds.

---

### Task 1: Binary catalog and runtime loader

**Files:**
- Create: `src/content/daily/CatalogFormat.ts`
- Create: `src/content/daily/DailyCatalog.ts`
- Create: `src/content/daily/DailyCatalogLoader.ts`
- Modify: `src/content/daily/calendar.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/daily/DailyService.ts`

**Interfaces:**
- Produces `decodeDailyCatalogRecord`, `createDailyCatalog`, `loadDailyCatalog`, 7,305 dated entries, and `DailyService.getEntries()`.

- [x] Encode/decode a fixed 28-byte Daily record carrying board size, difficulty score, archetype, solution mask, monster mask, and chest mask.
- [x] Reconstruct row/column clues from the stored solution mask.
- [x] Add a lazy cached catalog adapter so levels decode only when accessed.
- [x] Extend the UTC calendar to 7,305 dates and four-digit Daily IDs.
- [x] Load Daily binary + manifest during Boot before constructing `DailyService`.

### Task 2: Produce the 7,305-level corpus

**Files:**
- Create: `.generated/daily/selection.jsonl`
- Create: `.generated/daily/verification.json`
- Create: `public/content/daily/verified-levels.bin`
- Create: `public/content/daily/verified-levels-manifest.json`
- Modify: `.generated/endless/selection.jsonl`
- Modify: `.generated/endless/verification.json`
- Modify: `public/content/endless/verified-levels.bin`
- Modify: `public/content/endless/verified-levels-manifest.json`

**Interfaces:**
- Produces immutable production assets and audited selection metadata.

- [x] Build a verified candidate pool excluding current Campaign and Endless structural fingerprints.
- [x] Select exactly 7,305 unique Daily candidates while satisfying every weekday score band.
- [x] Pack exact puzzle geometry into the Daily binary and record its SHA-256 in the manifest.
- [x] Replace the ten Campaign-colliding Endless entries with unique accepted candidates outside Daily/Campaign/Endless.
- [x] Repack the Endless binary and refresh its verification metadata.

### Task 3: Production audits and stale-content cleanup

**Files:**
- Create: `src/content/daily/WeekdayPolicy.ts`
- Create: `src/dev/DailyProductionCatalog.ts`
- Replace: `src/dev/dailyCorpusSanity.ts`
- Replace: `src/dev/dailyCalendarSanity.ts`
- Modify: Daily-related sanity files and reports
- Delete: `src/content/daily/snapshots/`
- Delete: obsolete `DailyReleaseCorpus.ts` and `DailyReleaseReservoir.ts`

**Interfaces:**
- Production sanity reads the binary asset independently and fails on count, date, band, duplicate, or cross-pool collision drift.

- [x] Add exact weekday-band policy shared by selection auditing.
- [x] Add a Node-only production-catalog helper for dev sanity checks.
- [x] Audit all 7,305 Daily records against current Campaign and 100,000 Endless fingerprints.
- [x] Remove every legacy snapshot and obsolete 365-level release-corpus reference.
- [x] Add a source-level cleanup sanity that prevents snapshot imports/directories from returning.

### Task 4: Final verification and packaging

**Files:**
- Modify: `docs/release/daily-calendar-v1.md`
- Modify: `docs/release/daily-corpus-v1.md`
- Modify: `CURRENT_STATE.md`, `PROJECT.md`, `TECH.md` as needed

- [x] Verify Daily binary byte count/hash and manifest consistency.
- [x] Verify Endless selection/binary/hash and all four collision counts.
- [x] Run all available Daily/content sanity scripts that do not require unavailable dependencies.
- [x] Attempt project type/build verification and report environmental blockers exactly.
- [x] Package a full updated project archive so legacy snapshot deletions are preserved.
