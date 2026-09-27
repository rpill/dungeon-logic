import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { PlayerStorage } from '../platform/services';
import { isSupportedPlayerProfile } from './PlayerProfile';
import type { PlayerProfileStorage } from './PlayerProfileStorage';
import type { PlayerProfile } from './types';

export class PlatformPlayerProfileStorage implements PlayerProfileStorage {
  private readonly platformStorage: PlayerStorage;
  private readonly localFallbackStorage: PlayerProfileStorage | undefined;
  private readonly reportTechnicalError: TechnicalErrorReporter;
  private primaryWritesBlocked = false;

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
    let platformLoadSucceeded = false;
    try {
      platformValue = await this.platformStorage.load();
      platformLoadSucceeded = true;
      this.primaryWritesBlocked = false;
    } catch (error) {
      this.primaryWritesBlocked = true;
      this.reportTechnicalError('profile_load_failed', 'profile');
      console.warn('[Dungeon Logic] Could not load platform player profile; checking local profile fallback.', error);
    }
    if (platformValue !== null) return platformValue;
    if (this.localFallbackStorage === undefined) return null;

    const localValue = await this.localFallbackStorage.load();
    if (localValue === null) return null;

    if (platformLoadSucceeded && isSupportedPlayerProfile(localValue)) {
      try {
        await this.platformStorage.save(localValue);
      } catch (error) {
        this.reportTechnicalError('profile_save_failed', 'profile');
        console.warn('[Dungeon Logic] Could not promote local player profile into platform storage yet.', error);
      }
    }
    return localValue;
  }

  async loadPrimary(): Promise<unknown | null> {
    try {
      const value = await this.platformStorage.load();
      this.primaryWritesBlocked = false;
      return value;
    } catch (error) {
      this.primaryWritesBlocked = true;
      this.reportTechnicalError('profile_load_failed', 'profile');
      throw error;
    }
  }

  prepareForAccountTransition(): void {
    this.primaryWritesBlocked = true;
  }

  cancelAccountTransition(): void {
    this.primaryWritesBlocked = false;
  }

  async save(profile: PlayerProfile): Promise<void> {
    if (this.primaryWritesBlocked) {
      if (this.localFallbackStorage !== undefined) {
        await this.localFallbackStorage.save(profile);
        return;
      }
      throw new Error('Platform profile writes are blocked until the current account profile is loaded.');
    }
    await this.platformStorage.save(profile);
  }
}
