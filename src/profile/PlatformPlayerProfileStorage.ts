import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { PlayerStorage } from '../platform/services';
import { isSupportedPlayerProfile } from './PlayerProfile';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfile } from './types';

export class PlatformPlayerProfileStorage implements PlayerProfileStorage {
  private readonly platformStorage: PlayerStorage;
  private readonly localFallbackStorage: PlayerProfileStorage | undefined;
  private readonly reportTechnicalError: TechnicalErrorReporter;

  constructor(
    platformStorage: PlayerStorage,
    localFallbackStorage?: PlayerProfileStorage,
    reportTechnicalError: TechnicalErrorReporter = () => {},
  ) {
    this.platformStorage = platformStorage;
    this.localFallbackStorage = localFallbackStorage;
    this.reportTechnicalError = reportTechnicalError;
  }

  async load(): Promise<unknown | null> {
    let platformValue: unknown | null = null;
    try {
      platformValue = await this.platformStorage.load();
    } catch (error) {
      this.reportTechnicalError('profile_load_failed', 'profile');
      console.warn('[Dungeon Logic] Could not load platform player profile; checking local profile fallback.', error);
    }
    if (platformValue !== null) return platformValue;
    if (this.localFallbackStorage === undefined) return null;

    const localValue = await this.localFallbackStorage.load();
    if (localValue === null) return null;

    if (isSupportedPlayerProfile(localValue)) {
      try {
        await this.platformStorage.save(localValue);
      } catch (error) {
        this.reportTechnicalError('profile_save_failed', 'profile');
        console.warn('[Dungeon Logic] Could not promote local player profile into platform storage yet.', error);
      }
    }
    return localValue;
  }

  async save(profile: PlayerProfile): Promise<void> {
    await this.platformStorage.save(profile);
  }
}
