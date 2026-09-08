interface DungeonLogicYandexPlayer {
  getData(keys?: readonly string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
}

interface DungeonLogicYandexAdCallbacks {
  onOpen?: () => void;
  onClose?: (wasShown: boolean) => void;
  onError?: (error: unknown) => void;
}

interface DungeonLogicYandexRewardedCallbacks extends DungeonLogicYandexAdCallbacks {
  onRewarded?: () => void;
}

interface DungeonLogicYandexSdk {
  getPlayer(): Promise<DungeonLogicYandexPlayer>;
  serverTime?: () => number;
  adv?: {
    showFullscreenAdv?: (options?: { callbacks?: DungeonLogicYandexAdCallbacks }) => void;
    showRewardedVideo?: (options?: { callbacks?: DungeonLogicYandexRewardedCallbacks }) => void;
  };
  on?: (event: 'game_api_pause' | 'game_api_resume', handler: () => void) => void;
  off?: (event: 'game_api_pause' | 'game_api_resume', handler: () => void) => void;
}

interface DungeonLogicYaGamesGlobal {
  init(): Promise<DungeonLogicYandexSdk>;
}

declare var YaGames: DungeonLogicYaGamesGlobal | undefined;

interface Window {
  YaGames?: DungeonLogicYaGamesGlobal;
}
