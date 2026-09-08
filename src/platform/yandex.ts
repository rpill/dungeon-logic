import type {
  AdsPort,
  GameLifecyclePort,
  InterstitialResult,
  PlatformServices,
  PlayerStorage,
  RewardedResult,
  TrustedClock,
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

interface YandexSdkLike {
  getPlayer(): Promise<YandexPlayerLike>;
  serverTime?: () => number;
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
  return {
    subscribe(handlers) {
      if (typeof sdk.on !== 'function' || typeof sdk.off !== 'function') {
        return () => {};
      }

      const pause = (): void => handlers.onPause();
      const resume = (): void => handlers.onResume();
      sdk.on('game_api_pause', pause);
      sdk.on('game_api_resume', resume);

      return () => {
        sdk.off?.('game_api_pause', pause);
        sdk.off?.('game_api_resume', resume);
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
    lifecycle: createYandexLifecycle(sdk),
  };
}
