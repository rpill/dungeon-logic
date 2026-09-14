import type Phaser from 'phaser';
import { BOARD_FRAME } from '../view/BoardFrameMetrics';

/** Decorative only: never registers input or contains baked-in clue numbers. */
export class BoardFrameView {
  private readonly parts: { image: Phaser.GameObjects.Image; x: number; y: number; w: number; h: number }[] = [];
  private readonly backing: Phaser.GameObjects.Rectangle;
  private readonly columns: number;
  private readonly rows: number;

  constructor(scene: Phaser.Scene, columns: number, rows: number) {
    this.columns = columns;
    this.rows = rows;
    this.backing = scene.add.rectangle(0, 0, 1, 1, 0x191e39);
    const add = (key: string, x: number, y: number, w: number, h: number): void => {
      this.parts.push({ image: scene.add.image(0, 0, `board-frame-${key}`), x, y, w, h });
    };
    const { left, top, right, bottom, clueCenter, clueSize } = BOARD_FRAME;
    // Repeat one section per cell. No stretching a complete frame across boards.
    for (let x = 0; x < columns; x += 1) {
      add('top', x + 0.5, -top + 0.13, 1.015, 0.26);
      add(x % 2 === 0 ? 'bottom-a' : 'bottom-b', x + 0.5, rows + bottom / 2, 1.015, bottom);
      add('clue', x + 0.5, -clueCenter, 1, clueSize);
    }
    for (let y = 0; y < rows; y += 1) {
      add('left', -left + 0.12, y + 0.5, 0.24, 1.015);
      add(y % 2 === 0 ? 'right-a' : 'right-b', columns + right / 2, y + 0.5, right, 1.015);
      add('clue', -clueCenter, y + 0.5, clueSize, 1);
    }
    add('corner-tl', -left / 2, -top / 2, left, top);
    add('corner-tr', columns + right / 2, -top / 2, right, top);
    add('corner-bl', -left / 2, rows + bottom / 2, left, bottom);
    add('corner-br', columns + right / 2, rows + bottom / 2, right, bottom);
  }

  relayout(originX: number, originY: number, cellSize: number): void {
    // A continuous dark mortar bed closes the gaps between rounded floor tiles.
    // Keep the backing inside the silhouette so corner cutouts stay transparent.
    this.backing.setPosition(
      originX + (this.columns - BOARD_FRAME.clueSize) * cellSize / 2,
      originY + (this.rows - BOARD_FRAME.clueSize) * cellSize / 2,
    ).setDisplaySize(
      (this.columns + BOARD_FRAME.clueSize) * cellSize,
      (this.rows + BOARD_FRAME.clueSize) * cellSize,
    );
    for (const part of this.parts) {
      part.image.setPosition(originX + part.x * cellSize, originY + part.y * cellSize)
        .setDisplaySize(part.w * cellSize, part.h * cellSize);
    }
  }
}
