import type Phaser from 'phaser';

export const AUDIO_KEYS = {
  musicLoveSerenade: 'music-love-serenade',
  uiClick: 'audio-ui-click',
  wallPlace: 'audio-wall-place',
  wallRemove: 'audio-wall-remove',
  markerToggle: 'audio-marker-toggle',
  undo: 'audio-undo',
  reset: 'audio-reset',
  hint: 'audio-hint',
  error: 'audio-error',
  complete: 'audio-complete',
} as const;

export function preloadAudioFeedbackAssets(scene: Phaser.Scene): void {
  scene.load.audio(AUDIO_KEYS.musicLoveSerenade, 'assets/music/love-serenade-loop.ogg');
  scene.load.audio(AUDIO_KEYS.uiClick, 'assets/audio/ui-click.wav');
  scene.load.audio(AUDIO_KEYS.wallPlace, 'assets/audio/wall-place.wav');
  scene.load.audio(AUDIO_KEYS.wallRemove, 'assets/audio/wall-remove.wav');
  scene.load.audio(AUDIO_KEYS.markerToggle, 'assets/audio/marker-toggle.wav');
  scene.load.audio(AUDIO_KEYS.undo, 'assets/audio/undo.wav');
  scene.load.audio(AUDIO_KEYS.reset, 'assets/audio/reset.wav');
  scene.load.audio(AUDIO_KEYS.hint, 'assets/audio/hint.wav');
  scene.load.audio(AUDIO_KEYS.error, 'assets/audio/error.wav');
  scene.load.audio(AUDIO_KEYS.complete, 'assets/audio/complete.wav');
}
