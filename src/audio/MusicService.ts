import type Phaser from 'phaser';

import { AUDIO_KEYS } from './AudioAssets';

const MUSIC_VOLUME = 0.10;

let backgroundMusic: Phaser.Sound.BaseSound | null = null;
let desiredEnabled = true;

function ensureBackgroundMusic(scene: Phaser.Scene): Phaser.Sound.BaseSound | null {
  if (backgroundMusic !== null) return backgroundMusic;
  if (!scene.cache.audio.exists(AUDIO_KEYS.musicLoveSerenade)) return null;

  backgroundMusic = scene.sound.add(AUDIO_KEYS.musicLoveSerenade, {
    loop: true,
    volume: MUSIC_VOLUME,
  });
  return backgroundMusic;
}

function applyDesiredState(): void {
  if (backgroundMusic === null) return;

  if (desiredEnabled) {
    if (!backgroundMusic.isPlaying) backgroundMusic.play();
    return;
  }

  if (backgroundMusic.isPlaying) backgroundMusic.stop();
}

export function initializeBackgroundMusic(scene: Phaser.Scene, enabled: boolean): void {
  desiredEnabled = enabled;
  ensureBackgroundMusic(scene);
  applyDesiredState();
}

export function setBackgroundMusicEnabled(enabled: boolean): void {
  desiredEnabled = enabled;
  applyDesiredState();
}
