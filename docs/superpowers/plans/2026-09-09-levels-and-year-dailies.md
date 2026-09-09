# Levels and Year Dailies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship one 64-level campaign without manuscripts/chapters and a static 365-day Daily calendar.

**Architecture:** Simplify campaign runtime around a three-unsolved rolling frontier and a flat manifest. Keep generation/curation deterministic and offline: promoted campaign files and Daily snapshots are static TypeScript data consumed by runtime. Preserve IDs and definitions of existing released content for save compatibility.

**Tech Stack:** TypeScript, Phaser, deterministic puzzle generator/solver/quality pipeline, static content modules.

**Spec:** `docs/superpowers/specs/2026-09-09-levels-and-year-dailies-design.md`

## Global Constraints

- Campaign contains exactly 64 levels.
- Daily contains exactly 365 consecutive UTC dates from 2026-09-09 through 2027-09-08 inclusive.
- Existing campaign 001-030 and Daily 001-060 remain unchanged at puzzle-definition level.
- Campaign unlock frontier is the first three unsolved levels; completed levels remain replayable.
- No blockers or directional doors in generated release content.
- Tutorial v2 is unchanged.

---

### Task 1: Flat campaign progression

**Files:**
- Modify: `src/campaign/CampaignUnlocks.ts`
- Modify: `src/campaign/CampaignService.ts`
- Modify: `src/campaign/types.ts`
- Modify: `src/content/campaign/types.ts`
- Modify: `src/content/campaign/manifest.ts`
- Test: `src/dev/campaignUnlockSanity.ts`
- Test: `src/dev/campaignSanity.ts`

**Interfaces:**
- Produces: `getPlayableCampaignIds(manifest, completedIds)` = completed IDs plus first three unsolved IDs.
- Produces: campaign completion result with `recommendedNextLevel`, `unlockedFeatures`, and `persisted`; no manuscript unlock field.

- [x] Write failing unlock sanity assertions for 001/002/003 fresh frontier and rolling first-three-unsolved behavior.
- [x] Run the sanity with the local TypeScript runner and verify RED against manuscript behavior.
- [x] Replace manuscript unlock logic with the rolling frontier and remove manuscript completion result logic.
- [x] Run unlock/service sanities and verify GREEN.

### Task 2: Flat Levels UI and metadata

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/LevelSelectScene.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/runtime/MetaSelectors.ts`
- Modify: `src/runtime/StatsSelectors.ts`
- Modify: `src/i18n/UiCopy.ts`
- Modify: `src/main.ts`
- Remove player-facing campaign use of: `src/scenes/ArchiveScene.ts`, `src/content/campaign/manuscripts.ts`, `src/content/campaign/chapters.ts`
- Tests: `src/dev/metaNavigationSanity.ts`, `src/dev/statsSanity.ts`, `src/dev/localizationSanity.ts`

**Interfaces:**
- Produces: Levels scene route via `LEVELS_SCENE_KEY = 'LevelSelectScene'`.
- Produces: campaign stats `{ solved, total, solvedWithoutHints }` with total derived from 64-level manifest/profile context instead of manuscript counts.

- [x] Update sanity expectations first: Levels naming/navigation, no manuscript metrics/messages, campaign total 64.
- [x] Verify RED.
- [x] Route Home/Game completion to LevelSelectScene; change copy to Levels; remove manuscript selectors and UI.
- [x] Verify updated meta/stats/localization sanities GREEN.

### Task 3: Campaign 31-64 content

**Files:**
- Modify: `src/content/campaign/curationPlan.ts`
- Modify: `src/content/release/CampaignReleaseSelection.ts`
- Create: `src/content/campaign/levels/campaign031.ts` through `campaign064.ts`
- Modify: `src/content/campaign/levels/index.ts`
- Tests: `src/dev/campaignReleaseSanity.ts`, `src/dev/campaignSanity.ts`

**Interfaces:**
- Produces: static `promotedCampaignLevels` slots 1-64.
- Produces: deterministic campaign selection targets for 31-64 using current v1 mechanics.

- [x] Extend release sanity expectations to slot 64 and require 64 promoted levels; verify RED.
- [x] Generate a deterministic reservoir, select structurally unique candidates for 31-64, and write static level/provenance modules.
- [x] Keep existing 001-030 content unchanged.
- [x] Verify all 64 campaign levels with validator, uniqueness solver, human solver, difficulty and quality checks.

### Task 4: Daily 061-365 content and calendar

**Files:**
- Modify: `src/content/release/DailyReleaseCorpus.ts`
- Create: `src/content/daily/snapshots/daily061.ts` through `daily365.ts`
- Modify: `src/content/daily/snapshots/index.ts`
- Modify: `src/content/daily/calendar.ts`
- Tests: `src/dev/dailyCorpusSanity.ts`, `src/dev/dailyCalendarSanity.ts`

**Interfaces:**
- Produces: `DAILY_RELEASE_COUNT = 365`.
- Produces: `DAILY_RELEASE_DATE_KEYS` with exactly 365 consecutive date keys ending 2027-09-08.
- Produces: static curated snapshots 001-365.

- [x] Change sanity assertions to 365 dates/snapshots and required end date; verify RED.
- [x] Extend deterministic Daily slot specs to 365 without changing specs 001-060.
- [x] Generate/select Daily 061-365 excluding all campaign fingerprints and previously curated Daily fingerprints.
- [x] Write static snapshot modules and registry/calendar.
- [x] Verify every Daily release gate and one-to-one date mapping.

### Task 5: Cleanup, docs, and full regression gate

**Files:**
- Modify: `CURRENT_STATE.md`
- Modify: `PROJECT.md` where campaign structure/count is described.
- Modify/remove obsolete manuscript/chapter sanities and imports.
- Review all `src/dev/*Sanity.ts` references to 30/manuscript/archive campaign terminology.

**Interfaces:**
- Produces: documentation matching the shipped 64 + 365 content model.

- [x] Add a failing static regression scan for obsolete player-facing manuscript campaign references and stale hard-coded campaign total 30 where relevant.
- [x] Remove/update obsolete code and documentation.
- [x] Run all directly affected sanity suites.
- [x] Run TypeScript syntax/type verification available in the environment.
- [x] Run `npm run build` and release gates if dependencies can be installed; otherwise report the environment blocker separately and do not claim build GREEN.

## Execution note

Completed on the exported `dungeon-logic(8).zip` working copy on 2026-09-09. The complete pre-build release sanity set passed through an exact-source CommonJS verification mirror because the supplied ZIP has no installed dependencies. A real `npm ci` was attempted but the environment could not reach `registry.npmjs.org` (`EAI_AGAIN`), so `npm run build` could not be executed here and is deliberately not claimed GREEN.
