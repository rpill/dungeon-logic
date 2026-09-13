import { setBackgroundMusicEnabled } from '../audio/MusicService';
import type { SupportedLanguage } from '../i18n/Language';
import { createFreshPlayerProfile } from '../profile/PlayerProfile';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerSettings } from '../profile/types';

export type { SupportedLanguage } from '../i18n/Language';

export class SettingsService {
  private readonly profileService: PlayerProfileService;

  constructor(profileService: PlayerProfileService) {
    this.profileService = profileService;
  }

  getSettings(): PlayerSettings {
    return this.profileService.getProfile().settings;
  }

  async setMusicEnabled(enabled: boolean): Promise<void> {
    setBackgroundMusicEnabled(enabled);
    await this.updateSettings({ musicEnabled: enabled });
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ soundEnabled: enabled });
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
