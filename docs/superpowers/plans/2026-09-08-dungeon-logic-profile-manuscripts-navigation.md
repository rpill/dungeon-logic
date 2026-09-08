# Dungeon Logic Profile, Manuscripts, and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace linear campaign progression with the agreed manuscript/frontier model and introduce Home + Archive navigation backed by one versioned player profile.

**Architecture:** Create a unified serializable profile as the product persistence boundary, migrate the existing campaign-v1 save into it, derive unlocks from immutable manuscript definitions, and keep Phaser scenes as presentation shells over pure selectors/services.

**Tech Stack:** TypeScript 6, Phaser 4.2, localStorage for this phase.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- Manuscript slot ranges: I=1–7, II=8–14, III=15–22, IV=23–30.
- Unlock thresholds: II after 6/7 in I; III after 6/7 in II; IV after 7/8 in III.
- 001–005 are strictly linear.
- After onboarding, expose up to three unsolved levels at the authored frontier.
- V/VI are sealed non-interactive metadata only.
- Runtime must tolerate a partial promoted manifest during development and must never create fake playable cards for missing snapshots.

---

### Task 1: Manuscript definitions and frontier selectors

**Files:**
- Modify: `src/content/campaign/types.ts` (add product manuscript types only; keep existing technical chapter/theme ids intact)
- Create: `src/content/campaign/manuscripts.ts`
- Create: `src/campaign/CampaignUnlocks.ts`
- Create: `src/dev/campaignUnlockSanity.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export type ManuscriptId = 'manuscript-i' | 'manuscript-ii' | 'manuscript-iii' | 'manuscript-iv';
export interface ManuscriptDefinition {
  readonly id: ManuscriptId;
  readonly roman: 'I' | 'II' | 'III' | 'IV';
  readonly title: 'Азбука' | 'Дедукция' | 'Комнаты' | 'Мастерство';
  readonly slots: readonly number[];
  readonly requiredPreviousSolved: number;
}
```

`getPlayableCampaignIds(manifest, completedIds)` returns completed replayables plus currently available unsolved frontier; `isManuscriptUnlocked(id, completedIds, manifest)` derives threshold state. Existing `chapters.ts`, `CampaignChapterId`, and theme metadata remain untouched during the wireframe phase so generator/campaign-theme sanities keep their current technical provenance contract; product manuscripts are a separate slot-based presentation/progression layer.

- [ ] **Step 1: Write failing frontier cases**

Assert 001 only initially; after 001 only 002; after 004 only 005; after 005 both existing 006/007 become playable when present; Manuscript II requires 6 solved in I; initial II frontier is 08/09/10; solving 09 changes it to 08/10/11.

Use synthetic `CampaignLevelEntry[]` so the test does not depend on 30 promoted production files.

- [ ] **Step 2: Run failing sanity**

Run: `npx tsx src/dev/campaignUnlockSanity.ts`.

- [ ] **Step 3: Implement pure selectors**

The frontier algorithm is:

```ts
const unsolved = manuscriptEntries.filter((entry) => !completed.has(entry.id));
const frontier = unsolved.slice(0, 3);
```

except slots 1–5, where only the first unsolved onboarding entry is available. Missing promoted entries are absent and are not rendered as level cards.

- [ ] **Step 4: Add `sanity:campaign-unlock` and run existing campaign sanities**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/campaign/types.ts src/content/campaign/manuscripts.ts src/campaign/CampaignUnlocks.ts src/dev/campaignUnlockSanity.ts package.json
git commit -m "feat: add manuscript frontier progression"
```

### Task 2: Unified PlayerProfile and migration

**Files:**
- Create: `src/profile/types.ts`
- Create: `src/profile/PlayerProfile.ts`
- Create: `src/profile/PlayerProfileStorage.ts`
- Create: `src/profile/LocalPlayerProfileStorage.ts`
- Create: `src/profile/PlayerProfileService.ts`
- Create: `src/dev/playerProfileSanity.ts`
- Modify: `package.json`

**Interfaces:**

Before `PlayerProfileV1`, define the shared serializable types in the same file so later plans reuse the exact names:

```ts
export interface SerializedPuzzleState {
  readonly mode: 'campaign' | 'daily';
  readonly puzzleId: string;
  readonly cells: readonly (readonly CellState[])[];
  readonly activePlayMs: number;
  readonly hintsUsed: number;
  readonly startedAtMs: number;
}

export interface CampaignLevelResult {
  readonly bestTimeMs: number;
  readonly minHintsUsed: number;
  readonly solveCount: number;
  readonly solvedWithoutHints: boolean;
}

export interface DailyResultSummary {
  readonly bestTimeMs: number;
  readonly minHintsUsed: number;
  readonly solvedWithoutHints: boolean;
}

export interface DailyProfileState {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastSolvedDate: string | null;
  readonly totalSolved: number;
  readonly solvedDates: readonly string[];
  readonly results: Readonly<Record<string, DailyResultSummary>>;
}

export interface PlayerSettings {
  readonly musicEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly vibrationEnabled: boolean;
  readonly language: string;
}
```

Fresh defaults are `musicEnabled:true`, `soundEnabled:true`, `vibrationEnabled:true`, `language:'ru'`, empty Daily history/streaks, 3 free hints, and zero ad/timer counters.

```ts
export interface PlayerProfileV1 {
  readonly schemaVersion: 1;
  readonly campaign: {
    readonly completedLevelIds: readonly string[];
    readonly lastPlayedLevelId: string | null;
    readonly levelResults: Readonly<Record<string, CampaignLevelResult>>;
    readonly activePuzzle: SerializedPuzzleState | null;
  };
  readonly daily: DailyProfileState;
  readonly settings: PlayerSettings;
  readonly hints: { readonly freeRemaining: number; readonly totalUsed: number };
  readonly ads: { readonly campaignCompletionsSinceOpportunity: number; readonly lastInterstitialAtMs: number | null };
  readonly totals: { readonly activePlayMs: number };
}
```

Define `DailyProfileState` now with empty/default fields so later Daily work does not require a schema bump.

- [ ] **Step 1: Write failing normalization/migration sanity**

Assert invalid input yields fresh profile with `freeRemaining: 3`; duplicated/unknown campaign IDs are normalized against current manifest; legacy `CampaignProgressV1` completed IDs and last-played value migrate into `PlayerProfileV1.campaign`.

- [ ] **Step 2: Implement local storage under new key**

Use `dungeon-logic:player-profile:v1`. On first load with no new key, read legacy `dungeon-logic:campaign-progress:v1`, migrate, then persist the new profile.

- [ ] **Step 3: Implement immutable update service**

`PlayerProfileService.update(mutator)` clones/normalizes and updates memory immediately, then coalesces persistence through a 5-second save timer. It exposes `getProfile()`, `flush(): Promise<void>`, and `replaceProfileForPlatformMerge(profile)` for later platform work. `flush()` is called on Back, solve, and visibility loss so Yandex `setData()` cannot be spammed by drag painting.

- [ ] **Step 4: Run sanity and add script**

Add `sanity:profile`.

- [ ] **Step 5: Commit**

```bash
git add src/profile src/dev/playerProfileSanity.ts package.json
git commit -m "feat: add unified player profile"
```

### Task 3: Refactor CampaignService onto profile + frontier

**Files:**
- Modify: `src/campaign/CampaignService.ts`
- Modify: `src/campaign/CampaignProgress.ts`
- Modify: `src/campaign/types.ts`
- Retire runtime use of: `src/campaign/CampaignProgressStorage.ts`, `src/campaign/LocalCampaignProgressStorage.ts`
- Modify: `src/dev/campaignRuntimeSanity.ts`
- Modify: `src/dev/campaignSanity.ts`

**Interfaces:**
- `CampaignService.create(levels, profileService)`.
- `getPlayableLevels(): readonly CampaignLevelEntry[]`.
- `getContinueLevel(): CampaignLevelEntry | null` chooses active/last played if still playable, else first unsolved playable frontier, else last completed when campaign complete.
- `completeLevel(id: string, resultMetadata: CampaignLevelResult)` records completion idempotently and returns `recommendedNextLevel` plus `unlockedManuscript: ManuscriptDefinition | null` when this completion crosses a manuscript threshold for the first time.

- [ ] **Step 1: Rewrite runtime sanity for nonlinear progression**

Assert completing 09 does not require 08, next recommendation is an unsolved playable frontier entry, and replaying completed levels never duplicates completion.

- [ ] **Step 2: Implement service using pure selectors**

Do not persist derived `highestUnlockedSlot`; derive all locks from completed IDs + manuscript rules.

- [ ] **Step 3: Run campaign/profile sanities**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/campaign src/dev/campaignRuntimeSanity.ts src/dev/campaignSanity.ts
git commit -m "refactor: use manuscript campaign progression"
```

### Task 4: Home and Archive scenes

**Files:**
- Create: `src/scenes/HomeScene.ts`
- Create: `src/scenes/ArchiveScene.ts`
- Create: `src/runtime/MetaSelectors.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/LevelSelectScene.ts` (remove from production routing after Archive works)
- Modify: `src/main.ts`
- Create: `src/dev/metaNavigationSanity.ts`

**Interfaces:**
- `getHomeCampaignAction(service, profile): { kind: 'start'|'continue'|'choose-level'; levelId?: string }`.
- `getManuscriptViewModels(manifest, profile)` returns I–IV real state plus V/VI sealed teasers.
- Wide Archive: two-pane; Compact/Narrow: manuscript list then selected manuscript page.

- [ ] **Step 1: Write pure selector sanity**

Assert Daily is hidden before 005 completion, Continue points to unfinished/last playable level, sealed V/VI have `interactive:false` and no progress counts, and locked real manuscripts expose explicit requirement text.

- [ ] **Step 2: Implement HomeScene**

Primitive-only UI: Start/Continue and Archive. Before the Daily/Stats/Settings plan lands, do not render those destinations at all; Plan 5 adds their buttons at the same time as their functional scenes.

- [ ] **Step 3: Implement ArchiveScene**

Render only promoted level entries. Completed cards replay; current frontier cards play; locked promoted cards show lock; non-promoted planned slots are not clickable cards.

- [ ] **Step 4: Route BootScene to HomeScene**

Boot creates PlayerProfileService + CampaignService, registers both, then starts HomeScene. Dev URL routing continues to launch GameScene directly.

- [ ] **Step 5: Run**

```bash
npm run sanity:profile
npm run sanity:campaign-unlock
npm run sanity:campaign-runtime
npx tsx src/dev/metaNavigationSanity.ts
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/scenes src/runtime/MetaSelectors.ts src/main.ts src/dev/metaNavigationSanity.ts
git commit -m "feat: add home and manuscript archive"
```
