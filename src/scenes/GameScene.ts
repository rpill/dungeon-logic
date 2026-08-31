import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add
      .text(
        centerX,
        centerY - 30,
        'Dungeon Logic',
        {
          fontFamily: 'monospace',
          fontSize: '52px',
          color: '#f0e6d2',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY + 40,
        'Phaser 4 running',
        {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#8f9aa8',
        },
      )
      .setOrigin(0.5);
  }
}