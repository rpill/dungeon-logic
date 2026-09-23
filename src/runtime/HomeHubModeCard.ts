import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { isTouchLikePointer } from './PointerInput';

export type HomeHubModeCardVariant = 'tall' | 'wide';
export type HomeHubModeCardVisualStyle = 'legacy' | 'soft-stone';
type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked';
type SoftSurfaceState = 'normal' | 'hover' | 'locked';

const LEGACY_SURFACE_KEYS: Record<HomeHubModeCardVariant, string> = {
  tall: 'home-hub-card-tall-generated',
  wide: 'home-hub-card-wide-generated',
};

const SOFT_SURFACE_KEYS: Record<HomeHubModeCardVariant, Record<SoftSurfaceState, string>> = {
  tall: {
    normal: 'home-hub-card-tall-moody-normal',
    hover: 'home-hub-card-tall-moody-hover',
    locked: 'home-hub-card-tall-moody-locked',
  },
  wide: {
    normal: 'home-hub-card-wide-moody-normal',
    hover: 'home-hub-card-wide-moody-hover',
    locked: 'home-hub-card-wide-moody-locked',
  },
};

const SOFT_SURFACE_ASSET_PATHS: Record<HomeHubModeCardVariant, Record<SoftSurfaceState, string>> = {
  tall: {
    normal: 'assets/ui/home_hub_card_tall_moody_normal.webp',
    hover: 'assets/ui/home_hub_card_tall_moody_hover.webp',
    locked: 'assets/ui/home_hub_card_tall_moody_locked.webp',
  },
  wide: {
    normal: 'assets/ui/home_hub_card_wide_moody_normal.webp',
    hover: 'assets/ui/home_hub_card_wide_moody_hover.webp',
    locked: 'assets/ui/home_hub_card_wide_moody_locked.webp',
  },
};

const LEGACY_ASSET_PATHS: Record<HomeHubModeCardVariant, string> = {
  tall: 'assets/ui/home_hub_card_tall_generated_trimmed.webp',
  wide: 'assets/ui/home_hub_card_wide_generated_trimmed.webp',
};

const LEGACY_SLICE_X: Record<HomeHubModeCardVariant, number> = {
  tall: 52,
  wide: 62,
};

const SOFT_SLICE_X: Record<HomeHubModeCardVariant, number> = {
  tall: 118,
  wide: 145,
};

const SOFT_SLICE_Y: Record<HomeHubModeCardVariant, number> = {
  tall: 118,
  wide: 110,
};

export function preloadHomeHubModeCardAssets(scene: Phaser.Scene): void {
  scene.load.image(LEGACY_SURFACE_KEYS.tall, LEGACY_ASSET_PATHS.tall);
  scene.load.image(LEGACY_SURFACE_KEYS.wide, LEGACY_ASSET_PATHS.wide);

  for (const variant of ['tall', 'wide'] as const) {
    for (const state of ['normal', 'hover', 'locked'] as const) {
      scene.load.image(SOFT_SURFACE_KEYS[variant][state], SOFT_SURFACE_ASSET_PATHS[variant][state]);
    }
  }
}

export interface HomeHubModeCardOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: HomeHubModeCardVariant;
  readonly visualStyle?: HomeHubModeCardVisualStyle;
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
  const visualStyle = options.visualStyle ?? 'legacy';
  const softStone = visualStyle === 'soft-stone';
  const initialKey = softStone
    ? SOFT_SURFACE_KEYS[options.variant][enabled ? 'normal' : 'locked']
    : LEGACY_SURFACE_KEYS[options.variant];
  const source = scene.textures.get(initialKey).get();
  const surfaceScale = options.height / Math.max(1, source.height);
  const localWidth = options.width / surfaceScale;
  const sliceX = softStone ? SOFT_SLICE_X[options.variant] : LEGACY_SLICE_X[options.variant];
  const sliceY = softStone ? SOFT_SLICE_Y[options.variant] : 0;

  const surface = scene.add.nineslice(
    options.x,
    options.y,
    initialKey,
    undefined,
    localWidth,
    source.height,
    sliceX,
    sliceX,
    sliceY,
    sliceY,
  ).setScale(surfaceScale);

  const setState = (state: HomeHubModeCardState): void => {
    const resolvedState: HomeHubModeCardState = enabled ? state : 'locked';
    surface.clearTint();

    if (softStone) {
      const textureState: SoftSurfaceState = resolvedState === 'hover' || resolvedState === 'pressed'
        ? 'hover'
        : resolvedState === 'locked'
          ? 'locked'
          : 'normal';
      surface.setTexture(SOFT_SURFACE_KEYS[options.variant][textureState]);
      surface.setAlpha(resolvedState === 'pressed' ? 0.93 : 1);
      return;
    }

    surface.setTexture(LEGACY_SURFACE_KEYS[options.variant]);
    if (resolvedState === 'locked') {
      surface.setTint(0x8a95ab);
      surface.setAlpha(0.62);
      return;
    }
    if (resolvedState === 'hover') {
      surface.setAlpha(0.995);
      return;
    }
    if (resolvedState === 'pressed') {
      surface.setAlpha(0.92);
      return;
    }
    surface.setAlpha(0.97);
  };

  setState(enabled ? 'normal' : 'locked');

  if (enabled && interactive) {
    surface.setInteractive({ useHandCursor: true });
    surface.on('pointerover', () => setState('hover'));
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
