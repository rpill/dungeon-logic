import type Phaser from 'phaser';
import type { UiDensity } from './UiDensity';
import { UI_THEME, uiColorHex } from './UiTheme';

export type UiTextRole = 'display' | 'heading' | 'bodyStrong' | 'body' | 'meta';

export interface UiTextStyleOptions {
  readonly color?: number;
  readonly align?: 'left' | 'center' | 'right';
  readonly fontStyle?: 'normal' | 'bold';
}

export function createUiTextStyle(
  role: UiTextRole,
  density: UiDensity,
  options: UiTextStyleOptions = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${UI_THEME.typography[role][density]}px`,
    color: uiColorHex(options.color ?? UI_THEME.colors.text.primary),
    fontStyle: options.fontStyle ?? (role === 'display' || role === 'heading' || role === 'bodyStrong' ? 'bold' : 'normal'),
    align: options.align ?? 'left',
  };
}
