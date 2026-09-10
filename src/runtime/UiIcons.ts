import Phaser from 'phaser';

export const UI_ICON_KEYS = {
  back: 'ui-icon-back',
  menu: 'ui-icon-menu',
  undo: 'ui-icon-undo',
  reset: 'ui-icon-reset',
  hint: 'ui-icon-hint',
  info: 'ui-icon-info',
  settings: 'ui-icon-settings',
  music: 'ui-icon-music',
  sound: 'ui-icon-sound',
  vibration: 'ui-icon-vibration',
  language: 'ui-icon-language',
} as const;

export function preloadCommonUiIcons(scene: Phaser.Scene): void {
  scene.load.svg(UI_ICON_KEYS.back, '/assets/ui/icons/back.svg');
  scene.load.svg(UI_ICON_KEYS.menu, '/assets/ui/icons/menu.svg');
  scene.load.svg(UI_ICON_KEYS.undo, '/assets/ui/icons/undo.svg');
  scene.load.svg(UI_ICON_KEYS.reset, '/assets/ui/icons/reset.svg');
  scene.load.svg(UI_ICON_KEYS.hint, '/assets/ui/icons/hint.svg');
  scene.load.svg(UI_ICON_KEYS.info, '/assets/ui/icons/info.svg');
  scene.load.svg(UI_ICON_KEYS.settings, '/assets/ui/icons/settings.svg');
  scene.load.svg(UI_ICON_KEYS.music, '/assets/ui/icons/music.svg');
  scene.load.svg(UI_ICON_KEYS.sound, '/assets/ui/icons/sound.svg');
  scene.load.svg(UI_ICON_KEYS.vibration, '/assets/ui/icons/vibration.svg');
  scene.load.svg(UI_ICON_KEYS.language, '/assets/ui/icons/language.svg');
}
