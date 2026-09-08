export type InterstitialResult = 'shown' | 'skipped' | 'unavailable';
export type RewardedResult = 'rewarded' | 'closed' | 'unavailable';

export interface PlayerStorage {
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
}

export interface TrustedClock {
  now(): Promise<Date | null>;
}

export interface AdsPort {
  showInterstitial(): Promise<InterstitialResult>;
  showRewarded(): Promise<RewardedResult>;
}

export interface GameLifecycleHandlers {
  onPause(): void;
  onResume(): void;
}

export interface GameLifecyclePort {
  subscribe(handlers: GameLifecycleHandlers): () => void;
}

export interface PlatformServices {
  readonly kind: 'local' | 'yandex';
  readonly storage: PlayerStorage;
  readonly clock: TrustedClock;
  readonly ads: AdsPort;
  readonly lifecycle: GameLifecyclePort;
}
