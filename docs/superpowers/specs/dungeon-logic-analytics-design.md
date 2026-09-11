# Dungeon Logic — Release Analytics Design

**Date:** 2026-09-11  
**Status:** design approved in chat; written spec pending user review before implementation.

## 1. Goal

Add a small, reliable analytics layer for the first Yandex Games release so that post-launch decisions can be based on real player behavior rather than guesses.

The analytics must answer four product questions:

1. Where do players leave the tutorial and campaign funnel?
2. Which puzzles cause long solve times, resets, or hint use?
3. How often do players engage with Daily and how often do ranked Daily attempts complete?
4. How often are interstitial and rewarded ads actually requested and successfully shown/rewarded?

A second, deliberately small technical layer must reveal important recoverable platform failures such as profile persistence, Yandex SDK lifecycle calls, and leaderboard failures.

Analytics is observational only. A failure to initialize or send analytics must never block boot, gameplay, saving, ads, navigation, or completion.

## 2. Non-goals

The first release does **not** add:

- a general-purpose event bus;
- session replay / Webvisor;
- click heatmaps;
- analytics for every button press;
- raw exception messages or stack traces;
- player identifiers, names, leaderboard names, avatar URLs, or other personal data;
- a custom session-end event;
- an Endless analytics schema before Endless exists;
- a second analytics provider alongside Yandex Metrica.

Yandex Games' own dashboard remains the source for platform-level audience, play-time, monetization, and technical metrics. The custom layer exists for game-specific funnels and gameplay behavior.

## 3. Provider and enablement

### 3.1 Configuration

The Metrica counter id is supplied at build time through:

```text
VITE_YANDEX_METRICA_ID
```

The disabled/default value is `0`.

Analytics is enabled only when all of the following are true:

- `import.meta.env.PROD === true`;
- `VITE_YANDEX_METRICA_ID` parses to a positive integer;
- the Yandex Games SDK global is present (`window.YaGames?.init`), which identifies a production/test Yandex runtime rather than a plain local preview;
- the runtime analytics transport successfully installs or finds the Yandex Metrica global.

Local development, sanity tests, and a plain production preview outside the Yandex runtime must not send real telemetry even if a developer accidentally has a counter id in their shell environment.

### 3.2 Metrica bootstrap

The Metrica bootstrap is centralized. No scene or domain service may create the global `ym` function or inject Metrica scripts.

The bootstrap initializes the counter with Webvisor disabled. We do not enable click maps or collect arbitrary DOM interaction because Dungeon Logic already has explicit product events and most gameplay happens in Phaser canvas.

If bootstrap fails, analytics degrades to no-op behavior and logs at most one local console warning. Game boot continues.

### 3.3 No-op contract

Every analytics API call is safe when analytics is disabled. Callers never branch on whether analytics exists and never await analytics before progressing gameplay.

## 4. Architecture

### 4.1 `AnalyticsTransport`

New file:

```text
src/analytics/AnalyticsTransport.ts
```

Responsibility:

- define the minimal provider boundary;
- expose one operation: send a named goal with a flat, JSON-safe parameter object;
- provide a no-op implementation for tests/disabled analytics.

The transport does not know gameplay semantics.

Conceptual interface:

```ts
export interface AnalyticsTransport {
  sendGoal(name: AnalyticsGoalName, params: AnalyticsParams): void;
}
```

`sendGoal` is fire-and-forget. Transport exceptions are caught internally.

### 4.2 `YandexMetricaTransport`

New file:

```text
src/analytics/YandexMetricaTransport.ts
```

Responsibility:

- parse/validate the counter id;
- bootstrap or reuse Yandex Metrica;
- call `ym(counterId, 'reachGoal', goal, params)`;
- never throw into game code;
- expose disabled/no-op behavior when configuration is absent or invalid.

Only this file may refer to the Metrica global.

### 4.3 `AnalyticsService`

New file:

```text
src/analytics/AnalyticsService.ts
```

Responsibility:

- expose typed game-level methods rather than raw goal names;
- normalize numeric/string/boolean parameters;
- reject unknown or unsafe free-form payloads at compile time;
- deduplicate technical error codes once per page load;
- never throw;
- own the registry key used by Phaser scenes/services.

The intended public methods are:

```text
gameReady
screenView
puzzleStart
puzzleComplete
puzzleReset
hintUsed
tutorialComplete
interstitialResult
rewardedResult
techError
```

Scenes do **not** call `reachGoal` directly.

### 4.4 `PuzzleAnalyticsSession`

New file:

```text
src/analytics/PuzzleAnalyticsSession.ts
```

Responsibility:

- represent one playable puzzle attempt inside `GameScene`;
- remember mode, puzzle id, slot/date metadata, and attempt kind;
- remember hints granted during this attempt;
- prevent duplicate `puzzle_start` and `puzzle_complete` emission from scene redraws/restarts;
- provide elapsed-time and reset payloads without making `GameScene` manage analytics bookkeeping manually.

This object is runtime-only and never persists to the player profile.

### 4.5 Boot ownership

`BootScene` creates `AnalyticsService` before resolving Yandex platform services and stores it in Phaser Registry under a new constant registry key.

Creating analytics before platform resolution allows Yandex SDK initialization failure to be recorded when a production counter exists.

After platform resolution and profile initialization, `BootScene` emits exactly one `game_ready` event for that page load.

`game_ready` parameters:

```text
platform: local | yandex
language: ru | en
tutorial_completed: boolean
campaign_completed_count: integer
```

`game_ready` is not emitted for a boot path that fatally fails before a usable profile exists. Normal analytics failures must never make boot fatal.

## 5. Exact event contract

All event names are stable release contracts. Renaming an event after launch creates a new time series and therefore requires an explicit analytics migration decision.

### 5.1 `game_ready`

Sent once per page load after:

- platform selection has completed;
- the player profile has loaded or fallen back to a fresh usable profile;
- core services have been created.

Parameters:

```text
platform
language
tutorial_completed
campaign_completed_count
```

### 5.2 `screen_view`

Sent when a meta scene becomes active and usable.

Allowed `screen` values for v1:

```text
home
levels
daily
statistics
leaderboard
settings
help
```

`GameScene` does not emit `screen_view`; puzzle events describe gameplay navigation.

A scene re-created after leaving it may emit a new `screen_view`. Internal redraws/resizes must not.

### 5.3 `puzzle_start`

Sent once when a **playable attempt** begins.

Common parameters:

```text
mode: campaign | tutorial | daily
puzzle_id: stable content id
attempt: new | resume | replay
```

Campaign adds:

```text
slot: integer
```

Daily adds:

```text
ranked: boolean
archive: boolean
date_key: YYYY-MM-DD
```

A completed campaign level opened in read-only completed-review mode does **not** emit `puzzle_start`.

#### Attempt semantics

`new`:

- no compatible saved draft existed for this playable attempt;
- it is not an explicit replay of an already completed puzzle.

`resume`:

- a compatible non-completed saved puzzle snapshot existed at launch.

`replay`:

- the player explicitly resets/restarts an already completed puzzle and begins a fresh playable attempt.

The replay reason is runtime launch metadata only. It is not written to the player profile. Campaign completed-review → Reset must set this metadata explicitly. A tutorial level that is already present in `tutorial.completedLevelIds` and is deliberately launched as playable is also classified as `replay` even if no special launch flag was needed. Solved Daily entries remain non-playable review/completion states and do not create replay attempts in v1.

### 5.4 `puzzle_complete`

Sent once after the game has accepted a solved puzzle through the relevant campaign/tutorial/daily completion service.

Common parameters:

```text
mode
puzzle_id
attempt
time_sec
hints_used
first_clear
persisted
```

`time_sec` is a non-negative integer derived from the game's authoritative attempt timing and rounded down to seconds.

`hints_used` is the number of hints actually granted in this attempt.

`first_clear` means the completion changed this puzzle from unsolved to solved in the relevant progression state. Replays do not improve the first-clear funnel. For campaign/tutorial, the analytics session captures the pre-completion solved state when the attempt begins; for Daily, `DailyCompletionResult.wasFirstSolve` is authoritative.

`persisted` reports the completion service result. A solved puzzle whose profile flush failed still emits `puzzle_complete` with `persisted=false`.

Campaign adds:

```text
slot
```

Daily adds:

```text
ranked
archive
date_key
```

If persistence fails, the associated stable technical error is also emitted through `tech_error`; analytics does not pretend the player failed to solve the puzzle.

### 5.5 `puzzle_reset`

Sent only after the player confirms and the game actually resets an **unfinished playable attempt**.

Parameters:

```text
mode
puzzle_id
time_sec
edits_before_reset
```

Campaign also includes `slot`; Daily includes `ranked`, `archive`, and `date_key` when applicable.

Opening a reset confirmation does not count.

Resetting a completed campaign level in order to replay it does not count as `puzzle_reset`; that action begins a new `puzzle_start` with `attempt=replay`.

`edits_before_reset` is the number of editable board cells whose current state differs from the initial unknown state at the moment reset is confirmed. It is not a raw pointer/click count.

### 5.6 `hint_used`

Sent only when a hint is actually granted to the player.

Parameters:

```text
mode
puzzle_id
source: free | rewarded
hints_used_in_attempt
```

Campaign adds `slot`; Daily adds `ranked`, `archive`, and `date_key` where applicable.

Clicking the Hint button, opening the confirmation dialog, requesting an ad, or closing a rewarded ad without reward does not emit `hint_used`.

### 5.7 `tutorial_complete`

Sent exactly once when the final tutorial puzzle changes tutorial progression from incomplete to complete.

No duplicate is sent when replaying tutorial content after tutorial completion.

No total tutorial duration is introduced in v1 because tutorial progression is already observable through `puzzle_start` and `puzzle_complete`.

### 5.8 `ad_interstitial_result`

Sent only when `MonetizationService` actually reaches the point of requesting an interstitial from `AdsPort`.

Parameters:

```text
result: shown | skipped | unavailable
context: campaign_next
completed_slot: integer
```

An interstitial opportunity blocked by the first-five-level rule, the two-completions rule, or cooldown does not emit an ad-result event because no ad request occurred.

If `AdsPort.showInterstitial()` throws instead of returning a normal result, emit:

```text
ad_interstitial_result: result=unavailable
```

and one deduplicated technical error code for the thrown request failure.

### 5.9 `ad_rewarded_result`

Sent after each real rewarded-hint ad request.

Parameters:

```text
result: rewarded | closed | unavailable
context: hint
mode
puzzle_id
```

Campaign adds `slot`; Daily adds `ranked`, `archive`, and `date_key` where applicable.

A rewarded result of `rewarded` does not by itself mean a hint was delivered. `hint_used source=rewarded` is emitted only after the game actually grants the hint.

If the ad call throws, normalize the business result to `unavailable` and emit a deduplicated ad-request technical error.

### 5.10 `tech_error`

This is the only technical event in v1.

Parameters:

```text
code: stable enumerated error code
area: stable subsystem name
```

Optional safe context may include:

```text
mode
puzzle_id
```

Never include:

- `Error.message`;
- stack traces;
- arbitrary SDK error objects;
- player id/name;
- leaderboard extraData;
- URLs containing query strings;
- save/profile JSON.

Each distinct `code` is sent at most once per page load. The console may still log repeated errors for debugging.

Initial stable codes:

```text
platform_init_failed
profile_load_failed
profile_save_failed
readiness_failed
gameplay_api_failed
leaderboard_submit_failed
leaderboard_load_failed
interstitial_request_failed
rewarded_request_failed
```

`area` values are stable coarse labels such as `platform`, `profile`, `lifecycle`, `leaderboard`, and `ads`.

A failure of Metrica itself cannot reliably be reported through the same unavailable provider. Metrica/bootstrap failures are therefore console-only and cause analytics to become no-op; they are not represented as remote `tech_error` goals.

## 6. Integration points in the current codebase

### 6.1 `BootScene.ts`

Changes:

- create/register `AnalyticsService` before platform resolution;
- pass a narrow technical-error reporter callback into platform bootstrap where required;
- emit `game_ready` after profile/services are usable;
- no analytics call is awaited before scene navigation.

### 6.2 Meta scenes

Files:

```text
src/scenes/HomeScene.ts
src/scenes/LevelSelectScene.ts
src/scenes/DailyScene.ts
src/scenes/StatsScene.ts
src/scenes/LeaderboardScene.ts
src/scenes/SettingsScene.ts
src/scenes/HelpScene.ts
```

Each scene emits one typed `screenView(...)` from `create()` after obtaining the registered analytics service.

No component-level UI analytics is added.

### 6.3 `GameScene.ts`

Changes are limited to lifecycle integration:

- create one `PuzzleAnalyticsSession` after the actual play state/draft state is resolved;
- skip session creation for campaign completed-review mode and dev mode;
- emit start once;
- increment hint count only when a hint is granted;
- emit real unfinished reset only after confirmed reset succeeds;
- emit completion after the corresponding service returns a completion result;
- emit tutorial completion only when tutorial state transitions to completed;
- pass puzzle context into rewarded monetization calls;
- carry explicit `replay` runtime metadata when a completed-review reset transitions into playable mode.

Analytics does not become the source of truth for puzzle state, timing, hints, or progression. It reads those values from the existing systems.

### 6.4 `GameSceneData` runtime launch metadata

`GameLaunchContext` gains a small optional runtime analytics field or equivalent dedicated launch field that can preserve explicit replay intent across `scene.restart`.

This field:

- must not be persisted;
- must not change content ids;
- must not alter campaign unlocking or puzzle session serialization;
- exists only to distinguish `replay` from a normal fresh launch.

Existing draft compatibility remains the source for detecting `resume`.

### 6.5 `MonetizationService.ts`

`MonetizationService.create(...)` gains an analytics dependency plus the current puzzle/ad context needed for rewarded hints.

Responsibilities added:

- emit `ad_rewarded_result` after a rewarded request resolves/normalizes;
- emit `ad_interstitial_result` after an eligible campaign interstitial request resolves/normalizes;
- report thrown ad-request failures through the technical reporter;
- preserve all current eligibility/cooldown/profile behavior exactly.

No event is emitted for a policy-rejected interstitial opportunity.

### 6.6 Profile storage and persistence failures

`PlatformPlayerProfileStorage` and/or the narrow persistence boundary receive a technical error reporter callback.

Report:

- failed platform profile load as `profile_load_failed`;
- failed platform save/promote as `profile_save_failed`.

The existing fallback/migration behavior remains unchanged.

`PlayerProfileService` delayed flush failures are also reported using the same stable save code; deduplication prevents event spam.

### 6.7 Yandex platform adapter

The Yandex adapter receives an optional narrow technical error reporter rather than importing `AnalyticsService` directly.

It reports only failures it already catches and swallows:

- SDK init;
- LoadingAPI ready;
- GameplayAPI start/stop;
- leaderboard submission/load.

The platform layer remains usable without analytics.

## 7. Privacy and data-shape rules

Event parameters must be primitives only:

```text
string | number | boolean
```

No nested profile objects or serialized board states are sent.

Stable content ids such as `campaign-012`, tutorial ids, and Daily content/date ids are allowed because they identify game content, not the player.

Timing is sent as coarse integer seconds for puzzle analytics. Millisecond precision is unnecessary for product decisions and creates noisier cardinality.

No exact device fingerprint, IP-derived data, account id, Yandex player unique id, public name, or avatar is supplied by our custom events.

## 8. Failure handling

Analytics is a one-way side effect after or alongside authoritative game actions.

Rules:

1. Gameplay never awaits analytics network completion.
2. Analytics exceptions are swallowed inside the analytics layer.
3. Provider/bootstrap failure switches the service to no-op behavior.
4. A failed analytics send never retries in a loop and never writes to player save data.
5. Technical error dedupe is in-memory only and resets on page reload.
6. Existing console warnings remain available for local debugging.

## 9. Testing strategy

### 9.1 New analytics sanity

Add:

```text
src/dev/analyticsSanity.ts
```

and package script:

```text
sanity:analytics
```

The sanity uses a fake transport and proves:

- disabled/no-op transport never throws;
- goal names and parameter shapes are exact;
- `game_ready` is emitted once;
- screen redraw/resizing cannot duplicate `screen_view` through analytics helpers;
- `new`, `resume`, and `replay` classification is deterministic;
- completed-review does not create a playable puzzle start;
- puzzle start/complete are emitted at most once per analytics session;
- first clear and replay completion remain distinguishable;
- free and rewarded hints emit only after grant;
- closed/unavailable rewarded ads never emit `hint_used`;
- policy-rejected interstitials emit no ad-result event;
- requested interstitials normalize all results;
- technical errors deduplicate by code;
- technical payload cannot accept raw `Error` data.

### 9.2 Existing regression suites

Implementation must re-run at minimum:

```text
sanity:analytics
sanity:campaign
sanity:campaign-runtime
sanity:campaign-playstate
sanity:puzzle-session
sanity:tutorial
sanity:daily
sanity:daily-drafts
sanity:daily-leaderboard
sanity:monetization
sanity:rewarded-hint
sanity:platform
sanity:platform-gameplay
sanity:feature-unlock
sanity:release
```

The existing known environment/build issue around unavailable local TypeScript/Vite type dependencies must be reported separately if still present; it must not be confused with analytics regressions.

## 10. Release setup after implementation

Code implementation does not require a real counter id.

Before public release:

1. Create a Yandex Metrica counter for Dungeon Logic.
2. Configure the counter so Yandex Games hosting domains are accepted; do not rely on a restrictive single-site host allowlist.
3. Keep Webvisor disabled.
4. Put the numeric counter id into the production build environment as `VITE_YANDEX_METRICA_ID`.
5. Build the production package.
6. Run the game in the Yandex Games test environment.
7. Verify at least these live goals arrive in Metrica: `game_ready`, `screen_view`, `puzzle_start`, `puzzle_complete`, `hint_used`, and one ad-result event if test ads are available.
8. Confirm local/dev builds still send no production analytics.

## 11. Definition of done

Analytics implementation is complete only when:

- all custom telemetry goes through `AnalyticsService`;
- no gameplay/meta scene contains raw `ym(...)` calls;
- a build with counter id `0` behaves exactly like the pre-analytics game;
- campaign completed-review does not inflate starts;
- replay/resume/new are distinguishable;
- completion is recorded even when persistence fails;
- rewarded hint telemetry distinguishes ad reward from actual hint grant;
- interstitial telemetry represents only real ad requests;
- technical errors are stable, privacy-safe, and deduplicated;
- existing monetization, campaign, tutorial, Daily, platform, and save semantics are unchanged;
- analytics sanity and affected regression sanities pass.

## 12. Explicitly deferred decisions

After the first real player cohort, data may justify adding:

- a small set of funnel goals configured directly in the Metrica UI;
- content-version/build-version parameters if comparing multiple live content revisions becomes necessary;
- additional Daily retention events;
- Endless analytics if Endless is implemented;
- a second analytics provider only if Metrica proves insufficient.

None of these are required for first release.
