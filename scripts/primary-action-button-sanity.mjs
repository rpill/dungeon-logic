import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(path), 'utf8');
const renderer = read('src/runtime/PrimaryActionButton.ts');
const boot = read('src/scenes/BootScene.ts');
const home = read('src/scenes/HomeScene.ts');
const daily = read('src/scenes/DailyScene.ts');
const levels = read('src/scenes/LevelSelectScene.ts');
const game = read('src/scenes/GameScene.ts');

if (!existsSync(resolve('public/assets/ui/action_gold_m1.png'))) {
  throw new Error('Shared gold button production skin is missing.');
}
if (!renderer.includes("scene.load.image(PRIMARY_BUTTON_KEY, 'assets/ui/action_gold_m1.png')")) {
  throw new Error('Primary button must load the approved gold skin.');
}
if (!renderer.includes('new Phaser.GameObjects.NineSlice') && !renderer.includes('scene.add.nineslice(')) {
  throw new Error('Primary button must use a scalable skin.');
}
if (!renderer.includes('setState = (state: PrimaryButtonState)') || !renderer.includes("setState('pressed')")) {
  throw new Error('Primary button interaction states must remain available.');
}
if (!boot.includes('preloadPrimaryActionButtonAssets(this)')) {
  throw new Error('BootScene must preload the shared gold button.');
}
for (const [name, source] of [['Home', home], ['Daily', daily], ['Levels', levels], ['Gameplay', game]]) {
  if (!source.includes('createPrimaryActionButton(')) {
    throw new Error(`${name} must use the shared gold CTA renderer.`);
  }
}

console.info('[Dungeon Logic] Primary action button sanity: PASS');
