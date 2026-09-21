import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { isTouchLikePointer } from './PointerInput';

export type HomeHubModeCardVariant = 'tall' | 'wide';
type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked';

const SURFACE_KEYS: Record<HomeHubModeCardVariant, string> = {
  tall: 'home-hub-card-tall-generated',
  wide: 'home-hub-card-wide-generated',
};

const SLICE_X: Record<HomeHubModeCardVariant, number> = {
  tall: 52,
  wide: 62,
};

export function preloadHomeHubModeCardAssets(scene: Phaser.Scene): void {
  scene.load.image(SURFACE_KEYS.tall, 'assets/ui/home_hub_card_tall_generated_trimmed.webp');
  scene.load.image(SURFACE_KEYS.wide, 'assets/ui/home_hub_card_wide_generated_trimmed.webp');
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
  const initialKey = SURFACE_KEYS[options.variant];
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
    surface.setTexture(SURFACE_KEYS[options.variant]);
    surface.clearTint();

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

  return surface;
}
