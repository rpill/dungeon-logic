import type { PlatformServices, PlayerStorage } from './services';

export const LOCAL_PLATFORM_PROFILE_KEY = 'dungeon-logic:player-profile:v1';

export interface BrowserKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

class LocalPlatformPlayerStorage implements PlayerStorage {
  private readonly browserStorage: BrowserKeyValueStorage | null;
  private memoryValue: unknown | null = null;
  private warned = false;

  constructor(storage?: BrowserKeyValueStorage | null) {
    if (storage !== undefined) {
      this.browserStorage = storage;
      return;
    }

    try {
      this.browserStorage = globalThis.localStorage ?? null;
    } catch (error) {
      this.browserStorage = null;
      this.warnOnce('localStorage is unavailable; platform profile will stay in memory.', error);
    }
  }

  async scope(): Promise<string> {
    return 'browser-local';
  }

  async load(): Promise<unknown | null> {
    if (this.browserStorage === null) return this.memoryValue;

    try {
      const serialized = this.browserStorage.getItem(LOCAL_PLATFORM_PROFILE_KEY);
      if (serialized === null) return this.memoryValue;

      const parsed = JSON.parse(serialized) as unknown;
      this.memoryValue = parsed;
      return parsed;
    } catch (error) {
      this.warnOnce('Could not read platform profile from localStorage; using in-memory data.', error);
      return this.memoryValue;
    }
  }

  async save(value: unknown): Promise<void> {
    this.memoryValue = value;
    if (this.browserStorage === null) return;

    try {
      this.browserStorage.setItem(LOCAL_PLATFORM_PROFILE_KEY, JSON.stringify(value));
    } catch (error) {
      this.warnOnce('Could not persist platform profile to localStorage; keeping it in memory.', error);
    }
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) return;
    this.warned = true;
    if (error === undefined) console.warn(`[Dungeon Logic] ${message}`);
    else console.warn(`[Dungeon Logic] ${message}`, error);
  }
}

export function createLocalPlatformServices(
  storage?: BrowserKeyValueStorage | null,
): PlatformServices {
  return {
    kind: 'local',
    storage: new LocalPlatformPlayerStorage(storage),
    clock: {
      async now() {
        return null;
      },
    },
    readiness: {
      async ready() {},
    },
    environment: {
      language: null,
    },
    gameplay: {
      async start() {},
      async stop() {},
    },
    ads: {
      async showRewarded() {
        return 'unavailable';
      },
    },
    lifecycle: {
      isPaused() {
        return false;
      },
      subscribe() {
        return () => {};
      },
    },
    leaderboards: {
      async isAuthorized() { return false; },
      async requestAuthorization() { return false; },
      async submitScore() { return 'unavailable'; },
      async getPlayerEntry() { return null; },
      async getEntries() { return null; },
    },
  };
}
