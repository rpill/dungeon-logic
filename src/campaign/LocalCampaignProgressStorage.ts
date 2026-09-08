import type { CampaignProgressV1 } from './types';
import type { CampaignProgressStorage } from './CampaignProgressStorage';

export const CAMPAIGN_PROGRESS_STORAGE_KEY = 'dungeon-logic:campaign-progress:v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalCampaignProgressStorage implements CampaignProgressStorage {
  private readonly storage: KeyValueStorage | null;
  private memoryValue: string | null = null;
  private warned = false;

  constructor(storage?: KeyValueStorage | null) {
    if (storage !== undefined) {
      this.storage = storage;
      return;
    }

    let resolved: KeyValueStorage | null = null;
    try {
      resolved = globalThis.localStorage ?? null;
    } catch (error) {
      this.warnOnce('localStorage is unavailable; campaign progress will be kept in memory.', error);
    }
    this.storage = resolved;
  }

  async load(): Promise<CampaignProgressV1 | null> {
    let serialized: string | null = this.memoryValue;

    if (this.storage !== null) {
      try {
        const stored = this.storage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY);
        if (stored !== null) {
          serialized = stored;
          this.memoryValue = stored;
        }
      } catch (error) {
        this.warnOnce('Could not read campaign progress from localStorage; using in-memory progress.', error);
      }
    }

    if (serialized === null) return null;
    return JSON.parse(serialized) as CampaignProgressV1;
  }

  async save(progress: CampaignProgressV1): Promise<void> {
    const serialized = JSON.stringify(progress);
    this.memoryValue = serialized;

    if (this.storage === null) {
      this.warnOnce('localStorage is unavailable; campaign progress will be kept in memory.');
      return;
    }

    try {
      this.storage.setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, serialized);
    } catch (error) {
      this.warnOnce('Could not persist campaign progress to localStorage; keeping it in memory.', error);
    }
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) return;
    this.warned = true;
    if (error === undefined) {
      console.warn(`[Dungeon Logic] ${message}`);
    } else {
      console.warn(`[Dungeon Logic] ${message}`, error);
    }
  }
}
