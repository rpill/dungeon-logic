import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';

const PRIMARY_BUTTON_KEY = 'primary-button-normal';
type PrimaryButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

// Keep the full height of each end cap: the bevel and round rivets must scale
// uniformly. Only the strip between the caps stretches horizontally.
const PRIMARY_BUTTON_SLICE_X = 56;
const PRIMARY_BUTTON_FRAME = 'button-body';
const PRIMARY_BUTTON_FRAME_INSET = 24;
const PRIMARY_BUTTON_TEXT_COLOR = '#12243f';
const PRIMARY_BUTTON_SUBTITLE_COLOR = '#4d5561';
const PRIMARY_BUTTON_ICON_TINT = 0x12243f;

export function preloadPrimaryActionButtonAssets(scene: Phaser.Scene): void {
  scene.load.image(PRIMARY_BUTTON_KEY, 'assets/ui/primary_button_normal.webp');
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
  const texture = scene.textures.get(PRIMARY_BUTTON_KEY);
  if (!texture.has(PRIMARY_BUTTON_FRAME)) {
    const source = texture.get();
    const inset = PRIMARY_BUTTON_FRAME_INSET;
    texture.add(PRIMARY_BUTTON_FRAME, 0, inset, 0, source.width - inset * 2, source.height);
  }
  const frame = texture.get(PRIMARY_BUTTON_FRAME);
  const surfaceHeight = options.surfaceHeight ?? options.height;
  const surfaceScale = surfaceHeight / frame.height;
  const surface = scene.add.nineslice(
    options.x,
    options.y,
    PRIMARY_BUTTON_KEY,
    PRIMARY_BUTTON_FRAME,
    options.width / surfaceScale,
    frame.height,
    PRIMARY_BUTTON_SLICE_X,
    PRIMARY_BUTTON_SLICE_X,
    0,
    0,
  ).setScale(surfaceScale);

  const iconSize = compact
    ? Math.max(14, Math.min(20, options.height * 0.48))
    : Math.max(24, Math.min(36, options.height * 0.43));
  const labelFontSize = compact
    ? Math.max(10, Math.min(scene.scale.width < 700 ? 12 : 14, Math.floor(options.height * 0.34)))
    : Math.max(17, Math.min(scene.scale.width < 700 ? 20 : 24, Math.floor(options.height * 0.31)));
  const subtitleFontSize = compact
    ? Math.max(8, Math.floor(labelFontSize * 0.72))
    : Math.max(10, Math.floor(labelFontSize * 0.55));
  const hasIcon = Boolean(options.iconKey);
  const objects: Phaser.GameObjects.GameObject[] = [surface];

  const contentY = options.y - options.height * 0.045;
  const gap = compact ? 6 : 12;
  const padding = Math.max(10, options.height * 0.27);
  const textMaxWidth = options.width - padding * 2 - (hasIcon ? iconSize + gap : 0);

  const label = scene.add.text(options.x, contentY, options.label, {
    fontFamily: 'monospace',
    fontSize: `${labelFontSize}px`,
    color: PRIMARY_BUTTON_TEXT_COLOR,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  fitPrimaryText(label, textMaxWidth, compact ? 9 : 14);
  objects.push(label);

  let subtitle: Phaser.GameObjects.Text | undefined;
  if (options.subtitle) {
    subtitle = scene.add.text(options.x, contentY, options.subtitle, {
      fontFamily: 'monospace',
      fontSize: `${subtitleFontSize}px`,
      color: PRIMARY_BUTTON_SUBTITLE_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    fitPrimaryText(subtitle, textMaxWidth, 9);
    objects.push(subtitle);
  }

  const copyWidth = Math.max(label.displayWidth, subtitle?.displayWidth ?? 0);
  const contentWidth = copyWidth + (hasIcon ? iconSize + gap : 0);
  const contentLeft = options.x - contentWidth / 2;
  const copyX = contentLeft + (hasIcon ? iconSize + gap : 0) + copyWidth / 2;
  label.setX(copyX);
  if (subtitle) {
    const lineGap = Math.max(2, options.height * 0.04);
    label.setY(contentY - (subtitle.displayHeight + lineGap) / 2);
    subtitle.setPosition(copyX, contentY + (label.displayHeight + lineGap) / 2);
  }

  let icon: Phaser.GameObjects.Image | undefined;
  if (options.iconKey) {
    icon = scene.add.image(contentLeft + iconSize / 2, contentY, options.iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setTint(PRIMARY_BUTTON_ICON_TINT);
    objects.push(icon);
  }

  const setState = (state: PrimaryButtonState): void => {
    // All states share the exact same artwork and UVs. Independently drawn
    // state textures move the rivets and bevel even when their bounds match.
    const activeState = enabled ? state : 'disabled';
    surface.clearTint();
    if (activeState === 'hover') {
      surface.setTint(0x100c04).setTintMode(Phaser.TintModes.ADD);
    } else if (activeState === 'pressed') {
      // Keep the face bright enough for the dark label and smaller subtitle.
      surface.setTint(0xf4f0e8);
    } else if (activeState === 'disabled') {
      surface.setTint(0x9b9688);
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
