import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const backStart = source.indexOf('onActivate: (pointer) => {');
const backEnd = source.indexOf('    const titleY =', backStart);
assert(backStart >= 0 && backEnd > backStart, 'Settings Back handler must be present.');
const backHandler = source.slice(backStart, backEnd);

assert(
  /if \(this\.returnSceneKey === 'GameScene'\) \{[\s\S]*?this\.time\.delayedCall\(0, \(\) => \{[\s\S]*?this\.scene\.resume\('GameScene'\);[\s\S]*?this\.scene\.stop\(\);[\s\S]*?\}\);[\s\S]*?return;/.test(backHandler),
  'Settings must defer GameScene resume + Settings stop until after the current pointer event/scene transition.',
);

console.info('[Dungeon Logic] Settings -> Game return sanity: deferred resume/stop avoids synchronous scene-transition re-entry');
