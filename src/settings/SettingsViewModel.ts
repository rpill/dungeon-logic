import type { SupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import type { PlayerSettings } from '../profile/types';

export type SettingsRowId = 'music' | 'sound' | 'vibration' | 'language' | 'help' | 'reset';

export interface SettingsRowViewModel {
  readonly id: SettingsRowId;
  readonly label: string;
  readonly value: string | null;
  readonly danger: boolean;
}

export function getSettingsRows(
  settings: PlayerSettings,
  vibrationSupported: boolean,
  language: SupportedLanguage = settings.language,
): readonly SettingsRowViewModel[] {
  const copy = getUiCopy(language).settings;
  const onOff = (enabled: boolean): string => enabled ? copy.on : copy.off;
  const rows: SettingsRowViewModel[] = [
    { id: 'music', label: copy.music, value: onOff(settings.musicEnabled), danger: false },
    { id: 'sound', label: copy.sound, value: onOff(settings.soundEnabled), danger: false },
  ];

  if (vibrationSupported) {
    rows.push({ id: 'vibration', label: copy.vibration, value: onOff(settings.vibrationEnabled), danger: false });
  }

  rows.push(
    { id: 'language', label: copy.language, value: copy.languageName[settings.language], danger: false },
    { id: 'help', label: copy.help, value: '→', danger: false },
    { id: 'reset', label: copy.resetProgress, value: null, danger: true },
  );

  return rows;
}
