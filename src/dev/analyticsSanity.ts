import { readFileSync, readdirSync } from 'node:fs';
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
import { createYandexMetricaTransport } from '../analytics/YandexMetricaTransport';
import { createCampaignReplayGameSceneData } from '../runtime/GameLaunch';

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


const endless: AnalyticsPuzzleContext = {
  mode: 'endless',
  puzzleId: 'generated-monster-only-6-123',
  ordinal: 42,
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

const replayLaunch = createCampaignReplayGameSceneData({
  level: {
    id: 'campaign-006', width: 1, height: 1, rowClues: [0], columnClues: [0],
    monsters: [], chests: [], blockers: [], doors: [], solution: ['.'],
  },
  context: { mode: 'campaign', campaignLevelId: 'campaign-006' },
  onboarding: [],
  contextualOnboarding: false,
});
assert(
  replayLaunch.context.mode === 'campaign' && replayLaunch.context.analyticsAttempt === 'replay',
  'Campaign replay launch adds only the runtime analytics replay marker.',
);

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

const endlessTransport = new RecordingTransport();
const endlessAnalytics = new AnalyticsService(endlessTransport);
endlessAnalytics.puzzleStart(endless, 'resume');
const endlessStart = endlessTransport.events.at(-1);
assert(endlessStart?.name === 'puzzle_start', 'Endless uses the shared puzzle_start goal.');
assert(endlessStart?.params.mode === 'endless' && endlessStart.params.ordinal === 42, 'Endless analytics includes mode and one-based ordinal.');

const replay = new PuzzleAnalyticsSession(analytics, daily, 'replay');
replay.start();
replay.complete({ elapsedMs: 4_100, hintsUsed: 0, firstClear: false, persisted: true });
const replayComplete = transport.events.filter((event) => event.name === 'puzzle_complete').at(-1);
assert(replayComplete?.params.attempt === 'replay', 'Daily practice completion stays replay.');
assert(replayComplete?.params.first_clear === false, 'Daily practice does not inflate first-clear funnel.');

analytics.techError('profile_save_failed', 'profile');
analytics.techError('profile_save_failed', 'profile');
assert(transport.events.filter((event) => event.name === 'tech_error' && event.params.code === 'profile_save_failed').length === 1, 'Technical error codes deduplicate per page load.');



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

const metricaCalls: unknown[][] = [];
const appendedScripts: Array<{ src?: string; async?: boolean; onerror?: (() => void) | null }> = [];
const fakeDocument = {
  createElement(tag: string) {
    assert(tag === 'script', 'Metrica bootstrap creates a script element.');
    return { src: '', async: false, onerror: null };
  },
  head: {
    appendChild(script: { src?: string; async?: boolean; onerror?: (() => void) | null }) {
      appendedScripts.push(script);
      return script;
    },
  },
} as unknown as Document;
const enabledGlobals = {
  YaGames: { init() {} },
  ym: ((...args: unknown[]) => metricaCalls.push(args)) as (...args: unknown[]) => void,
};
const enabledTransport = createYandexMetricaTransport({
  prod: true,
  counterId: '123456',
  globals: enabledGlobals,
  document: fakeDocument,
});
enabledTransport.sendGoal('screen_view', { screen: 'home' });
assert(appendedScripts.length === 0, 'Existing ym does not inject a duplicate script.');
assert(metricaCalls.filter((call) => call[1] === 'init').length === 1, 'Metrica initializes the counter once.');
const metricaGoal = metricaCalls.find((call) => call[1] === 'reachGoal');
assert(JSON.stringify(metricaGoal) === JSON.stringify([123456, 'reachGoal', 'screen_view', { screen: 'home' }]), 'Metrica sends the exact reachGoal payload.');

const queuedScripts: Array<{ src?: string; async?: boolean; onerror?: (() => void) | null }> = [];
const queuedDocument = {
  createElement() { return { src: '', async: false, onerror: null }; },
  head: { appendChild(script: { src?: string; async?: boolean; onerror?: (() => void) | null }) { queuedScripts.push(script); return script; } },
} as unknown as Document;
const queuedGlobals: { YaGames: { init(): void }; ym?: ((...args: unknown[]) => void) & { a?: readonly unknown[]; l?: number } } = {
  YaGames: { init() {} },
};
const queuedTransport = createYandexMetricaTransport({
  prod: true,
  counterId: '654321',
  globals: queuedGlobals,
  document: queuedDocument,
});
queuedTransport.sendGoal('screen_view', { screen: 'levels' });
assert(queuedScripts.length === 1, 'Missing ym injects exactly one Metrica script.');
assert(queuedScripts[0]?.src === 'https://mc.yandex.ru/metrika/tag.js', 'Metrica script URL is exact.');
assert(queuedScripts[0]?.async === true, 'Metrica script loads asynchronously.');
assert((queuedGlobals.ym?.a?.length ?? 0) === 2, 'Queued ym captures init and reachGoal until provider loads.');

const throwingTransport = createYandexMetricaTransport({
  prod: true,
  counterId: '777',
  globals: { YaGames: { init() {} }, ym() { throw new Error('provider failed'); } },
  document: fakeDocument,
});
throwingTransport.sendGoal('screen_view', { screen: 'home' });



const bootSource = readFileSync('src/scenes/BootScene.ts', 'utf8');
assert(bootSource.includes('ANALYTICS_SERVICE_REGISTRY_KEY'), 'Boot registers analytics.');
assert(bootSource.includes('.gameReady('), 'Boot emits game_ready after profile setup.');

assert(bootSource.includes('const reportTechnicalError: TechnicalErrorReporter'), 'Boot creates one technical-error reporter from analytics.');
assert(bootSource.includes('createYandexPlatformServices(') && bootSource.includes('reportTechnicalError'), 'Boot threads technical errors into Yandex platform creation.');
assert(bootSource.includes('new PlatformPlayerProfileStorage('), 'Boot still owns platform-backed profile storage.');
assert(bootSource.includes('reportTechnicalError,'), 'Boot threads technical errors through profile/platform boundaries.');

for (const [file, screen] of [
  ['HomeScene.ts', 'home'],
  ['LevelSelectScene.ts', 'levels'],
  ['DailyScene.ts', 'daily'],
  ['LeaderboardScene.ts', 'leaderboard'],
  ['SettingsScene.ts', 'settings'],
  ['HelpScene.ts', 'help'],
] as const) {
  const source = readFileSync(`src/scenes/${file}`, 'utf8');
  assert(source.includes(`screenView('${screen}')`), `${file} emits ${screen} screen_view.`);
}

const statsSceneSource = readFileSync('src/scenes/StatsScene.ts', 'utf8');
assert(!statsSceneSource.includes("screenView('statistics')"), 'Removed Statistics screen emits no dead screen_view metric.');

const gameLaunchSource = readFileSync('src/runtime/GameLaunch.ts', 'utf8');
assert(gameLaunchSource.includes('analyticsAttempt: attempt?.attempt'), 'Daily launch copies analytics attempt marker.');
assert(gameLaunchSource.includes('createCampaignReplayGameSceneData'), 'GameLaunch exposes campaign replay helper.');

const gameSceneSource = readFileSync('src/scenes/GameScene.ts', 'utf8');
assert(!gameSceneSource.includes('.screenView('), 'GameScene does not emit meta screen_view.');

assert(gameSceneSource.includes('new PuzzleAnalyticsSession'), 'GameScene creates an analytics session for playable attempts.');
assert(gameSceneSource.includes('createCampaignReplayGameSceneData(launchData)'), 'Completed campaign replay restart is explicitly marked replay.');
assert(gameSceneSource.includes('puzzleAnalytics?.reset'), 'GameScene reports a real playable reset.');
assert(gameSceneSource.includes('puzzleAnalytics?.hintGranted'), 'GameScene reports only delivered hints.');
assert((gameSceneSource.match(/puzzleAnalytics\?\.complete/g) ?? []).length >= 3, 'Campaign, Tutorial, and Daily completion branches report puzzle_complete.');
assert(gameSceneSource.includes('!tutorialWasCompleteAtStart && result.tutorialCompleted'), 'Tutorial completion analytics is transition-gated.');
assert(!gameSceneSource.includes('ym('), 'GameScene never talks to Metrica directly.');



function collectTypeScriptFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(path));
    } else if (entry.isFile() && path.endsWith('.ts')) {
      files.push(path);
    }
  }
  return files;
}

for (const file of collectTypeScriptFiles('src')) {
  if (file.endsWith('YandexMetricaTransport.ts') || file.endsWith('analyticsSanity.ts')) continue;
  const source = readFileSync(file, 'utf8');
  assert(!source.includes("'reachGoal'") && !source.includes('"reachGoal"'), `${file} must not call Metrica directly.`);
  assert(!/\bym\s*\(/.test(source), `${file} must not call ym directly.`);
}

const analyticsPayloadSource = [
  'src/analytics/AnalyticsService.ts',
  'src/analytics/PuzzleAnalyticsSession.ts',
].map((file) => readFileSync(file, 'utf8')).join('\n');

for (const forbidden of ['stack', 'publicName', 'avatarUrl', 'uniqueID', 'extraData']) {
  assert(!analyticsPayloadSource.includes(forbidden), `Analytics payloads must not expose ${forbidden}.`);
}

console.log('Analytics sanity: PASS');
