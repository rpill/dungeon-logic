import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type {
  AdsPort,
  GameLifecycleHandlers,
  GameLifecyclePort,
  GameplayMarkupPort,
  InterstitialResult,
  LeaderboardPlayerView,
  LeaderboardsPort,
  PlatformReadinessPort,
  PlatformServices,
  PlayerStorage,
  RewardedResult,
  TrustedClock,
} from './services';

export const YANDEX_PROFILE_DATA_KEY = 'dungeonLogicProfile';

interface YandexPlayerLike {
  getData(keys?: readonly string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
  isAuthorized?(): boolean;
}

interface AdCallbacksLike {
  onOpen?: () => void;
  onClose?: (wasShown: boolean) => void;
  onError?: (error: unknown) => void;
}

interface RewardedCallbacksLike extends AdCallbacksLike {
  onRewarded?: () => void;
}

interface YandexFeatureMethodLike {
  (): void | Promise<void>;
}

interface YandexLeaderboardEntryLike {
  readonly extraData?: string;
  readonly rank: number;
  readonly score: number;
  readonly player?: {
    readonly publicName?: string;
    readonly uniqueID?: string;
    getAvatarSrc?(size?: 'small' | 'medium' | 'large'): string;
  };
}

interface YandexLeaderboardEntriesLike {
  readonly entries?: readonly YandexLeaderboardEntryLike[];
  readonly userRank?: number;
}

interface YandexSdkLike {
  getPlayer(): Promise<YandexPlayerLike>;
  serverTime?: () => number;
  isAvailableMethod?: (method: string) => Promise<boolean>;
  auth?: {
    openAuthDialog?: () => Promise<void>;
  };
  leaderboards?: {
    setScore?: (leaderboardName: string, score: number, extraData?: string) => Promise<void>;
    getPlayerEntry?: (leaderboardName: string) => Promise<YandexLeaderboardEntryLike>;
    getEntries?: (
      leaderboardName: string,
      options?: {
        includeUser?: boolean;
        quantityAround?: number;
        quantityTop?: number;
      },
    ) => Promise<YandexLeaderboardEntriesLike>;
  };
  environment?: {
    i18n?: {
      lang?: string;
    };
  };
  features?: {
    LoadingAPI?: {
      ready?: YandexFeatureMethodLike;
    };
    GameplayAPI?: {
      start?: YandexFeatureMethodLike;
      stop?: YandexFeatureMethodLike;
    };
  };
  adv?: {
    showFullscreenAdv?: (options?: { callbacks?: AdCallbacksLike }) => void;
    showRewardedVideo?: (options?: { callbacks?: RewardedCallbacksLike }) => void;
  };
  on?: (event: 'game_api_pause' | 'game_api_resume', handler: () => void) => void;
  off?: (event: 'game_api_pause' | 'game_api_resume', handler: () => void) => void;
}

export interface YandexGlobalScopeLike {
  readonly YaGames?: {
    init(): Promise<YandexSdkLike>;
  };
}

interface YandexPlayerProvider {
  get(): Promise<YandexPlayerLike>;
  refresh(): Promise<YandexPlayerLike>;
}

function createYandexPlayerProvider(
  sdkPromise: Promise<YandexSdkLike>,
): YandexPlayerProvider {
  let playerPromise: Promise<YandexPlayerLike> | null = null;

  return {
    get() {
      if (playerPromise === null) {
        playerPromise = sdkPromise.then((sdk) => sdk.getPlayer());
      }
      return playerPromise;
    },
    refresh() {
      playerPromise = sdkPromise.then((sdk) => sdk.getPlayer());
      return playerPromise;
    },
  };
}

function createYandexReadiness(
  sdk: YandexSdkLike,
  reportTechnicalError: TechnicalErrorReporter,
): PlatformReadinessPort {
  let attempted = false;

  return {
    async ready() {
      if (attempted) return;
      attempted = true;

      const loadingApi = sdk.features?.LoadingAPI;
      const ready = loadingApi?.ready;
      if (typeof ready !== 'function') return;

      try {
        await ready.call(loadingApi);
      } catch (error) {
        reportTechnicalError('readiness_failed', 'lifecycle');
        console.warn('[Dungeon Logic] Yandex Game Ready signal failed; continuing gameplay.', error);
      }
    },
  };
}

function createYandexGameplay(
  sdk: YandexSdkLike,
  reportTechnicalError: TechnicalErrorReporter,
): GameplayMarkupPort {
  let active = false;

  const transition = async (nextActive: boolean): Promise<void> => {
    if (active === nextActive) return;
    active = nextActive;

    const gameplayApi = sdk.features?.GameplayAPI;
    const method = nextActive ? gameplayApi?.start : gameplayApi?.stop;
    if (typeof method !== 'function') return;

    try {
      await method.call(gameplayApi);
    } catch (error) {
      if (active === nextActive) active = !nextActive;
      reportTechnicalError('gameplay_api_failed', 'lifecycle');
      console.warn(`[Dungeon Logic] Yandex GameplayAPI.${nextActive ? 'start' : 'stop'} failed; continuing gameplay.`, error);
    }
  };

  return {
    start: () => transition(true),
    stop: () => transition(false),
  };
}

function readYandexLanguage(sdk: YandexSdkLike): string | null {
  const language = sdk.environment?.i18n?.lang;
  return typeof language === 'string' && language.length > 0 ? language : null;
}

function createYandexStorage(
  playerProvider: YandexPlayerProvider,
): PlayerStorage {
  return {
    async load() {
      const player = await playerProvider.get();
      const data = await player.getData([YANDEX_PROFILE_DATA_KEY]);
      return data[YANDEX_PROFILE_DATA_KEY] ?? null;
    },
    async save(value: unknown) {
      const player = await playerProvider.get();
      await player.setData({ [YANDEX_PROFILE_DATA_KEY]: value }, true);
    },
  };
}

function createYandexClock(
  sdkPromise: Promise<YandexSdkLike>,
): TrustedClock {
  return {
    async now() {
      try {
        const sdk = await sdkPromise;
        if (typeof sdk.serverTime !== 'function') return null;
        const timestamp = sdk.serverTime();
        if (!Number.isFinite(timestamp)) return null;
        const result = new Date(timestamp);
        return Number.isNaN(result.getTime()) ? null : result;
      } catch {
        return null;
      }
    },
  };
}

function createYandexAds(
  sdkPromise: Promise<YandexSdkLike>,
  reportTechnicalError: TechnicalErrorReporter,
): AdsPort {
  return {
    async showInterstitial(): Promise<InterstitialResult> {
      let sdk: YandexSdkLike;
      try {
        sdk = await sdkPromise;
      } catch {
        reportTechnicalError('interstitial_request_failed', 'ads');
        return 'unavailable';
      }

      const adv = sdk.adv;
      const showFullscreenAdv = adv?.showFullscreenAdv;
      if (typeof showFullscreenAdv !== 'function') return 'unavailable';

      return new Promise<InterstitialResult>((resolve) => {
        let settled = false;
        const finish = (result: InterstitialResult): void => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        try {
          showFullscreenAdv.call(adv, {
            callbacks: {
              onClose: (wasShown) => finish(wasShown ? 'shown' : 'skipped'),
              onError: () => {
                reportTechnicalError('interstitial_request_failed', 'ads');
                finish('unavailable');
              },
            },
          });
        } catch {
          reportTechnicalError('interstitial_request_failed', 'ads');
          finish('unavailable');
        }
      });
    },

    async showRewarded(): Promise<RewardedResult> {
      let sdk: YandexSdkLike;
      try {
        sdk = await sdkPromise;
      } catch {
        reportTechnicalError('rewarded_request_failed', 'ads');
        return 'unavailable';
      }

      const adv = sdk.adv;
      const showRewardedVideo = adv?.showRewardedVideo;
      if (typeof showRewardedVideo !== 'function') return 'unavailable';

      return new Promise<RewardedResult>((resolve) => {
        let settled = false;
        let rewarded = false;
        const finish = (result: RewardedResult): void => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        try {
          showRewardedVideo.call(adv, {
            callbacks: {
              onRewarded: () => {
                rewarded = true;
              },
              onClose: () => finish(rewarded ? 'rewarded' : 'closed'),
              onError: () => {
                reportTechnicalError('rewarded_request_failed', 'ads');
                finish('unavailable');
              },
            },
          });
        } catch {
          reportTechnicalError('rewarded_request_failed', 'ads');
          finish('unavailable');
        }
      });
    },
  };
}

function normalizeLeaderboardEntry(
  entry: YandexLeaderboardEntryLike,
  currentUniqueId: string | null,
): LeaderboardPlayerView {
  const publicName = entry.player?.publicName?.trim();
  const avatar = entry.player?.getAvatarSrc?.('small');
  return {
    place: Math.max(1, Math.floor(entry.rank) + 1),
    score: Math.max(0, Number.isFinite(entry.score) ? entry.score : 0),
    publicName: publicName && publicName.length > 0 ? publicName : 'Player',
    avatarUrl: typeof avatar === 'string' && avatar.length > 0 ? avatar : null,
    isCurrentPlayer: currentUniqueId !== null && entry.player?.uniqueID === currentUniqueId,
  };
}

function createYandexLeaderboards(
  sdkPromise: Promise<YandexSdkLike>,
  playerProvider: YandexPlayerProvider,
  reportTechnicalError: TechnicalErrorReporter,
): LeaderboardsPort {
  const authorized = async (): Promise<boolean> => {
    try {
      const player = await playerProvider.get();
      return typeof player.isAuthorized === 'function' && player.isAuthorized();
    } catch {
      return false;
    }
  };

  const methodAvailable = async (method: string): Promise<boolean> => {
    try {
      const sdk = await sdkPromise;
      if (typeof sdk.isAvailableMethod !== 'function') return true;
      return await sdk.isAvailableMethod(method);
    } catch {
      return false;
    }
  };

  const currentUniqueIdFrom = (raw: YandexLeaderboardEntryLike | null): string | null => (
    typeof raw?.player?.uniqueID === 'string' && raw.player.uniqueID.length > 0
      ? raw.player.uniqueID
      : null
  );

  return {
    isAuthorized: authorized,

    async requestAuthorization() {
      try {
        if (await authorized()) return true;
        const sdk = await sdkPromise;
        const openAuthDialog = sdk.auth?.openAuthDialog;
        if (typeof openAuthDialog !== 'function') return false;
        await openAuthDialog.call(sdk.auth);
        const player = await playerProvider.refresh();
        return typeof player.isAuthorized === 'function' && player.isAuthorized();
      } catch {
        return false;
      }
    },

    async submitScore(name, score, extraData) {
      if (!Number.isFinite(score) || score < 0) return 'unavailable';
      if (!await authorized()) return 'unauthorized';
      if (!await methodAvailable('leaderboards.setScore')) return 'unavailable';
      try {
        const sdk = await sdkPromise;
        const setScore = sdk.leaderboards?.setScore;
        if (typeof setScore !== 'function') return 'unavailable';
        await setScore.call(sdk.leaderboards, name, score, extraData);
        return 'submitted';
      } catch (error) {
        reportTechnicalError('leaderboard_submit_failed', 'leaderboard');
        console.warn('[Dungeon Logic] Could not submit leaderboard score.', error);
        return 'unavailable';
      }
    },

    async getPlayerEntry(name) {
      if (!await authorized()) return null;
      if (!await methodAvailable('leaderboards.getPlayerEntry')) return null;
      try {
        const sdk = await sdkPromise;
        const getPlayerEntry = sdk.leaderboards?.getPlayerEntry;
        if (typeof getPlayerEntry !== 'function') return null;
        const raw = await getPlayerEntry.call(sdk.leaderboards, name);
        return normalizeLeaderboardEntry(raw, currentUniqueIdFrom(raw));
      } catch {
        reportTechnicalError('leaderboard_load_failed', 'leaderboard');
        return null;
      }
    },

    async getEntries(name, options) {
      if (!await methodAvailable('leaderboards.getEntries')) return null;
      try {
        const sdk = await sdkPromise;
        const getEntries = sdk.leaderboards?.getEntries;
        if (typeof getEntries !== 'function') return null;
        const includeUser = options?.includeUser === true && await authorized();
        const raw = await getEntries.call(sdk.leaderboards, name, {
          includeUser,
          quantityAround: options?.quantityAround,
          quantityTop: options?.quantityTop,
        });
        const currentRaw = includeUser && typeof sdk.leaderboards?.getPlayerEntry === 'function'
          ? await sdk.leaderboards.getPlayerEntry(name).catch(() => {
              reportTechnicalError('leaderboard_load_failed', 'leaderboard');
              return null;
            })
          : null;
        const currentUniqueId = currentUniqueIdFrom(currentRaw);
        const entries = (raw.entries ?? []).map((entry) => normalizeLeaderboardEntry(entry, currentUniqueId));
        const currentPlayer = currentRaw === null
          ? entries.find((entry) => entry.isCurrentPlayer) ?? null
          : normalizeLeaderboardEntry(currentRaw, currentUniqueId);
        return { entries, currentPlayer };
      } catch (error) {
        reportTechnicalError('leaderboard_load_failed', 'leaderboard');
        console.warn('[Dungeon Logic] Could not load leaderboard entries.', error);
        return null;
      }
    },
  };
}

function createYandexLifecycle(
  sdk: YandexSdkLike,
): GameLifecyclePort {
  let paused = false;
  const subscribers = new Set<GameLifecycleHandlers>();

  const pause = (): void => {
    paused = true;
    for (const handlers of subscribers) handlers.onPause();
  };
  const resume = (): void => {
    paused = false;
    for (const handlers of subscribers) handlers.onResume();
  };

  if (typeof sdk.on === 'function') {
    sdk.on('game_api_pause', pause);
    sdk.on('game_api_resume', resume);
  }

  return {
    isPaused() {
      return paused;
    },
    subscribe(handlers) {
      subscribers.add(handlers);
      return () => {
        subscribers.delete(handlers);
      };
    },
  };
}

export async function createYandexPlatformServices(
  globals: YandexGlobalScopeLike = globalThis as unknown as YandexGlobalScopeLike,
  reportTechnicalError: TechnicalErrorReporter = () => {},
): Promise<PlatformServices | null> {
  const init = globals.YaGames?.init;
  if (typeof init !== 'function') return null;

  const sdkPromise = Promise.resolve().then(() => init.call(globals.YaGames));

  let sdk: YandexSdkLike;
  try {
    sdk = await sdkPromise;
  } catch (error) {
    reportTechnicalError('platform_init_failed', 'platform');
    console.warn('[Dungeon Logic] Yandex Games SDK initialization failed; using local platform fallback.', error);
    return null;
  }

  const playerProvider = createYandexPlayerProvider(sdkPromise);

  return {
    kind: 'yandex',
    storage: createYandexStorage(playerProvider),
    clock: createYandexClock(sdkPromise),
    ads: createYandexAds(sdkPromise, reportTechnicalError),
    readiness: createYandexReadiness(sdk, reportTechnicalError),
    environment: { language: readYandexLanguage(sdk) },
    gameplay: createYandexGameplay(sdk, reportTechnicalError),
    lifecycle: createYandexLifecycle(sdk),
    leaderboards: createYandexLeaderboards(sdkPromise, playerProvider, reportTechnicalError),
  };
}
