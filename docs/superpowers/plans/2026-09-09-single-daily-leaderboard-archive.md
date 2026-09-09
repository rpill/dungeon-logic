# Single Daily Leaderboard + Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-date Yandex leaderboards with one encoded leaderboard and add playable archived Daily puzzles without corrupting ranking or streak state.

**Architecture:** `DailyLeaderboard.ts` owns reversible score encoding/decoding and the single technical leaderboard name. `DailyService` owns trusted-date classification, archive listing, ranked-vs-archive attempts, first-result persistence, and on-time streak rules. A dedicated `DailyScene` exposes today plus released archive entries; `GameScene` submits only on-time ranked results and renders archive completion as unranked.

**Tech Stack:** TypeScript 6, Phaser 4, Yandex Games SDK adapter, custom sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-single-daily-leaderboard-archive-design.md`

## Global Constraints
- One Yandex leaderboard only: `daily`.
- Only first successful completion of trusted-today Daily can submit to leaderboard.
- Archive completion never changes streak fields.
- Existing profile schema v2 remains compatible.
- Old Daily results remain readable.
- Future Dailies are not playable from archive.

---

### Task 1: Single leaderboard score codec

**Files:**
- Modify: `src/daily/DailyLeaderboard.ts`
- Modify: `src/dev/dailyLeaderboardSanity.ts`

**Interfaces:**
- Produces: `DAILY_LEADERBOARD_NAME`, `encodeDailyLeaderboardScore(dateKey: string, timeMs: number): number`, `decodeDailyLeaderboardScore(score: number): { dateKey: string; timeMs: number } | null`.

- [ ] Add failing sanity assertions that every Daily maps to `daily`, newer dates outrank older dates, faster same-day times outrank slower times, and encoded scores decode back to date/time.
- [ ] Run `npm run sanity:daily-leaderboard` and verify RED.
- [ ] Implement the single leaderboard constant and reversible safe-integer codec.
- [ ] Run `npm run sanity:daily-leaderboard` and verify GREEN.

### Task 2: Ranked-vs-archive Daily service behavior

**Files:**
- Modify: `src/daily/DailyService.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/campaign/types.ts`
- Modify: `src/dev/dailySanity.ts`

**Interfaces:**
- `DailyAttemptLaunch` also exposes whether the launch is the current trusted date.
- `DailyCompletionResult` exposes `ranked`, so rendering/submission does not infer it from launch alone.
- Produces `getArchive(): Promise<readonly DailyArchiveEntry[]>`, newest released past date first.

- [ ] Add failing service sanity cases for: past Daily launch is unranked; archive first completion persists; archive completion increments `totalSolved` but leaves streak fields unchanged; completing yesterday today is unranked; current-day first completion extends streak; replay never replaces first result; future date cannot launch.
- [ ] Run `npm run sanity:daily` and verify RED.
- [ ] Implement trusted-date classification, archive listing, and completion semantics.
- [ ] Carry explicit ranked state through `GameSceneData` and completion result.
- [ ] Run `npm run sanity:daily` and `npm run sanity:puzzle-session` and verify GREEN.

### Task 3: Daily hub/archive UI

**Files:**
- Create: `src/scenes/DailyScene.ts`
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/main.ts`
- Modify: `src/i18n/UiCopy.ts`
- Modify: `src/runtime/MetaSelectors.ts`
- Create: `scripts/daily-archive-scene-sanity.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `DAILY_SCENE_KEY = "DailyScene"`.
- Consumes `DailyService.getToday()` and `DailyService.getArchive()`.

- [ ] Add failing source-level sanity requiring DailyScene registration, Home navigation to DailyScene, today action, archive rows, solved first-time labels, and scroll support.
- [ ] Run `npm run sanity:daily-archive-scene` and verify RED.
- [ ] Implement responsive DailyScene with a today card and newest-first scrollable archive list.
- [ ] Change Home Daily card to open DailyScene.
- [ ] Add RU/EN microcopy for Today, Archive, Not solved, first result, replay outside ranking, unavailable/future-safe states.
- [ ] Run `npm run sanity:daily-archive-scene`, `npm run sanity:meta-navigation`, and `npm run sanity:i18n` and verify GREEN.

### Task 4: Submission and leaderboard filtering

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/LeaderboardScene.ts`
- Modify: `scripts/daily-leaderboard-scene-sanity.mjs`
- Modify: `src/dev/dailyLeaderboardSanity.ts`

**Interfaces:**
- GameScene submits `encodeDailyLeaderboardScore(dateKey, firstTimeMs)` to `daily` only when completion result says ranked.
- LeaderboardScene decodes/filter rows to requested date and formats decoded `timeMs`.

- [ ] Add failing assertions that GameScene submits only encoded current-date first results to `daily`, and LeaderboardScene filters/decodes rows by date.
- [ ] Run leaderboard sanity scripts and verify RED.
- [ ] Implement submission and display filtering.
- [ ] Render archive completion explicitly as outside ranking; never offer leaderboard place for archive completions.
- [ ] Run leaderboard sanity scripts and verify GREEN.

### Task 5: Release docs and full regression verification

**Files:**
- Modify: `docs/release/daily-leaderboards-v1.md`
- Modify: `CURRENT_STATE.md`
- Modify: `TECH.md`
- Modify: release acceptance inputs only if required by existing audit checks.

**Interfaces:**
- Release docs define exactly one Yandex leaderboard `daily`, numeric, descending.

- [ ] Replace the 60-table instructions with one-table setup and document score encoding at a high level.
- [ ] Run `npm run sanity:profile`, `npm run sanity:stats`, `npm run sanity:feature-unlock`, `npm run sanity:daily`, `npm run sanity:daily-leaderboard`, `npm run sanity:daily-archive-scene`, `npm run sanity:daily-leaderboard-scene`, and `npm run sanity:release-audit`.
- [ ] Run `npm run build`.
- [ ] Package a clean ZIP without `node_modules`, caches, or temporary files.
- [ ] Unpack the ZIP to a fresh directory and rerun the release audit plus changed-core TypeScript checks against the packaged tree.
