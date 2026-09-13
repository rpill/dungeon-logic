import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const boot = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const board = readFileSync(new URL('../src/board/BoardView.ts', import.meta.url), 'utf8');
const cell = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');

assert(existsSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url)), 'AudioFeedbackService must exist.');
assert(existsSync(new URL('../src/audio/AudioAssets.ts', import.meta.url)), 'AudioAssets must exist.');
assert(boot.includes('preloadAudioFeedbackAssets(this)'), 'BootScene must preload feedback audio.');
assert(game.includes("'wall-place'"), 'GameScene must play wall placement feedback.');
assert(game.includes("'marker-toggle'"), 'GameScene must play shared marker toggle feedback.');
assert(game.includes("'wall-remove'"), 'GameScene must play wall removal feedback.');
assert(game.includes("feedback.play('undo')"), 'GameScene must play undo feedback.');
assert(game.includes("feedback.play('reset')"), 'GameScene must play reset feedback.');
assert(game.includes("feedback.play('hint')"), 'GameScene must play hint feedback.');
assert(game.includes("feedback.play('complete')"), 'GameScene must play completion feedback.');
assert(!board.includes('onFixedObjectActivated'), 'BoardView must not expose fixed-object audio activation.');
assert(!cell.includes("fixedSprite\n          .setInteractive"), 'Monster/chest sprites must not be made interactive for audio.');
assert(!game.includes("feedback.play(kind === 'monster' ? 'monster' : 'chest')"), 'Monster and chest clicks must stay silent.');

const audioService = existsSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url))
  ? readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8')
  : '';
assert(!audioService.includes('navigator.vibrate'), 'Feedback service must not use browser vibration.');
assert(audioService.includes('soundEnabled'), 'Feedback service must honor the sound setting.');
assert(!audioService.includes('vibrationEnabled'), 'Feedback service must not depend on a vibration setting.');

for (const file of [
  'ui-click.wav',
  'marker-toggle.wav',
  'wall-place.wav',
  'wall-remove.wav',
  'undo.wav',
  'reset.wav',
  'hint.wav',
  'error.wav',
  'complete.wav',
]) {
  assert(existsSync(new URL(`../public/assets/audio/${file}`, import.meta.url)), `Missing audio asset: ${file}`);
}

console.info('Audio feedback sanity: PASS');
