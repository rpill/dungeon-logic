import { readFileSync } from 'node:fs';
function assert(condition, message) { if (!condition) throw new Error(message); }
const source = readFileSync(new URL('../src/scenes/SettingsScene.ts', import.meta.url), 'utf8');
const backStart = source.indexOf('onBack: (pointer) => {');
const backEnd = source.indexOf('    const controlsTop =', backStart);
assert(backStart >= 0 && backEnd > backStart, 'Settings Back handler must be present.');
const handler = source.slice(backStart, backEnd);
assert(handler.includes("this.returnSceneKey === 'GameScene'"), 'Settings recognizes gameplay return.');
assert(handler.includes('this.time.delayedCall(0, () => {'), 'Gameplay resume is deferred past the pointer event.');
assert(handler.includes("this.scene.resume('GameScene')") && handler.includes('this.scene.stop()'), 'Settings resumes the paused game and closes.');
console.info('[Dungeon Logic] Settings -> Game deferred return sanity: PASS');
