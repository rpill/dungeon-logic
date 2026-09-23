import Phaser from 'phaser';
import { createHomeHubModeCard } from '../runtime/HomeHubModeCard';
import { UI_THEME } from './UiTheme';

export type UiPanelVariant = 'wide' | 'tall' | 'panel';

type UiImagePanelVariant = Exclude<UiPanelVariant, 'panel'>;

export interface UiPanelOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: UiPanelVariant;
  readonly depth?: number;
  readonly alpha?: number;
}

export function createUiPanel(
  scene: Phaser.Scene,
  options: UiPanelOptions & { readonly variant: 'panel' },
): Phaser.GameObjects.Graphics;
export function createUiPanel(
  scene: Phaser.Scene,
  options: UiPanelOptions & { readonly variant: UiImagePanelVariant },
): Phaser.GameObjects.NineSlice;
export function createUiPanel(
  scene: Phaser.Scene,
  options: UiPanelOptions,
): Phaser.GameObjects.Graphics | Phaser.GameObjects.NineSlice {
  if (options.variant === 'panel') {
    const depth = options.depth ?? 0;
    const alpha = options.alpha ?? 1;
    const left = options.x - options.width / 2;
    const top = options.y - options.height / 2;
    const radius = Math.min(22, Math.max(UI_THEME.radius.large, Math.floor(options.height * 0.065)));
    const graphics = scene.add.graphics().setDepth(depth).setAlpha(alpha);

    // Soft dungeon stone: quiet depth, matte body, and a restrained cool edge.
    // No rivets, chrome, hard bevels, or luminous frame treatment.
    graphics.fillStyle(UI_THEME.colors.background.deep, 0.28);
    graphics.fillRoundedRect(left + 2, top + 5, options.width - 4, options.height, radius);

    graphics.fillStyle(UI_THEME.colors.surface.raised, 0.96);
    graphics.fillRoundedRect(left, top, options.width, options.height, radius);
    graphics.lineStyle(2, UI_THEME.colors.border.dark, 0.9);
    graphics.strokeRoundedRect(left, top, options.width, options.height, radius);

    const inset = 4;
    const innerRadius = Math.max(UI_THEME.radius.medium, radius - inset);
    graphics.fillStyle(UI_THEME.colors.surface.base, 0.98);
    graphics.fillRoundedRect(
      left + inset,
      top + inset,
      options.width - inset * 2,
      options.height - inset * 2,
      innerRadius,
    );
    graphics.lineStyle(1, UI_THEME.colors.border.normal, 0.62);
    graphics.strokeRoundedRect(
      left + inset,
      top + inset,
      options.width - inset * 2,
      options.height - inset * 2,
      innerRadius,
    );

    return graphics;
  }

  return createHomeHubModeCard(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant,
    visualStyle: 'soft-stone',
    interactive: false,
    onActivate: () => {},
  }).setDepth(options.depth ?? 0).setAlpha(options.alpha ?? 0.97);
}
