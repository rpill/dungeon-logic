import Phaser from 'phaser';

import './style.css';

import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HomeScene } from './scenes/HomeScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { HelpScene } from './scenes/HelpScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { MasterRatingLeaderboardScene } from './scenes/MasterRatingLeaderboardScene';
import { DailyScene } from './scenes/DailyScene';
import { SettingsScene } from './scenes/SettingsScene';
import { MasteryScene } from './scenes/MasteryScene';
import { installHiDpiRendering } from './runtime/HiDpiRendering';
import { getInitialViewportSize } from './runtime/ResponsiveLayout';
import {
  applyBrowserViewportCss,
  getBrowserViewportMetrics,
  installVisualViewportSync,
} from './runtime/VisualViewportBridge';

const browserViewport = getBrowserViewportMetrics(window);
const initialViewport = getInitialViewportSize(browserViewport.width, browserViewport.height);
applyBrowserViewportCss({ ...initialViewport, offsetLeft: browserViewport.offsetLeft, offsetTop: browserViewport.offsetTop });

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
    // VisualViewportBridge is the single owner of logical canvas resizing.
    // Phaser documents ScaleManager.resize() for NONE mode; combining manual
    // resize calls with RESIZE mode causes competing resize/centering passes on
    // mobile fullscreen transitions.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },

  scene: [
    BootScene,
    HomeScene,
    LevelSelectScene,
    DailyScene,
    LeaderboardScene,
    MasterRatingLeaderboardScene,
    GameScene,
    SettingsScene,
    MasteryScene,
    HelpScene,
  ],
};

function startGame(): void {
  const game = new Phaser.Game(config);
  installVisualViewportSync(game);
  installHiDpiRendering(game);
}

const fontSet = typeof document !== 'undefined' ? document.fonts : undefined;
if (fontSet) {
  void Promise.all([
    document.fonts.load('400 16px "Balsamiq Sans"'),
    document.fonts.load('700 20px "Balsamiq Sans"'),
  ]).then(startGame, startGame);
} else {
  startGame();
}