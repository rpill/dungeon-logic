import type { SupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import type { PlayerSettings } from '../profile/types';

export type SettingsRowId = 'music' | 'sound' | 'language' | 'tutorial' | 'help' | 'reset';

export interface SettingsRowViewModel {
  readonly id: SettingsRowId;
  readonly label: string;
  readonly value: string | null;
  readonly danger: boolean;
}

export function getSettingsRows(
  settings: PlayerSettings,
  language: SupportedLanguage = settings.language,
): readonly SettingsRowViewModel[] {
  const copy = getUiCopy(language);
  const settingsCopy = copy.settings;
  const onOff = (enabled: boolean): string => enabled ? settingsCopy.on : settingsCopy.off;

  return [
    { id: 'music', label: settingsCopy.music, value: onOff(settings.musicEnabled), danger: false },
    { id: 'sound', label: settingsCopy.sound, value: onOff(settings.soundEnabled), danger: false },
    { id: 'language', label: settingsCopy.language, value: settingsCopy.languageName[settings.language], danger: false },
    { id: 'tutorial', label: copy.common.tutorial, value: null, danger: false },
    { id: 'help', label: settingsCopy.rules, value: null, danger: false },
    { id: 'reset', label: settingsCopy.resetProgress, value: null, danger: true },
  ];
}
