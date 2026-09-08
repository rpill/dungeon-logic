import type { PlayerStorage } from '../platform/services';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfileV1 } from './types';

export class PlatformPlayerProfileStorage implements PlayerProfileStorage {
  private readonly platformStorage: PlayerStorage;
  private readonly localMigrationStorage: PlayerProfileStorage | undefined;

  constructor(
    platformStorage: PlayerStorage,
    localMigrationStorage?: PlayerProfileStorage,
  ) {
    this.platformStorage = platformStorage;
    this.localMigrationStorage = localMigrationStorage;
  }

  async load(): Promise<unknown | null> {
    let platformValue: unknown | null = null;
    try {
      platformValue = await this.platformStorage.load();
    } catch (error) {
      console.warn('[Dungeon Logic] Could not load platform player profile; checking local migration data.', error);
    }
    if (platformValue !== null) return platformValue;
    if (this.localMigrationStorage === undefined) return null;

    const localValue = await this.localMigrationStorage.load();
    if (localValue === null) return null;

    try {
      await this.platformStorage.save(localValue);
    } catch (error) {
      console.warn('[Dungeon Logic] Could not promote local player profile into platform storage yet.', error);
    }
    return localValue;
  }

  async save(profile: PlayerProfileV1): Promise<void> {
    await this.platformStorage.save(profile);
  }

  async loadLegacyCampaignProgress(): Promise<unknown | null> {
    return this.localMigrationStorage?.loadLegacyCampaignProgress?.() ?? null;
  }
}
