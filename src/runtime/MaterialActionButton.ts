import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { UI_THEME, uiColorHex } from '../ui/UiTheme';
import { isTouchLikePointer } from './PointerInput';

export type MaterialButtonVariant = 'secondary' | 'danger';
export type MaterialButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

export const MATERIAL_BUTTON_KEYS: Record<MaterialButtonVariant, string> = {
  secondary: 'material-button-secondary-normal',
  danger: 'material-button-danger-normal',
};


// All three matte stone skins use the same visible height and end-cap geometry.
export const MATERIAL_BUTTON_SLICE_X = 56;
export const MATERIAL_BUTTON_FRAME = 'button-body-full';
export const MATERIAL_BUTTON_VISIBLE_FRAME_Y: Record<MaterialButtonVariant, number> = {
  secondary: 0,
  danger: 0,
};
export const MATERIAL_BUTTON_VISIBLE_FRAME_HEIGHT: Record<MaterialButtonVariant, number> = {
  secondary: 128,
  danger: 128,
};
export function getMaterialButtonContentY(y: number, _height: number): number {
  return y;
}

const MATERIAL_BUTTON_TEXT_COLOR = uiColorHex(UI_THEME.colors.text.primary);
const MATERIAL_BUTTON_ICON_TINT = UI_THEME.colors.text.primary;

export const MATERIAL_BUTTON_STATE_TINTS = {
  secondary: {
    hover: 0x101522,
    pressed: 0xd3d9e4,
    disabled: 0x7e8796,
  },
  danger: {
    hover: 0x180808,
    pressed: 0xd8c0c2,
    disabled: 0x927f82,
  },
} as const;

const GRAPHICS_PALETTES = {
  secondary: {
    normal: UI_THEME.colors.surface.base,
    hover: UI_THEME.colors.surface.raised,
    pressed: UI_THEME.colors.surface.inset,
    top: UI_THEME.colors.border.bright,
    bottom: UI_THEME.colors.border.dark,
  },
  danger: {
    normal: UI_THEME.colors.semantic.danger,
    hover: UI_THEME.colors.semantic.danger,
    pressed: UI_THEME.colors.surface.inset,
    top: UI_THEME.colors.border.bright,
    bottom: UI_THEME.colors.border.dark,
  },
} as const;

export function preloadMaterialActionButtonAssets(scene: Phaser.Scene): void {
  scene.load.image(MATERIAL_BUTTON_KEYS.secondary, 'assets/ui/action_slate_m1.webp');
  scene.load.image(MATERIAL_BUTTON_KEYS.danger, 'assets/ui/action_red_m1.webp');
}


export interface MaterialButtonSurfaceOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceHeight?: number;
  readonly variant: MaterialButtonVariant;
}

function ensureMaterialButtonFrame(
  scene: Phaser.Scene,
  variant: MaterialButtonVariant,
): Phaser.Textures.Frame {
  const texture = scene.textures.get(MATERIAL_BUTTON_KEYS[variant]);
  if (!texture.has(MATERIAL_BUTTON_FRAME)) {
    const source = texture.get();
    texture.add(
      MATERIAL_BUTTON_FRAME,
      0,
      0,
      MATERIAL_BUTTON_VISIBLE_FRAME_Y[variant],
      source.width,
      MATERIAL_BUTTON_VISIBLE_FRAME_HEIGHT[variant],
    );
  }
  return texture.get(MATERIAL_BUTTON_FRAME);
}

export function layoutMaterialButtonSurface(
  scene: Phaser.Scene,
  surface: Phaser.GameObjects.NineSlice,
  options: MaterialButtonSurfaceOptions,
): void {
  const frame = ensureMaterialButtonFrame(scene, options.variant);
  const surfaceHeight = options.surfaceHeight ?? options.height;
  const surfaceScale = surfaceHeight / frame.height;
  surface
    .setPosition(options.x, options.y)
    .setScale(surfaceScale)
    .setSize(options.width / surfaceScale, frame.height);
}

export function createMaterialButtonSurface(
  scene: Phaser.Scene,
  options: MaterialButtonSurfaceOptions,
): Phaser.GameObjects.NineSlice {
  const frame = ensureMaterialButtonFrame(scene, options.variant);
  const surface = scene.add.nineslice(
    options.x,
    options.y,
    MATERIAL_BUTTON_KEYS[options.variant],
    MATERIAL_BUTTON_FRAME,
    options.width,
    frame.height,
    MATERIAL_BUTTON_SLICE_X,
    MATERIAL_BUTTON_SLICE_X,
    0,
    0,
  );
  layoutMaterialButtonSurface(scene, surface, options);
  return surface;
}

export function setMaterialButtonSurfaceState(
  surface: Phaser.GameObjects.NineSlice,
  variant: MaterialButtonVariant,
  state: MaterialButtonState,
): void {
  surface.clearTint();
  surface.setAlpha(1);

  const stateTints = MATERIAL_BUTTON_STATE_TINTS[variant];
  if (state === 'hover') {
    surface.setTint(stateTints.hover).setTintMode(Phaser.TintModes.ADD);
  } else if (state === 'pressed') {
    surface.setTint(stateTints.pressed);
  } else if (state === 'disabled') {
    surface.setTint(stateTints.disabled);
  }
}

export interface MaterialActionButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceHeight?: number;
  readonly label: string;
  readonly iconKey?: string;
  readonly variant: MaterialButtonVariant;
  readonly compact?: boolean;
  readonly enabled?: boolean;
  readonly labelColor?: string;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface MaterialActionButtonHandle {
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  readonly icon?: Phaser.GameObjects.Image;
  destroy(): void;
}

export function createMaterialActionButton(
  scene: Phaser.Scene,
  options: MaterialActionButtonOptions,
): MaterialActionButtonHandle {
  const enabled = options.enabled ?? true;
  const compact = options.compact ?? false;
  const surface = createMaterialButtonSurface(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    surfaceHeight: options.surfaceHeight,
    variant: options.variant,
  });

  const iconSize = compact
    ? Math.max(14, Math.min(21, options.height * 0.48))
    : Math.max(20, Math.min(31, options.height * 0.46));
  const baseFontSize = compact
    ? Math.max(10, Math.min(scene.scale.width < 700 ? 13 : 15, Math.floor(options.height * 0.34)))
    : Math.max(15, Math.min(scene.scale.width < 700 ? 20 : 22, Math.floor(options.height * 0.34)));
  const hasIcon = options.iconKey !== undefined;
  const gap = compact ? 7 : 10;
  const padding = Math.max(10, options.height * 0.25);
  const textMaxWidth = Math.max(24, options.width - padding * 2 - (hasIcon ? iconSize + gap : 0));
  const contentY = getMaterialButtonContentY(options.y, options.height);
  const label = scene.add.text(options.x, contentY, options.label, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${baseFontSize}px`,
    color: options.labelColor ?? MATERIAL_BUTTON_TEXT_COLOR,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  label.setStroke('#263556', compact ? 1 : 2);
  label.setShadow(0, 1, '#10182c', 0.32, false, true);
  fitMaterialText(label, textMaxWidth, compact ? 9 : 13);

  let icon: Phaser.GameObjects.Image | undefined;
  if (options.iconKey !== undefined) {
    const contentWidth = iconSize + gap + label.displayWidth;
    const startX = options.x - contentWidth / 2;
    icon = scene.add.image(startX + iconSize / 2, contentY, options.iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setTint(MATERIAL_BUTTON_ICON_TINT);
    label.setPosition(startX + iconSize + gap, contentY).setOrigin(0, 0.5);
  }

  const setState = (state: MaterialButtonState): void => {
    const activeState = enabled ? state : 'disabled';
    setMaterialButtonSurfaceState(surface, options.variant, activeState);
    label
      .setColor(activeState === 'disabled'
        ? uiColorHex(UI_THEME.colors.text.disabled)
        : options.labelColor ?? MATERIAL_BUTTON_TEXT_COLOR)
      .setAlpha(1);
    if (icon) {
      icon
        .setTint(activeState === 'disabled' ? UI_THEME.colors.text.disabled : MATERIAL_BUTTON_ICON_TINT)
        .setAlpha(1);
    }
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
      setState(isTouchLikePointer(pointer) ? 'normal' : 'hover');
      getAudioFeedback(scene).play('ui-click');
      options.onActivate(pointer);
    });
    surface.on('pointerupoutside', () => setState('normal'));
  }

  return {
    surface,
    label,
    icon,
    destroy: () => {
      surface.destroy();
      label.destroy();
      icon?.destroy();
    },
  };
}

export interface MaterialButtonGraphicsBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

export function drawMaterialButtonBackground(
  graphics: Phaser.GameObjects.Graphics,
  bounds: MaterialButtonGraphicsBounds,
  variant: MaterialButtonVariant,
  state: Exclude<MaterialButtonState, 'disabled'>,
): void {
  const palette = GRAPHICS_PALETTES[variant];
  const fill = state === 'pressed' ? palette.pressed : state === 'hover' ? palette.hover : palette.normal;
  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const bevel = Math.max(3, Math.min(6, Math.round(bounds.height * 0.1)));

  graphics.fillStyle(0x050a13, 0.28);
  graphics.fillRoundedRect(left, top + 2, bounds.width, bounds.height, bounds.radius);
  graphics.fillStyle(palette.bottom, 1);
  graphics.fillRoundedRect(left, top, bounds.width, bounds.height, bounds.radius);
  graphics.fillStyle(fill, 1);
  graphics.fillRoundedRect(left, top, bounds.width, Math.max(1, bounds.height - bevel), bounds.radius);
  graphics.lineStyle(1, palette.top, state === 'hover' ? 0.8 : 0.48);
  graphics.lineBetween(left + bounds.radius, top + 1, left + bounds.width - bounds.radius, top + 1);
}

function fitMaterialText(
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
