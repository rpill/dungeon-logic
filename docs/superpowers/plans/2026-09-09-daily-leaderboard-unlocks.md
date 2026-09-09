# Daily Leaderboard And Unlock UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Daily competition fair by fixing the first successful result, persisting the first attempt across exits/resets, submitting only that result to a date-scoped Yandex leaderboard, and announce Daily/Statistics unlocks after campaign level 5.

**Architecture:** Extend the existing profile-backed Daily service so a ranked attempt has one trusted start timestamp and one immutable first result. Add a platform leaderboard port with Yandex SDK and local-unavailable adapters, date-scoped technical leaderboard names, and a dedicated leaderboard scene. Keep the existing level-5 unlock threshold and surface one combined unlock state after the first completion of campaign-005.

**Tech Stack:** TypeScript, Phaser, Yandex Games SDK, existing sanity scripts.

**Spec:** Approved in chat on 2026-09-09: first successful Daily solve is final; replay is out of ranking; ranked attempt cannot be reset by leaving/resetting; hints are disabled for ranked Daily; Daily and Statistics unlock feedback appears after the level that unlocks them with direct buttons.

## Global Constraints

- Campaign remains 30 levels; Tutorial is separate.
- Daily release calendar remains the immutable 60-day UTC mapping already in the project.
- Yandex built-in leaderboards require console-created technical leaderboards and authorized users.
- Authorization must only open after an explicit player action.
- No custom backend is introduced in this task.

---

### Task 1: Ranked Daily attempt state

**Files:**
- Modify: `src/profile/types.ts`
- Modify: `src/profile/PlayerProfile.ts`
- Modify: `src/gameplay/PuzzleSessionService.ts`
- Modify: `src/daily/DailyService.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Test: `src/dev/dailySanity.ts`

- [ ] Write failing Daily sanity assertions for persisted active Daily attempt, immutable first solve, and practice replay.
- [ ] Run Daily sanity and verify those assertions fail.
- [ ] Implement profile normalization/defaults and Daily attempt begin/resume/complete behavior.
- [ ] Run Daily sanity and verify green.

### Task 2: Ranked Daily gameplay policy

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/runtime/PuzzleUiState.ts` only if needed.
- Test: `src/dev/gameRegressionSanity.ts`

- [ ] Add failing regression assertions that ranked Daily disables hints, reset preserves the attempt, and solved Daily launches practice mode.
- [ ] Run regression sanity and verify failure.
- [ ] Wire ranked/practice launch context and persistent Daily puzzle session; compute ranked completion from trusted Daily service result.
- [ ] Run regression sanity and Daily sanity.

### Task 3: Platform leaderboard port and date-scoped names

**Files:**
- Create: `src/daily/DailyLeaderboard.ts`
- Modify: `src/platform/services.ts`
- Modify: `src/platform/local.ts`
- Modify: `src/platform/yandex.ts`
- Modify: `src/dev/platformSanity.ts`
- Create: `src/dev/dailyLeaderboardSanity.ts`
- Modify: `package.json`

- [ ] Write failing platform/leaderboard sanity for technical names, Yandex setScore/getEntries/getPlayerEntry, method availability, authorization state and explicit auth action.
- [ ] Run and verify failure.
- [ ] Implement the port and adapters using current `ysdk.leaderboards.*` API.
- [ ] Run platform and leaderboard sanity.

### Task 4: Leaderboard scene and result flow

**Files:**
- Create: `src/scenes/LeaderboardScene.ts`
- Modify: `src/main.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/i18n/UiCopy.ts`
- Test: `src/dev/dailyLeaderboardSanity.ts`

- [ ] Add failing static/runtime sanity for leaderboard navigation and fixed-result copy.
- [ ] Implement result button, leaderboard display, guest authorization explanation/button, and submission of only stored first result.
- [ ] Verify leaderboard sanity.

### Task 5: Daily + Statistics unlock feedback

**Files:**
- Modify: `src/campaign/types.ts`
- Modify: `src/campaign/CampaignService.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/i18n/UiCopy.ts`
- Create: `src/dev/featureUnlockSanity.ts`
- Modify: `package.json`

- [ ] Write failing sanity: first completion of campaign-005 reports Daily + Statistics unlock; replay does not.
- [ ] Implement unlock result and completion actions for Daily, Statistics, Continue.
- [ ] Verify feature unlock sanity and campaign sanity.

### Task 6: Release setup documentation and final verification

**Files:**
- Create: `docs/release/daily-leaderboards-v1.md`
- Modify: `package.json` / release acceptance if needed.

- [ ] Document the 60 technical leaderboard names and Yandex Console settings (`time`, milliseconds, lower time ranks higher).
- [ ] Run Daily, leaderboard, platform, campaign unlock, game regression, profile, localization, release audit sanity, and TypeScript checks.
- [ ] Package only product files into the final ZIP and verify the unpacked archive.
