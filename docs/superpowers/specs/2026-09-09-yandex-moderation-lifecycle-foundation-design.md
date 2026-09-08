# Yandex Moderation Lifecycle Foundation Design

## Goal

Make Dungeon Logic explicitly satisfy the Yandex Games platform lifecycle contract before localization and final release QA: signal Game Ready only when an interactive scene is visible, expose the SDK language, react to `game_api_pause` / `game_api_resume`, and mark real puzzle gameplay with `GameplayAPI.start()` / `GameplayAPI.stop()`.

## Platform boundary

`PlatformServices` remains the only runtime-facing platform abstraction. Extend it with three small capabilities:

- `readiness.ready(): Promise<void>` — idempotent Game Ready signal. Local adapter is a no-op. Yandex adapter calls `ysdk.features.LoadingAPI?.ready()` at most once and absorbs SDK errors so a moderation integration cannot brick local gameplay.
- `environment.language: string | null` — raw platform language. Yandex reads `ysdk.environment.i18n.lang`; local returns `null`. Task 27 will map this to the game's supported locales and saved preference.
- `gameplay.start()` / `gameplay.stop()` — idempotent gameplay markup. Local adapter is a no-op. Yandex calls `ysdk.features.GameplayAPI?.start()` and `.stop()` only on state transitions.

The existing lifecycle port remains responsible for `game_api_pause` / `game_api_resume`, but it now subscribes to the Yandex SDK immediately when platform services are created and exposes `isPaused(): boolean`. This closes the startup-ad race where a pause can arrive before `GameScene` exists; later scene subscribers still receive subsequent transitions.

## Game Ready timing

Do not call Game Ready from `BootScene` immediately after SDK initialization. Boot still performs async platform/profile initialization and can show no player-facing controls yet.

Call `platformServices.readiness.ready()` after an actual interactive destination scene has constructed its controls:

- `HomeScene.create()` for normal launches.
- `GameScene.createGame()` after the board/input is initialized for direct dev launches.

The port is idempotent, so scene restarts or later visits cannot double-signal Yandex.

## Gameplay markup

`GameScene` is the only gameplay scene, so it owns explicit gameplay markup.

- When puzzle interaction is live and the active timer can run, call `platformServices.gameplay.start()`.
- Whenever existing scene logic pauses active play — reset confirmation, hint confirmation/ad flow, onboarding blocks, Help overlay, leaving the level, solving the level, visibility loss, or scene shutdown — call `platformServices.gameplay.stop()`.
- On resume from an internal pause, call `gameplay.start()` only if gameplay can really resume.

The `game_api_pause` / `game_api_resume` events are special: Yandex automatically aligns GameplayAPI markup with these events. Their handlers pause/resume Dungeon Logic's timer and input but do not issue another explicit gameplay start/stop call. This avoids double-marking while still satisfying startup-ad, tab-switch, and purchase/ad pause behavior.

## Platform pause behavior

`GameScene` subscribes to `platformServices.lifecycle` when platform services are available and seeds its blocker from `platformServices.lifecycle.isPaused()`. The Yandex adapter itself starts listening as soon as SDK initialization completes, so a startup-ad pause cannot be lost between Boot and GameScene creation.

On platform pause:

- set a `platformPaused` blocker;
- disable board input;
- pause and sync active time without duplicating GameplayAPI markup;
- save the puzzle session and flush profile state best-effort.

On platform resume:

- clear the blocker;
- restore board input only if the puzzle is not solved and no modal/onboarding blocker is active;
- resume the active timer without duplicating GameplayAPI markup;
- refresh toolbar state.

`timerMayRun()` includes `!platformPaused`, so a resume event cannot accidentally restart gameplay while the platform still considers the game paused.

## Failure policy

All optional Yandex feature methods are feature-detected. Missing methods are treated as no-ops. Rejected readiness/gameplay calls are swallowed by the adapter after one warning-worthy failure boundary; they never prevent game navigation.

## Verification

`sanity:platform` must prove:

- local readiness/gameplay are safe no-ops and local language is `null`;
- Yandex language is exposed from `environment.i18n.lang`;
- Game Ready calls underlying `LoadingAPI.ready()` once even when invoked repeatedly;
- gameplay start/stop are idempotent transitions;
- lifecycle subscription still forwards and unsubscribes pause/resume events;
- existing cloud storage, trusted time, ads, and fallback behavior remain unchanged.

Add a focused pure `sanity:platform-gameplay` around the scene-facing activity coordinator so pause/resume semantics can be verified without constructing Phaser.
