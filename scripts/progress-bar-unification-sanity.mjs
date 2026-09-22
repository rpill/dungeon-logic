import fs from 'node:fs';
function read(path) { return fs.readFileSync(new URL(path, import.meta.url), 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }
const shared = read('../src/ui/UiProgressBar.ts');
const legacy = read('../src/runtime/MasteryProgressBar.ts');
const home = read('../src/scenes/HomeScene.ts');
const levels = read('../src/scenes/LevelSelectScene.ts');
const mastery = read('../src/scenes/MasteryScene.ts');
assert(shared.includes('UI_THEME.colors.semantic.gold') && shared.includes('UI_THEME.colors.semantic.success'), 'Shared bar must use the semantic gold-to-success gradient.');
assert(legacy.includes('createUiProgressBar as createMasteryProgressBar'), 'Legacy Mastery progress API must delegate to UiProgressBar.');
for (const [name, source] of [['Home', home], ['Levels', levels], ['Mastery', mastery]]) {
  assert(source.includes('createMasteryProgressBar') || source.includes('createUiProgressBar'), `${name} must use the shared UI progress bar.`);
}
assert(!home.includes('HOME_PROGRESS_TRACK_FILL') && !home.includes('HOME_PROGRESS_FILL'), 'Home must not keep its legacy flat progress colors.');
assert(!levels.includes('PROGRESS_AVAILABLE_FILL') && !levels.includes('PROGRESS_TRACK_FILL'), 'Levels must not keep its legacy progress-track colors.');
console.info('[Dungeon Logic] Progress-bar unification sanity: PASS');
