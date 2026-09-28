import { setBackgroundMusicEnabled } from '../audio/MusicService';
import type { SupportedLanguage } from '../i18n/Language';
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
    this.updateSettings({ musicEnabled: enabled });
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    this.updateSettings({ soundEnabled: enabled });
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    this.updateSettings({ language });
  }

  private updateSettings(patch: Partial<PlayerSettings>): void {
    this.profileService.update((profile) => ({
      ...profile,
      settings: {
        ...profile.settings,
        ...patch,
      },
    }));
  }
}
