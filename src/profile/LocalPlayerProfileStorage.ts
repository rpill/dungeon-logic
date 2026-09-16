import { CAMPAIGN_PROGRESS_STORAGE_KEY } from '../campaign/LocalCampaignProgressStorage';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfileV5 } from './types';

export const PLAYER_PROFILE_STORAGE_KEY = 'dungeon-logic:player-profile:v1';

export interface ProfileKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalPlayerProfileStorage implements PlayerProfileStorage {
  private readonly storage: ProfileKeyValueStorage | null;
  private memoryProfileValue: string | null = null;
  private memoryLegacyValue: string | null = null;
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
    const serialized = this.readValue(PLAYER_PROFILE_STORAGE_KEY, 'profile');
    return this.parse(serialized, 'player profile');
  }

  async loadLegacyCampaignProgress(): Promise<unknown | null> {
    const serialized = this.readValue(CAMPAIGN_PROGRESS_STORAGE_KEY, 'legacy');
    return this.parse(serialized, 'legacy campaign progress');
  }

  async save(profile: PlayerProfileV5): Promise<void> {
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

  private readValue(key: string, kind: 'profile' | 'legacy'): string | null {
    let serialized = kind === 'profile' ? this.memoryProfileValue : this.memoryLegacyValue;

    if (this.storage !== null) {
      try {
        const stored = this.storage.getItem(key);
        if (stored !== null) {
          serialized = stored;
          if (kind === 'profile') this.memoryProfileValue = stored;
          else this.memoryLegacyValue = stored;
        }
      } catch (error) {
        this.warnOnce(`Could not read ${kind} data from localStorage; using in-memory data.`, error);
      }
    }

    return serialized;
  }

  private parse(serialized: string | null, label: string): unknown | null {
    if (serialized === null) return null;
    try {
      return JSON.parse(serialized) as unknown;
    } catch (error) {
      this.warnOnce(`Could not parse ${label}; ignoring invalid stored data.`, error);
      return null;
    }
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) return;
    this.warned = true;
    if (error === undefined) console.warn(`[Dungeon Logic] ${message}`);
    else console.warn(`[Dungeon Logic] ${message}`, error);
  }
}
