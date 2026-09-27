import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { UI_THEME, uiColorHex } from '../ui/UiTheme';

const PRIMARY_BUTTON_KEY = 'primary-button-normal';
export type PrimaryButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

// The compact generated skin has quiet center pixels for horizontal stretching.
const PRIMARY_BUTTON_SLICE_X = 56;
const PRIMARY_BUTTON_FRAME = 'button-body-visible';
const PRIMARY_BUTTON_FULL_FRAME = 'button-body-full';
export const PRIMARY_BUTTON_VISIBLE_FRAME = { y: 0, height: 128 } as const;
const PRIMARY_BUTTON_TEXT_COLOR = uiColorHex(UI_THEME.colors.background.deep);
const PRIMARY_BUTTON_SUBTITLE_COLOR = uiColorHex(UI_THEME.colors.surface.base);
const PRIMARY_BUTTON_ICON_TINT = UI_THEME.colors.background.deep;

export function preloadPrimaryActionButtonAssets(scene: Phaser.Scene): void {
  scene.load.image(PRIMARY_BUTTON_KEY, 'assets/ui/action_gold_m1.png');
}


export interface PrimaryButtonSurfaceOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceHeight?: number;
  readonly preserveCanvasPadding?: boolean;
}

function ensurePrimaryButtonFrame(
  scene: Phaser.Scene,
  preserveCanvasPadding = false,
): Phaser.Textures.Frame {
  const texture = scene.textures.get(PRIMARY_BUTTON_KEY);
  const frameKey = preserveCanvasPadding ? PRIMARY_BUTTON_FULL_FRAME : PRIMARY_BUTTON_FRAME;
  if (!texture.has(frameKey)) {
    const source = texture.get();
    if (preserveCanvasPadding) {
      texture.add(frameKey, 0, 0, 0, source.width, source.height);
    } else {
      texture.add(
        frameKey,
        0,
        0,
        PRIMARY_BUTTON_VISIBLE_FRAME.y,
        source.width,
        PRIMARY_BUTTON_VISIBLE_FRAME.height,
      );
    }
  }
  return texture.get(frameKey);
}

export function layoutPrimaryButtonSurface(
  scene: Phaser.Scene,
  surface: Phaser.GameObjects.NineSlice,
  options: PrimaryButtonSurfaceOptions,
): void {
  const frame = ensurePrimaryButtonFrame(scene, options.preserveCanvasPadding);
  const surfaceHeight = options.surfaceHeight ?? options.height;
  const surfaceScale = surfaceHeight / frame.height;
  surface
    .setPosition(options.x, options.y)
    .setScale(surfaceScale)
    .setSize(options.width / surfaceScale, frame.height);
}

export function createPrimaryButtonSurface(
  scene: Phaser.Scene,
  options: PrimaryButtonSurfaceOptions,
): Phaser.GameObjects.NineSlice {
  const frame = ensurePrimaryButtonFrame(scene, options.preserveCanvasPadding);
  const frameKey = options.preserveCanvasPadding ? PRIMARY_BUTTON_FULL_FRAME : PRIMARY_BUTTON_FRAME;
  const surface = scene.add.nineslice(
    options.x,
    options.y,
    PRIMARY_BUTTON_KEY,
    frameKey,
    options.width,
    frame.height,
    PRIMARY_BUTTON_SLICE_X,
    PRIMARY_BUTTON_SLICE_X,
    0,
    0,
  );
  layoutPrimaryButtonSurface(scene, surface, options);
  return surface;
}

export function setPrimaryButtonSurfaceState(
  surface: Phaser.GameObjects.NineSlice,
  state: PrimaryButtonState,
): void {
  surface.clearTint();
  surface.setAlpha(1);
  if (state === 'hover') {
    surface.setTint(0x100c04).setTintMode(Phaser.TintModes.ADD);
  } else if (state === 'pressed') {
    surface.setTint(0xf4f0e8);
  } else if (state === 'disabled') {
    surface.setTint(0x7f817d);
  }
}

export interface PrimaryActionButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceHeight?: number;
  readonly label: string;
  readonly iconKey?: string;
  readonly subtitle?: string;
  readonly compact?: boolean;
  readonly homeWideLayout?: boolean;
  readonly enabled?: boolean;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface PrimaryActionButtonHandle {
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  readonly icon?: Phaser.GameObjects.Image;
  readonly subtitle?: Phaser.GameObjects.Text;
  destroy(): void;
}

export function createPrimaryActionButton(
  scene: Phaser.Scene,
  options: PrimaryActionButtonOptions,
): PrimaryActionButtonHandle {
  const enabled = options.enabled ?? true;
  const compact = options.compact ?? false;
  const surface = createPrimaryButtonSurface(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    surfaceHeight: options.surfaceHeight,
    preserveCanvasPadding: options.homeWideLayout === true,
  });

  const narrow = scene.scale.width < 700;
  const homeWideLayout = options.homeWideLayout ?? false;
  const genericIconSize = compact
    ? Math.max(14, Math.min(20, options.height * 0.48))
    : Math.max(24, Math.min(36, options.height * 0.43));
  const homeIconSize = narrow ? 48 : 52;
  const iconSize = homeWideLayout ? homeIconSize : genericIconSize;
  const labelFontSize = compact
    ? Math.max(10, Math.min(narrow ? 12 : 14, Math.floor(options.height * 0.34)))
    : Math.max(17, Math.min(narrow ? 20 : 24, Math.floor(options.height * 0.31)));
  const subtitleFontSize = homeWideLayout
    ? (narrow ? 12 : 14)
    : compact
      ? Math.max(8, Math.floor(labelFontSize * 0.72))
      : Math.max(10, Math.floor(labelFontSize * 0.55));
  const hasIcon = Boolean(options.iconKey);
  const objects: Phaser.GameObjects.GameObject[] = [surface];

  const contentY = options.y;
  const gap = compact ? 6 : 12;
  const padding = Math.max(10, options.height * 0.27);
  const copyX = options.x - options.width * (narrow ? 0.16 : 0.18);
  const iconX = options.x - options.width * (narrow ? 0.31 : 0.32);
  const textMaxWidth = homeWideLayout
    ? options.width * (narrow ? 0.47 : 0.50)
    : options.width - padding * 2 - (hasIcon ? iconSize + gap : 0);
  const labelY = homeWideLayout ? options.y - (narrow ? 8 : 10) : contentY;
  const subtitleY = homeWideLayout ? options.y + (narrow ? 15 : 20) : contentY;

  const label = scene.add.text(homeWideLayout ? copyX : options.x, labelY, options.label, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${labelFontSize}px`,
    color: PRIMARY_BUTTON_TEXT_COLOR,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  fitPrimaryText(label, textMaxWidth, compact ? 9 : 14);
  objects.push(label);

  let subtitle: Phaser.GameObjects.Text | undefined;
  if (options.subtitle) {
    subtitle = scene.add.text(homeWideLayout ? copyX : options.x, subtitleY, options.subtitle, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${subtitleFontSize}px`,
      color: PRIMARY_BUTTON_SUBTITLE_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    fitPrimaryText(subtitle, textMaxWidth, 9);
    objects.push(subtitle);
  }

  if (homeWideLayout) {
    label.setOrigin(0, 0.5);
    if (subtitle) subtitle.setOrigin(0, 0.5);
  }

  if (!homeWideLayout) {
    const copyWidth = Math.max(label.displayWidth, subtitle?.displayWidth ?? 0);
    const contentWidth = copyWidth + (hasIcon ? iconSize + gap : 0);
    const contentLeft = options.x - contentWidth / 2;
    const centeredCopyX = contentLeft + (hasIcon ? iconSize + gap : 0) + copyWidth / 2;
    label.setX(centeredCopyX);
    if (subtitle) {
      const lineGap = Math.max(2, options.height * 0.04);
      label.setY(contentY - (subtitle.displayHeight + lineGap) / 2);
      subtitle.setPosition(centeredCopyX, contentY + (label.displayHeight + lineGap) / 2);
    }
  }

  let icon: Phaser.GameObjects.Image | undefined;
  if (options.iconKey) {
    const genericContentWidth = Math.max(label.displayWidth, subtitle?.displayWidth ?? 0)
      + (hasIcon ? iconSize + gap : 0);
    const genericContentLeft = options.x - genericContentWidth / 2;
    icon = scene.add.image(
      homeWideLayout ? iconX : genericContentLeft + iconSize / 2,
      homeWideLayout ? options.y : contentY,
      options.iconKey,
    )
      .setDisplaySize(iconSize, iconSize)
      .setTint(PRIMARY_BUTTON_ICON_TINT);
    objects.push(icon);
  }

  const setState = (state: PrimaryButtonState): void => {
    const activeState = enabled ? state : 'disabled';
    setPrimaryButtonSurfaceState(surface, activeState);
    label.setColor(activeState === 'disabled'
      ? uiColorHex(UI_THEME.colors.text.disabled)
      : PRIMARY_BUTTON_TEXT_COLOR);
    subtitle?.setColor(activeState === 'disabled'
      ? uiColorHex(UI_THEME.colors.text.disabled)
      : PRIMARY_BUTTON_SUBTITLE_COLOR);
    icon?.setTint(activeState === 'disabled'
      ? UI_THEME.colors.text.disabled
      : PRIMARY_BUTTON_ICON_TINT);
  };
  setState('normal');

  if (enabled) {
    surface.setInteractive({ useHandCursor: true });
    surface.on('pointerover', () => {
      setState('hover');
    });
    surface.on('pointerout', () => setState('normal'));
    surface.on('pointerdown', () => setState('pressed'));
    surface.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      setState('hover');
      getAudioFeedback(scene).play('ui-click');
      options.onActivate(pointer);
    });
  }

  return {
    surface,
    label,
    icon,
    subtitle,
    destroy: () => {
      for (const object of objects) object.destroy();
    },
  };
}

function fitPrimaryText(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
  minFontSize: number,
): void {
  if (text.width <= maxWidth) return;
  const current = Number.parseFloat(text.style.fontSize?.toString() ?? '16');
  if (!Number.isFinite(current) || current <= 0) return;
  text.setFontSize(Math.max(minFontSize, Math.floor(current * maxWidth / text.width)));
  if (text.width > maxWidth) text.setScale(maxWidth / text.width);
}
