import Phaser from 'phaser';
import { createMaterialActionButton } from '../runtime/MaterialActionButton';
import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';

export type UiButtonVariant = 'primary' | 'secondary' | 'danger';

export interface UiButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surfaceHeight?: number;
  readonly label: string;
  readonly iconKey?: string;
  readonly subtitle?: string;
  readonly variant: UiButtonVariant;
  readonly compact?: boolean;
  readonly enabled?: boolean;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface UiButtonHandle {
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  readonly icon?: Phaser.GameObjects.Image;
  readonly subtitle?: Phaser.GameObjects.Text;
  destroy(): void;
}

export function createUiButton(scene: Phaser.Scene, options: UiButtonOptions): UiButtonHandle {
  if (options.variant === 'primary') {
    return createPrimaryActionButton(scene, options);
  }
  const button = createMaterialActionButton(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    surfaceHeight: options.surfaceHeight,
    label: options.label,
    iconKey: options.iconKey,
    variant: options.variant,
    compact: options.compact,
    enabled: options.enabled,
    onActivate: options.onActivate,
  });
  return { ...button, subtitle: undefined };
}
