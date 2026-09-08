# Yandex Moderation Lifecycle Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add moderation-safe Game Ready, SDK language exposure, Yandex pause/resume handling, and gameplay markup without changing puzzle rules or monetization policy.

**Architecture:** Extend the existing `PlatformServices` boundary with readiness, environment, and gameplay ports. Keep Phaser-specific lifecycle orchestration in `GameScene`, but isolate its activity state transitions in a small pure coordinator so TDD can cover pause/resume and markup behavior without booting Phaser.

**Tech Stack:** TypeScript 6, Phaser 4, Yandex Games SDK, `tsx` dev sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-yandex-moderation-lifecycle-foundation-design.md`

## Global Constraints

- `LoadingAPI.ready()` is signaled only after an interactive Home or Game scene exists.
- Yandex SDK feature methods are optional and must never prevent local fallback or gameplay.
- `environment.i18n.lang` is exposed raw; locale mapping/UI translation is Task 27.
- Explicit `GameplayAPI.start()` / `stop()` mark real puzzle gameplay only.
- `game_api_pause` / `game_api_resume` pause/resume Dungeon Logic without duplicating GameplayAPI calls that Yandex aligns automatically.
- Existing campaign, Daily, ads, solver, and profile semantics must remain unchanged.

---

### Task 1: Extend platform service contract and Yandex adapter

**Files:**
- Modify: `src/platform/services.ts`
- Modify: `src/platform/local.ts`
- Modify: `src/platform/yandex.ts`
- Modify: `src/platform/yandex-globals.d.ts`
- Test: `src/dev/platformSanity.ts`

**Interfaces:**
- Produces: `PlatformServices.readiness.ready(): Promise<void>`
- Produces: `PlatformServices.environment.language: string | null`
- Produces: `PlatformServices.gameplay.start(): Promise<void>` and `stop(): Promise<void>`
- Produces: `PlatformServices.lifecycle.isPaused(): boolean` with eager Yandex SDK event tracking

- [x] **Step 1: Write failing platform sanity assertions**

Extend `platformSanity.ts` so the local adapter exposes no-op readiness/gameplay, `language === null`, and `lifecycle.isPaused() === false`. Extend the fake Yandex SDK with `environment.i18n.lang`, `features.LoadingAPI.ready`, and `features.GameplayAPI.start/stop`; assert readiness is called once across two `ready()` calls, gameplay calls are deduplicated across repeated start/stop transitions, language is exposed, and a pause fired before any scene subscriber is retained by `lifecycle.isPaused()`.

- [x] **Step 2: Run the sanity and verify RED**

Run: `npx tsx src/dev/platformSanity.ts`

Expected: compile/runtime failure because the new service properties do not exist.

- [x] **Step 3: Implement minimal platform ports**

Add `PlatformReadinessPort`, `PlatformEnvironment`, and `GameplayMarkupPort` to `services.ts`, plus `GameLifecyclePort.isPaused()`. Add local no-op implementations. In `yandex.ts`, feature-detect `sdk.features.LoadingAPI` and `GameplayAPI`, cache the readiness signal, track explicit gameplay state, read `sdk.environment?.i18n?.lang ?? null`, and install pause/resume listeners eagerly so startup-ad state is retained before GameScene subscribes. Update ambient Yandex SDK declarations to match.

- [x] **Step 4: Run platform sanity and verify GREEN**

Run: `npx tsx src/dev/platformSanity.ts`

Expected final line: `[Dungeon Logic] Platform sanity: ... passed` and zero failures.

---

### Task 2: Add pure gameplay activity coordinator

**Files:**
- Create: `src/runtime/PlatformGameplayActivity.ts`
- Create: `src/dev/platformGameplaySanity.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `GameplayMarkupPort`
- Produces: `PlatformGameplayActivity.startInternal()`, `stopInternal()`, `pauseFromPlatform()`, `resumeFromPlatform(canResume)`, and `isPlatformPaused()`.

- [x] **Step 1: Write failing coordinator sanity**

The sanity must assert: initial internal start calls markup start once; internal modal pause calls stop; internal resume calls start; platform pause changes blocker state without calling markup stop; platform resume changes blocker state without calling markup start; resume while `canResume === false` does not restart internal gameplay.

- [x] **Step 2: Run sanity and verify RED**

Run: `npx tsx src/dev/platformGameplaySanity.ts`

Expected: module-not-found failure for `PlatformGameplayActivity`.

- [x] **Step 3: Implement coordinator**

Create a small state holder that delegates only internal start/stop transitions to the gameplay port while platform pause/resume only maintain the platform blocker. Keep methods synchronous at the scene boundary and fire-and-forget port promises with caught failures.

- [x] **Step 4: Run sanity and verify GREEN**

Run: `npx tsx src/dev/platformGameplaySanity.ts`

Expected final line: `[Dungeon Logic] Platform gameplay sanity: ... passed`.

---

### Task 3: Wire Game Ready into interactive scenes

**Files:**
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/GameScene.ts`

**Interfaces:**
- Consumes: `PlatformServices.readiness.ready()` from Phaser registry.

- [x] **Step 1: Add source-level failing assertions**

Extend `platformGameplaySanity.ts` to read `HomeScene.ts` and `GameScene.ts` and require both to call `readiness.ready()` only from scene creation code, not `BootScene.ts`.

- [x] **Step 2: Run sanity and verify RED**

Run: `npx tsx src/dev/platformGameplaySanity.ts`

Expected: assertion failure that interactive scenes do not yet signal readiness.

- [x] **Step 3: Implement scene readiness calls**

After Home controls are created, fetch platform services from the registry and invoke `void services.readiness.ready()`. In GameScene direct-launch path, invoke the same signal after board/input setup. Do not add a BootScene readiness call.

- [x] **Step 4: Run sanity and verify GREEN**

Run: `npx tsx src/dev/platformGameplaySanity.ts`

Expected: source wiring assertions pass.

---

### Task 4: Wire platform pause/resume and gameplay markup in GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Test: `src/dev/platformGameplaySanity.ts`

**Interfaces:**
- Consumes: `PlatformGameplayActivity`
- Consumes: `PlatformServices.lifecycle`

- [x] **Step 1: Add failing source assertions for lifecycle ownership**

Require GameScene to subscribe to `platformServices.lifecycle`, unsubscribe on shutdown, include `platformPaused` in its active-play gate, and route internal timer pause/resume through the activity coordinator.

- [x] **Step 2: Run sanity and verify RED**

Run: `npx tsx src/dev/platformGameplaySanity.ts`

Expected: assertion failure for missing lifecycle subscription/cleanup.

- [x] **Step 3: Implement GameScene lifecycle wiring**

Instantiate `PlatformGameplayActivity` when platform services exist. Make internal `pauseActiveTimer` call coordinator stop and internal `resumeActiveTimer` call coordinator start. Add variants used by platform event handlers that update the timer without explicit markup calls. On platform pause disable input, save, and best-effort flush. On resume restore input only when current puzzle/modal state permits. Unsubscribe on scene shutdown.

- [x] **Step 4: Run focused sanity and existing regressions**

Run:

```bash
npx tsx src/dev/platformGameplaySanity.ts
npx tsx src/dev/platformSanity.ts
npx tsx src/dev/puzzleSessionSanity.ts
npx tsx src/dev/monetizationSanity.ts
npx tsx src/dev/rewardedHintSanity.ts
```

Expected: all commands exit 0.

---

### Task 5: Final verification and patch packaging

**Files:**
- Review all Task 26 diff files only.

- [x] **Step 1: Run strict TypeScript/build gates**

Run `npm run build` when dependencies are intact. If the container's known partial `node_modules` prevents the full build before project code, run a focused strict `tsc` gate for changed production/dev files and report the environment limitation honestly.

- [x] **Step 2: Verify no unrelated content changes**

Compare against the Task 25 baseline and ensure no campaign level, Daily snapshot, curation corpus, or monetization policy file changed.

- [x] **Step 3: Package only the Task 26 diff**

Create `dungeon-logic-product-task26-yandex-lifecycle-foundation.zip`, verify archive contents, and compute SHA256.
