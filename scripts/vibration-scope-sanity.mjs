import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const feedback = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/settings/SettingsService.ts', import.meta.url), 'utf8');
const profileTypes = readFileSync(new URL('../src/profile/types.ts', import.meta.url), 'utf8');

assert(!feedback.includes('navigator.vibrate'), 'Audio feedback must not call navigator.vibrate.');
assert(!feedback.includes('vibration:'), 'Feedback definitions must not define vibration patterns.');
assert(!settings.includes('Vibration'), 'SettingsService must not expose vibration APIs.');
assert(!profileTypes.includes('vibrationEnabled'), 'Player settings must not persist vibration state.');

console.info('No-vibration scope sanity: PASS');
