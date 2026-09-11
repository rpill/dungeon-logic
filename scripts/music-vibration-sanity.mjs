import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const settings = readFileSync(new URL('../src/settings/SettingsService.ts', import.meta.url), 'utf8');
const feedback = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const boot = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const assets = readFileSync(new URL('../src/audio/AudioAssets.ts', import.meta.url), 'utf8');

assert(
  settings.includes('maxTouchPoints') && settings.includes('coarsePointer'),
  'Vibration capability must require touch points and a coarse primary pointer, not navigator.vibrate alone.',
);
assert(
  feedback.includes('detectVibrationSupport'),
  'Runtime haptics must use the same vibration capability predicate as Settings.',
);
assert(
  existsSync(new URL('../src/audio/MusicService.ts', import.meta.url)),
  'A persistent MusicService must own the background loop.',
);
assert(
  assets.includes("love-serenade-loop.ogg") && assets.includes('musicLoveSerenade'),
  'Audio preload must include the selected Love Serenade loop.',
);
assert(
  boot.includes('startBackgroundMusic') || boot.includes('initializeBackgroundMusic'),
  'BootScene must start the background loop after the player profile is available.',
);
assert(
  settings.includes('setBackgroundMusicEnabled'),
  'Changing the Music setting must immediately sync the persistent loop.',
);

console.info('Music + vibration sanity: PASS');
