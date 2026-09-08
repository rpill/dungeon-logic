import Phaser from 'phaser';

import './style.css';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HomeScene } from './scenes/HomeScene';
import { ArchiveScene } from './scenes/ArchiveScene';
import { HelpScene } from './scenes/HelpScene';
import { getInitialViewportSize } from './runtime/ResponsiveLayout';

const initialViewport = getInitialViewportSize(window.innerWidth, window.innerHeight);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  parent: 'app',
  disableContextMenu: true,

  width: initialViewport.width,
  height: initialViewport.height,

  backgroundColor: '#111318',

  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene,
    HomeScene,
    ArchiveScene,
    GameScene,
    HelpScene,
  ],
};

new Phaser.Game(config);