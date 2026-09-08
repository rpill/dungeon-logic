import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  createFreshPlayerProfile,
  migrateLegacyCampaignProgress,
  normalizePlayerProfile,
} from './PlayerProfile';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfileV1 } from './types';

export const PLAYER_PROFILE_SERVICE_REGISTRY_KEY = 'player-profile-service';

export interface PlayerProfileServiceOptions {
  readonly saveDelayMs?: number;
}

export class PlayerProfileService {
  private readonly manifest: readonly CampaignLevelEntry[];
  private readonly storage: PlayerProfileStorage;
  private readonly saveDelayMs: number;

  private profile: PlayerProfileV1;
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  private constructor(
    manifest: readonly CampaignLevelEntry[],
    storage: PlayerProfileStorage,
    profile: PlayerProfileV1,
    saveDelayMs: number,
  ) {
    this.manifest = manifest;
    this.storage = storage;
    this.profile = profile;
    this.saveDelayMs = saveDelayMs;
  }

  static async create(
    manifest: readonly CampaignLevelEntry[],
    storage: PlayerProfileStorage,
    options: PlayerProfileServiceOptions = {},
  ): Promise<PlayerProfileService> {
    const saveDelayMs = Math.max(0, options.saveDelayMs ?? 5000);

    let loaded: unknown | null = null;
    try {
      loaded = await storage.load();
    } catch (error) {
      console.warn('[Dungeon Logic] Could not load player profile; checking legacy progress.', error);
    }

    if (loaded !== null) {
      return new PlayerProfileService(
        manifest,
        storage,
        normalizePlayerProfile(loaded, manifest),
        saveDelayMs,
      );
    }

    let legacy: unknown | null = null;
    if (storage.loadLegacyCampaignProgress !== undefined) {
      try {
        legacy = await storage.loadLegacyCampaignProgress();
      } catch (error) {
        console.warn('[Dungeon Logic] Could not load legacy campaign progress; starting fresh.', error);
      }
    }

    const profile = legacy === null
      ? createFreshPlayerProfile(manifest)
      : migrateLegacyCampaignProgress(legacy, manifest);
    const service = new PlayerProfileService(manifest, storage, profile, saveDelayMs);

    if (legacy !== null) {
      try {
        await storage.save(profile);
      } catch (error) {
        service.dirty = true;
        service.scheduleSave();
        console.warn('[Dungeon Logic] Could not persist migrated player profile immediately; retry scheduled.', error);
      }
    }

    return service;
  }

  getProfile(): PlayerProfileV1 {
    return this.profile;
  }

  update(
    mutator: (profile: PlayerProfileV1) => PlayerProfileV1,
  ): PlayerProfileV1 {
    const safeCurrent = normalizePlayerProfile(this.profile, this.manifest);
    const candidate = mutator(safeCurrent);
    this.profile = normalizePlayerProfile(candidate, this.manifest);
    this.dirty = true;
    this.scheduleSave();
    return this.profile;
  }

  replaceProfileForPlatformMerge(profile: PlayerProfileV1): PlayerProfileV1 {
    this.profile = normalizePlayerProfile(profile, this.manifest);
    this.dirty = true;
    this.scheduleSave();
    return this.profile;
  }

  async flush(): Promise<void> {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    if (this.flushPromise !== null) return this.flushPromise;
    if (!this.dirty) return;

    this.flushPromise = this.performFlush().finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flush().catch((error) => {
        console.warn('[Dungeon Logic] Could not persist player profile; keeping dirty in-memory state.', error);
      });
    }, this.saveDelayMs);
  }

  private async performFlush(): Promise<void> {
    while (this.dirty) {
      this.dirty = false;
      const snapshot = this.profile;
      try {
        await this.storage.save(snapshot);
      } catch (error) {
        this.dirty = true;
        throw error;
      }
    }
  }
}
