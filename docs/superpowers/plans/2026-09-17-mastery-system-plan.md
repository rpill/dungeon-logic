# Mastery System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved non-XP Mastery system across profile persistence, Home, a dedicated Mastery screen, Endless clean streaks, and completion/rank-up states.

**Architecture:** Mastery rank is a pure derived view over persisted player metrics. Only Endless needs new persisted data (`currentCleanStreak` / `bestCleanStreak`), so profile schema moves to v6. UI consumes a pure `MasterySnapshot`; GameScene compares snapshots before/after completion to render progress notes or a rank-up overlay without coupling Campaign/Daily/Endless services to UI.

**Tech Stack:** TypeScript, Phaser 3, existing profile/service architecture, existing `MetaPageHeader`, `HeaderActionButton`, `HomeHubModeCard`, existing audio feedback.

**Spec:** `docs/superpowers/specs/2026-09-17-mastery-system-design.md`

## Global Constraints

- No XP or mastery currency.
- Rank never decreases.
- Campaign Clean is not used.
- Daily uses best streak; Endless uses best clean streak.
- Existing yellow/red/default button components and assets must not change.
- Mastery is a compact Home strip, not a fourth large mode card.
- Rank visual identity is the labyrinth seal, not a star/medal/trophy.
- First implementation reuses the existing completion sound for rank-up.

---

### Task 1: Add pure Mastery definitions and rank derivation

**Files:**
- Create: `src/mastery/MasteryProgress.ts`
- Create: `src/dev/masteryProgressSanity.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `type MasteryRankId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'MASTER'`
  - `interface MasteryMetrics { campaignCompleted: number; dailyBestStreak: number; endlessBestCleanStreak: number }`
  - `interface MasteryRequirementProgress { metric: 'campaign' | 'daily-best-streak' | 'endless-best-clean-streak'; current: number; target: number; complete: boolean }`
  - `interface MasterySnapshot { currentRank: MasteryRankId; nextRank: MasteryRankId | null; conditions: readonly MasteryRequirementProgress[]; remainingConditions: number }`
  - `deriveMastery(metrics: MasteryMetrics): MasterySnapshot`
  - `getMasteryRankIndex(rank: MasteryRankId): number`

- [ ] **Step 1: Write the failing sanity test**

Create `src/dev/masteryProgressSanity.ts` with assertions for the exact ladder:

```ts
import { deriveMastery } from '../mastery/MasteryProgress';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fresh = deriveMastery({ campaignCompleted: 0, dailyBestStreak: 0, endlessBestCleanStreak: 0 });
assert(fresh.currentRank === 'I', 'Fresh profile must start at rank I.');
assert(fresh.nextRank === 'II', 'Rank I must progress toward II.');

const rankThree = deriveMastery({ campaignCompleted: 24, dailyBestStreak: 0, endlessBestCleanStreak: 3 });
assert(rankThree.currentRank === 'III', '24 campaign + Endless clean 3 must reach III.');

const rankFive = deriveMastery({ campaignCompleted: 64, dailyBestStreak: 5, endlessBestCleanStreak: 10 });
assert(rankFive.currentRank === 'V', '64 / Daily 5 / Endless 10 must reach V.');

const master = deriveMastery({ campaignCompleted: 64, dailyBestStreak: 30, endlessBestCleanStreak: 50 });
assert(master.currentRank === 'MASTER', 'Daily 30 + Endless 50 must reach MASTER after campaign is complete.');
assert(master.nextRank === null, 'MASTER must have no next rank.');

console.info('[Dungeon Logic] Mastery progress sanity: PASS');
```

- [ ] **Step 2: Run the sanity test and verify RED**

Run:

```bash
npx tsx src/dev/masteryProgressSanity.ts
```

Expected: FAIL because `src/mastery/MasteryProgress.ts` does not exist.

- [ ] **Step 3: Implement the pure rank ladder**

Create `src/mastery/MasteryProgress.ts` with a frozen ordered definition table matching the spec exactly. `deriveMastery()` must select the highest rank whose requirements are all satisfied; then return progress only for the immediate next rank.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx tsx src/dev/masteryProgressSanity.ts
```

Expected: PASS.

- [ ] **Step 5: Add a package script and commit**

Add:

```json
"sanity:mastery": "tsx src/dev/masteryProgressSanity.ts"
```

Commit:

```bash
git add src/mastery/MasteryProgress.ts src/dev/masteryProgressSanity.ts package.json
git commit -m "feat: add mastery rank model"
```

---

### Task 2: Persist Endless clean streaks in profile schema v6

**Files:**
- Modify: `src/profile/types.ts`
- Modify: `src/profile/PlayerProfile.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Create: `src/dev/masteryProfileMigrationSanity.ts`

**Interfaces:**
- `EndlessProfileState` gains:
  - `currentCleanStreak: number`
  - `bestCleanStreak: number`
- Current profile becomes `PlayerProfileV6` / `schemaVersion: 6`.
- v1–v5 profiles normalize to v6.

- [ ] **Step 1: Write migration RED test**

Create a v5 fixture with `endless: { ordinal: 12, completed: 12, activePuzzle: null }`, normalize it, and assert:

```ts
assert(profile.schemaVersion === 6, 'Profile must migrate to v6.');
assert(profile.endless.currentCleanStreak === 0, 'v5 migration must start current clean streak at zero.');
assert(profile.endless.bestCleanStreak === 0, 'v5 migration must start best clean streak at zero.');
```

Also normalize a v6 fixture with streak values and assert invalid negatives become zero.

- [ ] **Step 2: Run and verify RED**

```bash
npx tsx src/dev/masteryProfileMigrationSanity.ts
```

Expected: FAIL on schema/streak fields.

- [ ] **Step 3: Implement v6 schema and normalization**

Update `normalizeEndless()` so v6 reads the two non-negative integer streak fields; v1–v5 default them to zero. Update `createFreshPlayerProfile()` to initialize both to zero. Update all service typing from `PlayerProfileV5` to `PlayerProfileV6`.

- [ ] **Step 4: Verify migration + existing profile sanity**

Run:

```bash
npx tsx src/dev/masteryProfileMigrationSanity.ts
npm run sanity:profile
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/profile src/dev/masteryProfileMigrationSanity.ts
git commit -m "feat: persist endless clean streaks"
```

---

### Task 3: Update Endless completion to maintain clean streak records

**Files:**
- Modify: `src/endless/EndlessService.ts`
- Modify: `src/scenes/GameScene.ts`
- Create: `src/dev/endlessCleanStreakSanity.ts`

**Interfaces:**
- Change `completeCurrent(ordinal: number)` to `completeCurrent(ordinal: number, hintsUsed: number)`.
- `EndlessCompletionResult` additionally returns `currentCleanStreak` and `bestCleanStreak`.

- [ ] **Step 1: Write RED test for clean/reset/best semantics**

Test a sequence:

```ts
solve(0, 0) -> current 1, best 1
solve(1, 0) -> current 2, best 2
solve(2, 1) -> current 0, best 2
solve(3, 0) -> current 1, best 2
```

- [ ] **Step 2: Run and verify RED**

```bash
npx tsx src/dev/endlessCleanStreakSanity.ts
```

- [ ] **Step 3: Implement streak mutation**

Inside `EndlessService.completeCurrent`:

```ts
const clean = hintsUsed === 0;
const currentCleanStreak = clean ? profile.endless.currentCleanStreak + 1 : 0;
const bestCleanStreak = Math.max(profile.endless.bestCleanStreak, currentCleanStreak);
```

Persist these with ordinal/completed/activePuzzle. In `GameScene`, pass `metadata.minHintsUsed` to `completeCurrent`.

- [ ] **Step 4: Verify GREEN + Endless regressions**

```bash
npx tsx src/dev/endlessCleanStreakSanity.ts
npm run sanity:endless-runtime
npm run sanity:endless-production
```

- [ ] **Step 5: Commit**

```bash
git add src/endless/EndlessService.ts src/scenes/GameScene.ts src/dev/endlessCleanStreakSanity.ts
git commit -m "feat: track endless clean streaks"
```

---

### Task 4: Add profile-to-Mastery snapshot helpers and transition detection

**Files:**
- Modify: `src/mastery/MasteryProgress.ts`
- Create: `src/mastery/MasteryTransition.ts`
- Create: `src/dev/masteryTransitionSanity.ts`

**Interfaces:**
- `getMasteryMetrics(profile: PlayerProfileV6): MasteryMetrics`
- `getMasterySnapshot(profile: PlayerProfileV6): MasterySnapshot`
- `interface MasteryTransition { fromRank; toRank; rankAdvanced; progressedMetric: MasteryRequirementProgress | null; completedMetric: boolean }`
- `compareMastery(before: PlayerProfileV6, after: PlayerProfileV6, source: 'campaign' | 'daily' | 'endless'): MasteryTransition`

- [ ] **Step 1: Write RED tests**

Cover:
- Campaign 7→8 advances I→II.
- Endless best 2→3 with Campaign 24 advances II→III.
- Daily current streak may drop but `bestStreak` unchanged: no rank loss.
- A hint-assisted Endless solve can reset current clean streak without lowering rank because rank reads `bestCleanStreak`.

- [ ] **Step 2: Run RED**

```bash
npx tsx src/dev/masteryTransitionSanity.ts
```

- [ ] **Step 3: Implement helpers**

`compareMastery` derives before/after snapshots and reports only the next-rank requirement corresponding to the completion source when its current value increased.

- [ ] **Step 4: Run GREEN**

```bash
npx tsx src/dev/masteryTransitionSanity.ts
npm run sanity:mastery
```

- [ ] **Step 5: Commit**

```bash
git add src/mastery src/dev/masteryTransitionSanity.ts
git commit -m "feat: derive mastery transitions"
```

---

### Task 5: Create the labyrinth-seal visual component and approved assets

**Files:**
- Create: `public/assets/ui/mastery_seal_stone.webp`
- Create: `public/assets/ui/mastery_seal_steel.webp`
- Create: `public/assets/ui/mastery_seal_gold.webp`
- Create: `public/assets/ui/mastery_seal_master.webp`
- Create: `src/runtime/MasterySeal.ts`
- Modify: `src/scenes/BootScene.ts`
- Create: `scripts/mastery-seal-sanity.mjs`

**Interfaces:**
- `preloadMasterySealAssets(scene)`
- `createMasterySeal(scene, { x, y, size, rank }): { destroy(): void }`

- [ ] **Step 1: Create the four approved labyrinth-seal assets**

Use the accepted concept as the art reference. All four use the same hexagonal labyrinth silhouette, transparent background, no text/numerals baked in, no star/trophy/medal iconography.

- [ ] **Step 2: Write RED asset/component sanity**

Assert all four files exist, `BootScene` preloads them, and `MasterySeal.ts` maps ranks I–II→stone, III–IV→steel, V–VIII→gold, MASTER→master.

- [ ] **Step 3: Run RED**

```bash
node scripts/mastery-seal-sanity.mjs
```

- [ ] **Step 4: Implement `MasterySeal`**

Render the selected asset plus a small rank plaque text below/inside the bottom part of the emblem using the existing cream/gold UI palette. The plaque text is `I`…`VIII` or `MASTER`.

- [ ] **Step 5: Verify and commit**

```bash
node scripts/mastery-seal-sanity.mjs
git add public/assets/ui/mastery_seal_*.webp src/runtime/MasterySeal.ts src/scenes/BootScene.ts scripts/mastery-seal-sanity.mjs
git commit -m "feat: add mastery labyrinth seals"
```

---

### Task 6: Add the Mastery strip to Home

**Files:**
- Create: `src/runtime/MasteryStrip.ts`
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/runtime/MetaSelectors.ts`
- Create: `scripts/home-mastery-strip-sanity.mjs`

**Interfaces:**
- New scene key: `MASTERY_SCENE_KEY = 'MasteryScene'`.
- `createMasteryStrip(scene, { x, y, width, height, snapshot, copy, onActivate })`.

- [ ] **Step 1: Write RED layout sanity**

Assert:
- Home derives `const mastery = getMasterySnapshot(profile)`.
- Natural stack height includes a Mastery strip between primary CTA and mode cards.
- Strip is clickable to `MASTERY_SCENE_KEY`.
- No existing `PrimaryActionButton` / `MaterialActionButton` files are modified.

- [ ] **Step 2: Run RED**

```bash
node scripts/home-mastery-strip-sanity.mjs
```

- [ ] **Step 3: Implement `MasteryStrip`**

Use the existing wide Home-panel material as the strip background. Layout:
- left seal, about 70% of strip height;
- main label `МАСТЕРСТВО {rank}`;
- second line `До ранга {next}: {remainingConditions} условия` or `МАКСИМАЛЬНЫЙ РАНГ`;
- right chevron using existing UI icon system.

Natural heights:
- narrow: 58 px;
- desktop: 72 px.

- [ ] **Step 4: Insert into Home responsive stack**

Add one compact gap above and below the strip; include it in `naturalStackHeight` so short mobile screens scale the entire Home stack together.

- [ ] **Step 5: Verify and commit**

```bash
node scripts/home-mastery-strip-sanity.mjs
node scripts/home-hub-layout-sanity.mjs
node scripts/primary-action-button-sanity.mjs
node scripts/material-action-buttons-sanity.mjs
git add src/runtime/MasteryStrip.ts src/scenes/HomeScene.ts src/runtime/MetaSelectors.ts scripts/home-mastery-strip-sanity.mjs
git commit -m "feat: add mastery strip to home"
```

---

### Task 7: Implement responsive `MasteryScene`

**Files:**
- Create: `src/scenes/MasteryScene.ts`
- Modify: `src/main.ts`
- Modify: `src/i18n/UiCopy.ts`
- Create: `scripts/mastery-scene-sanity.mjs`

**Interfaces:**
- `MasteryScene` reads `PlayerProfileService`, derives `MasterySnapshot`, and renders only current-rank/next-rank information.

- [ ] **Step 1: Write RED scene sanity**

Assert scene registration, standard `MetaPageHeader`, use of `MasterySeal`, exact three requirement row types, rank path with 9 ranks, and no XP/statistics strings.

- [ ] **Step 2: Run RED**

```bash
node scripts/mastery-scene-sanity.mjs
```

- [ ] **Step 3: Add localized copy**

Add RU/EN strings for:
- `МАСТЕРСТВО / MASTERY`
- rank titles from the spec;
- `До следующего ранга`;
- Campaign / Daily / Endless requirement labels;
- `Максимальный ранг`;
- short descriptors for each rank.

- [ ] **Step 4: Implement desktop layout**

Use `createMetaPageHeader`. Center a 190–220 px seal, rank title below, a material requirement panel ~600 px wide, then a one-row 9-node rank path.

- [ ] **Step 5: Implement narrow/mobile layout**

Use a 112–132 px seal, compact requirement rows, and a one-row 9-node rank path sized to fit the available viewport width. No vertical scroll on ordinary ~390×844 phones; on shorter screens, scale the content stack down using available viewport height rather than clipping.

- [ ] **Step 6: Add analytics**

On scene create, emit `analytics.event('mastery_open', { rank: mastery.currentRank })` using the existing AnalyticsService event API/pattern.

- [ ] **Step 7: Verify and commit**

```bash
node scripts/mastery-scene-sanity.mjs
node scripts/meta-spacing-regression-sanity.mjs
node scripts/header-actions-consistency-sanity.mjs
npm run sanity:i18n
git add src/scenes/MasteryScene.ts src/main.ts src/i18n/UiCopy.ts scripts/mastery-scene-sanity.mjs
git commit -m "feat: add mastery progression screen"
```

---

### Task 8: Add Mastery progress notes to completion states

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Create: `src/runtime/MasteryCompletion.ts`
- Create: `scripts/mastery-completion-sanity.mjs`

**Interfaces:**
- `formatMasteryProgressNote(transition, copy): string` returns empty string if no relevant progress.

- [ ] **Step 1: Write RED completion sanity**

Assert Campaign, ranked Daily, and Endless capture profile before completion and compare after completion. Archive Daily replays must not advance Mastery.

- [ ] **Step 2: Run RED**

```bash
node scripts/mastery-completion-sanity.mjs
```

- [ ] **Step 3: Capture transitions in GameScene**

Immediately before each persisted completion call, snapshot `profileService.getProfile()`. Immediately after service completion, call `compareMastery(before, profileService.getProfile(), source)`.

- [ ] **Step 4: Append compact progress line when rank did not advance**

Examples:
- `ENDLESS: чистая серия 4 / 5`
- `✓ DAILY: серия 3 / 3`
- `КАМПАНИЯ: 39 / 40`

Only show the source-mode requirement for the immediate next rank and only if that metric increased.

- [ ] **Step 5: Verify and commit**

```bash
node scripts/mastery-completion-sanity.mjs
npm run sanity:endless-runtime
npm run sanity:campaign
npm run sanity:daily
git add src/scenes/GameScene.ts src/runtime/MasteryCompletion.ts scripts/mastery-completion-sanity.mjs
git commit -m "feat: show mastery progress after wins"
```

---

### Task 9: Add the rank-up overlay

**Files:**
- Create: `src/runtime/MasteryRankUpOverlay.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/i18n/UiCopy.ts`
- Create: `scripts/mastery-rank-up-overlay-sanity.mjs`

**Interfaces:**
- `showMasteryRankUpOverlay(scene, { fromRank, toRank, copy, onContinue })`.

- [ ] **Step 1: Write RED overlay sanity**

Assert:
- overlay uses `MasterySeal`;
- text `НОВЫЙ РАНГ` / `NEW RANK`;
- one primary `ПРОДОЛЖИТЬ` button;
- no confetti/particles;
- the underlying completion action state is preserved.

- [ ] **Step 2: Run RED**

```bash
node scripts/mastery-rank-up-overlay-sanity.mjs
```

- [ ] **Step 3: Implement overlay**

Use a dark translucent full-screen veil plus a centered material panel. Seal size ~220 desktop / ~140 narrow. Show `{rank} — {title}` and descriptor. Use existing `createPrimaryActionButton` for Continue. Play existing `complete` audio feedback when the overlay appears.

- [ ] **Step 4: Integrate completion priority**

Prepare the ordinary completion state first. If `transition.rankAdvanced`, keep it hidden, show rank-up overlay, and reveal the prepared completion state when Continue is pressed. This guarantees Campaign feature-unlock actions and row transitions remain intact.

- [ ] **Step 5: Add rank-up analytics**

Emit `mastery_rank_up` once with `{ fromRank, toRank, source }` when the overlay opens.

- [ ] **Step 6: Verify and commit**

```bash
node scripts/mastery-rank-up-overlay-sanity.mjs
node scripts/mastery-completion-sanity.mjs
node scripts/campaign-row-unlock-transition-sanity.mjs
npm run sanity:endless-runtime
npm run sanity:daily
git add src/runtime/MasteryRankUpOverlay.ts src/scenes/GameScene.ts src/i18n/UiCopy.ts scripts/mastery-rank-up-overlay-sanity.mjs
git commit -m "feat: celebrate mastery rank ups"
```

---

### Task 10: Final integration verification

**Files:**
- No new production files unless a verified regression requires a fix.

- [ ] **Step 1: Run Mastery-specific checks**

```bash
npm run sanity:mastery
npx tsx src/dev/masteryProfileMigrationSanity.ts
npx tsx src/dev/endlessCleanStreakSanity.ts
npx tsx src/dev/masteryTransitionSanity.ts
node scripts/mastery-seal-sanity.mjs
node scripts/home-mastery-strip-sanity.mjs
node scripts/mastery-scene-sanity.mjs
node scripts/mastery-completion-sanity.mjs
node scripts/mastery-rank-up-overlay-sanity.mjs
```

Expected: all PASS.

- [ ] **Step 2: Run adjacent regression checks**

```bash
npm run sanity:campaign
npm run sanity:daily
npm run sanity:endless-runtime
node scripts/home-hub-layout-sanity.mjs
node scripts/primary-action-button-sanity.mjs
node scripts/material-action-buttons-sanity.mjs
node scripts/header-actions-consistency-sanity.mjs
node scripts/meta-spacing-regression-sanity.mjs
```

Expected: all PASS.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: `tsc && vite build` exits 0.

- [ ] **Step 4: Manual responsive acceptance**

Verify at minimum:
- desktop 1920×1080: Home strip, MasteryScene, rank-up overlay;
- mobile portrait ~390×844: Home stack still fits, MasteryScene fits, rank path readable;
- mobile landscape: no clipping;
- rank II on Campaign 8;
- rank III when Campaign 24 + Endless best clean 3;
- assisted Endless completion resets current clean streak but never lowers achieved rank;
- Daily best streak remains the Mastery source even after current streak later resets.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete mastery progression system"
```
