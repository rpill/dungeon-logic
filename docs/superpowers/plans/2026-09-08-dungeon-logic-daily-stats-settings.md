# Dungeon Logic Daily, Statistics, and Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the complete Daily loop, soft streak/calendar, Statistics, and Settings using the existing puzzle runtime and trusted-date boundary.

**Architecture:** Daily content is immutable snapshot data selected by a pure date key. `DailyService` owns eligibility/result/streak updates but launches the same GameScene session path as campaign. Stats/Settings are projections and profile mutations, not independent persistence systems.

**Tech Stack:** TypeScript 6, Phaser 4.2, PlatformServices TrustedClock.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- Daily unlocks only after campaign level 005 is completed.
- Same date => same snapshot for everyone.
- No on-device generator invocation.
- Missed Daily cannot be backfilled in v1.
- Today may be replayed; streak credits once.
- Daily completion never automatically triggers interstitial.
- Release content target is ~60 prevalidated snapshots; runtime work may use a small explicit dev fixture manifest until the separate curation pass fills it.

---

### Task 1: Daily manifest/date selector

**Files:**
- Create: `src/content/daily/types.ts`
- Create: `src/content/daily/manifest.ts`
- Create: `src/daily/DailySelector.ts`
- Create: `src/dev/dailySanity.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export interface DailyEntry {
  readonly id: string;
  readonly dateKey: string; // YYYY-MM-DD UTC
  readonly level: LevelDefinition;
}
export function toUtcDateKey(date: Date): string;
export function findDailyForDate(entries: readonly DailyEntry[], date: Date): DailyEntry | null;
```

- [ ] **Step 1: Add 5 explicit dev fixture entries**

Use these exact sanity-only entries: `2099-01-01 → campaign-001`, `2099-01-02 → campaign-002`, `2099-01-03 → campaign-003`, `2099-01-04 → campaign-004`, `2099-01-05 → campaign-005`, with Daily IDs `daily-fixture-2099-01-01` through `daily-fixture-2099-01-05`. Import the already validated immutable level definitions; do not duplicate their JSON. Source comments must state that the separate Daily curation pass replaces these fixtures before release.

- [ ] **Step 2: Test UTC boundary**

Assert 23:59:59Z and 00:00:00Z map to adjacent keys and same key always selects same entry.

- [ ] **Step 3: Run/add `sanity:daily`**

- [ ] **Step 4: Commit**

```bash
git add src/content/daily src/daily/DailySelector.ts src/dev/dailySanity.ts package.json
git commit -m "feat: add deterministic daily selection"
```

### Task 2: DailyService and streak

**Files:**
- Create: `src/daily/DailyService.ts`
- Create: `src/daily/Streak.ts`
- Modify: `src/profile/types.ts`
- Extend: `src/dev/dailySanity.ts`

**Interfaces:**

```ts
export interface DailyResult {
  readonly bestTimeMs: number;
  readonly minHintsUsed: number;
  readonly solvedWithoutHints: boolean;
}
```

Profile daily state stores current/best streak, lastSolvedDate, totalSolved, solvedDates, and per-date results.

- [ ] **Step 1: Test streak transitions**

Cases: first solve => 1; consecutive UTC date => +1; duplicate same-day solve => unchanged; gap => 1; best streak never decreases; replay may improve bestTime without incrementing totalSolved.

- [ ] **Step 2: Implement service**

`getToday()` asks TrustedClock; if trusted date unavailable, use browser UTC only as a clearly untrusted fallback for playability while recording no anti-clock guarantee. `completeToday(result)` updates profile exactly once for streak/total.

- [ ] **Step 3: Run sanity and commit**

```bash
npm run sanity:daily
git add src/daily src/profile/types.ts src/dev/dailySanity.ts
git commit -m "feat: track daily streaks and results"
```

### Task 3: Daily launch and completion UI

**Files:**
- Modify: `src/campaign/types.ts` or move shared `GameSceneData` to `src/gameplay/types.ts`
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/runtime/GameLaunch.ts`

**Interfaces:**
- `GameLaunchContext` gains `{ mode:'daily'; dailyId:string; dateKey:string }`.
- Home hides Daily before 005; after unlock shows New/Solved/Best Time/Current Streak.

- [ ] **Step 1: Make GameScene completion mode-aware**

Campaign completion uses CampaignService; Daily completion uses DailyService; dev mode remains non-persistent.

- [ ] **Step 2: Daily win overlay**

Show Daily solved, active time, hints, streak, recent 5–7 day compact history, Home button. No Next and no forced ad hook.

- [ ] **Step 3: Replay today's Daily**

Solved card remains interactive and starts a fresh board while preserving existing best result until improved.

- [ ] **Step 4: Run Daily/session/build sanities and commit**

### Task 4: Statistics scene

**Files:**
- Create: `src/scenes/StatsScene.ts`
- Create: `src/runtime/StatsSelectors.ts`
- Create: `src/dev/statsSanity.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Pure selector returns Campaign solved/30, full manuscripts/4, campaign no-hint solves; Daily totals/streak/no-hint; overall active play time/puzzles/hints; current-month calendar cells.

- [ ] **Step 1: Test selectors from synthetic profile**

Include month starting midweek and solved/missed/today states.

- [ ] **Step 2: Render primitive StatsScene**

Wide uses columns; Narrow uses vertical layout. No fake IQ/score metrics.

- [ ] **Step 3: Run/build/commit**

### Task 5: Settings scene

**Files:**
- Create: `src/scenes/SettingsScene.ts`
- Create: `src/settings/SettingsService.ts`
- Create: `src/dev/settingsSanity.ts`
- Modify: `src/main.ts`

**Interfaces:**
- `setMusicEnabled`, `setSoundEnabled`, `setVibrationEnabled`, `setLanguage` persist to profile.
- How to Play opens static current rules text.
- Reset Progress requires explicit confirmation and replaces profile with fresh defaults while preserving current language/settings only if the confirmation copy says so; v1 decision: full reset preserves settings but clears campaign/daily/hints/ads/totals.

- [ ] **Step 1: Test reset semantics**

Assert settings survive and all progression returns to fresh state including 3 free hints.

- [ ] **Step 2: Render SettingsScene**

Vibration row only when vibration capability exists. Privacy/legal link is a configured optional URL; if no URL is configured in dev, do not render a dead button.

- [ ] **Step 3: Run all meta sanities**

```bash
npm run sanity:daily
npx tsx src/dev/statsSanity.ts
npx tsx src/dev/settingsSanity.ts
npm run sanity:profile
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/daily src/settings src/scenes/HomeScene.ts src/scenes/GameScene.ts src/scenes/StatsScene.ts src/scenes/SettingsScene.ts src/runtime src/dev
git commit -m "feat: add daily stats and settings"
```
