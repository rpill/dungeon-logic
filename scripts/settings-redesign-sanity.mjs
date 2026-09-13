import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const viewModel = readFileSync(new URL('../src/settings/SettingsViewModel.ts', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/settings/SettingsService.ts', import.meta.url), 'utf8');
const profileTypes = readFileSync(new URL('../src/profile/types.ts', import.meta.url), 'utf8');
const feedback = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(viewModel.includes("'music' | 'sound' | 'language' | 'tutorial' | 'help' | 'reset'"), 'Settings row model must contain Music, Sound, Language, Tutorial, Rules, Reset only.');
assert(!viewModel.includes("'vibration'"), 'Settings row model must not contain vibration.');
assert(scene.includes("SETTINGS_ICON_KEYS[id]"), 'Settings rows must use prepared UI icons.');
assert(scene.includes("'ui-icon-levels'"), 'Tutorial replay must use the existing book/levels icon.');
assert(scene.includes("copy.settings.rules"), 'Settings must label the rules entry as Rules.');
assert(scene.includes('createToggle('), 'Music and Sound must use switch-style controls.');
assert(scene.includes('launchTutorial'), 'Settings must be able to replay Tutorial.');
assert(!scene.includes('detectVibrationSupport'), 'SettingsScene must not detect vibration support.');
assert(!service.includes('Vibration'), 'SettingsService must not expose vibration APIs.');
assert(!profileTypes.includes('vibrationEnabled'), 'PlayerSettings must not persist vibration.');
assert(!feedback.includes('navigator.vibrate'), 'Audio feedback must not attempt vibration.');
assert(copy.includes("helpAndInfo: 'ПОМОЩЬ И ИНФОРМАЦИЯ'"), 'Russian Settings must include the Help & Information section title.');
assert(copy.includes("rules: 'ПРАВИЛА'"), 'Russian Settings must use Rules as the single rules/help action.');
assert(scene.includes('const contentWidth = Math.min(viewportWidth - (narrow ? 28 : 80), narrow ? 420 : 536);'), 'Desktop Settings must use the same 536px content width cap as the Home hub.');

console.info('[Dungeon Logic] Settings redesign sanity: PASS');
