import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const scene = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const viewModel = readFileSync(new URL('../src/settings/SettingsViewModel.ts', import.meta.url), 'utf8');
assert(viewModel.includes("'music' | 'sound' | 'language' | 'tutorial' | 'help'"), 'Settings keeps its five functional entries.');
assert(scene.includes('createSlateSurface(this, centerX, topY + height / 2, width, height)'), 'Settings panel uses matte slate.');
assert(scene.includes('createQuietInset(this,'), 'Control and navigation rows use the shared quiet inset.');
assert(scene.includes('createMetaPageHeader(this,'), 'Settings keeps the shared title and square Back control.');
assert(scene.includes('createToggle(') && scene.includes('launchTutorial()'), 'Switches and tutorial remain wired.');
assert(scene.includes('copy.settings.rules') && scene.includes('HELP_SCENE_KEY'), 'Rules entry remains wired.');
assert(scene.includes('settings.language') && scene.includes('activateRow(id, service)'), 'Language and audio settings remain editable.');
assert(!scene.includes('detectVibrationSupport'), 'No unrelated settings have been added.');
console.info('[Dungeon Logic] Settings visual and behavior sanity: PASS');
