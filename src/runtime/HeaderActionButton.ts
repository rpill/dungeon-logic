import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import type { AvailableViewport } from './AvailableViewport';
import {
  drawMaterialButtonBackground,
  getMaterialButtonContentY,
  MATERIAL_BUTTON_STATE_TINTS,
} from './MaterialActionButton';
import { isTouchLikePointer } from './PointerInput';

export type HeaderActionVisualState = 'normal' | 'hover' | 'pressed';

export interface HeaderActionBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

const HEADER_ACTION_SQUARE_TEXTURE_KEYS = {
  primary: 'header-action-square-primary',
  secondary: 'header-action-square-secondary',
  danger: 'header-action-square-danger',
} as const;
const HEADER_ACTION_SQUARE_VISIBLE_FRAME = 'visible-square';
const HEADER_ACTION_SQUARE_VISIBLE_BOUNDS = { x: 2, y: 21, width: 252, height: 223 } as const;

export function preloadHeaderActionButtonAssets(scene: Phaser.Scene): void {
  scene.load.image(HEADER_ACTION_SQUARE_TEXTURE_KEYS.primary, 'assets/ui/primary_button_square_normal.webp');
  scene.load.image(HEADER_ACTION_SQUARE_TEXTURE_KEYS.secondary, 'assets/ui/secondary_button_square_normal.webp');
  scene.load.image(HEADER_ACTION_SQUARE_TEXTURE_KEYS.danger, 'assets/ui/danger_button_square_normal.webp');
}



function ensureHeaderActionSquareFrame(scene: Phaser.Scene): string {
  const texture = scene.textures.get(HEADER_ACTION_SQUARE_TEXTURE_KEYS.secondary);
  if (!texture.has(HEADER_ACTION_SQUARE_VISIBLE_FRAME)) {
    texture.add(
      HEADER_ACTION_SQUARE_VISIBLE_FRAME,
      0,
      HEADER_ACTION_SQUARE_VISIBLE_BOUNDS.x,
      HEADER_ACTION_SQUARE_VISIBLE_BOUNDS.y,
      HEADER_ACTION_SQUARE_VISIBLE_BOUNDS.width,
      HEADER_ACTION_SQUARE_VISIBLE_BOUNDS.height,
    );
  }
  return HEADER_ACTION_SQUARE_VISIBLE_FRAME;
}

export interface HeaderActionButtonMetrics {
  readonly pillWidth: number;
  readonly height: number;
  readonly iconButtonSize: number;
  readonly radius: number;
  readonly iconSize: number;
  readonly fontSize: number;
  readonly gap: number;
}

export function getHeaderActionButtonMetrics(narrow: boolean): HeaderActionButtonMetrics {
  return narrow
    ? { pillWidth: 132, height: 60, iconButtonSize: 60, radius: 13, iconSize: 28, fontSize: 15, gap: 8 }
    : { pillWidth: 160, height: 64, iconButtonSize: 64, radius: 15, iconSize: 32, fontSize: 17, gap: 10 };
}

export interface HeaderBackButtonPresentation {
  readonly width: number;
  readonly label?: string;
}

export function getHeaderBackButtonPresentation(
  _narrow: boolean,
  _label: string,
): HeaderBackButtonPresentation {
  const metrics = getHeaderActionButtonMetrics(_narrow);
  return {
    width: metrics.iconButtonSize,
    label: undefined,
  };
}

export interface HeaderActionPlacement {
  readonly x: number;
  readonly y: number;
  readonly inset: number;
}

export function getHeaderActionPlacement(
  viewport: Pick<AvailableViewport, 'x' | 'y' | 'right' | 'width'>,
  side: 'left' | 'right',
  width: number,
  height: number,
): HeaderActionPlacement {
  const inset = viewport.width < 700 ? 16 : 28;
  return {
    x: side === 'left'
      ? viewport.x + inset + width / 2
      : viewport.right - inset - width / 2,
    y: viewport.y + inset + height / 2,
    inset,
  };
}

export const HEADER_ACTION_COLORS = {
  foreground: 0xf4ead7,
} as const;

export function drawHeaderActionButtonBackground(
  graphics: Phaser.GameObjects.Graphics,
  bounds: HeaderActionBounds,
  state: HeaderActionVisualState,
): void {
  drawMaterialButtonBackground(graphics, bounds, 'secondary', state);
}

export interface HeaderActionButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly iconKey: string;
  readonly iconSize: number;
  readonly label?: string;
  readonly fontSize?: number;
  readonly gap?: number;
  readonly fixed?: boolean;
  readonly depth?: number;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface HeaderActionButtonHandle {
  readonly background: Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;
  readonly icon: Phaser.GameObjects.Image;
  readonly label?: Phaser.GameObjects.Text;
  readonly hit: Phaser.GameObjects.Zone;
}

export function createHeaderActionButton(
  scene: Phaser.Scene,
  options: HeaderActionButtonOptions,
): HeaderActionButtonHandle {
  const depth = options.depth ?? 1;
  const iconOnly = options.label === undefined || options.label.length === 0;
  const bounds: HeaderActionBounds = {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    radius: options.radius,
  };
  let state: HeaderActionVisualState = 'normal';

  const background = iconOnly
    ? scene.add.image(
      options.x,
      options.y,
      HEADER_ACTION_SQUARE_TEXTURE_KEYS.secondary,
      ensureHeaderActionSquareFrame(scene),
    )
      .setDisplaySize(options.width, options.height)
      .setDepth(depth)
    : scene.add.graphics().setDepth(depth);

  const redraw = (): void => {
    if (background instanceof Phaser.GameObjects.Graphics) {
      background.clear();
      drawHeaderActionButtonBackground(background, bounds, state);
      return;
    }

    background.clearTint();
    const stateTints = MATERIAL_BUTTON_STATE_TINTS.secondary;
    if (state === 'hover') {
      background.setTint(stateTints.hover).setTintMode(Phaser.TintModes.ADD);
    } else if (state === 'pressed') {
      background.setTint(stateTints.pressed);
    }
  };
  redraw();

  const contentY = getMaterialButtonContentY(options.y, options.height);
  const icon = scene.add.image(options.x, contentY, options.iconKey)
    .setDisplaySize(options.iconSize, options.iconSize)
    .setTint(HEADER_ACTION_COLORS.foreground)
    .setDepth(depth + 1);

  let label: Phaser.GameObjects.Text | undefined;
  if (!iconOnly) {
    label = scene.add.text(0, contentY, options.label!.replace(/^←\s*/, ''), {
      fontFamily: 'monospace',
      fontSize: `${options.fontSize ?? 14}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(depth + 1);

    const gap = options.gap ?? 8;
    const contentWidth = options.iconSize + gap + label.width;
    const startX = options.x - contentWidth / 2;
    icon.setPosition(startX + options.iconSize / 2, contentY);
    label.setPosition(startX + options.iconSize + gap, contentY);
  }

  const hit = scene.add.zone(options.x, options.y, options.width, options.height)
    .setDepth(depth + 2)
    .setInteractive({ useHandCursor: true });

  hit.on('pointerover', () => {
    state = 'hover';
    redraw();
  });
  hit.on('pointerout', () => {
    state = 'normal';
    redraw();
  });
  hit.on('pointerdown', () => {
    state = 'pressed';
    redraw();
  });
  hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    state = isTouchLikePointer(pointer) ? 'normal' : 'hover';
    redraw();
    getAudioFeedback(scene).play('ui-click');
    options.onActivate(pointer);
  });
  hit.on('pointerupoutside', () => {
    state = 'normal';
    redraw();
  });

  if (options.fixed === true) {
    background.setScrollFactor(0);
    icon.setScrollFactor(0);
    label?.setScrollFactor(0);
    hit.setScrollFactor(0);
  }

  return { background, icon, label, hit };
}
