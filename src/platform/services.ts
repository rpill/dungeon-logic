export type RewardedResult = 'rewarded' | 'closed' | 'unavailable';

export interface PlayerStorage {
  /** Stable namespace for the currently resolved platform identity. */
  scope?(): Promise<string>;
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
}

export interface TrustedClock {
  now(): Promise<Date | null>;
}

export interface AdsPort {
  showRewarded(): Promise<RewardedResult>;
}



export type LeaderboardSubmitResult = 'submitted' | 'unauthorized' | 'unavailable';

export interface LeaderboardPlayerView {
  readonly place: number;
  readonly score: number;
  readonly publicName: string;
  readonly avatarUrl: string | null;
  readonly isCurrentPlayer: boolean;
}

export interface LeaderboardSnapshot {
  readonly entries: readonly LeaderboardPlayerView[];
  readonly currentPlayer: LeaderboardPlayerView | null;
}

export interface LeaderboardsPort {
  isAuthorized(): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  submitScore(name: string, score: number, extraData?: string): Promise<LeaderboardSubmitResult>;
  getPlayerEntry(name: string): Promise<LeaderboardPlayerView | null>;
  getEntries(
    name: string,
    options?: { readonly quantityTop?: number; readonly quantityAround?: number; readonly includeUser?: boolean },
  ): Promise<LeaderboardSnapshot | null>;
}

export interface PlatformReadinessPort {
  ready(): Promise<void>;
}

export interface PlatformEnvironment {
  readonly language: string | null;
}

export interface GameplayMarkupPort {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface GameLifecycleHandlers {
  onPause(): void;
  onResume(): void;
}

export interface GameLifecyclePort {
  isPaused(): boolean;
  subscribe(handlers: GameLifecycleHandlers): () => void;
}

export interface PlatformServices {
  readonly kind: 'local' | 'yandex';
  readonly storage: PlayerStorage;
  readonly clock: TrustedClock;
  readonly ads: AdsPort;
  readonly readiness: PlatformReadinessPort;
  readonly environment: PlatformEnvironment;
  readonly gameplay: GameplayMarkupPort;
  readonly lifecycle: GameLifecyclePort;
  readonly leaderboards: LeaderboardsPort;
}
