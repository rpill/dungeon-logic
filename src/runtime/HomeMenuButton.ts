import Phaser from 'phaser';

import {
  createMaterialActionButton,
  preloadMaterialActionButtonAssets,
  type MaterialButtonVariant,
} from './MaterialActionButton';
type HomeMenuButtonState = 'normal' | 'hover' | 'pressed';

export type HomeMenuIcon = 'play' | 'daily' | 'levels' | 'statistics' | 'settings' | 'info' | 'back';

const HOME_MENU_FILL_KEY = 'home-menu-fill';
const HOME_MENU_FRAME_KEYS: Record<HomeMenuButtonState, string> = {
  normal: 'home-menu-frame-normal',
  hover: 'home-menu-frame-hover',
  pressed: 'home-menu-frame-pressed',
};

const HOME_MENU_ICON_KEYS: Record<HomeMenuIcon, string> = {
  play: 'home-menu-icon-play',
  daily: 'home-menu-icon-daily',
  levels: 'home-menu-icon-levels',
  statistics: 'home-menu-icon-statistics',
  settings: 'home-menu-icon-settings',
  info: 'ui-icon-info',
  back: 'ui-icon-back',
};

const HOME_MENU_ICON_RASTER_SIZE = 96;

export function preloadHomeMenuAssets(scene: Phaser.Scene): void {
  preloadMaterialActionButtonAssets(scene);
  scene.load.image(HOME_MENU_FILL_KEY, 'assets/ui/menu_button_fill.webp');
  scene.load.image(HOME_MENU_FRAME_KEYS.normal, 'assets/ui/menu_button_frame_normal.png');
  scene.load.image(HOME_MENU_FRAME_KEYS.hover, 'assets/ui/menu_button_frame_hover.png');
  scene.load.image(HOME_MENU_FRAME_KEYS.pressed, 'assets/ui/menu_button_frame_pressed.png');

  const rasterizeConfig = { width: HOME_MENU_ICON_RASTER_SIZE, height: HOME_MENU_ICON_RASTER_SIZE };
  scene.load.svg('home-menu-icon-play', 'assets/ui/icons/play.svg', rasterizeConfig);
  scene.load.image('home-menu-icon-daily', 'assets/ui/icons/daily_calendar_star.webp');
  scene.load.image('home-menu-icon-levels', 'assets/ui/icons/levels_book_blue.webp');
  scene.load.image('home-menu-icon-endless', 'assets/ui/icons/endless_infinity_cream_blue.webp');
  scene.load.svg('home-menu-icon-statistics', 'assets/ui/icons/statistics.svg', rasterizeConfig);
  scene.load.svg('home-menu-icon-settings', 'assets/ui/icons/settings.svg', rasterizeConfig);
}

export interface HomeMenuButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly labelColor: string;
  readonly icon: HomeMenuIcon;
  readonly enabled?: boolean;
  readonly accentFrame?: boolean;
  readonly compact?: boolean;
  readonly variant?: MaterialButtonVariant;
  readonly surfaceHeight?: number;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface HomeMenuButtonHandle {
  readonly fill: Phaser.GameObjects.NineSlice;
  readonly frame: Phaser.GameObjects.Rectangle;
  readonly icon: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

export function createHomeMenuButton(
  scene: Phaser.Scene,
  options: HomeMenuButtonOptions,
): HomeMenuButtonHandle {
  const material = createMaterialActionButton(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    surfaceHeight: options.surfaceHeight,
    label: options.label,
    labelColor: options.labelColor,
    iconKey: HOME_MENU_ICON_KEYS[options.icon],
    compact: options.compact,
    enabled: options.enabled,
    variant: options.variant ?? 'secondary',
    onActivate: options.onActivate,
  });

  // Keep the legacy handle shape while callers migrate. The old outline frame is
  // intentionally gone; this invisible object only preserves container/depth code.
  const frame = scene.add.rectangle(options.x, options.y, 1, 1, 0x000000, 0);
  return {
    fill: material.surface,
    frame,
    icon: material.icon!,
    label: material.label,
  };
}

export interface CenteredTextMenuButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly labelColor: string;
  readonly accentFrame?: boolean;
  readonly compact?: boolean;
  readonly variant?: MaterialButtonVariant;
  readonly surfaceHeight?: number;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface CenteredTextMenuButtonHandle {
  readonly fill: Phaser.GameObjects.NineSlice;
  readonly frame: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

export function createCenteredTextMenuButton(
  scene: Phaser.Scene,
  options: CenteredTextMenuButtonOptions,
): CenteredTextMenuButtonHandle {
  const material = createMaterialActionButton(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    surfaceHeight: options.surfaceHeight,
    label: options.label,
    labelColor: options.labelColor,
    compact: options.compact,
    variant: options.variant ?? 'secondary',
    onActivate: options.onActivate,
  });
  const frame = scene.add.rectangle(options.x, options.y, 1, 1, 0x000000, 0);
  return { fill: material.surface, frame, label: material.label };
}
