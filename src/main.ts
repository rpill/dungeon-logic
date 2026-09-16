import Phaser from 'phaser';

import './style.css';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HomeScene } from './scenes/HomeScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { HelpScene } from './scenes/HelpScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { DailyScene } from './scenes/DailyScene';
import { SettingsScene } from './scenes/SettingsScene';
import { installHiDpiRendering } from './runtime/HiDpiRendering';
import { getInitialViewportSize } from './runtime/ResponsiveLayout';

const initialViewport = getInitialViewportSize(window.innerWidth, window.innerHeight);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  parent: 'app',
  disableContextMenu: true,

  width: initialViewport.width,
  height: initialViewport.height,

  backgroundColor: '#111318',

  pixelArt: false,
  antialias: true,
  antialiasGL: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene,
    HomeScene,
    LevelSelectScene,
    DailyScene,
    LeaderboardScene,
    GameScene,
    SettingsScene,
    HelpScene,
  ],
};

const game = new Phaser.Game(config);
installHiDpiRendering(game);