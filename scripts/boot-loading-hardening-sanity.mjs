import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) {
    console.error(`[Dungeon Logic] Boot loading hardening sanity FAILED: ${message}`);
    process.exitCode = 1;
  }
}

const boot = readFileSync('src/scenes/BootScene.ts', 'utf8');
const backgrounds = readFileSync('src/runtime/SceneBackground.ts', 'utf8');

assert(
  boot.includes("this.load.on('loaderror'") || boot.includes('this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR'),
  'BootScene listens for Phaser file load failures before leaving Boot.',
);
assert(
  /failed.*asset/i.test(boot) && /scene\.start|routeLaunch/.test(boot),
  'BootScene tracks failed assets and gates normal launch routing.',
);
assert(
  boot.includes('window.location.reload()'),
  'Boot load-failure UI exposes a retry action that reloads the page.',
);
assert(
  /preloadSceneBackgrounds\(this\)/.test(boot),
  'BootScene keeps background preloading centralized.',
);
assert(
  /getSceneBackgroundAsset\(kind,\s*scene\.scale\.width,\s*scene\.scale\.height\)/s.test(backgrounds),
  'Initial background preload selects the asset for the current viewport.',
);
assert(
  !/for \(const family of Object\.values\(SCENE_BACKGROUND_ASSETS\)\)/.test(backgrounds),
  'Initial background preload no longer queues every orientation variant.',
);
assert(
  /prefetch|ensure.*Background|load.*alternate/i.test(backgrounds),
  'Scene background code can non-blockingly prepare the alternate orientation asset.',
);
assert(
  /textures\.exists|texture.*exists|hasSceneBackgroundTexture/i.test(backgrounds),
  'Scene background switching guards against using a texture before it is loaded.',
);

if (process.exitCode !== 1) {
  console.log('[Dungeon Logic] Boot loading hardening sanity: PASS');
}
