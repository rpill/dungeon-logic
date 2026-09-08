# Dungeon Logic Platform Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolate Yandex Games SDK access behind local-safe storage, trusted-clock, and advertising ports so game systems never depend directly on SDK globals.

**Architecture:** Define narrow platform interfaces, provide deterministic local fallbacks, and add a lazy cached Yandex adapter. Boot resolves platform services once, then injects/registers them for profile, Daily, and monetization systems.

**Tech Stack:** TypeScript 6, Yandex Games browser JS SDK, localStorage fallback.

**Spec:** `docs/superpowers/specs/2026-09-08-dungeon-logic-v1-product-ui-design.md`

## Global Constraints

- Game must continue to work when Yandex SDK is absent/unavailable.
- Trusted time is optional; callers receive `null` rather than fabricated trust.
- Ads unavailable must never block play or hint fallback UI.
- SDK initialization/player lookup is cached and not repeated per call.

---

### Task 1: Platform interfaces and local fallback

**Files:**
- Create: `src/platform/services.ts`
- Create: `src/platform/local.ts`
- Create: `src/dev/platformSanity.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export interface PlayerStorage {
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
}
export interface TrustedClock {
  now(): Promise<Date | null>;
}
export interface AdsPort {
  showInterstitial(): Promise<'shown' | 'skipped' | 'unavailable'>;
  showRewarded(): Promise<'rewarded' | 'closed' | 'unavailable'>;
}
export interface GameLifecyclePort {
  subscribe(handlers: { onPause(): void; onResume(): void }): () => void;
}
export interface PlatformServices {
  readonly storage: PlayerStorage;
  readonly clock: TrustedClock;
  readonly ads: AdsPort;
  readonly lifecycle: GameLifecyclePort;
}
```

- [ ] **Step 1: Write local fallback sanity**

Assert memory/local storage round trip, `clock.now()` returns null, both ad methods return `unavailable` without throwing, and lifecycle subscription is a no-op unsubscribe function.

- [ ] **Step 2: Implement local adapter**

Use one profile key and memory fallback when localStorage throws.

- [ ] **Step 3: Add `sanity:platform` and run**

- [ ] **Step 4: Commit**

```bash
git add src/platform src/dev/platformSanity.ts package.json
git commit -m "feat: add platform service boundary"
```

### Task 2: Yandex SDK adapter

**Files:**
- Create: `src/platform/yandex.ts`
- Create: `src/platform/yandex-globals.d.ts`
- Extend: `src/dev/platformSanity.ts`

**Interfaces:**
- `createYandexPlatformServices(globals = globalThis): Promise<PlatformServices | null>`.
- Cache `YaGames.init()` promise and `getPlayer()` promise inside adapter instance.

- [ ] **Step 1: Add fake-SDK sanity**

Fake `YaGames.init()` counts calls. Assert multiple storage/time/ad operations cause one init and one player lookup. Store cloud data under the single key `dungeonLogicProfile`: load calls `player.getData(['dungeonLogicProfile'])`, save calls `player.setData({ dungeonLogicProfile: value })`. Assert exact round trip through the fake Player.

- [ ] **Step 2: Implement trusted server time**

Call SDK server-time capability; parse into `Date`; invalid/unavailable result returns null.

- [ ] **Step 3: Implement Yandex pause/resume lifecycle**

Subscribe to `ysdk.on('game_api_pause', handler)` and `ysdk.on('game_api_resume', handler)` and unsubscribe with matching `ysdk.off(...)`. This covers platform startup ads as well as platform-driven pauses.

- [ ] **Step 4: Implement ad callbacks**

Map fullscreen close/error/open callbacks to `shown/skipped/unavailable`; map rewarded callback only to `rewarded`, closing without reward to `closed`.

- [ ] **Step 5: Run platform sanity**

Expected: PASS with fake SDK and no real network dependency.

- [ ] **Step 6: Commit**

```bash
git add src/platform/yandex.ts src/platform/yandex-globals.d.ts src/dev/platformSanity.ts
git commit -m "feat: add Yandex platform adapter"
```

### Task 3: Boot integration and profile storage adapter

**Files:**
- Modify: `src/profile/PlayerProfileStorage.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Modify: `src/scenes/BootScene.ts`
- Create: `src/platform/PlatformRegistry.ts`

**Interfaces:**
- Boot tries Yandex first, falls back to local services.
- PlayerProfileService uses `PlatformServices.storage` as authoritative runtime storage; migration from legacy local campaign save remains available when cloud returns no profile.
- Registry keys: `platform-services`, `player-profile-service`, `campaign-service`.

- [ ] **Step 1: Add boot-resolution test helper**

Pure helper `resolvePlatformServices(yandexFactory, localFactory)` returns Yandex services when non-null, otherwise local.

- [ ] **Step 2: Wire BootScene**

Do not delay dev URL playtest on ad setup. Create services → load profile → create campaign service → route Home.

- [ ] **Step 3: Run**

```bash
npm run sanity:platform
npm run sanity:profile
npm run sanity:campaign-runtime
npm run build
```

- [ ] **Step 4: Manual fallback smoke outside Yandex**

`npm run dev` must reach Home without SDK errors.

- [ ] **Step 5: Commit**

```bash
git add src/profile src/platform src/scenes/BootScene.ts
git commit -m "feat: use platform storage in boot flow"
```
