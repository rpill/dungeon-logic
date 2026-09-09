# Tutorial Chapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace campaign-embedded onboarding with four dedicated, wall-only guided tutorial puzzles that gate Campaign for fresh profiles while preserving legacy players and the unchanged 30-level Campaign.

**Architecture:** Tutorial becomes a first-class content/progress/gameplay mode. Player profile schema v2 stores tutorial completion and active puzzle separately from Campaign; `GameLaunchContext` carries tutorial IDs; `TutorialService` owns tutorial progression; `GameScene` reuses the existing board/session UI and dispatches completion by mode. Campaign onboarding data remains in content for curation compatibility but runtime no longer renders it.

**Tech Stack:** TypeScript 6, Phaser 4, existing sanity-script test harness, local/player-profile persistence.

**Spec:** `docs/superpowers/specs/2026-09-09-tutorial-chapter-design.md`

## Global Constraints

- Campaign remains exactly `campaign-001` through `campaign-030` with slots 1–30 unchanged.
- Tutorial IDs are exactly `tutorial-001` through `tutorial-004`.
- Tutorial guided actions require WALL only; FLOOR remains optional notation.
- Core completion remains `validatePuzzle(puzzle).isSolved`.
- Fresh profiles must complete Tutorial before Campaign; legacy Campaign activity migrates as Tutorial-complete.
- Daily remains independent.
- No red instructional tutorial overlay.
- Long tutorial messages dismiss only by explicit panel click/tap; each message explicitly declares whether gameplay stays active, and handoff/reminder messages do not pause/block the board or timer.

---

### Task 1: Profile v2 and Tutorial Persistence

**Files:**
- Modify: `src/profile/types.ts`
- Modify: `src/profile/PlayerProfile.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Modify: `src/profile/LocalPlayerProfileStorage.ts`
- Modify: `src/profile/PlayerProfileStorage.ts`
- Test: `src/dev/playerProfileSanity.ts`

**Interfaces:**
- Extend `SerializedPuzzleState['mode']` to `'campaign' | 'daily' | 'tutorial'`.
- Add `TutorialProfileState` and `PlayerProfileV2`.
- `createFreshPlayerProfile(...)`, `normalizePlayerProfile(...)`, and migration APIs return `PlayerProfileV2`.
- Preserve current storage key so existing v1 payloads are discovered and normalized in place.

- [x] Write profile sanity assertions for fresh v2 tutorial state and the three legacy-activity migration cases.
- [x] Verify the new assertions fail against v1 production code.
- [x] Implement v2 types/normalization and mode-specific active-puzzle validation.
- [x] Update profile service/storage type signatures.
- [x] Run profile sanity/typecheck until green.

### Task 2: Four Purpose-Built Tutorial Levels and Wall-Only Guided Flow

**Files:**
- Create: `src/content/tutorial/types.ts`
- Create: `src/content/tutorial/levels/tutorial001.ts`
- Create: `src/content/tutorial/levels/tutorial002.ts`
- Create: `src/content/tutorial/levels/tutorial003.ts`
- Create: `src/content/tutorial/levels/tutorial004.ts`
- Create: `src/content/tutorial/manifest.ts`
- Replace: `src/onboarding/OnboardingFlow.ts`
- Test: `src/dev/tutorialSanity.ts`
- Modify: `package.json`

**Interfaces:**
- `TutorialLevelEntry { readonly slot: 1|2|3|4; readonly id: TutorialLevelId; readonly level: LevelDefinition }`.
- `TUTORIAL_MANIFEST` contains exactly four entries.
- `createOnboardingFlow(tutorialId, language)` returns tutorial-only steps; every board step has `expectedState: CellState.Wall`.

- [x] Add a failing `tutorialSanity.ts` proving four stable IDs, Campaign count remains 30, no guided FLOOR actions, and wall-only solution reaches validator solved for every tutorial level.
- [x] Create small valid 4×4/5×5/5×5/6×6 tutorial levels.
- [x] Replace campaign flow mappings with localized tutorial mappings.
- [x] Keep persistent message semantics and focus data non-rendering.
- [x] Add `sanity:tutorial` and run the new sanity/typecheck.

### Task 3: Tutorial Service, Session Persistence, and Launch Context

**Files:**
- Create: `src/tutorial/TutorialService.ts`
- Modify: `src/gameplay/PuzzleSessionService.ts`
- Modify: `src/campaign/types.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Test: `src/dev/tutorialSanity.ts`

**Interfaces:**
- `TutorialService.getContinueLevel()`, `startLevel(id)`, `completeLevel(id)`, `canEnterCampaign()`.
- `PuzzleSessionService.createTutorial(...)` saves to `profile.tutorial.activePuzzle`.
- `GameLaunchContext` adds `{ mode: 'tutorial'; tutorialLevelId: TutorialLevelId }`.
- `createTutorialGameSceneData(entry)` returns tutorial onboarding and no campaign onboarding.

- [x] Add failing service assertions: ordered progression, idempotent Tutorial 4 completion, replay never relocks Campaign, no Campaign result mutation.
- [x] Implement TutorialService and tutorial session save/clear behavior.
- [x] Extend launch data/context helpers.
- [x] Verify service/launch sanity and typecheck.

### Task 4: Campaign Gate and Meta Navigation

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/LevelSelectScene.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/i18n/UiCopy.ts`
- Test: `src/dev/tutorialSanity.ts`
- Test: `src/dev/metaNavigationSanity.ts`

**Interfaces:**
- Fresh Home primary Campaign action launches/resumes Tutorial until `profile.tutorial.completed`.
- Level Select exposes a Tutorial action and renders Campaign locked while Tutorial incomplete.
- Completed profiles can replay Tutorial without changing campaign unlock state.

- [x] Add failing source/runtime assertions for the fresh-profile gate and permanent Tutorial replay entry.
- [x] Register `TutorialService` in BootScene.
- [x] Add localized Tutorial/locked/completion copy.
- [x] Route Home and Level Select appropriately.
- [x] Run navigation/tutorial/localization sanities and typecheck.

### Task 5: GameScene Tutorial Runtime and Immediate Validator Completion

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Test: `src/dev/gameRegressionSanity.ts`
- Test: `src/dev/tutorialSanity.ts`

**Interfaces:**
- Tutorial uses `PuzzleSessionService.createTutorial` and `TutorialService.completeLevel`.
- Tutorial step index is reconstructed by skipping already-satisfied wall steps.
- Validator solve is checked after every board mutation before tutorial-step advancement; solved wins immediately.
- Tutorial 4 completion presents blocking `TUTORIAL COMPLETE`/`ОБУЧЕНИЕ ПРОЙДЕНО` with action into Campaign Level 1.

- [x] Add failing assertions that Campaign launches no contextual flow, Tutorial uses tutorial flow, and solve does not wait for remaining onboarding metadata.
- [x] Generalize session/context branches in GameScene to campaign/tutorial/daily/dev.
- [x] Dispatch tutorial completion separately and clear only tutorial active puzzle.
- [x] Implement tutorial level title/progression and Tutorial Complete transition.
- [x] Preserve Settings/Rules return behavior and explicit message dismissal; keep intro messages intentionally blocking while any handoff/reminder message can remain visible without pausing board input or the timer.
- [x] Run game-regression/tutorial/puzzle-session sanities and typecheck.

### Task 6: Rules Copy, Remove Campaign Runtime Onboarding, Release Gates

**Files:**
- Modify: `src/help/HelpRules.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/dev/onboardingSanity.ts`
- Modify: `src/dev/helpRulesSanity.ts`
- Modify: `src/dev/campaignRuntimeSanity.ts`
- Modify: `scripts/release-acceptance.mjs`
- Modify: `CURRENT_STATE.md`
- Modify: `PROJECT.md`
- Modify: `TECH.md`

**Interfaces:**
- Help goal says walls satisfy rules; FLOOR is optional notation in RU/EN.
- `createCampaignGameSceneData` always has empty onboarding/contextual onboarding false.
- Release acceptance runs the Tutorial regression gate.

- [x] Add failing RU/EN Help assertions for optional FLOOR semantics.
- [x] Update Help copy and campaign launch runtime behavior.
- [x] Retire old campaign-onboarding sanity expectations in favor of tutorial-only expectations.
- [x] Wire `sanity:tutorial` into release acceptance.
- [x] Update project state docs.
- [x] Run the broad sanity/typecheck/release-audit set and package the verified project.
