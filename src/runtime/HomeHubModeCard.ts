import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { isTouchLikePointer } from './PointerInput';

export type HomeHubModeCardVariant = 'tall' | 'wide';
type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked';

const NORMAL_SURFACE_KEYS: Record<HomeHubModeCardVariant, string> = {
  tall: 'home-hub-card-tall-normal',
  wide: 'home-hub-card-wide-normal',
};

const HOVER_SURFACE_KEYS: Record<HomeHubModeCardVariant, string> = {
  tall: 'home-hub-card-tall-hover',
  wide: 'home-hub-card-wide-hover',
};

const LOCKED_SURFACE_KEYS: Record<HomeHubModeCardVariant, string> = {
  tall: 'home-hub-card-tall-locked',
  wide: 'home-hub-card-wide-locked',
};

const SLICE_X: Record<HomeHubModeCardVariant, number> = {
  tall: 48,
  wide: 64,
};

export function preloadHomeHubModeCardAssets(scene: Phaser.Scene): void {
  scene.load.image(NORMAL_SURFACE_KEYS.tall, 'assets/ui/home_hub_card_tall_normal.webp');
  scene.load.image(HOVER_SURFACE_KEYS.tall, 'assets/ui/home_hub_card_tall_hover.webp');
  scene.load.image(LOCKED_SURFACE_KEYS.tall, 'assets/ui/home_hub_card_tall_locked.webp');
  scene.load.image(NORMAL_SURFACE_KEYS.wide, 'assets/ui/home_hub_card_wide_normal.webp');
  scene.load.image(HOVER_SURFACE_KEYS.wide, 'assets/ui/home_hub_card_wide_hover.webp');
  scene.load.image(LOCKED_SURFACE_KEYS.wide, 'assets/ui/home_hub_card_wide_locked.webp');
}

export interface HomeHubModeCardOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: HomeHubModeCardVariant;
  readonly enabled?: boolean;
  readonly activeAccent?: boolean;
  readonly interactive?: boolean;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export function createHomeHubModeCard(
  scene: Phaser.Scene,
  options: HomeHubModeCardOptions,
): Phaser.GameObjects.NineSlice {
  const enabled = options.enabled ?? true;
  const interactive = options.interactive ?? true;
  const initialKey = enabled
    ? NORMAL_SURFACE_KEYS[options.variant]
    : LOCKED_SURFACE_KEYS[options.variant];
  const source = scene.textures.get(initialKey).get();
  const sourceHeight = Math.max(1, source.height);
  const surfaceScale = options.height / sourceHeight;
  const localWidth = options.width / surfaceScale;
  const sliceX = SLICE_X[options.variant];

  const surface = scene.add.nineslice(
    options.x,
    options.y,
    initialKey,
    undefined,
    localWidth,
    sourceHeight,
    sliceX,
    sliceX,
    0,
    0,
  ).setScale(surfaceScale);

  const setState = (state: HomeHubModeCardState): void => {
    const resolvedState: HomeHubModeCardState = enabled ? state : 'locked';
    surface.clearTint();
    surface.setAlpha(1);

    if (resolvedState === 'locked') {
      surface.setTexture(LOCKED_SURFACE_KEYS[options.variant]);
      surface.setAlpha(0.94);
      return;
    }

    if (resolvedState === 'hover') {
      surface.setTexture(HOVER_SURFACE_KEYS[options.variant]);
      return;
    }

    surface.setTexture(NORMAL_SURFACE_KEYS[options.variant]);
    if (resolvedState === 'pressed') {
      surface.setAlpha(0.88);
    }
  };

  setState(enabled ? 'normal' : 'locked');

  if (enabled && interactive) {
    surface.setInteractive({ useHandCursor: true });
    surface.on('pointerover', () => {
      setState('hover');
      getAudioFeedback(scene).play('ui-hover');
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

  return surface;
}
