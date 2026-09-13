import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';

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

export const HEADER_ACTION_COLORS = {
  normalFill: 0x1d2b4b,
  hoverFill: 0x2a3d66,
  pressedFill: 0x17243e,
  normalStroke: 0x657792,
  hoverStroke: 0xf0bd63,
  pressedStroke: 0xd59a46,
  foreground: 0xf4ead7,
} as const;

export function drawHeaderActionButtonBackground(
  graphics: Phaser.GameObjects.Graphics,
  bounds: HeaderActionBounds,
  state: HeaderActionVisualState,
): void {
  const fill = state === 'pressed'
    ? HEADER_ACTION_COLORS.pressedFill
    : state === 'hover'
      ? HEADER_ACTION_COLORS.hoverFill
      : HEADER_ACTION_COLORS.normalFill;
  const stroke = state === 'pressed'
    ? HEADER_ACTION_COLORS.pressedStroke
    : state === 'hover'
      ? HEADER_ACTION_COLORS.hoverStroke
      : HEADER_ACTION_COLORS.normalStroke;

  graphics.fillStyle(fill, 0.96);
  graphics.fillRoundedRect(
    bounds.x - bounds.width / 2,
    bounds.y - bounds.height / 2,
    bounds.width,
    bounds.height,
    bounds.radius,
  );
  graphics.lineStyle(2, stroke, 0.95);
  graphics.strokeRoundedRect(
    bounds.x - bounds.width / 2,
    bounds.y - bounds.height / 2,
    bounds.width,
    bounds.height,
    bounds.radius,
  );
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

  const icon = scene.add.image(options.x, options.y, options.iconKey)
    .setDisplaySize(options.iconSize, options.iconSize)
    .setTint(HEADER_ACTION_COLORS.foreground)
    .setDepth(depth + 1);

  let label: Phaser.GameObjects.Text | undefined;
  if (options.label !== undefined && options.label.length > 0) {
    label = scene.add.text(0, options.y, options.label.replace(/^←\s*/, ''), {
      fontFamily: 'monospace',
      fontSize: `${options.fontSize ?? 14}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(depth + 1);

    const gap = options.gap ?? 8;
    const contentWidth = options.iconSize + gap + label.width;
    const startX = options.x - contentWidth / 2;
    icon.setPosition(startX + options.iconSize / 2, options.y);
    label.setPosition(startX + options.iconSize + gap, options.y);
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
    state = 'hover';
    redraw();
    getAudioFeedback(scene).play('ui-click');
    options.onActivate(pointer);
  });

  if (options.fixed === true) {
    background.setScrollFactor(0);
    icon.setScrollFactor(0);
    label?.setScrollFactor(0);
    hit.setScrollFactor(0);
  }

  return { background, icon, label, hit };
}
