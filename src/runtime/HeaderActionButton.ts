import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import type { AvailableViewport } from './AvailableViewport';
import { drawMaterialButtonBackground, getMaterialButtonContentY } from './MaterialActionButton';
import { isTouchLikePointer } from './PointerInput';

export type HeaderActionVisualState = 'normal' | 'hover' | 'pressed';

export interface HeaderActionBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
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
    ? { pillWidth: 116, height: 42, iconButtonSize: 42, radius: 10, iconSize: 22, fontSize: 13, gap: 7 }
    : { pillWidth: 150, height: 48, iconButtonSize: 48, radius: 11, iconSize: 28, fontSize: 16, gap: 9 };
}

export interface HeaderBackButtonPresentation {
  readonly width: number;
  readonly label?: string;
}

export function getHeaderBackButtonPresentation(
  narrow: boolean,
  label: string,
): HeaderBackButtonPresentation {
  const metrics = getHeaderActionButtonMetrics(narrow);
  return {
    width: narrow ? metrics.iconButtonSize : metrics.pillWidth,
    label: narrow ? undefined : label,
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
  readonly background: Phaser.GameObjects.Graphics;
  readonly icon: Phaser.GameObjects.Image;
  readonly label?: Phaser.GameObjects.Text;
  readonly hit: Phaser.GameObjects.Zone;
}

export function createHeaderActionButton(
  scene: Phaser.Scene,
  options: HeaderActionButtonOptions,
): HeaderActionButtonHandle {
  const depth = options.depth ?? 1;
  const background = scene.add.graphics().setDepth(depth);
  const bounds: HeaderActionBounds = {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    radius: options.radius,
  };
  let state: HeaderActionVisualState = 'normal';
  const redraw = (): void => {
    background.clear();
    drawHeaderActionButtonBackground(background, bounds, state);
  };
  redraw();

  const contentY = getMaterialButtonContentY(options.y, options.height);
  const icon = scene.add.image(options.x, contentY, options.iconKey)
    .setDisplaySize(options.iconSize, options.iconSize)
    .setTint(HEADER_ACTION_COLORS.foreground)
    .setDepth(depth + 1);

  let label: Phaser.GameObjects.Text | undefined;
  if (options.label !== undefined && options.label.length > 0) {
    label = scene.add.text(0, contentY, options.label.replace(/^←\s*/, ''), {
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
    getAudioFeedback(scene).play('ui-hover');
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
