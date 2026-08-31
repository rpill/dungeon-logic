import Phaser from 'phaser';

import './style.css';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  parent: 'app',

  width: 1280,
  height: 720,

  backgroundColor: '#111318',

  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene,
    GameScene,
  ],
};

new Phaser.Game(config);