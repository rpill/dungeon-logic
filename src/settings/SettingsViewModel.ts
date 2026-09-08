import type { PlayerSettings } from '../profile/types';

export type SettingsRowId = 'music' | 'sound' | 'vibration' | 'language' | 'help' | 'reset';

export interface SettingsRowViewModel {
  readonly id: SettingsRowId;
  readonly label: string;
  readonly value: string | null;
  readonly danger: boolean;
}

function onOff(enabled: boolean): string {
  return enabled ? 'ВКЛ' : 'ВЫКЛ';
}

export function getSettingsRows(
  settings: PlayerSettings,
  vibrationSupported: boolean,
): readonly SettingsRowViewModel[] {
  const rows: SettingsRowViewModel[] = [
    { id: 'music', label: 'МУЗЫКА', value: onOff(settings.musicEnabled), danger: false },
    { id: 'sound', label: 'ЗВУК', value: onOff(settings.soundEnabled), danger: false },
  ];

  if (vibrationSupported) {
    rows.push({ id: 'vibration', label: 'ВИБРАЦИЯ', value: onOff(settings.vibrationEnabled), danger: false });
  }

  rows.push(
    { id: 'language', label: 'ЯЗЫК', value: settings.language.toUpperCase(), danger: false },
    { id: 'help', label: 'КАК ИГРАТЬ', value: '→', danger: false },
    { id: 'reset', label: 'СБРОСИТЬ ПРОГРЕСС', value: null, danger: true },
  );

  return rows;
}
