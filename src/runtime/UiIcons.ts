import Phaser from 'phaser';

const UI_ICON_RASTER_SIZE = 96;

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
  const rasterizeConfig = { width: UI_ICON_RASTER_SIZE, height: UI_ICON_RASTER_SIZE };
  scene.load.svg(UI_ICON_KEYS.back, '/assets/ui/icons/back.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.menu, '/assets/ui/icons/menu.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.undo, '/assets/ui/icons/undo.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.reset, '/assets/ui/icons/reset.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.hint, '/assets/ui/icons/hint.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.info, '/assets/ui/icons/info.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.settings, '/assets/ui/icons/settings.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.music, '/assets/ui/icons/music.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.sound, '/assets/ui/icons/sound.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.vibration, '/assets/ui/icons/vibration.svg', rasterizeConfig);
  scene.load.svg(UI_ICON_KEYS.language, '/assets/ui/icons/language.svg', rasterizeConfig);
}
