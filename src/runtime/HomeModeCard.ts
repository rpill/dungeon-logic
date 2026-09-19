import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { isTouchLikePointer } from './PointerInput';

export type HomeModeCardVariant = 'tall' | 'wide';
type HomeModeCardState = 'normal' | 'hover' | 'pressed' | 'disabled';

export const HOME_MODE_CARD_TALL_KEY = 'home-mode-card-tall';
export const HOME_MODE_CARD_WIDE_KEY = 'home-mode-card-wide';

// The two card families have dedicated source artwork with their final vertical
// proportions baked in. Runtime scaling is uniform by height; NineSlice only
// extends the horizontal center strip, so the bevel, rivets and edge wear are
// never stretched vertically.
const HOME_MODE_CARD_SLICE_X: Record<HomeModeCardVariant, number> = {
  tall: 48,
  wide: 64,
};

// An available, unfinished Daily keeps the same card material and receives
// one clean warm outline directly on the card's outer contour.
const ACTIVE_ACCENT_BORDER_COLOR = 0xf0bd63;

export function preloadHomeModeCardAssets(scene: Phaser.Scene): void {
  scene.load.image(HOME_MODE_CARD_TALL_KEY, 'assets/ui/home_mode_card_tall.webp');
  scene.load.image(HOME_MODE_CARD_WIDE_KEY, 'assets/ui/home_mode_card_wide.webp');
}

export interface HomeModeCardOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: HomeModeCardVariant;
  readonly enabled?: boolean;
  readonly activeAccent?: boolean;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface HomeModeCardHandle {
  readonly surface: Phaser.GameObjects.NineSlice;
  destroy(): void;
}

export function createHomeModeCard(
  scene: Phaser.Scene,
  options: HomeModeCardOptions,
): HomeModeCardHandle {
  const enabled = options.enabled ?? true;
  const activeAccent = options.activeAccent ?? false;
  const isTall = options.variant === 'tall';
  const textureKey = isTall ? HOME_MODE_CARD_TALL_KEY : HOME_MODE_CARD_WIDE_KEY;
  const source = scene.textures.get(textureKey).get();
  const sourceHeight = Math.max(1, source.height);
  const surfaceScale = options.height / sourceHeight;
  const localWidth = options.width / surfaceScale;
  const sliceX = HOME_MODE_CARD_SLICE_X[options.variant];

  const surface = scene.add.nineslice(
    options.x,
    options.y,
    textureKey,
    undefined,
    localWidth,
    sourceHeight,
    sliceX,
    sliceX,
    0,
    0,
  ).setScale(surfaceScale);

  const accentBorder = activeAccent ? scene.add.graphics() : null;
  const drawAccentBorder = (alpha: number): void => {
    if (accentBorder === null) return;
    const lineWidth = Math.max(2, Math.min(4, options.height * 0.015));
    const inset = lineWidth / 2 + 1;
    const radius = Math.max(10, Math.min(16, options.height * 0.055));
    accentBorder.clear();
    accentBorder.lineStyle(lineWidth, ACTIVE_ACCENT_BORDER_COLOR, alpha);
    accentBorder.strokeRoundedRect(
      options.x - options.width / 2 + inset,
      options.y - options.height / 2 + inset,
      options.width - inset * 2,
      options.height - inset * 2,
      radius,
    );
  };

  const setState = (state: HomeModeCardState): void => {
    const activeState = enabled ? state : 'disabled';
    surface.clearTint();
    surface.setAlpha(1);

    if (activeState === 'disabled') {
      surface.setTint(0x7e8796);
      surface.setAlpha(0.72);
      drawAccentBorder(0);
      return;
    }

    if (activeState === 'hover') {
      surface.setTint(0x101522).setTintMode(Phaser.TintModes.ADD);
    } else if (activeState === 'pressed') {
      surface.setTint(0xd3d9e4);
    }

    if (activeAccent) {
      drawAccentBorder(activeState === 'hover' ? 1 : activeState === 'pressed' ? 0.78 : 0.92);
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
    destroy: () => {
      accentBorder?.destroy();
      surface.destroy();
    },
  };
}
