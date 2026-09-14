import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');

assert(
  home.includes("this.scene.start(SETTINGS_SCENE_KEY, { returnSceneKey: HOME_SCENE_KEY })"),
  'Home must pass an explicit HomeScene return target when opening Settings.',
);
assert(
  settings.includes("this.scene.isPaused('GameScene')"),
  'Settings must verify GameScene is actually paused before resuming it.',
);
assert(
  settings.includes("this.scene.start(HOME_SCENE_KEY)"),
  'Settings must retain a safe Home fallback when GameScene cannot be resumed.',
);

console.log('Settings return target sanity — PASS');
