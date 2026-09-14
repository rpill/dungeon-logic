import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const settingsScene = fs.readFileSync('src/scenes/SettingsScene.ts', 'utf8');
const settingsService = fs.readFileSync('src/settings/SettingsService.ts', 'utf8');
const settingsViewModel = fs.readFileSync('src/settings/SettingsViewModel.ts', 'utf8');
const uiCopy = fs.readFileSync('src/i18n/UiCopy.ts', 'utf8');

assert(!settingsScene.includes('createResetButton'), 'SettingsScene must not render a global reset-progress button.');
assert(!settingsScene.includes('openResetDialog'), 'SettingsScene must not contain the global reset-progress dialog.');
assert(!settingsService.includes('resetProgress'), 'SettingsService must not expose global progress reset.');
assert(!settingsViewModel.includes("'reset'"), 'Settings rows must not include a reset row.');
assert(!uiCopy.includes('resetProgress:'), 'Settings localization must not contain reset-progress button copy.');
assert(!uiCopy.includes("resetTitle: 'СБРОСИТЬ ПРОГРЕСС?'"), 'Russian global reset dialog copy must be removed.');
assert(!uiCopy.includes("resetTitle: 'RESET PROGRESS?'"), 'English global reset dialog copy must be removed.');

console.info('[Dungeon Logic] Settings reset removal sanity: PASS');
