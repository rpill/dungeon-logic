import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfile } from './types';

export const PLAYER_PROFILE_STORAGE_KEY = 'dungeon-logic:player-profile:v1';

export interface ProfileKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalPlayerProfileStorage implements PlayerProfileStorage {
  private readonly storage: ProfileKeyValueStorage | null;
  private memoryProfileValue: string | null = null;
  private warned = false;

  constructor(storage?: ProfileKeyValueStorage | null) {
    if (storage !== undefined) {
      this.storage = storage;
      return;
    }

    let resolved: ProfileKeyValueStorage | null = null;
    try {
      resolved = globalThis.localStorage ?? null;
    } catch (error) {
      this.warnOnce('localStorage is unavailable; player profile will be kept in memory.', error);
    }
    this.storage = resolved;
  }

  async load(): Promise<unknown | null> {
    let serialized = this.memoryProfileValue;

    if (this.storage !== null) {
      try {
        const stored = this.storage.getItem(PLAYER_PROFILE_STORAGE_KEY);
        if (stored !== null) {
          serialized = stored;
          this.memoryProfileValue = stored;
        }
      } catch (error) {
        this.warnOnce('Could not read player profile from localStorage; using in-memory data.', error);
      }
    }

    if (serialized === null) return null;
    try {
      return JSON.parse(serialized) as unknown;
    } catch (error) {
      this.warnOnce('Could not parse player profile; ignoring invalid stored data.', error);
      return null;
    }
  }

  async save(profile: PlayerProfile): Promise<void> {
    const serialized = JSON.stringify(profile);
    this.memoryProfileValue = serialized;

    if (this.storage === null) {
      this.warnOnce('localStorage is unavailable; player profile will be kept in memory.');
      return;
    }

    try {
      this.storage.setItem(PLAYER_PROFILE_STORAGE_KEY, serialized);
    } catch (error) {
      this.warnOnce('Could not persist player profile to localStorage; keeping it in memory.', error);
    }
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) return;
    this.warned = true;
    if (error === undefined) console.warn(`[Dungeon Logic] ${message}`);
    else console.warn(`[Dungeon Logic] ${message}`, error);
  }
}
