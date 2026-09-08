import type {
  AdsPort,
  GameLifecycleHandlers,
  GameLifecyclePort,
  InterstitialResult,
  PlatformServices,
  PlayerStorage,
  RewardedResult,
  TrustedClock,
  PlatformReadinessPort,
  GameplayMarkupPort,
} from './services';

export const YANDEX_PROFILE_DATA_KEY = 'dungeonLogicProfile';

interface YandexPlayerLike {
  getData(keys?: readonly string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
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

interface YandexSdkLike {
  getPlayer(): Promise<YandexPlayerLike>;
  serverTime?: () => number;
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

function createYandexReadiness(
  sdk: YandexSdkLike,
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
        console.warn('[Dungeon Logic] Yandex Game Ready signal failed; continuing gameplay.', error);
      }
    },
  };
}

function createYandexGameplay(
  sdk: YandexSdkLike,
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
  sdkPromise: Promise<YandexSdkLike>,
): PlayerStorage {
  let playerPromise: Promise<YandexPlayerLike> | null = null;

  const getPlayer = (): Promise<YandexPlayerLike> => {
    if (playerPromise === null) {
      playerPromise = sdkPromise.then((sdk) => sdk.getPlayer());
    }
    return playerPromise;
  };

  return {
    async load() {
      const player = await getPlayer();
      const data = await player.getData([YANDEX_PROFILE_DATA_KEY]);
      return data[YANDEX_PROFILE_DATA_KEY] ?? null;
    },
    async save(value: unknown) {
      const player = await getPlayer();
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
): AdsPort {
  return {
    async showInterstitial(): Promise<InterstitialResult> {
      let sdk: YandexSdkLike;
      try {
        sdk = await sdkPromise;
      } catch {
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
              onError: () => finish('unavailable'),
            },
          });
        } catch {
          finish('unavailable');
        }
      });
    },

    async showRewarded(): Promise<RewardedResult> {
      let sdk: YandexSdkLike;
      try {
        sdk = await sdkPromise;
      } catch {
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
              onError: () => finish('unavailable'),
            },
          });
        } catch {
          finish('unavailable');
        }
      });
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
): Promise<PlatformServices | null> {
  const init = globals.YaGames?.init;
  if (typeof init !== 'function') return null;

  const sdkPromise = Promise.resolve().then(() => init.call(globals.YaGames));

  let sdk: YandexSdkLike;
  try {
    sdk = await sdkPromise;
  } catch (error) {
    console.warn('[Dungeon Logic] Yandex Games SDK initialization failed; using local platform fallback.', error);
    return null;
  }

  return {
    kind: 'yandex',
    storage: createYandexStorage(sdkPromise),
    clock: createYandexClock(sdkPromise),
    ads: createYandexAds(sdkPromise),
    readiness: createYandexReadiness(sdk),
    environment: { language: readYandexLanguage(sdk) },
    gameplay: createYandexGameplay(sdk),
    lifecycle: createYandexLifecycle(sdk),
  };
}
