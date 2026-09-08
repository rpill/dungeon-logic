import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerSettings } from '../profile/types';

export type SupportedLanguage = 'ru' | 'en';

export interface VibrationNavigatorLike {
  readonly vibrate?: unknown;
}

export function detectVibrationSupport(value: VibrationNavigatorLike | null | undefined): boolean {
  return typeof value?.vibrate === 'function';
}

export interface SettingsServiceOptions {
  readonly vibrationSupported: boolean;
}

export class SettingsService {
  private readonly profileService: PlayerProfileService;
  private readonly vibrationSupported: boolean;

  constructor(
    profileService: PlayerProfileService,
    options: SettingsServiceOptions,
  ) {
    this.profileService = profileService;
    this.vibrationSupported = options.vibrationSupported;
  }

  getSettings(): PlayerSettings {
    return this.profileService.getProfile().settings;
  }

  isVibrationSupported(): boolean {
    return this.vibrationSupported;
  }

  async setMusicEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ musicEnabled: enabled });
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ soundEnabled: enabled });
  }

  async setVibrationEnabled(enabled: boolean): Promise<void> {
    if (!this.vibrationSupported) return;
    await this.updateSettings({ vibrationEnabled: enabled });
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    await this.updateSettings({ language });
  }

  async resetProgress(): Promise<void> {
    const preservedSettings = this.getSettings();
    this.profileService.update(() => ({
      ...createFreshPlayerProfile(),
      settings: preservedSettings,
    }));
    await this.profileService.flush();
  }

  private async updateSettings(patch: Partial<PlayerSettings>): Promise<void> {
    this.profileService.update((profile) => ({
      ...profile,
      settings: {
        ...profile.settings,
        ...patch,
      },
    }));
    await this.profileService.flush();
  }
}
