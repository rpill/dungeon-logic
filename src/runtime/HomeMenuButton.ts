import Phaser from 'phaser';

export type HomeMenuIcon = 'play' | 'daily' | 'levels' | 'statistics' | 'settings' | 'info' | 'back';

type HomeMenuButtonState = 'normal' | 'hover' | 'pressed';

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

const HOME_MENU_FILL_FLIPS: Record<HomeMenuIcon, { readonly x: boolean; readonly y: boolean }> = {
  play: { x: false, y: false },
  daily: { x: true, y: false },
  levels: { x: false, y: true },
  statistics: { x: true, y: true },
  settings: { x: false, y: false },
  info: { x: true, y: false },
  back: { x: false, y: true },
};

const HORIZONTAL_SLICE = 48;
const VERTICAL_SLICE = 24;

export function preloadHomeMenuAssets(scene: Phaser.Scene): void {
  scene.load.image(HOME_MENU_FILL_KEY, '/assets/ui/menu_button_fill.png');
  scene.load.image(HOME_MENU_FRAME_KEYS.normal, '/assets/ui/menu_button_frame_normal.png');
  scene.load.image(HOME_MENU_FRAME_KEYS.hover, '/assets/ui/menu_button_frame_hover.png');
  scene.load.image(HOME_MENU_FRAME_KEYS.pressed, '/assets/ui/menu_button_frame_pressed.png');

  scene.load.svg('home-menu-icon-play', '/assets/ui/icons/play.svg');
  scene.load.svg('home-menu-icon-daily', '/assets/ui/icons/daily.svg');
  scene.load.svg('home-menu-icon-levels', '/assets/ui/icons/levels.svg');
  scene.load.svg('home-menu-icon-statistics', '/assets/ui/icons/statistics.svg');
  scene.load.svg('home-menu-icon-settings', '/assets/ui/icons/settings.svg');
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
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface HomeMenuButtonHandle {
  readonly fill: Phaser.GameObjects.NineSlice;
  readonly frame: Phaser.GameObjects.NineSlice;
  readonly icon: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
}

export function createHomeMenuButton(
  scene: Phaser.Scene,
  options: HomeMenuButtonOptions,
): HomeMenuButtonHandle {
  const enabled = options.enabled ?? true;
  const compact = options.compact ?? false;
  const fill = scene.add.nineslice(
    options.x,
    options.y,
    HOME_MENU_FILL_KEY,
    undefined,
    options.width,
    options.height,
    HORIZONTAL_SLICE,
    HORIZONTAL_SLICE,
    VERTICAL_SLICE,
    VERTICAL_SLICE,
  );
  const fillFlip = HOME_MENU_FILL_FLIPS[options.icon];
  fill.setScale(fillFlip.x ? -1 : 1, fillFlip.y ? -1 : 1);

  const frame = scene.add.nineslice(
    options.x,
    options.y,
    HOME_MENU_FRAME_KEYS.normal,
    undefined,
    options.width,
    options.height,
    HORIZONTAL_SLICE,
    HORIZONTAL_SLICE,
    VERTICAL_SLICE,
    VERTICAL_SLICE,
  );

  const baseFontSize = scene.scale.width < 700 ? 22 : 24;
  const fontSize = compact
    ? (scene.scale.width < 700 ? 13 : 15)
    : baseFontSize;
  const baseIconSize = scene.scale.width < 700 ? 28 : 31;
  const iconSize = compact
    ? (scene.scale.width < 700 ? 18 : 21)
    : baseIconSize;
  const buttonLeft = options.x - options.width / 2;
  const buttonRight = options.x + options.width / 2;
  const iconX = buttonLeft + options.width * 0.27;
  const labelX = buttonLeft + options.width * 0.41;
  const label = scene.add.text(labelX, options.y, options.label, {
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    color: options.labelColor,
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);

  const availableTextWidth = compact
    ? Math.max(52, options.width - iconSize - 44)
    : Math.max(80, buttonRight - 22 - labelX);
  if (label.width > availableTextWidth) {
    const fittedFontSize = Math.max(compact ? 11 : 15, Math.floor(fontSize * availableTextWidth / label.width));
    label.setFontSize(fittedFontSize);
  }

  const icon = scene.add.image(iconX, options.y, HOME_MENU_ICON_KEYS[options.icon])
    .setDisplaySize(iconSize, iconSize)
    .setTint(Phaser.Display.Color.HexStringToColor(options.labelColor).color);

  if (compact) {
    const compactGap = scene.scale.width < 700 ? 7 : 9;
    const compactContentWidth = iconSize + compactGap + label.width;
    const compactStartX = options.x - compactContentWidth / 2;
    icon.setPosition(compactStartX + iconSize / 2, options.y);
    label.setPosition(compactStartX + iconSize + compactGap, options.y);
  }

  const restingFrameState: HomeMenuButtonState = options.accentFrame ? 'hover' : 'normal';
  const setState = (state: HomeMenuButtonState): void => {
    if (options.accentFrame) {
      frame.setTexture(HOME_MENU_FRAME_KEYS.hover);
      frame.clearTint();
      frame.setAlpha(state === 'normal' ? 0.88 : 1);
      if (state === 'pressed') frame.setTint(0xd59a46);
      return;
    }
    frame.setAlpha(1);
    frame.clearTint();
    frame.setTexture(HOME_MENU_FRAME_KEYS[state]);
  };
  setState(restingFrameState);

  if (enabled) {
    fill.setInteractive({ useHandCursor: true });
    fill.on('pointerover', () => setState('hover'));
    fill.on('pointerout', () => setState(restingFrameState));
    fill.on('pointerdown', () => setState('pressed'));
    fill.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      setState('hover');
      options.onActivate(pointer);
    });
  } else {
    fill.setAlpha(0.55);
    frame.setAlpha(0.55);
    icon.setAlpha(0.55);
    label.setAlpha(0.55);
  }

  return { fill, frame, icon, label };
}
