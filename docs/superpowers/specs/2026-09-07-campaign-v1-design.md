# Dungeon Logic Campaign v1 Design

**Date:** 2026-09-07  
**Status:** Approved design, ready for implementation planning  
**Project:** `dungeon-logic`  
**Runtime:** Phaser 4 / TypeScript / Vite  

## 1. Purpose

Campaign v1 turns the existing standalone puzzle runtime into a playable progression loop without changing the puzzle rules, validator, solver, Human Solver, Difficulty Analyzer, or Generator Difficulty v2.

The campaign system must provide:

- a real level-select hub;
- linear unlock progression;
- persistent completion state;
- Continue / replay behavior;
- campaign-aware completion and Next Level flow;
- contextual onboarding;
- a deterministic dev-only promotion path from generated candidates into stable campaign content;
- strict separation between production campaign content and `.generated` dev artifacts.

The first playable pilot contains 5 manually curated `easy` `monster-only` campaign levels. The architecture is sized for the planned 30-level Campaign v1 but must not fabricate or auto-promote the remaining 25 levels.

## 2. Existing Runtime and Compatibility Boundary

The current runtime has two scenes:

```text
BootScene -> GameScene
```

`GameScene` currently resolves levels from URL query parameters and supports:

- authored technical levels through `?level=...`;
- generated candidate playtest through `?seed=<uint32>&candidate=<id>` in development;
- Restart by restarting the current scene;
- completion by disabling board input and displaying `Dungeon complete!`.

Campaign v1 must preserve these dev/test workflows. The current `src/data/levels/level001...level012` levels remain technical authored/regression content and are not part of the production campaign.

No existing technical level is renamed, moved, or silently promoted into campaign content.

## 3. Product Decisions

### 3.1 Progression model

Campaign progression is linear.

- A fresh player has only slot 1 unlocked.
- Completing slot N unlocks slot N+1 when it exists.
- Completed levels remain replayable.
- Locked levels cannot be started through the campaign UI.
- Campaign v1 is completion-only: no stars, move score, timer rating, or performance grading.

The model must remain compatible with a future chapter layer, but Campaign v1 does not implement chapters.

### 3.2 Campaign content source

Final campaign levels are stable source-controlled snapshots.

`.generated/candidates-<seed>.json` is only a dev source for candidate discovery and playtest. A generated candidate becomes campaign content only after explicit human selection and promotion.

After promotion:

- the level is copied into `src/content/campaign/levels/`;
- it receives a stable campaign id such as `campaign-001`;
- runtime no longer depends on the candidate seed, candidate report, or `.generated` directory;
- regeneration of candidate pools cannot alter already promoted campaign content.

### 3.3 Campaign v1 mechanics

Campaign v1 uses only generator mechanics already supported by the frozen generator:

- Monsters;
- Treasure Rooms.

Blockers and directional doors remain technical/dev content and are excluded from Campaign v1. Generator architecture is not reopened to add them.

## 4. Planned Campaign Shape

The planned 30-level curation envelope is:

| Slots | Allowed archetypes | Allowed difficulty | Purpose |
| --- | --- | --- | --- |
| 1–5 | `monster-only` | `easy` | onboarding and core deduction |
| 6–10 | `chest-one-room` | `easy` | introduce Treasure Room rules |
| 11–18 | `mixed-one-room` | `easy`, `medium` | combine monsters and one room |
| 19–24 | `chest-two-rooms`, `mixed-two-rooms` | `medium` | two-room reasoning |
| 25–30 | `chest-two-rooms`, `mixed-two-rooms` | `medium`, `hard` | late-campaign challenge |

This is a curation constraint, not an automatic sorter. Difficulty score is a filter and diagnostic, not a command to order levels numerically.

The first implementation pilot promotes only slots 1–5. Slots 6–30 are represented by the curation plan but are not shown in Level Select until actual campaign entries exist.

## 5. Architecture

Campaign v1 is a separate subsystem layered above the puzzle runtime.

```text
BootScene / launch routing
        |
        +---- dev launch ----------------------> GameScene(dev)
        |
        v
CampaignService
        |
        +---- Campaign Manifest
        +---- Campaign Progress logic
        +---- CampaignProgressStorage
        |
        v
LevelSelectScene
        |
        v
GameScene(campaign)
        |
        v
CampaignService.completeLevel(...)
        |
        v
Completion overlay -> Next / Level Select
```

The puzzle core must not import campaign modules.

`LevelDefinition`, `PuzzleState`, `LevelValidator`, Puzzle Solver, Human Solver, Difficulty Analyzer, and generator internals remain campaign-agnostic.

## 6. File Responsibilities

Target structure:

```text
src/
  campaign/
    types.ts
    CampaignProgress.ts
    CampaignProgressStorage.ts
    LocalCampaignProgressStorage.ts
    CampaignService.ts

  content/
    campaign/
      types.ts
      curationPlan.ts
      manifest.ts
      levels/
        index.ts
        campaign001.ts
        campaign002.ts
        ...

  scenes/
    BootScene.ts
    LevelSelectScene.ts
    GameScene.ts

  dev/
    promoteCampaignLevel.ts
    campaignSanity.ts
    campaignPromotionSanity.ts
```

Responsibilities:

- `campaign/types.ts`: runtime campaign progress/service contracts and launch context.
- `CampaignProgress.ts`: pure normalization and progression rules.
- `CampaignProgressStorage.ts`: async persistence interface.
- `LocalCampaignProgressStorage.ts`: browser fallback/local-development implementation.
- `CampaignService.ts`: manifest + progress orchestration used by scenes.
- `content/campaign/types.ts`: campaign content/provenance/curation contracts.
- `curationPlan.ts`: slot constraints and onboarding assignments for planned Campaign v1.
- `manifest.ts`: ordered runtime campaign entries created from promoted snapshots.
- `levels/*.ts`: immutable promoted `LevelDefinition` snapshots plus provenance metadata.
- `levels/index.ts`: deterministic static registry of promoted snapshots; promotion tooling regenerates this registry rather than using runtime filesystem access.
- `LevelSelectScene.ts`: campaign hub UI only; no direct storage access.
- `promoteCampaignLevel.ts`: dev-only deterministic promotion CLI.
- sanity modules: pure behavioral regression checks without pixel-layout assertions.

## 7. Campaign Content Contracts

### 7.1 Stable campaign entry

```ts
export interface CampaignLevelEntry {
  readonly slot: number;
  readonly id: string;
  readonly level: LevelDefinition;
  readonly onboarding: readonly CampaignOnboardingId[];
}
```

Rules:

- slots are positive, unique, and contiguous among promoted entries;
- ids are unique;
- slot N uses id `campaign-NNN`, zero-padded to three digits;
- `entry.id` and `entry.level.id` must match;
- manifest order is slot order;
- after release, a campaign id is not silently reused for a different puzzle.

### 7.2 Provenance metadata

Each promoted snapshot keeps dev-facing provenance separate from gameplay rules:

```ts
export interface CampaignLevelProvenance {
  readonly sourceSeed: number;
  readonly sourceCandidateId: string;
  readonly sourceArchetype: GeneratorArchetype;
  readonly difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  readonly difficultyScore: number;
  readonly humanStatus:
    | 'solved-direct'
    | 'solved-with-contradiction';
}
```

Provenance is diagnostic metadata. Campaign progression must not depend on source seed or source candidate id.

### 7.3 Onboarding ids

Campaign v1 supports explicit onboarding identifiers:

```ts
export type CampaignOnboardingId =
  | 'row-column-clues'
  | 'monster-dead-end'
  | 'treasure-room-rule';
```

Initial assignments:

- slot 1: `row-column-clues`, `monster-dead-end`;
- slots 2–5: no required system-rule onboarding;
- the first promoted Treasure Room level in the planned campaign (slot 6 under the current curation plan) receives `treasure-room-rule`.

## 8. Progress Model

Campaign v1 persistence schema:

```ts
export interface CampaignProgressV1 {
  readonly schemaVersion: 1;
  readonly highestUnlockedSlot: number;
  readonly completedLevelIds: readonly string[];
  readonly lastPlayedLevelId: string | null;
}
```

Fresh state:

```ts
{
  schemaVersion: 1,
  highestUnlockedSlot: 1,
  completedLevelIds: [],
  lastPlayedLevelId: null,
}
```

### 8.1 Canonical normalization

Manifest is the source of truth for campaign structure. Stored progress is treated as untrusted input and normalized on load.

Normalization must:

1. reject non-v1 shapes as invalid input;
2. remove unknown campaign ids;
3. remove duplicates;
4. sort known completed ids by manifest slot;
5. preserve only the longest contiguous completed prefix from slot 1;
6. derive `highestUnlockedSlot` from that prefix instead of trusting the stored number;
7. clamp the fully completed campaign to the final promoted slot;
8. retain `lastPlayedLevelId` only when it is a known currently unlocked entry; otherwise set it to `null`.

Examples:

```text
completed = [campaign-001, campaign-002, campaign-999]
-> [campaign-001, campaign-002]

completed = [campaign-001, campaign-003]
-> [campaign-001]

stored highestUnlockedSlot = 28
completed = [campaign-001]
-> highestUnlockedSlot = 2
```

### 8.2 Completion semantics

Completion is idempotent.

- Completing an already completed level does not duplicate ids or unlock extra levels.
- Completing the current highest unlocked level advances unlock by at most one slot.
- Completing the last promoted level does not create a nonexistent unlock.
- A locked campaign level cannot be started through `CampaignService`.

## 9. Persistence Boundary and Backendless Platform Constraint

### 9.1 Hard platform constraint

Dungeon Logic has **no custom backend**.

Campaign v1 and future meta systems must not require:

- a private HTTP API;
- a custom database;
- a server-side account system;
- secret server credentials shipped to the client;
- server-authoritative gameplay/economy logic;
- custom scheduled jobs or cron infrastructure.

The shipped game is a client application hosted on Yandex Games. Features must be implementable client-side and/or through capabilities exposed by the Yandex Games SDK.

Client state is therefore not treated as cryptographically authoritative. Campaign completion is ordinary player progress, not a protected competitive asset.

### 9.2 Storage interface

```ts
export interface CampaignProgressStorage {
  load(): Promise<CampaignProgressV1 | null>;
  save(progress: CampaignProgressV1): Promise<void>;
}
```

The interface is async even when the initial local implementation is synchronous internally. This prevents campaign scenes/services from depending on browser-storage timing and leaves room for a Yandex Games SDK-backed adapter later without changing campaign logic.

### 9.3 Initial and future adapters

Campaign pilot implementation includes `LocalCampaignProgressStorage` for local development and browser fallback.

A production Yandex Games storage adapter is a platform-integration concern that implements the same interface. Adding it must not require changes to progression rules, manifest rules, Level Select behavior, or GameScene completion semantics.

Future backendless platform features such as ads, purchases, trusted platform time, or leaderboards are outside Campaign v1 and must be integrated through platform boundaries rather than by adding a custom backend.

## 10. CampaignService Contract

Scenes interact with campaign state through `CampaignService`; they do not access storage directly.

Required behavior:

```ts
getLevels(): readonly CampaignLevelEntry[];
getProgress(): CampaignProgressV1;
getContinueLevel(): CampaignLevelEntry | null;
canPlayLevel(id: string): boolean;
startLevel(id: string): Promise<CampaignLevelEntry>;
completeLevel(id: string): Promise<CampaignCompletionResult>;
```

`startLevel(id)`:

- rejects unknown or locked ids;
- updates `lastPlayedLevelId` in memory;
- attempts persistence;
- persistence failure does not prevent the level from launching in the current session.

`completeLevel(id)`:

- applies completion in memory first;
- computes whether a next campaign entry is now available;
- attempts persistence;
- returns completion state even if persistence fails;
- logs persistence failure but does not convert a solved puzzle into a gameplay failure.

A result contract may include:

```ts
export interface CampaignCompletionResult {
  readonly progress: CampaignProgressV1;
  readonly nextLevel: CampaignLevelEntry | null;
  readonly persisted: boolean;
}
```

## 11. Runtime Launch Flow

### 11.1 Normal launch

```text
BootScene
-> initialize campaign storage/service
-> load + normalize progress
-> LevelSelectScene
```

Level Select is the Campaign v1 start screen. There is no separate main menu in this slice.

### 11.2 Dev launch precedence

Existing technical query paths are resolved before normal campaign launch.

```text
valid ?level=...
-> GameScene dev mode

valid dev generated ?seed=...&candidate=...
-> GameScene dev mode

no valid dev query
-> Campaign flow
```

Dev launches:

- do not load or mutate campaign progress;
- do not unlock campaign levels;
- do not show campaign Next Level behavior;
- preserve existing Restart/query behavior;
- preserve the dev-only restriction for generated candidate loading.

### 11.3 Game launch context

`GameScene` receives a concrete `LevelDefinition` and a small launch context. It does not own URL routing.

```ts
export type GameLaunchContext =
  | {
      readonly mode: 'campaign';
      readonly campaignLevelId: string;
    }
  | {
      readonly mode: 'dev';
    };
```

The routing layer resolves the level before gameplay starts.

## 12. Level Select UX

Level Select is intentionally functional rather than final-art UI.

It contains:

- a prominent `Continue` action;
- a grid/list of currently promoted campaign entries only;
- visible level numbers;
- completed, current/unlocked, and locked states.

It does not show unimplemented slots 6–30 during the five-level pilot.

### 12.1 Level states

- `completed`: playable and visibly marked completed;
- `unlocked`: playable;
- `current`: the highest currently unlocked recommended next level, visually distinguished from ordinary replayable completed entries;
- `locked`: visible but noninteractive.

### 12.2 Continue behavior

`Continue` resolves in this order:

1. valid, currently playable `lastPlayedLevelId`;
2. entry at `highestUnlockedSlot`;
3. final promoted entry when every promoted level is completed.

No independent selected-level field is persisted.

## 13. GameScene Campaign Behavior

### 13.1 Restart

- campaign mode: restart the same `campaignLevelId` and snapshot;
- dev mode: preserve current dev-query behavior.

Restart never changes campaign completion state.

### 13.2 Victory

Dev mode keeps technical completion behavior and does not touch campaign state.

Campaign mode:

```text
puzzle solved
-> disable board input
-> CampaignService.completeLevel(current id)
-> show campaign completion overlay
```

Completion overlay:

```text
Level complete
[Next level]      // only when nextLevel != null
[Level select]
```

The next entry is obtained from manifest order, never by parsing/incrementing the id string.

Persistence failure must not hide the completion overlay or relock the level in the current session.

## 14. Onboarding Flow

Campaign onboarding is contextual and attached to campaign entries, not a separate tutorial mode.

Rules:

- onboarding appears only in campaign mode;
- onboarding ids come from the campaign manifest/curation data;
- onboarding is shown only while the current level is not completed;
- after the level is completed, replay does not show its onboarding;
- if the player views onboarding and exits before completing the level, it appears again on the next attempt;
- no separate tutorial-flags array is stored in CampaignProgressV1.

Slot 1 introduces:

- row/column clue meaning;
- Monster dead-end rule.

The first Treasure Room campaign level introduces the Treasure Room rule once through the same mechanism.

Onboarding UI must not be locked to pixel-exact tests. It may be visually redesigned later while preserving behavior.

## 15. Promotion Tool

Command shape:

```text
npm run campaign:promote -- --seed <uint32> --candidate <candidate-id> --slot <number>
```

Optional explicit replacement support may exist as `--replace`, but ordinary curation workflow must not use it. A replacement is never implicit.

### 15.1 Promotion validation pipeline

Before writing any campaign file, the tool must:

1. load `.generated/candidates-<seed>.json`;
2. resolve the requested candidate by exact id;
3. extract its `LevelDefinition`;
4. validate it with the current `LevelValidator`;
5. verify unique solvability with the canonical Puzzle Solver;
6. run the Human Solver;
7. reject `stuck` or `invalid` human status;
8. run `DifficultyAnalyzer`;
9. reject `unrated` difficulty;
10. verify archetype and difficulty against `campaignCurationPlan` for the target slot;
11. verify the target slot/id is not occupied unless explicit replacement was requested;
12. rewrite only the snapshot id to the stable campaign id;
13. validate the resulting campaign registry/manifest before persisting changes.

### 15.2 Atomicity

Promotion must perform all validation before filesystem mutation.

If any check fails:

- command exits non-zero;
- no level snapshot is created;
- campaign registry/manifest remains unchanged.

### 15.3 Deterministic output

For the same repo state, candidate, seed, and slot, promotion output must be byte-stable.

No timestamps, random formatting, environment paths, or nondeterministic property order are written into campaign source files.

### 15.4 Registry regeneration

Promotion writes the new `campaignNNN.ts` snapshot and deterministically regenerates the static `src/content/campaign/levels/index.ts` registry from promoted slots. `manifest.ts` consumes this static registry plus curation/onboarding data.

This avoids runtime filesystem access and avoids ad-hoc source patching of scene code.

## 16. Pilot Curation Workflow

The first five campaign levels are selected manually.

Workflow:

```text
generate 10–15 easy monster-only candidates
-> use existing generated playtest URLs
-> human playtest/compare candidates
-> select five
-> order them from clearest to more demanding
-> promote to slots 1..5
```

The five are not chosen automatically by the top five numeric difficulty scores. Human readability and onboarding value may override small score differences.

The remaining 25 levels are not auto-filled after infrastructure lands. They are curated only after the five-level pilot flow has been played end-to-end.

## 17. Error Handling

### 17.1 Load failure / corrupt save

- missing save -> fresh normalized progress;
- malformed data -> fresh/normalized progress, no crash;
- unknown ids -> removed;
- impossible unlock number -> recomputed;
- unsupported schema version -> treated as invalid input for Campaign v1, no speculative migration.

### 17.2 Save failure

- keep updated in-memory state;
- log technical error;
- continue gameplay;
- do not expose raw storage exceptions to the player.

### 17.3 Migration policy

Campaign v1 defines only schema version 1.

No generic migration framework is implemented until a real version 2 exists. Stable campaign ids and normalization are the compatibility strategy for v1.

## 18. Testing Strategy

Campaign core tests are pure TypeScript and do not require Phaser rendering.

### 18.1 `campaignSanity.ts`

Must cover:

- fresh progress unlocks only slot 1;
- completing slot 1 unlocks slot 2;
- repeat completion is idempotent;
- completed ids are unique and ordered;
- last promoted level does not unlock a nonexistent entry;
- locked campaign level cannot be started;
- Continue resolution follows the defined priority;
- unknown ids are removed during normalization;
- non-contiguous completions are reduced to the contiguous prefix;
- stored `highestUnlockedSlot` is recomputed;
- duplicate manifest slots fail validation;
- duplicate manifest ids fail validation;
- invalid id/slot pairing fails validation;
- onboarding is shown only for uncompleted campaign entries;
- persistence failure keeps in-memory progression usable.

### 18.2 `campaignPromotionSanity.ts`

Must cover:

- valid generated candidate produces a campaign snapshot;
- promotion output is deterministic;
- occupied slot is rejected;
- missing candidate is rejected;
- mismatched archetype is rejected;
- mismatched difficulty is rejected;
- invalid/nonunique/human-unsolved/unrated candidate is rejected at the corresponding gate;
- failed promotion causes no partial writes;
- regenerated registry ordering is stable.

### 18.3 Scene/runtime behavior checks

Behavioral checks must cover:

- Boot without dev query enters Level Select;
- Boot with authored technical query enters dev GameScene;
- valid generated playtest query preserves dev flow;
- locked Level Select entry does not launch;
- unlocked entry launches the correct campaign snapshot/context;
- campaign victory completes the correct id;
- campaign victory shows Next only when a next entry exists;
- dev victory does not mutate campaign progress;
- campaign Restart preserves campaign level;
- dev Restart preserves dev query behavior.

No pixel-coordinate assertions for Level Select cards or onboarding presentation.

## 19. Pilot Acceptance Criteria

Campaign v1 infrastructure is ready for pilot playtest only when all of the following are true:

- five manually selected `easy` `monster-only` snapshots are promoted as `campaign-001` through `campaign-005`;
- fresh progress exposes only campaign slot 1;
- completing each level unlocks the next exactly once;
- page reload restores local progress;
- Level Select accurately displays completed/unlocked/locked states;
- Continue follows the defined resolution rules;
- Restart does not mutate progression;
- slot 1 onboarding appears before first completion and not on replay after completion;
- `?level=...` technical flow still works;
- generated candidate playtest still works in development;
- campaign code does not read `.generated` at runtime;
- campaign core does not alter puzzle rules/solver/generator behavior;
- campaign sanity and promotion sanity are green;
- existing project sanity suites remain green;
- production build is green.

After this gate, the user plays the five-level pilot before slots 6–30 are curated.

## 20. Non-Goals

Campaign v1 does not implement:

- final visual design for menu/meta UI;
- separate main menu;
- chapters;
- stars, scoring, speed grading, or move grading;
- daily challenges;
- achievements;
- ads or rewarded flows;
- purchases;
- leaderboards;
- analytics;
- custom backend;
- server-authoritative anti-cheat/economy;
- Yandex-specific storage adapter in the core campaign slice;
- automatic generation/promotion of all 30 campaign levels;
- Blocker/Directional Door campaign content;
- changes to Generator Difficulty v2.

These may be separate future product/platform slices. Campaign contracts must not prevent a backendless Yandex Games integration later.

## 21. Design Invariants

The following are hard invariants:

1. Campaign runtime never loads `.generated` candidate reports.
2. Technical authored levels remain separate from campaign content.
3. A promoted level has a stable source-controlled campaign id.
4. Manifest/curation data defines campaign order; ids are never numerically incremented to find the next level.
5. Puzzle core does not import campaign modules.
6. Scenes do not read/write browser storage directly.
7. Save corruption never crashes the game.
8. Save failure never invalidates a solved puzzle in the current session.
9. Dev mode never changes campaign progress.
10. Promotion validates before writing and is deterministic.
11. The game architecture assumes no custom backend.
12. The frozen generator is not modified to satisfy Campaign v1.
