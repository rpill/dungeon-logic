import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const settings = read('src/scenes/SettingsScene.ts');
const daily = read('src/scenes/DailyScene.ts');
const levels = read('src/scenes/LevelSelectScene.ts');
const header = read('src/runtime/MetaPageHeader.ts');

for (const [name, source] of [
  ['SettingsScene', settings],
  ['DailyScene', daily],
  ['LevelSelectScene', levels],
]) {
  assert(source.includes('calculateAvailableViewport'), `${name} must use the shared available viewport contract.`);
  assert(source.includes('readCssSafeAreaInsets'), `${name} must read safe-area insets through AvailableViewport.`);
  assert(!source.includes('STICKY_BOTTOM_INSET_REGISTRY_KEY'), `${name} must not opt in to sticky-banner space yet.`);
}

assert(settings.includes('availableViewport.centerX'), 'SettingsScene must center its content inside the available viewport.');
assert(daily.includes('availableViewport.centerX'), 'DailyScene must center its content inside the available viewport.');
assert(levels.includes('availableViewport.centerX'), 'LevelSelectScene must center its content inside the available viewport.');

assert(header.includes('readonly viewport?: AvailableViewport'), 'MetaPageHeader must accept an optional available viewport frame.');
assert(header.includes('const viewport = options.viewport ??'), 'MetaPageHeader must fall back to the full scene viewport when no frame is provided.');
assert(header.includes('viewport.centerX'), 'MetaPageHeader title must center inside the supplied viewport frame.');

console.log('Meta available viewport sanity — PASS');
