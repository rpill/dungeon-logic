# Dungeon Logic Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add release-ready Yandex Metrica gameplay analytics and compact technical telemetry without changing campaign, tutorial, Daily, hint, ad, save, or navigation behavior.

**Architecture:** All gameplay code talks to one typed `AnalyticsService`; only `YandexMetricaTransport` knows about `ym(...)`. `PuzzleAnalyticsSession` owns one attempt's start/complete/reset/hint emission and prevents duplicates. Platform/profile layers receive a narrow technical-error reporter callback rather than importing the analytics service itself.

**Tech Stack:** TypeScript, Phaser 3, Vite, Yandex Games SDK, Yandex Metrica `reachGoal`, existing `tsx` sanity scripts.

**Spec:** `docs/superpowers/specs/2026-09-11-dungeon-logic-analytics-design.md`

## Global Constraints

- Analytics is observational only; no analytics failure may block boot, gameplay, saving, ads, navigation, or completion.
- Real telemetry is enabled only when `import.meta.env.PROD === true`, `VITE_YANDEX_METRICA_ID` is a positive integer, `window.YaGames?.init` exists, and the Metrica transport can install/reuse `ym`.
- Default/disabled counter id is `0`; local development and plain production preview outside Yandex send no real telemetry.
- Webvisor, click maps, arbitrary DOM click tracking, session replay, and custom `session_end` are not added.
- Custom payload values are primitive `string | number | boolean` only; no player ids/names, avatar URLs, profile JSON, error messages, stack traces, query-string URLs, or leaderboard `extraData` are sent.
- Event names are stable v1 contracts: `game_ready`, `screen_view`, `puzzle_start`, `puzzle_complete`, `puzzle_reset`, `hint_used`, `tutorial_complete`, `ad_interstitial_result`, `ad_rewarded_result`, `tech_error`.
- Campaign completed-review emits no `puzzle_start`; resetting completed campaign review begins `attempt=replay`.
- Solved Daily remains playable practice; opening it emits `attempt=replay`, and repeated completion has `first_clear=false`.
- Daily `new/resume/replay` must be classified in `DailyService.beginDaily()` before that method creates a new draft.
- `puzzle_complete` is emitted even when persistence fails, with `persisted=false` plus deduplicated `profile_save_failed` telemetry.
- `hint_used` is emitted only after a hint is actually delivered; rewarded-ad completion and hint delivery remain separate events.
- Interstitial analytics is emitted only for an actual ad-port request, never for a policy/cooldown rejection.
- Technical errors deduplicate by stable `code` once per page load.
- The implementation must preserve the current 5-level interstitial protection, 2-completion cadence, 4-minute cooldown, 3 free hints, 30-minute recharge, Daily ranking rules, and current persistence semantics.

---

## File Structure

### New files

- `src/analytics/AnalyticsTransport.ts` — primitive payload types, stable goal union, transport interface, no-op transport.
- `src/analytics/AnalyticsService.ts` — typed game-level analytics API, payload normalization, `game_ready` and tech-error dedupe, registry key.
- `src/analytics/PuzzleAnalyticsSession.ts` — one playable-attempt lifecycle and deterministic attempt classifier.
- `src/analytics/YandexMetricaTransport.ts` — counter validation, Yandex-runtime gate, queued `ym` bootstrap, `reachGoal` calls, fail-closed/no-op behavior.
- `src/dev/analyticsSanity.ts` — fake-transport behavioral sanity for event contracts and dedupe.

### Existing files changed

- `src/scenes/BootScene.ts` — create/register analytics before platform resolution; inject technical reporter; emit `game_ready`.
- `src/scenes/HomeScene.ts`
- `src/scenes/LevelSelectScene.ts`
- `src/scenes/DailyScene.ts`
- `src/scenes/StatsScene.ts`
- `src/scenes/LeaderboardScene.ts`
- `src/scenes/SettingsScene.ts`
- `src/scenes/HelpScene.ts` — one `screen_view` per scene activation.
- `src/campaign/types.ts` — runtime-only optional analytics attempt marker in `GameSceneData` contexts.
- `src/daily/DailyService.ts` — classify Daily launch as `new/resume/replay` before draft creation.
- `src/runtime/GameLaunch.ts` — carry Daily attempt marker; helper for campaign replay launch data.
- `src/gameplay/HintService.ts` — deliver hint source (`free` or `rewarded`) with the granted hint.
- `src/scenes/GameScene.ts` — create attempt session; emit start/reset/hint/complete/tutorial-complete; pass ad context.
- `src/monetization/MonetizationService.ts` — emit actual ad-request results and ad-request technical failures.
- `src/profile/PlatformPlayerProfileStorage.ts` — report swallowed platform load/promote failures.
- `src/profile/PlayerProfileService.ts` — report load/save failures including delayed flushes.
- `src/platform/PlatformRegistry.ts` — optional reporter for factory failure fallback.
- `src/platform/yandex.ts` — report caught SDK/readiness/gameplay/leaderboard/ad request failures.
- `src/dev/monetizationSanity.ts`
- `src/dev/platformSanity.ts`
- `src/dev/rewardedHintSanity.ts`
- `src/dev/dailySanity.ts`
- `src/dev/campaignPlayStateSanity.ts` or `src/dev/campaignRuntimeSanity.ts` — affected regression assertions.
- `package.json` — `sanity:analytics` script.
- `TECH.md` — analytics architecture and production counter setup.
- `PROJECT.md` — release analytics contract summary.

---

### Task 1: Core analytics contracts and attempt session

**Files:**
- Create: `src/analytics/AnalyticsTransport.ts`
- Create: `src/analytics/AnalyticsService.ts`
- Create: `src/analytics/PuzzleAnalyticsSession.ts`
- Create: `src/dev/analyticsSanity.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `AnalyticsTransport`, `AnalyticsGoalName`, `AnalyticsParams`, `NOOP_ANALYTICS_TRANSPORT`.
- Produces `AnalyticsService`, `ANALYTICS_SERVICE_REGISTRY_KEY`, `AnalyticsPuzzleContext`, `PuzzleAttemptKind`, `HintAnalyticsSource`, `TechnicalErrorReporter`.
- Produces `classifyPuzzleAttempt(...)` and `PuzzleAnalyticsSession` for later GameScene integration.

- [ ] **Step 1: Add the failing analytics sanity for exact event names, shapes, dedupe, and attempt classification**

Create `src/dev/analyticsSanity.ts` with a recording transport and assertions covering the contract before production files exist:

```ts
import type {
  AnalyticsGoalName,
  AnalyticsParams,
  AnalyticsTransport,
} from '../analytics/AnalyticsTransport';
import {
  AnalyticsService,
  type AnalyticsPuzzleContext,
} from '../analytics/AnalyticsService';
import {
  PuzzleAnalyticsSession,
  classifyPuzzleAttempt,
} from '../analytics/PuzzleAnalyticsSession';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class RecordingTransport implements AnalyticsTransport {
  readonly events: Array<{ name: AnalyticsGoalName; params: AnalyticsParams }> = [];
  sendGoal(name: AnalyticsGoalName, params: AnalyticsParams): void {
    this.events.push({ name, params });
  }
}

const campaign: AnalyticsPuzzleContext = {
  mode: 'campaign',
  puzzleId: 'campaign-006',
  slot: 6,
};

const daily: AnalyticsPuzzleContext = {
  mode: 'daily',
  puzzleId: 'daily-2026-09-11',
  dateKey: '2026-09-11',
  ranked: true,
  archive: false,
};

const transport = new RecordingTransport();
const analytics = new AnalyticsService(transport);

analytics.gameReady({
  platform: 'yandex',
  language: 'ru',
  tutorialCompleted: true,
  campaignCompletedCount: 5,
});
analytics.gameReady({
  platform: 'yandex',
  language: 'ru',
  tutorialCompleted: true,
  campaignCompletedCount: 5,
});
assert(transport.events.filter((event) => event.name === 'game_ready').length === 1, 'game_ready deduplicates per page load.');

analytics.screenView('home');
assert(transport.events.at(-1)?.name === 'screen_view', 'screen_view uses the stable goal name.');
assert(transport.events.at(-1)?.params.screen === 'home', 'screen_view sends the stable screen key.');

assert(classifyPuzzleAttempt({ explicitReplay: true, hasCompatibleDraft: true, alreadySolved: true }) === 'replay', 'Explicit campaign replay wins.');
assert(classifyPuzzleAttempt({ explicitReplay: false, hasCompatibleDraft: true, alreadySolved: true }) === 'resume', 'Reloading an in-progress replay resumes the draft.');
assert(classifyPuzzleAttempt({ explicitReplay: false, hasCompatibleDraft: false, alreadySolved: true }) === 'replay', 'Solved playable content without a draft is replay.');
assert(classifyPuzzleAttempt({ explicitReplay: false, hasCompatibleDraft: false, alreadySolved: false }) === 'new', 'Fresh content is new.');

const session = new PuzzleAnalyticsSession(analytics, campaign, 'new');
session.start();
session.start();
session.hintGranted('free', 1);
session.reset(12_999, 4);
session.complete({ elapsedMs: 20_250, hintsUsed: 1, firstClear: true, persisted: false });
session.complete({ elapsedMs: 21_000, hintsUsed: 1, firstClear: true, persisted: true });
assert(transport.events.filter((event) => event.name === 'puzzle_start').length === 1, 'Puzzle start emits once per session.');
assert(transport.events.filter((event) => event.name === 'puzzle_complete').length === 1, 'Puzzle completion emits once per session.');
const complete = transport.events.find((event) => event.name === 'puzzle_complete');
assert(complete?.params.time_sec === 20, 'Puzzle time is floored to integer seconds.');
assert(complete?.params.persisted === false, 'Completion records failed persistence without dropping the solve.');

const replay = new PuzzleAnalyticsSession(analytics, daily, 'replay');
replay.start();
replay.complete({ elapsedMs: 4_100, hintsUsed: 0, firstClear: false, persisted: true });
const replayComplete = transport.events.filter((event) => event.name === 'puzzle_complete').at(-1);
assert(replayComplete?.params.attempt === 'replay', 'Daily practice completion stays replay.');
assert(replayComplete?.params.first_clear === false, 'Daily practice does not inflate first-clear funnel.');

analytics.techError('profile_save_failed', 'profile');
analytics.techError('profile_save_failed', 'profile');
assert(transport.events.filter((event) => event.name === 'tech_error' && event.params.code === 'profile_save_failed').length === 1, 'Technical error codes deduplicate per page load.');

console.log('Analytics sanity: PASS');
```

Also add to `package.json`:

```json
"sanity:analytics": "tsx src/dev/analyticsSanity.ts"
```

- [ ] **Step 2: Run the new sanity and verify RED**

Run:

```bash
npm run sanity:analytics
```

Expected: FAIL because `src/analytics/AnalyticsTransport.ts`, `AnalyticsService.ts`, and `PuzzleAnalyticsSession.ts` do not exist yet.

- [ ] **Step 3: Implement the provider-neutral transport contract**

Create `src/analytics/AnalyticsTransport.ts`:

```ts
export type AnalyticsPrimitive = string | number | boolean;
export type AnalyticsParams = Readonly<Record<string, AnalyticsPrimitive>>;

export type AnalyticsGoalName =
  | 'game_ready'
  | 'screen_view'
  | 'puzzle_start'
  | 'puzzle_complete'
  | 'puzzle_reset'
  | 'hint_used'
  | 'tutorial_complete'
  | 'ad_interstitial_result'
  | 'ad_rewarded_result'
  | 'tech_error';

export interface AnalyticsTransport {
  sendGoal(name: AnalyticsGoalName, params: AnalyticsParams): void;
}

export const NOOP_ANALYTICS_TRANSPORT: AnalyticsTransport = {
  sendGoal() {},
};
```

- [ ] **Step 4: Implement the typed game-level API and stable reporter types**

Create `src/analytics/AnalyticsService.ts` with these exported contracts:

```ts
import type { SupportedLanguage } from '../i18n/Language';
import type { InterstitialResult, RewardedResult } from '../platform/services';
import type {
  AnalyticsGoalName,
  AnalyticsParams,
  AnalyticsTransport,
} from './AnalyticsTransport';

export const ANALYTICS_SERVICE_REGISTRY_KEY = 'analytics-service';

export type AnalyticsScreen =
  | 'home'
  | 'levels'
  | 'daily'
  | 'statistics'
  | 'leaderboard'
  | 'settings'
  | 'help';

export type PuzzleAttemptKind = 'new' | 'resume' | 'replay';
export type HintAnalyticsSource = 'free' | 'rewarded';

export type AnalyticsPuzzleContext =
  | { readonly mode: 'campaign'; readonly puzzleId: string; readonly slot: number }
  | { readonly mode: 'tutorial'; readonly puzzleId: string }
  | {
      readonly mode: 'daily';
      readonly puzzleId: string;
      readonly dateKey: string;
      readonly ranked: boolean;
      readonly archive: boolean;
    };

export type TechnicalErrorCode =
  | 'platform_init_failed'
  | 'profile_load_failed'
  | 'profile_save_failed'
  | 'readiness_failed'
  | 'gameplay_api_failed'
  | 'leaderboard_submit_failed'
  | 'leaderboard_load_failed'
  | 'interstitial_request_failed'
  | 'rewarded_request_failed';

export type TechnicalErrorArea = 'platform' | 'profile' | 'lifecycle' | 'leaderboard' | 'ads';
export type TechnicalErrorContext = Readonly<Pick<AnalyticsPuzzleContext, 'mode' | 'puzzleId'>>;
export type TechnicalErrorReporter = (
  code: TechnicalErrorCode,
  area: TechnicalErrorArea,
  context?: TechnicalErrorContext,
) => void;
```

Implement `AnalyticsService` so every public method is `void`, wraps transport calls in `try/catch`, converts camelCase API arguments to the exact snake_case goal parameters, floors milliseconds to non-negative integer seconds, and keeps two in-memory dedupe states: one boolean for `game_ready`, one `Set<TechnicalErrorCode>` for `tech_error`.

The exact public methods are:

```ts
constructor(transport: AnalyticsTransport)
gameReady(input: { platform: 'local' | 'yandex'; language: SupportedLanguage; tutorialCompleted: boolean; campaignCompletedCount: number }): void
screenView(screen: AnalyticsScreen): void
puzzleStart(context: AnalyticsPuzzleContext, attempt: PuzzleAttemptKind): void
puzzleComplete(context: AnalyticsPuzzleContext, input: { attempt: PuzzleAttemptKind; elapsedMs: number; hintsUsed: number; firstClear: boolean; persisted: boolean }): void
puzzleReset(context: AnalyticsPuzzleContext, input: { elapsedMs: number; editsBeforeReset: number }): void
hintUsed(context: AnalyticsPuzzleContext, source: HintAnalyticsSource, hintsUsedInAttempt: number): void
tutorialComplete(): void
interstitialResult(result: InterstitialResult, completedSlot: number): void
rewardedResult(result: RewardedResult, context: AnalyticsPuzzleContext): void
techError(code: TechnicalErrorCode, area: TechnicalErrorArea, context?: TechnicalErrorContext): void
```

Use a private context flattener with exact keys:

```ts
function puzzleParams(context: AnalyticsPuzzleContext): AnalyticsParams {
  if (context.mode === 'campaign') {
    return { mode: 'campaign', puzzle_id: context.puzzleId, slot: context.slot };
  }
  if (context.mode === 'tutorial') {
    return { mode: 'tutorial', puzzle_id: context.puzzleId };
  }
  return {
    mode: 'daily',
    puzzle_id: context.puzzleId,
    ranked: context.ranked,
    archive: context.archive,
    date_key: context.dateKey,
  };
}
```

`interstitialResult()` always sends `{ result, context: 'campaign_next', completed_slot }`. `rewardedResult()` always sends `{ ...puzzleParams(context), result, context: 'hint' }`. `techError()` sends only `{ code, area }` plus optional `mode` and `puzzle_id`; it accepts no `Error` object or arbitrary payload.

- [ ] **Step 5: Implement deterministic attempt classification and one-attempt emission guard**

Create `src/analytics/PuzzleAnalyticsSession.ts`:

```ts
import type {
  AnalyticsPuzzleContext,
  AnalyticsService,
  HintAnalyticsSource,
  PuzzleAttemptKind,
} from './AnalyticsService';

export function classifyPuzzleAttempt(input: {
  readonly explicitReplay: boolean;
  readonly hasCompatibleDraft: boolean;
  readonly alreadySolved: boolean;
}): PuzzleAttemptKind {
  if (input.explicitReplay) return 'replay';
  if (input.hasCompatibleDraft) return 'resume';
  if (input.alreadySolved) return 'replay';
  return 'new';
}

export class PuzzleAnalyticsSession {
  private started = false;
  private completed = false;

  constructor(
    private readonly analytics: AnalyticsService,
    readonly context: AnalyticsPuzzleContext,
    readonly attempt: PuzzleAttemptKind,
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.analytics.puzzleStart(this.context, this.attempt);
  }

  hintGranted(source: HintAnalyticsSource, hintsUsedInAttempt: number): void {
    if (this.completed) return;
    this.analytics.hintUsed(this.context, source, hintsUsedInAttempt);
  }

  reset(elapsedMs: number, editsBeforeReset: number): void {
    if (this.completed) return;
    this.analytics.puzzleReset(this.context, { elapsedMs, editsBeforeReset });
  }

  complete(input: {
    readonly elapsedMs: number;
    readonly hintsUsed: number;
    readonly firstClear: boolean;
    readonly persisted: boolean;
  }): void {
    if (this.completed) return;
    this.completed = true;
    this.analytics.puzzleComplete(this.context, { attempt: this.attempt, ...input });
  }
}
```

- [ ] **Step 6: Run analytics sanity and verify GREEN**

Run:

```bash
npm run sanity:analytics
```

Expected: `Analytics sanity: PASS`.

- [ ] **Step 7: Commit the provider-neutral core**

```bash
git add src/analytics/AnalyticsTransport.ts src/analytics/AnalyticsService.ts src/analytics/PuzzleAnalyticsSession.ts src/dev/analyticsSanity.ts package.json
git commit -m "feat: add typed analytics core"
```

---

### Task 2: Yandex Metrica transport and safe bootstrap

**Files:**
- Create: `src/analytics/YandexMetricaTransport.ts`
- Modify: `src/dev/analyticsSanity.ts`

**Interfaces:**
- Consumes: `AnalyticsTransport` from Task 1.
- Produces: `createYandexMetricaTransport(options)` used by `BootScene` in Task 3.

- [ ] **Step 1: Extend analytics sanity with disabled/runtime/bootstrap cases**

Add fake globals/document helpers to `src/dev/analyticsSanity.ts` and assert all four gates:

```ts
import { createYandexMetricaTransport } from '../analytics/YandexMetricaTransport';

const disabledByMode = createYandexMetricaTransport({
  prod: false,
  counterId: '123456',
  globals: { YaGames: { init() {} } },
  document: null,
});
disabledByMode.sendGoal('screen_view', { screen: 'home' });

const disabledByCounter = createYandexMetricaTransport({
  prod: true,
  counterId: '0',
  globals: { YaGames: { init() {} } },
  document: null,
});
disabledByCounter.sendGoal('screen_view', { screen: 'home' });

const disabledOutsideYandex = createYandexMetricaTransport({
  prod: true,
  counterId: '123456',
  globals: {},
  document: null,
});
disabledOutsideYandex.sendGoal('screen_view', { screen: 'home' });
```

Then use a fake document with `head.appendChild()` plus fake globals to prove enabled transport installs one script, initializes one counter, and sends:

```ts
[
  123456,
  'reachGoal',
  'screen_view',
  { screen: 'home' },
]
```

Also call `sendGoal()` with a fake `ym` that throws and assert the call itself does not throw.

- [ ] **Step 2: Run analytics sanity and verify RED**

```bash
npm run sanity:analytics
```

Expected: FAIL because `YandexMetricaTransport.ts` does not exist.

- [ ] **Step 3: Implement the Metrica runtime gate and queued bootstrap**

Create `src/analytics/YandexMetricaTransport.ts` with a testable options interface:

```ts
import {
  NOOP_ANALYTICS_TRANSPORT,
  type AnalyticsTransport,
} from './AnalyticsTransport';

interface MetricaGlobalsLike {
  YaGames?: { init?: unknown };
  ym?: MetricaFunction;
}

type MetricaFunction = ((...args: unknown[]) => void) & {
  a?: readonly unknown[];
  l?: number;
};

export interface YandexMetricaTransportOptions {
  readonly prod: boolean;
  readonly counterId: string | undefined;
  readonly globals?: MetricaGlobalsLike;
  readonly document?: Document | null;
}
```

Counter parsing must be exact:

```ts
function parseCounterId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
```

Enable only when `prod`, positive counter, `typeof globals.YaGames?.init === 'function'`, and a document exists. Otherwise return `NOOP_ANALYTICS_TRANSPORT`.

If `globals.ym` is absent, install a standard queueing stub before injecting the script:

```ts
const queue = ((...args: unknown[]) => {
  queue.a = [...(queue.a ?? []), args];
}) as MetricaFunction;
queue.a = [];
queue.l = Date.now();
globals.ym = queue;
```

Append exactly one async script with:

```ts
script.src = 'https://mc.yandex.ru/metrika/tag.js';
script.async = true;
```

Keep an internal `disabled` boolean. Attach `script.onerror` so a failed network bootstrap sets `disabled = true` and calls a local `warnOnce(...)`; never emit remote `tech_error` for Metrica's own failure. Wrap `createElement`, `appendChild`, and the initial `ym(..., 'init', ...)` call in `try/catch`; any synchronous bootstrap exception also returns/degrades to no-op behavior.

Initialize once with Webvisor/click maps disabled:

```ts
globals.ym(counterId, 'init', {
  clickmap: false,
  trackLinks: false,
  accurateTrackBounce: true,
  webvisor: false,
});
```

Return a transport whose `sendGoal()` does only:

```ts
if (disabled) return;
try {
  globals.ym?.(counterId, 'reachGoal', name, params);
} catch (error) {
  disabled = true;
  warnOnce(error);
}
```

`warnOnce` may log one local warning but must never call `tech_error` through the broken provider.

- [ ] **Step 4: Run analytics sanity and verify GREEN**

```bash
npm run sanity:analytics
```

Expected: `Analytics sanity: PASS`.

- [ ] **Step 5: Commit the provider adapter**

```bash
git add src/analytics/YandexMetricaTransport.ts src/dev/analyticsSanity.ts
git commit -m "feat: add yandex metrica transport"
```

---

### Task 3: Boot ownership, game_ready, and meta screen views

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/HomeScene.ts`
- Modify: `src/scenes/LevelSelectScene.ts`
- Modify: `src/scenes/DailyScene.ts`
- Modify: `src/scenes/StatsScene.ts`
- Modify: `src/scenes/LeaderboardScene.ts`
- Modify: `src/scenes/SettingsScene.ts`
- Modify: `src/scenes/HelpScene.ts`
- Modify: `src/dev/analyticsSanity.ts`

**Interfaces:**
- Consumes: `AnalyticsService`, registry key, Metrica transport.
- Produces: one registered service for every runtime path; `game_ready` and `screen_view` integration.

- [ ] **Step 1: Add static integration assertions before touching scenes**

In `analyticsSanity.ts`, use `readFileSync` for the eight scene files and assert:

```ts
const bootSource = readFileSync(new URL('../scenes/BootScene.ts', import.meta.url), 'utf8');
assert(bootSource.includes('ANALYTICS_SERVICE_REGISTRY_KEY'), 'Boot registers analytics.');
assert(bootSource.includes('.gameReady('), 'Boot emits game_ready after profile setup.');

for (const [file, screen] of [
  ['HomeScene.ts', 'home'],
  ['LevelSelectScene.ts', 'levels'],
  ['DailyScene.ts', 'daily'],
  ['StatsScene.ts', 'statistics'],
  ['LeaderboardScene.ts', 'leaderboard'],
  ['SettingsScene.ts', 'settings'],
  ['HelpScene.ts', 'help'],
] as const) {
  const source = readFileSync(new URL(`../scenes/${file}`, import.meta.url), 'utf8');
  assert(source.includes(`screenView('${screen}')`), `${file} emits ${screen} screen_view.`);
}
```

Also assert `GameScene.ts` does **not** contain `.screenView(`.

- [ ] **Step 2: Run sanity and verify RED**

```bash
npm run sanity:analytics
```

Expected: FAIL because scenes do not yet reference the analytics service.

- [ ] **Step 3: Register analytics before platform resolution in BootScene**

At the start of `BootScene.routeLaunch()` create:

```ts
const analytics = new AnalyticsService(createYandexMetricaTransport({
  prod: import.meta.env.PROD,
  counterId: import.meta.env.VITE_YANDEX_METRICA_ID,
  globals: globalThis,
  document: typeof document === 'undefined' ? null : document,
}));
this.registry.set(ANALYTICS_SERVICE_REGISTRY_KEY, analytics);
```

For this task, keep the existing platform/profile factory signatures unchanged. The narrow technical-error reporter is created only in Task 7, when it is immediately consumed, so `noUnusedLocals` remains clean at every checkpoint.

After `PlayerProfileService`, `TutorialService`, `CampaignService`, and `DailyService` have been created and registered, emit exactly once:

```ts
const profile = profileService.getProfile();
analytics.gameReady({
  platform: platformServices.kind,
  language: profile.settings.language,
  tutorialCompleted: profile.tutorial.completed,
  campaignCompletedCount: profile.campaign.completedLevelIds.length,
});
```

Do this before dev/tutorial/home routing; do not `await` analytics.

- [ ] **Step 4: Add one screen_view per meta scene activation**

In each meta scene's `create()` method, after the scene has resolved its normal data/copy and before asynchronous rendering branches, retrieve the registered instance without making analytics a fatal dependency:

```ts
const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
analytics?.screenView('home');
```

Use the exact screen key for each file. Do not put this call in resize/layout helpers.

- [ ] **Step 5: Run analytics and meta/navigation regressions**

```bash
npm run sanity:analytics
npm run sanity:meta-navigation
npm run sanity:meta-scroll
npm run sanity:daily
npm run sanity:stats
npm run sanity:settings
```

Expected: all PASS.

- [ ] **Step 6: Commit boot and meta integration**

```bash
git add src/scenes/BootScene.ts src/scenes/HomeScene.ts src/scenes/LevelSelectScene.ts src/scenes/DailyScene.ts src/scenes/StatsScene.ts src/scenes/LeaderboardScene.ts src/scenes/SettingsScene.ts src/scenes/HelpScene.ts src/dev/analyticsSanity.ts
git commit -m "feat: track game ready and meta screens"
```

---

### Task 4: Runtime attempt classification for campaign, tutorial, and Daily

**Files:**
- Modify: `src/campaign/types.ts`
- Modify: `src/daily/DailyService.ts`
- Modify: `src/runtime/GameLaunch.ts`
- Modify: `src/dev/dailySanity.ts`
- Modify: `src/dev/campaignPlayStateSanity.ts`
- Modify: `src/dev/analyticsSanity.ts`

**Interfaces:**
- Produces runtime-only `analyticsAttempt?: PuzzleAttemptKind` launch metadata.
- Produces `DailyAttemptLaunch.attempt` before any new Daily draft is created.
- Produces `createCampaignReplayGameSceneData(data)` used by GameScene.

- [ ] **Step 1: Write failing Daily launch assertions**

In the existing `runServiceChecks()` flow in `dailySanity.ts`, extend the already-present `firstAttempt`, `resumedAttempt`, and `practice` assertions:

```ts
const firstAttempt = await service.beginDaily('2026-09-09', 'daily-001');
assert(firstAttempt?.ranked === true, 'Unsolved Daily must begin a ranked attempt.');
assert(firstAttempt?.attempt === 'new', 'First Daily launch is new before its fresh draft is created.');

clock.value = new Date('2026-09-09T12:01:00.000Z');
const resumedAttempt = await service.beginDaily('2026-09-09', 'daily-001');
assert(resumedAttempt?.ranked === true, 'Leaving and reopening an unsolved Daily must resume the ranked attempt.');
assert(resumedAttempt?.attempt === 'resume', 'Compatible unfinished Daily draft resumes.');

// Keep the existing solve flow, then after daily-004 has already been solved:
const practice = await service.beginDaily('2026-09-12', 'daily-004');
assert(practice?.ranked === false, 'Solved Daily must relaunch only as practice outside the ranking.');
assert(practice?.attempt === 'replay', 'Solved Daily launches as replay practice.');
```

In analytics sanity add a static assertion that `GameLaunch.ts` copies the Daily attempt marker and exposes a campaign replay helper.

- [ ] **Step 2: Run affected sanities and verify RED**

```bash
npm run sanity:daily
npm run sanity:analytics
```

Expected: FAIL because `DailyAttemptLaunch` has no `attempt` field and campaign replay helper does not exist.

- [ ] **Step 3: Add runtime-only launch attempt metadata**

In `src/campaign/types.ts`, add:

```ts
export type GameAnalyticsAttempt = 'new' | 'resume' | 'replay';
```

Add optional `analyticsAttempt?: GameAnalyticsAttempt` only to playable context variants (`campaign`, `tutorial`, `daily`), not to `dev`.

In `DailyAttemptLaunch`, add:

```ts
readonly attempt: GameAnalyticsAttempt;
```

Use a type-only import from `campaign/types.ts` to avoid duplicating the string union.

- [ ] **Step 4: Classify Daily before beginDaily mutates drafts**

Inside `DailyService.beginDaily()` compute the attempt **before** creating/saving a fresh snapshot:

```ts
if (existing !== undefined) {
  return {
    dateKey,
    entry,
    ranked: false,
    archive,
    elapsedMsAtLaunch: 0,
    attempt: 'replay',
  };
}

const saved = history.drafts[dateKey];
const compatible = isCompatiblePuzzleSnapshot(entry.level, 'daily', entry.id, saved);
const attempt: GameAnalyticsAttempt = compatible ? 'resume' : 'new';
```

Return `attempt` in the normal launch object after any fresh draft creation.

- [ ] **Step 5: Carry launch markers through GameLaunch helpers**

In `createDailyGameSceneData()` copy:

```ts
analyticsAttempt: attempt?.attempt,
```

Add an immutable campaign replay helper:

```ts
export function createCampaignReplayGameSceneData(data: GameSceneData): GameSceneData {
  if (data.context.mode !== 'campaign') return data;
  return {
    ...data,
    context: {
      ...data.context,
      analyticsAttempt: 'replay',
    },
  };
}
```

Do not persist this field anywhere in profile/session serialization.

- [ ] **Step 6: Add campaign runtime regression assertion**

In `campaignPlayStateSanity.ts`, assert that the helper preserves level/content identity but adds only the runtime marker:

```ts
const replayData = createCampaignReplayGameSceneData(campaignData);
assert(replayData.level === campaignData.level, 'Replay launch keeps the same immutable level payload.');
assert(replayData.context.mode === 'campaign' && replayData.context.analyticsAttempt === 'replay', 'Replay launch marks analytics attempt only.');
```

- [ ] **Step 7: Run attempt-related sanities**

```bash
npm run sanity:daily
npm run sanity:daily-drafts
npm run sanity:campaign-playstate
npm run sanity:campaign-runtime
npm run sanity:analytics
```

Expected: all PASS.

- [ ] **Step 8: Commit runtime attempt metadata**

```bash
git add src/campaign/types.ts src/daily/DailyService.ts src/runtime/GameLaunch.ts src/dev/dailySanity.ts src/dev/campaignPlayStateSanity.ts src/dev/analyticsSanity.ts
git commit -m "feat: classify puzzle analytics attempts"
```

---

### Task 5: GameScene puzzle lifecycle, reset, hints, completion, and tutorial completion

**Files:**
- Modify: `src/gameplay/HintService.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/dev/hintSanity.ts`
- Modify: `src/dev/rewardedHintSanity.ts`
- Modify: `src/dev/analyticsSanity.ts`

**Interfaces:**
- Consumes: analytics service/session and runtime attempt marker.
- Produces actual `puzzle_start`, `puzzle_reset`, `hint_used`, `puzzle_complete`, `tutorial_complete` events.
- Changes `HintRequestOptions.deliverHint` to include source: `(hint, source) => void`.

- [ ] **Step 1: Make hint-source behavior fail first**

Update `hintSanity.ts` so free and rewarded delivery records the source:

```ts
const deliveries: Array<'free' | 'rewarded'> = [];
await requestHint({
  puzzle,
  consumeFreeHint: () => true,
  requestRewarded: null,
  recordRewardedHintUsed: () => {},
  deliverHint: (_hint, source) => deliveries.push(source),
});
assert(deliveries[0] === 'free', 'Free hint delivery identifies its source.');
```

Add the rewarded equivalent with `requestRewarded: async () => 'rewarded'`, and assert `closed` / `unavailable` produce no delivery.

- [ ] **Step 2: Run hint sanity and verify RED**

```bash
npm run sanity:hint
```

Expected: TypeScript/runtime failure because `deliverHint` currently receives only the hint.

- [ ] **Step 3: Extend HintService with an explicit delivery source**

Change:

```ts
readonly deliverHint: (hint: PuzzleHint, source: 'free' | 'rewarded') => void;
```

and call:

```ts
options.deliverHint(hint, 'free');
```

for consumed free hints, and:

```ts
options.deliverHint(hint, 'rewarded');
```

only after `showRewarded()` returns `rewarded`.

- [ ] **Step 4: Add a GameScene analytics-context builder and retrieve the service**

In `GameScene.createGame()`, get:

```ts
const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
```

After campaign/tutorial/Daily entry/context resolution, build exactly one `AnalyticsPuzzleContext | null`:

```ts
const analyticsContext: AnalyticsPuzzleContext | null = campaignEntry !== null
  ? { mode: 'campaign', puzzleId: campaignEntry.id, slot: campaignEntry.slot }
  : tutorialEntry !== null
    ? { mode: 'tutorial', puzzleId: tutorialEntry.id }
    : dailyContext !== null
      ? {
          mode: 'daily',
          puzzleId: dailyContext.dailyId,
          dateKey: dailyContext.dateKey,
          ranked: dailyContext.ranked,
          archive: dailyContext.archive,
        }
      : null;
```

Dev mode leaves this `null`.

- [ ] **Step 5: Classify the playable attempt after play-state resolution but before session mutation**

Capture pre-attempt solved state from the profile:

```ts
const alreadySolvedAtStart = campaignContext !== null
  ? profileService?.getProfile().campaign.completedLevelIds.includes(campaignContext.campaignLevelId) === true
  : tutorialContext !== null
    ? profileService?.getProfile().tutorial.completedLevelIds.includes(tutorialContext.tutorialLevelId) === true
    : dailyContext !== null
      ? dailyAlreadySolved
      : false;
```

Derive compatible draft state **before** `puzzleSession?.saveNow()`:

- campaign: `campaignPlayState?.mode === 'active' && campaignPlayState.savedPuzzle !== undefined`;
- tutorial: use `isCompatiblePuzzleSnapshot(level, 'tutorial', level.id, profile.tutorial.activePuzzle)`;
- Daily: use `dailyContext.analyticsAttempt` from Task 4 rather than inspecting the now-created profile draft.

Then create the session only if `analytics`, `analyticsContext`, non-dev mode, and `!completedReview`:

```ts
const attempt = dailyContext?.analyticsAttempt
  ?? classifyPuzzleAttempt({
    explicitReplay: launchData.context.mode !== 'dev' && launchData.context.analyticsAttempt === 'replay',
    hasCompatibleDraft,
    alreadySolved: alreadySolvedAtStart,
  });
const puzzleAnalytics = analytics && analyticsContext && !completedReview
  ? new PuzzleAnalyticsSession(analytics, analyticsContext, attempt)
  : null;
puzzleAnalytics?.start();
```

A campaign completed-review creates no analytics session and emits no `puzzle_start`.

- [ ] **Step 6: Emit reset only after a real unfinished reset succeeds**

Create one helper in `GameScene` to replace both direct `board?.reset()` call sites:

```ts
const performPlayableReset = (): boolean => {
  const editsBeforeReset = interaction.getEditCount();
  const elapsedMs = getDisplayedElapsedMs();
  const changed = board?.reset() === true;
  if (!changed) return false;
  feedback.play('reset');
  puzzleAnalytics?.reset(elapsedMs, editsBeforeReset);
  return true;
};
```

Use it both for immediate reset and confirmed reset. Do **not** call it for completed-review replay reset.

- [ ] **Step 7: Restart completed campaign review with explicit replay metadata**

In `startFreshCampaignReplay()`, keep the current fresh-session persistence behavior, but replace:

```ts
this.scene.restart(launchData);
```

with:

```ts
this.scene.restart(createCampaignReplayGameSceneData(launchData));
```

This guarantees the freshly saved replay draft is not mislabeled as `resume` on the immediate restart.

- [ ] **Step 8: Emit hint_used only after a hint is actually delivered**

Change `applyDeliveredHint` to accept the source:

```ts
const applyDeliveredHint = (hint: PuzzleHint, source: 'free' | 'rewarded'): void => {
  ...
  const hintsUsedInAttempt = puzzleSession?.getHintsUsed() ?? transientHintsUsed;
  puzzleAnalytics?.hintGranted(source, hintsUsedInAttempt);
  ...
};
```

Do this after incrementing `puzzleSession.recordHint()` / `transientHintsUsed`, so `hints_used_in_attempt` is 1-based and exact.

- [ ] **Step 9: Emit puzzle_complete after authoritative completion service returns**

Do not emit completion at raw board validation time. Emit only inside each completion promise after the relevant service has accepted the solve:

Campaign:

```ts
puzzleAnalytics?.complete({
  elapsedMs: metadata.bestTimeMs,
  hintsUsed: metadata.minHintsUsed,
  firstClear: !alreadySolvedAtStart,
  persisted: result.persisted,
});
```

Tutorial:

```ts
puzzleAnalytics?.complete({
  elapsedMs: metadata.bestTimeMs,
  hintsUsed: metadata.minHintsUsed,
  firstClear: !alreadySolvedAtStart,
  persisted: result.persisted,
});
if (!tutorialWasCompleteAtStart && result.tutorialCompleted) {
  analytics?.tutorialComplete();
}
```

Daily, including solved practice:

```ts
puzzleAnalytics?.complete({
  elapsedMs: metadata.bestTimeMs,
  hintsUsed: metadata.minHintsUsed,
  firstClear: result.wasFirstSolve,
  persisted: result.persisted,
});
```

Capture `tutorialWasCompleteAtStart` before calling `TutorialService.completeLevel()` so replaying the last tutorial cannot resend `tutorial_complete`.

- [ ] **Step 10: Add source/static assertions to analytics sanity**

Assert from `GameScene.ts` source that:

- `new PuzzleAnalyticsSession` exists;
- `createCampaignReplayGameSceneData` is used for completed replay restart;
- `puzzleAnalytics?.reset` is present after real reset;
- `puzzleAnalytics?.hintGranted` is inside delivered-hint path;
- `puzzleAnalytics?.complete` exists in campaign/tutorial/Daily completion branches;
- `analytics?.tutorialComplete()` is transition-gated;
- no raw `ym(` exists.

- [ ] **Step 11: Run gameplay regressions**

```bash
npm run sanity:analytics
npm run sanity:hint
npm run sanity:rewarded-hint
npm run sanity:puzzle-session
npm run sanity:campaign-playstate
npm run sanity:campaign-runtime
npm run sanity:tutorial
npm run sanity:daily
npm run sanity:daily-drafts
```

Expected: all PASS.

- [ ] **Step 12: Commit puzzle lifecycle analytics**

```bash
git add src/gameplay/HintService.ts src/scenes/GameScene.ts src/dev/hintSanity.ts src/dev/rewardedHintSanity.ts src/dev/analyticsSanity.ts
git commit -m "feat: track puzzle lifecycle analytics"
```

---

### Task 6: Monetization analytics at the actual ad-request boundary

**Files:**
- Modify: `src/monetization/MonetizationService.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/dev/monetizationSanity.ts`
- Modify: `src/dev/rewardedHintSanity.ts`

**Interfaces:**
- Consumes: `AnalyticsService`, `AnalyticsPuzzleContext`.
- `MonetizationService.create(profileService, ads, analytics, now?)`.
- `requestRewardedHint(context)` emits one `ad_rewarded_result` per real request.
- `maybeShowCampaignInterstitial(slot)` emits no event when policy rejects; one result event when the port is actually called.

- [ ] **Step 1: Add failing monetization event assertions**

Extend `monetizationSanity.ts` with a `RecordingTransport`/`AnalyticsService` and assert:

```ts
await monetization.maybeShowCampaignInterstitial(8);
assert(events.filter((event) => event.name === 'ad_interstitial_result').length === 0, 'Policy-rejected interstitial emits no ad event.');
```

For an eligible `shown`, `skipped`, and `unavailable` request assert one event each with `completed_slot` and `context='campaign_next'`.

Make `FakeAds` able to reject interstitial; assert rejection normalizes to `result='unavailable'` and emits one `tech_error` with `code='interstitial_request_failed'`.

For rewarded, assert `rewarded`, `closed`, `unavailable`, and thrown promise each emit exactly one `ad_rewarded_result`; thrown promise also emits `rewarded_request_failed` once.

- [ ] **Step 2: Run monetization sanity and verify RED**

```bash
npm run sanity:monetization
npm run sanity:rewarded-hint
```

Expected: FAIL because `MonetizationService` has no analytics dependency/context.

- [ ] **Step 3: Inject analytics into MonetizationService**

Change constructor/factory to require `AnalyticsService`:

```ts
static create(
  profileService: PlayerProfileService,
  ads: AdsPort,
  analytics: AnalyticsService,
  now: MonetizationNow = () => Date.now(),
): MonetizationService
```

Update every existing call site in `GameScene.ts`, `monetizationSanity.ts`, and `rewardedHintSanity.ts`; calls that currently pass a clock as the third argument must move that clock to the fourth argument.

- [ ] **Step 4: Track rewarded results without changing reward semantics**

Change method to:

```ts
async requestRewardedHint(context: AnalyticsPuzzleContext): Promise<RewardedResult> {
  try {
    const result = await this.ads.showRewarded();
    this.analytics.rewardedResult(result, context);
    return result;
  } catch (error) {
    console.warn('[Dungeon Logic] Rewarded hint request failed; no hint granted.', error);
    this.analytics.rewardedResult('unavailable', context);
    this.analytics.techError('rewarded_request_failed', 'ads', {
      mode: context.mode,
      puzzleId: context.puzzleId,
    });
    return 'unavailable';
  }
}
```

Do not emit `hint_used` here.

- [ ] **Step 5: Track interstitial only after eligibility passes and the ad port is called**

Keep `isInterstitialEligible(...)` and opportunity consumption exactly where they are. After `showInterstitial()` resolves, call:

```ts
this.analytics.interstitialResult(result, completedSlot);
```

In the catch branch, before returning:

```ts
this.analytics.interstitialResult('unavailable', completedSlot);
this.analytics.techError('interstitial_request_failed', 'ads');
```

Do not emit anything before the policy eligibility return.

- [ ] **Step 6: Pass the current puzzle context from GameScene**

Create `MonetizationService` with registered analytics. For rewarded hints pass the non-null `analyticsContext`:

```ts
requestRewarded: monetizationService === null || analyticsContext === null
  ? null
  : () => monetizationService.requestRewardedHint(analyticsContext),
```

Campaign interstitial signature remains slot-only because its contract already has fixed `context='campaign_next'`.

- [ ] **Step 7: Run monetization and hint regressions**

```bash
npm run sanity:monetization
npm run sanity:rewarded-hint
npm run sanity:hint
npm run sanity:analytics
```

Expected: all PASS.

- [ ] **Step 8: Commit monetization analytics**

```bash
git add src/monetization/MonetizationService.ts src/scenes/GameScene.ts src/dev/monetizationSanity.ts src/dev/rewardedHintSanity.ts
git commit -m "feat: track ad request results"
```

---

### Task 7: Technical error reporting through platform and profile boundaries

**Files:**
- Modify: `src/platform/PlatformRegistry.ts`
- Modify: `src/platform/yandex.ts`
- Modify: `src/profile/PlatformPlayerProfileStorage.ts`
- Modify: `src/profile/PlayerProfileService.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/dev/platformSanity.ts`
- Modify: `src/dev/playerProfileSanity.ts`
- Modify: `src/dev/analyticsSanity.ts`

**Interfaces:**
- Consumes: `TechnicalErrorReporter` from `AnalyticsService`.
- Platform/profile APIs stay usable without analytics by defaulting reporter to no-op.

- [ ] **Step 1: Add failing platform reporter assertions**

In `platformSanity.ts`, create:

```ts
const technicalErrors: string[] = [];
const report: TechnicalErrorReporter = (code) => technicalErrors.push(code);
```

Add cases where:

- `resolvePlatformServices` factory throws -> `platform_init_failed` exactly once;
- `LoadingAPI.ready` throws -> `readiness_failed`;
- `GameplayAPI.start/stop` throws -> `gameplay_api_failed`;
- leaderboard `setScore` throws -> `leaderboard_submit_failed`;
- leaderboard `getEntries` / `getPlayerEntry` throws -> `leaderboard_load_failed`;
- ad SDK call throws -> corresponding ad request code while business result stays `unavailable`.

Do not report missing optional SDK methods as errors; only caught failures.

- [ ] **Step 2: Add failing profile reporter assertions**

In `playerProfileSanity.ts`, use a storage that rejects load/save and assert:

```ts
assert(codes.includes('profile_load_failed'), 'Profile load failure is reported.');
assert(codes.includes('profile_save_failed'), 'Profile save failure is reported.');
```

Also trigger delayed `PlayerProfileService` flush failure with a short `saveDelayMs` and assert the reporter runs even though the existing console warning/fallback semantics remain unchanged.

- [ ] **Step 3: Run platform/profile sanities and verify RED**

```bash
npm run sanity:platform
npm run sanity:profile
```

Expected: FAIL because reporter parameters do not exist.

- [ ] **Step 4: Add optional reporter to PlatformRegistry fallback**

Change signature to:

```ts
export async function resolvePlatformServices(
  yandexFactory: () => Promise<PlatformServices | null>,
  localFactory: () => PlatformServices,
  reportTechnicalError: TechnicalErrorReporter = () => {},
): Promise<PlatformServices>
```

In the catch:

```ts
reportTechnicalError('platform_init_failed', 'platform');
```

Then fall through exactly as before.

- [ ] **Step 5: Thread reporter through the Yandex adapter's existing caught failures**

Change exported factory to:

```ts
export async function createYandexPlatformServices(
  globals: YandexGlobalScopeLike = globalThis as unknown as YandexGlobalScopeLike,
  reportTechnicalError: TechnicalErrorReporter = () => {},
): Promise<PlatformServices | null>
```

Pass reporter into internal creators. In their existing catches add exactly:

```ts
reportTechnicalError('platform_init_failed', 'platform');
reportTechnicalError('readiness_failed', 'lifecycle');
reportTechnicalError('gameplay_api_failed', 'lifecycle');
reportTechnicalError('leaderboard_submit_failed', 'leaderboard');
reportTechnicalError('leaderboard_load_failed', 'leaderboard');
reportTechnicalError('interstitial_request_failed', 'ads');
reportTechnicalError('rewarded_request_failed', 'ads');
```

Keep console warnings and current return values. Do not attach the caught `error` to telemetry.

For ad callback `onError`, normalize result to `unavailable` and report the matching stable ad code. `AnalyticsService` dedupe prevents callback spam.

- [ ] **Step 6: Add reporter to platform-backed profile storage**

Change constructor:

```ts
constructor(
  platformStorage: PlayerStorage,
  localMigrationStorage?: PlayerProfileStorage,
  reportTechnicalError: TechnicalErrorReporter = () => {},
)
```

On caught platform load failure call `profile_load_failed`; on caught local-to-platform promotion save failure call `profile_save_failed`. Normal `save()` still throws upward so `PlayerProfileService` remains authoritative for flush failure handling.

- [ ] **Step 7: Add reporter to PlayerProfileService options and every swallowed/rethrown persistence failure**

Extend options:

```ts
export interface PlayerProfileServiceOptions {
  readonly saveDelayMs?: number;
  readonly defaultLanguage?: SupportedLanguage;
  readonly reportTechnicalError?: TechnicalErrorReporter;
}
```

Store a no-op default on the service. Report:

- `profile_load_failed` in the existing `storage.load()` catch;
- `profile_load_failed` in `loadLegacyCampaignProgress()` catch;
- `profile_save_failed` when migrated profile immediate save fails;
- `profile_save_failed` in scheduled `flush().catch(...)`;
- `profile_save_failed` in `performFlush()` immediately before rethrowing save failure.

Repeated save failures are allowed to call the reporter repeatedly; `AnalyticsService.techError` performs the once-per-code remote dedupe.

- [ ] **Step 8: Wire the Boot-created reporter into real runtime factories**

Update Boot:

```ts
const platformServices = await resolvePlatformServices(
  () => createYandexPlatformServices(globalThis as unknown as YandexGlobalScopeLike, reportTechnicalError),
  () => createLocalPlatformServices(),
  reportTechnicalError,
);
```

Import `type YandexGlobalScopeLike` from `src/platform/yandex.ts`, then construct profile storage/service with the reporter:

```ts
const profileStorage = new PlatformPlayerProfileStorage(
  platformServices.storage,
  new LocalPlayerProfileStorage(),
  reportTechnicalError,
);
const profileService = await PlayerProfileService.create(campaignManifest, profileStorage, {
  defaultLanguage: resolveSupportedLanguage(platformServices.environment.language),
  reportTechnicalError,
});
```

- [ ] **Step 9: Run technical and gameplay regressions**

```bash
npm run sanity:platform
npm run sanity:platform-gameplay
npm run sanity:profile
npm run sanity:analytics
npm run sanity:monetization
npm run sanity:rewarded-hint
```

Expected: all PASS.

- [ ] **Step 10: Commit technical telemetry**

```bash
git add src/platform/PlatformRegistry.ts src/platform/yandex.ts src/profile/PlatformPlayerProfileStorage.ts src/profile/PlayerProfileService.ts src/scenes/BootScene.ts src/dev/platformSanity.ts src/dev/playerProfileSanity.ts src/dev/analyticsSanity.ts
git commit -m "feat: report recoverable platform errors"
```

---

### Task 8: Documentation, release setup, privacy guard, and full verification

**Files:**
- Modify: `TECH.md`
- Modify: `PROJECT.md`
- Modify: `src/dev/analyticsSanity.ts`
- Verify: all affected production/test files

**Interfaces:**
- No new runtime interface; locks the release contract and proves there are no raw provider calls outside the transport.

- [ ] **Step 1: Add a source privacy/provider-boundary guard to analytics sanity**

At the end of `analyticsSanity.ts`, recursively inspect `src/` TypeScript files and assert:

```ts
if (!file.endsWith('YandexMetricaTransport.ts')) {
  assert(!source.includes("'reachGoal'"), `${file} must not call Metrica directly.`);
  assert(!/\bym\s*\(/.test(source), `${file} must not call ym directly.`);
}
```

Also assert the analytics payload implementation does not contain forbidden identity/error fields:

```ts
const analyticsPayloadSource = [
  'AnalyticsService.ts',
  'PuzzleAnalyticsSession.ts',
].map((file) => readFileSync(new URL(`../analytics/${file}`, import.meta.url), 'utf8')).join('\n');

for (const forbidden of ['stack', 'publicName', 'avatarUrl', 'uniqueID', 'extraData']) {
  assert(!analyticsPayloadSource.includes(forbidden), `Analytics payloads must not expose ${forbidden}.`);
}
```

Limit this privacy assertion to analytics payload implementation files, not the whole game, because leaderboards legitimately use those fields internally.

- [ ] **Step 2: Document the exact production setup in TECH.md**

Add an `## Analytics / Yandex Metrica` section containing:

```text
- All custom events go through src/analytics/AnalyticsService.ts.
- Only src/analytics/YandexMetricaTransport.ts may call ym/reachGoal.
- VITE_YANDEX_METRICA_ID=0 disables custom analytics.
- Real sends require PROD + positive counter id + YaGames.init + Metrica bootstrap.
- Webvisor/clickmap are disabled.
- Before release create a Metrica counter, do not restrict it to one non-Yandex host, set VITE_YANDEX_METRICA_ID to the numeric id, build, upload to Yandex test environment, and verify game_ready/screen_view/puzzle_start/puzzle_complete/hint_used plus one ad-result goal.
```

List the stable goal names and the privacy rule that no player identity/error text/profile JSON is sent.

- [ ] **Step 3: Summarize product analytics in PROJECT.md**

Add the release contract:

```text
Product analytics v1: game_ready, meta screen views, puzzle new/resume/replay funnel, completion time/hints/first_clear/persisted, real resets, delivered hints, Tutorial completion, actual interstitial/rewarded request outcomes, and deduplicated recoverable technical errors. Endless analytics is deferred because Endless is not part of the current release.
```

- [ ] **Step 4: Run the dedicated analytics sanity**

```bash
npm run sanity:analytics
```

Expected: `Analytics sanity: PASS`.

- [ ] **Step 5: Run every affected regression suite from the approved spec**

Run exactly:

```bash
npm run sanity:campaign
npm run sanity:campaign-runtime
npm run sanity:campaign-playstate
npm run sanity:puzzle-session
npm run sanity:tutorial
npm run sanity:daily
npm run sanity:daily-drafts
npm run sanity:daily-leaderboard
npm run sanity:monetization
npm run sanity:rewarded-hint
npm run sanity:platform
npm run sanity:platform-gameplay
npm run sanity:feature-unlock
npm run sanity:release
```

Expected: all commands exit 0. Record any unrelated pre-existing environment failure separately; do not relabel it as an analytics regression.

- [ ] **Step 6: Run build/type verification**

```bash
npm run build
```

Expected in a complete local checkout: TypeScript and Vite build exit 0. If this archive environment still lacks `@types/node` or `vite/client`, capture the exact output and verify it matches the pre-existing environment issue before making any completion claim.

- [ ] **Step 7: Verify no provider leakage and no persisted analytics metadata**

Run:

```bash
rg -n "\bym\s*\(|reachGoal" src --glob '*.ts'
rg -n "analyticsAttempt" src/profile src/gameplay/PuzzleSessionState.ts
```

Expected:

- first command reports provider calls only inside `src/analytics/YandexMetricaTransport.ts` (test/source-string assertions may mention the names in `src/dev/analyticsSanity.ts`);
- second command reports no persisted profile/session serialization usage.

- [ ] **Step 8: Review the final diff against the definition of done**

Verify line by line:

```text
[ ] all custom telemetry flows through AnalyticsService
[ ] counter id 0 is safe/no-op
[ ] local/plain preview cannot send real telemetry
[ ] campaign completed-review emits no start
[ ] campaign replay, tutorial replay, Daily replay are distinguishable
[ ] Daily new/resume is determined before beginDaily creates a draft
[ ] completion survives persistence failure in analytics
[ ] free/rewarded hint source is emitted only after delivery
[ ] ad events represent only real ad requests
[ ] technical errors contain stable codes only and dedupe
[ ] no gameplay/profile semantics changed
```

- [ ] **Step 9: Commit docs and verification guards**

```bash
git add TECH.md PROJECT.md src/dev/analyticsSanity.ts
git commit -m "docs: finalize release analytics contract"
```

---

## Final Release-Environment Check (after a real Metrica counter is created)

This is intentionally not part of code implementation and should be executed only once a real counter exists:

1. Create the Yandex Metrica counter for Dungeon Logic.
2. Keep Webvisor disabled and avoid a restrictive single-host allowlist that excludes Yandex Games hosting.
3. Build with `VITE_YANDEX_METRICA_ID=<positive numeric id>`.
4. Upload to the Yandex Games test environment.
5. Open a clean session and verify `game_ready` and `screen_view` arrive.
6. Start and solve one campaign level; verify one `puzzle_start` and one `puzzle_complete` with the expected slot/attempt/first_clear values.
7. Deliver one free or rewarded hint and verify `hint_used` only after delivery.
8. If test ads are available, verify one ad-result goal from a real request.
9. Run a local/plain preview with the same shell environment and confirm no production Metrica goals arrive because `YaGames.init` is absent.
